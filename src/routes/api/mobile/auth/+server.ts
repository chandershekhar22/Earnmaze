import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByEmail, verifyPassword } from '$lib/db';
import { createTokenPair, verifyToken } from '$lib/server/jwt';
import { Logger } from '$lib/utils/app-logger';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.string().email().toLowerCase().trim(),
	password: z.string().min(1),
});

const refreshSchema = z.object({
	refreshToken: z.string().min(1),
});

/**
 * POST /api/mobile/auth — Login and get JWT tokens
 * Body: { email, password }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validated = loginSchema.parse(body);

		const user = await getUserByEmail(validated.email);
		if (!user || !user.password) {
			return json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, { status: 401 });
		}

		const passwordValid = await verifyPassword(validated.password, user.password);
		if (!passwordValid) {
			return json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, { status: 401 });
		}

		// Only panelists can use the mobile app
		if (user.userType !== 'panelist') {
			return json({ success: false, error: 'NOT_PANELIST', message: 'Mobile app is only available for panelists' }, { status: 403 });
		}

		if (!user.isActive) {
			return json({ success: false, error: 'ACCOUNT_INACTIVE', message: 'Your account is inactive' }, { status: 403 });
		}

		const tokens = await createTokenPair(user.id, user.email, user.userType);

		Logger.root.info({ context: 'auth', userId: user.id, source: 'mobile' }, 'Mobile login successful');

		return json({
			success: true,
			data: {
				...tokens,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					userType: user.userType,
					emailVerified: user.emailVerified,
				},
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ success: false, error: 'VALIDATION_ERROR', message: error.issues[0]?.message }, { status: 400 });
		}
		Logger.root.error({ context: 'auth', error, source: 'mobile' }, 'Mobile login error');
		return json({ success: false, error: 'LOGIN_FAILED', message: 'Login failed' }, { status: 500 });
	}
};

/**
 * PATCH /api/mobile/auth — Refresh access token
 * Body: { refreshToken }
 */
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { refreshToken } = refreshSchema.parse(body);

		const payload = await verifyToken(refreshToken);
		if (!payload || payload.type !== 'refresh') {
			return json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' }, { status: 401 });
		}

		const tokens = await createTokenPair(payload.sub, payload.email, payload.userType);

		return json({ success: true, data: tokens });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ success: false, error: 'VALIDATION_ERROR', message: error.issues[0]?.message }, { status: 400 });
		}
		Logger.root.error({ context: 'auth', error, source: 'mobile' }, 'Token refresh error');
		return json({ success: false, error: 'REFRESH_FAILED', message: 'Token refresh failed' }, { status: 500 });
	}
};
