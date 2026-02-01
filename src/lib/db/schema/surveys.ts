import { pgTable, uuid, varchar, integer, text, timestamp, boolean, decimal, index, uniqueIndex, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { is, sql } from "drizzle-orm";
import { user } from "./auth";

// Enums for status fields
export const surveyStatusEnum = pgEnum("survey_status_enum", ["available", "draft", "archived", "closed", "pending"]);
export const invitationStatusEnum = pgEnum("invitation_status_enum", ["sent", "opened", "clicked", "qualified", "expired"]);
export const completionStatusEnum = pgEnum("completion_status_enum", ["started", "completed", "terminated", "disqualified", "quota_full"]);

// Survey metadata cache - surveys fetched from external survey portal
export const survey = pgTable("surveys", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    points: integer("points").notNull().default(100),
    isActive: boolean("is_active").default(true).notNull(),
    link: text("link").notNull(),
    isDeleted: boolean("is_deleted").default(false),
    createdBy: uuid("created_by"),
    updatedBy: uuid("updated_by"),
    deletedBy: uuid("deleted_by"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    deletedAt: timestamp("deleted_at"),
    archivedAt: timestamp("archived_at"),
}, (table) => [
    index("idx_survey_is_active").on(table.isActive),
    index("idx_survey_created_at").on(table.createdAt),
    index("surveys_active_idx").on(table.isActive),
    index("surveys_points_idx").on(table.points),
    index("surveys_created_by_idx").on(table.createdBy),
    index("surveys_deleted_at_idx").on(table.deletedAt),
]);

export const surveyTransaction = pgTable("survey_transactions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    panelistId: uuid("panelist_id").notNull().references(() => user.id, { onDelete: "no action" }),
    surveyId: uuid("survey_id").notNull().references(() => survey.id, { onDelete: "no action" }),
    respondentId: varchar("respondent_id", { length: 64 }), // NanoID from external survey system
    status: completionStatusEnum("status").notNull().default("started"),
    awardedPoints: integer("awarded_points").default(0),
    startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
    index("idx_survey_transaction_user_id").on(table.panelistId),
    index("idx_survey_transaction_survey_id").on(table.surveyId),
    index("idx_survey_transaction_status").on(table.status),
    index("idx_survey_transaction_started_at").on(table.startedAt),
    index("idx_survey_transaction_completed_at").on(table.completedAt),
    index("idx_survey_transaction_user_survey").on(table.panelistId, table.surveyId),
    index("idx_survey_transaction_user_status").on(table.panelistId, table.status),
    index("survey_transactions_survey_id_idx").on(table.surveyId),
    index("survey_transactions_panelist_id_idx").on(table.panelistId),
    index("survey_transactions_status_idx").on(table.status),
]);

export const surveyTransactionDetails = pgTable("survey_transaction_details", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    surveyTransactionId: integer("survey_transaction_id").notNull().references(() => surveyTransaction.id, { onDelete: "cascade" }),
    deviceType: varchar("device_type", { length: 50 }),
    browserInfo: text("browser_info"),
    ipAddress: varchar("ip_address", { length: 45 }),
    location: text("location"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
    index("survey_transaction_details_survey_transaction_id_idx").on(table.surveyTransactionId),
]);
// ...existing code for surveyLogic, surveyAvailability, etc. can be similarly refactored if needed...