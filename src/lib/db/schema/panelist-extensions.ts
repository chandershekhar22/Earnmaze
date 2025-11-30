import { pgTable, uuid, varchar, integer, text, timestamp, boolean, decimal, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Panelist profile completion (previously respondent_profile_completion)
export const panelistProfileCompletion = pgTable("panelist_profile_completion", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique(),
  overallCompletion: integer("overall_completion").default(0),
  demographicsCompletion: integer("demographics_completion").default(0),
  geographyCompletion: integer("geography_completion").default(0),
  professionalCompletion: integer("professional_completion").default(0),
  lifestyleCompletion: integer("lifestyle_completion").default(0),
  preferencesCompletion: integer("preferences_completion").default(0),
  lastCalculated: timestamp("last_calculated").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex("panelist_profile_completion_panelist_id_idx").on(t.panelistId),
  index("panelist_profile_completion_overall_idx").on(t.overallCompletion),
]);

// Panelist custom fields
export const panelistCustomFields = pgTable("panelist_custom_fields", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldType: varchar("field_type", { length: 20 }).notNull(),
  fieldValue: text("field_value"),
  category: varchar("category", { length: 50 }),
  isPublic: boolean("is_public").default(false),
  source: varchar("source", { length: 50 }).default('user_input'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex("panelist_custom_fields_panelist_field_idx").on(t.panelistId, t.fieldName),
  index("panelist_custom_fields_field_name_idx").on(t.fieldName),
]);

// Panelist devices
export const panelistDevices = pgTable("panelist_devices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull(),
  deviceType: varchar("device_type", { length: 20 }).notNull(),
  operatingSystem: varchar("operating_system", { length: 50 }),
  browser: varchar("browser", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 20 }),
    userAgent: varchar("user_agent", { length: 256 }),
  preferredDevice: boolean("preferred_device").default(false),
  usageCount: integer("usage_count").default(1),
  lastUsedAt: timestamp("last_used_at").default(sql`CURRENT_TIMESTAMP`),
  firstUsedAt: timestamp("first_used_at").default(sql`CURRENT_TIMESTAMP`),
  isActive: boolean("is_active").default(true),
}, (t) => [
  index("panelist_devices_panelist_id_idx").on(t.panelistId),
  index("panelist_devices_device_type_idx").on(t.deviceType),
]);

// Panelist response patterns
export const panelistResponsePatterns = pgTable("panelist_response_patterns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull(),
  averageResponseTime: decimal("average_response_time", { precision: 8, scale: 2 }).default('0.00'),
  fastResponseCount: integer("fast_response_count").default(0),
  slowResponseCount: integer("slow_response_count").default(0),
  straightLineResponses: integer("straight_line_responses").default(0),
  inconsistentResponses: integer("inconsistent_responses").default(0),
  skipPatternViolations: integer("skip_pattern_violations").default(0),
  attentionChecksPassed: integer("attention_checks_passed").default(0),
  attentionChecksFailed: integer("attention_checks_failed").default(0),
  attentionCheckAccuracy: decimal("attention_check_accuracy", { precision: 5, scale: 2 }).default('100.00'),
  averageTextLength: integer("average_text_length").default(0),
  shortTextResponses: integer("short_text_responses").default(0),
  duplicateTextResponses: integer("duplicate_text_responses").default(0),
  lastCalculated: timestamp("last_calculated").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex("panelist_response_patterns_panelist_id_idx").on(t.panelistId),
  index("panelist_response_patterns_avg_time_idx").on(t.averageResponseTime),
]);

// Panelist status history
export const panelistStatusHistory = pgTable("panelist_status_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull(),
  previousStatus: varchar("previous_status", { length: 32 }),
  newStatus: varchar("new_status", { length: 32 }).notNull(),
  reason: varchar("reason", { length: 100 }),
  changedBy: uuid("changed_by"),
  notes: text("notes"),
  automaticChange: boolean("automatic_change").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index("panelist_status_history_panelist_id_idx").on(t.panelistId),
  index("panelist_status_history_new_status_idx").on(t.newStatus),
]);

// Panelist tags
export const panelistTags = pgTable("panelist_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull(),
  tagName: varchar("tag_name", { length: 100 }).notNull(),
  tagType: varchar("tag_type", { length: 50 }).notNull(),
  tagValue: varchar("tag_value", { length: 200 }),
  assignedBy: uuid("assigned_by"),
  source: varchar("source", { length: 50 }).default('manual'),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index("panelist_tags_panelist_id_idx").on(t.panelistId),
  index("panelist_tags_tag_name_idx").on(t.tagName),
]);
