import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { ctaClicks, pageVisits } from '$lib/db/schema/analytics';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { userId, sessionId, buttonLocation } = body;

		// Find the visit ID for this session
		const visit = await db
			.select({ id: pageVisits.id })
			.from(pageVisits)
			.where(eq(pageVisits.sessionId, sessionId))
			.orderBy(pageVisits.visitedAt)
			.limit(1);

		const visitId = visit.length > 0 ? visit[0].id : null;

		// Insert CTA click tracking
		await db.insert(ctaClicks).values({
			userId,
			sessionId,
			visitId,
			buttonLocation,
			clickedAt: new Date(),
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error tracking CTA click:', error);
		return json({ error: 'Failed to track CTA click' }, { status: 500 });
	}
};
