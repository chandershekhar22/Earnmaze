import type { Handle, HandleServerError } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getDirection } from '$lib/i18n/direction';
import { validateSession } from '$lib/db';
import { validateGuestSession } from '$lib/db/repositories/guest-session.repository.server';
import { getDashboardUrl, canAccessRoute } from '$lib/utils/dashboard-routing';
import { getDashboardPreference } from '$lib/db/repositories/panelist-profile.repository.server';
import { checkGeoRestriction, logGeoRestrictionEvent } from '$lib/server/geo-restriction';
import { generateRayId, Logger } from '$lib/utils/app-logger';
import {
  csrfMiddleware,
  generateCsrfToken,
  setSecurityHeaders,
  setEmbeddedContentHeaders,
} from '$lib/server/security';
import { verifyToken } from '$lib/server/jwt';
import { notifyError } from '$lib/utils/telegram';
import { db } from '$lib/db';
import { initializeDatabase } from '$lib/db/init.server';
import { session as sessionTable, passwordReset } from '$lib/db/schema/auth';
import { lt } from 'drizzle-orm';

// Initialize database on startup (creates admin user if needed)
initializeDatabase().catch((error) => {
	console.error('Failed to initialize database on startup:', error);
});

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
    '/discover',
    '/welcome',
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
    '/contact',
    '/geo-blocked',
    '/earn-points',
    '/games',
    '/guest/dashboard',
    '/guest/upgrade',
    '/privacy-policy',
    '/terms-of-service',
    '/forgot-password',
    '/reset-password'
  ],
  // Routes that redirect logged-in users to their dashboard. Mirrors the
  // (public) route group so authenticated visitors never see marketing or
  // auth UI. Crawlers (no session) get the full SSR'd page including OG tags.
  loggedInRedirects: [
    '/',
    '/about',
    '/contact',
    '/earn-points',
    '/forgot-password',
    '/help',
    '/login',
    '/privacy-policy',
    '/register',
    '/reset-password',
    '/signup',
    '/terms-of-service'
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

// Locales we add a URL prefix for. Base locale `en` is intentionally
// unprefixed for clean URLs.
const NON_BASE_LOCALES = new Set(['es', 'fr', 'pt', 'ar']);

/**
 * Honor the user's locale cookie on unprefixed URLs.
 *
 * Paraglide's URL strategy treats unprefixed URLs as the base locale and does
 * not fall through to the cookie. So a user who switched to Spanish and lands
 * on `/about` (e.g. via browser Back) would see English. This handler catches
 * that case and 302s them to `/es/about` so the cookie's preferred language
 * wins. Crawlers (no cookie) are never redirected.
 */
const handleLocaleRedirect: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	// Skip API routes, internal SvelteKit asset paths, and admin/client/
	// moderator areas (those are English-only — applying a locale prefix
	// would break their routing).
	if (
		pathname.startsWith('/api/') ||
		pathname.startsWith('/_app/') ||
		pathname.startsWith('/admin') ||
		pathname.startsWith('/client') ||
		pathname.startsWith('/moderator')
	) {
		return resolve(event);
	}

	// SvelteKit's SPA navigation fetches `<route>/__data.json` for client-side
	// load data. We must redirect those too — otherwise clicking Browser Back
	// to an unprefixed URL fetches the data via SPA without ever loading our
	// HTML redirect, and the user sees the page in the wrong locale.
	const isDataFetch = pathname.endsWith('/__data.json');
	const logicalPath = isDataFetch
		? pathname.slice(0, -'/__data.json'.length) || '/'
		: pathname;

	// Other asset-like paths (extensions: .css, .js, .ico, .svg, etc).
	if (!isDataFetch && /\.[a-z0-9]+$/i.test(pathname)) {
		return resolve(event);
	}

	const cookieLocale = event.cookies.get('em_locale');
	if (!cookieLocale || !NON_BASE_LOCALES.has(cookieLocale)) {
		return resolve(event);
	}

	// Already on a non-base locale prefix — let Paraglide handle it.
	if (/^\/(es|fr|pt|ar)(\/|$)/.test(logicalPath)) {
		return resolve(event);
	}

	const localizedBase = `/${cookieLocale}${logicalPath === '/' ? '' : logicalPath}`;
	const target = isDataFetch ? `${localizedBase}/__data.json` : localizedBase;

	throw redirect(302, `${target}${event.url.search}`);
};

