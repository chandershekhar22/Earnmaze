import { hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { user, session, userTypeEnum } from '../schema/auth';
import { randomBytes } from 'crypto';
import { panelist, panelistPoint } from '../schema/panelists';

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

export async function createUser(data: {
	email: string;
	password: string;
	name?: string;
	userType?: string;
}) {
	const hashedPassword = await hashPassword(data.password);
	const userTypeValue = userTypeEnum.enumValues.includes(data.userType as typeof userTypeEnum.enumValues[number])
		? data.userType
		: "panelist"; // default to panelist

	const result = await db.insert(user).values({
		email: data.email,
		password: hashedPassword,
		name: data.name || '',
		userType: userTypeValue as typeof userTypeEnum.enumValues[number]
	}).returning();

	// generate panelist record if userType is panelist
	if (userTypeValue === 'panelist') {
		const insertedUserId = result[0].id;
		const newPanelist = await db.insert(panelist).values({
			userId: insertedUserId,
			// other default panelist fields can be set here
		}).returning();
		await db.insert(panelistPoint).values({
			panelistId: newPanelist[0].id,
			currentPoints: 0,
			lifetimePoints: 0,
		});
	}

	// todo: ADD RESPONDENT RECORD CREATION

	return result;
}

/**
 * Get panelist ID from user ID
 */
export async function getPanelistIdFromUserId(userId: string): Promise<string | null> {
	const result = await db
		.select({ id: panelist.id })
		.from(panelist)
		.where(eq(panelist.userId, userId))
		.limit(1);

	return result[0]?.id || null;
}
