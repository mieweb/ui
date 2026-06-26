# Uploading the voice models to HuggingFace

Run this on your **Mac** (it has the files + browser + can authenticate). It moves the ~57 MB of
model binaries out of the repo and onto a free HuggingFace model repo with correct CORS + MIME —
the same kind of host Whisper already loads from. After this, the code fetches models by URL and the
repo carries no binaries. The code side is already done (`window.__ozwellAssets`); this is the ops side.

## The files being uploaded (preserve these two folder names)

```
wakeword/                       (~6 MB)
  hey-ozwell.onnx               1008K
  ozwell-i'm-done.onnx          1008K
  mel-spectrogram.onnx          1.1M
  speech-embedding.onnx         1.3M
  silero-vad.onnx               1.8M
sv-runtime/                     (~51 MB)
  sherpa-onnx-speaker-diarization.js               7.3K
  sherpa-onnx-wasm-main-speaker-diarization.js     109K
  sherpa-onnx-wasm-main-speaker-diarization.wasm   11M
  sherpa-onnx-wasm-main-speaker-diarization.data   39M
  sv-cohort.json                                   881K
```

## Steps

### 1. Install the CLI

```bash
pip install -U "huggingface_hub[cli]"
hf version    # confirm it runs (older alias: huggingface-cli)
```

### 2. Get a WRITE token + log in

- Make a token at https://huggingface.co/settings/tokens (role: **Write**).
- `hf auth login` → paste the token. (Verify with `hf auth whoami`.)

### 3. Create the model repo

```bash
hf repo create ozwell-voice-assets --type model
# → creates https://huggingface.co/<your-username>/ozwell-voice-assets
```
(Or click "New Model" on the website. Public is fine — these are non-PHI model weights. Make it
private only if you prefer; private repos need the token at fetch time, which complicates the browser.)

### 4. Upload, preserving the folder names

From the `mieweb-ui` repo root on your Mac (`<you>` = your HF username):

```bash
hf upload <you>/ozwell-voice-assets .storybook/public/wakeword   wakeword
hf upload <you>/ozwell-voice-assets .storybook/public/sv-runtime sv-runtime
```

`hf upload <repo> <local-folder> <path-in-repo>` pushes the folder's contents to that path in the
repo. Large files (the 39 MB `.data`, 11 MB `.wasm`) are handled automatically — no manual git-lfs.

### 5. Verify the URLs resolve

The fetch base will be:
```
https://huggingface.co/<you>/ozwell-voice-assets/resolve/main
```
Open these in a browser — each should download / 200:
```
.../resolve/main/wakeword/hey-ozwell.onnx
.../resolve/main/sv-runtime/sherpa-onnx-wasm-main-speaker-diarization.wasm
.../resolve/main/sv-runtime/sv-cohort.json
```

### 6. Point the app at the host

Set the base **before the components mount**. Easiest: add it to `.storybook/preview` (so every
story uses it), or just test from the browser console first:

```js
window.__ozwellAssets = 'https://huggingface.co/<you>/ozwell-voice-assets/resolve/main';
```

Then open the WakeWord / Hands-Free / VoiceSetup stories and confirm in the console:
`[wake] models ready` and `[speaker] TitaNet ready` — i.e. wake, speaker, and dictation all load
**from the host**, not the local folder.

### 7. Remove the binaries from the repo

Once step 6 works in the browser:

```bash
git rm -r .storybook/public/wakeword .storybook/public/sv-runtime
```
Leave a one-line pointer (a README) noting the host URL. Make the hosted base the **default** in code
(so it works with no runtime config) — change `DEFAULT_ASSET` in `useWakeWord.ts` and the `SV_DIR`
fallback in `speaker-verify.js`, or set `window.__ozwellAssets` in `.storybook/preview`. Commit.

## Watch-outs (the reasons this is browser-tested, not done blind)

- **CORS / MIME**: HuggingFace `resolve` URLs send `access-control-allow-origin: *` and serve `.wasm`
  as `application/wasm` — which is exactly why it's the recommended host. A generic static host may not.
- **The apostrophe** in `ozwell-i'm-done.onnx`: it works locally with the literal `'` in the path, and
  HF keeps the filename as-is, so it should fetch fine — but eyeball that one URL in step 5.
- **First load** is a cold download of ~57 MB from the CDN; subsequent loads are cached. Note the
  cold-vs-warm time (MODEL-HOSTING.md step 5).
```
