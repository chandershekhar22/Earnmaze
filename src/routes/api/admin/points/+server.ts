import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { addPoints, db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

const assignPointsSchema = z.object({
	panelistId: z.string().uuid('Panelist ID must be a valid UUID'),
	points: z.number().int().positive('Points must be a positive integer'),
	type: z.enum(['bonus', 'adjustment', 'penalty'] as const),
	description: z.string().min(1, 'Description is required').max(255)
});

export const POST: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);

	try {
		const body = await event.request.json();
		const validated = assignPointsSchema.parse(body);

		// Verify panelist exists
		const [panelist] = await db.select({ id: user.id }).from(user).where(eq(user.id, validated.panelistId)).limit(1);
		if (!panelist) {
			return json({ success: false, error: 'NOT_FOUND', message: 'Panelist not found' }, { status: 404 });
		}

		// For penalty type, negate the points
		const effectivePoints = validated.type === 'penalty' ? -validated.points : validated.points;

		await addPoints(
			validated.panelistId,
			effectivePoints,
			validated.description,
			validated.type,
			'admin_manual',
			undefined,
			{ adminId: admin.id, adminAction: validated.type }
		);

		return json({
			success: true,
			message: `Successfully assigned ${effectivePoints} points to panelist`,
			data: {
				panelistId: validated.panelistId,
				points: effectivePoints,
				type: validated.type
			}
		}, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const zodError = error as z.ZodError;
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: zodError.issues[0]?.message || 'Validation failed' },
				{ status: 400 }
			);
		}
		Logger.root.error({ context: 'admin', error, adminId: admin.id }, 'Failed to assign points');
		return json(
			{ success: false, error: 'ASSIGN_FAILED', message: 'Failed to assign points' },
			{ status: 500 }
		);
	}
};
