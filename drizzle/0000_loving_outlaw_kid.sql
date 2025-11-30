CREATE TYPE "public"."user_type_enum" AS ENUM('admin', 'panelist', 'client', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."completion_status_enum" AS ENUM('started', 'completed', 'submitted', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."invitation_status_enum" AS ENUM('sent', 'opened', 'clicked', 'qualified', 'expired');--> statement-breakpoint
CREATE TYPE "public"."survey_status_enum" AS ENUM('available', 'draft', 'archived', 'closed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."panelist_status_enum" AS ENUM('active', 'suspended', 'banned', 'inactive', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."panelist_tier_enum" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."privacy_level_enum" AS ENUM('standard', 'strict', 'gdpr', 'custom');--> statement-breakpoint
CREATE TYPE "public"."points_transaction_type_enum" AS ENUM('earned', 'redeemed', 'bonus', 'penalty', 'adjustment', 'refund', 'expired');--> statement-breakpoint
CREATE TYPE "public"."redemption_type_enum" AS ENUM('paypal', 'gift_card', 'bank_transfer', 'crypto', 'cash', 'voucher');--> statement-breakpoint
CREATE TYPE "public"."reward_type_enum" AS ENUM('gift_card', 'cash', 'product', 'discount', 'experience');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"user_type" "user_type_enum" NOT NULL,
	"registration_source" varchar(100),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"last_login_at" timestamp,
	"login_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(100) NOT NULL,
	"source_portal" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"points" integer DEFAULT 100 NOT NULL,
	"estimated_minutes" integer DEFAULT 5 NOT NULL,
	"category" varchar(100) NOT NULL,
	"tags" jsonb,
	"status" "survey_status_enum" DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"target_audience" text,
	"screening_questions" jsonb,
	"qualifications" jsonb,
	"excluded_panelists" jsonb,
	"max_completions" integer,
	"current_completions" integer DEFAULT 0,
	"panel_quota" integer,
	"completion_rate" numeric(5, 2) DEFAULT '0.00',
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"average_completion_time" integer,
	"quality_score" integer DEFAULT 100,
	"is_public" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false,
	"auto_assign" boolean DEFAULT false,
	"allow_reentries" boolean DEFAULT false,
	"external_url" varchar(500),
	"available_from" timestamp,
	"available_until" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"panelist_id" uuid NOT NULL,
	"invitation_type" varchar(32) DEFAULT 'targeted' NOT NULL,
	"invitation_method" varchar(32) DEFAULT 'email' NOT NULL,
	"status" "invitation_status_enum" DEFAULT 'sent' NOT NULL,
	"targeting_reason" text,
	"qualification_status" varchar(32),
	"disqualification_reason" text,
	"sent_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"qualified_at" timestamp,
	"expires_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer_url" varchar(500),
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"external_question_id" varchar(100),
	"type" varchar(50) NOT NULL,
	"question" text NOT NULL,
	"description" text,
	"is_screening" boolean DEFAULT false,
	"screening_criteria" jsonb,
	"options" jsonb,
	"required" boolean DEFAULT true,
	"order" integer NOT NULL,
	"validation" text,
	"disqualify_values" jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"survey_id" uuid NOT NULL,
	"status" "completion_status_enum" DEFAULT 'started' NOT NULL,
	"awarded_points" integer DEFAULT 0,
	"bonus_points" integer DEFAULT 0,
	"quality_rating" integer,
	"time_spent_seconds" integer,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp,
	"submitted_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_transaction_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"panelist_id" uuid NOT NULL,
	"device_type" varchar(50),
	"browser_info" text,
	"ip_address" varchar(45),
	"location" text,
	"user_agent" text,
	"referrer_url" varchar(500),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"metadata" jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "panelists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "panelist_status_enum" DEFAULT 'active' NOT NULL,
	"tier" "panelist_tier_enum" DEFAULT 'bronze',
	"referral_code" varchar(20),
	"referred_by" uuid,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"consent_given" timestamp,
	"data_retention_expires_at" timestamp,
	CONSTRAINT "panelists_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "panelists_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "panelist_demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"date_of_birth" timestamp,
	"gender" varchar(20),
	"marital_status" varchar(20),
	"ethnicity" varchar(50),
	"has_children" boolean DEFAULT false,
	"children_ages" jsonb,
	"household_size" integer,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_demographics_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_engagement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"streak_days" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"total_active_days" integer DEFAULT 0,
	"last_active_at" timestamp,
	"last_survey_at" timestamp,
	"total_surveys" integer DEFAULT 0,
	"completed_surveys" integer DEFAULT 0,
	"disqualified_surveys" integer DEFAULT 0,
	"completion_rate" numeric(5, 2) DEFAULT '0.00',
	"average_time_per_survey" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_engagement_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_geography" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"country" varchar(100),
	"state" varchar(100),
	"city" varchar(100),
	"zip_code" varchar(20),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"time_zone" varchar(50),
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_geography_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_lifestyle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"device_types" jsonb,
	"internet_usage" varchar(50),
	"social_media_usage" jsonb,
	"shopping_habits" jsonb,
	"media_consumption" jsonb,
	"interests" jsonb,
	"lifestyle" jsonb,
	"brands" jsonb,
	"travel_frequency" varchar(20),
	"health_wellness" jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_lifestyle_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"current_points" integer DEFAULT 0 NOT NULL,
	"lifetime_points" integer DEFAULT 0 NOT NULL,
	"pending_points" integer DEFAULT 0 NOT NULL,
	"redeemed_points" integer DEFAULT 0 NOT NULL,
	"bonus_points" integer DEFAULT 0,
	"tier_progress" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_points_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC',
	"locale" varchar(10) DEFAULT 'en',
	"preferred_language" varchar(10) DEFAULT 'en',
	"secondary_languages" jsonb,
	"communication_channel" varchar(20) DEFAULT 'email',
	"notification_frequency" varchar(20) DEFAULT 'daily',
	"notification_channels" jsonb,
	"notification_opt_in" boolean DEFAULT true,
	"max_surveys_per_week" integer DEFAULT 10,
	"preferred_survey_length" varchar(20),
	"preferred_survey_time" varchar(50),
	"survey_topics_interest" jsonb,
	"privacy_level" "privacy_level_enum" DEFAULT 'standard',
	"data_sharing" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_preferences_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_professional" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"education" varchar(100),
	"employment" varchar(100),
	"occupation" varchar(100),
	"industry" varchar(100),
	"company_size" varchar(50),
	"work_experience" integer,
	"income" varchar(50),
	"household_income" varchar(50),
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_professional_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_quality" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"quality_score" integer DEFAULT 100 NOT NULL,
	"quality_flags" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"suspension_count" integer DEFAULT 0,
	"consistency_score" integer DEFAULT 100,
	"response_quality_score" integer DEFAULT 100,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_quality_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"segment_name" varchar(100) NOT NULL,
	"segment_type" varchar(50) NOT NULL,
	"segment_value" varchar(100) NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.00',
	"source" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_segments_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"total_surveys_started" integer DEFAULT 0,
	"total_surveys_completed" integer DEFAULT 0,
	"total_surveys_abandoned" integer DEFAULT 0,
	"total_surveys_disqualified" integer DEFAULT 0,
	"completion_rate" numeric(5, 2) DEFAULT '0.00',
	"total_time_spent" integer DEFAULT 0,
	"average_time_per_survey" integer DEFAULT 0,
	"total_points_earned" integer DEFAULT 0,
	"total_points_redeemed" integer DEFAULT 0,
	"total_bonus_points" integer DEFAULT 0,
	"average_points_per_survey" numeric(8, 2) DEFAULT '0.00',
	"average_quality_rating" numeric(3, 2) DEFAULT '0.00',
	"quality_flags_received" integer DEFAULT 0,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_active_date" timestamp,
	"total_active_days" integer DEFAULT 0,
	"total_referrals" integer DEFAULT 0,
	"successful_referrals" integer DEFAULT 0,
	"current_month_surveys" integer DEFAULT 0,
	"current_month_points" integer DEFAULT 0,
	"last_calculated" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_stats_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"identity_verified" boolean DEFAULT false,
	"phone_verified" boolean DEFAULT false,
	"email_verified" boolean DEFAULT false,
	"address_verified" boolean DEFAULT false,
	"verification_data" jsonb,
	"verification_attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp,
	"verified_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "panelist_verification_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "points_expiry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar(32) DEFAULT 'active',
	"expired_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"type" "points_transaction_type_enum" NOT NULL,
	"category" varchar(50),
	"amount" integer NOT NULL,
	"balance" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(32),
	"status" varchar(32) DEFAULT 'completed',
	"expires_at" timestamp,
	"metadata" jsonb,
	"admin_notes" text,
	"processed_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"type" "redemption_type_enum" NOT NULL,
	"provider" varchar(50),
	"amount" integer NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"exchange_rate" numeric(10, 4) DEFAULT '0.01',
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"payment_details" jsonb,
	"recipient_info" jsonb,
	"transaction_id" varchar(100),
	"fees" numeric(8, 2) DEFAULT '0.00',
	"net_amount" numeric(10, 2),
	"processing_notes" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"is_test_redemption" boolean DEFAULT false,
	"approved_by" uuid,
	"processed_by" uuid,
	"approved_at" timestamp,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referred_id" uuid NOT NULL,
	"referral_code" varchar(20) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"tier" varchar(32) DEFAULT 'standard',
	"bonus_points" integer DEFAULT 0,
	"referrer_bonus" integer DEFAULT 0,
	"referred_bonus" integer DEFAULT 0,
	"qualification_criteria" jsonb,
	"qualified_at" timestamp,
	"paid_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "reward_type_enum" NOT NULL,
	"provider" varchar(100),
	"category" varchar(50),
	"points_cost" integer NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"stock" integer,
	"max_per_user" integer,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"image" varchar(500),
	"terms" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panelist_custom_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_type" varchar(20) NOT NULL,
	"field_value" text,
	"category" varchar(50),
	"is_public" boolean DEFAULT false,
	"source" varchar(50) DEFAULT 'user_input',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panelist_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"device_type" varchar(20) NOT NULL,
	"operating_system" varchar(50),
	"browser" varchar(50),
	"screen_resolution" varchar(20),
	"user_agent" varchar(256),
	"preferred_device" boolean DEFAULT false,
	"usage_count" integer DEFAULT 1,
	"last_used_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"first_used_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "panelist_profile_completion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"overall_completion" integer DEFAULT 0,
	"demographics_completion" integer DEFAULT 0,
	"geography_completion" integer DEFAULT 0,
	"professional_completion" integer DEFAULT 0,
	"lifestyle_completion" integer DEFAULT 0,
	"preferences_completion" integer DEFAULT 0,
	"last_calculated" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_profile_completion_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_response_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"average_response_time" numeric(8, 2) DEFAULT '0.00',
	"fast_response_count" integer DEFAULT 0,
	"slow_response_count" integer DEFAULT 0,
	"straight_line_responses" integer DEFAULT 0,
	"inconsistent_responses" integer DEFAULT 0,
	"skip_pattern_violations" integer DEFAULT 0,
	"attention_checks_passed" integer DEFAULT 0,
	"attention_checks_failed" integer DEFAULT 0,
	"attention_check_accuracy" numeric(5, 2) DEFAULT '100.00',
	"average_text_length" integer DEFAULT 0,
	"short_text_responses" integer DEFAULT 0,
	"duplicate_text_responses" integer DEFAULT 0,
	"last_calculated" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panelist_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"previous_status" varchar(32),
	"new_status" varchar(32) NOT NULL,
	"reason" varchar(100),
	"changed_by" uuid,
	"notes" text,
	"automatic_change" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panelist_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"tag_name" varchar(100) NOT NULL,
	"tag_type" varchar(50) NOT NULL,
	"tag_value" varchar(200),
	"assigned_by" uuid,
	"source" varchar(50) DEFAULT 'manual',
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cta_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"visit_id" uuid,
	"button_location" varchar(100) NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "email_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"visit_id" uuid,
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"time_to_convert_seconds" integer,
	"is_converted" boolean DEFAULT true NOT NULL,
	"converted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "page_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"fingerprint" varchar(255),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_term" varchar(255),
	"utm_content" varchar(255),
	"referrer" varchar(500),
	"landing_page" varchar(500) NOT NULL,
	"user_agent" varchar(500),
	"device_type" varchar(50),
	"browser_name" varchar(100),
	"os_name" varchar(100),
	"screen_resolution" varchar(50),
	"timezone" varchar(100),
	"language" varchar(50),
	"ip_address" varchar(45),
	"country" varchar(100),
	"city" varchar(100),
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_transactions" ADD CONSTRAINT "survey_transactions_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_transactions" ADD CONSTRAINT "survey_transactions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_demographics" ADD CONSTRAINT "panelist_demographics_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_engagement" ADD CONSTRAINT "panelist_engagement_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_geography" ADD CONSTRAINT "panelist_geography_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_lifestyle" ADD CONSTRAINT "panelist_lifestyle_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_points" ADD CONSTRAINT "panelist_points_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_preferences" ADD CONSTRAINT "panelist_preferences_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_professional" ADD CONSTRAINT "panelist_professional_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_quality" ADD CONSTRAINT "panelist_quality_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_segments" ADD CONSTRAINT "panelist_segments_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_stats" ADD CONSTRAINT "panelist_stats_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_verification" ADD CONSTRAINT "panelist_verification_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cta_clicks" ADD CONSTRAINT "cta_clicks_visit_id_page_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."page_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_conversions" ADD CONSTRAINT "email_conversions_visit_id_page_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."page_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_created_by_idx" ON "sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "sessions_deleted_at_idx" ON "sessions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "users_created_by_idx" ON "users" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "surveys_unique_external_idx" ON "surveys" USING btree ("source_portal","external_id");--> statement-breakpoint
CREATE INDEX "surveys_status_idx" ON "surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surveys_active_idx" ON "surveys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "surveys_category_idx" ON "surveys" USING btree ("category");--> statement-breakpoint
CREATE INDEX "surveys_priority_idx" ON "surveys" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "surveys_points_idx" ON "surveys" USING btree ("points");--> statement-breakpoint
CREATE INDEX "surveys_public_idx" ON "surveys" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "surveys_quality_idx" ON "surveys" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "surveys_completion_rate_idx" ON "surveys" USING btree ("completion_rate");--> statement-breakpoint
CREATE INDEX "surveys_available_public_idx" ON "surveys" USING btree ("status","is_public","is_active");--> statement-breakpoint
CREATE INDEX "surveys_targeting_idx" ON "surveys" USING btree ("category","points","is_active");--> statement-breakpoint
CREATE INDEX "surveys_created_by_idx" ON "surveys" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "surveys_deleted_at_idx" ON "surveys" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "survey_invitations_survey_id_idx" ON "survey_invitations" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_invitations_panelist_id_idx" ON "survey_invitations" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "survey_invitations_status_idx" ON "survey_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survey_invitations_qualification_idx" ON "survey_invitations" USING btree ("qualification_status");--> statement-breakpoint
CREATE INDEX "survey_invitations_sent_at_idx" ON "survey_invitations" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "survey_invitations_expires_at_idx" ON "survey_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "survey_invitations_survey_status_idx" ON "survey_invitations" USING btree ("survey_id","status");--> statement-breakpoint
CREATE INDEX "survey_invitations_panelist_status_idx" ON "survey_invitations" USING btree ("panelist_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_invitations_unique_idx" ON "survey_invitations" USING btree ("survey_id","panelist_id");--> statement-breakpoint
CREATE INDEX "survey_invitations_created_by_idx" ON "survey_invitations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "survey_invitations_deleted_at_idx" ON "survey_invitations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "survey_questions_survey_id_idx" ON "survey_questions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_questions_type_idx" ON "survey_questions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "survey_questions_screening_idx" ON "survey_questions" USING btree ("is_screening");--> statement-breakpoint
CREATE INDEX "survey_questions_order_idx" ON "survey_questions" USING btree ("survey_id","order");--> statement-breakpoint
CREATE INDEX "survey_questions_external_id_idx" ON "survey_questions" USING btree ("external_question_id");--> statement-breakpoint
CREATE INDEX "survey_questions_created_by_idx" ON "survey_questions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "survey_questions_deleted_at_idx" ON "survey_questions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "survey_completions_survey_id_idx" ON "survey_transactions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_completions_panelist_id_idx" ON "survey_transactions" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "survey_completions_status_idx" ON "survey_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survey_completions_completed_at_idx" ON "survey_transactions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "survey_completions_quality_idx" ON "survey_transactions" USING btree ("quality_rating");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_completions_unique_idx" ON "survey_transactions" USING btree ("survey_id","panelist_id");--> statement-breakpoint
CREATE INDEX "survey_completions_created_by_idx" ON "survey_transactions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "survey_completions_deleted_at_idx" ON "survey_transactions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_survey_id_idx" ON "survey_transaction_details" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_panelist_id_idx" ON "survey_transaction_details" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_device_type_idx" ON "survey_transaction_details" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_ip_address_idx" ON "survey_transaction_details" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_utm_source_idx" ON "survey_transaction_details" USING btree ("utm_source");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_created_by_idx" ON "survey_transaction_details" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_deleted_at_idx" ON "survey_transaction_details" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelists_user_id_idx" ON "panelists" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "panelists_referral_code_idx" ON "panelists" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "panelists_status_idx" ON "panelists" USING btree ("status");--> statement-breakpoint
CREATE INDEX "panelists_tier_idx" ON "panelists" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "panelists_referred_by_idx" ON "panelists" USING btree ("referred_by");--> statement-breakpoint
CREATE INDEX "panelists_deleted_at_idx" ON "panelists" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "panelists_created_at_idx" ON "panelists" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_demographics_panelist_id_idx" ON "panelist_demographics" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_demographics_gender_idx" ON "panelist_demographics" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "panelist_demographics_dob_idx" ON "panelist_demographics" USING btree ("date_of_birth");--> statement-breakpoint
CREATE INDEX "panelist_demographics_marital_idx" ON "panelist_demographics" USING btree ("marital_status");--> statement-breakpoint
CREATE INDEX "panelist_demographics_ethnicity_idx" ON "panelist_demographics" USING btree ("ethnicity");--> statement-breakpoint
CREATE INDEX "panelist_demographics_deleted_at_idx" ON "panelist_demographics" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_engagement_panelist_id_idx" ON "panelist_engagement" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_engagement_streak_idx" ON "panelist_engagement" USING btree ("streak_days");--> statement-breakpoint
CREATE INDEX "panelist_engagement_last_active_idx" ON "panelist_engagement" USING btree ("last_active_at");--> statement-breakpoint
CREATE INDEX "panelist_engagement_completion_rate_idx" ON "panelist_engagement" USING btree ("completion_rate");--> statement-breakpoint
CREATE INDEX "panelist_engagement_total_surveys_idx" ON "panelist_engagement" USING btree ("total_surveys");--> statement-breakpoint
CREATE INDEX "panelist_engagement_deleted_at_idx" ON "panelist_engagement" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_geography_panelist_id_idx" ON "panelist_geography" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_geography_country_idx" ON "panelist_geography" USING btree ("country");--> statement-breakpoint
CREATE INDEX "panelist_geography_state_idx" ON "panelist_geography" USING btree ("state");--> statement-breakpoint
CREATE INDEX "panelist_geography_city_idx" ON "panelist_geography" USING btree ("city");--> statement-breakpoint
CREATE INDEX "panelist_geography_location_idx" ON "panelist_geography" USING btree ("country","state","city");--> statement-breakpoint
CREATE INDEX "panelist_geography_coordinates_idx" ON "panelist_geography" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "panelist_geography_deleted_at_idx" ON "panelist_geography" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_lifestyle_panelist_id_idx" ON "panelist_lifestyle" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_lifestyle_internet_usage_idx" ON "panelist_lifestyle" USING btree ("internet_usage");--> statement-breakpoint
CREATE INDEX "panelist_lifestyle_travel_idx" ON "panelist_lifestyle" USING btree ("travel_frequency");--> statement-breakpoint
CREATE INDEX "panelist_lifestyle_deleted_at_idx" ON "panelist_lifestyle" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_points_panelist_id_idx" ON "panelist_points" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_points_current_idx" ON "panelist_points" USING btree ("current_points");--> statement-breakpoint
CREATE INDEX "panelist_points_lifetime_idx" ON "panelist_points" USING btree ("lifetime_points");--> statement-breakpoint
CREATE INDEX "panelist_points_deleted_at_idx" ON "panelist_points" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_preferences_panelist_id_idx" ON "panelist_preferences" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_preferences_timezone_idx" ON "panelist_preferences" USING btree ("timezone");--> statement-breakpoint
CREATE INDEX "panelist_preferences_locale_idx" ON "panelist_preferences" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "panelist_preferences_language_idx" ON "panelist_preferences" USING btree ("preferred_language");--> statement-breakpoint
CREATE INDEX "panelist_preferences_privacy_idx" ON "panelist_preferences" USING btree ("privacy_level");--> statement-breakpoint
CREATE INDEX "panelist_preferences_deleted_at_idx" ON "panelist_preferences" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_professional_panelist_id_idx" ON "panelist_professional" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_professional_education_idx" ON "panelist_professional" USING btree ("education");--> statement-breakpoint
CREATE INDEX "panelist_professional_employment_idx" ON "panelist_professional" USING btree ("employment");--> statement-breakpoint
CREATE INDEX "panelist_professional_occupation_idx" ON "panelist_professional" USING btree ("occupation");--> statement-breakpoint
CREATE INDEX "panelist_professional_industry_idx" ON "panelist_professional" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "panelist_professional_income_idx" ON "panelist_professional" USING btree ("income");--> statement-breakpoint
CREATE INDEX "panelist_professional_household_income_idx" ON "panelist_professional" USING btree ("household_income");--> statement-breakpoint
CREATE INDEX "panelist_professional_deleted_at_idx" ON "panelist_professional" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_quality_panelist_id_idx" ON "panelist_quality" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_quality_score_idx" ON "panelist_quality" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX "panelist_quality_flags_idx" ON "panelist_quality" USING btree ("quality_flags");--> statement-breakpoint
CREATE INDEX "panelist_quality_rating_idx" ON "panelist_quality" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "panelist_quality_deleted_at_idx" ON "panelist_quality" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "panelist_segments_panelist_id_idx" ON "panelist_segments" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_segments_name_idx" ON "panelist_segments" USING btree ("segment_name");--> statement-breakpoint
CREATE INDEX "panelist_segments_type_idx" ON "panelist_segments" USING btree ("segment_type");--> statement-breakpoint
CREATE INDEX "panelist_segments_value_idx" ON "panelist_segments" USING btree ("segment_value");--> statement-breakpoint
CREATE INDEX "panelist_segments_active_idx" ON "panelist_segments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "panelist_segments_source_idx" ON "panelist_segments" USING btree ("source");--> statement-breakpoint
CREATE INDEX "panelist_segments_targeting_idx" ON "panelist_segments" USING btree ("segment_type","segment_value","is_active");--> statement-breakpoint
CREATE INDEX "panelist_segments_panelist_active_idx" ON "panelist_segments" USING btree ("panelist_id","is_active");--> statement-breakpoint
CREATE INDEX "panelist_segments_deleted_at_idx" ON "panelist_segments" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_stats_panelist_id_idx" ON "panelist_stats" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_stats_completion_rate_idx" ON "panelist_stats" USING btree ("completion_rate");--> statement-breakpoint
CREATE INDEX "panelist_stats_quality_rating_idx" ON "panelist_stats" USING btree ("average_quality_rating");--> statement-breakpoint
CREATE INDEX "panelist_stats_streak_idx" ON "panelist_stats" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "panelist_stats_points_earned_idx" ON "panelist_stats" USING btree ("total_points_earned");--> statement-breakpoint
CREATE INDEX "panelist_stats_last_active_idx" ON "panelist_stats" USING btree ("last_active_date");--> statement-breakpoint
CREATE INDEX "panelist_stats_deleted_at_idx" ON "panelist_stats" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "panelist_verification_status_idx" ON "panelist_verification" USING btree ("status");--> statement-breakpoint
CREATE INDEX "panelist_verification_identity_idx" ON "panelist_verification" USING btree ("identity_verified");--> statement-breakpoint
CREATE INDEX "panelist_verification_phone_idx" ON "panelist_verification" USING btree ("phone_verified");--> statement-breakpoint
CREATE INDEX "panelist_verification_email_idx" ON "panelist_verification" USING btree ("email_verified");--> statement-breakpoint
CREATE INDEX "panelist_verification_deleted_at_idx" ON "panelist_verification" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "points_expiry_panelist_id_idx" ON "points_expiry" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "points_expiry_transaction_id_idx" ON "points_expiry" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "points_expiry_expires_at_idx" ON "points_expiry" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "points_expiry_status_idx" ON "points_expiry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "points_transactions_panelist_id_idx" ON "points_transactions" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "points_transactions_type_idx" ON "points_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "points_transactions_category_idx" ON "points_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "points_transactions_status_idx" ON "points_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "points_transactions_reference_idx" ON "points_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "points_transactions_created_at_idx" ON "points_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "points_transactions_expires_at_idx" ON "points_transactions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "redemptions_panelist_id_idx" ON "redemptions" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "redemptions_status_idx" ON "redemptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "redemptions_type_idx" ON "redemptions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "redemptions_provider_idx" ON "redemptions" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "redemptions_transaction_id_idx" ON "redemptions" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "redemptions_created_at_idx" ON "redemptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "redemptions_processed_at_idx" ON "redemptions" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "referrals_referrer_id_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "referrals_referred_id_idx" ON "referrals" USING btree ("referred_id");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referrals_code_idx" ON "referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "referrals_tier_idx" ON "referrals" USING btree ("tier");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_unique_idx" ON "referrals" USING btree ("referrer_id","referred_id");--> statement-breakpoint
CREATE INDEX "rewards_type_idx" ON "rewards" USING btree ("type");--> statement-breakpoint
CREATE INDEX "rewards_provider_idx" ON "rewards" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "rewards_category_idx" ON "rewards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "rewards_points_cost_idx" ON "rewards" USING btree ("points_cost");--> statement-breakpoint
CREATE INDEX "rewards_active_idx" ON "rewards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rewards_featured_idx" ON "rewards" USING btree ("is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_custom_fields_panelist_field_idx" ON "panelist_custom_fields" USING btree ("panelist_id","field_name");--> statement-breakpoint
CREATE INDEX "panelist_custom_fields_field_name_idx" ON "panelist_custom_fields" USING btree ("field_name");--> statement-breakpoint
CREATE INDEX "panelist_devices_panelist_id_idx" ON "panelist_devices" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_devices_device_type_idx" ON "panelist_devices" USING btree ("device_type");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_profile_completion_panelist_id_idx" ON "panelist_profile_completion" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_profile_completion_overall_idx" ON "panelist_profile_completion" USING btree ("overall_completion");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_response_patterns_panelist_id_idx" ON "panelist_response_patterns" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_response_patterns_avg_time_idx" ON "panelist_response_patterns" USING btree ("average_response_time");--> statement-breakpoint
CREATE INDEX "panelist_status_history_panelist_id_idx" ON "panelist_status_history" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_status_history_new_status_idx" ON "panelist_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "panelist_tags_panelist_id_idx" ON "panelist_tags" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_tags_tag_name_idx" ON "panelist_tags" USING btree ("tag_name");