import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { createFaq, getAllFaqs, updateFaq, deleteFaq } from '$lib/db/repositories';
import { z } from 'zod';

// Translation overrides keyed by non-base locale code (e.g. "es", "fr").
// Either field may be omitted to fall back to the base column at read time.
const translationsSchema = z
	.record(
		z.string().min(2).max(10),
		z.object({
			question: z.string().min(1).max(500).optional(),
			answer: z.string().min(1).max(5000).optional(),
		}),
	)
	.optional();

const createSchema = z.object({
	question: z.string().min(1).max(500),
	answer: z.string().min(1).max(5000),
	translations: translationsSchema,
});

const updateSchema = z.object({
	id: z.string().uuid(),
	question: z.string().min(1).max(500).optional(),
	answer: z.string().min(1).max(5000).optional(),
	sortOrder: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
	translations: translationsSchema,
});

export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	const faqs = await getAllFaqs();
	return json({ faqs });
};

export const POST: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	try {
		const body = await event.request.json();
		const data = createSchema.parse(body);
		const created = await createFaq(data.question, data.answer, admin.id, data.translations ?? {});
		return json({ success: true, faq: created });
	} catch (err) {
		if (err instanceof z.ZodError) return json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
		return json({ error: 'Failed to create FAQ' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async (event) => {
	await requireAdmin(event);
	try {
		const body = await event.request.json();
		const { id, ...data } = updateSchema.parse(body);
		const updated = await updateFaq(id, data);
		return json({ success: true, faq: updated });
	} catch (err) {
		if (err instanceof z.ZodError) return json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
		return json({ error: 'Failed to update FAQ' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	await requireAdmin(event);
	try {
		const { id } = await event.request.json();
		if (!id) return json({ error: 'ID required' }, { status: 400 });
		await deleteFaq(id);
		return json({ success: true });
	} catch {
		return json({ error: 'Failed to delete FAQ' }, { status: 500 });
	}
};
