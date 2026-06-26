/**
 * Registers the model-cache service worker (public/ozwell-model-sw.js).
 *
 * Why: transformers.js caches the Whisper turbo model as a 0-byte entry (HuggingFace omits
 * content-length on its newer storage → the progress-stream drains the body before caching), so
 * every app open re-downloads ~200MB. The service worker fetches the full file itself and serves a
 * complete copy on later opens — fixing turbo, wake, and speaker caching. See ozwell-model-sw.js.
 *
 * Idempotent and best-effort: safe to call from multiple mount points; no-ops without SW support.
 * The SW intercepts on the NEXT load (it activates + claims after first registration), so the very
 * first visit still downloads normally; subsequent opens are cache hits.
 */
let registered = false;

export function registerModelServiceWorker(swUrl = '/ozwell-model-sw.js'): void {
  if (registered) return;
  registered = true;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(swUrl).then(
    () => console.log('[modelCache] model service worker registered'),
    (e) => console.warn('[modelCache] SW registration failed (models will still load, just not cached):', e),
  );
}
