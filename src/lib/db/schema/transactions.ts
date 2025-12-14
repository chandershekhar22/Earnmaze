import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  boolean,
  decimal,
  index,
  uniqueIndex,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Enums


export const redemptionTypeEnum = pgEnum("redemption_type_enum", [
  "paypal",
  "gift_card",
  "bank_transfer",
  "crypto",
  "cash",
  "voucher",
]);

export const rewardTypeEnum = pgEnum("reward_type_enum", [
  "gift_card",
  "cash",
  "product",
  "discount",
  "experience",
]);




export const redemptions = pgTable("redemptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  panelistId: uuid("panelist_id").notNull(),
  type: redemptionTypeEnum("type").notNull(), // paypal, gift_card, bank_transfer, crypto, cash, voucher
  provider: varchar("provider", { length: 50 }), // PayPal, Amazon, Visa, etc
  amount: integer("amount").notNull(), // points redeemed
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // monetary value ($)
  currency: varchar("currency", { length: 10 }).default("USD"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("0.01"), // points to currency rate
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, processing, completed, failed, cancelled, on_hold
  paymentMethod: varchar("payment_method", { length: 50 }), // specific payment method
  paymentDetails: jsonb("payment_details"), // JSON with payment info (email, account, etc)
  recipientInfo: jsonb("recipient_info"), // JSON with recipient details
  transactionId: varchar("transaction_id", { length: 100 }), // external transaction ID
  fees: decimal("fees", { precision: 8, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }), // value minus fees
  processingNotes: text("processing_notes"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  isTestRedemption: boolean("is_test_redemption").default(false),
  approvedBy: uuid("approved_by"), // admin user id
  processedBy: uuid("processed_by"), // admin user id
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  index("redemptions_panelist_id_idx").on(table.panelistId),
  index("redemptions_status_idx").on(table.status),
  index("redemptions_type_idx").on(table.type),
  index("redemptions_provider_idx").on(table.provider),
  index("redemptions_transaction_id_idx").on(table.transactionId),
  index("redemptions_created_at_idx").on(table.createdAt),
  index("redemptions_processed_at_idx").on(table.processedAt),
]);

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: uuid("referrer_id").notNull(), // respondent who referred
  referredId: uuid("referred_id").notNull(), // respondent who was referred
  referralCode: varchar("referral_code", { length: 20 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, qualified, completed, paid, expired
  tier: varchar("tier", { length: 32 }).default("standard"), // standard, premium, vip
  bonusPoints: integer("bonus_points").default(0),
  referrerBonus: integer("referrer_bonus").default(0),
  referredBonus: integer("referred_bonus").default(0),
  qualificationCriteria: jsonb("qualification_criteria"), // JSON with requirements
  qualifiedAt: timestamp("qualified_at"), // when referred user met requirements
  paidAt: timestamp("paid_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"), // JSON for tracking source, etc
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
}, (table) => [
  index("referrals_referrer_id_idx").on(table.referrerId),
  index("referrals_referred_id_idx").on(table.referredId),
  index("referrals_status_idx").on(table.status),
  index("referrals_code_idx").on(table.referralCode),
  index("referrals_tier_idx").on(table.tier),
  uniqueIndex("referrals_unique_idx").on(table.referrerId, table.referredId),
]);


export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: rewardTypeEnum("type").notNull(), // gift_card, cash, product, discount, experience
  provider: varchar("provider", { length: 100 }), // Amazon, PayPal, Visa, etc
  category: varchar("category", { length: 50 }), // shopping, dining, entertainment, etc
  pointsCost: integer("points_cost").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  stock: integer("stock"), // null = unlimited
  maxPerUser: integer("max_per_user"), // max redemptions per user
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  image: varchar("image", { length: 500 }),
  terms: text("terms"), // terms and conditions
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
  index("rewards_type_idx").on(table.type),
  index("rewards_provider_idx").on(table.provider),
  index("rewards_category_idx").on(table.category),
  index("rewards_points_cost_idx").on(table.pointsCost),
  index("rewards_active_idx").on(table.isActive),
  index("rewards_featured_idx").on(table.isFeatured),
]);
