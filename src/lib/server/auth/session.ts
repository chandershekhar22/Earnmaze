/**
 * Session management utilities
 * Handles user session retrieval and validation
 */

import { validateSession } from '$lib/db';
import type { RequestEvent } from '@sveltejs/kit';
import { Logger } from '$lib/utils/app-logger';

export type UserType = 'admin' | 'panelist' | 'client' | 'moderator';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	userType: UserType;
	emailVerified: boolean;
	image: string | null;
}

/**
 * Get current authenticated user from session token
 * Returns null if not authenticated
 */
export async function getAuthUser(event: RequestEvent): Promise<AuthUser | null> {
	// Check if hooks already resolved the user (JWT Bearer or session)
	if (event.locals.user) {
		const u = event.locals.user;
		return {
			id: u.id,
			name: u.name || 'User',
			email: u.email,
			userType: u.userType as UserType,
		};
	}

	// Fallback: try session cookie directly
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
			name: userData.name || 'User',
			email: userData.email,
			userType: userData.userType as UserType,
			emailVerified: userData.emailVerified,
			image: userData.image,
		};
	} catch (e) {
		Logger.root.error(
			{ context: 'auth', error: e },
			'Session validation error'
		);
		return null;
	}
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
 * Get session token from cookies
 */
export function getSessionToken(event: RequestEvent): string | null {
	return event.cookies.get('session') || event.cookies.get('session_token') || null;
}

/**
 * Set session cookie
 */
export function setSessionCookie(event: RequestEvent, token: string): void {
	event.cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !event.url.hostname.includes('localhost'),
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(event: RequestEvent): void {
	event.cookies.delete('session', { path: '/' });
	event.cookies.delete('session_token', { path: '/' });
}
