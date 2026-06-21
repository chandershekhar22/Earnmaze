import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ArtifactCat = 'data' | 'lifestyle' | 'other';
export type ArtifactTag = 'TRENDING' | 'NEW';

export interface Artifact {
	id: string;
	title: string;
	desc: string;
	cat: ArtifactCat;
	tags: ArtifactTag[];
	readTime: string;
	bg: string;
	icon: string;
	file: string;
	thumb?: string;
	createdAt: string;
}

const ROOT = path.join(process.cwd(), 'static', 'artifacts-uploaded');
const MANIFEST = path.join(ROOT, 'manifest.json');

async function ensureRoot() {
	await fs.mkdir(ROOT, { recursive: true });
	try {
		await fs.access(MANIFEST);
	} catch {
		await fs.writeFile(MANIFEST, '[]', 'utf-8');
	}
}

export async function readManifest(): Promise<Artifact[]> {
	await ensureRoot();
	const raw = await fs.readFile(MANIFEST, 'utf-8');
	try {
		return JSON.parse(raw) as Artifact[];
	} catch {
		return [];
	}
}

export async function writeManifest(items: Artifact[]) {
	await ensureRoot();
	await fs.writeFile(MANIFEST, JSON.stringify(items, null, 2), 'utf-8');
}

export async function addArtifact(meta: Omit<Artifact, 'createdAt'>) {
	const items = await readManifest();
	items.unshift({ ...meta, createdAt: new Date().toISOString() });
	await writeManifest(items);
}

export async function removeArtifact(id: string) {
	const items = await readManifest();
	const target = items.find((a) => a.id === id);
	if (target) {
		const dir = path.join(ROOT, id);
		await fs.rm(dir, { recursive: true, force: true });
	}
	await writeManifest(items.filter((a) => a.id !== id));
}

export async function saveArtifactHtml(id: string, html: string) {
	const dir = path.join(ROOT, id);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'index.html'), html, 'utf-8');
}

export async function saveArtifactThumb(
	id: string,
	bytes: Uint8Array,
	ext: string,
): Promise<string> {
	const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
	const dir = path.join(ROOT, id);
	await fs.mkdir(dir, { recursive: true });
	const filename = `thumb.${safeExt}`;
	await fs.writeFile(path.join(dir, filename), bytes);
	return `/artifacts-uploaded/${id}/${filename}`;
}

export function slugify(s: string) {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 60) || `artifact-${Date.now()}`;
}
