import { requireAdmin } from '$lib/server/auth';
import { obfuscateEmail } from '$lib/utils/obfuscate';
import type { PageServerLoad } from './$types';
import { getAllTickets, getAllFaqs, getAdminUsersList } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	try {
		const [tickets, faqs, adminUsers] = await Promise.all([getAllTickets(), getAllFaqs(), getAdminUsersList()]);

		return {
			tickets: tickets.map((t) => ({
				id: t.id,
				panelistId: t.panelistId,
				panelistEmail: obfuscateEmail(t.panelistEmail),
				panelistName: t.panelistName,
				subject: t.subject,
				message: t.message,
				status: t.status,
				priority: t.priority,
				assignedTo: (t as any).assignedTo ?? null,
				adminReply: t.adminReply,
				repliedAt: t.repliedAt?.toISOString() ?? null,
				repliedBy: t.repliedBy,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString(),
			})),
			faqs: faqs.map((f) => ({
				id: f.id,
				question: f.question,
				answer: f.answer,
				sortOrder: f.sortOrder,
				isActive: f.isActive,
			})),
			adminUsers: adminUsers.map(u => ({ id: u.id, name: u.name, email: obfuscateEmail(u.email) })),
		};
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load support data');
		return { tickets: [], faqs: [], adminUsers: [] };
	}
};
