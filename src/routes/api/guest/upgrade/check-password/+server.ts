import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByEmail } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as { email?: string };
		const email = (body.email || '').trim().toLowerCase();

		if (!email) {
			return json(
				{ success: false, error: 'INVALID_EMAIL', message: 'Email is required' },
				{ status: 400 }
			);
		}

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
		Logger.root.error({ context: 'errors', error }, 'Check password error');

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to check password status' },
			{ status: 500 }
		);
	}
};
