import { pgTable, uuid, varchar, integer, timestamp, boolean, decimal, index, uniqueIndex, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const panelistStatusEnum = pgEnum("panelist_status_enum", [
  "active", "suspended", "banned", "inactive", "pending_verification"
]);
export const panelistTierEnum = pgEnum("panelist_tier_enum", [
  "bronze", "silver", "gold", "platinum", "diamond"
]);
export const privacyLevelEnum = pgEnum("privacy_level_enum", [
  "standard", "strict", "gdpr", "custom"
]);

// Core panelist table
export const panelist = pgTable("panelists", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique(),
  status: panelistStatusEnum("status").notNull().default("active"),
  tier: panelistTierEnum("tier").default("bronze"),
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredBy: uuid("referred_by"),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
  consentGiven: timestamp("consent_given"),
  dataRetentionExpiresAt: timestamp("data_retention_expires_at"),
}, (table) => [
  uniqueIndex("panelists_user_id_idx").on(table.userId),
  uniqueIndex("panelists_referral_code_idx").on(table.referralCode),
  index("panelists_status_idx").on(table.status),
  index("panelists_tier_idx").on(table.tier),
  index("panelists_referred_by_idx").on(table.referredBy),
  index("panelists_deleted_at_idx").on(table.deletedAt),
  index("panelists_created_at_idx").on(table.createdAt),
]);

// Panelist points
export const panelistPoint = pgTable("panelist_points", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  currentPoints: integer("current_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  pendingPoints: integer("pending_points").notNull().default(0),
  redeemedPoints: integer("redeemed_points").notNull().default(0),
  bonusPoints: integer("bonus_points").default(0),
  tierProgress: integer("tier_progress").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_points_panelist_id_idx").on(table.panelistId),
  index("panelist_points_current_idx").on(table.currentPoints),
  index("panelist_points_lifetime_idx").on(table.lifetimePoints),
  index("panelist_points_deleted_at_idx").on(table.deletedAt),
]);

// Panelist verification
export const panelistVerification = pgTable("panelist_verification", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  identityVerified: boolean("identity_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  addressVerified: boolean("address_verified").default(false),
  verificationData: jsonb("verification_data"),
  verificationAttempts: integer("verification_attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  verifiedAt: timestamp("verified_at"),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("panelist_verification_status_idx").on(table.status),
  index("panelist_verification_identity_idx").on(table.identityVerified),
  index("panelist_verification_phone_idx").on(table.phoneVerified),
  index("panelist_verification_email_idx").on(table.emailVerified),
  index("panelist_verification_deleted_at_idx").on(table.deletedAt),
]);

// Panelist quality metrics
export const panelistQuality = pgTable("panelist_quality", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  qualityScore: integer("quality_score").default(100).notNull(),
  qualityFlags: integer("quality_flags").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  suspensionCount: integer("suspension_count").default(0),
  consistencyScore: integer("consistency_score").default(100),
  responseQualityScore: integer("response_quality_score").default(100),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_quality_panelist_id_idx").on(table.panelistId),
  index("panelist_quality_score_idx").on(table.qualityScore),
  index("panelist_quality_flags_idx").on(table.qualityFlags),
  index("panelist_quality_rating_idx").on(table.averageRating),
  index("panelist_quality_deleted_at_idx").on(table.deletedAt),
  sql`CHECK (quality_score >= 0 AND quality_score <= 100)`,
  sql`CHECK (consistency_score >= 0 AND consistency_score <= 100)`,
  sql`CHECK (response_quality_score >= 0 AND response_quality_score <= 100)`
]);

// Panelist engagement metrics
export const panelistEngagement = pgTable("panelist_engagement", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  streakDays: integer("streak_days").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalActiveDays: integer("total_active_days").default(0),
  lastActiveAt: timestamp("last_active_at"),
  lastSurveyAt: timestamp("last_survey_at"),
  totalSurveys: integer("total_surveys").default(0),
  completedSurveys: integer("completed_surveys").default(0),
  disqualifiedSurveys: integer("disqualified_surveys").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0.00"),
  averageTimePerSurvey: integer("average_time_per_survey").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_engagement_panelist_id_idx").on(table.panelistId),
  index("panelist_engagement_streak_idx").on(table.streakDays),
  index("panelist_engagement_last_active_idx").on(table.lastActiveAt),
  index("panelist_engagement_completion_rate_idx").on(table.completionRate),
  index("panelist_engagement_total_surveys_idx").on(table.totalSurveys),
  index("panelist_engagement_deleted_at_idx").on(table.deletedAt),
]);

// Panelist preferences
export const panelistPreferences = pgTable("panelist_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
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
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_preferences_panelist_id_idx").on(table.panelistId),
  index("panelist_preferences_timezone_idx").on(table.timezone),
  index("panelist_preferences_locale_idx").on(table.locale),
  index("panelist_preferences_language_idx").on(table.preferredLanguage),
  index("panelist_preferences_privacy_idx").on(table.privacyLevel),
  index("panelist_preferences_deleted_at_idx").on(table.deletedAt),
]);

