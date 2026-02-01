import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { ctaClicks, pageVisits } from '$lib/db/schema/analytics';import { Logger } from '$lib/utils/app-logger';import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { visitorId, sessionId, buttonLocation } = body;

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
			visitorId,
			sessionId,
			visitId,
			buttonLocation,
			clickedAt: new Date(),
		});

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'analytics', error }, 'Error tracking CTA click');
		return json({ error: 'Failed to track CTA click' }, { status: 500 });
	}
};
