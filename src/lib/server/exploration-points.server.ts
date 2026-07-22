import { createHash } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { addPoints, db } from '$lib/db';
import { pointsTransactions } from '$lib/db/schema/panelist-points';
import { EXPLORATION_KIND_LABELS, type ExplorationKind } from '$lib/utils/exploration-points';

/**
 * Server-side claiming of the "pending exploration points" a visitor
 * accumulates in localStorage (see $lib/utils/exploration-points) for
 * completing a section's current featured tile. Called from the
 * register/login endpoints and from the authenticated claim endpoint
 * (api/panelist/exploration-points) with whatever the client sends — every
 * field is re-validated here since none of it can be trusted (a visitor can
 * freely edit localStorage).
 *
 * Earning is gated per (kind, tileId), not per calendar day: a panelist gets
 * the tile's points once, ever, for that exact featured pick — replaying it
 * later credits nothing. The next win for that kind unlocks only when the
 * admin swaps in a new featured tile (a new tileId) — see referenceIdFor.
 */

const EXPLORATION_POINTS_PER_TILE = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;

const KIND_LABELS = EXPLORATION_KIND_LABELS;

const ALLOWED_KINDS = new Set(Object.keys(KIND_LABELS));

/**
 * Deterministic, <=36-char dedupe key — pointsTransactions.referenceId is
 * varchar(36). Deliberately excludes `earnedAt`: a panelist earns a tile's
 * points exactly once, permanently, no matter how many times they replay it
 * later. The next win for that kind only unlocks once the featured tile's
 * id itself changes (e.g. the admin swaps "today's game" to a new upload).
 */
function referenceIdFor(panelistId: string, kind: string, tileId: string): string {
	return createHash('sha1').update(`${panelistId}:${kind}:${tileId}`).digest('hex').slice(0, 36);
}

async function alreadyClaimed(referenceId: string): Promise<boolean> {
	const [existing] = await db
		.select({ id: pointsTransactions.id })
		.from(pointsTransactions)
		.where(and(eq(pointsTransactions.referenceType, 'exploration'), eq(pointsTransactions.referenceId, referenceId)))
		.limit(1);
	return !!existing;
}

export async function claimExplorationEntries(
	panelistId: string,
	rawEntries: unknown
): Promise<{ claimedCount: number; pointsAwarded: number }> {
	if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
		return { claimedCount: 0, pointsAwarded: 0 };
	}

	const now = Date.now();
	let claimedCount = 0;
	let pointsAwarded = 0;

	// A legitimate client can have at most one pending entry per known kind —
	// cap defensively regardless of what the payload claims.
	for (const raw of rawEntries.slice(0, ALLOWED_KINDS.size)) {
		if (!raw || typeof raw !== 'object') continue;
		const kind = (raw as Record<string, unknown>).kind;
		const tileId = (raw as Record<string, unknown>).tileId;
		const earnedAt = Number((raw as Record<string, unknown>).earnedAt);

		if (typeof kind !== 'string' || !ALLOWED_KINDS.has(kind)) continue;
		if (typeof tileId !== 'string' || tileId.length === 0 || tileId.length > 128) continue;
		if (!Number.isFinite(earnedAt) || earnedAt > now || now - earnedAt > ONE_HOUR_MS) continue;

		const referenceId = referenceIdFor(panelistId, kind, tileId);
		if (await alreadyClaimed(referenceId)) continue;

		await addPoints(
			panelistId,
			EXPLORATION_POINTS_PER_TILE,
			`Exploration: completed ${KIND_LABELS[kind as ExplorationKind]}`,
			'completed',
			'exploration',
			referenceId,
			{ kind, tileId }
		);

		claimedCount += 1;
		pointsAwarded += EXPLORATION_POINTS_PER_TILE;
	}

	return { claimedCount, pointsAwarded };
}
