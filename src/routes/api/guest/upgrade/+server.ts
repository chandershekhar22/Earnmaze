import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UpgradeAccountRequest, UpgradeAccountResponse } from '$types/guest-session';
import { createUser, upgradeGuestSession, validateGuestSession } from '$lib/db';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { Logger } from '$lib/utils/app-logger';
import { setSessionCookie } from '$lib/server/auth/session';
import { createSession } from '$lib/db';

/**
 * Upgrade Guest Account API
 * 
 * Converts a guest session into a full user account.
 * - Validates guest session
 * - Creates full user account with password
 * - Transfers session data to new account
 * - Marks guest session as upgraded
 */
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const body = await request.json() as UpgradeAccountRequest;
		const { name, password, turnstileToken } = body;

		// Get guest session
		const guestToken = cookies.get('guest_session');
		if (!guestToken) {
			return json(
				{ success: false, error: 'NO_GUEST_SESSION', message: 'No guest session found' } satisfies UpgradeAccountResponse,
				{ status: 400 }
			);
		}

		// Validate guest session
		const guestSession = await validateGuestSession(guestToken);
		if (!guestSession) {
			cookies.delete('guest_session', { path: '/' });
			return json(
				{ success: false, error: 'SESSION_EXPIRED', message: 'Guest session expired' } satisfies UpgradeAccountResponse,
				{ status: 401 }
			);
		}

		// Validate required fields
		if (!name || !password) {
			return json(
				{ success: false, error: 'MISSING_FIELDS', message: 'Name and password are required' } satisfies UpgradeAccountResponse,
				{ status: 400 }
			);
		}

		if (password.length < 8) {
			return json(
				{ success: false, error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } satisfies UpgradeAccountResponse,
				{ status: 400 }
			);
		}

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			Logger.root.warn({ context: 'auth', email: guestSession.email, reason: turnstileError }, 'Upgrade account captcha failed');
			return json(
				{ success: false, error: 'CAPTCHA_FAILED', message: turnstileError } satisfies UpgradeAccountResponse,
				{ status: 400 }
			);
		}

		// Create full user account
		const { user: newUser } = await createUser({
			email: guestSession.email,
			password,
			name,
			userType: 'panelist',
		});

		// Mark guest session as upgraded
		await upgradeGuestSession(guestToken, newUser.id);

		// Create regular session for the new user
		const sessionToken = await createSession(newUser.id);

		// Set regular session cookie and clear guest cookie
		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
		cookies.delete('guest_session', { path: '/' });

		Logger.root.info({ context: 'security', userId: newUser.id, email: guestSession.email, guestSessionId: guestSession.id }, 'Guest account upgraded');

		return json({
			success: true,
			user: {
				id: newUser.id,
				email: newUser.email,
				name: newUser.name || name, // Use provided name since it's required
				userType: newUser.userType,
			},
			message: 'Account created successfully',
		} satisfies UpgradeAccountResponse);
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Upgrade account error');
		
		// Check for duplicate email error
		if (error instanceof Error && error.message.includes('unique')) {
			return json(
				{ 
					success: false, 
					error: 'EMAIL_EXISTS', 
					message: 'An account with this email already exists. Please log in instead.' 
				} satisfies UpgradeAccountResponse,
				{ status: 409 }
			);
		}

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to create account' } satisfies UpgradeAccountResponse,
			{ status: 500 }
		);
	}
};
