import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { createGuestUpgradeOtp, validateGuestSession } from '$lib/db';
import { db } from '$lib/db';
import { guestUpgradeVerification } from '$lib/db/schema/guest-upgrade-verifications';
import { sendTask } from '$lib/utils/celery';
import type { GuestUpgradeStartResponse } from '$types/guest-session';
import { sendVerificationEmail } from '$lib/server/email-service';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const body = (await request.json()) as { turnstileToken?: string };
		const turnstileToken = body.turnstileToken;

		const guestToken = cookies.get('guest_session');
		if (!guestToken) {
			return json(
				{ success: false, error: 'NO_GUEST_SESSION', message: 'No guest session found' } satisfies GuestUpgradeStartResponse,
				{ status: 400 }
			);
		}

		const guestSession = await validateGuestSession(guestToken);
		if (!guestSession) {
			cookies.delete('guest_session', { path: '/' });
			return json(
				{ success: false, error: 'SESSION_EXPIRED', message: 'Guest session expired' } satisfies GuestUpgradeStartResponse,
				{ status: 401 }
			);
		}

		// Check rate limiting: prevent resends within 1 minute
		const existingOtp = await db
			.select()
			.from(guestUpgradeVerification)
			.where(eq(guestUpgradeVerification.guestSessionId, guestSession.id))
			.limit(1);

		if (existingOtp.length > 0 && existingOtp[0].otpSentAt) {
			const secondsSinceLastSend = Math.floor((Date.now() - existingOtp[0].otpSentAt.getTime()) / 1000);
			const RESEND_COOLDOWN_SECONDS = 60; // 1 minute

			if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
				const waitSeconds = RESEND_COOLDOWN_SECONDS - secondsSinceLastSend;
				Logger.root.warn(
					{ context: 'security', email: guestSession.email, waitSeconds },
					'Guest upgrade OTP resend rate limited'
				);
				return json(
					{
						success: false,
						error: 'RATE_LIMITED',
						message: `Please wait ${waitSeconds} seconds before requesting another code`,
					} satisfies GuestUpgradeStartResponse,
					{ status: 429 }
				);
			}
		}

		if (!turnstileToken) {
			return json(
				{ success: false, error: 'CAPTCHA_REQUIRED', message: 'Please complete the verification' } satisfies GuestUpgradeStartResponse,
				{ status: 400 }
			);
		}

		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			Logger.root.warn({ context: 'auth', email: guestSession.email, reason: turnstileError }, 'Guest upgrade OTP captcha failed');
			return json(
				{ success: false, error: 'CAPTCHA_FAILED', message: turnstileError } satisfies GuestUpgradeStartResponse,
				{ status: 400 }
			);
		}

		const { otp, expiresAt } = await createGuestUpgradeOtp({
			guestSessionId: guestSession.id,
			email: guestSession.email,
		});

		await sendVerificationEmail(guestSession.email, otp);

		Logger.root.info(
			{ context: 'security', email: guestSession.email, guestSessionId: guestSession.id },
			'Guest upgrade OTP generated and sent'
		);

		return json({
			success: true,
			data: { expiresAt: expiresAt.toISOString() },
			message: 'Verification code sent',
		} satisfies GuestUpgradeStartResponse);
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Guest upgrade OTP start error');
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to send verification code' } satisfies GuestUpgradeStartResponse,
			{ status: 500 }
		);
	}
};
