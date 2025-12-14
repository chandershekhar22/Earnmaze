import { eq, and, gte, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../index';
import { guestSession, guestSurveyActivity, guestSessionStatusEnum } from '../schema/guest-sessions';
import { randomBytes } from 'crypto';
import { survey, surveyTransaction } from '../schema/surveys';

/**
 * Guest Session Repository
 * 
 * Flow:
 * 1. Guest enters email → create/find user (with userType='panelist') 
 * 2. Create guest session linked to email
 * 3. Guest takes survey → create survey transaction (in survey_transactions table)
 * 4. Link survey transaction to guest session (via linkSurveyTransactionToSession)
 * 5. Guest sees only transactions from CURRENT session (via getGuestSessionTransactions)
 * 6. After full login → user sees ALL their transactions (not session-filtered)
 * 
 * Guest sessions are temporary (24 hours) and act as a session filter over 
 * the main survey_transactions table. Data is NOT duplicated.
 */

export interface GuestSessionData {
	email: string;
	ipAddress?: string;
	userAgent?: string;
	fingerprint?: string;
}

export interface GuestSessionInfo {
	id: string;
	email: string;
	token: string;
	status: typeof guestSessionStatusEnum.enumValues[number];
	sessionPoints: number;
	surveysViewed: number;
	surveysCompleted: number;
	expiresAt: Date;
	createdAt: Date;
	upgradedToUserId?: string | null;
}

/**
 * Generate a secure random token for guest session
 */
export function generateGuestToken(): string {
	return randomBytes(32).toString('hex');
}

/**
 * Create a new guest session
 * Guest sessions expire after 24 hours
 */
export async function createGuestSession(data: GuestSessionData): Promise<{ token: string; sessionId: string }> {
	const token = generateGuestToken();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

	const [session] = await db.insert(guestSession).values({
		email: data.email,
		token,
		expiresAt,
		ipAddress: data.ipAddress,
		userAgent: data.userAgent,
		fingerprint: data.fingerprint,
		status: 'active',
		sessionPoints: 0,
		surveysViewed: 0,
		surveysCompleted: 0,
	}).returning();

	return { token, sessionId: session.id };
}

/**
 * Create a new guest session linked to a user account
 * Used when creating passwordless accounts that start as guest sessions
 */
export async function createGuestSessionForUser(
	data: GuestSessionData & { userId: string }
): Promise<{ token: string; sessionId: string }> {
	const token = generateGuestToken();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

	const [session] = await db
		.insert(guestSession)
		.values({
			email: data.email,
			token,
			expiresAt,
			ipAddress: data.ipAddress,
			userAgent: data.userAgent,
			fingerprint: data.fingerprint,
			status: 'active',
			sessionPoints: 0,
			surveysViewed: 0,
			surveysCompleted: 0,
			upgradedToUserId: data.userId, // Link to user account
		})
		.returning();

	return { token, sessionId: session.id };
}

/**
 * Find active guest session for email
 */
export async function findActiveGuestSessionByEmail(email: string): Promise<GuestSessionInfo | null> {
	const result = await db
		.select()
		.from(guestSession)
		.where(
			and(
				eq(guestSession.email, email),
				eq(guestSession.status, 'active'),
				gte(guestSession.expiresAt, new Date())
			)
		)
		.orderBy(desc(guestSession.createdAt))
		.limit(1);

	if (!result.length) return null;

	const session = result[0];
	return {
		id: session.id,
		email: session.email,
		token: session.token,
		status: session.status,
		sessionPoints: session.sessionPoints ?? 0,
		surveysViewed: session.surveysViewed ?? 0,
		surveysCompleted: session.surveysCompleted ?? 0,
		expiresAt: session.expiresAt,
		createdAt: session.createdAt,
		upgradedToUserId: session.upgradedToUserId,
	};
}

/**
 * Validate and retrieve guest session
 * Returns null if session is invalid or expired
 */
export async function validateGuestSession(token: string): Promise<GuestSessionInfo | null> {
	if (!token) return null;

	const result = await db
		.select()
		.from(guestSession)
		.where(eq(guestSession.token, token))
		.limit(1);

	if (!result.length) return null;

	const session = result[0];

	// Check if session is expired
	if (session.expiresAt < new Date() || session.status !== 'active') {
		// Mark as expired if not already
		if (session.status === 'active') {
			await db
				.update(guestSession)
				.set({ status: 'expired', updatedAt: new Date() })
				.where(eq(guestSession.id, session.id));
		}
		return null;
	}

	// Update last activity
	await db
		.update(guestSession)
		.set({ lastActivityAt: new Date(), updatedAt: new Date() })
		.where(eq(guestSession.id, session.id));

	return {
		id: session.id,
		email: session.email,
		token: session.token,
		status: session.status,
		sessionPoints: session.sessionPoints ?? 0,
		surveysViewed: session.surveysViewed ?? 0,
		surveysCompleted: session.surveysCompleted ?? 0,
		expiresAt: session.expiresAt,
		createdAt: session.createdAt,
		upgradedToUserId: session.upgradedToUserId,
	};
}

/**
 * Get guest session by ID
 */
export async function getGuestSessionById(sessionId: string): Promise<GuestSessionInfo | null> {
	const result = await db
		.select()
		.from(guestSession)
		.where(eq(guestSession.id, sessionId))
		.limit(1);

	if (!result.length) return null;

	const session = result[0];
	return {
		id: session.id,
		email: session.email,
		token: session.token,
		status: session.status,
		sessionPoints: session.sessionPoints ?? 0,
		surveysViewed: session.surveysViewed ?? 0,
		surveysCompleted: session.surveysCompleted ?? 0,
		expiresAt: session.expiresAt,
		createdAt: session.createdAt,
		upgradedToUserId: session.upgradedToUserId,
	};
}

/**
 * Invalidate guest session (logout)
 */
export async function invalidateGuestSession(token: string): Promise<void> {
	await db
		.update(guestSession)
		.set({ status: 'expired', updatedAt: new Date() })
		.where(eq(guestSession.token, token));
}

/**
 * Link a survey transaction to a guest session
 * Called after creating a survey transaction for a guest user
 */
export async function linkSurveyTransactionToSession(
	sessionId: string,
	surveyTransactionId: number
): Promise<void> {
	// Check if already linked
	const existing = await db
		.select()
		.from(guestSurveyActivity)
		.where(
			and(
				eq(guestSurveyActivity.guestSessionId, sessionId),
				eq(guestSurveyActivity.surveyTransactionId, surveyTransactionId)
			)
		)
		.limit(1);

	if (existing.length === 0) {
		// Create link between guest session and survey transaction
		await db.insert(guestSurveyActivity).values({
			guestSessionId: sessionId,
			surveyTransactionId,
		});
	}
}


/**
 * Get survey transactions for a guest session
 * Returns only transactions linked to this specific session
 */
export async function getGuestSessionTransactions(sessionId: string) {
	const activities = await db
		.select({
			transaction: surveyTransaction,
			survey: survey,
		})
		.from(guestSurveyActivity)
		.innerJoin(surveyTransaction, eq(guestSurveyActivity.surveyTransactionId, surveyTransaction.id))
		.leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
		.where(eq(guestSurveyActivity.guestSessionId, sessionId))
		.orderBy(desc(surveyTransaction.createdAt));

	return activities;
}

/**
 * Update guest session statistics based on survey transactions
 * Called when survey transactions are created/completed for guest users
 */
export async function updateGuestSessionStats(sessionId: string): Promise<void> {
	// Get all transactions for this session
	const transactions = await db
		.select({
			status: surveyTransaction.status,
			points: surveyTransaction.awardedPoints,
		})
		.from(guestSurveyActivity)
		.innerJoin(surveyTransaction, eq(guestSurveyActivity.surveyTransactionId, surveyTransaction.id))
		.where(eq(guestSurveyActivity.guestSessionId, sessionId));

	// Calculate stats
	const surveysViewed = transactions.length;
	const surveysCompleted = transactions.filter(t => t.status === 'completed').length;
	const sessionPoints = transactions
		.filter(t => t.status === 'completed')
		.reduce((sum, t) => sum + (t.points || 0), 0);

	// Update session
	await db
		.update(guestSession)
		.set({
			surveysViewed,
			surveysCompleted,
			sessionPoints,
			updatedAt: new Date(),
		})
		.where(eq(guestSession.id, sessionId));
}

/**
 * Mark guest session as upgraded when user completes full registration
 */
export async function upgradeGuestSession(token: string, userId: string): Promise<void> {
	await db
		.update(guestSession)
		.set({
			status: 'upgraded',
			upgradedToUserId: userId,
			upgradedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(guestSession.token, token));
}

/**
 * Check if email has recent active guest sessions
 * Helps prevent abuse by rate limiting guest session creation
 */
export async function hasRecentGuestSession(email: string, withinHours: number = 1): Promise<boolean> {
	const cutoffTime = new Date(Date.now() - withinHours * 60 * 60 * 1000);

	const recent = await db
		.select()
		.from(guestSession)
		.where(
			and(
				eq(guestSession.email, email),
				gte(guestSession.createdAt, cutoffTime)
			)
		)
		.limit(1);

	return recent.length > 0;
}
