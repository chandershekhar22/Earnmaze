/**
 * Analytics utilities for tracking conversions and traffic sources
 */

// Generate or retrieve persistent user ID (survives across sessions)
export function getUserId(): string {
	const USER_KEY = 'analytics_user_id';
	
	if (typeof window === 'undefined') return '';
	
	try {
		// Try localStorage first (persists across sessions)
		let userId = localStorage.getItem(USER_KEY);
		
		if (!userId) {
			// Generate new user ID
			userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
			localStorage.setItem(USER_KEY, userId);
		}
		
		return userId;
	} catch (e) {
		// Fallback if localStorage is unavailable
		return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
	}
}

// Generate browser fingerprint (for identifying users even without cookies)
export async function getBrowserFingerprint(): Promise<string> {
	if (typeof window === 'undefined') return '';
	
	const components: string[] = [];
	
	// Screen resolution
	components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
	
	// Timezone
	components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
	
	// Language
	components.push(navigator.language);
	
	// Platform
	components.push(navigator.platform);
	
	// Hardware concurrency (CPU cores)
	components.push(String(navigator.hardwareConcurrency || 0));
	
	// Device memory (if available)
	components.push(String((navigator as any).deviceMemory || 0));
	
	// User agent
	components.push(navigator.userAgent);
	
	// Canvas fingerprint (more sophisticated)
	try {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (ctx) {
			canvas.width = 200;
			canvas.height = 50;
			ctx.textBaseline = 'top';
			ctx.font = '14px Arial';
			ctx.fillStyle = '#f60';
			ctx.fillRect(125, 1, 62, 20);
			ctx.fillStyle = '#069';
			ctx.fillText('fingerprint', 2, 15);
			components.push(canvas.toDataURL());
		}
	} catch (e) {
		// Canvas fingerprinting blocked
	}
	
	// WebGL fingerprint
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
		if (gl) {
			const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (debugInfo) {
				components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
				components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
			}
		}
	} catch (e) {
		// WebGL not available
	}
	
	// Create hash from components
	const fingerprint = await hashString(components.join('|||'));
	return fingerprint;
}

// Simple hash function for fingerprinting
async function hashString(str: string): Promise<string> {
	if (typeof crypto !== 'undefined' && crypto.subtle) {
		const encoder = new TextEncoder();
		const data = encoder.encode(str);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex.substring(0, 32); // First 32 chars
	} else {
		// Fallback simple hash
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(36);
	}
}

// Generate or retrieve session ID
export function getSessionId(): string {
	const SESSION_KEY = 'analytics_session_id';
	const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
	
	if (typeof window === 'undefined') return '';
	
	try {
		const stored = sessionStorage.getItem(SESSION_KEY);
		const timestamp = sessionStorage.getItem(`${SESSION_KEY}_timestamp`);
		
		if (stored && timestamp) {
			const age = Date.now() - parseInt(timestamp);
			if (age < SESSION_DURATION) {
				return stored;
			}
		}
		
		// Generate new session ID
		const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
		sessionStorage.setItem(SESSION_KEY, sessionId);
		sessionStorage.setItem(`${SESSION_KEY}_timestamp`, Date.now().toString());
		
		return sessionId;
	} catch (e) {
		// Fallback if sessionStorage is unavailable
		return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
	}
}

// Extract UTM parameters from URL
export function getUtmParams(): Record<string, string | null> {
	if (typeof window === 'undefined') return {};
	
	const params = new URLSearchParams(window.location.search);
	
	return {
		utm_source: params.get('utm_source'),
		utm_medium: params.get('utm_medium'),
		utm_campaign: params.get('utm_campaign'),
		utm_term: params.get('utm_term'),
		utm_content: params.get('utm_content'),
	};
}

// Get referrer information
export function getReferrer(): string | null {
	if (typeof window === 'undefined') return null;
	return document.referrer || null;
}

