import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByEmail, createPasswordResetToken } from '$lib/db/repositories';
import { randomUUID } from 'crypto';
import { Logger } from '$lib/utils/app-logger';
import { sendPasswordResetEmail } from '$lib/server/email-service';
import { authRateLimit } from '$lib/server/rate-limit';
import { forgotPasswordSchema, validateInput } from '$lib/validation/api-schemas';

export const POST: RequestHandler = async (event) => {
	const rateLimited = await authRateLimit(event);
	if (rateLimited) return rateLimited;

	const { request } = event;
	try {
		const body = await request.json();
		const validation = await validateInput(forgotPasswordSchema, body);
		if (!validation.success) {
			return json(
				{ success: false, error: 'INVALID_EMAIL', message: validation.error },
				{ status: 400 }
			);
		}

		const email = validation.data.email;

		// Check if user exists
		const user = await getUserByEmail(email);

		if (!user) {
			// Don't reveal if email exists or not (security)
			Logger.root.info({ context: 'security', email }, 'Password reset requested for non-existent email');
			return json({
				success: true,
				data: {
					message: 'If an account with this email exists, you will receive a password reset link.',
				},
			});
		}

		// Generate reset token
		const resetToken = randomUUID();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Store reset token in database
				await createPasswordResetToken(user.id, resetToken, expiresAt);
		// Send email with reset link
	
		await sendPasswordResetEmail(user.email, resetToken);

		Logger.root.info(
			{ context: 'security', userId: user.id, email },
			'Password reset email sent'
		);

		return json({
			success: true,
			data: {
				message: 'If an account with this email exists, you will receive a password reset link.',
			},
		});
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Password reset request error');

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to process password reset request' },
			{ status: 500 }
		);
	}
};
