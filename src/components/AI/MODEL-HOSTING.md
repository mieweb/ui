# Voice model hosting — PR-readiness note

> **✅ CUTOVER DONE.** The ~57 MB of model binaries have been removed from the repo and are now
> hosted on HuggingFace: **https://huggingface.co/jlocala/ozwell-voice-assets**. Both loaders default
> to that host (`DEFAULT_ASSET_BASE` in `WakeWord/useWakeWord.ts`; the `SV_DIR` default in
> `SpeakerVerify/lib/speaker-verify.js`), so a fresh clone runs with no extra setup — wake, speaker,
> and Whisper all fetch at runtime. Verified in-browser from HuggingFace (wake fires, enrollment
> works, both "ready" lines). The history below is kept for context. (For an upstream PR, move the
> host repo under a mieweb-owned org and update the two defaults.)

The on-device voice components (WakeWord, SpeakerVerify, AIChat dictation) need
model files at runtime. They were committed under `.storybook/public/` so the
Storybook demo ran self-contained. **Before this branch can merge upstream into
`mieweb/ui`, those binaries had to move out of the repo** (now done). This note records the
state and the plan so the cutover was a deliberate, testable step — not a scramble.

## Current state (on `feat/ozwell-voice`)

Committed binaries, ~57 MB total:

| Path | Size | What |
|---|---|---|
| `.storybook/public/sv-runtime/sherpa-onnx-wasm-main-speaker-diarization.data` | ~40 MB | TitaNet speaker model + sherpa runtime data |
| `.storybook/public/sv-runtime/sherpa-onnx-wasm-main-speaker-diarization.wasm` | ~11 MB | sherpa-onnx WASM |
| `.storybook/public/sv-runtime/*.js`, `sv-cohort.json` | small | loader + AS-norm cohort |
| `.storybook/public/wakeword/*.onnx` | ~6 MB | wake (`hey-ozwell`, `ozwell-i'm-done`), `mel-spectrogram`, `speech-embedding`, `silero-vad` |

Whisper is **already** loaded from a CDN (Transformers.js → HuggingFace), so it
carries no weight in the repo. The plan below brings the rest in line with that.

## Why it can't ship in `mieweb/ui`

- 57 MB of binaries bloats every clone of the component library.
- Large binaries in a PR trip CI/size checks and make review noisy.
- Models version on a different cadence than the UI code — they belong in a
  model/asset host, not the source tree.

## Proposed approach — fetch at runtime from an asset host

Mirror what Whisper already does: host the files externally, fetch by URL, keep
the repo code-only. Recommended host: **a HuggingFace model repo** (free CDN,
built for this, already in our stack via Whisper + silero). Alternative: a
**GitHub Release** on `hey-ozwell` (attach the bundle, fetch the release-asset
URLs) — fully under our control, no LFS. Avoid jsDelivr for the 40 MB `.data`
(per-file size limits).

### Step 2 (parameterize the asset base) — ✅ DONE

The code no longer hardcodes the Storybook paths. Both loaders resolve a configurable base,
**defaulting to the current local paths so the demo is unchanged**, overridable by one global:

```js
// a single base URL — wakeword/ and sv-runtime/ are expected directly under it:
window.__ozwellAssets = 'https://huggingface.co/<user>/<repo>/resolve/main';
// → wake models from <base>/wakeword/*, sherpa runtime + cohort from <base>/sv-runtime/*

// or per-area, for full control:
window.__ozwellAssets = { wakeword: 'https://…/wakeword', svRuntime: 'https://…/sv-runtime' };
```

- `WakeWord/useWakeWord.ts` — `resolveAssetBase()` reads the `assetBase` **prop** first, then the
  global, then defaults to `/wakeword`. (Prop lets a host override per-mount.)
- `SpeakerVerify/lib/speaker-verify.js` — `SV_DIR` reads the same global, defaults to `/sv-runtime`.

Set the global **before** the components mount (e.g. in `.storybook/preview` or the host's entry).

### Remaining cutover steps (do when browser-testable)

1. **Upload** the `sv-runtime/` bundle + `wakeword/*.onnx` to the chosen host, preserving the
   `wakeword/` and `sv-runtime/` directory names under one base.
2. **Point the base** at the host — set `window.__ozwellAssets` (and, once verified, make the hosted
   URL the default so it works without any runtime config).
3. **Remove the binaries**: `git rm` the tracked files under
   `.storybook/public/{sv-runtime,wakeword}` (keep a tiny README pointer to the host).
4. **Browser-test** the hosted fetch end-to-end: CORS headers, the WASM streaming
   instantiate (correct `application/wasm` MIME on the host), and that wake + speaker + dictation all
   still load. This is the step that must happen in a real browser — it's the whole reason the cutover
   is deferred rather than done blind. (HuggingFace `resolve` URLs serve permissive CORS + correct MIME,
   which is why it's the recommended host.)
5. Re-measure first-load time from the CDN (cold vs warm) and note it.

## Runtime model caching (so models don't re-download every app open)

A service worker (`.storybook/public/ozwell-model-sw.js`, registered via `AI/modelCache.ts`) caches the
model assets in the Cache API so a returning user loads them from disk instead of re-downloading. It
rebuilds each response with an explicit `Content-Length` before `cache.put` (HuggingFace's Xet storage
sends no size, which `cache.put` otherwise rejects). transformers.js's own cache is disabled
(`env.useBrowserCache = false`) so the SW is the single cache layer (no double-storing the ~1 GB model).

**Known limit — managed/enterprise Chrome caps Cache Storage.** On a locked-down work laptop, small
files cache fine but **large entries (~250 MB+, i.e. the Whisper turbo weights) fail `cache.put` with a
misleading `QuotaExceededError` even with GBs of quota free.** Verified: it happens regardless of the
model host (onnx-community Xet *and* a self-hosted LFS mirror both failed identically), and only to the
big files — so it's an org storage policy, not a code bug (`chrome://management` / `chrome://policy`).
There, turbo re-downloads each open. On an unmanaged browser it caches normally. For locked-down
*production* environments (some hospital machines), the robust answer is **server-side transcription**
or a **native app that bundles the model** — a deliberate architecture choice, not a client cache fix.

## Not required for the local demo

The Storybook demo runs fine as-is with the committed assets. This work is purely
to make the branch **mergeable upstream** — sequence it with the PR, after the
team review and Doug's go-ahead, not before.
