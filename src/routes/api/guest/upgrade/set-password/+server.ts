import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import {
	createSession,
	createUser,
	upgradeGuestSession,
	consumeGuestUpgradeToken,
	getUserByEmail,
	hashPassword,
	addBonusPoints,
} from '$lib/db';
import { getAppSettings } from '$lib/db/repositories/settings.repository.server';
import type { GuestUpgradeSetPasswordResponse } from '$types/guest-session';
import { updateUserPasswordAndActivate } from '$lib/db/repositories';
import { guestUpgradeSetPasswordSchema } from '$lib/validation/api-schemas';
import { user as userTable } from '$lib/db/schema/auth';
import { db as dbConn } from '$lib/db';
import { eq } from 'drizzle-orm';
import { recordConsent } from '$lib/server/email-consent';
import { getClientIP } from '$lib/server/geo-restriction';
import { z } from 'zod';

export const POST: RequestHandler = async (event) => {
	const { request, cookies, locals } = event;
	try {
		const guestSession = locals.guestSession;
		if (!guestSession) {
			return json(
				{ success: false, error: 'NO_GUEST_SESSION', message: 'No guest session found' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validated = guestUpgradeSetPasswordSchema.parse(body);
		const upgradeToken = validated.upgradeToken;
		const password = validated.password;
		const marketingConsent = validated.marketingConsent;

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

		const hashed = await hashPassword(password);

		if (existingUser) {
			await updateUserPasswordAndActivate(existingUser.id, hashed);
		} else {
			const { user: newUser } = await createUser({
				email: guestSession.email,
				password,
				userType: 'panelist',
				registrationSource: 'guest_upgrade',
			});

			// Activate and mark email verified (createUser already hashed, but ensure consistency)
			await updateUserPasswordAndActivate(newUser.id, hashed);

			upgradedUser = newUser;
		}

		if (!upgradedUser) {
			return json(
				{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to upgrade account' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 500 }
			);
		}

		await upgradeGuestSession(guestSession.token, upgradedUser.id);

		// Re-stamp age + ToS + Privacy at upgrade time (explicit click-through
		// supersedes the implicit-consent stamp from earn-points). Marketing
		// consent is recorded via the audit-log helper.
		const consentNow = new Date();
		try {
			await dbConn
				.update(userTable)
				.set({
					ageVerified: true,
					ageVerifiedAt: consentNow,
					tosAcceptedAt: consentNow,
					privacyAcceptedAt: consentNow,
					updatedAt: consentNow,
				})
				.where(eq(userTable.id, upgradedUser.id));

			if (marketingConsent) {
				await recordConsent(upgradedUser.id, 'marketing', true, {
					source: 'guest-upgrade-form',
					ipAddress: getClientIP(event),
					userAgent: request.headers.get('user-agent') ?? null,
				});
			}
		} catch (consentErr) {
			// Don't block account upgrade if consent stamping fails.
			Logger.root.error(
				{ context: 'consent', userId: upgradedUser.id, error: consentErr },
				'Failed to stamp consent at guest upgrade'
			);
		}

		// Credit signup bonus points
		const settings = await getAppSettings(['signup_bonus_points']);
		const signupBonus = parseInt(settings.signup_bonus_points || '0') || 0;
		if (signupBonus > 0) {
			await addBonusPoints(upgradedUser.id, signupBonus, 'Welcome bonus for guest upgrade');
		}

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
		if (error instanceof z.ZodError) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: error.issues[0]?.message || 'Invalid input' } satisfies GuestUpgradeSetPasswordResponse,
				{ status: 400 }
			);
		}

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
