import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { redemptions } from '$lib/db/schema/transactions';
import { user } from '$lib/db/schema/auth';
import { eq, desc, sql, and } from 'drizzle-orm';
import { obfuscateEmail } from '$lib/utils/obfuscate';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const statusFilter = event.url.searchParams.get('status') || 'all';
	const page = parseInt(event.url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	const conditions = statusFilter !== 'all' ? eq(redemptions.status, statusFilter) : undefined;

	const safe = async <T>(fn: Promise<T>, fb: T): Promise<T> => {
		try { return await fn; } catch { return fb; }
	};

	const [rows, countResult, statusCounts] = await Promise.all([
		safe(db.select({
			id: redemptions.id,
			panelistId: redemptions.panelistId,
			panelistEmail: user.email,
			panelistName: user.name,
			type: redemptions.type,
			provider: redemptions.provider,
			amount: redemptions.amount,
			value: redemptions.value,
			status: redemptions.status,
			paymentDetails: redemptions.paymentDetails,
			processingNotes: redemptions.processingNotes,
			createdAt: redemptions.createdAt,
			completedAt: redemptions.completedAt,
		})
		.from(redemptions)
		.leftJoin(user, eq(redemptions.panelistId, user.id))
		.where(conditions)
		.orderBy(desc(redemptions.createdAt))
		.limit(limit)
		.offset(offset), []),

		safe(db.select({ count: sql<number>`count(*)`.as('count') }).from(redemptions).where(conditions), [{ count: 0 }]),

		safe(db.select({
			status: redemptions.status,
			count: sql<number>`count(*)`.as('count'),
		}).from(redemptions).groupBy(redemptions.status), []),
	]);

	const total = Number(countResult[0]?.count ?? 0);
	const counts: Record<string, number> = { all: 0 };
	for (const sc of statusCounts) { counts[sc.status] = Number(sc.count); counts.all += Number(sc.count); }

	return {
		redemptions: rows.map(r => ({
			id: r.id,
			panelistId: r.panelistId,
			panelistEmail: obfuscateEmail(r.panelistEmail),
			panelistName: r.panelistName,
			type: r.type,
			provider: r.provider,
			amount: r.amount,
			value: Number(r.value),
			status: r.status,
			rewardName: (r.paymentDetails as any)?.rewardName || r.provider || 'Reward',
			processingNotes: r.processingNotes,
			createdAt: r.createdAt.toISOString(),
			completedAt: r.completedAt?.toISOString() ?? null,
		})),
		statusCounts: counts,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		filters: { status: statusFilter },
	};
};
