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
    index("sessions_created_by_idx").on(table.createdBy),
    index("sessions_deleted_at_idx").on(table.deletedAt),
]);