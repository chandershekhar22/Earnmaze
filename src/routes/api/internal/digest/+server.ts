/**
 * Internal digest endpoint — called by em-worker's Celery beat tasks
 * (digest.thirty_minute, digest.daily) to fetch a pre-rendered summary
 * that gets posted to the Telegram updates channel.
 *
 * Auth: shared secret in `X-Internal-Key` header. Compared with
 * timingSafeEqual so an attacker can't side-channel the key character-
 * by-character via response latency.
 */
import { timingSafeEqual } from 'node:crypto';
import { json, error } from '@sveltejs/kit';
import { and, gte, eq, count } from 'drizzle-orm';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { surveyTransaction } from '$lib/db/schema/surveys';
import { Logger } from '$lib/utils/app-logger';
import type { RequestHandler } from '@sveltejs/kit';

type Period = '30min' | 'daily';

function periodWindow(period: Period): { from: Date; label: string } {
	const now = new Date();
	if (period === '30min') {
		return { from: new Date(now.getTime() - 30 * 60 * 1000), label: 'Last 30 min' };
	}
	return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), label: 'Last 24h' };
}

async function buildSummary(period: Period): Promise<string> {
	const { from, label } = periodWindow(period);

	const [signupRow] = await db
		.select({ n: count() })
		.from(user)
		.where(gte(user.createdAt, from));

	const [startedRow] = await db
		.select({ n: count() })
		.from(surveyTransaction)
		.where(gte(surveyTransaction.startedAt, from));

	const [completedRow] = await db
		.select({ n: count() })
		.from(surveyTransaction)
		.where(
			and(
				eq(surveyTransaction.status, 'completed'),
				gte(surveyTransaction.completedAt, from)
			)
		);

	const signups = signupRow?.n ?? 0;
	const started = startedRow?.n ?? 0;
	const completed = completedRow?.n ?? 0;

	if (period === 'daily') {
		// Daily digest also includes a lifetime-to-date snapshot.
		const [totalUsersRow] = await db
			.select({ n: count() })
			.from(user);
		const totalUsers = totalUsersRow?.n ?? 0;
		return (
			`📊 <b>Daily digest</b> (${label})\n` +
			`✨ New signups: <b>${signups}</b>\n` +
			`▶️ Surveys started: <b>${started}</b>\n` +
			`✅ Surveys completed: <b>${completed}</b>\n` +
			`👥 Total users: <b>${totalUsers}</b>`
		);
	}

	return (
		`📊 <b>${label}</b>\n` +
		`✨ Signups: <b>${signups}</b>\n` +
		`▶️ Started: <b>${started}</b>\n` +
		`✅ Completed: <b>${completed}</b>`
	);
}

export const GET: RequestHandler = async ({ request, url }) => {
	const expected = (process.env.INTERNAL_API_KEY ?? '').trim();
	if (!expected) {
		// If the secret isn't configured, refuse to operate at all rather than
		// allow unauthenticated access.
		throw error(503, 'Internal API not configured');
	}

	const provided = request.headers.get('x-internal-key') ?? '';
	// Length check first — avoids creating Buffers of different sizes (which
	// timingSafeEqual would throw on) and itself is constant-time relative to
	// the secret length, since `expected.length` is fixed.
	let ok = false;
	if (provided.length === expected.length) {
		const a = Buffer.from(provided);
		const b = Buffer.from(expected);
		ok = timingSafeEqual(a, b);
	}
	if (!ok) {
		throw error(403, 'Forbidden');
	}

	const periodParam = url.searchParams.get('period') ?? '30min';
	if (periodParam !== '30min' && periodParam !== 'daily') {
		throw error(400, 'Invalid period (expected 30min or daily)');
	}

	try {
		const summary = await buildSummary(periodParam);
		return json({ summary });
	} catch (err) {
		Logger.root.error({ context: 'errors', period: periodParam, error: err }, 'Digest build failed');
		throw error(500, 'Digest build failed');
	}
};
