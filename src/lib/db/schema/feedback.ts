import { pgTable, uuid, varchar, text, smallint, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

// Feedback submitted from the landing page and panelist dashboards. userId is
// nullable because the landing page form can be submitted by signed-out
// visitors.
export const feedback = pgTable("feedback", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
	rating: smallint("rating"),
	topic: varchar("topic", { length: 60 }),
	message: text("message").notNull().default(""),
	email: varchar("email", { length: 254 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_feedback_user_id").on(table.userId),
	index("idx_feedback_created_at").on(table.createdAt),
]);
