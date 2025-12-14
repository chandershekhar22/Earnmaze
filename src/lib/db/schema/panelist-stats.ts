import { pgTable, uuid, integer, timestamp, boolean, decimal, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

// Panelist statistics (derived/cached metrics)
export const panelistStats = pgTable("panelist_stats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  totalSurveysStarted: integer("total_surveys_started").default(0),
  totalSurveysCompleted: integer("total_surveys_completed").default(0),
  totalSurveysAbandoned: integer("total_surveys_abandoned").default(0),
  totalSurveysDisqualified: integer("total_surveys_disqualified").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0.00"),
  totalTimeSpent: integer("total_time_spent").default(0),
  averageTimePerSurvey: integer("average_time_per_survey").default(0),
  // Points metrics removed - query from points_transactions table instead
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
  index("panelist_stats_last_active_idx").on(table.lastActiveDate),
  index("panelist_stats_deleted_at_idx").on(table.deletedAt),
]);
