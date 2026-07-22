import { getValidEntries } from './exploration-points';

export type ClaimResult =
	| { authenticated: true; pointsAwarded: number; claimedCount: number }
	| { authenticated: false };

/**
 * Asks the server to credit any still-valid pending exploration entries (see
 * $lib/utils/exploration-points) into the signed-in panelist's real wallet.
 * The session cookie is httpOnly, so a 401 is the only reliable way to tell
 * "not signed in" from here — callers fall back to the "sign up to claim"
 * messaging in that case instead of crediting anything. Returns null on a
 * network/server error, so callers can leave the entries pending and retry
 * later instead of losing them.
 */
export async function claimPendingExplorationPoints(): Promise<ClaimResult | null> {
	try {
		const response = await fetch('/api/panelist/exploration-points', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ entries: getValidEntries() })
		});

		if (response.status === 401) return { authenticated: false };
		if (!response.ok) return null;

		const result = await response.json();
		return {
			authenticated: true,
			pointsAwarded: result.pointsAwarded ?? 0,
			claimedCount: result.claimedCount ?? 0,
		};
	} catch {
		return null;
	}
}
