/**
 * Resolve the writing direction (`ltr` or `rtl`) for a locale code.
 *
 * Used by:
 *   - hooks.server.ts to set `<html dir="...">` on every server response
 *   - any client-side code that needs to conditionally flip layouts
 *
 * NOTE: existing Tailwind classes that hard-code direction (`ml-*`, `mr-*`,
 * `text-left`, `pl-*`, etc.) won't auto-flip. Migrate to logical
 * properties (`ms-*`, `me-*`, `text-start`, `ps-*`) as you refactor pages
 * for RTL support.
 */
const RTL_BASE_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'yi']);

export function getDirection(locale: string): 'ltr' | 'rtl' {
	const base = locale.split('-')[0].toLowerCase();
	return RTL_BASE_LOCALES.has(base) ? 'rtl' : 'ltr';
}

export function isRtl(locale: string): boolean {
	return getDirection(locale) === 'rtl';
}
