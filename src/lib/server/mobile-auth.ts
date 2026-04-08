/**
 * Mobile auth guard — extracts and verifies JWT from Authorization header.
 */
import { json, type RequestEvent } from '@sveltejs/kit';
import { verifyToken, type JwtPayload } from './jwt';

export async function requireMobileAuth(event: RequestEvent): Promise<JwtPayload> {
	const authHeader = event.request.headers.get('Authorization');
	if (!authHeader?.startsWith('Bearer ')) {
		throw json({ success: false, error: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' }, { status: 401 });
	}

	const token = authHeader.slice(7);
	const payload = await verifyToken(token);

	if (!payload || payload.type !== 'access') {
		throw json({ success: false, error: 'TOKEN_EXPIRED', message: 'Access token is invalid or expired' }, { status: 401 });
	}

	return payload;
}
