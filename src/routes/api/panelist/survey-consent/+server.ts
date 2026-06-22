/**
 * POST /api/panelist/survey-consent
 *
 * Records the user's consent to share demographic data with external survey
 * providers. Stamps user.surveyDataSharingAcceptedAt and writes an audit-log
 * entry for proof of consent.
 *
 * Accessible to BOTH regular sessions and guest sessions (the consent applies
 * before any survey can be taken).
 */
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from '@sveltejs/kit';
import { db, getUserByEmail } from '$lib/db';
import { user, emailConsentLog } from '$lib/db/schema/auth';
import { getClientIP } from '$lib/server/geo-restriction';
import { Logger } from '$lib/utils/app-logger';

const bodySchema = z.object({
	accepted: z.literal(true),
});

/**
 * Resolve user.id from either a regular session or an active guest session.
 * Guest sessions store `email` from save-email creation — we look up the
 * matching user record by email when `upgradedToUserId` is null.
 */
async function resolveUserId(event: Parameters<RequestHandler>[0]): Promise<string | null> {
	if (event.locals.user?.id) return event.locals.user.id;
	if (event.locals.guestSession?.upgradedToUserId) {
		return event.locals.guestSession.upgradedToUserId;
	}
	if (event.locals.guestSession?.email) {
		const u = await getUserByEmail(event.locals.guestSession.email);
		return u?.id ?? null;
	}
	return null;
}

export const POST: RequestHandler = async (event) => {
	const userId = await resolveUserId(event);
	if (!userId) {
		throw error(401, 'Sign in required');
	}

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		throw error(400, parsed.error.issues[0]?.message ?? 'Invalid input');
	}

	const now = new Date();
	const ipAddress = getClientIP(event);
	const userAgent = event.request.headers.get('user-agent') ?? null;

	try {
		await db
			.update(user)
			.set({
				surveyDataSharingAcceptedAt: now,
				updatedAt: now,
			})
			.where(eq(user.id, userId));

		// Reuse the email_consent_log table — it accepts any channel string.
		// Channel='survey-data-sharing' makes this distinguishable from marketing.
		try {
			await db.insert(emailConsentLog).values({
				userId,
				channel: 'survey-data-sharing',
				granted: true,
				source: 'survey-consent-page',
				ipAddress,
				userAgent,
			});
		} catch (logErr) {
			Logger.root.warn(
				{ context: 'consent', userId, error: logErr },
				'Failed to write survey-consent audit log'
			);
		}

		return json({ success: true, acceptedAt: now.toISOString() });
	} catch (err) {
		Logger.root.error(
			{ context: 'consent', userId, error: err },
			'Failed to save survey-data-sharing consent'
		);
		throw error(500, 'Could not save consent');
	}
};
