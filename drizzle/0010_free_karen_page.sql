ALTER TABLE "users" ADD COLUMN "locale" varchar(10) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "faqs" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;