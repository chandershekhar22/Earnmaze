import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	text,
	index,
	pgEnum
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Guest Session Schema
 * 
 * Provides limited access for users who only provide email without full registration.
 * Guest sessions allow viewing available surveys and session-specific points tracking.
 * Users must complete full authentication to access complete history and redeem rewards.
 */

export const guestSessionStatusEnum = pgEnum("guest_session_status", [
	"active",
	"expired",
	"upgraded"  // When user completes full registration
]);

export const guestSession = pgTable("guest_sessions", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	email: varchar("email", { length: 255 }).notNull(),
	token: varchar("token", { length: 255 }).notNull().unique(), // Session token for authentication
	status: guestSessionStatusEnum("status").notNull().default("active"),
	
	// Session metadata
	expiresAt: timestamp("expires_at").notNull(), // Guest sessions expire after 24 hours
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	
	// Session-specific tracking (resets on new session)
	surveysViewed: integer("surveys_viewed").default(0),
	surveysCompleted: integer("surveys_completed").default(0),
	sessionPoints: integer("session_points").default(0), // Points earned in THIS session only
	
	// Upgrade tracking
	upgradedToUserId: uuid("upgraded_to_user_id"), // Reference when guest upgrades to full account
	upgradedAt: timestamp("upgraded_at"),
	
	// Browser fingerprint for preventing abuse
	fingerprint: varchar("fingerprint", { length: 255 }),
	
	// Audit fields
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => new Date())
		.notNull(),
	lastActivityAt: timestamp("last_activity_at")
		.$defaultFn(() => new Date())
		.notNull(),
}, (table) => [
	index("idx_guest_session_token").on(table.token),
	index("idx_guest_session_email").on(table.email),
	index("idx_guest_session_expires_at").on(table.expiresAt),
	index("idx_guest_session_status").on(table.status),
	index("idx_guest_session_fingerprint").on(table.fingerprint),
	index("idx_guest_session_email_expires").on(table.email, table.expiresAt),
	index("guest_sessions_email_idx").on(table.email),
	index("guest_sessions_token_idx").on(table.token),
	index("guest_sessions_status_idx").on(table.status),
	index("guest_sessions_expires_at_idx").on(table.expiresAt),
	index("guest_sessions_fingerprint_idx").on(table.fingerprint),
]);

/**
 * Guest Survey Activity
 * 
 * Tracks which surveys a guest has interacted with in their session.
 * This data is session-specific and helps prevent duplicate survey attempts.
 */
export const guestSurveyActivity = pgTable("guest_survey_activity", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	guestSessionId: uuid("guest_session_id")
		.notNull()
		.references(() => guestSession.id, { onDelete: "cascade" }),
	surveyTransactionId: integer("survey_transaction_id").notNull(), // Links to survey_transactions table
	
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => new Date())
		.notNull(),
}, (table) => [
	index("guest_activity_session_idx").on(table.guestSessionId),
	index("guest_activity_transaction_idx").on(table.surveyTransactionId),
]);
