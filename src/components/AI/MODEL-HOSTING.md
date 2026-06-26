# Voice model hosting — PR-readiness note

The on-device voice components (WakeWord, SpeakerVerify, AIChat dictation) need
model files at runtime. Today they're committed under `.storybook/public/` so the
Storybook demo runs self-contained. **Before this branch can merge upstream into
`mieweb/ui`, those binaries must move out of the repo.** This note records the
state and the plan so the cutover is a deliberate, testable step — not a scramble.

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

## Not required for the local demo

The Storybook demo runs fine as-is with the committed assets. This work is purely
to make the branch **mergeable upstream** — sequence it with the PR, after the
team review and Doug's go-ahead, not before.
