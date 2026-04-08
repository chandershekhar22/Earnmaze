import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GuestLoginRequest, GuestLoginResponse } from '$types/guest-session';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '$lib/db/schema';
import { guestSession } from '$lib/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';
import { isValidEmail, normalizeEmail } from '$lib/utils/validation';
import crypto from 'crypto';

const db = drizzle(process.env.DATABASE_URL!, { schema });

/**
 * Guest Login API - Instant Access
 * 
 * Creates a temporary guest session with email only - no verification needed.
 * User is logged in immediately and can start viewing surveys and earning points.
 * Guest sessions provide limited access and expire after 24 hours.
 */
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const body = await request.json() as GuestLoginRequest;
		const { email, fingerprint } = body;

		// Validate email format
		if (!isValidEmail(email)) {
			return json(
				{ success: false, error: 'INVALID_EMAIL', message: 'Invalid email format' },
				{ status: 400 }
			);
		}

		const normalizedEmail = normalizeEmail(email);

		// Get client information
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || undefined;

		Logger.root.info({ context: 'auth', email: normalizedEmail, ipAddress }, 'Guest login attempt');

		// Check for existing active session
		const existingSession = await db.query.guestSession.findFirst({
			where: and(
				eq(guestSession.email, normalizedEmail),
				eq(guestSession.status, 'active'),
				gt(guestSession.expiresAt, new Date())
			),
			orderBy: [desc(guestSession.createdAt)]
		});

		let token: string;
		let sessionId: string;
		let expiresAt: Date;

		if (existingSession) {
			// Reuse existing active session
			token = existingSession.token;
			sessionId = existingSession.id;
			expiresAt = existingSession.expiresAt;

			Logger.root.info({ context: 'auth', email, sessionId, expiresAt }, 'Reusing existing guest session');
		} else {
			// Create new guest session
			token = crypto.randomBytes(32).toString('hex');
			expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

			const [newSession] = await db.insert(guestSession).values({
				email: normalizedEmail,
				token,
				status: 'active',
				expiresAt,
				ipAddress,
				userAgent,
				fingerprint,
				surveysViewed: 0,
				surveysCompleted: 0,
				sessionPoints: 0
			}).returning();

			sessionId = newSession.id;

			Logger.root.info({ context: 'auth', email, sessionId, expiresAt }, 'Created new guest session');
		}

		// Set guest session cookie (24 hours)
		cookies.set('guest_session', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24, // 24 hours
		});

		return json({
			success: true,
			sessionId,
			expiresAt: expiresAt.toISOString(),
			message: 'Welcome! You can now view surveys and start earning points.',
		});
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Guest login failed');
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to create guest session' },
			{ status: 500 }
		);
	}
};
