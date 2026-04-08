import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/db';
import { validateGuestSession } from '$lib/db/repositories/guest-session.repository.server';
import { getDashboardUrl, canAccessRoute } from '$lib/utils/dashboard-routing';
import { checkGeoRestriction, logGeoRestrictionEvent } from '$lib/server/geo-restriction';
import { generateRayId, Logger } from '$lib/utils/app-logger';
import { csrfMiddleware, generateCsrfToken } from '$lib/server/security';
import { verifyToken } from '$lib/server/jwt';
import { db } from '$lib/db';
import { session as sessionTable, passwordReset } from '$lib/db/schema/auth';
import { lt } from 'drizzle-orm';

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
    '/geo-blocked',
    '/earn-money',
    '/guest/dashboard',
    '/guest/upgrade',
    '/privacy-policy',
    '/terms-of-service',
    '/forgot-password',
    '/reset-password'
  ],
  rateLimitExempt: [
    '/api/analytics',
    '/api/track-visit',
    '/api/track-cta',
    '/api/guest/*',
    '/api/save-email'
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
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data:; " + // Removed https: wildcard
    "font-src 'self' data: https://fonts.gstatic.com; " +
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

// Cleanup expired sessions and password reset tokens periodically
setInterval(async () => {
  try {
    const now = new Date();
    const [sessionsResult, tokensResult] = await Promise.all([
      db.delete(sessionTable).where(lt(sessionTable.expiresAt, now)),
      db.delete(passwordReset).where(lt(passwordReset.expiresAt, now)),
    ]);
    const sessionsDeleted = sessionsResult.rowCount ?? 0;
    const tokensDeleted = tokensResult.rowCount ?? 0;
    if (sessionsDeleted > 0 || tokensDeleted > 0) {
      Logger.root.info(
        { context: 'database', sessionsDeleted, tokensDeleted },
        'Cleaned up expired sessions and reset tokens'
      );
    }
  } catch (error) {
    Logger.root.error({ context: 'errors', error }, 'Failed to clean up expired sessions/tokens');
  }
}, 60 * 60 * 1000); // Clean up every hour

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  const ipAddress = event.getClientAddress();
  const correlationId = generateRayId();
  event.locals.correlationId = correlationId;

  const withCorrelation = (response: Response) => {
    response.headers.set('x-request-id', correlationId);
    response.headers.set('x-correlation-id', correlationId);
    return response;
  };

  // ========== RATE LIMITING ==========
  // Skip rate limiting for exempt paths
  // if (!matchesAnyPath(pathname, ROUTE_CONFIG.rateLimitExempt)) {
  //   const rateLimitKey = `${ipAddress}:${pathname}`;
  //   if (!checkRateLimit(rateLimitKey, 100, 60000)) {
  //     return withCorrelation(new Response(
  //       JSON.stringify({
  //         success: false,
  //         error: 'RATE_LIMIT_EXCEEDED',
  //         message: 'Too many requests. Please try again later.'
  //       }),
  //       {
  //         status: 429,
  //         headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
  //       }
  //     ));
  //   }
  // }

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
      return withCorrelation(new Response(
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
      ));
    } else {
      // For page requests, redirect to a blocked page or show error
      throw redirect(302, `/geo-blocked?reason=${encodeURIComponent(geoCheck.reason || 'region_restricted')}`);
    }
  }
  
  // ========== SESSION RESOLUTION ==========
  // We support two session types:
  //   1. Regular session ("session" cookie) → populates locals.user
  //   2. Guest session ("guest_session" cookie) → populates locals.guestSession
  // Both are resolved here so route handlers never need to validate cookies manually.

  // --- Regular user session ---
  const sessionId = event.cookies.get('session');

  if (sessionId) {
    try {
      const user = await validateSession(sessionId);
      
      if (user) {
        event.locals.user = user;
      } else {
        event.cookies.delete('session', { path: '/' });
      }
    } catch (error) {
      Logger.root.error(
        { context: 'auth', error },
        'Session verification failed'
      );
      event.cookies.delete('session', { path: '/' });
    }
  }

  // --- JWT Bearer token (mobile app) ---
  if (!event.locals.user) {
    const authHeader = event.request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await verifyToken(authHeader.slice(7));
        if (payload && payload.type === 'access') {
          // Set locals.user with JWT payload so existing guards work
          event.locals.user = {
            id: payload.sub,
            email: '',
            userType: payload.userType as any,
            name: null,
            isActive: true,
            emailVerified: true,
          } as any;
        }
      } catch {
        // Invalid JWT — ignore, fall through to guest/no-auth
      }
    }
  }

  // --- Guest session (only if no regular user session) ---
  if (!event.locals.user) {
    const guestToken = event.cookies.get('guest_session');

    if (guestToken) {
      try {
        const guestSessionData = await validateGuestSession(guestToken);
        
        if (guestSessionData) {
          event.locals.guestSession = guestSessionData;
        } else {
          // Expired or invalid — clean up the cookie
          event.cookies.delete('guest_session', { path: '/' });
        }
      } catch (error) {
        Logger.root.error(
          { context: 'auth', error },
          'Guest session verification failed'
        );
        event.cookies.delete('guest_session', { path: '/' });
      }
    }
  }

  // ========== CSRF PROTECTION ==========
  // Skip CSRF entirely in development to avoid friction during local testing
  if (process.env.NODE_ENV === 'production') {
    // Ensure CSRF cookie is set on every response so the token is available for API calls
    if (!event.cookies.get('csrf_token')) {
      event.cookies.set('csrf_token', generateCsrfToken(), {
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24
      });
    }
    // Verify token on state-changing API requests.
    // Currently in audit mode — logs violations but does not block, so existing
    // frontend code keeps working while components migrate to fetchApi().
    const csrfExempt = ['/api/logs', '/api/analytics', '/api/track-visit', '/api/track-cta'];
    if (pathname.startsWith('/api/') && !csrfExempt.some(p => pathname.startsWith(p))) {
      const csrfResponse = await csrfMiddleware(event);
      if (csrfResponse) {
        // Audit mode: log but don't block. Remove this condition to enforce.
        Logger.root.warn(
          { context: 'security', method: event.request.method, path: pathname },
          'CSRF token missing or invalid (audit mode — not blocking)'
        );
      }
    }
  }

  // Check if this is a protected API route
  const isProtectedApiRoute = matchesAnyPath(pathname, ROUTE_CONFIG.protectedApi);

  if (isProtectedApiRoute) {
    if (!event.locals.user) {
      return withCorrelation(new Response(
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
      ));
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
  withCorrelation(response);
  return response;
};
