import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { db } from '$lib/db';
import { pageVisits } from '$lib/db/schema/analytics';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const body = await request.json();
		const {
			visitorId,
			sessionId,
			fingerprint,
			utm_source,
			utm_medium,
			utm_campaign,
			utm_term,
			utm_content,
			referrer,
			landingPage,
			userAgent,
			deviceType,
			browserName,
			osName,
			screenResolution,
			timezone,
			language,
		} = body;

		// Get client IP address
		const ipAddress = getClientAddress();

		// Insert visit tracking
		await db.insert(pageVisits).values({
			visitorId,
			sessionId,
			fingerprint,
			utmSource: utm_source,
			utmMedium: utm_medium,
			utmCampaign: utm_campaign,
			utmTerm: utm_term,
			utmContent: utm_content,
			referrer,
			landingPage,
			userAgent,
			deviceType,
			browserName,
			osName,
			screenResolution,
			timezone,
			language,
			ipAddress,
			visitedAt: new Date(),
		});

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'analytics', error }, 'Error tracking visit');
		return json({ error: 'Failed to track visit' }, { status: 500 });
	}
};
