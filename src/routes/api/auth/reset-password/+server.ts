import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	findPasswordResetToken,
	deletePasswordResetToken,
	resetPasswordWithToken,
	invalidateAllUserSessions,
	hashPassword,
} from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';
import { resetPasswordSchema, validateInput } from '$lib/validation/api-schemas';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validation = await validateInput(resetPasswordSchema, body);
		if (!validation.success) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: validation.error },
				{ status: 400 }
			);
		}

		const { token, password } = validation.data;

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

		// Hash new password
		const hashedPassword = await hashPassword(password);

		// Atomically update password and mark token as used
		await resetPasswordWithToken(token, userId, hashedPassword);

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
