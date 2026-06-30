/**
 * Registers the model-cache service worker. In this repo the SW file lives at
 * `.storybook/public/ozwell-model-sw.js` and is served at `/ozwell-model-sw.js` by Storybook only — a
 * consumer that wants caching outside Storybook must serve/copy the SW at the `swUrl` path passed below.
 *
 * Why: cache the wake-word + speaker-verification model assets across app opens so a returning user
 * loads them from disk instead of re-downloading. The service worker fetches the full file itself and
 * serves a complete copy on later opens.
 * NOTE: Whisper turbo caching is handled SEPARATELY by transformers.js (it streams the model into the
 * Cache API, and the model is hosted on Cloudflare R2 which sends Content-Length) — the SW intentionally
 * does NOT intercept the Whisper weight files. See ozwell-model-sw.js / AI/MODEL-HOSTING.md.
 *
 * Idempotent and best-effort: safe to call from multiple mount points; no-ops without SW support.
 * The SW intercepts on the NEXT load (it activates + claims after first registration), so the very
 * first visit still downloads normally; subsequent opens are cache hits.
 */
const registered = new Set<string>();

export function registerModelServiceWorker(swUrl = '/ozwell-model-sw.js'): void {
  if (registered.has(swUrl)) return; // memoize per-URL, so a different swUrl isn't silently ignored
  registered.add(swUrl);
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(swUrl).then(
    () => console.log('[modelCache] model service worker registered'),
    (e) => console.warn('[modelCache] SW registration failed (models will still load, just not cached):', e),
  );
}
