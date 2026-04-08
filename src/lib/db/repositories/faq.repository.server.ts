import { eq, asc } from "drizzle-orm";
import { faq } from "../schema/support-tickets";
import { db } from "..";

export async function getActiveFaqs() {
	return db
		.select()
		.from(faq)
		.where(eq(faq.isActive, true))
		.orderBy(asc(faq.sortOrder));
}

export async function getAllFaqs() {
	return db
		.select()
		.from(faq)
		.orderBy(asc(faq.sortOrder));
}

export async function createFaq(question: string, answer: string, createdBy?: string) {
	const [maxOrder] = await db
		.select({ max: faq.sortOrder })
		.from(faq);
	const nextOrder = (maxOrder?.max ?? 0) + 1;

	const [created] = await db
		.insert(faq)
		.values({ question, answer, sortOrder: nextOrder, createdBy })
		.returning();
	return created;
}

export async function updateFaq(id: string, data: { question?: string; answer?: string; sortOrder?: number; isActive?: boolean }) {
	const [updated] = await db
		.update(faq)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(faq.id, id))
		.returning();
	return updated;
}

export async function deleteFaq(id: string) {
	await db.delete(faq).where(eq(faq.id, id));
}
