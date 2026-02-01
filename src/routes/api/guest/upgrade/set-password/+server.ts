import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import {
	createSession,
	createUser,
	upgradeGuestSession,
	validateGuestSession,
	consumeGuestUpgradeToken,
	getUserByEmail,
	hashPassword,
} from '$lib/db';
import type { GuestUpgradeSetPasswordResponse } from '$types/guest-session';
import { db } from '$lib/db';
import { user as userTable } from '$lib/db/schema/auth';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = (await request.json()) as { upgradeToken?: string; password?: string };
		const upgradeToken = (body.upgradeToken || '').trim();
		const password = body.password || '';

		const guestToken = cookies.get('guest_session');
		if (!guestToken) {
			return json(
				{ success: false, error: 'NO_GUEST_SESSION', message: 'No guest session found' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 400 }
			);
		}

		const guestSession = await validateGuestSession(guestToken);
		if (!guestSession) {
			cookies.delete('guest_session', { path: '/' });
			return json(
				{ success: false, error: 'SESSION_EXPIRED', message: 'Guest session expired' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 401 }
			);
		}

		if (!upgradeToken) {
			return json(
				{ success: false, error: 'MISSING_TOKEN', message: 'Missing verification token' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 400 }
			);
		}

		if (!password || password.length < 8) {
			return json(
				{ success: false, error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 400 }
			);
		}

		const ok = await consumeGuestUpgradeToken({
			guestSessionId: guestSession.id,
			email: guestSession.email,
			upgradeToken,
		});
		if (!ok) {
			return json(
				{ success: false, error: 'INVALID_TOKEN', message: 'Verification token is invalid or expired' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 400 }
			);
		}

		const existingUser = await getUserByEmail(guestSession.email);
		let upgradedUser = existingUser;

		if (existingUser) {
			const hashed = await hashPassword(password);
			await db
				.update(userTable)
				.set({
					password: hashed,
					isPasswordSet: true,
					emailVerified: true,
					status: 'active',
					updatedAt: new Date(),
				})
				.where(eq(userTable.id, existingUser.id));
		} else {
			const { user: newUser } = await createUser({
				email: guestSession.email,
				password,
				userType: 'panelist',
				registrationSource: 'guest_upgrade',
			});

			// Mark verified now that OTP was confirmed.
			await db
				.update(userTable)
				.set({ emailVerified: true, status: 'active', updatedAt: new Date() })
				.where(eq(userTable.id, newUser.id));

			upgradedUser = newUser;
		}

		if (!upgradedUser) {
			return json(
				{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to upgrade account' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 500 }
			);
		}

		await upgradeGuestSession(guestToken, upgradedUser.id);

		const sessionToken = await createSession(upgradedUser.id);
		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30,
		});
		cookies.delete('guest_session', { path: '/' });

		Logger.root.info(
			{ context: 'security', userId: upgradedUser.id, email: guestSession.email, guestSessionId: guestSession.id },
			'Guest account upgraded via OTP'
		);

		return json({
			success: true,
			user: {
				id: upgradedUser.id,
				email: upgradedUser.email,
				name: upgradedUser.name || '',
				userType: upgradedUser.userType,
			},
			message: 'Account created successfully',
		} satisfies GuestUpgradeSetPasswordResponse);
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Guest upgrade set-password error');

		if (error instanceof Error && error.message.includes('unique')) {
			return json(
				{
					success: false,
					error: 'EMAIL_EXISTS',
					message: 'An account with this email already exists. Please log in instead.',
				} satisfies GuestUpgradeSetPasswordResponse,
				{ status: 409 }
			);
		}

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to create account' } satisfies GuestUpgradeSetPasswordResponse,
			{ status: 500 }
		);
	}
};
