import { eq, desc } from "drizzle-orm";
import { supportTicket, ticketNote } from "../schema/support-tickets";
import { user } from "../schema/auth";
import { db } from "..";

/**
 * Support Tickets Repository
 * Handles all support ticket operations for panelists and admins
 */

/**
 * Create a new support ticket
 */
export async function createTicket(
	panelistId: string,
	subject: string,
	message: string,
	priority: "low" | "medium" | "high" = "medium"
) {
	const [ticket] = await db
		.insert(supportTicket)
		.values({
			panelistId,
			subject,
			message,
			priority,
		})
		.returning();

	return ticket;
}

/**
 * Get all tickets for a specific panelist, ordered by newest first
 */
export async function getTicketsByPanelist(panelistId: string) {
	return db
		.select()
		.from(supportTicket)
		.where(eq(supportTicket.panelistId, panelistId))
		.orderBy(desc(supportTicket.createdAt));
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(id: string) {
	const [ticket] = await db
		.select()
		.from(supportTicket)
		.where(eq(supportTicket.id, id))
		.limit(1);

	return ticket;
}

/**
 * Get all tickets for admin view, with panelist email
 */
export async function getAllTickets() {
	return db
		.select({
			id: supportTicket.id,
			panelistId: supportTicket.panelistId,
			subject: supportTicket.subject,
			message: supportTicket.message,
			status: supportTicket.status,
			priority: supportTicket.priority,
			assignedTo: supportTicket.assignedTo,
			adminReply: supportTicket.adminReply,
			repliedAt: supportTicket.repliedAt,
			repliedBy: supportTicket.repliedBy,
			createdAt: supportTicket.createdAt,
			updatedAt: supportTicket.updatedAt,
			panelistEmail: user.email,
			panelistName: user.name,
		})
		.from(supportTicket)
		.leftJoin(user, eq(supportTicket.panelistId, user.id))
		.orderBy(desc(supportTicket.updatedAt));
}

/**
 * Reply to a ticket (admin action)
 */
export async function replyToTicket(
	ticketId: string,
	adminReply: string,
	repliedBy: string,
	newStatus: "open" | "in_progress" | "resolved" | "closed" = "resolved"
) {
	const [updated] = await db
		.update(supportTicket)
		.set({
			adminReply,
			repliedBy,
			repliedAt: new Date(),
			status: newStatus,
			updatedAt: new Date(),
		})
		.where(eq(supportTicket.id, ticketId))
		.returning();

	return updated;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
	ticketId: string,
	status: "open" | "in_progress" | "resolved" | "closed"
) {
	const [updated] = await db
		.update(supportTicket)
		.set({
			status,
			updatedAt: new Date(),
		})
		.where(eq(supportTicket.id, ticketId))
		.returning();

	return updated;
}

/**
 * Assign ticket to a team member
 */
export async function assignTicket(ticketId: string, assignedTo: string | null) {
	const [updated] = await db
		.update(supportTicket)
		.set({ assignedTo, updatedAt: new Date() })
		.where(eq(supportTicket.id, ticketId))
		.returning();
	return updated;
}

/**
 * Add internal note to a ticket
 */
export async function addTicketNote(ticketId: string, authorId: string, message: string, isInternal = true) {
	const [note] = await db
		.insert(ticketNote)
		.values({ ticketId, authorId, message, isInternal })
		.returning();
	return note;
}

/**
 * Get all notes for a ticket with author info
 */
export async function getTicketNotes(ticketId: string) {
	return db
		.select({
			id: ticketNote.id,
			message: ticketNote.message,
			isInternal: ticketNote.isInternal,
			createdAt: ticketNote.createdAt,
			authorId: ticketNote.authorId,
			authorName: user.name,
			authorEmail: user.email,
		})
		.from(ticketNote)
		.leftJoin(user, eq(ticketNote.authorId, user.id))
		.where(eq(ticketNote.ticketId, ticketId))
		.orderBy(ticketNote.createdAt);
}

/**
 * Get admin users for ticket assignment
 */
export async function getAdminUsersList() {
	return db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(eq(user.userType, 'admin'));
}
