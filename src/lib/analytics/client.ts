/**
 * Client-side analytics utilities
 * For browser-based tracking and fingerprinting
 * Only runs in browser environment
 */

// Generate or retrieve persistent visitor ID (survives across sessions)
export function getVisitorId(): string {
	const VISITOR_KEY = 'analytics_visitor_id';
	
	if (typeof window === 'undefined') return '';
	
	try {
		let visitorId = localStorage.getItem(VISITOR_KEY);
		
		if (!visitorId) {
			visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
			localStorage.setItem(VISITOR_KEY, visitorId);
		}
		
		return visitorId;
	} catch {
		return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
	}
}

// Cache fingerprint for performance
let cachedFingerprint: string | null = null;

// Generate browser fingerprint (for identifying users even without cookies)
export async function getBrowserFingerprint(): Promise<string> {
	if (typeof window === 'undefined') return '';
	if (cachedFingerprint) return cachedFingerprint;
	
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
	} catch {
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
	} catch {
		// WebGL not available
	}
	
	// Create hash from components
	cachedFingerprint = await hashString(components.join('|||'));
	return cachedFingerprint;
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
	} catch {
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
	
	if (ua.includes('Firefox')) return 'Firefox';
	if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
	if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
	if (ua.includes('Trident')) return 'Internet Explorer';
	if (ua.includes('Edg')) return 'Edge Chromium';
	if (ua.includes('Edge')) return 'Edge';
	if (ua.includes('Chrome')) return 'Chrome';
	if (ua.includes('Safari')) return 'Safari';
	
	return 'unknown';
}

// Get OS name
export function getOsName(): string {
	if (typeof window === 'undefined') return 'unknown';
	
	const ua = navigator.userAgent;
	
	if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
	if (/Android/.test(ua)) return 'Android';
	if (ua.includes('Win')) return 'Windows';
	if (ua.includes('Mac')) return 'MacOS';
	if (ua.includes('Linux')) return 'Linux';
	if (ua.includes('X11')) return 'UNIX';
	
	return 'unknown';
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
	} catch {
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
	const visitorId = getVisitorId();
	const sessionId = getSessionId();
	const utmParams = getUtmParams();
	const fingerprint = await getBrowserFingerprint();
	
	const visitData = {
		visitorId,
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
	const visitorId = getVisitorId();
	const sessionId = getSessionId();
	
	try {
		await fetch('/api/track-cta', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ visitorId, sessionId, buttonLocation }),
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
