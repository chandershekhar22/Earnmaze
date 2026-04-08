import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { verifyGuestUpgradeOtp } from '$lib/db';
import type { GuestUpgradeVerifyResponse } from '$types/guest-session';
import { guestUpgradeVerifySchema } from '$lib/validation/api-schemas';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const guestSession = locals.guestSession;
		if (!guestSession) {
			return json(
				{ success: false, error: 'NO_GUEST_SESSION', message: 'No guest session found' } satisfies GuestUpgradeVerifyResponse,
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validated = guestUpgradeVerifySchema.parse(body);
		const otp = validated.otp;

		const verified = await verifyGuestUpgradeOtp({
			guestSessionId: guestSession.id,
			email: guestSession.email,
			otp,
		});

		if (!verified) {
			Logger.root.warn(
				{ context: 'security', email: guestSession.email, guestSessionId: guestSession.id },
				'Guest upgrade OTP verification failed'
			);
			return json(
				{ success: false, error: 'OTP_FAILED', message: 'Invalid or expired code' } satisfies GuestUpgradeVerifyResponse,
				{ status: 400 }
			);
		}

		return json({
			success: true,
			data: { upgradeToken: verified.upgradeToken, expiresAt: verified.tokenExpiresAt.toISOString() },
			message: 'Email verified',
		} satisfies GuestUpgradeVerifyResponse);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{ success: false, error: 'INVALID_OTP', message: error.issues[0]?.message || 'Invalid input' } satisfies GuestUpgradeVerifyResponse,
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'errors', error }, 'Guest upgrade OTP verify error');
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to verify code' } satisfies GuestUpgradeVerifyResponse,
			{ status: 500 }
		);
	}
};
