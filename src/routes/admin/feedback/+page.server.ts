import { requireAdmin } from '$lib/server/auth';
import { obfuscateEmail } from '$lib/utils/obfuscate';
import type { PageServerLoad } from './$types';
import { getAllFeedback, getFeedbackCount } from '$lib/db/repositories';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const page = parseInt(event.url.searchParams.get('page') || '1');
	const limit = 30;
	const offset = (page - 1) * limit;

	const [items, total] = await Promise.all([getAllFeedback(limit, offset), getFeedbackCount()]);

	return {
		feedback: items.map((f) => ({
			...f,
			userEmail: obfuscateEmail(f.userEmail),
			email: obfuscateEmail(f.email),
			createdAt: f.createdAt.toISOString(),
		})),
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};
