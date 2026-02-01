import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { passwordReset, user as userTable } from '$lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';
import { hashPassword } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as { token?: string; password?: string };
		const token = (body.token || '').trim();
		const password = body.password || '';

		if (!token) {
			return json(
				{ success: false, error: 'MISSING_TOKEN', message: 'Reset token is required' },
				{ status: 400 }
			);
		}

		if (!password || password.length < 8) {
			return json(
				{ success: false, error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' },
				{ status: 400 }
			);
		}

		// Find and validate reset token
		const resetRecord = await db
			.select()
			.from(passwordReset)
			.where(eq(passwordReset.token, token))
			.limit(1);

		if (!resetRecord.length) {
			Logger.root.warn({ context: 'security' }, 'Invalid password reset token');
			return json(
				{ success: false, error: 'INVALID_TOKEN', message: 'Reset link is invalid or expired' },
				{ status: 400 }
			);
		}

		const { userId, expiresAt } = resetRecord[0];

		// Check if token is expired
		if (expiresAt < new Date()) {
			await db.delete(passwordReset).where(eq(passwordReset.token, token));
			Logger.root.warn({ context: 'security', userId }, 'Expired password reset token used');
			return json(
				{ success: false, error: 'EXPIRED_TOKEN', message: 'Reset link has expired' },
				{ status: 400 }
			);
		}

		// Hash new password
		const hashedPassword = await hashPassword(password);

		// Update user password
		await db
			.update(userTable)
			.set({
				password: hashedPassword,
				isPasswordSet: true,
				updatedAt: new Date(),
			})
			.where(eq(userTable.id, userId));

		// Delete reset token
		await db.delete(passwordReset).where(eq(passwordReset.token, token));

		Logger.root.info(
			{ context: 'security', userId },
			'Password reset completed'
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
