/**
 * Server-side injection of a state-persistence layer into an uploaded,
 * self-contained HTML item (artifacts, the four upload sections, and
 * admin-uploaded games), performed at serve time so we never edit the
 * uploaded files.
 *
 * The injected script exposes two helpers and an opt-in auto-save lifecycle:
 *
 *   window.saveState(obj)  // persist a serializable snapshot
 *   window.loadState()     // -> the snapshot, or null
 *
 *   // Opt-in full-state (JS variables, scores, canvas state) persistence:
 *   window.getState = () => ({...})   // return a serializable snapshot
 *   window.setState = (s) => { ... }  // apply a previously saved snapshot
 *
 * When the item defines getState/setState, the layer auto-restores on load and
 * auto-saves on a throttled interval + visibilitychange/pagehide/beforeunload.
 * Items that ignore the helpers are completely unaffected (injection is a no-op
 * for them), and the parent viewer's DOM-restore action remains as a fallback
 * for items that never call saveState.
 *
 * SECURITY TRADEOFF: the item runs in a same-origin iframe (sandbox with
 * `allow-same-origin`) so it can reach localStorage. That means an uploaded
 * file shares this origin's storage and could, in principle, read/write other
 * keys on this origin. Uploaded content is admin-curated, so we accept this in
 * exchange for cross-refresh persistence. Do not relax the upload gate to
 * untrusted users without revisiting this.
 */

/**
 * Stable, collision-free localStorage key for an item's state.
 * `keyword` is the singular noun for the kind (artifact, streak, quiz,
 * challenge, deal, game) so keys read naturally and never collide across kinds.
 */
export function stateKey(keyword: string, slug: string): string {
	return `earnmaze:${keyword}:${slug}:state`;
}

function buildScript(keyword: string, slug: string): string {
	const key = JSON.stringify(stateKey(keyword, slug));
	// Plain ES5, fully wrapped in try/catch so a disabled/blocked localStorage
	// can never throw into the embedded content.
	return `<script>
(function () {
  var KEY = ${key};
  function loadState() {
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function saveState(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }
  try { window.saveState = saveState; window.loadState = loadState; } catch (e) {}

  function autosave() {
    try {
      if (typeof window.getState === 'function') {
        var s = window.getState();
        if (typeof s !== 'undefined' && s !== null) saveState(s);
      }
    } catch (e) {}
  }
  function restore() {
    try {
      if (typeof window.setState === 'function') {
        var s = loadState();
        if (s !== null && typeof s !== 'undefined') window.setState(s);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restore);
  } else {
    restore();
  }
  window.addEventListener('load', restore);

  var THROTTLE_MS = 4000;
  try { setInterval(autosave, THROTTLE_MS); } catch (e) {}
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') autosave();
  });
  window.addEventListener('pagehide', autosave);
  window.addEventListener('beforeunload', autosave);
})();
</script>`;
}

/**
 * Inject the persistence layer into the item's HTML.
 *
 * No <base> tag is added: uploaded items are self-contained single HTML files
 * (no sibling assets), so a <base> would only risk breaking in-page "#" anchor
 * links by re-pointing them at the original upload directory.
 */
export function injectPersistence(html: string, keyword: string, slug: string): string {
	const inject = buildScript(keyword, slug);

	if (/<\/head>/i.test(html)) {
		return html.replace(/<\/head>/i, `${inject}</head>`);
	}
	if (/<body[^>]*>/i.test(html)) {
		return html.replace(/<body[^>]*>/i, (m) => `${m}${inject}`);
	}
	return inject + html;
}
