import { hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { user, session, userTypeEnum } from '../schema/auth';
import { randomBytes } from 'crypto';
import { initializePanelistPoints } from './panelist-points.repository.server';
import { sendWelcomeEmail } from '../../server/email-service';

export async function hashPassword(password: string): Promise<string> {
	return await hash(password);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	try {
		return await verify(hashedPassword, password);
	} catch {
		return false;
	}
}

export function generateSessionId(): string {
	return randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
	const sessionId = generateSessionId();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await db.insert(session).values({
		userId,
		token: sessionId,
		expiresAt,
	});

	return sessionId;
}

export async function validateSession(sessionId: string): Promise<typeof user.$inferSelect | null> {
	if (!sessionId) return null;

	const result = await db
		.select({
			user: user,
			session: session,
		})
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.token, sessionId))
		.limit(1);

	if (!result.length) return null;

	const { user: userData, session: sessionData } = result[0];

	// Check if session is expired
	if (sessionData.expiresAt < new Date()) {
		await db.delete(session).where(eq(session.token, sessionId));
		return null;
	}

	return userData;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(session).where(eq(session.token, sessionId));
}

export async function getUserByEmail(email: string) {
	const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
	return result[0] || null;
}

/**
 * Create user without password (for guest/email-only registration)
 * Used when user provides only email initially and will set password later
 */
export async function createUser(data: {
	email: string;
	name?: string | null;
	password?: string | null;
	userType?: string;
	registrationSource?: string;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	referredBy?: string | null;
}) {
	const userTypeValue = userTypeEnum.enumValues.includes(
		data.userType as typeof userTypeEnum.enumValues[number]
	)
		? data.userType
		: 'panelist'; // default to panelist
	const referralCode = randomBytes(4).toString('hex').toUpperCase();
	
	let hashedPassword: string | undefined;
	if (data.password) {
		hashedPassword = await hashPassword(data.password);
	}
	const [newUser] = await db
		.insert(user)
		.values({
			email: data.email,
			name: data.name || null,
			password: data.password ? hashedPassword : null, // No password initially
			isPasswordSet: data.password ? true : false, // Flag indicating password needs to be set
			emailVerified: false,
			userType: userTypeValue as typeof userTypeEnum.enumValues[number],
			registrationSource: data.registrationSource || 'unknown',
			utmSource: data.utmSource,
			utmMedium: data.utmMedium,
			utmCampaign: data.utmCampaign,
			referralCode,
			referredBy: data.referredBy,
			isActive: true,
			status: 'pending_verification',
			loginCount: 0,
		})
		.returning();

	// Create panelist profile if userType is panelist
	if (userTypeValue === 'panelist') {
		
		// initialize panelist
		// Initialize points (welcome + bonus)
		await initializePanelistPoints(newUser.id);
		// send welcome email via celery
		await sendWelcomeEmail(newUser.email, newUser.name);
	}


	return { user: newUser };
}

export async function getUserByReferralCode(referralCode: string) {
	const result = await db.select().from(user).where(eq(user.referralCode, referralCode)).limit(1);
	return result[0] || null;
}

