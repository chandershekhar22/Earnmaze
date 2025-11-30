import { json } from '@sveltejs/kit';
import { verifyPassword, createSession, getUserByEmail } from '$lib/db';
import { validateTurnstileToken } from '$lib/server/turnstile';
import type { RequestHandler } from './$types';
import type { LoginResponse, AuthUserResponse } from '$lib/types/api-responses';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const { email, password, turnstileToken } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		const user = await getUserByEmail(email);
		if (!user) {
			// Don't log email to avoid leaking user existence in logs
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		const isValidPassword = await verifyPassword(password, user.password);
		if (!isValidPassword) {
			// Don't log email to avoid leaking user existence in logs
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		if (!user.isActive) {
			return json({ error: 'Account is not active' }, { status: 401 });
		}

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
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
