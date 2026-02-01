import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { validateGuestSession, verifyGuestUpgradeOtp } from '$lib/db';
import type { GuestUpgradeVerifyResponse } from '$types/guest-session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = (await request.json()) as { otp?: string };
		const otp = (body.otp || '').trim();

		const guestToken = cookies.get('guest_session');
		if (!guestToken) {
			return json(
				{ success: false, error: 'NO_GUEST_SESSION', message: 'No guest session found' } satisfies GuestUpgradeVerifyResponse,
				{ status: 400 }
			);
		}

		const guestSession = await validateGuestSession(guestToken);
		if (!guestSession) {
			cookies.delete('guest_session', { path: '/' });
			return json(
				{ success: false, error: 'SESSION_EXPIRED', message: 'Guest session expired' } satisfies GuestUpgradeVerifyResponse,
				{ status: 401 }
			);
		}

		if (!otp || otp.length !== 6) {
			return json(
				{ success: false, error: 'INVALID_OTP', message: 'Enter the 6-digit code' } satisfies GuestUpgradeVerifyResponse,
				{ status: 400 }
			);
		}

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
		Logger.root.error({ context: 'errors', error }, 'Guest upgrade OTP verify error');
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to verify code' } satisfies GuestUpgradeVerifyResponse,
			{ status: 500 }
		);
	}
};