/**
 * Paraglide locale resolution middleware. Determines the active locale from
 * (in order) URL prefix → cookie → Accept-Language header → baseLocale.
 * Replaces `%paraglide.lang%` and `%paraglide.dir%` in app.html so the
 * served HTML has correct `lang` + `dir` attributes for SEO + accessibility.
 */
const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		const dir = getDirection(locale);
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', dir)
		});
	});

const handleApp: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  let ipAddress: string;
  try {
    ipAddress = event.getClientAddress();
  } catch {
    ipAddress = '0.0.0.0';
  }
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
          // Validate userType against the enum — never trust the JWT payload
          // unconditionally. A signature flaw upstream or a forged token must
          // not be able to claim 'admin' or any privileged role.
          const ALLOWED_USER_TYPES = ['admin', 'client', 'moderator', 'panelist'] as const;
          type AllowedUserType = (typeof ALLOWED_USER_TYPES)[number];
          const claimedType = payload.userType;
          if (
            typeof claimedType === 'string' &&
            (ALLOWED_USER_TYPES as readonly string[]).includes(claimedType)
          ) {
            event.locals.user = {
              id: payload.sub,
              email: '',
              userType: claimedType as AllowedUserType,
              name: null,
              isActive: true,
              emailVerified: true,
            } as any;
          } else {
            Logger.root.warn(
              { context: 'auth', claimedType, sub: payload.sub },
              'JWT had invalid or missing userType — rejecting'
            );
          }
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

  // Redirect logged-in users away from the (public) route group so they
  // never see marketing/auth UI. SSR for crawlers still works because they
  // don't carry a session cookie.
  if (event.locals.user && ROUTE_CONFIG.loggedInRedirects.includes(pathname)) {
    throw redirect(302, getDashboardUrl(event.locals.user.userType));
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

    // Panelists: route through the dashboard chooser on first visit, then
    // honour their saved preference (surveys stays here, discover redirects).
    const pref = await getDashboardPreference(event.locals.user.id);
    if (!pref.dashboardOnboarded) {
      throw redirect(302, '/welcome');
    }
    if (pref.dashboardView === 'discover') {
      throw redirect(302, '/discover');
    }
    // Surveys view stays on /dashboard
  }

  // Resolve the request and add security headers
  const response = await resolve(event);
  // Embedded section/game HTML (served from the /*-content endpoints and
  // rendered in a sandboxed iframe) needs a relaxed CSP so it can load
  // libraries from CDNs; everything else gets the strict app policy.
  if (
    pathname.startsWith('/section-content/') ||
    pathname.startsWith('/game-content/')
  ) {
    setEmbeddedContentHeaders(response.headers);
  } else {
    setSecurityHeaders(response.headers);
  }
  withCorrelation(response);
  return response;
};

// Compose: first apply cookie-based locale redirect for unprefixed URLs,
// then resolve the locale via Paraglide, then run the app logic.
export const handle: Handle = sequence(handleLocaleRedirect, handleParaglide, handleApp);

// Unhandled-error hook — logs via Loki AND fires a Telegram alert (best-effort).
export const handleError: HandleServerError = ({ error, event, status }) => {
  const correlationId = (event.locals as { correlationId?: string })?.correlationId;
  const logPayload = {
    context: 'errors',
    pathname: event.url.pathname,
    status,
    correlationId,
    error,
  };
  // 4xx are client/user errors (missing assets, bad URLs, bots) — log at warn so
  // they don't drown out real failures in the error dashboards. 5xx (and unknown
  // status) stay at error level.
  if (status !== undefined && status >= 400 && status < 500) {
    Logger.root.warn(logPayload, 'Client request error');
  } else {
    Logger.root.error(logPayload, 'Unhandled server error');
  }

  // Skip alerts for 4xx (user errors). Only fire for genuine server failures.
  if (status === undefined || status >= 500) {
    try {
      notifyError(`${event.request.method} ${event.url.pathname}`, error, {
        status: String(status ?? 500),
        correlationId: correlationId ?? 'n/a',
      }).catch(() => {
        // Alert dispatch is best-effort; swallow any failure
      });
    } catch {
      // Sync throw from sendTask (e.g., null celery client) — swallow
    }
  }

  return {
    message: 'Internal server error',
    correlationId,
  };
};
