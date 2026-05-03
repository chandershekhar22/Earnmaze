import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import {
	findPasswordResetToken,
	deletePasswordResetToken,
	resetPasswordWithToken,
	invalidateAllUserSessions,
	hashPassword,
} from '$lib/db/repositories';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { Logger } from '$lib/utils/app-logger';
import { resetPasswordSchema, validateInput } from '$lib/validation/api-schemas';
import { recordConsent } from '$lib/server/email-consent';
import { getClientIP } from '$lib/server/geo-restriction';

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	try {
		const body = await request.json();
		const validation = await validateInput(resetPasswordSchema, body);
		if (!validation.success) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: validation.error },
				{ status: 400 }
			);
		}

		const { token, password, ageVerified, tosAccepted, privacyAccepted, marketingConsent } =
			validation.data;

		// Find and validate reset token
			const resetRecord = await findPasswordResetToken(token);

			if (!resetRecord) {
			Logger.root.warn({ context: 'security' }, 'Invalid password reset token');
			return json(
				{ success: false, error: 'INVALID_TOKEN', message: 'Reset link is invalid or expired' },
				{ status: 400 }
			);
		}

const { userId, expiresAt, isUsed } = resetRecord;

		// Check if token was already used
		if (isUsed) {
			Logger.root.warn({ context: 'security', userId }, 'Already-used password reset token attempted');
			return json(
				{ success: false, error: 'TOKEN_USED', message: 'Reset link has already been used' },
				{ status: 400 }
			);
		}

		// Check if token is expired
		if (expiresAt < new Date()) {
				await deletePasswordResetToken(token);
			Logger.root.warn({ context: 'security', userId }, 'Expired password reset token used');
			return json(
				{ success: false, error: 'EXPIRED_TOKEN', message: 'Reset link has expired' },
				{ status: 400 }
			);
		}

		// First-time activation check — if the user has never accepted the
		// ToS, this reset doubles as their account-activation moment. They
		// MUST submit the consent flags; existing panelists who legitimately
		// forgot their password skip this branch.
		const [userRow] = await db
			.select({ tosAcceptedAt: user.tosAcceptedAt })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		const requiresConsent = !userRow?.tosAcceptedAt;

		if (requiresConsent && (!ageVerified || !tosAccepted || !privacyAccepted)) {
			return json(
				{
					success: false,
					error: 'CONSENT_REQUIRED',
					message:
						'You must confirm you are 18+ and accept the Terms and Privacy Policy to activate your account',
				},
				{ status: 400 }
			);
		}

		// Hash new password
		const hashedPassword = await hashPassword(password);

		// Atomically update password and mark token as used
		await resetPasswordWithToken(token, userId, hashedPassword);

		// Stamp consent if this was a first-time activation. Failure here is
		// logged but doesn't roll back the password reset — the user can
		// re-confirm consent later via profile page.
		if (requiresConsent) {
			const now = new Date();
			try {
				await db
					.update(user)
					.set({
						ageVerified: true,
						ageVerifiedAt: now,
						tosAcceptedAt: now,
						privacyAcceptedAt: now,
						updatedAt: now,
					})
					.where(eq(user.id, userId));

				if (marketingConsent) {
					await recordConsent(userId, 'marketing', true, {
						source: 'forgot-password-flow',
						ipAddress: getClientIP(event),
						userAgent: request.headers.get('user-agent') ?? null,
					});
				}
			} catch (consentErr) {
				Logger.root.error(
					{ context: 'consent', userId, error: consentErr },
					'Failed to stamp consent on first-time activation via reset-password'
				);
			}
		}

		// Invalidate all existing sessions so stolen/old sessions can't be reused
		await invalidateAllUserSessions(userId);

		Logger.root.info(
			{ context: 'security', userId },
			'Password reset completed, all sessions invalidated'
		);

		return json({
			success: true,
			data: {
				message: 'Password reset successfully. You can now log in with your new password.',
			},
		});
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Password reset error');

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to reset password' },
			{ status: 500 }
		);
	}
};
