/* eslint-disable */
/**
 * Ozwell model cache — service worker.
 *
 * WHAT IT CACHES: only the speaker-verify runtime (the sherpa WASM + .data under /sv-runtime/) and
 * onnxruntime-web's wasm (see isModelAsset). It does NOT touch the Whisper weights — transformers.js caches
 * those into the Cache API itself (from Cloudflare R2). Wake-word .onnx are handled by OPFS, not this SW.
 *
 * WHY: some of these runtime assets arrive as a REDIRECTED, no-content-length stream (e.g. from HuggingFace's
 * "Xet" storage), which a naive service-worker cache.put() can't store — so they'd re-download every open.
 *
 * FIX: for model assets only, fetch the full response, READ IT ALL into a buffer, and rebuild a clean
 * Response from that buffer. That (a) materializes a no-content-length stream and (b) strips the
 * `redirected` flag, both of which a raw cache.put() chokes on. Then store + serve that. Everything
 * else (app JS, Storybook HMR) passes straight through, so it can't break the dev server.
 */
const CACHE = 'ozwell-models-v4';

// Cache ONLY runtime assets: the speaker (sherpa) runtime files and the ONNX/sherpa WASM. Deliberately
// does NOT touch:
//   - the wake-word model .onnx files — those now live in OPFS (app-managed; see WakeWord/lib/opfs.js),
//   - the Whisper model files — transformers.js's own streaming cache handles those (it stores the ~1.2GB
//     turbo model efficiently; a buffered SW cache.put chokes on it).
function isModelAsset(url) {
  // Narrow to the two runtime bundles we actually want cached: the sherpa speaker runtime (its .wasm/.data
  // live under /sv-runtime/) and onnxruntime-web's wasm. A bare *.wasm/*.data match was too broad — it
  // would cache any unrelated third-party WASM/data and bloat the cache. Match `onnxruntime-web` followed
  // by `/` OR `@version` so jsDelivr's versioned path (…/onnxruntime-web@1.19.0/dist/*.wasm) is caught too.
  return /\/sv-runtime\//.test(url) || /onnxruntime-web[@/].*\.(wasm|mjs|data)(\?|$)/.test(url);
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
        // Caching is best-effort: if cache.put fails we STILL hold the bytes, so serve them rather
        // than re-downloading a (possibly GB-sized) file.
        try {
          await cache.put(req, cached.clone());
          console.log('[ozwell-sw] cached', req.url, `(${(buf.byteLength / 1e6).toFixed(1)} MB)`);
        } catch (e) {
          console.warn('[ozwell-sw] cache put failed for', req.url, e);
        }
        return cached;
      } catch (e) {
        // arrayBuffer() drained/failed — the body is gone, so refetch to still serve the file.
        console.warn('[ozwell-sw] buffering failed for', req.url, e);
        return fetch(req);
      }
    })(),
  );
});
