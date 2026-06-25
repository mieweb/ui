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

### Cutover steps (do when browser-testable)

1. **Upload** the `sv-runtime/` bundle + `wakeword/*.onnx` to the chosen host.
2. **Parameterize the asset base** instead of the hardcoded Storybook paths:
   - `WakeWord/useWakeWord.ts` — the `ASSET = '/wakeword'` constant.
   - `SpeakerVerify/lib/speaker-verify.js` — the `/sv-runtime/...` paths.
   Default the base to the hosted URL; allow a prop/env override so local dev can
   still point at `.storybook/public` if desired.
3. **Remove the binaries**: `git rm` the tracked files under
   `.storybook/public/{sv-runtime,wakeword}` (keep a tiny README pointer to the host).
4. **Browser-test** the hosted fetch end-to-end: CORS headers, the WASM streaming
   instantiate, and that wake + speaker + dictation all still load. This is the
   step that must happen in a real browser — it's the whole reason the cutover is
   deferred rather than done blind.
5. Re-measure first-load time from the CDN (cold vs warm) and note it.

## Not required for the local demo

The Storybook demo runs fine as-is with the committed assets. This work is purely
to make the branch **mergeable upstream** — sequence it with the PR, after the
team review and Doug's go-ahead, not before.
