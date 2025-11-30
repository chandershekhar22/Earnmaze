import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { createSession, createUser, getUserByEmail } from '$lib/db';
import { validateTurnstileToken } from '$lib/server/turnstile';
import type { RegisterResponse, AuthUserResponse } from '$lib/types/api-responses';
import { sendEmail } from '$lib/utils/send_mail';
import { getWelcomeEmailHtml, getWelcomeEmailText } from '$lib/email-templates';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const { email, password, name, turnstileToken } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return json({ error: 'User with this email already exists' }, { status: 409 });
		}

		// Create new user
		await createUser({
			email,
			password,
			name
		});

		// Get the created user
		const user = await getUserByEmail(email);
		if (!user) {
			return json({ error: 'Failed to create user' }, { status: 500 });
		}

		await sendEmail({
			from: 'EarnMaze <support@mail.earnmaze.com>',
			to: [user.email],
			subject: 'Welcome to EarnMaze!',
			html: getWelcomeEmailHtml(user.name || 'there'),
			text: getWelcomeEmailText(user.name || 'there'),
		});

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
		console.error('Registration error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
