import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Anonymous like/share engagement for every content kind on the site
 * (artifacts, games, and the four upload sections). Tracked without login:
 * a per-browser anon_id (see $lib/utils/anon-id) is the identity.
 *
 * `likes` is the set of anon_ids that liked the item, so likes toggle and
 * double-likes are prevented per browser. `shares` is a plain count plus a
 * per-channel breakdown.
 *
 * All kinds live in one JSON file keyed `{ [kind]: { [id]: ItemStats } }`.
 * Existence of the id is not validated server-side — this is an anonymous
 * counter, so an unknown id simply starts a fresh counter.
 */
export const ENGAGEMENT_KINDS = [
	'artifacts',
	'games',
	'streaks',
	'quizzes',
	'weekly-challenges',
	'exclusive-deals',
] as const;

export type EngagementKind = (typeof ENGAGEMENT_KINDS)[number];

export function isEngagementKind(s: string | undefined | null): s is EngagementKind {
	return !!s && (ENGAGEMENT_KINDS as readonly string[]).includes(s);
}

interface ItemStats {
	likes: string[];
	shares: number;
	shareChannels: Record<string, number>;
}

type KindMap = Record<string, ItemStats>;
type Store = Record<string, KindMap>;

const FILE = path.join(process.cwd(), 'static', 'engagement.json');

async function ensureFile() {
	await fs.mkdir(path.dirname(FILE), { recursive: true });
	try {
		await fs.access(FILE);
	} catch {
		await fs.writeFile(FILE, '{}', 'utf-8');
	}
}

async function readStore(): Promise<Store> {
	await ensureFile();
	const raw = await fs.readFile(FILE, 'utf-8');
	try {
		return JSON.parse(raw) as Store;
	} catch {
		return {};
	}
}

async function writeStore(store: Store) {
	await ensureFile();
	await fs.writeFile(FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function blank(): ItemStats {
	return { likes: [], shares: 0, shareChannels: {} };
}

function entry(store: Store, kind: EngagementKind, id: string): ItemStats {
	const km = (store[kind] ??= {});
	const e = km[id] ?? blank();
	if (!Array.isArray(e.likes)) e.likes = [];
	if (typeof e.shares !== 'number') e.shares = 0;
	if (!e.shareChannels) e.shareChannels = {};
	km[id] = e;
	return e;
}

// Serialize all writes so concurrent like/share requests don't clobber the file.
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = lock.then(fn, fn);
	lock = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}

export interface StatsView {
	likes: number;
	shares: number;
	liked: boolean;
}

function view(e: ItemStats, anonId: string): StatsView {
	return {
		likes: e.likes.length,
		shares: e.shares,
		liked: anonId ? e.likes.includes(anonId) : false,
	};
}

/** Stats for every item of a kind, keyed by id, from a browser's perspective. */
export async function getKindStats(
	kind: EngagementKind,
	anonId = '',
): Promise<Record<string, StatsView>> {
	const store = await readStore();
	const km = store[kind] ?? {};
	const out: Record<string, StatsView> = {};
	for (const [id, e] of Object.entries(km)) out[id] = view(e, anonId);
	return out;
}

/** Stats for a single item from a browser's perspective. */
export async function getItemStats(
	kind: EngagementKind,
	id: string,
	anonId = '',
): Promise<StatsView> {
	const store = await readStore();
	return view(entry(store, kind, id), anonId);
}

/** Toggle a like for (kind, id, anon_id). Returns the new state for that browser. */
export async function toggleLike(
	kind: EngagementKind,
	id: string,
	anonId: string,
): Promise<StatsView> {
	return withLock(async () => {
		const store = await readStore();
		const e = entry(store, kind, id);
		const i = e.likes.indexOf(anonId);
		if (i >= 0) e.likes.splice(i, 1);
		else e.likes.push(anonId);
		await writeStore(store);
		return view(e, anonId);
	});
}

/** Record a share through a channel (copy / twitter / whatsapp / …). */
export async function addShare(
	kind: EngagementKind,
	id: string,
	channel: string,
	anonId = '',
): Promise<StatsView> {
	return withLock(async () => {
		const store = await readStore();
		const e = entry(store, kind, id);
		e.shares += 1;
		const ch = channel || 'other';
		e.shareChannels[ch] = (e.shareChannels[ch] ?? 0) + 1;
		await writeStore(store);
		return view(e, anonId);
	});
}
