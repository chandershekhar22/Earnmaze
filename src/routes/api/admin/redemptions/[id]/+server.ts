import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { db } from '$lib/db';
import { redemptions } from '$lib/db/schema/transactions';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Logger } from '$lib/utils/app-logger';

const updateSchema = z.object({
	status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold']).optional(),
	processingNotes: z.string().max(5000).optional(),
});

export const PATCH: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const { id } = event.params;

	try {
		const body = await event.request.json();
		const validated = updateSchema.parse(body);

		const updates: Record<string, unknown> = { updatedAt: new Date() };
		if (validated.status) {
			updates.status = validated.status;
			if (validated.status === 'completed') { updates.completedAt = new Date(); updates.processedBy = admin.id; }
			if (validated.status === 'processing') { updates.processedBy = admin.id; updates.processedAt = new Date(); }
			if (['completed', 'processing'].includes(validated.status)) { updates.approvedBy = admin.id; updates.approvedAt = new Date(); }
		}
		if (validated.processingNotes !== undefined) updates.processingNotes = validated.processingNotes;

		const [updated] = await db.update(redemptions).set(updates).where(eq(redemptions.id, id)).returning();
		if (!updated) return json({ success: false, error: 'NOT_FOUND', message: 'Redemption not found' }, { status: 404 });

		return json({ success: true, data: { status: updated.status } });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ success: false, error: 'VALIDATION_ERROR', message: error.issues[0]?.message }, { status: 400 });
		}
		Logger.root.error({ context: 'admin', error, adminId: admin.id, redemptionId: id }, 'Failed to update redemption');
		return json({ success: false, error: 'UPDATE_FAILED', message: 'Failed to update redemption' }, { status: 500 });
	}
};
