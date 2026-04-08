import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db } from '$lib/db';
import { referrals } from '$lib/db/schema/transactions';
import { user } from '$lib/db/schema/auth';
import { eq, desc, sql } from 'drizzle-orm';
import { obfuscateEmail } from '$lib/utils/obfuscate';

export const load: PageServerLoad = async (event) => {
	const authUser = await requirePanelist(event);

	const [userRow] = await db
		.select({ referralCode: user.referralCode })
		.from(user)
		.where(eq(user.id, authUser.id))
		.limit(1);

	const myReferrals = await db
		.select({
			id: referrals.id,
			referredName: user.name,
			referredEmail: user.email,
			status: referrals.status,
			referrerBonus: referrals.referrerBonus,
			qualifiedAt: referrals.qualifiedAt,
			paidAt: referrals.paidAt,
			createdAt: referrals.createdAt,
		})
		.from(referrals)
		.leftJoin(user, eq(referrals.referredId, user.id))
		.where(eq(referrals.referrerId, authUser.id))
		.orderBy(desc(referrals.createdAt))
		.limit(50);

	const [stats] = await db
		.select({
			total: sql<number>`count(*)`.as('total'),
			pending: sql<number>`count(*) filter (where ${referrals.status} = 'pending')`.as('pending'),
			qualified: sql<number>`count(*) filter (where ${referrals.status} = 'qualified')`.as('qualified'),
			paid: sql<number>`count(*) filter (where ${referrals.status} IN ('completed', 'paid'))`.as('paid'),
			totalEarned: sql<number>`coalesce(sum(${referrals.referrerBonus}) filter (where ${referrals.status} IN ('completed', 'paid')), 0)`.as('total_earned'),
		})
		.from(referrals)
		.where(eq(referrals.referrerId, authUser.id));

	return {
		referralCode: userRow?.referralCode ?? '',
		referrals: myReferrals.map(r => ({
			id: r.id,
			referredName: r.referredName || 'User',
			referredEmail: obfuscateEmail(r.referredEmail),
			status: r.status,
			bonus: r.referrerBonus ?? 0,
			qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
			paidAt: r.paidAt?.toISOString() ?? null,
			createdAt: r.createdAt.toISOString(),
		})),
		stats: {
			total: Number(stats?.total ?? 0),
			pending: Number(stats?.pending ?? 0),
			qualified: Number(stats?.qualified ?? 0),
			paid: Number(stats?.paid ?? 0),
			totalEarned: Number(stats?.totalEarned ?? 0),
		},
	};
};
