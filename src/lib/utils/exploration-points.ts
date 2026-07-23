/**
 * Client-side "pending exploration points" ledger for anonymous visitors.
 *
 * A visitor who completes a section's current featured tile earns 10
 * exploration points, held here (not on the server — there is no account
 * yet) for up to ONE_HOUR_MS. If they sign up or log in within that window,
 * `src/lib/stores/auth.svelte.ts` reads the still-valid entries and sends
 * them to the server to be credited for real. Anything older than the
 * window is dropped, never credited.
 *
 * Earning is gated per (kind, tileId), not per calendar day — a given
 * featured tile pays out once, ever, no matter when it's replayed. The next
 * win for that kind unlocks only once the admin swaps in a new featured
 * tile (a new tileId). This file's dedupe is just a same-session speed bump
 * (see hasEarnedForTile); the server enforces it permanently regardless of
 * what localStorage remembers (see $lib/server/exploration-points.server).
 */

export const EXPLORATION_KINDS = [
	'streaks',
	'quizzes',
	'weekly-challenges',
	'artifacts',
	'games',
	'paid-surveys',
] as const;

export type ExplorationKind = (typeof EXPLORATION_KINDS)[number];

/** Human-readable label per kind — shared by the client UI (notifications drawer) and the server claim logic. */
export const EXPLORATION_KIND_LABELS: Record<ExplorationKind, string> = {
	streaks: "today's streak",
	quizzes: "today's quiz",
	'weekly-challenges': "today's weekly challenge",
	artifacts: "today's artifact",
	games: "today's game",
	'paid-surveys': "today's survey",
};

/**
 * `pointsTransactions.referenceType` values that count as "exploration
 * points" once claimed into a real wallet: today's-tile wins (`exploration`)
 * and the signup welcome bonus (`bonus`) — see
 * $lib/db/repositories/panelist-points-aggregations.repository.server.ts and
 * the (panelist)/dashboard vs (panelist)/discover split.
 */
export const EXPLORATION_TRANSACTION_REFERENCE_TYPES: string[] = ['exploration', 'bonus'];

/**
 * Minimum exploration-bucket balance required to redeem, AND the minimum
 * survey-bucket balance required alongside it (see the Discover "Redeem now"
 * button and /api/panelist/exploration-points/redeem) — both buckets must
 * independently clear this same threshold.
 */
export const EXPLORATION_REDEEM_THRESHOLD = 80;

export interface PendingExplorationEntry {
	id: string;
	kind: ExplorationKind;
	tileId: string;
	points: number;
	earnedAt: number;
	notified: boolean;
}

const STORAGE_KEY = 'em_pending_exploration_points';
const ONE_HOUR_MS = 60 * 60 * 1000;
const POINTS_PER_TILE = 10;

function readRaw(): PendingExplorationEntry[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeRaw(entries: PendingExplorationEntry[]) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	} catch {
		/* quota / disabled — ignore */
	}
}

/** Drops expired entries and persists the pruned list. Returns the survivors. */
export function getValidEntries(): PendingExplorationEntry[] {
	const now = Date.now();
	const all = readRaw();
	const valid = all.filter((e) => now - e.earnedAt < ONE_HOUR_MS);
	if (valid.length !== all.length) writeRaw(valid);
	return valid;
}

/** True if a valid (non-expired), not-yet-claimed entry already exists for this exact tile. */
export function hasEarnedForTile(kind: ExplorationKind, tileId: string): boolean {
	return getValidEntries().some((e) => e.kind === kind && e.tileId === tileId);
}

/**
 * Records a completed attempt at `kind`'s featured tile, unless this exact
 * tileId already has a pending entry (avoids piling up duplicate local
 * entries for the same still-unclaimed win). This is only a same-session
 * speed bump — the server is what actually enforces "once per tile, ever"
 * once claimed, so replaying an already-claimed tile later is harmless: it
 * records locally but the claim comes back with 0 points awarded.
 * Returns the new entry, or null if it was a no-op.
 */
export function recordAttempt(kind: ExplorationKind, tileId: string): PendingExplorationEntry | null {
	if (hasEarnedForTile(kind, tileId)) return null;
	const entry: PendingExplorationEntry = {
		id: `${kind}:${tileId}:${Date.now()}`,
		kind,
		tileId,
		points: POINTS_PER_TILE,
		earnedAt: Date.now(),
		notified: false,
	};
	const entries = readRaw();
	entries.push(entry);
	writeRaw(entries);
	return entry;
}

export function getUnnotifiedValidEntries(): PendingExplorationEntry[] {
	return getValidEntries().filter((e) => !e.notified);
}

export function markNotified(ids: string[]) {
	if (ids.length === 0) return;
	const idSet = new Set(ids);
	const entries = readRaw().map((e) => (idSet.has(e.id) ? { ...e, notified: true } : e));
	writeRaw(entries);
}

export function getPendingTotal(): number {
	return getValidEntries().reduce((sum, e) => sum + e.points, 0);
}

export function clearAll() {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* ignore */
	}
}
