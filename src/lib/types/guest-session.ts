/**
 * Guest Session Type Definitions
 * 
 * Types for guest session management - temporary access without full registration
 */

// ============================================================================
// Guest Session Data Types
// ============================================================================

/**
 * Data required to create a guest session
 * Used by repository layer
 */
export interface GuestSessionData {
	email: string;
	ipAddress?: string;
	userAgent?: string;
	fingerprint?: string;
}

/**
 * Guest session information
 * Internal representation with all fields
 */
export interface GuestSessionInfo {
	id: string;
	email: string;
	token: string;
	status: 'active' | 'expired' | 'upgraded';
	sessionPoints: number;
	surveysViewed: number;
	surveysCompleted: number;
	expiresAt: Date;
	createdAt: Date;
}

/**
 * Safe guest session info for API responses
 * SECURITY: Never expose token in API responses
 */
export interface SafeGuestSessionInfo {
	id: string;
	email: string;
	status: 'active' | 'expired' | 'upgraded';
	sessionPoints: number;
	surveysViewed: number;
	surveysCompleted: number;
	expiresAt: string; // ISO string for JSON serialization
	createdAt: string; // ISO string for JSON serialization
}

// ============================================================================
// Guest API Request Types
// ============================================================================

/**
 * Guest login request
 * POST /api/guest/login
 */
export interface GuestLoginRequest {
	email: string;
	fingerprint?: string;
}

/**
 * Upgrade account request
 * POST /api/guest/upgrade
 */
export interface UpgradeAccountRequest {
	name: string;
	password: string;
	turnstileToken: string;
}

// ============================================================================
// Guest API Response Types
// ============================================================================

/**
 * Guest login response
 * SECURITY: Never return token in response body - use httpOnly cookie
 */
export interface GuestLoginResponse {
	success: boolean;
	sessionId?: string;
	email?: string;
	expiresAt?: string;
	error?: string;
	message?: string;
}

/**
 * Upgrade account response
 * SECURITY: Only return safe user fields
 */
export interface UpgradeAccountResponse {
	success: boolean;
	user?: {
		id: string;
		email: string;
		name: string;
		userType: string;
	};
	error?: string;
	message?: string;
}

/**
 * Guest logout response
 */
export interface GuestLogoutResponse {
	success: boolean;
	message?: string;
}

/**
 * Guest dashboard response
 * Shows session-specific data only
 */
export interface GuestDashboardResponse {
	success: boolean;
	data?: {
		email: string;
		sessionPoints: number;
		surveysViewed: number;
		surveysCompleted: number;
		expiresAt: string;
		availableSurveys: Array<{
			id: string;
			title: string;
			description: string | null;
			points: number;
			link: string;
		}>;
	};
	error?: string;
	message?: string;
}
