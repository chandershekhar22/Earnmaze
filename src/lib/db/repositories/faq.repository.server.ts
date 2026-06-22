import { eq, asc } from "drizzle-orm";
import { faq, type FaqTranslations } from "../schema/support-tickets";
import { db } from "..";

type FaqRow = typeof faq.$inferSelect;

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

// Pick the locale-resolved question/answer pair, falling back per-field to the
// base columns when a translation entry is missing or only partially filled.
export function pickFaqLocale(row: FaqRow, locale: string): { id: string; question: string; answer: string } {
	const translation = row.translations?.[locale];
	return {
		id: row.id,
		question: translation?.question ?? row.question,
		answer: translation?.answer ?? row.answer,
	};
}

export async function getActiveFaqsLocalized(locale: string) {
	const rows = await getActiveFaqs();
	return rows.map((r) => pickFaqLocale(r, locale));
}

export async function createFaq(
	question: string,
	answer: string,
	createdBy?: string,
	translations: FaqTranslations = {},
) {
	const [maxOrder] = await db
		.select({ max: faq.sortOrder })
		.from(faq);
	const nextOrder = (maxOrder?.max ?? 0) + 1;

	const [created] = await db
		.insert(faq)
		.values({ question, answer, sortOrder: nextOrder, createdBy, translations })
		.returning();
	return created;
}

export async function updateFaq(
	id: string,
	data: {
		question?: string;
		answer?: string;
		sortOrder?: number;
		isActive?: boolean;
		translations?: FaqTranslations;
	},
) {
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
