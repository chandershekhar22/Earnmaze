import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { createPageVisit } from '$lib/db/repositories';
import { trackVisitSchema, validateInput } from '$lib/validation/api-schemas';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const body = await request.json();

		// Validate and sanitize input
		const validation = await validateInput(trackVisitSchema, body);
		if (!validation.success) {
			return json({ error: validation.error }, { status: 400 });
		}

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
		} = validation.data;

		// Get client IP address
		const ipAddress = getClientAddress() ?? null;

		// Insert visit tracking
		await createPageVisit({
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
		});

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'analytics', error }, 'Error tracking visit');
		return json({ error: 'Failed to track visit' }, { status: 500 });
	}
};
