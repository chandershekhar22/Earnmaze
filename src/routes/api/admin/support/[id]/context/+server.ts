import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { db } from '$lib/db';
import { pointsTransactions } from '$lib/db/schema/panelist-points';
import { surveyTransaction, survey } from '$lib/db/schema/surveys';
import { supportTicket } from '$lib/db/schema/support-tickets';
import { eq, desc, and, like } from 'drizzle-orm';

/**
 * GET /api/admin/support/[id]/context
 * Returns panelist's recent surveys, transactions, and points credited from this ticket
 */
export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	const { id: ticketId } = event.params;

	try {
		// Get the ticket to find panelistId
		const [ticket] = await db.select().from(supportTicket).where(eq(supportTicket.id, ticketId)).limit(1);
		if (!ticket) return json({ error: 'Ticket not found' }, { status: 404 });

		const panelistId = ticket.panelistId;

		// Fetch in parallel: recent surveys, recent transactions, ticket-linked points
		const [surveys, transactions, ticketPoints] = await Promise.all([
			// Last 10 survey attempts
			db.select({
				id: surveyTransaction.id,
				surveyTitle: survey.title,
				status: surveyTransaction.status,
				awardedPoints: surveyTransaction.awardedPoints,
				startedAt: surveyTransaction.startedAt,
				completedAt: surveyTransaction.completedAt,
			})
			.from(surveyTransaction)
			.leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
			.where(eq(surveyTransaction.panelistId, panelistId))
			.orderBy(desc(surveyTransaction.startedAt))
			.limit(10),

			// Last 10 point transactions
			db.select()
			.from(pointsTransactions)
			.where(eq(pointsTransactions.panelistId, panelistId))
			.orderBy(desc(pointsTransactions.createdAt))
			.limit(10),

			// Points credited with this ticket ID in description
			db.select()
			.from(pointsTransactions)
			.where(
				and(
					eq(pointsTransactions.panelistId, panelistId),
					like(pointsTransactions.description, `%Ticket: ${ticketId.slice(0, 8)}%`)
				)
			)
			.orderBy(desc(pointsTransactions.createdAt)),
		]);

		return json({
			surveys: surveys.map(s => ({
				...s,
				startedAt: s.startedAt.toISOString(),
				completedAt: s.completedAt?.toISOString() ?? null,
			})),
			transactions: transactions.map(t => ({
				id: t.id,
				type: t.type,
				points: t.points,
				description: t.description,
				createdAt: t.createdAt.toISOString(),
			})),
			ticketPoints: ticketPoints.map(t => ({
				id: t.id,
				type: t.type,
				points: t.points,
				description: t.description,
				createdAt: t.createdAt.toISOString(),
			})),
		});
	} catch {
		return json({ surveys: [], transactions: [], ticketPoints: [] });
	}
};
