import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface Game {
	id: string;
	title: string;
	/** Served path to the playable HTML, e.g. /games-uploaded/{id}/index.html */
	file: string;
	/** Served path to the cover image, e.g. /games-uploaded/{id}/thumb.png */
	thumb?: string;
	createdAt: string;
}

const ROOT = path.join(process.cwd(), 'static', 'games-uploaded');
const MANIFEST = path.join(ROOT, 'manifest.json');

async function ensureRoot() {
	await fs.mkdir(ROOT, { recursive: true });
	try {
		await fs.access(MANIFEST);
	} catch {
		await fs.writeFile(MANIFEST, '[]', 'utf-8');
	}
}

export async function readGames(): Promise<Game[]> {
	await ensureRoot();
	const raw = await fs.readFile(MANIFEST, 'utf-8');
	try {
		return JSON.parse(raw) as Game[];
	} catch {
		return [];
	}
}

export async function writeGames(items: Game[]) {
	await ensureRoot();
	await fs.writeFile(MANIFEST, JSON.stringify(items, null, 2), 'utf-8');
}

export async function addGame(meta: Omit<Game, 'createdAt'>) {
	const items = await readGames();
	// Newest first — index 0 is always the most recently uploaded game.
	items.unshift({ ...meta, createdAt: new Date().toISOString() });
	await writeGames(items);
}

export async function removeGame(id: string) {
	const items = await readGames();
	if (items.find((g) => g.id === id)) {
		await fs.rm(path.join(ROOT, id), { recursive: true, force: true });
	}
	await writeGames(items.filter((g) => g.id !== id));
}

/** The most recently uploaded game — shown in the "Today's game" hero card. */
export async function getLatestGame(): Promise<Game | null> {
	const items = await readGames();
	return items[0] ?? null;
}

export async function saveGameHtml(id: string, html: string) {
	const dir = path.join(ROOT, id);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'index.html'), html, 'utf-8');
}

/** Raw HTML of an uploaded game, or null if it doesn't exist on disk. */
export async function readGameHtml(id: string): Promise<string | null> {
	try {
		return await fs.readFile(path.join(ROOT, id, 'index.html'), 'utf-8');
	} catch {
		return null;
	}
}

export async function saveGameThumb(id: string, bytes: Uint8Array, ext: string): Promise<string> {
	const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
	const dir = path.join(ROOT, id);
	await fs.mkdir(dir, { recursive: true });
	const filename = `thumb.${safeExt}`;
	await fs.writeFile(path.join(dir, filename), bytes);
	return `/games-uploaded/${id}/${filename}`;
}

export function slugify(s: string) {
	return (
		s
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 60) || `game-${Date.now()}`
	);
}
