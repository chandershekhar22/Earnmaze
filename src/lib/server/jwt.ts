/**
 * JWT utilities for mobile app authentication.
 * Uses short-lived access tokens + long-lived refresh tokens.
 */
import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';

function getSecret(): Uint8Array {
	const secret = env.JWT_SECRET || env.SESSION_SECRET;
	if (!secret) throw new Error('JWT_SECRET or SESSION_SECRET must be set');
	return new TextEncoder().encode(secret);
}

export interface JwtPayload {
	sub: string;     // user ID
	userType: string;
	type: 'access' | 'refresh';
}

export async function createAccessToken(userId: string, email: string, userType: string): Promise<string> {
	return new SignJWT({ userType, type: 'access' })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_TTL)
		.sign(getSecret());
}

export async function createRefreshToken(userId: string, email: string, userType: string): Promise<string> {
	return new SignJWT({ userType, type: 'refresh' })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime(REFRESH_TOKEN_TTL)
		.sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		return {
			sub: payload.sub as string,
			userType: payload.userType as string,
			type: payload.type as 'access' | 'refresh',
		};
	} catch {
		return null;
	}
}

export async function createTokenPair(userId: string, email: string, userType: string) {
	const [accessToken, refreshToken] = await Promise.all([
		createAccessToken(userId, email, userType),
		createRefreshToken(userId, email, userType),
	]);
	return { accessToken, refreshToken };
}
