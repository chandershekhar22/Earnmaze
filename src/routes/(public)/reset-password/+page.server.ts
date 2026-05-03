/**
 * Determines whether the password reset is also a first-time account
 * activation (guest converting via /forgot-password) and therefore needs to
 * collect age + ToS + Privacy consent. Existing panelists who legitimately
 * forgot their password skip the consent UI.
 */
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { findPasswordResetToken } from '$lib/db/repositories';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token) return { requiresConsent: false, tokenValid: false };

	const resetRecord = await findPasswordResetToken(token);
	if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
		return { requiresConsent: false, tokenValid: false };
	}

	const [row] = await db
		.select({ tosAcceptedAt: user.tosAcceptedAt })
		.from(user)
		.where(eq(user.id, resetRecord.userId))
		.limit(1);

	// First-time activation = no ToS acceptance recorded yet.
	const requiresConsent = !row?.tosAcceptedAt;
	return { requiresConsent, tokenValid: true };
};
