import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { referrals } from '$lib/db/schema/transactions';
import { user } from '$lib/db/schema/auth';
import { eq, desc, sql, and } from 'drizzle-orm';
import { obfuscateEmail } from '$lib/utils/obfuscate';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const statusFilter = event.url.searchParams.get('status') || 'all';
	const page = parseInt(event.url.searchParams.get('page') || '1');
	const limit = 30;
	const offset = (page - 1) * limit;

	const conditions = statusFilter !== 'all' ? eq(referrals.status, statusFilter) : undefined;

	// Alias for referred user
	const referrer = user;

	const safe = async <T>(fn: Promise<T>, fb: T): Promise<T> => {
		try { return await fn; } catch { return fb; }
	};

	const [rows, countResult, statusCounts] = await Promise.all([
		safe(db.select({
			id: referrals.id,
			referrerId: referrals.referrerId,
			referredId: referrals.referredId,
			referralCode: referrals.referralCode,
			status: referrals.status,
			referrerBonus: referrals.referrerBonus,
			referredBonus: referrals.referredBonus,
			qualifiedAt: referrals.qualifiedAt,
			paidAt: referrals.paidAt,
			createdAt: referrals.createdAt,
		})
		.from(referrals)
		.where(conditions)
		.orderBy(desc(referrals.createdAt))
		.limit(limit)
		.offset(offset), []),

		safe(db.select({ count: sql<number>`count(*)`.as('count') }).from(referrals).where(conditions), [{ count: 0 }]),

		safe(db.select({
			status: referrals.status,
			count: sql<number>`count(*)`.as('count'),
			totalBonus: sql<number>`coalesce(sum(${referrals.referrerBonus}), 0)`.as('total_bonus'),
		}).from(referrals).groupBy(referrals.status), []),
	]);

	// Fetch user names for referrers and referred users
	const userIds = new Set<string>();
	rows.forEach(r => { userIds.add(r.referrerId); userIds.add(r.referredId); });

	const userMap: Record<string, { name: string | null; email: string | null }> = {};
	if (userIds.size > 0) {
		const users = await safe(
			db.select({ id: user.id, name: user.name, email: user.email })
				.from(user)
				.where(sql`${user.id} IN (${sql.join([...userIds].map(id => sql`${id}`), sql`, `)})`),
			[]
		);
		users.forEach(u => { userMap[u.id] = { name: u.name, email: u.email }; });
	}

	const total = Number(countResult[0]?.count ?? 0);
	const counts: Record<string, number> = { all: 0 };
	let totalBonusPaid = 0;
	for (const sc of statusCounts) {
		counts[sc.status] = Number(sc.count);
		counts.all += Number(sc.count);
		if (['completed', 'paid'].includes(sc.status)) totalBonusPaid += Number(sc.totalBonus);
	}

	return {
		referrals: rows.map(r => ({
			id: r.id,
			referrerName: userMap[r.referrerId]?.name || 'Unknown',
			referrerEmail: obfuscateEmail(userMap[r.referrerId]?.email),
			referrerId: r.referrerId,
			referredName: userMap[r.referredId]?.name || 'Unknown',
			referredEmail: obfuscateEmail(userMap[r.referredId]?.email),
			referredId: r.referredId,
			referralCode: r.referralCode,
			status: r.status,
			referrerBonus: r.referrerBonus ?? 0,
			referredBonus: r.referredBonus ?? 0,
			qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
			paidAt: r.paidAt?.toISOString() ?? null,
			createdAt: r.createdAt.toISOString(),
		})),
		statusCounts: counts,
		totalBonusPaid,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		filters: { status: statusFilter },
	};
};
