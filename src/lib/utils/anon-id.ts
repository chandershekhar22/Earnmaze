const KEY = 'anon_id';

/**
 * A stable, anonymous per-browser id used to attribute likes/shares without
 * requiring login. Generated once on first use and persisted in localStorage.
 * Safe to call during SSR — returns '' when there is no browser storage.
 */
export function getAnonId(): string {
	if (typeof localStorage === 'undefined') return '';
	let id = localStorage.getItem(KEY);
	if (!id) {
		id =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID()
				: `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
		localStorage.setItem(KEY, id);
	}
	return id;
}
