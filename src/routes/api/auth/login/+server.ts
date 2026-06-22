import { json } from '@sveltejs/kit';
import { verifyPassword, createSession, getUserByEmail, db } from '$lib/db';
import { user as userTable, session as sessionTable } from '$lib/db/schema/auth';
import { eq, sql, and, lt } from 'drizzle-orm';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { Security, Logger } from '$lib/utils/app-logger';
import { authRateLimit } from '$lib/server/rate-limit';
import { loginSchema, validateInput } from '$lib/validation/api-schemas';
import type { RequestHandler } from './$types';
import type { LoginResponse, AuthUserResponse } from '$lib/types/api-responses';
import { getClientIP } from '$lib/server/geo-restriction';

export const POST: RequestHandler = async (event) => {
	const rateLimited = await authRateLimit(event);
	if (rateLimited) return rateLimited;

	const { request, cookies, getClientAddress } = event;
	let userEmail = 'unknown';
	
	try {
		const body = await request.json();
		const validation = await validateInput(loginSchema, body);
		if (!validation.success) {
			Security.logAuthAttempt('login', 'validation-failed', false, {
				reason: validation.error
			});
			return json({ error: validation.error }, { status: 400 });
		}

		const { email, password, turnstileToken } = validation.data;
		userEmail = email; // Store for error logging

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientIP(event));
		if (turnstileError) {
			Security.logSecurityEvent('turnstile-validation-failed', 'medium', {
				reason: turnstileError,
				ip: getClientIP(event)
			});
			return json({ error: turnstileError }, { status: 400 });
		}

		const user = await getUserByEmail(email);
		if (!user || !user.password) {
			Security.logAuthAttempt('login', 'unknown-user', false, {
				emailHash: Buffer.from(email).toString('base64'),
				ip: getClientIP(event)
			});
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		const isValidPassword = await verifyPassword(password, user.password);
		if (!isValidPassword) {
			Security.logAuthAttempt('login', user.email, false, {
				reason: 'invalid_password',
				ip: getClientIP(event)
			});
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		if (!user.isActive) {
			Security.logAuthAttempt('login', user.email, false, {
				reason: 'inactive_account',
				ip: getClientIP(event)
			});
			return json({ error: 'Account is not active' }, { status: 401 });
		}

		// Clean up only expired sessions (don't kill active sessions on other devices)
		await db.delete(sessionTable).where(
			and(eq(sessionTable.userId, user.id), lt(sessionTable.expiresAt, new Date()))
		);

		// Update login count and last login timestamp
		await db.update(userTable).set({
			loginCount: sql`COALESCE(${userTable.loginCount}, 0) + 1`,
			lastLoginAt: new Date(),
		}).where(eq(userTable.id, user.id));

		const sessionId = await createSession(user.id);
		Security.logAuthAttempt('login', user.email, true, {
			ip: getClientIP(event)
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
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		
		// Determine error type for better diagnostics
		let errorType = 'UNKNOWN_ERROR';
		if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
			errorType = 'DATABASE_CONNECTION_ERROR';
		} else if (errorMessage.includes('query')) {
			errorType = 'QUERY_ERROR';
		} else if (errorMessage.includes('validation')) {
			errorType = 'VALIDATION_ERROR';
		}
		
		Logger.root.error(
			{
				context: 'errors',
				reason: 'unexpected_exception',
				errorType,
				error: errorMessage,
				stack: errorStack,
				email: userEmail,
			},
			'Login error'
		);
		
		// Return appropriate error based on type
		if (errorType === 'DATABASE_CONNECTION_ERROR') {
			return json(
				{ error: 'Service temporarily unavailable. Please try again.' },
				{ status: 503 }
			);
		}
		
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
