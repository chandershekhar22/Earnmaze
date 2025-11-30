import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { emailConversions, pageVisits } from '$lib/db/schema/analytics';
import { eq } from 'drizzle-orm';
import { validateTurnstileToken } from '$lib/server/turnstile';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const { email, userId, sessionId, utmParams, timeToConvert, turnstileToken } = await request.json();

		// Validate Turnstile token
		if (!turnstileToken) {
			return json({ error: 'Verification required' }, { status: 400 });
		}

		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		// Validate email
		if (!email || !email.includes('@')) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		// Find the visit ID for this session
		const visit = await db
			.select({ 
				id: pageVisits.id,
				utmSource: pageVisits.utmSource,
				utmMedium: pageVisits.utmMedium,
				utmCampaign: pageVisits.utmCampaign,
			})
			.from(pageVisits)
			.where(eq(pageVisits.sessionId, sessionId))
			.orderBy(pageVisits.visitedAt)
			.limit(1);

		const visitData = visit.length > 0 ? visit[0] : null;

		// Track the email conversion
		await db.insert(emailConversions).values({
			email,
			userId,
			sessionId,
			visitId: visitData?.id || null,
			utmSource: utmParams?.utm_source || visitData?.utmSource || null,
			utmMedium: utmParams?.utm_medium || visitData?.utmMedium || null,
			utmCampaign: utmParams?.utm_campaign || visitData?.utmCampaign || null,
			timeToConvertSeconds: timeToConvert,
			isConverted: true,
			convertedAt: new Date(),
		});

		// Email conversion tracked successfully

		// Return redirect URL
		const redirectUrl = '/register?email=' + encodeURIComponent(email);

		return json({ 
			success: true, 
			redirectUrl 
		});

	} catch (error) {
		console.error('Error saving email:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
