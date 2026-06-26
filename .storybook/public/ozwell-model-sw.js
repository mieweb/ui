/* eslint-disable */
/**
 * Ozwell model cache — service worker.
 *
 * WHY: transformers.js caches the Whisper turbo model as a ZERO-byte entry because HuggingFace's
 * newer "Xet" storage returns those files as a REDIRECTED, no-content-length stream. transformers.js's
 * own cache, AND a naive service-worker cache.put(), both fail to store that — so every app open
 * re-downloads ~200MB. (Files on classic LFS — e.g. your jlocala/ozwell-voice-assets wake+speaker
 * models — send a size and aren't redirected, so they cache fine. Proof the mechanism works.)
 *
 * FIX: for model assets only, fetch the full response, READ IT ALL into a buffer, and rebuild a clean
 * Response from that buffer. That (a) materializes a no-content-length stream and (b) strips the
 * `redirected` flag, both of which a raw cache.put() chokes on. Then store + serve that. Everything
 * else (app JS, Storybook HMR) passes straight through, so it can't break the dev server.
 */
const CACHE = 'ozwell-models-v3';

function isModelAsset(url) {
  return (
    (/huggingface\.co\//.test(url) && /\.(onnx|bin|json|txt)(\?|$)/.test(url)) ||
    /\/(wakeword|sv-runtime)\//.test(url) ||
    /\.(onnx|wasm|data)(\?|$)/.test(url)
  );
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      // drop older cache versions so a stale/empty cache can't shadow the fix
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('ozwell-models-') && k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  ),
);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only plain GETs for model assets. Skip range requests (partial reads bypass the cache cleanly).
  if (req.method !== 'GET' || req.headers.has('range') || !isModelAsset(req.url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit; // instant: served from disk, no network

      const resp = await fetch(req);
      if (!resp || resp.status !== 200) return resp;

      // Rebuild a clean, cacheable Response: arrayBuffer() drains the (possibly no-content-length)
      // stream fully, and new Response(buf) has no `redirected` flag. CRUCIAL: HF Xet responses
      // declare NO size, and cache.put() refuses a body of unknown length with a (misleading)
      // QuotaExceededError even when there's GBs free — so set Content-Length explicitly from the
      // buffer we now hold. Use minimal headers to avoid carrying over any Xet header weirdness.
      try {
        const buf = await resp.arrayBuffer();
        const headers = new Headers();
        const ct = resp.headers.get('Content-Type');
        if (ct) headers.set('Content-Type', ct);
        headers.set('Content-Length', String(buf.byteLength));
        const cached = new Response(buf, { status: 200, statusText: 'OK', headers });
        await cache.put(req, cached.clone());
        console.log('[ozwell-sw] cached', req.url, `(${(buf.byteLength / 1e6).toFixed(1)} MB)`);
        return cached;
      } catch (e) {
        console.warn('[ozwell-sw] cache put failed for', req.url, e);
        return fetch(req); // body was consumed; refetch so the app still gets the file
      }
    })(),
  );
});
