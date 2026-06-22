/**
 * POST /api/panelist/locale  { locale: string }
 *
 * Persists the panelist's preferred language to their user record AND sets
 * the `em_locale` cookie so subsequent requests use the new locale before a
 * full session reload. Public-page visitors don't hit this endpoint — they
 * change locale via URL prefix navigation handled by Paraglide directly.
 */
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { locales } from '$lib/paraglide/runtime';
import { Logger } from '$lib/utils/app-logger';

const bodySchema = z.object({
	locale: z.string().min(2).max(10)
});

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Sign in required');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		throw error(400, parsed.error.issues[0]?.message ?? 'Invalid input');
	}

	const next = parsed.data.locale;
	if (!(locales as readonly string[]).includes(next)) {
		throw error(400, `Unsupported locale: ${next}`);
	}

	try {
		await db.update(user).set({ locale: next, updatedAt: new Date() }).where(eq(user.id, userId));
	} catch (err) {
		Logger.root.error({ context: 'i18n', userId, locale: next, error: err }, 'Failed to persist locale');
		throw error(500, 'Could not save preference');
	}

	// Match the cookie name configured in vite.config.ts (`cookieName: 'em_locale'`).
	cookies.set('em_locale', next, {
		path: '/',
		httpOnly: false,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365
	});

	return json({ success: true, locale: next });
};
