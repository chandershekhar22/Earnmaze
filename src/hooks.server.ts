import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/db';
import { getDashboardUrl, canAccessRoute } from '$lib/utils/dashboard-routing';
import { checkGeoRestriction, logGeoRestrictionEvent } from '$lib/server/geo-restriction';

// Simple rate limiting store (in-memory)
// For production, use Redis or a proper rate limiting service
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Route configuration
const ROUTE_CONFIG = {
  protectedApi: [
    '/api/panelist',
    '/api/surveys',
    '/api/points',
    '/api/profile',
    '/api/rewards'
  ],
  protectedPages: [
    '/dashboard',
    '/profile',
    '/surveys',
    '/admin',
    '/client',
    '/moderator',
    '/points',
    '/history',
    '/rewards'
  ],
  publicPaths: [
    '/',
    '/login',
    '/register',
    '/about',
    '/geo-blocked'
  ],
  rateLimitExempt: [
    '/api/analytics',
    '/api/track-visit',
    '/api/track-cta'
  ]
};

// Rate limiting function
function checkRateLimit(identifier: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Security headers
function setSecurityHeaders(headers: Headers) {
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Note: 'unsafe-inline' is required for Svelte's style injection
  // Consider using nonces in production for better security
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " + // Removed https: wildcard
    "font-src 'self' data:; " +
    "connect-src 'self' https://challenges.cloudflare.com; " +
    "frame-src https://challenges.cloudflare.com; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "object-src 'none'; " + // Block plugins
    "upgrade-insecure-requests;" // Force HTTPS
  );
  // HSTS header (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

// Helper to check if path matches any pattern
function matchesAnyPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      return pathname.startsWith(pattern.slice(0, -2));
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  const ipAddress = event.getClientAddress();

  // ========== RATE LIMITING ==========
  // Skip rate limiting for exempt paths
  if (!matchesAnyPath(pathname, ROUTE_CONFIG.rateLimitExempt)) {
    const rateLimitKey = `${ipAddress}:${pathname}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.'
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
        }
      );
    }
  }

  // ========== GEO-RESTRICTION CHECK ==========
  const geoCheck = await checkGeoRestriction(event);
  
  if (!geoCheck.allowed) {
    // Log the restriction event
    await logGeoRestrictionEvent(
      ipAddress,
      geoCheck.location,
      false,
      geoCheck.reason,
      pathname
    );
    
    // Return appropriate response based on request type
    const isApiRequest = pathname.startsWith('/api/');
    
    if (isApiRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'REGION_RESTRICTED',
          message: geoCheck.reason || 'Access denied from your location',
          data: {
            country: geoCheck.location?.countryCode,
            reason: geoCheck.reason
          }
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      // For page requests, redirect to a blocked page or show error
      throw redirect(302, `/geo-blocked?reason=${encodeURIComponent(geoCheck.reason || 'region_restricted')}`);
    }
  }
  
  // Get session from cookies
  const sessionId = event.cookies.get('session');

  // Verify session if token exists
  if (sessionId) {
    try {
      const user = await validateSession(sessionId);
      
      if (user) {
        event.locals.user = user;
        // Note: validateSession already checks expiry against database
        // Session will be null if expired
      } else {
        // Clear invalid or expired session cookie
        event.cookies.delete('session', { path: '/' });
      }
    } catch (error) {
      // Log error without exposing details
      console.error('Session verification failed');
      // Clear invalid session cookie
      event.cookies.delete('session', { path: '/' });
    }
  }

  // Check if this is a protected API route
  const isProtectedApiRoute = matchesAnyPath(pathname, ROUTE_CONFIG.protectedApi);

  if (isProtectedApiRoute) {
    if (!event.locals.user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  // Check if this is a protected page route
  const isProtectedPageRoute = matchesAnyPath(pathname, ROUTE_CONFIG.protectedPages);

  if (isProtectedPageRoute) {
    // Require authentication
    if (!event.locals.user) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      throw redirect(302, loginUrl);
    }

    // Check if user has access to this specific route
    if (!canAccessRoute(event.locals.user.userType, pathname)) {
      // Redirect to their appropriate dashboard
      const userDashboard = getDashboardUrl(event.locals.user.userType);
      throw redirect(302, userDashboard);
    }
  }

  // Redirect users to their appropriate dashboard when accessing /dashboard directly
  if (pathname === '/dashboard' && event.locals.user) {
    const userType = event.locals.user.userType;
    
    // Non-panelist users should go to their own dashboards
    if (userType === 'admin') {
      throw redirect(302, '/admin/dashboard');
    } else if (userType === 'client') {
      throw redirect(302, '/client/dashboard');
    } else if (userType === 'moderator') {
      throw redirect(302, '/moderator/dashboard');
    }
    // Panelists stay on /dashboard
  }

  // Resolve the request and add security headers
  const response = await resolve(event);
  setSecurityHeaders(response.headers);
  
  return response;
};
