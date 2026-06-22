/**
 * GET  /api/panelist/email-preferences  — read current consent state
 * POST /api/panelist/email-preferences  — toggle marketing consent
 *
 * Body: { marketingConsent: boolean }
 *
 * Wires the audit log so every change is captured with IP + user-agent for
 * GDPR Art. 7(1) / DPDP §6(2) proof of consent.
 */
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from '@sveltejs/kit';
import { requirePanelist } from '$lib/server/auth/guards';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { recordConsent } from '$lib/server/email-consent';
import { getClientIP } from '$lib/server/geo-restriction';
import { Logger } from '$lib/utils/app-logger';

export const GET: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);
	const [row] = await db
		.select({
			marketingConsent: user.marketingConsent,
			marketingConsentAt: user.marketingConsentAt,
		})
		.from(user)
		.where(eq(user.id, authUser.id))
		.limit(1);

	return json({
		marketingConsent: row?.marketingConsent ?? false,
		marketingConsentAt: row?.marketingConsentAt?.toISOString() ?? null,
	});
};

const updateSchema = z.object({
	marketingConsent: z.boolean(),
});

export const POST: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) {
		throw error(400, parsed.error.issues[0]?.message ?? 'Invalid input');
	}

	try {
		await recordConsent(authUser.id, 'marketing', parsed.data.marketingConsent, {
			source: 'profile-page',
			ipAddress: getClientIP(event),
			userAgent: event.request.headers.get('user-agent') ?? null,
		});
		return json({ success: true, marketingConsent: parsed.data.marketingConsent });
	} catch (err) {
		Logger.root.error(
			{ context: 'consent', userId: authUser.id, error: err },
			'Failed to update marketing consent'
		);
		throw error(500, 'Failed to update preferences');
	}
};
