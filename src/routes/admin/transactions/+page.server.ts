import { requireAdmin } from '$lib/server/auth';
import { obfuscateEmail } from '$lib/utils/obfuscate';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { pointsTransactions } from '$lib/db/schema/panelist-points';
import { user } from '$lib/db/schema/auth';
import { desc, eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const page = parseInt(event.url.searchParams.get('page') || '1');
	const typeFilter = event.url.searchParams.get('type') || 'all';
	const limit = 30;
	const offset = (page - 1) * limit;

	const conditions = typeFilter !== 'all'
		? eq(pointsTransactions.type, typeFilter as any)
		: undefined;

	const [transactions, countResult] = await Promise.all([
		db
			.select({
				id: pointsTransactions.id,
				panelistId: pointsTransactions.panelistId,
				panelistEmail: user.email,
				panelistName: user.name,
				type: pointsTransactions.type,
				points: pointsTransactions.points,
				currentBalance: pointsTransactions.currentBalance,
				description: pointsTransactions.description,
				referenceType: pointsTransactions.referenceType,
				referenceId: pointsTransactions.referenceId,
				createdAt: pointsTransactions.createdAt,
			})
			.from(pointsTransactions)
			.leftJoin(user, eq(pointsTransactions.panelistId, user.id))
			.where(conditions)
			.orderBy(desc(pointsTransactions.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)`.as('count') })
			.from(pointsTransactions)
			.where(conditions),
	]);

	const total = Number(countResult[0]?.count ?? 0);

	return {
		transactions: transactions.map(t => ({
			...t,
			panelistEmail: obfuscateEmail(t.panelistEmail),
			createdAt: t.createdAt.toISOString(),
		})),
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		filters: { type: typeFilter },
	};
};
