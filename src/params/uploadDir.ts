import type { ParamMatcher } from '@sveltejs/kit';

/**
 * Directories under /static that admin uploads write into at runtime (see
 * uploads-store.ts, games-store.ts, and the surveys thumbnail endpoint).
 * adapter-node only serves the build-time snapshot of /static (baked into
 * build/client), so files written here after the container starts are
 * otherwise unreachable over HTTP — see [dir]/[id]/[file]/+server.ts, which
 * serves them straight from disk to close that gap.
 */
const UPLOAD_DIRS = new Set([
	'games-uploaded',
	'artifacts-uploaded',
	'streaks-uploaded',
	'quizzes-uploaded',
	'weekly-challenges-uploaded',
	'exclusive-deals-uploaded',
	'surveys-uploaded'
]);

export const match: ParamMatcher = (param) => UPLOAD_DIRS.has(param);
