// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { createAccessToken, createRefreshToken, createTokenPair, verifyToken } from './jwt';

// Set env for tests
beforeAll(() => {
	process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
});

describe('JWT utilities', () => {
	const userId = '123e4567-e89b-12d3-a456-426614174000';
	const email = 'test@example.com';
	const userType = 'panelist';

	describe('createAccessToken', () => {
		it('creates a valid access token', async () => {
			const token = await createAccessToken(userId, email, userType);
			expect(token).toBeTruthy();
			expect(typeof token).toBe('string');
			expect(token.split('.')).toHaveLength(3); // JWT format
		});
	});

	describe('createRefreshToken', () => {
		it('creates a valid refresh token', async () => {
			const token = await createRefreshToken(userId, email, userType);
			expect(token).toBeTruthy();
			expect(token.split('.')).toHaveLength(3);
		});
	});

	describe('createTokenPair', () => {
		it('returns both access and refresh tokens', async () => {
			const { accessToken, refreshToken } = await createTokenPair(userId, email, userType);
			expect(accessToken).toBeTruthy();
			expect(refreshToken).toBeTruthy();
			expect(accessToken).not.toBe(refreshToken);
		});
	});

	describe('verifyToken', () => {
		it('verifies a valid access token', async () => {
			const token = await createAccessToken(userId, email, userType);
			const payload = await verifyToken(token);
			expect(payload).not.toBeNull();
			expect(payload!.sub).toBe(userId);
			expect(payload!.email).toBe(email);
			expect(payload!.userType).toBe(userType);
			expect(payload!.type).toBe('access');
		});

		it('verifies a valid refresh token', async () => {
			const token = await createRefreshToken(userId, email, userType);
			const payload = await verifyToken(token);
			expect(payload).not.toBeNull();
			expect(payload!.type).toBe('refresh');
		});

		it('returns null for invalid token', async () => {
			const payload = await verifyToken('invalid.token.here');
			expect(payload).toBeNull();
		});

		it('returns null for empty string', async () => {
			const payload = await verifyToken('');
			expect(payload).toBeNull();
		});

		it('returns null for tampered token', async () => {
			const token = await createAccessToken(userId, email, userType);
			const tampered = token.slice(0, -5) + 'XXXXX';
			const payload = await verifyToken(tampered);
			expect(payload).toBeNull();
		});
	});

	describe('token differentiation', () => {
		it('access and refresh tokens have different types', async () => {
			const access = await createAccessToken(userId, email, userType);
			const refresh = await createRefreshToken(userId, email, userType);

			const accessPayload = await verifyToken(access);
			const refreshPayload = await verifyToken(refresh);

			expect(accessPayload!.type).toBe('access');
			expect(refreshPayload!.type).toBe('refresh');
		});
	});
});
