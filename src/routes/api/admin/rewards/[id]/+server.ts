import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getRewardById, updateReward, deactivateReward } from '$lib/db/repositories';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

// -------------------------------------------------------------------
// Validation (partial — all fields optional for PATCH)
// -------------------------------------------------------------------

const rewardUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional().nullable(),
	type: z.enum(['gift_card', 'cash', 'product', 'discount', 'experience']).optional(),
	provider: z.string().max(100).optional().nullable(),
	category: z.string().max(50).optional().nullable(),
	pointsCost: z.coerce.number().int().min(1).optional(),
	value: z.coerce.number().min(0).optional(),
	currency: z.string().max(10).optional(),
	stock: z.number().int().min(0).optional().nullable(),
	maxPerUser: z.number().int().min(1).optional().nullable(),
	isActive: z.boolean().optional(),
	isFeatured: z.boolean().optional(),
	image: z.string().max(500).optional().nullable(),
	terms: z.string().optional().nullable(),
	expiresAt: z.string().datetime().optional().nullable(),
});

// -------------------------------------------------------------------
// GET — single reward by ID
// -------------------------------------------------------------------

export const GET: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const { id } = event.params;

	try {
		const reward = await getRewardById(id);

		if (!reward) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Reward not found' },
				{ status: 404 }
			);
		}

		return json({ success: true, data: reward });
	} catch (error) {
		Logger.root.error({ context: 'admin', error, adminId: admin.id, rewardId: id }, 'Failed to fetch reward');
		return json(
			{ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch reward' },
			{ status: 500 }
		);
	}
};

// -------------------------------------------------------------------
// PATCH — update a reward
// -------------------------------------------------------------------

export const PATCH: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const { id } = event.params;

	try {
		const body = await event.request.json();
		const validated = rewardUpdateSchema.parse(body);

		// Build the update set — only include fields that were provided
		const updateFields: Record<string, unknown> = {};

		if (validated.name !== undefined) updateFields.name = validated.name;
		if (validated.description !== undefined) updateFields.description = validated.description;
		if (validated.type !== undefined) updateFields.type = validated.type;
		if (validated.provider !== undefined) updateFields.provider = validated.provider;
		if (validated.category !== undefined) updateFields.category = validated.category;
		if (validated.pointsCost !== undefined) updateFields.pointsCost = validated.pointsCost;
		if (validated.value !== undefined) updateFields.value = String(validated.value);
		if (validated.currency !== undefined) updateFields.currency = validated.currency;
		if (validated.stock !== undefined) updateFields.stock = validated.stock;
		if (validated.maxPerUser !== undefined) updateFields.maxPerUser = validated.maxPerUser;
		if (validated.isActive !== undefined) updateFields.isActive = validated.isActive;
		if (validated.isFeatured !== undefined) updateFields.isFeatured = validated.isFeatured;
		if (validated.image !== undefined) updateFields.image = validated.image;
		if (validated.terms !== undefined) updateFields.terms = validated.terms;
		if (validated.expiresAt !== undefined) {
			updateFields.expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;
		}

		if (Object.keys(updateFields).length === 0) {
			return json(
				{ success: false, error: 'EMPTY_UPDATE', message: 'No fields to update' },
				{ status: 400 }
			);
		}

		const updated = await updateReward(id, updateFields);

		if (!updated) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Reward not found' },
				{ status: 404 }
			);
		}

		Logger.root.info(
				{ context: 'admin', adminId: admin.id, rewardId: id, fields: Object.keys(updateFields) },
		);

		return json({ success: true, data: updated });
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
		Logger.root.error({ context: 'admin', error, adminId: admin.id, rewardId: id }, 'Failed to update reward');
		return json(
			{ success: false, error: 'UPDATE_FAILED', message: 'Failed to update reward' },
			{ status: 500 }
		);
	}
};

// -------------------------------------------------------------------
// DELETE — soft-delete by deactivating (preserves redemption history)
// -------------------------------------------------------------------

export const DELETE: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const { id } = event.params;

	try {
		const deactivated = await deactivateReward(id);

		if (!deactivated) {
			return json(
				{ success: false, error: 'NOT_FOUND', message: 'Reward not found' },
				{ status: 404 }
			);
		}

		Logger.root.info(
			{ context: 'admin', adminId: admin.id, rewardId: id },
			`Reward deactivated: ${deactivated.name}`
		);

		return json({ success: true, message: `Reward "${deactivated.name}" has been deactivated` });
	} catch (error) {
		Logger.root.error({ context: 'admin', error, adminId: admin.id, rewardId: id }, 'Failed to delete reward');
		return json(
			{ success: false, error: 'DELETE_FAILED', message: 'Failed to delete reward' },
			{ status: 500 }
		);
	}
};
