import { getAnonId } from './anon-id';

export interface EngagementStat {
	likes: number;
	shares: number;
	liked: boolean;
}

const cache: Record<string, Promise<Record<string, EngagementStat>>> = {};

/**
 * Fetch like/share stats for every item of a kind from this browser's
 * perspective (so `liked` reflects this browser's anon_id). Memoized per kind
 * so a gallery of cards triggers a single request; pass `force` to refetch.
 */
export function loadEngagementStats(
	kind: string,
	force = false,
): Promise<Record<string, EngagementStat>> {
	if (!cache[kind] || force) {
		const anon = getAnonId();
		cache[kind] = fetch(
			`/api/engagement/${kind}/stats?anon_id=${encodeURIComponent(anon)}`,
		)
			.then((r) => (r.ok ? r.json() : {}))
			.catch(() => ({}));
	}
	return cache[kind];
}
