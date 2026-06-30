import { eq, desc, sql } from "drizzle-orm";
import { feedback } from "../schema/feedback";
import { user } from "../schema/auth";
import { db } from "..";

/**
 * Feedback Repository
 * Handles feedback submitted from the landing page and panelist dashboards
 */

export async function createFeedback(data: {
	userId?: string | null;
	rating?: number | null;
	topic?: string | null;
	message: string;
	email?: string | null;
	ipAddress?: string | null;
}) {
	const [created] = await db
		.insert(feedback)
		.values({
			userId: data.userId ?? null,
			rating: data.rating ?? null,
			topic: data.topic ?? null,
			message: data.message,
			email: data.email ?? null,
			ipAddress: data.ipAddress ?? null,
		})
		.returning();

	return created;
}

/**
 * Get paginated feedback for the admin view, with the submitter's account info
 */
export async function getAllFeedback(limit: number, offset: number) {
	return db
		.select({
			id: feedback.id,
			userId: feedback.userId,
			userName: user.name,
			userEmail: user.email,
			rating: feedback.rating,
			topic: feedback.topic,
			message: feedback.message,
			email: feedback.email,
			createdAt: feedback.createdAt,
		})
		.from(feedback)
		.leftJoin(user, eq(feedback.userId, user.id))
		.orderBy(desc(feedback.createdAt))
		.limit(limit)
		.offset(offset);
}

export async function getFeedbackCount() {
	const [row] = await db.select({ count: sql<number>`count(*)`.as("count") }).from(feedback);
	return Number(row?.count ?? 0);
}
