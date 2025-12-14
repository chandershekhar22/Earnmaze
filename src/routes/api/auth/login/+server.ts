import { json } from '@sveltejs/kit';
import { verifyPassword, createSession, getUserByEmail } from '$lib/db';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { Security, Logger } from '$lib/utils/app-logger';
import type { RequestHandler } from './$types';
import type { LoginResponse, AuthUserResponse } from '$lib/types/api-responses';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const { email, password, turnstileToken } = await request.json();

		if (!email || !password) {
			Security.logAuthAttempt('login', 'missing-email-or-password', false, {
				reason: 'missing_credentials'
			});
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			Security.logSecurityEvent('turnstile-validation-failed', 'medium', {
				reason: turnstileError,
				ip: getClientAddress()
			});
			return json({ error: turnstileError }, { status: 400 });
		}

		const user = await getUserByEmail(email);
		if (!user || !user.password) {
			Security.logAuthAttempt('login', 'unknown-user', false, {
				emailHash: Buffer.from(email).toString('base64'),
				ip: getClientAddress()
			});
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		const isValidPassword = await verifyPassword(password, user.password);
		if (!isValidPassword) {
			Security.logAuthAttempt('login', user.email, false, {
				reason: 'invalid_password',
				ip: getClientAddress()
			});
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		if (!user.isActive) {
			Security.logAuthAttempt('login', user.email, false, {
				reason: 'inactive_account',
				ip: getClientAddress()
			});
			return json({ error: 'Account is not active' }, { status: 401 });
		}

		const sessionId = await createSession(user.id);
		Security.logAuthAttempt('login', user.email, true, {
			ip: getClientAddress()
		});

		// Set session cookie
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});

		// Return only safe user fields (no password or sensitive data)
		const response: LoginResponse = {
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
		Logger.root.error({ context: 'errors', reason: 'unexpected_exception', error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Login error');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
