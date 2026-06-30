ALTER TABLE "surveys" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "is_today_survey" boolean DEFAULT false;
