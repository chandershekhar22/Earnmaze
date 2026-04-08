import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByEmail } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';
import { guestUpgradeCheckPasswordSchema } from '$lib/validation/api-schemas';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validated = guestUpgradeCheckPasswordSchema.parse(body);
		const email = validated.email.trim().toLowerCase();

		// Check if user exists and has a password set
		const user = await getUserByEmail(email);
		
		if (!user) {
			// User doesn't exist, safe to proceed with upgrade
			return json({
				success: true,
				data: {
					hasPassword: false,
				},
			});
		}

		// User exists - check if they have a password set
		const hasPassword = !!user.password && user.isPasswordSet;

		Logger.root.info(
			{ context: 'security', email, hasPassword },
			'Password status checked'
		);

		return json({
			success: true,
			data: {
				hasPassword,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: error.issues[0]?.message || 'Invalid input' },
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'errors', error }, 'Check password error');
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to check password status' },
			{ status: 500 }
		);
	}
};
