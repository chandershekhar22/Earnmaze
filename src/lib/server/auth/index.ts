/**
 * Authentication module
 * Barrel export for session management and authorization guards
 */

// Session management
export {
	getAuthUser,
	isAdmin,
	hasRole,
	getSessionToken,
	setSessionCookie,
	clearSessionCookie,
	type AuthUser,
	type UserType
} from './session';

// Authorization guards
export {
	requireAuth,
	requireAdmin,
	requirePanelist,
	requireClient,
	requireUserType,
	requireAnyAuth,
	optionalAuth,
	updateLastLogin
} from './guards';