// Detect device type
export function getDeviceType(): string {
	if (typeof window === 'undefined') return 'unknown';
	
	const ua = navigator.userAgent;
	
	if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
		return 'tablet';
	}
	if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
		return 'mobile';
	}
	return 'desktop';
}

// Get browser name
export function getBrowserName(): string {
	if (typeof window === 'undefined') return 'unknown';
	
	const ua = navigator.userAgent;
	let browserName = 'unknown';
	
	if (ua.indexOf('Firefox') > -1) {
		browserName = 'Firefox';
	} else if (ua.indexOf('SamsungBrowser') > -1) {
		browserName = 'Samsung Internet';
	} else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
		browserName = 'Opera';
	} else if (ua.indexOf('Trident') > -1) {
		browserName = 'Internet Explorer';
	} else if (ua.indexOf('Edge') > -1) {
		browserName = 'Edge';
	} else if (ua.indexOf('Edg') > -1) {
		browserName = 'Edge Chromium';
	} else if (ua.indexOf('Chrome') > -1) {
		browserName = 'Chrome';
	} else if (ua.indexOf('Safari') > -1) {
		browserName = 'Safari';
	}
	
	return browserName;
}

// Get OS name
export function getOsName(): string {
	if (typeof window === 'undefined') return 'unknown';
	
	const ua = navigator.userAgent;
	let osName = 'unknown';
	
	if (ua.indexOf('Win') > -1) {
		osName = 'Windows';
	} else if (ua.indexOf('Mac') > -1) {
		osName = 'MacOS';
	} else if (ua.indexOf('X11') > -1) {
		osName = 'UNIX';
	} else if (ua.indexOf('Linux') > -1) {
		osName = 'Linux';
	} else if (/Android/.test(ua)) {
		osName = 'Android';
	} else if (/iPhone|iPad|iPod/.test(ua)) {
		osName = 'iOS';
	}
	
	return osName;
}

// Get screen resolution
export function getScreenResolution(): string {
	if (typeof window === 'undefined') return 'unknown';
	return `${screen.width}x${screen.height}`;
}

// Get timezone
export function getTimezone(): string {
	if (typeof Intl === 'undefined') return 'unknown';
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch (e) {
		return 'unknown';
	}
}

// Get language
export function getLanguage(): string {
	if (typeof navigator === 'undefined') return 'unknown';
	return navigator.language || 'unknown';
}

// Track page visit
export async function trackPageVisit() {
	const userId = getUserId();
	const sessionId = getSessionId();
	const utmParams = getUtmParams();
	const fingerprint = await getBrowserFingerprint();
	
	const visitData = {
		userId,
		sessionId,
		fingerprint,
		...utmParams,
		referrer: getReferrer(),
		landingPage: typeof window !== 'undefined' ? window.location.pathname : '',
		userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
		deviceType: getDeviceType(),
		browserName: getBrowserName(),
		osName: getOsName(),
		screenResolution: getScreenResolution(),
		timezone: getTimezone(),
		language: getLanguage(),
	};
	
	try {
		await fetch('/api/track-visit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(visitData),
		});
	} catch (error) {
		console.error('Failed to track visit:', error);
	}
}

// Track CTA click
export async function trackCtaClick(buttonLocation: string) {
	const userId = getUserId();
	const sessionId = getSessionId();
	
	try {
		await fetch('/api/track-cta', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, sessionId, buttonLocation }),
		});
	} catch (error) {
		console.error('Failed to track CTA click:', error);
	}
}

// Store visit start time for time-to-convert calculation
export function markVisitStart() {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.setItem('visit_start_time', Date.now().toString());
}

// Calculate time to convert
export function getTimeToConvert(): number | null {
	if (typeof sessionStorage === 'undefined') return null;
	
	const startTime = sessionStorage.getItem('visit_start_time');
	if (!startTime) return null;
	
	return Math.floor((Date.now() - parseInt(startTime)) / 1000);
}
