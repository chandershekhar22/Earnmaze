import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { createSession, createUser, getUserByEmail } from '$lib/db';
import { validateTurnstileToken } from '$lib/server/turnstile';
import type { RegisterResponse, AuthUserResponse } from '$lib/types/api-responses';
import { getUserByReferralCode } from '$lib/db/repositories/auth.repository.server';
import { Logger } from '$lib/utils/app-logger';
import { isValidEmail, normalizeEmail } from '$lib/utils/validation';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const { email, password, name, turnstileToken, referralCode } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		// Validate email with utility function
		if (!isValidEmail(email)) {
			Logger.root.warn({ context: 'auth', email }, 'Invalid email format attempted');
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		const normalizedEmail = normalizeEmail(email);

		// Check if user already exists
		const existingUser = await getUserByEmail(normalizedEmail);
		if (existingUser) {
			return json({ error: 'User with this email already exists' }, { status: 409 });
		}

		const referrer = await getUserByReferralCode(referralCode || '');
		if (referralCode && !referrer) {
			Logger.root.warn({ context: 'auth', email, referralCode }, 'Invalid referral code used during registration');
		}


		// Create new user
		await createUser({
			email: normalizedEmail,
			password,
			name,
			userType: 'panelist',
			registrationSource: 'registration-page',
			utmSource: null,
			utmMedium: null,
			utmCampaign: null,
		});

		// Get the created user
		const user = await getUserByEmail(email);
		if (!user) {
			return json({ error: 'Failed to create user' }, { status: 500 });
		}

		// Create session
		const sessionId = await createSession(user.id);

		// Set session cookie
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});

		// Return only safe user fields (no password or sensitive data)
		const response: RegisterResponse = {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				userType: user.userType,
				createdAt: user.createdAt,
				emailVerified: user.emailVerified,
				image: user.image,
			} satisfies AuthUserResponse,
		};

		return json(response);
	} catch (error) {
		Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Registration error');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