// Panelist demographics
export const panelistDemographics = pgTable("panelist_demographics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 20 }),
  maritalStatus: varchar("marital_status", { length: 20 }),
  ethnicity: varchar("ethnicity", { length: 50 }),
  hasChildren: boolean("has_children").default(false),
  childrenAges: jsonb("children_ages"),
  householdSize: integer("household_size"),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_demographics_panelist_id_idx").on(table.panelistId),
  index("panelist_demographics_gender_idx").on(table.gender),
  index("panelist_demographics_dob_idx").on(table.dateOfBirth),
  index("panelist_demographics_marital_idx").on(table.maritalStatus),
  index("panelist_demographics_ethnicity_idx").on(table.ethnicity),
  index("panelist_demographics_deleted_at_idx").on(table.deletedAt),
]);

// Panelist geography
export const panelistGeography = pgTable("panelist_geography", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 100 }),
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  timeZone: varchar("time_zone", { length: 50 }),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_geography_panelist_id_idx").on(table.panelistId),
  index("panelist_geography_country_idx").on(table.country),
  index("panelist_geography_state_idx").on(table.state),
  index("panelist_geography_city_idx").on(table.city),
  index("panelist_geography_location_idx").on(table.country, table.state, table.city),
  index("panelist_geography_coordinates_idx").on(table.latitude, table.longitude),
  index("panelist_geography_deleted_at_idx").on(table.deletedAt),
]);

// Panelist professional
export const panelistProfessional = pgTable("panelist_professional", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  education: varchar("education", { length: 100 }),
  employment: varchar("employment", { length: 100 }),
  occupation: varchar("occupation", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  workExperience: integer("work_experience"),
  income: varchar("income", { length: 50 }),
  householdIncome: varchar("household_income", { length: 50 }),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_professional_panelist_id_idx").on(table.panelistId),
  index("panelist_professional_education_idx").on(table.education),
  index("panelist_professional_employment_idx").on(table.employment),
  index("panelist_professional_occupation_idx").on(table.occupation),
  index("panelist_professional_industry_idx").on(table.industry),
  index("panelist_professional_income_idx").on(table.income),
  index("panelist_professional_household_income_idx").on(table.householdIncome),
  index("panelist_professional_deleted_at_idx").on(table.deletedAt),
]);

// Panelist lifestyle
export const panelistLifestyle = pgTable("panelist_lifestyle", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
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
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_lifestyle_panelist_id_idx").on(table.panelistId),
  index("panelist_lifestyle_internet_usage_idx").on(table.internetUsage),
  index("panelist_lifestyle_travel_idx").on(table.travelFrequency),
  index("panelist_lifestyle_deleted_at_idx").on(table.deletedAt),
]);

// Panelist statistics
export const panelistStats = pgTable("panelist_stats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  totalSurveysStarted: integer("total_surveys_started").default(0),
  totalSurveysCompleted: integer("total_surveys_completed").default(0),
  totalSurveysAbandoned: integer("total_surveys_abandoned").default(0),
  totalSurveysDisqualified: integer("total_surveys_disqualified").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0.00"),
  totalTimeSpent: integer("total_time_spent").default(0),
  averageTimePerSurvey: integer("average_time_per_survey").default(0),
  totalPointsEarned: integer("total_points_earned").default(0),
  totalPointsRedeemed: integer("total_points_redeemed").default(0),
  totalBonusPoints: integer("total_bonus_points").default(0),
  averagePointsPerSurvey: decimal("average_points_per_survey", { precision: 8, scale: 2 }).default("0.00"),
  averageQualityRating: decimal("average_quality_rating", { precision: 3, scale: 2 }).default("0.00"),
  qualityFlagsReceived: integer("quality_flags_received").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActiveDate: timestamp("last_active_date"),
  totalActiveDays: integer("total_active_days").default(0),
  totalReferrals: integer("total_referrals").default(0),
  successfulReferrals: integer("successful_referrals").default(0),
  currentMonthSurveys: integer("current_month_surveys").default(0),
  currentMonthPoints: integer("current_month_points").default(0),
  lastCalculated: timestamp("last_calculated").default(sql`CURRENT_TIMESTAMP`),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("panelist_stats_panelist_id_idx").on(table.panelistId),
  index("panelist_stats_completion_rate_idx").on(table.completionRate),
  index("panelist_stats_quality_rating_idx").on(table.averageQualityRating),
  index("panelist_stats_streak_idx").on(table.currentStreak),
  index("panelist_stats_points_earned_idx").on(table.totalPointsEarned),
  index("panelist_stats_last_active_idx").on(table.lastActiveDate),
  index("panelist_stats_deleted_at_idx").on(table.deletedAt),
]);

// Panelist segments
export const panelistSegments = pgTable("panelist_segments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => panelist.id, { onDelete: "cascade" }),
  segmentName: varchar("segment_name", { length: 100 }).notNull(),
  segmentType: varchar("segment_type", { length: 50 }).notNull(),
  segmentValue: varchar("segment_value", { length: 100 }).notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"),
  source: varchar("source", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  isDeleted: boolean("is_deleted").default(false),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("panelist_segments_panelist_id_idx").on(table.panelistId),
  index("panelist_segments_name_idx").on(table.segmentName),
  index("panelist_segments_type_idx").on(table.segmentType),
  index("panelist_segments_value_idx").on(table.segmentValue),
  index("panelist_segments_active_idx").on(table.isActive),
  index("panelist_segments_source_idx").on(table.source),
  index("panelist_segments_targeting_idx").on(table.segmentType, table.segmentValue, table.isActive),
  index("panelist_segments_panelist_active_idx").on(table.panelistId, table.isActive),
  index("panelist_segments_deleted_at_idx").on(table.deletedAt),
]);
