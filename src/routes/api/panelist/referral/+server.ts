import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { user as userTable } from '$lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';

// Returns the signed-in user's referral code (used by the Refer & Earn modal).
export const GET: RequestHandler = async ({ locals }) => {
	const authUser = locals.user;
	if (!authUser) {
		return json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const [row] = await db
			.select({ referralCode: userTable.referralCode })
			.from(userTable)
			.where(eq(userTable.id, authUser.id))
			.limit(1);

		return json({ referralCode: row?.referralCode ?? '' });
	} catch (error) {
		Logger.root.error({ context: 'api', userId: authUser.id, error }, 'Referral code fetch failed');
		return json(
			{ error: 'FETCH_FAILED', message: 'Failed to fetch referral code' },
			{ status: 500 }
		);
	}
};
