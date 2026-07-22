/**
 * Detects a genuine "attempt" at a same-origin iframe tile: the visitor must
 * have actually interacted with the embedded content (click/keydown/input),
 * not just opened and instantly left. Mirrors the same-origin content-document
 * access pattern already used by `persistIframeState` in `iframe-state.ts`.
 */
export function watchInteraction(iframe: HTMLIFrameElement): () => boolean {
	let interacted = false;
	let cleanup: (() => void) | null = null;

	function getDoc(): Document | null {
		try {
			return iframe.contentDocument;
		} catch {
			return null; // cross-origin — nothing we can observe
		}
	}

	function attach() {
		const doc = getDoc();
		if (!doc) return;
		const mark = () => {
			interacted = true;
		};
		doc.addEventListener('click', mark, true);
		doc.addEventListener('keydown', mark, true);
		doc.addEventListener('input', mark, true);
		cleanup = () => {
			doc.removeEventListener('click', mark, true);
			doc.removeEventListener('keydown', mark, true);
			doc.removeEventListener('input', mark, true);
		};
	}

	function onLoad() {
		cleanup?.();
		cleanup = null;
		attach();
	}

	iframe.addEventListener('load', onLoad);
	attach();

	return () => interacted;
}

/**
 * Fires `cb` when the visitor leaves the current document — covers both a
 * full-page navigation away (e.g. the viewer's "Back" link, which forces a
 * SvelteKit reload) and a tab close/refresh. `pagehide` is the reliable one;
 * `beforeunload` is a fallback for browsers that skip it.
 */
export function onExit(cb: () => void): () => void {
	let fired = false;
	const fire = () => {
		if (fired) return;
		fired = true;
		cb();
	};
	window.addEventListener('pagehide', fire);
	window.addEventListener('beforeunload', fire);
	return () => {
		window.removeEventListener('pagehide', fire);
		window.removeEventListener('beforeunload', fire);
	};
}
