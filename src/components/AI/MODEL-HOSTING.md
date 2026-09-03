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

## Historical — the pre-cutover state (these binaries have since been removed; see the note above)

Before the cutover, committed binaries, ~57 MB total:

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
**defaulting to the hosted HuggingFace base (`DEFAULT_ASSET_BASE`) so a fresh clone works with no config**,
overridable by one global:

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

## Runtime model caching (so models don't re-download every app open) — SOLVED 2026-06-26

Models are cached across app opens so a returning user loads from disk, not the network:

- **Wake + speaker models** (`jlocala/ozwell-voice-assets`, classic LFS, ~1–40 MB) — cached by a service
  worker (`.storybook/public/ozwell-model-sw.js`, registered via `AI/modelCache.ts`). It intercepts those
  requests and stores the full response in the Cache API. Reliable.
- **Whisper turbo** (~1.3 GB) — hosted on **Cloudflare R2** and cached by transformers.js's own streaming
  cache (`env.useBrowserCache = true`). `whisperTranscribe.ts` points `env.remoteHost` at the R2 bucket
  (`pub-…r2.dev`, model id `whisper-turbo`, `remotePathTemplate '{model}/'`). Confirmed: loads once cold
  (~85 s), then **~10 s from cache** on later opens. The SW deliberately does NOT touch the Whisper files.

**Why R2 and not HuggingFace (the day-long diagnosis):** turbo's weights live on HuggingFace's newer
**Xet** storage, whose download responses carry **NO `Content-Length`**. transformers.js can't
stream-to-cache a body of unknown size → it caches a 0-byte entry → re-downloads ~1.3 GB every cold open.
Ruled out: disk (77 GB free), quota (10 GB), Chrome policy (none). Self-hosting on HF didn't help — HF
forces large files onto Xet even with `HF_HUB_DISABLE_XET=1` + `hf_xet` uninstalled ("stored with Xet" on
the file page). **R2 sends `Content-Length`, so transformers.js's normal streaming cache just works** —
exactly like base.en (classic LFS) always did. Audio still never leaves the browser; R2 only hosts the
model file. (To repoint to a mieweb-owned bucket for the PR: change `R2_HOST` + the bucket path.)

**Honest caveats (for the production architecture conversation with Doug):**
- Caching is **load-dependent**, not perfectly deterministic. On a clean single session it's ~10 s; under
  heavy local contention (several tabs loading 1.3 GB + GPU-compiling at once) a load can stretch to ~60 s.
  Not eviction — just the machine busy. Smooths out in normal single-user use.
- Browser cache for a **website** is best-effort: under real disk pressure the browser *can* evict the
  cached model, forcing a one-time re-download. `navigator.storage.persist()` is requested but not
  guaranteed for a site (only PWA-install / high engagement reliably persist).
- A "corrupted" browser profile can also block caching — seen during this session on the dev profile after
  hours of clear-site-data + a full disk + repeated failed 1 GB writes. A fresh profile (or fully clearing
  the origin's site data) fixes it. **This was a dev artifact, not a production risk** — real users start clean.
- **For uniform reliability across all hardware/locked-down machines, server-side transcription** (browser
  sends audio to a HIPAA-compliant Whisper server) is the robust alternative — no client download, faster,
  more accurate, but trades the on-device/PHI-stays-local story. This is a deliberate architecture choice,
  not a fix for something broken: the on-device + R2 setup **works** and is fine for the demo.

## Local demo

The Storybook demo runs with no setup: both loaders default to the hosted HuggingFace
asset base (see the cutover note at the top), so a fresh clone fetches wake, speaker, and
Whisper models at runtime — no binaries in the repo. To point at a different host, set
`window.__ozwellAssets` before the components mount.
