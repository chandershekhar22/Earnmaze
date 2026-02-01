import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	integer,
	index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { guestSession } from './guest-sessions';

/**
 * Guest Upgrade Verification
 *
 * Stores OTP verification state for upgrading a guest session into a full account.
 *
 * Notes:
 * - OTPs are stored as hashes (never plaintext)
 * - Tokens are short-lived and one-time use
 */
export const guestUpgradeVerification = pgTable(
	'guest_upgrade_verifications',
	{
		id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
		guestSessionId: uuid('guest_session_id')
			.notNull()
			.references(() => guestSession.id, { onDelete: 'cascade' }),
		email: varchar('email', { length: 255 }).notNull(),

		otpHash: varchar('otp_hash', { length: 255 }).notNull(),
		otpExpiresAt: timestamp('otp_expires_at').notNull(),
		otpAttempts: integer('otp_attempts').notNull().default(0),
		otpVerifiedAt: timestamp('otp_verified_at'),
		otpSentAt: timestamp('otp_sent_at').notNull().defaultNow(), // Track when OTP was sent for rate limiting

		upgradeToken: varchar('upgrade_token', { length: 255 }).unique(),
		upgradeTokenExpiresAt: timestamp('upgrade_token_expires_at'),

		createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
		updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
	},
	(table) => [
		index('guest_upgrade_verifications_session_idx').on(table.guestSessionId),
		index('guest_upgrade_verifications_email_idx').on(table.email),
		index('guest_upgrade_verifications_token_idx').on(table.upgradeToken),
		index('guest_upgrade_verifications_otp_expires_idx').on(table.otpExpiresAt),
	]
);
