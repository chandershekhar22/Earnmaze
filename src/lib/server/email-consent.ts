/**
 * Email consent guards + audit log writer.
 *
 * Use canSendMarketing() BEFORE dispatching any non-transactional email:
 *
 *     if (await canSendMarketing(userId)) {
 *         await sendMarketingEmail(...);
 *     }
 *
 * Transactional email (OTP, password reset, redemption confirms) is operational
 * — it doesn't need a consent check. Don't gate it.
 *
 * The audit-log table accepts any string for `channel`, so adding a separate
 * 'newsletter' channel later won't require schema or function changes.
 */
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { user, emailConsentLog } from '$lib/db/schema/auth';
import { Logger } from '$lib/utils/app-logger';

// 'marketing' is the only channel currently routed through recordConsent().
// The underlying email_consent_log table also stores 'survey-data-sharing'
// rows (written directly from /api/panelist/survey-consent) and may host
// 'newsletter' in the future.
export type ConsentChannel = 'marketing';
export type ConsentSource =
	| 'register-form'
	| 'earn-points-form'
	| 'guest-upgrade-form'
	| 'forgot-password-flow'
	| 'profile-page'
	| 'unsubscribe-link'
	| 'admin-action';

interface ConsentContext {
	source: ConsentSource;
	ipAddress?: string | null;
	userAgent?: string | null;
}

/**
 * Set or update a user's consent for a given channel, and write an audit log
 * entry capturing when, how, and from where the change happened.
 */
export async function recordConsent(
	userId: string,
	channel: ConsentChannel,
	granted: boolean,
	context: ConsentContext
): Promise<void> {
	const now = new Date();

	await db
		.update(user)
		.set({
			marketingConsent: granted,
			marketingConsentAt: granted ? now : null,
			updatedAt: now,
		})
		.where(eq(user.id, userId));

	// Always log — both grants and revocations need to be auditable.
	try {
		await db.insert(emailConsentLog).values({
			userId,
			channel,
			granted,
			source: context.source,
			ipAddress: context.ipAddress ?? null,
			userAgent: context.userAgent ?? null,
		});
	} catch (err) {
		Logger.root.warn(
			{ context: 'consent', userId, channel, granted, error: err },
			'Failed to write consent audit log'
		);
	}
}

/** Returns true if the user has actively opted in to marketing email. */
export async function canSendMarketing(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ consent: user.marketingConsent, isActive: user.isActive })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return Boolean(row?.consent && row?.isActive);
}
