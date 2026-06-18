/**
 * Persist and restore the interactive state of a same-origin iframe (our
 * uploaded artifact / section / game HTML) across page refreshes, using
 * localStorage — without modifying the uploaded files themselves.
 *
 * Because the iframe is served from the same origin, the parent page can reach
 * into `iframe.contentDocument` and:
 *   - remember the value of every form control (text, range sliders, selects,
 *     checkboxes, radios, textareas) and replay it, firing input/change so the
 *     embedded app re-renders (this is what restores the "Year Explorer" slider);
 *   - remember which item is "selected" in a group — tabs, segmented controls,
 *     pickable cards, toggles (detected via a broad set of class keywords and
 *     aria-pressed/selected/checked) — and re-click it on load. Re-clicking
 *     re-runs the artifact's own handler, which reconstructs the JS state and
 *     any dynamic DOM it produced (e.g. a quiz result rendered via innerHTML);
 *   - remember scroll position of the document and any scrolled containers.
 *
 * State is keyed `em:istate:{kind}:{id}` so every item has its own bucket.
 *
 * Limitation: state that leaves no DOM trace and isn't reachable by re-clicking
 * a control — e.g. values held only in JS closures, or <canvas> pixels in an
 * arcade game — cannot be restored generically. For those, the artifact can opt
 * into full snapshotting via the injected window.getState/setState helpers
 * (see $lib/server/html-inject). Everything DOM/interaction-driven is covered
 * here without editing the uploaded file.
 */

// Class keywords that signal an element is the "selected" one (tabs, segmented
// controls, pickable cards, toggles). Broad on purpose so we catch the many
// different naming conventions artifacts use (active, chosen, picked, …).
const ACTIVE_RE =
	/(?:^|[\s_-])(?:active|selected|is-selected|is-active|tab-active|current|chosen|picked|checked|highlight(?:ed)?|enabled|sel|on)(?:[\s_-]|$)/i;
const SKIP_INPUT_TYPES = new Set(['password', 'file', 'hidden', 'submit', 'button', 'reset', 'image']);

// Elements a click should be attributed to when looking for a "selection".
const CLICKABLE_SEL =
	'[role="tab"],[role="option"],[role="button"],[role="radio"],[role="menuitemradio"],button,a,label,li,summary,[onclick],[data-tab],[class*="tab"],[class*="card"],[class*="option"],[class*="choice"],[class*="btn"],[class*="pill"],[class*="chip"],[class*="toggle"]';

/** True if an element looks "selected" — by class keyword or ARIA state. */
function isSelected(el: Element | null): boolean {
	if (!el || el.nodeType !== 1) return false;
	if (ACTIVE_RE.test(el.getAttribute('class') || '')) return true;
	return (
		el.getAttribute('aria-pressed') === 'true' ||
		el.getAttribute('aria-selected') === 'true' ||
		el.getAttribute('aria-checked') === 'true'
	);
}

interface ControlVal {
	v?: string;
	c?: boolean;
}
interface ScrollVal {
	t: number;
	l: number;
}
interface State {
	controls: Record<string, ControlVal>;
	tabs: Record<string, string>;
	scroll: { x: number; y: number; els: Record<string, ScrollVal> };
}

function blank(): State {
	return { controls: {}, tabs: {}, scroll: { x: 0, y: 0, els: {} } };
}

function cssEscape(s: string): string {
	if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
	return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

/** A reasonably stable selector for an element within its document. */
function pathOf(el: Element | null): string {
	if (!el || el.nodeType !== 1) return '';
	if (el.id) return `#${cssEscape(el.id)}`;
	const parts: string[] = [];
	let node: Element | null = el;
	while (node && node.nodeType === 1 && node.tagName !== 'HTML' && node.tagName !== 'BODY') {
		if (node.id) {
			parts.unshift(`#${cssEscape(node.id)}`);
			break;
		}
		const tag = node.tagName.toLowerCase();
		const parent: Element | null = node.parentElement;
		if (!parent) {
			parts.unshift(tag);
			break;
		}
		const sameTag = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
		parts.unshift(`${tag}:nth-of-type(${sameTag.indexOf(node) + 1})`);
		node = parent;
	}
	return parts.join(' > ');
}

function isControl(el: any): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	if (!el || el.nodeType !== 1) return false;
	const tag = el.tagName;
	if (tag === 'SELECT' || tag === 'TEXTAREA') return true;
	if (tag === 'INPUT') return !SKIP_INPUT_TYPES.has((el.type || 'text').toLowerCase());
	return false;
}

