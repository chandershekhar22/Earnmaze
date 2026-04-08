import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVisitBySessionId, createCtaClick } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';
import { trackCtaSchema, validateInput } from '$lib/validation/api-schemas';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate and sanitize input
		const validation = await validateInput(trackCtaSchema, body);
		if (!validation.success) {
			return json({ error: validation.error }, { status: 400 });
		}

		const { visitorId, sessionId, buttonLocation } = validation.data;

		// Find the visit ID for this session
		const visitData = await getVisitBySessionId(sessionId);
		const visitId = visitData?.id ?? null;

		// Insert CTA click tracking
		await createCtaClick({
			visitorId,
			sessionId,
			visitId,
			buttonLocation,
		});

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'analytics', error }, 'Error tracking CTA click');
		return json({ error: 'Failed to track CTA click' }, { status: 500 });
	}
};
