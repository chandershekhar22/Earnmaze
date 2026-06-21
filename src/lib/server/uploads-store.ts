import { promises as fs } from 'node:fs';
import path from 'node:path';

export type UploadKind = 'streaks' | 'quizzes' | 'weekly-challenges' | 'exclusive-deals';

export const UPLOAD_KINDS: UploadKind[] = ['streaks', 'quizzes', 'weekly-challenges', 'exclusive-deals'];

export type UploadCat = 'data' | 'lifestyle' | 'other';
export type UploadTag = 'TRENDING' | 'NEW';

export interface UploadItem {
	id: string;
	title: string;
	desc: string;
	cat: UploadCat;
	tags: UploadTag[];
	readTime: string;
	bg: string;
	icon: string;
	file: string;
	thumb?: string;
	createdAt: string;
}

export const KIND_META: Record<UploadKind, { label: string; singular: string; accent: string; staticDir: string; }> = {
	'streaks': { label: 'Daily Streaks', singular: 'streak', accent: '#ff8a3d', staticDir: 'streaks-uploaded' },
	'quizzes': { label: 'Daily Quizzes', singular: 'quiz', accent: '#8f7cff', staticDir: 'quizzes-uploaded' },
	'weekly-challenges': { label: 'Weekly Challenges', singular: 'challenge', accent: '#ffd166', staticDir: 'weekly-challenges-uploaded' },
	'exclusive-deals': { label: 'Exclusive Deals', singular: 'deal', accent: '#56a8ff', staticDir: 'exclusive-deals-uploaded' },
};

export function isUploadKind(s: string | undefined | null): s is UploadKind {
	return !!s && (UPLOAD_KINDS as string[]).includes(s);
}

function rootFor(kind: UploadKind) {
	return path.join(process.cwd(), 'static', KIND_META[kind].staticDir);
}
function manifestFor(kind: UploadKind) {
	return path.join(rootFor(kind), 'manifest.json');
}

async function ensureRoot(kind: UploadKind) {
	const root = rootFor(kind);
	await fs.mkdir(root, { recursive: true });
	const manifest = manifestFor(kind);
	try {
		await fs.access(manifest);
	} catch {
		await fs.writeFile(manifest, '[]', 'utf-8');
	}
}

export async function readUploads(kind: UploadKind): Promise<UploadItem[]> {
	await ensureRoot(kind);
	const raw = await fs.readFile(manifestFor(kind), 'utf-8');
	try {
		return JSON.parse(raw) as UploadItem[];
	} catch {
		return [];
	}
}

export async function writeUploads(kind: UploadKind, items: UploadItem[]) {
	await ensureRoot(kind);
	await fs.writeFile(manifestFor(kind), JSON.stringify(items, null, 2), 'utf-8');
}

export async function addUpload(kind: UploadKind, meta: Omit<UploadItem, 'createdAt'>) {
	const items = await readUploads(kind);
	items.unshift({ ...meta, createdAt: new Date().toISOString() });
	await writeUploads(kind, items);
}

export async function removeUpload(kind: UploadKind, id: string) {
	const items = await readUploads(kind);
	const target = items.find((a) => a.id === id);
	if (target) {
		const dir = path.join(rootFor(kind), id);
		await fs.rm(dir, { recursive: true, force: true });
	}
	await writeUploads(kind, items.filter((a) => a.id !== id));
}

export async function saveUploadHtml(kind: UploadKind, id: string, html: string) {
	const dir = path.join(rootFor(kind), id);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'index.html'), html, 'utf-8');
}

export async function saveUploadThumb(
	kind: UploadKind,
	id: string,
	bytes: Uint8Array,
	ext: string,
): Promise<string> {
	const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
	const dir = path.join(rootFor(kind), id);
	await fs.mkdir(dir, { recursive: true });
	const filename = `thumb.${safeExt}`;
	await fs.writeFile(path.join(dir, filename), bytes);
	return `/${KIND_META[kind].staticDir}/${id}/${filename}`;
}

export function publicHtmlPath(kind: UploadKind, id: string) {
	return `/${KIND_META[kind].staticDir}/${id}/index.html`;
}

export function slugify(s: string) {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 60) || `upload-${Date.now()}`;
}
