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

/** The one ONNX Runtime Web build the voice models run on; keep in step with package.json. */
export const ONNX_RUNTIME_CDN =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';

/** Where a host serves the voice models from: one base URL, or a URL per area. See AI/MODEL-HOSTING.md. */
export type AssetGlobal =
  | string
  | { base?: string; wakeword?: string; svRuntime?: string; nemotron?: string };

/**
 * The host's `window.__ozwellAssets`. Storybook runs stories in an iframe and a console-set global often
 * lands on the parent frame, so this checks current → parent → top (all same-origin).
 */
export function readAssetGlobal(): AssetGlobal | undefined {
  if (typeof window === 'undefined') return undefined; // SSR / Node — no window
  const get = (w?: Window | null): AssetGlobal | undefined => {
    try {
      return (w as unknown as { __ozwellAssets?: AssetGlobal })?.__ozwellAssets;
    } catch {
      return undefined;
    }
  };
  return get(window) || get(window.parent) || get(window.top);
}

export function registerModelServiceWorker(
  swUrl = '/ozwell-model-sw.js'
): void {
  // Bail BEFORE memoizing if SW is unavailable (SSR / unsupported), so we don't mark the URL "registered"
  // and then skip the real registration once running in a proper browser.
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    return;
  if (registered.has(swUrl)) return; // memoize per-URL, so a different swUrl isn't silently ignored
  registered.add(swUrl);
  navigator.serviceWorker.register(swUrl).then(
    () => console.log('[modelCache] model service worker registered'),
    (e) => {
      // Un-memoize on failure (404 in local dev, transient offline/CSP) so a later call can retry this
      // session instead of caching staying disabled until a full reload.
      registered.delete(swUrl);
      console.warn(
        '[modelCache] SW registration failed (models will still load, just not cached):',
        e
      );
    }
  );
}
