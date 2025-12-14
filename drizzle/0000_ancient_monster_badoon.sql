CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'suspended', 'banned', 'inactive', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."user_type_enum" AS ENUM('admin', 'panelist', 'client', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."completion_status_enum" AS ENUM('started', 'completed', 'terminated', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."invitation_status_enum" AS ENUM('sent', 'opened', 'clicked', 'qualified', 'expired');--> statement-breakpoint
CREATE TYPE "public"."survey_status_enum" AS ENUM('available', 'draft', 'archived', 'closed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."points_transaction_type_enum" AS ENUM('earned', 'redeemed', 'bonus', 'confirmed', 'rejected', 'penalty', 'adjustment', 'refund', 'expired');--> statement-breakpoint
CREATE TYPE "public"."panelist_tier_enum" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."privacy_level_enum" AS ENUM('standard', 'strict', 'gdpr', 'custom');--> statement-breakpoint
CREATE TYPE "public"."redemption_type_enum" AS ENUM('paypal', 'gift_card', 'bank_transfer', 'crypto', 'cash', 'voucher');--> statement-breakpoint
CREATE TYPE "public"."reward_type_enum" AS ENUM('gift_card', 'cash', 'product', 'discount', 'experience');--> statement-breakpoint
CREATE TYPE "public"."guest_session_status" AS ENUM('active', 'expired', 'upgraded');--> statement-breakpoint
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
	"name" text,
	"email" varchar(255) NOT NULL,
	"password" text,
	"is_password_set" boolean DEFAULT false NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"user_type" "user_type_enum" NOT NULL,
	"registration_source" varchar(100),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"last_login_at" timestamp,
	"login_count" integer DEFAULT 0,
	"referral_code" varchar(20),
	"referred_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" "user_status_enum" DEFAULT 'active' NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"points" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"link" text NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"survey_id" uuid NOT NULL,
	"respondent_id" varchar(64),
	"status" "completion_status_enum" DEFAULT 'started' NOT NULL,
	"awarded_points" integer DEFAULT 0,
	"time_spent_seconds" integer,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_transaction_details" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "survey_transaction_details_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"survey_transaction_id" integer NOT NULL,
	"device_type" varchar(50),
	"browser_info" text,
	"ip_address" varchar(45),
	"location" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panelist_points" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_points_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"current_points" integer DEFAULT 0 NOT NULL,
	"pending_points" integer DEFAULT 0 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_points_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"type" "points_transaction_type_enum" NOT NULL,
	"points" integer NOT NULL,
	"current_balance" integer NOT NULL,
	"pending_balance" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(32),
	"metadata" jsonb,
	"admin_notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panelist_demographics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_demographics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"date_of_birth" timestamp,
	"gender" varchar(20),
	"marital_status" varchar(20),
	"ethnicity" varchar(50),
	"has_children" boolean DEFAULT false,
	"children_ages" jsonb,
	"household_size" integer,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_demographics_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_geography" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_geography_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"country" varchar(100),
	"state" varchar(100),
	"city" varchar(100),
	"zip_code" varchar(20),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"time_zone" varchar(50),
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_geography_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_lifestyle" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_lifestyle_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
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
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_lifestyle_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
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
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_preferences_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_professional" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_professional_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"education" varchar(100),
	"employment" varchar(100),
	"occupation" varchar(100),
	"industry" varchar(100),
	"company_size" varchar(50),
	"work_experience" integer,
	"income" varchar(50),
	"household_income" varchar(50),
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_professional_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_quality" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_quality_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"tier" "panelist_tier_enum" DEFAULT 'bronze',
	"quality_score" integer DEFAULT 100 NOT NULL,
	"quality_flags" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"suspension_count" integer DEFAULT 0,
	"consistency_score" integer DEFAULT 100,
	"response_quality_score" integer DEFAULT 100,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "panelist_quality_panelist_id_unique" UNIQUE("panelist_id")
);
--> statement-breakpoint
CREATE TABLE "panelist_stats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "panelist_stats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"panelist_id" uuid NOT NULL,
	"total_surveys_started" integer DEFAULT 0,
	"total_surveys_completed" integer DEFAULT 0,
	"total_surveys_abandoned" integer DEFAULT 0,
	"total_surveys_disqualified" integer DEFAULT 0,
	"completion_rate" numeric(5, 2) DEFAULT '0.00',
	"total_time_spent" integer DEFAULT 0,
	"average_time_per_survey" integer DEFAULT 0,
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
	"visitor_id" varchar(255) NOT NULL,
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
	"visitor_id" varchar(255) NOT NULL,
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
	"visitor_id" varchar(255) NOT NULL,
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
CREATE TABLE "app_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" "guest_session_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"surveys_viewed" integer DEFAULT 0,
	"surveys_completed" integer DEFAULT 0,
	"session_points" integer DEFAULT 0,
	"upgraded_to_user_id" uuid,
	"upgraded_at" timestamp,
	"fingerprint" varchar(255),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"last_activity_at" timestamp NOT NULL,
	CONSTRAINT "guest_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "guest_survey_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_session_id" uuid NOT NULL,
	"survey_transaction_id" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_transactions" ADD CONSTRAINT "survey_transactions_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_transactions" ADD CONSTRAINT "survey_transactions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_transaction_details" ADD CONSTRAINT "survey_transaction_details_survey_transaction_id_survey_transactions_id_fk" FOREIGN KEY ("survey_transaction_id") REFERENCES "public"."survey_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_points" ADD CONSTRAINT "panelist_points_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_demographics" ADD CONSTRAINT "panelist_demographics_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_geography" ADD CONSTRAINT "panelist_geography_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_lifestyle" ADD CONSTRAINT "panelist_lifestyle_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_preferences" ADD CONSTRAINT "panelist_preferences_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_professional" ADD CONSTRAINT "panelist_professional_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_quality" ADD CONSTRAINT "panelist_quality_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelist_stats" ADD CONSTRAINT "panelist_stats_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cta_clicks" ADD CONSTRAINT "cta_clicks_visit_id_page_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."page_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_conversions" ADD CONSTRAINT "email_conversions_visit_id_page_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."page_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_survey_activity" ADD CONSTRAINT "guest_survey_activity_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_created_by_idx" ON "sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "sessions_deleted_at_idx" ON "sessions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "users_created_by_idx" ON "users" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "surveys_active_idx" ON "surveys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "surveys_points_idx" ON "surveys" USING btree ("points");--> statement-breakpoint
CREATE INDEX "surveys_created_by_idx" ON "surveys" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "surveys_deleted_at_idx" ON "surveys" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "survey_transactions_survey_id_idx" ON "survey_transactions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_transactions_panelist_id_idx" ON "survey_transactions" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "survey_transactions_status_idx" ON "survey_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survey_transaction_details_survey_transaction_id_idx" ON "survey_transaction_details" USING btree ("survey_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_points_panelist_id_idx" ON "panelist_points" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_points_current_idx" ON "panelist_points" USING btree ("current_points");--> statement-breakpoint
CREATE INDEX "points_transactions_panelist_id_idx" ON "points_transactions" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "points_transactions_type_idx" ON "points_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "points_transactions_reference_idx" ON "points_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "points_transactions_created_at_idx" ON "points_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_demographics_panelist_id_idx" ON "panelist_demographics" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_demographics_gender_idx" ON "panelist_demographics" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "panelist_demographics_dob_idx" ON "panelist_demographics" USING btree ("date_of_birth");--> statement-breakpoint
CREATE INDEX "panelist_demographics_marital_idx" ON "panelist_demographics" USING btree ("marital_status");--> statement-breakpoint
CREATE INDEX "panelist_demographics_ethnicity_idx" ON "panelist_demographics" USING btree ("ethnicity");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_geography_panelist_id_idx" ON "panelist_geography" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_geography_country_idx" ON "panelist_geography" USING btree ("country");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_lifestyle_panelist_id_idx" ON "panelist_lifestyle" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_lifestyle_internet_usage_idx" ON "panelist_lifestyle" USING btree ("internet_usage");--> statement-breakpoint
CREATE INDEX "panelist_lifestyle_travel_idx" ON "panelist_lifestyle" USING btree ("travel_frequency");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_preferences_panelist_id_idx" ON "panelist_preferences" USING btree ("panelist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_professional_panelist_id_idx" ON "panelist_professional" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_professional_education_idx" ON "panelist_professional" USING btree ("education");--> statement-breakpoint
CREATE INDEX "panelist_professional_employment_idx" ON "panelist_professional" USING btree ("employment");--> statement-breakpoint
CREATE INDEX "panelist_professional_occupation_idx" ON "panelist_professional" USING btree ("occupation");--> statement-breakpoint
CREATE INDEX "panelist_professional_industry_idx" ON "panelist_professional" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "panelist_professional_income_idx" ON "panelist_professional" USING btree ("income");--> statement-breakpoint
CREATE INDEX "panelist_professional_household_income_idx" ON "panelist_professional" USING btree ("household_income");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_quality_panelist_id_idx" ON "panelist_quality" USING btree ("panelist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "panelist_stats_panelist_id_idx" ON "panelist_stats" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panelist_stats_completion_rate_idx" ON "panelist_stats" USING btree ("completion_rate");--> statement-breakpoint
CREATE INDEX "panelist_stats_quality_rating_idx" ON "panelist_stats" USING btree ("average_quality_rating");--> statement-breakpoint
CREATE INDEX "panelist_stats_streak_idx" ON "panelist_stats" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "panelist_stats_last_active_idx" ON "panelist_stats" USING btree ("last_active_date");--> statement-breakpoint
CREATE INDEX "panelist_stats_deleted_at_idx" ON "panelist_stats" USING btree ("deleted_at");--> statement-breakpoint
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
CREATE INDEX "panelist_tags_tag_name_idx" ON "panelist_tags" USING btree ("tag_name");--> statement-breakpoint
CREATE INDEX "guest_sessions_email_idx" ON "guest_sessions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guest_sessions_token_idx" ON "guest_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "guest_sessions_status_idx" ON "guest_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guest_sessions_expires_at_idx" ON "guest_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "guest_sessions_fingerprint_idx" ON "guest_sessions" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "guest_activity_session_idx" ON "guest_survey_activity" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "guest_activity_transaction_idx" ON "guest_survey_activity" USING btree ("survey_transaction_id");