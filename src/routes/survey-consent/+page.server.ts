import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, getUserByEmail } from '$lib/db';
import { user } from '$lib/db/schema/auth';

/**
 * Sanitises a `next` redirect param to prevent open-redirect attacks.
 * Accepts only same-origin relative paths. Blocks //, \\, and anything that
 * URL parsing rejects or that resolves off-origin.
 */
function safePath(input: string | null, fallback = '/surveys'): string {
	if (!input || !input.startsWith('/') || input.startsWith('//')) return fallback;
	if (input.includes('\\')) return fallback;
	try {
		const u = new URL(input, 'https://localhost');
		if (u.origin !== 'https://localhost') return fallback;
		return u.pathname + u.search + u.hash;
	} catch {
		return fallback;
	}
}

/**
 * Resolve the underlying user.id from either auth flavour. Guest sessions
 * always have an `email` (set at save-email creation); we look up the
 * corresponding user record by email even when `upgradedToUserId` is null.
 */
async function resolveUserId(event: Parameters<PageServerLoad>[0]): Promise<string | null> {
	if (event.locals.user?.id) return event.locals.user.id;
	if (event.locals.guestSession?.upgradedToUserId) {
		return event.locals.guestSession.upgradedToUserId;
	}
	if (event.locals.guestSession?.email) {
		const u = await getUserByEmail(event.locals.guestSession.email);
		return u?.id ?? null;
	}
	return null;
}

/**
 * Server load — figures out the user context (regular session OR guest session)
 * and skips the consent page if it's already been accepted, redirecting
 * straight to ?next=...
 */
export const load: PageServerLoad = async (event) => {
	const safeNext = safePath(event.url.searchParams.get('next'));

	const userId = await resolveUserId(event);
	if (!userId) {
		throw redirect(302, '/login');
	}

	const [row] = await db
		.select({ acceptedAt: user.surveyDataSharingAcceptedAt })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (row?.acceptedAt) {
		// Already accepted — straight through.
		throw redirect(302, safeNext);
	}

	return { nextUrl: safeNext };
};
