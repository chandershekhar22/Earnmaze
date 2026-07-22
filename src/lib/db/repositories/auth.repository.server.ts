import { hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { user, session, userTypeEnum, passwordReset } from '../schema/auth';
import { randomBytes } from 'crypto';
import { initializePanelistPoints, addBonusPoints } from './panelist-points.repository.server';
import { getAppSettings } from './settings.repository.server';
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
	const { withRetry } = await import('../retry');
	const sessionId = generateSessionId();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await withRetry(
		() =>
			db.insert(session).values({
				userId,
				token: sessionId,
				expiresAt,
			}),
		`createSession(${userId})`
	);

	return sessionId;
}

export async function validateSession(sessionId: string): Promise<typeof user.$inferSelect | null> {
	if (!sessionId) return null;

	const { withRetry } = await import('../retry');
	
	const result = await withRetry(
		() =>
			db
				.select({
					user: user,
					session: session,
				})
				.from(session)
				.innerJoin(user, eq(session.userId, user.id))
				.where(eq(session.token, sessionId))
				.limit(1),
		`validateSession(${sessionId})`
	);

	if (!result.length) return null;

	const { user: userData, session: sessionData } = result[0];

	// Check if session is expired
	if (sessionData.expiresAt < new Date()) {
		await db.delete(session).where(eq(session.token, sessionId));
		return null;
	}

	// Enforce absolute max lifetime (90 days from creation)
	const MAX_SESSION_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;
	if (Date.now() - sessionData.createdAt.getTime() > MAX_SESSION_LIFETIME_MS) {
		await db.delete(session).where(eq(session.token, sessionId));
		return null;
	}

	// Sliding session: extend expiry if less than 7 days remaining
	const sevenDays = 7 * 24 * 60 * 60 * 1000;
	if (sessionData.expiresAt.getTime() - Date.now() < sevenDays) {
		const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
		await db.update(session).set({ expiresAt: newExpiry }).where(eq(session.token, sessionId));
	}

	return userData;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(session).where(eq(session.token, sessionId));
}

export async function getUserByEmail(email: string) {
	// Use withRetry for resilience against transient connection issues
	const { withRetry } = await import('../retry');
	const result = await withRetry(
		() => db.select().from(user).where(eq(user.email, email)).limit(1),
		`getUserByEmail(${email})`
	);
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
		
		// Initialize points record
		await initializePanelistPoints(newUser.id);

		// Credit signup bonus only for direct registration (with password), not guest creation
		if (data.password) {
			try {
				const settings = await getAppSettings(['signup_bonus_points']);
				// Defaults to 50 (the flat welcome bonus every new signup gets)
				// only when the admin hasn't configured this setting at all —
				// an explicit "0" must still mean "no bonus", not fall through.
				const rawBonus = settings.signup_bonus_points;
				const signupBonus = rawBonus === null || rawBonus === '' ? 50 : parseInt(rawBonus) || 0;
				if (signupBonus > 0) {
					await addBonusPoints(newUser.id, signupBonus, 'Welcome bonus for new panelist');
				}
			} catch {
				// Don't block registration if bonus fails
			}

			// Send welcome email via celery
			await sendWelcomeEmail(newUser.email, newUser.name);
		}
	}


	return { user: newUser };
}

/**
 * Invalidate all sessions for a user.
 * Used after password reset to force re-login and during login to prevent session fixation.
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
	await db.delete(session).where(eq(session.userId, userId));
}

export async function getUserByReferralCode(referralCode: string) {
	const result = await db.select().from(user).where(eq(user.referralCode, referralCode)).limit(1);
	return result[0] || null;
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

/**
 * Create a password reset token record
 */
export async function createPasswordResetToken(
	userId: string,
	token: string,
	expiresAt: Date
): Promise<void> {
	await db.insert(passwordReset).values({ userId, token, expiresAt });
}

/**
 * Find a password reset record by token
 */
export async function findPasswordResetToken(token: string) {
	const result = await db
		.select()
		.from(passwordReset)
		.where(eq(passwordReset.token, token))
		.limit(1);
	return result[0] ?? null;
}

/**
 * Delete a password reset token (e.g. when expired)
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
	await db.delete(passwordReset).where(eq(passwordReset.token, token));
}

/**
 * Mark a password reset token as used and update the user's password in one transaction
 */
export async function resetPasswordWithToken(
	token: string,
	userId: string,
	hashedPassword: string
): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.update(user)
			.set({ password: hashedPassword, isPasswordSet: true, updatedAt: new Date() })
			.where(eq(user.id, userId));

		await tx
			.update(passwordReset)
			.set({ isUsed: true, usedAt: new Date() })
			.where(eq(passwordReset.token, token));
	});
}

/**
 * Update a user's password (plain update, no transaction)
 */
export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
	await db
		.update(user)
		.set({ password: hashedPassword, isPasswordSet: true, updatedAt: new Date() })
		.where(eq(user.id, userId));
}

/**
 * Update a user's password and mark email as verified + status active (guest upgrade flow)
 */
export async function updateUserPasswordAndActivate(
	userId: string,
	hashedPassword: string
): Promise<void> {
	await db
		.update(user)
		.set({
			password: hashedPassword,
			isPasswordSet: true,
			emailVerified: true,
			status: 'active',
			updatedAt: new Date(),
		})
		.where(eq(user.id, userId));
}

