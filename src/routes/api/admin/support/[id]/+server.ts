import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { replyToTicket, getTicketById, updateTicketStatus, assignTicket, addTicketNote, getTicketNotes } from '$lib/db/repositories';
import { supportTicket } from '$lib/db/schema/support-tickets';
import { db } from '$lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

const replySchema = z.object({
	adminReply: z.string().min(1, 'Reply is required').max(5000, 'Reply too long'),
	status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().default('resolved'),
});

/**
 * PUT /api/admin/support/[id] — reply to a support ticket
 */
export const PUT: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const { id } = event.params;

	try {
		const existing = await getTicketById(id);
		if (!existing) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Ticket not found' },
				{ status: 404 }
			);
		}

		const body = await event.request.json();
		const validated = replySchema.parse(body);

		const updated = await replyToTicket(
			id,
			validated.adminReply,
			admin.id,
			validated.status,
		);

		// Also add as a non-internal note so it appears in the conversation thread
		const note = await addTicketNote(id, admin.id, validated.adminReply, false);

		return json({
			success: true,
			data: {
				id: updated.id,
				status: updated.status,
				adminReply: updated.adminReply,
				repliedAt: updated.repliedAt?.toISOString() ?? null,
				note: { ...note, createdAt: note.createdAt.toISOString(), authorName: admin.name },
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{
					success: false,
					error: 'VALIDATION_ERROR',
					message: error.issues[0]?.message || 'Validation failed',
				},
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'admin', error, adminId: admin.id, ticketId: id }, 'Failed to reply to ticket');
		return json(
			{ success: false, error: 'REPLY_FAILED', message: 'Failed to reply to ticket' },
			{ status: 500 }
		);
	}
};

/**
 * GET /api/admin/support/[id] — get ticket notes
 */
export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	const { id } = event.params;
	try {
		const notes = await getTicketNotes(id);
		return json({ notes: notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })) });
	} catch {
		return json({ notes: [] });
	}
};

/**
 * PATCH /api/admin/support/[id] — update status, assignment, or add note
 */
export const PATCH: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const { id } = event.params;
	try {
		const body = await event.request.json();

		// Status change
		if (body.status) {
			if (!['open', 'in_progress', 'resolved', 'closed'].includes(body.status)) {
				return json({ success: false, error: 'Invalid status' }, { status: 400 });
			}
			await updateTicketStatus(id, body.status);
		}

		// Assignment
		if ('assignedTo' in body) {
			await assignTicket(id, body.assignedTo || null);
		}

		// Internal note
		if (body.note) {
			const note = await addTicketNote(id, admin.id, body.note, body.isInternal ?? true);
			return json({ success: true, note: { ...note, createdAt: note.createdAt.toISOString(), authorName: admin.name, authorEmail: admin.email } });
		}

		return json({ success: true });
	} catch {
		return json({ success: false, error: 'Failed to update ticket' }, { status: 500 });
	}
};

/**
 * DELETE /api/admin/support/[id] — delete a ticket
 */
export const DELETE: RequestHandler = async (event) => {
	await requireAdmin(event);
	const { id } = event.params;
	try {
		await db.delete(supportTicket).where(eq(supportTicket.id, id));
		return json({ success: true });
	} catch {
		return json({ success: false, error: 'Failed to delete ticket' }, { status: 500 });
	}
};
