import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';
import { db } from '../index';
import { guestUpgradeVerification } from '../schema/guest-upgrade-verifications';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const UPGRADE_TOKEN_TTL_MINUTES = 15;

function getPepper(): string {
	return process.env.SESSION_SECRET || process.env.OTP_PEPPER || 'dev';
}

function hashOtp(email: string, otp: string): string {
	return createHash('sha256')
		.update(`${getPepper()}:${email.toLowerCase()}:${otp}`)
		.digest('hex');
}

function generateOtp(): string {
	// 6-digit numeric OTP
	const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
	return n.toString().padStart(6, '0');
}

export async function createGuestUpgradeOtp(params: {
	guestSessionId: string;
	email: string;
}): Promise<{ otp: string; expiresAt: Date }> {
	const otp = generateOtp();
	const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
	const otpHash = hashOtp(params.email, otp);

	// Invalidate previous active OTPs for this session
	await db
		.update(guestUpgradeVerification)
		.set({ otpExpiresAt: new Date(0), updatedAt: new Date() })
		.where(eq(guestUpgradeVerification.guestSessionId, params.guestSessionId));

	await db.insert(guestUpgradeVerification).values({
		guestSessionId: params.guestSessionId,
		email: params.email,
		otpHash,
		otpExpiresAt: expiresAt,
		otpAttempts: 0,
	});

	return { otp, expiresAt };
}

export async function verifyGuestUpgradeOtp(params: {
	guestSessionId: string;
	email: string;
	otp: string;
}): Promise<{ upgradeToken: string; tokenExpiresAt: Date } | null> {
	const now = new Date();

	const [row] = await db
		.select()
		.from(guestUpgradeVerification)
		.where(
			and(
				eq(guestUpgradeVerification.guestSessionId, params.guestSessionId),
				eq(guestUpgradeVerification.email, params.email),
				gt(guestUpgradeVerification.otpExpiresAt, now),
				isNull(guestUpgradeVerification.otpVerifiedAt)
			)
		)
		.orderBy(desc(guestUpgradeVerification.createdAt))
		.limit(1);

	if (!row) return null;
	if ((row.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) return null;

	const expected = hashOtp(params.email, params.otp);
	const attempts = (row.otpAttempts ?? 0) + 1;

	if (row.otpHash !== expected) {
		await db
			.update(guestUpgradeVerification)
			.set({ otpAttempts: attempts, updatedAt: now })
			.where(eq(guestUpgradeVerification.id, row.id));
		return null;
	}

	const upgradeToken = randomBytes(32).toString('hex');
	const tokenExpiresAt = new Date(Date.now() + UPGRADE_TOKEN_TTL_MINUTES * 60 * 1000);

	await db
		.update(guestUpgradeVerification)
		.set({
			otpAttempts: attempts,
			otpVerifiedAt: now,
			upgradeToken,
			upgradeTokenExpiresAt: tokenExpiresAt,
			updatedAt: now,
		})
		.where(eq(guestUpgradeVerification.id, row.id));

	return { upgradeToken, tokenExpiresAt };
}

export async function consumeGuestUpgradeToken(params: {
	guestSessionId: string;
	email: string;
	upgradeToken: string;
}): Promise<boolean> {
	const now = new Date();
	const [row] = await db
		.select()
		.from(guestUpgradeVerification)
		.where(
			and(
				eq(guestUpgradeVerification.guestSessionId, params.guestSessionId),
				eq(guestUpgradeVerification.email, params.email),
				eq(guestUpgradeVerification.upgradeToken, params.upgradeToken),
				gt(guestUpgradeVerification.upgradeTokenExpiresAt, now)
			)
		)
		.orderBy(desc(guestUpgradeVerification.createdAt))
		.limit(1);

	if (!row) return false;

	await db
		.update(guestUpgradeVerification)
		.set({ upgradeToken: null, upgradeTokenExpiresAt: null, updatedAt: now })
		.where(eq(guestUpgradeVerification.id, row.id));

	return true;
}
