import { pgTable, uuid, varchar, integer, timestamp, boolean, decimal, index, uniqueIndex, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const panelistTierEnum = pgEnum("panelist_tier_enum", [
  "bronze", "silver", "gold", "platinum", "diamond"
]);

export const privacyLevelEnum = pgEnum("privacy_level_enum", [
  "standard", "strict", "gdpr", "custom"
]);

// Panelist quality metrics
export const panelistQuality = pgTable("panelist_quality", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  tier: panelistTierEnum("tier").default("bronze"),
  qualityScore: integer("quality_score").default(100).notNull(),
  qualityFlags: integer("quality_flags").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  suspensionCount: integer("suspension_count").default(0),
  consistencyScore: integer("consistency_score").default(100),
  responseQualityScore: integer("response_quality_score").default(100),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_quality_panelist_id_idx").on(table.panelistId),
  sql`CHECK (quality_score >= 0 AND quality_score <= 100)`,
  sql`CHECK (consistency_score >= 0 AND consistency_score <= 100)`,
  sql`CHECK (response_quality_score >= 0 AND response_quality_score <= 100)`
]);

// Panelist preferences
export const panelistPreferences = pgTable("panelist_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 10 }).default("en"),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  secondaryLanguages: jsonb("secondary_languages"),
  communicationChannel: varchar("communication_channel", { length: 20 }).default("email"),
  notificationFrequency: varchar("notification_frequency", { length: 20 }).default("daily"),
  notificationChannels: jsonb("notification_channels"),
  notificationOptIn: boolean("notification_opt_in").default(true),
  maxSurveysPerWeek: integer("max_surveys_per_week").default(10),
  preferredSurveyLength: varchar("preferred_survey_length", { length: 20 }),
  preferredSurveyTime: varchar("preferred_survey_time", { length: 50 }),
  surveyTopicsInterest: jsonb("survey_topics_interest"),
  privacyLevel: privacyLevelEnum("privacy_level").default("standard"),
  dataSharing: boolean("data_sharing").default(true),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_preferences_panelist_id_idx").on(table.panelistId),
]);

// Panelist demographics
export const panelistDemographics = pgTable("panelist_demographics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 20 }),
  maritalStatus: varchar("marital_status", { length: 20 }),
  ethnicity: varchar("ethnicity", { length: 50 }),
  hasChildren: boolean("has_children").default(false),
  childrenAges: jsonb("children_ages"),
  householdSize: integer("household_size"),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_demographics_panelist_id_idx").on(table.panelistId),
  index("panelist_demographics_gender_idx").on(table.gender),
  index("panelist_demographics_dob_idx").on(table.dateOfBirth),
  index("panelist_demographics_marital_idx").on(table.maritalStatus),
  index("panelist_demographics_ethnicity_idx").on(table.ethnicity),
]);

// Panelist geography
export const panelistGeography = pgTable("panelist_geography", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 100 }),
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  timeZone: varchar("time_zone", { length: 50 }),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_geography_panelist_id_idx").on(table.panelistId),
  index("panelist_geography_country_idx").on(table.country),
]);

// Panelist professional
export const panelistProfessional = pgTable("panelist_professional", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  education: varchar("education", { length: 100 }),
  employment: varchar("employment", { length: 100 }),
  occupation: varchar("occupation", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  workExperience: integer("work_experience"),
  income: varchar("income", { length: 50 }),
  householdIncome: varchar("household_income", { length: 50 }),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_professional_panelist_id_idx").on(table.panelistId),
  index("panelist_professional_education_idx").on(table.education),
  index("panelist_professional_employment_idx").on(table.employment),
  index("panelist_professional_occupation_idx").on(table.occupation),
  index("panelist_professional_industry_idx").on(table.industry),
  index("panelist_professional_income_idx").on(table.income),
  index("panelist_professional_household_income_idx").on(table.householdIncome),
]);

// Panelist lifestyle
export const panelistLifestyle = pgTable("panelist_lifestyle", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  deviceTypes: jsonb("device_types"),
  internetUsage: varchar("internet_usage", { length: 50 }),
  socialMediaUsage: jsonb("social_media_usage"),
  shoppingHabits: jsonb("shopping_habits"),
  mediaConsumption: jsonb("media_consumption"),
  interests: jsonb("interests"),
  lifestyle: jsonb("lifestyle"),
  brands: jsonb("brands"),
  travelFrequency: varchar("travel_frequency", { length: 20 }),
  healthWellness: jsonb("health_wellness"),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_lifestyle_panelist_id_idx").on(table.panelistId),
  index("panelist_lifestyle_internet_usage_idx").on(table.internetUsage),
  index("panelist_lifestyle_travel_idx").on(table.travelFrequency),
]);
