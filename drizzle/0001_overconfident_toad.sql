CREATE TABLE "guest_upgrade_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_session_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"otp_expires_at" timestamp NOT NULL,
	"otp_attempts" integer DEFAULT 0 NOT NULL,
	"otp_verified_at" timestamp,
	"upgrade_token" varchar(255),
	"upgrade_token_expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "guest_upgrade_verifications_upgrade_token_unique" UNIQUE("upgrade_token")
);
--> statement-breakpoint
ALTER TABLE "guest_upgrade_verifications" ADD CONSTRAINT "guest_upgrade_verifications_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_upgrade_verifications_session_idx" ON "guest_upgrade_verifications" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "guest_upgrade_verifications_email_idx" ON "guest_upgrade_verifications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guest_upgrade_verifications_token_idx" ON "guest_upgrade_verifications" USING btree ("upgrade_token");--> statement-breakpoint
CREATE INDEX "guest_upgrade_verifications_otp_expires_idx" ON "guest_upgrade_verifications" USING btree ("otp_expires_at");