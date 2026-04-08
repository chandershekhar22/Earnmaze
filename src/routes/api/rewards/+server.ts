import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getActiveRewards } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

/**
 * GET /api/rewards — list active, non-expired rewards visible to panelists.
 * No auth required (rewards catalog is public-ish).
 */
export const GET: RequestHandler = async () => {
	try {
		const rows = await getActiveRewards();

		// Map to the shape the frontend expects
		const mapped = rows.map((r) => ({
			id: r.id,
			title: r.name,
			description: r.description,
			type: r.type,
			provider: r.provider,
			category: r.category,
			pointsCost: r.pointsCost,
			originalPrice: r.value ? Number(r.value) : undefined,
			currency: r.currency,
			stock: r.stock ?? undefined,
			imageUrl: r.image ?? undefined,
			isFeatured: r.isFeatured,
			terms: r.terms,
			expiresAt: r.expiresAt,
		}));

		return json({ success: true, data: mapped });
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Failed to fetch rewards from DB');
		return json({ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch rewards' }, { status: 500 });
	}
};