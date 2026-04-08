CREATE TYPE "public"."support_ticket_priority_enum" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status_enum" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" varchar(500) NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"panelist_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "support_ticket_status_enum" DEFAULT 'open' NOT NULL,
	"priority" "support_ticket_priority_enum" DEFAULT 'medium' NOT NULL,
	"admin_reply" text,
	"replied_at" timestamp,
	"replied_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_panelist_id_users_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_faq_sort_order" ON "faqs" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_faq_is_active" ON "faqs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_support_ticket_panelist_id" ON "support_tickets" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "idx_support_ticket_status" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_support_ticket_created_at" ON "support_tickets" USING btree ("created_at");