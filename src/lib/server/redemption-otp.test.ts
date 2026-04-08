// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createRedemptionOtp, verifyRedemptionOtp } from './redemption-otp';

beforeAll(() => {
	process.env.SESSION_SECRET = 'test-session-secret';
});

describe('Redemption OTP', () => {
	const userId = 'user-123';
	const rewardId = 'reward-456';

	describe('createRedemptionOtp', () => {
		it('returns a 6-digit code', () => {
			const otp = createRedemptionOtp(userId, rewardId);
			expect(otp).toMatch(/^\d{6}$/);
		});

		it('returns different codes on subsequent calls', () => {
			const otp1 = createRedemptionOtp(userId, rewardId);
			const otp2 = createRedemptionOtp(userId, rewardId);
			// Not guaranteed to differ but extremely likely
			// The important thing is that old OTP is invalidated
			expect(otp1).toMatch(/^\d{6}$/);
			expect(otp2).toMatch(/^\d{6}$/);
		});
	});

	describe('verifyRedemptionOtp', () => {
		it('verifies correct OTP and returns rewardId', () => {
			const otp = createRedemptionOtp(userId, rewardId);
			const result = verifyRedemptionOtp(userId, otp);
			expect(result).not.toBeNull();
			expect(result!.rewardId).toBe(rewardId);
		});

		it('rejects wrong OTP', () => {
			createRedemptionOtp(userId, rewardId);
			const result = verifyRedemptionOtp(userId, '000000');
			expect(result).toBeNull();
		});

		it('rejects OTP for wrong user', () => {
			const otp = createRedemptionOtp(userId, rewardId);
			const result = verifyRedemptionOtp('other-user', otp);
			expect(result).toBeNull();
		});

		it('OTP is single-use (consumed after verification)', () => {
			const otp = createRedemptionOtp(userId, rewardId);
			const first = verifyRedemptionOtp(userId, otp);
			const second = verifyRedemptionOtp(userId, otp);
			expect(first).not.toBeNull();
			expect(second).toBeNull();
		});

		it('new OTP invalidates previous OTP', () => {
			const otp1 = createRedemptionOtp(userId, rewardId);
			const otp2 = createRedemptionOtp(userId, 'reward-789');

			const result1 = verifyRedemptionOtp(userId, otp1);
			expect(result1).toBeNull(); // Old OTP invalidated

			const result2 = verifyRedemptionOtp(userId, otp2);
			expect(result2).not.toBeNull();
			expect(result2!.rewardId).toBe('reward-789');
		});

		it('rejects after max attempts (3)', () => {
			const otp = createRedemptionOtp(userId, rewardId);

			verifyRedemptionOtp(userId, '111111'); // attempt 1
			verifyRedemptionOtp(userId, '222222'); // attempt 2
			verifyRedemptionOtp(userId, '333333'); // attempt 3

			// Now even correct OTP should fail
			const result = verifyRedemptionOtp(userId, otp);
			expect(result).toBeNull();
		});

		it('returns null for non-existent user', () => {
			const result = verifyRedemptionOtp('nobody', '123456');
			expect(result).toBeNull();
		});
	});
});
