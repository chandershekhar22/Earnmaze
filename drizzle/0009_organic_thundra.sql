CREATE TABLE "email_consent_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"granted" boolean NOT NULL,
	"source" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketing_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketing_consent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tos_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "survey_data_sharing_accepted_at" timestamp;--> statement-breakpoint
CREATE INDEX "email_consent_log_user_id_idx" ON "email_consent_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_consent_log_channel_idx" ON "email_consent_log" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "email_consent_log_created_at_idx" ON "email_consent_log" USING btree ("created_at");