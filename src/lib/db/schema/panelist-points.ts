import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex, jsonb, pgEnum, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { pointsTransactionTypes } from "../../constants/constants";


export const pointsTransactionTypeEnum = pgEnum("points_transaction_type_enum", pointsTransactionTypes);

// Panelist points - Simplified (source of truth is points_transactions)
export const panelistPoint = pgTable("panelist_points", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  panelistId: uuid("panelist_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),
  currentPoints: integer("current_points").notNull().default(0), // Available balance for redemption
  pendingPoints: integer("pending_points").notNull().default(0), // Awaiting admin approval
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("panelist_points_panelist_id_idx").on(table.panelistId),
  index("panelist_points_current_idx").on(table.currentPoints),
  sql`CHECK (current_points >= 0)`,
  sql`CHECK (pending_points >= 0)`
]);

// Points transactions - Complete audit trail with dual balance tracking
export const pointsTransactions = pgTable("points_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  type: pointsTransactionTypeEnum("type").notNull(), // earned, redeemed, bonus, penalty, adjustment, refund, expired
  points: integer("points").notNull(), // positive for earnings, negative for redemptions/penalties
  currentBalance: integer("current_balance").notNull(), // snapshot of current points balance after this transaction
  pendingBalance: integer("pending_balance").notNull(), // snapshot of pending points balance after this transaction
  description: varchar("description", { length: 255 }).notNull(),
  referenceId: uuid("reference_id"), // survey completion id, redemption id, etc
  referenceType: varchar("reference_type", { length: 32 }), // survey_completion, redemption, bonus, etc
  metadata: jsonb("metadata"), // JSON for additional details
  adminNotes: text("admin_notes"), // internal notes for admins
  createdBy: uuid("created_by"), // admin user id if manually processed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  
}, (table) => [
  index("points_transactions_panelist_id_idx").on(table.panelistId),
  index("points_transactions_type_idx").on(table.type),
  index("points_transactions_reference_idx").on(table.referenceType, table.referenceId),
  index("points_transactions_created_at_idx").on(table.createdAt)
]);
