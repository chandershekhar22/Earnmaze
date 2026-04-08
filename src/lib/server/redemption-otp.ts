/**
 * In-memory OTP store for redemption verification.
 * Short-lived (5 min), single-use, max 3 attempts.
 */
import { randomBytes, createHash } from 'crypto';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

interface OtpEntry {
	hash: string;
	rewardId: string;
	userId: string;
	attempts: number;
	expiresAt: number;
}

const store = new Map<string, OtpEntry>();

// Cleanup expired entries every 2 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store) {
		if (now > entry.expiresAt) store.delete(key);
	}
}, 2 * 60 * 1000);

function hashOtp(userId: string, otp: string): string {
	const pepper = process.env.SESSION_SECRET;
	if (!pepper) throw new Error('SESSION_SECRET environment variable must be set');
	return createHash('sha256').update(`${pepper}:${userId}:${otp}`).digest('hex');
}

function generateOtp(): string {
	const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
	return n.toString().padStart(6, '0');
}

/**
 * Create an OTP for a redemption request.
 * Returns the plain OTP (to be sent via email).
 */
export function createRedemptionOtp(userId: string, rewardId: string): string {
	// Invalidate any previous OTP for this user
	store.delete(userId);

	const otp = generateOtp();
	store.set(userId, {
		hash: hashOtp(userId, otp),
		rewardId,
		userId,
		attempts: 0,
		expiresAt: Date.now() + OTP_TTL_MS,
	});

	return otp;
}

/**
 * Verify the OTP and return the rewardId if valid.
 * Returns null if invalid/expired/exhausted.
 */
export function verifyRedemptionOtp(userId: string, otp: string): { rewardId: string } | null {
	const entry = store.get(userId);
	if (!entry) return null;

	if (Date.now() > entry.expiresAt) {
		store.delete(userId);
		return null;
	}

	entry.attempts++;
	if (entry.attempts > MAX_ATTEMPTS) {
		store.delete(userId);
		return null;
	}

	const hash = hashOtp(userId, otp);
	if (hash !== entry.hash) return null;

	// Valid — consume the OTP
	const { rewardId } = entry;
	store.delete(userId);
	return { rewardId };
}
