#!/usr/bin/env node
/**
 * Adds `rtl:-scale-x-100` to direction-implying icons across all .svelte files
 * so they horizontally flip in RTL locales (Arabic, Hebrew, Persian).
 *
 * Conservative list — only icons whose meaning depends on reading direction.
 * Status icons (search, settings, check) and movement-only icons (move-up)
 * are intentionally excluded.
 *
 * Usage:
 *     node scripts/flip-rtl-icons.mjs           # apply changes
 *     node scripts/flip-rtl-icons.mjs --dry     # preview without writing
 *
 * Re-runnable: skips icons that already have the flip class.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ICON_NAMES = [
	'ArrowLeft',
	'ArrowRight',
	'ChevronLeft',
	'ChevronRight',
	'ChevronsLeft',
	'ChevronsRight',
	'ArrowLeftCircle',
	'ArrowRightCircle',
	'ArrowLeftSquare',
	'ArrowRightSquare',
	'MoveLeft',
	'MoveRight'
];
const FLIP_CLASS = 'rtl:-scale-x-100';
const ROOT = 'src';
const dryRun = process.argv.includes('--dry');

function* walkSvelte(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stats = statSync(full);
		if (stats.isDirectory()) {
			if (entry === 'node_modules' || entry === '.svelte-kit' || entry === 'paraglide') continue;
			yield* walkSvelte(full);
		} else if (full.endsWith('.svelte')) {
			yield full;
		}
	}
}

function applyFlip(content) {
	let modified = content;
	let count = 0;

	for (const iconName of ICON_NAMES) {
		// Match the opening tag, capturing attributes up to the closing `>` or `/>`.
		// `[^>]*?` matches anything that isn't a `>` (including newlines), non-greedy.
		const tagRegex = new RegExp(`<${iconName}\\b([^>]*?)(/?)>`, 'g');

		modified = modified.replace(tagRegex, (match, attrs, selfClose) => {
			// Idempotent: skip if already flipped.
			if (match.includes(FLIP_CLASS)) return match;

			const classMatch = attrs.match(/(\bclass\s*=\s*)("([^"]*)"|'([^']*)'|\{([^}]*)\})/);
			if (classMatch) {
				const fullAttr = classMatch[0];
				const inner = classMatch[3] ?? classMatch[4] ?? classMatch[5];
				if (classMatch[5] !== undefined) {
					// Dynamic Svelte class binding `class={...}` — too risky to splice.
					// Skip and let the maintainer handle this case manually.
					return match;
				}
				const quote = classMatch[3] !== undefined ? '"' : "'";
				const newInner = inner.trim() ? `${inner.trim()} ${FLIP_CLASS}` : FLIP_CLASS;
				const newAttr = `${classMatch[1]}${quote}${newInner}${quote}`;
				count++;
				return match.replace(fullAttr, newAttr);
			} else {
				// No existing class attribute — add one.
				count++;
				return `<${iconName} class="${FLIP_CLASS}"${attrs}${selfClose}>`;
			}
		});
	}

	return { modified, count };
}

let totalIcons = 0;
let filesTouched = 0;
const skippedDynamic = [];

for (const file of walkSvelte(ROOT)) {
	const original = readFileSync(file, 'utf8');
	const { modified, count } = applyFlip(original);

	if (count > 0 && modified !== original) {
		filesTouched++;
		totalIcons += count;
		if (!dryRun) writeFileSync(file, modified, 'utf8');
		console.log(`[+] ${file} — ${count} icon${count === 1 ? '' : 's'}`);
	}

	// Detect dynamic class bindings we skipped, so the user knows to review them.
	for (const iconName of ICON_NAMES) {
		const dynamicRegex = new RegExp(`<${iconName}\\b[^>]*\\bclass\\s*=\\s*\\{`, 'g');
		if (dynamicRegex.test(original)) {
			skippedDynamic.push(`${file} (<${iconName} class={…}>)`);
		}
	}
}

console.log('\n' + '─'.repeat(56));
console.log(`${dryRun ? 'Dry run' : 'Applied'}: ${totalIcons} icon usages across ${filesTouched} files`);
if (skippedDynamic.length > 0) {
	console.log(`\n⚠ Skipped ${skippedDynamic.length} dynamic class bindings (review manually):`);
	for (const s of skippedDynamic) console.log(`  - ${s}`);
}
if (dryRun) console.log('\nRun without --dry to apply changes.');
