import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Serves admin-uploaded thumbnail images straight from disk.
 *
 * adapter-node only serves static assets from the build-time snapshot
 * (build/client) — see node_modules/@sveltejs/adapter-node/files/handler.js.
 * Thumbnails are written to ./static/<kind>-uploaded/<id>/thumb.<ext> at
 * runtime (uploads-store.ts, games-store.ts, surveys thumbnail endpoint),
 * long after that snapshot was taken, so they 404 in production while
 * working locally under `vite dev` (which serves /static live). This route
 * closes that gap for image files the same way game-content/section-content
 * already do for the uploaded HTML itself.
 *
 * Only image extensions are served — .html is intentionally excluded so
 * uploaded content always goes through the *-content routes that inject the
 * persistence layer, never served raw.
 */
const MIME: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif',
	svg: 'image/svg+xml'
};

const STATIC_ROOT = path.join(process.cwd(), 'static');

export const GET: RequestHandler = async ({ params }) => {
	const { dir, id, file } = params;

	const ext = file.split('.').pop()?.toLowerCase() ?? '';
	const contentType = MIME[ext];
	if (!contentType) throw error(404, 'Not found');

	const abs = path.join(STATIC_ROOT, dir, id, file);
	// Route params can't contain "/", but ".." segments could still escape
	// the intended directory — verify the resolved path stays under static/.
	if (!abs.startsWith(STATIC_ROOT + path.sep)) throw error(400, 'Invalid path');

	let bytes: Buffer;
	try {
		bytes = await fs.readFile(abs);
	} catch {
		throw error(404, 'Not found');
	}

	return new Response(bytes, {
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=3600'
		}
	});
};
