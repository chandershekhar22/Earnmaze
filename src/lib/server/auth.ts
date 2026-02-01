import { validateSession } from '$lib/db';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { eq, sql } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { Logger } from '$lib/utils/app-logger';

export type UserType = 'admin' | 'panelist' | 'client' | 'moderator';

export interface AuthUser {
	id: string;
	name?: string;
	email: string;
	userType: UserType;
	emailVerified: boolean;
	image: string | null;
}

/**
 * Get current authenticated user from session token
 */
export async function getAuthUser(event: RequestEvent): Promise<AuthUser | null> {
	// Try both cookie names for compatibility
	const token = event.cookies.get('session') || event.cookies.get('session_token');
	
	if (!token) {
		return null;
	}

	try {
		const userData = await validateSession(token);
		
		if (!userData) {
			return null;
		}

		return {
			id: userData.id,
			name: userData.name ? userData.name : "",
			email: userData.email,
			userType: userData.userType as UserType,
			emailVerified: userData.emailVerified,
			image: userData.image,
		};
	} catch (e) {
		Logger.root.error({ context: 'auth', error: e }, 'Auth error during session validation');
		return null;
	}
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<AuthUser> {
	const user = await getAuthUser(event);
	
	if (!user) {
		throw redirect(303, '/login?redirect=' + encodeURIComponent(event.url.pathname));
	}
	
	return user;
}

/**
 * Require admin role - throw error if not admin
 */
export async function requireAdmin(event: RequestEvent): Promise<AuthUser> {
	const user = await requireAuth(event);
	
	if (user.userType !== 'admin') {
		throw error(403, {
			message: 'Access denied. Admin privileges required.'
		});
	}
	
	return user;
}

/**
 * Require specific user type
 */
export async function requireUserType(event: RequestEvent, allowedTypes: UserType[]): Promise<AuthUser> {
	const user = await requireAuth(event);
	
	if (!allowedTypes.includes(user.userType)) {
		throw error(403, {
			message: `Access denied. Required role: ${allowedTypes.join(' or ')}`
		});
	}
	
	return user;
}

/**
 * Check if user is admin (boolean check, no error)
 */
export async function isAdmin(event: RequestEvent): Promise<boolean> {
	const user = await getAuthUser(event);
	return user?.userType === 'admin';
}

/**
 * Check if user has specific role (boolean check, no error)
 */
export async function hasRole(event: RequestEvent, role: UserType): Promise<boolean> {
	const user = await getAuthUser(event);
	return user?.userType === role;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
	await db
		.update(user)
		.set({
			lastLoginAt: new Date(),
			loginCount: sql`${user.loginCount} + 1`,
		})
		.where(eq(user.id, userId));
}
