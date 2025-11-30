/**
 * Authorization guards
 * Middleware functions for protecting routes and requiring specific user types
 */

import type { RequestEvent } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { getAuthUser, type AuthUser, type UserType } from './session';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { eq, sql } from 'drizzle-orm';

/**
 * Require authentication - throw redirect if not authenticated
 * Use this in +page.server.ts and +server.ts files
 */
export async function requireAuth(event: RequestEvent): Promise<AuthUser> {
	const authUser = await getAuthUser(event);
	
	if (!authUser) {
		throw redirect(303, '/login?redirect=' + encodeURIComponent(event.url.pathname));
	}
	
	return authUser;
}

/**
 * Require admin role - throw error if not admin
 * Use this to protect admin-only routes and API endpoints
 */
export async function requireAdmin(event: RequestEvent): Promise<AuthUser> {
	const authUser = await requireAuth(event);
	
	if (authUser.userType !== 'admin') {
		throw error(403, {
			message: 'Access denied. Admin privileges required.'
		});
	}
	
	return authUser;
}

/**
 * Require panelist role - throw error if not panelist
 */
export async function requirePanelist(event: RequestEvent): Promise<AuthUser> {
	const authUser = await requireAuth(event);
	
	if (authUser.userType !== 'panelist') {
		throw error(403, {
			message: 'Access denied. Panelist account required.'
		});
	}
	
	return authUser;
}

/**
 * Require client role - throw error if not client
 */
export async function requireClient(event: RequestEvent): Promise<AuthUser> {
	const authUser = await requireAuth(event);
	
	if (authUser.userType !== 'client') {
		throw error(403, {
			message: 'Access denied. Client account required.'
		});
	}
	
	return authUser;
}

/**
 * Require specific user type(s)
 * Flexible guard for routes that allow multiple user types
 */
export async function requireUserType(event: RequestEvent, allowedTypes: UserType[]): Promise<AuthUser> {
	const authUser = await requireAuth(event);
	
	if (!allowedTypes.includes(authUser.userType)) {
		throw error(403, {
			message: `Access denied. Required role: ${allowedTypes.join(' or ')}`
		});
	}
	
	return authUser;
}

/**
 * Require any authenticated user (alias for requireAuth)
 */
export async function requireAnyAuth(event: RequestEvent): Promise<AuthUser> {
	return requireAuth(event);
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * Use when you want to show different content for authenticated users but don't require it
 */
export async function optionalAuth(event: RequestEvent): Promise<AuthUser | null> {
	return getAuthUser(event);
}

/**
 * Update last login timestamp for a user
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
