/**
 * Utility functions for dynamic dashboard routing based on user type
 */

export type UserType = 'admin' | 'panelist' | 'client' | 'moderator';

/**
 * Get the appropriate dashboard URL based on user type
 */
export function getDashboardUrl(userType: string): string {
	switch (userType) {
		case 'admin':
			return '/admin/dashboard';
		case 'panelist':
			return '/dashboard';
		case 'client':
			return '/client/dashboard';
		case 'moderator':
			return '/moderator/dashboard';
		default:
			return '/dashboard';
	}
}

/**
 * Check if user has access to a specific route based on their type
 */
export function canAccessRoute(userType: string, pathname: string): boolean {
	// Admin can access all routes
	if (userType === 'admin') {
		return true;
	}

	// Check route-specific access
	if (pathname.startsWith('/admin')) {
		return userType === 'admin';
	}

	if (pathname.startsWith('/client')) {
		return userType === 'client' || userType === 'admin';
	}

	if (pathname.startsWith('/moderator')) {
		return userType === 'moderator' || userType === 'admin';
	}

	// Panelist routes (dashboard, surveys, profile, etc.)
	if (pathname.startsWith('/dashboard') ||
	    pathname.startsWith('/discover') ||
	    pathname.startsWith('/welcome') ||
	    pathname.startsWith('/surveys') ||
	    pathname.startsWith('/profile') ||
	    pathname.startsWith('/points') ||
	    pathname.startsWith('/history') ||
	    pathname.startsWith('/rewards')) {
		return userType === 'panelist' || userType === 'admin';
	}

	// Public routes accessible to all
	return true;
}

/**
 * Get user-friendly role name
 */
export function getRoleName(userType: string): string {
	switch (userType) {
		case 'admin':
			return 'Administrator';
		case 'panelist':
			return 'Panelist';
		case 'client':
			return 'Client';
		case 'moderator':
			return 'Moderator';
		default:
			return 'User';
	}
}
