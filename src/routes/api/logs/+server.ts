import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import type { ClientLogLevel, ClientLogPayload } from '$types/logging';

const allowedLevels: ClientLogLevel[] = ['debug', 'info', 'warn', 'error'];
const MAX_PAYLOAD_SIZE = 10_000; // 10KB max data size

// Simple in-memory rate limit: max 30 requests per IP per minute
const rateBucket = new Map<string, { count: number; resetAt: number }>();

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	// Rate limit by IP
	const ip = getClientAddress();
	const now = Date.now();
	const bucket = rateBucket.get(ip);
	if (bucket && now < bucket.resetAt) {
		if (bucket.count >= 30) {
			return json({ error: 'Too many requests' }, { status: 429 });
		}
		bucket.count++;
	} else {
		rateBucket.set(ip, { count: 1, resetAt: now + 60_000 });
	}

	try {
		const body = (await request.json()) as Partial<ClientLogPayload>;
		const level = body.level ?? 'info';
		const message = body.message ?? 'client-log';
		if (!allowedLevels.includes(level)) {
			return json({ error: 'Invalid log level' }, { status: 400 });
		}

		// Limit data size to prevent log flooding
		const dataStr = JSON.stringify(body.data || {});
		if (dataStr.length > MAX_PAYLOAD_SIZE) {
			return json({ error: 'Payload too large' }, { status: 413 });
		}

		const data = {
			context: 'client-log',
			userId: locals.user?.id,
			href: body.href,
			...((body.data as Record<string, unknown>) || {})
		};

		(Logger.root as any)[level]({ ...data }, message);

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Client log ingestion failed');
		return json({ error: 'Invalid payload' }, { status: 400 });
	}
};
