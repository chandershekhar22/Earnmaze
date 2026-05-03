import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { createTicket } from '$lib/db/repositories';
import { getTicketById, addTicketNote, getTicketNotes, updateTicketStatus } from '$lib/db/repositories/support-tickets.repository.server';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';
import { notifyTelegram, notifyUpdate } from '$lib/utils/telegram';
import { maskEmail } from '$lib/utils/mask';

const createTicketSchema = z.object({
	subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
	message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
	priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

/**
 * POST /api/panelist/support — create a new support ticket
 */
export const POST: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	try {
		const body = await event.request.json();
		const validated = createTicketSchema.parse(body);

		const ticket = await createTicket(
			authUser.id,
			validated.subject,
			validated.message,
			validated.priority,
		);

		// Best-effort Telegram notification.
		// High-priority tickets fire to the critical channel so they're visible
		// alongside genuine outages; low/medium go to the updates channel.
		const priorityIcon = validated.priority === 'high' ? '🔥' : '🎫';
		const safeSubject = String(validated.subject)
			.slice(0, 120)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const ticketMsg =
			`${priorityIcon} New support ticket (${validated.priority})\n` +
			`From: <code>${maskEmail(authUser.email)}</code>\n` +
			`Subject: ${safeSubject}`;
		try {
			const dispatch =
				validated.priority === 'high'
					? notifyTelegram(ticketMsg, 'critical')
					: notifyUpdate(ticketMsg);
			dispatch.catch(() => {
				/* swallow — alert path must not break ticket creation */
			});
		} catch {
			/* swallow sync throw too */
		}

		return json({
			success: true,
			data: {
				id: ticket.id,
				subject: ticket.subject,
				message: ticket.message,
				status: ticket.status,
				priority: ticket.priority,
				adminReply: ticket.adminReply,
				repliedAt: ticket.repliedAt?.toISOString() ?? null,
				createdAt: ticket.createdAt.toISOString(),
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
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Failed to create support ticket');
		return json(
			{ success: false, error: 'CREATE_FAILED', message: 'Failed to create ticket' },
			{ status: 500 }
		);
	}
};

const replySchema = z.object({
	ticketId: z.string().uuid(),
	message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
});

/**
 * PATCH /api/panelist/support — add a reply to an existing ticket
 */
export const PATCH: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	try {
		const body = await event.request.json();
		const validated = replySchema.parse(body);

		// Verify the ticket belongs to this user
		const ticket = await getTicketById(validated.ticketId);
		if (!ticket || ticket.panelistId !== authUser.id) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Ticket not found' },
				{ status: 404 }
			);
		}

		// Don't allow replies on closed tickets
		if (ticket.status === 'closed') {
			return json(
				{ success: false, error: 'TICKET_CLOSED', message: 'Cannot reply to a closed ticket' },
				{ status: 400 }
			);
		}

		// Add reply as a non-internal note
		const note = await addTicketNote(validated.ticketId, authUser.id, validated.message, false);

		// Reopen ticket if it was resolved
		if (ticket.status === 'resolved') {
			await updateTicketStatus(validated.ticketId, 'open');
		}

		return json({
			success: true,
			data: {
				id: note.id,
				message: note.message,
				isInternal: note.isInternal,
				createdAt: note.createdAt.toISOString(),
				authorName: authUser.name,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: error.issues[0]?.message },
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Failed to add ticket reply');
		return json(
			{ success: false, error: 'REPLY_FAILED', message: 'Failed to add reply' },
			{ status: 500 }
		);
	}
};

/**
 * GET /api/panelist/support?ticketId=xxx — get replies for a ticket
 */
export const GET: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);
	const ticketId = event.url.searchParams.get('ticketId');

	if (!ticketId) {
		return json({ success: false, error: 'MISSING_ID', message: 'ticketId required' }, { status: 400 });
	}

	// Verify ownership
	const ticket = await getTicketById(ticketId);
	if (!ticket || ticket.panelistId !== authUser.id) {
		return json({ success: false, error: 'NOT_FOUND', message: 'Ticket not found' }, { status: 404 });
	}

	// Get only non-internal notes (exclude admin-only notes)
	const allNotes = await getTicketNotes(ticketId);
	const replies = allNotes
		.filter(n => !n.isInternal)
		.map(n => ({
			id: n.id,
			message: n.message,
			createdAt: n.createdAt.toISOString(),
			authorName: n.authorName,
			isAdmin: n.authorId !== authUser.id,
		}));

	return json({ success: true, data: replies });
};