function fire(el: Element, win: Window) {
	try {
		const Ev = (win as any).Event || Event;
		el.dispatchEvent(new Ev('input', { bubbles: true }));
		el.dispatchEvent(new Ev('change', { bubbles: true }));
	} catch {
		/* ignore */
	}
}

/**
 * Wire up state persistence for an iframe. Returns a cleanup function.
 */
export function persistIframeState(iframe: HTMLIFrameElement, key: string): () => void {
	if (typeof window === 'undefined') return () => {};
	const SKEY = `em:istate:${key}`;

	let state: State = (() => {
		const s = blank();
		try {
			const p = JSON.parse(localStorage.getItem(SKEY) || 'null');
			if (p && typeof p === 'object') {
				if (p.controls && typeof p.controls === 'object') s.controls = p.controls;
				if (p.tabs && typeof p.tabs === 'object') s.tabs = p.tabs;
				if (p.scroll && typeof p.scroll === 'object') {
					s.scroll.x = +p.scroll.x || 0;
					s.scroll.y = +p.scroll.y || 0;
					if (p.scroll.els && typeof p.scroll.els === 'object') s.scroll.els = p.scroll.els;
				}
			}
		} catch {
			/* ignore */
		}
		return s;
	})();

	let saveT: ReturnType<typeof setTimeout> | null = null;
	let perLoadCleanup: (() => void) | null = null;

	function flush() {
		try {
			localStorage.setItem(SKEY, JSON.stringify(state));
		} catch {
			/* quota / disabled — ignore */
		}
	}
	function save() {
		if (saveT) return;
		saveT = setTimeout(() => {
			saveT = null;
			flush();
		}, 250);
	}

	function getDoc(): Document | null {
		try {
			return iframe.contentDocument;
		} catch {
			return null; // cross-origin — can't persist
		}
	}

	function record(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
		const p = pathOf(el);
		if (!p) return;
		const type = (el as HTMLInputElement).type;
		if (type === 'checkbox' || type === 'radio') {
			state.controls[p] = { c: (el as HTMLInputElement).checked };
		} else {
			state.controls[p] = { v: el.value };
		}
	}

	function restore(doc: Document, win: Window) {
		// 1. Re-apply each remembered selection (tab / segmented control / picked
		//    card / toggle) by clicking it — this re-runs the artifact's own
		//    handler, which reconstructs the JS state and any dynamic DOM (e.g. a
		//    quiz result rendered via innerHTML) that the selection produced.
		const reselect = () => {
			for (const sel of Object.values(state.tabs)) {
				try {
					const el = doc.querySelector(sel) as HTMLElement | null;
					if (el && !isSelected(el)) el.click();
				} catch {
					/* ignore */
				}
			}
		};
		reselect();

		const applyControls = () => {
			for (const [p, val] of Object.entries(state.controls)) {
				try {
					const el = doc.querySelector(p) as any;
					if (!el) continue;
					if (typeof val.c === 'boolean') {
						if (el.checked !== val.c) {
							el.checked = val.c;
							fire(el, win);
						}
					} else if (typeof val.v === 'string') {
						if (el.value !== val.v) {
							el.value = val.v;
							fire(el, win);
						}
					}
				} catch {
					/* ignore */
				}
			}
		};

		const applyScroll = () => {
			try {
				win.scrollTo(state.scroll.x || 0, state.scroll.y || 0);
			} catch {
				/* ignore */
			}
			for (const [p, s] of Object.entries(state.scroll.els)) {
				try {
					const el = doc.querySelector(p) as HTMLElement | null;
					if (el) {
						el.scrollTop = s.t || 0;
						el.scrollLeft = s.l || 0;
					}
				} catch {
					/* ignore */
				}
			}
		};

		applyControls();
		// Re-apply on a short schedule: some embeds build their controls/panels/
		// pickers asynchronously (charts, fetched data, tab contents) after `load`.
		// reselect() is idempotent (skips already-selected elements), so retrying
		// it is safe.
		try {
			win.requestAnimationFrame?.(applyControls);
		} catch {
			/* ignore */
		}
		for (const ms of [120, 350, 700, 1200]) {
			setTimeout(() => {
				reselect();
				applyControls();
			}, ms);
		}
		// Scroll last, once content height is settled.
		for (const ms of [60, 300, 800, 1500]) setTimeout(applyScroll, ms);
	}

	function attach(doc: Document, win: Window): () => void {
		const onInput = (e: Event) => {
			if (isControl(e.target)) {
				record(e.target as HTMLInputElement);
				save();
			}
		};
		const onClick = (e: Event) => {
			const el = (e.target as Element)?.closest?.(CLICKABLE_SEL) as HTMLElement | null;
			if (!el) return;
			// After the artifact's own handler runs, if the clicked element became
			// "selected", remember it so we can re-click it on the next load.
			setTimeout(() => {
				try {
					if (!isSelected(el)) return;
					const parent = el.parentElement;
					if (parent && parent.children.length >= 2) {
						// Single-selection group (tabs, segmented control, card picker):
						// store the chosen child per group so switching is tracked.
						state.tabs[pathOf(parent)] = pathOf(el);
					} else {
						// Standalone toggle/selection — key by its own selector.
						state.tabs[pathOf(el)] = pathOf(el);
					}
					flush();
				} catch {
					/* ignore */
				}
			}, 80);
		};
		const onScroll = (e: Event) => {
			const t = e.target as any;
			if (t === doc || t === doc.documentElement || t === doc.body || t === win) {
				state.scroll.x = win.scrollX;
				state.scroll.y = win.scrollY;
			} else if (t && t.nodeType === 1) {
				state.scroll.els[pathOf(t)] = { t: t.scrollTop, l: t.scrollLeft };
			}
			save();
		};

		doc.addEventListener('input', onInput, true);
		doc.addEventListener('change', onInput, true);
		doc.addEventListener('click', onClick, true);
		doc.addEventListener('scroll', onScroll, true);

		return () => {
			doc.removeEventListener('input', onInput, true);
			doc.removeEventListener('change', onInput, true);
			doc.removeEventListener('click', onClick, true);
			doc.removeEventListener('scroll', onScroll, true);
		};
	}

	function onLoad() {
		perLoadCleanup?.();
		perLoadCleanup = null;
		const doc = getDoc();
		const win = iframe.contentWindow;
		if (!doc || !win) return;
		restore(doc, win as Window);
		perLoadCleanup = attach(doc, win as Window);
	}

	iframe.addEventListener('load', onLoad);
	// Handle the case where the iframe already finished loading.
	const doc0 = getDoc();
	if (doc0 && doc0.readyState === 'complete' && doc0.location?.href !== 'about:blank') onLoad();

	const onHide = () => flush();
	window.addEventListener('pagehide', onHide);
	const onVis = () => {
		if (document.visibilityState === 'hidden') flush();
	};
	document.addEventListener('visibilitychange', onVis);

	return () => {
		if (saveT) clearTimeout(saveT);
		flush();
		iframe.removeEventListener('load', onLoad);
		perLoadCleanup?.();
		window.removeEventListener('pagehide', onHide);
		document.removeEventListener('visibilitychange', onVis);
	};
}

/**
 * Svelte action: `<iframe use:persistState={`artifacts:${id}`}></iframe>`
 */
export function persistState(node: HTMLIFrameElement, key: string) {
	let cleanup = persistIframeState(node, key);
	return {
		update(nextKey: string) {
			cleanup();
			cleanup = persistIframeState(node, nextKey);
		},
		destroy() {
			cleanup();
		},
	};
}
