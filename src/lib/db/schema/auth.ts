import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    integer,
    pgEnum,
    index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define enum for user types
export const userTypeEnum = pgEnum("user_type_enum", [
    "admin",
    "panelist",
    "client",
    "moderator",
]);

// Enums
export const userStatusEnum = pgEnum("user_status_enum", [
  "active", "suspended", "banned", "inactive", "pending_verification"
]);

export const user = pgTable("users", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"),
    isPasswordSet: boolean("is_password_set").default(false).notNull(),
    emailVerified: boolean("email_verified")
        .$defaultFn(() => false)
        .notNull(),
    image: text("image"),
    userType: userTypeEnum("user_type").notNull(),
    registrationSource: varchar("registration_source", { length: 100 }),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    lastLoginAt: timestamp("last_login_at"),
    loginCount: integer("login_count").default(0),
    referralCode: varchar("referral_code", { length: 20 }).unique(),
    referredBy: uuid("referred_by"),
    // Email consent — GDPR/CAN-SPAM compliance.
    // Transactional email (OTP, password reset, redemption) is always allowed
    // for active users; only marketing needs explicit opt-in. The audit-log
    // table's `channel` column can hold other channels later (e.g. 'newsletter')
    // without a schema migration.
    marketingConsent: boolean("marketing_consent").default(false).notNull(),
    marketingConsentAt: timestamp("marketing_consent_at"),
    // Age + legal acceptance — required at signup. ToS/Privacy timestamps
    // double as proof that the user clicked through the current version
    // (when you publish a new version, force re-acceptance by clearing).
    ageVerified: boolean("age_verified").default(false).notNull(),
    ageVerifiedAt: timestamp("age_verified_at"),
    tosAcceptedAt: timestamp("tos_accepted_at"),
    privacyAcceptedAt: timestamp("privacy_accepted_at"),
    // GDPR Art. 6/7 — informed consent before sharing demographic data with
    // external survey providers. Null = never accepted, value = acceptance date.
    surveyDataSharingAcceptedAt: timestamp("survey_data_sharing_accepted_at"),
    isActive: boolean("is_active").default(true).notNull(),
    status: userStatusEnum("status").notNull().default("active"),
    isDeleted: boolean("is_deleted").default(false),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
    deletedAt: timestamp("deleted_at"),
}, (table) => [
    index("idx_user_email").on(table.email),
    index("idx_user_user_type").on(table.userType),
    index("idx_user_is_active").on(table.isActive),
    index("idx_user_status").on(table.status),
    index("idx_user_created_at").on(table.createdAt),
    index("idx_user_referral_code").on(table.referralCode),
    index("idx_user_user_type_active").on(table.userType, table.isActive),
    index("idx_user_status_active").on(table.status, table.isActive),
    index("users_created_by_idx").on(table.createdBy),
    index("users_deleted_at_idx").on(table.deletedAt),
]);

export const userRelations = {
    referredBy: {
        fields: [user.referredBy],
        references: [user.id],
    },
};

export const session = pgTable("sessions", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
    deletedAt: timestamp("deleted_at"),
}, (table) => [
    index("idx_session_user_id").on(table.userId),
    index("idx_session_expires_at").on(table.expiresAt),
    index("idx_session_token").on(table.token),
    index("sessions_created_by_idx").on(table.createdBy),
    index("sessions_deleted_at_idx").on(table.deletedAt),
]);

export const passwordReset = pgTable("password_resets", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    usedAt: timestamp("used_at"),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    deletedAt: timestamp("deleted_at"),
}, (table) => [
    index("password_resets_user_id_idx").on(table.userId),
    index("password_resets_token_idx").on(table.token),
    index("password_resets_expires_at_idx").on(table.expiresAt),
]);

// Email-consent audit log — proof of when each user granted/revoked consent
// for each channel. Required by GDPR Art. 7(1) and Indian DPDP Act §6(2).
export const emailConsentLog = pgTable("email_consent_log", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    // Logical channel name. Known values today: 'marketing', 'survey-data-sharing'.
    // Reserved future values: 'newsletter', 'transactional-receipts'. Keep this
    // generous so a future migration isn't needed when channels are added.
    channel: varchar("channel", { length: 50 }).notNull(),
    granted: boolean("granted").notNull(),
    source: varchar("source", { length: 50 }),  // 'register-form' | 'profile-page' | 'unsubscribe-link' | etc.
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => [
    index("email_consent_log_user_id_idx").on(table.userId),
    index("email_consent_log_channel_idx").on(table.channel),
    index("email_consent_log_created_at_idx").on(table.createdAt),
]);