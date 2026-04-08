import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getAllRewards, createReward } from '$lib/db/repositories';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------

const rewardSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	description: z.string().optional().nullable(),
	type: z.enum(['gift_card', 'cash', 'product', 'discount', 'experience']),
	provider: z.string().max(100).optional().nullable(),
	category: z.string().max(50).optional().nullable(),
	pointsCost: z.coerce.number().int().min(1, 'Points cost must be at least 1'),
	value: z.coerce.number().min(0, 'Value must be non-negative'),
	currency: z.string().max(10).optional().default('USD'),
	stock: z.number().int().min(0).optional().nullable(),
	maxPerUser: z.number().int().min(1).optional().nullable(),
	isActive: z.boolean().optional().default(true),
	isFeatured: z.boolean().optional().default(false),
	image: z.string().max(500).optional().nullable(),
	terms: z.string().optional().nullable(),
	expiresAt: z.string().datetime().optional().nullable(),
});

// -------------------------------------------------------------------
// GET — list ALL rewards (including inactive) for admin management
// -------------------------------------------------------------------

export const GET: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);

	try {
		const rows = await getAllRewards();
		return json({ success: true, data: rows });
	} catch (error) {
		Logger.root.error({ context: 'admin', error, adminId: admin.id }, 'Failed to fetch rewards');
		return json(
			{ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch rewards' },
			{ status: 500 }
		);
	}
};

// -------------------------------------------------------------------
// POST — create a new reward
// -------------------------------------------------------------------

export const POST: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);

	try {
		const body = await event.request.json();
		const validated = rewardSchema.parse(body);

		const created = await createReward({
			name: validated.name,
			description: validated.description ?? null,
			type: validated.type,
			provider: validated.provider ?? null,
			category: validated.category ?? null,
			pointsCost: validated.pointsCost,
			value: String(validated.value),
			currency: validated.currency,
			stock: validated.stock ?? null,
			maxPerUser: validated.maxPerUser ?? null,
			isActive: validated.isActive,
			isFeatured: validated.isFeatured,
			image: validated.image ?? null,
			terms: validated.terms ?? null,
			expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
		});

		Logger.root.info(
			{ context: 'admin', adminId: admin.id, rewardId: created.id },
			`Reward created: ${created.name}`
		);

		return json({ success: true, data: created }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json(
				{
					success: false,
					error: 'VALIDATION_ERROR',
					message: error.issues[0]?.message || 'Validation failed',
					details: error.issues,
				},
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'admin', error, adminId: admin.id }, 'Failed to create reward');
		return json(
			{ success: false, error: 'CREATE_FAILED', message: 'Failed to create reward' },
			{ status: 500 }
		);
	}
};
