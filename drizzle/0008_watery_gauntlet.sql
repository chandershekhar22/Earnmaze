CREATE TYPE "public"."survey_priority_enum" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
DROP INDEX "surveys_active_idx";--> statement-breakpoint
DROP INDEX "idx_survey_transaction_user_id";--> statement-breakpoint
DROP INDEX "survey_transactions_survey_id_idx";--> statement-breakpoint
DROP INDEX "survey_transactions_panelist_id_idx";--> statement-breakpoint
DROP INDEX "survey_transactions_status_idx";--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "priority" "survey_priority_enum" DEFAULT 'medium' NOT NULL;