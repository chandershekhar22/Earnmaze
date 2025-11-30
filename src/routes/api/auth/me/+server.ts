import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MeResponse, AuthUserResponse } from '$lib/types/api-responses';

export const GET: RequestHandler = async ({ locals }) => {
	// User is already authenticated via hooks.server.ts middleware
	const user = locals.user;

	// Return safe user data or null if not authenticated
	const response: MeResponse = {
		user: user ? {
			id: user.id,
			email: user.email,
			name: user.name,
			userType: user.userType,
			createdAt: user.createdAt,
			emailVerified: user.emailVerified,
			image: user.image,
		} satisfies AuthUserResponse : null,
	};

	return json(response);
};
