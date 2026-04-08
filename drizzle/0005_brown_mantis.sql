ALTER TABLE "points_transactions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."points_transaction_type_enum";--> statement-breakpoint
UPDATE "points_transactions" SET "type" = 'completed' WHERE "type" = 'earned';--> statement-breakpoint
CREATE TYPE "public"."points_transaction_type_enum" AS ENUM('completed', 'terminated', 'quota_full', 'disqualified', 'redeemed', 'bonus', 'rejected', 'penalty', 'adjustment', 'refund', 'expired');--> statement-breakpoint
ALTER TABLE "points_transactions" ALTER COLUMN "type" SET DATA TYPE "public"."points_transaction_type_enum" USING "type"::"public"."points_transaction_type_enum";--> statement-breakpoint
DROP INDEX "idx_panelist_point_pending_points";--> statement-breakpoint
ALTER TABLE "surveys" ALTER COLUMN "points" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "terminated_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "quota_full_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "panelist_points" DROP COLUMN "pending_points";--> statement-breakpoint
ALTER TABLE "points_transactions" DROP COLUMN "pending_balance";