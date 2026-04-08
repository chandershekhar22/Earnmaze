import { pgTable, uuid, varchar, text, timestamp, index, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const supportTicketStatusEnum = pgEnum("support_ticket_status_enum", [
	"open",
	"in_progress",
	"resolved",
	"closed",
]);

export const supportTicketPriorityEnum = pgEnum("support_ticket_priority_enum", [
	"low",
	"medium",
	"high",
]);

export const supportTicket = pgTable("support_tickets", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	panelistId: uuid("panelist_id").notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	subject: varchar("subject", { length: 255 }).notNull(),
	message: text("message").notNull(),
	status: supportTicketStatusEnum("status").notNull().default("open"),
	priority: supportTicketPriorityEnum("priority").notNull().default("medium"),
	assignedTo: uuid("assigned_to"),
	adminReply: text("admin_reply"),
	repliedAt: timestamp("replied_at"),
	repliedBy: uuid("replied_by"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
	index("idx_support_ticket_panelist_id").on(table.panelistId),
	index("idx_support_ticket_status").on(table.status),
	index("idx_support_ticket_created_at").on(table.createdAt),
	index("idx_support_ticket_assigned_to").on(table.assignedTo),
]);

// Internal notes/messages on tickets (not visible to panelist)
export const ticketNote = pgTable("ticket_notes", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	ticketId: uuid("ticket_id").notNull()
		.references(() => supportTicket.id, { onDelete: "cascade" }),
	authorId: uuid("author_id").notNull()
		.references(() => user.id),
	message: text("message").notNull(),
	isInternal: boolean("is_internal").notNull().default(true),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_ticket_note_ticket_id").on(table.ticketId),
	index("idx_ticket_note_author_id").on(table.authorId),
]);

// FAQ table — admin-managed, shown on panelist support page
export const faq = pgTable("faqs", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	question: varchar("question", { length: 500 }).notNull(),
	answer: text("answer").notNull(),
	sortOrder: integer("sort_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()).notNull(),
}, (table) => [
	index("idx_faq_sort_order").on(table.sortOrder),
	index("idx_faq_is_active").on(table.isActive),
]);
