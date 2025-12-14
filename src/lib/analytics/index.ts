/**
 * Analytics module
 * Centralized exports for client and server-side analytics
 */

// Client-side tracking (browser only) - safe for all imports
export {
	getVisitorId,
	getBrowserFingerprint,
	getSessionId,
	getUtmParams,
	getReferrer,
	getDeviceType,
	getBrowserName,
	getOsName,
	getScreenResolution,
	getTimezone,
	getLanguage,
	trackPageVisit,
	trackCtaClick,
	markVisitStart,
	getTimeToConvert
} from './client';

// Server-side analytics (server only)
// Note: Import directly from './server' in server-side code only
// DO NOT re-export server functions here to prevent client bundle inclusion
