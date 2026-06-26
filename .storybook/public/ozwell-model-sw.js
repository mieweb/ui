/* eslint-disable */
/**
 * Ozwell model cache — service worker.
 *
 * WHY: transformers.js caches the Whisper turbo model as a ZERO-byte entry because HuggingFace's
 * newer storage omits content-length; transformers.js reads the body as a stream for its progress
 * bar, which consumes it before caching, so every app open re-downloads ~200MB. (base.en, which DOES
 * send content-length, caches fine — proving the wider mechanism works; turbo specifically doesn't.)
 *
 * FIX: this worker sits between the app and the network. For model assets ONLY, it fetches the FULL
 * response itself and stores a complete copy, then serves that copy on every later open — regardless
 * of whether the size header was present. Caches turbo, wake, AND speaker models. Everything else
 * (app JS, Storybook HMR, etc.) passes straight through, so it can't break the dev server.
 */
const CACHE = 'ozwell-models-v1';

// Only intercept big model assets. Match HuggingFace model files (.onnx/.bin and the small json
// configs alongside them), our wakeword/sv-runtime asset paths, and model/runtime binaries by
// extension. NOTE: app JS is .js and never matches, so hot-reload is untouched.
function isModelAsset(url) {
  return (
    (/huggingface\.co\//.test(url) && /\.(onnx|bin|json|txt)(\?|$)/.test(url)) ||
    /\/(wakeword|sv-runtime)\//.test(url) ||
    /\.(onnx|wasm|data)(\?|$)/.test(url)
  );
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only plain GETs for model assets. Skip range requests (partial reads bypass the cache cleanly).
  if (req.method !== 'GET' || req.headers.has('range') || !isModelAsset(req.url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit; // instant: served from disk, no network

      // First time: fetch the COMPLETE response (the SW reads it all — no progress-stream to drain
      // the body), then store a full clone so the next open is a cache hit.
      const resp = await fetch(req);
      if (resp && resp.status === 200) {
        cache.put(req, resp.clone()).catch(() => {
          /* quota / opaque — ignore, just don't cache this one */
        });
      }
      return resp;
    })(),
  );
});
