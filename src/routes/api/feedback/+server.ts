import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { getClientIP } from '$lib/server/geo-restriction';
import { createFeedback } from '$lib/db/repositories';

const feedbackSchema = z.object({
	rating: z.number().int().min(1).max(5).nullable().optional(),
	topic: z.string().trim().max(60).nullable().optional(),
	message: z.string().trim().max(2000).optional().default(''),
	email: z.string().trim().email().max(254).nullable().optional()
});

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	try {
		const body = await request.json();

		const parsed = feedbackSchema.safeParse(body);
		if (!parsed.success) {
			return json({ error: 'Invalid feedback payload' }, { status: 400 });
		}

		const { rating, topic, message, email } = parsed.data;

		// Require at least a rating or a message so we don't store empty submissions.
		if (rating == null && !message) {
			return json({ error: 'Please add a rating or a message' }, { status: 400 });
		}

		const ip = getClientIP(event);

		await createFeedback({
			userId: event.locals.user?.id ?? null,
			rating: rating ?? null,
			topic: topic ?? null,
			message,
			email: email ?? null,
			ipAddress: ip
		});

		Logger.root.info(
			{
				context: 'feedback',
				rating: rating ?? null,
				topic: topic ?? null,
				hasMessage: Boolean(message),
				userId: event.locals.user?.id ?? null,
				ip
			},
			'Feedback received'
		);

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'feedback', error }, 'Error handling feedback submission');
		return json({ error: 'Failed to submit feedback' }, { status: 500 });
	}
};
