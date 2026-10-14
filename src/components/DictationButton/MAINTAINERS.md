# DictationButton maintainer notes

How to change `DictationButton` and `useDictation` safely. Consumer docs live in the story description.

## Invariants

- **One session at a time.** Every async step (`getUserMedia`, `recorder.onstop`, `transcribe`) checks `sessionRef`. `cancel()` bumps the session, so late results are dropped. A new async step must check the session too.
- **The mic is always released.** `releaseMic()` runs on stop, cancel, error and unmount. A stream that arrives after cancel (permission prompt still open) is stopped right away.
- **A shared stream is never stopped.** A stream from `getStream` is not stored in `streamRef`, so `releaseMic()` cannot stop the host's tracks. No `ended` listener is added to it either (its tracks outlive a take; `MediaRecorder` stops by itself if they end).
- **`busyRef` blocks a double start** while the permission prompt is open, before `status` changes.
- **`onText` never fires after cancel**, and never for empty or blank results.
- **`disabled` cancels in every state**, including the permission prompt (status is still `idle`) and transcribing.
- **No timeslice.** Unlike `RecordButton` and `AudioRecorder` (which call `start(100)`), `useDictation` calls `recorder.start()` without a timeslice and joins every emitted chunk into the final Blob, so each take is one complete file.
- **Escape is document-wide while recording.** The `keydown` listener is added only while `status` is `recording`, skips events that are already `defaultPrevented`, and is removed on stop, cancel and unmount.

## Extension point

`transcribe(audio, signal)` replaces the on-device provider. Providers should honour `signal`. When it is omitted, `whisperTranscribe.ts` is loaded lazily, so server-only hosts never download Whisper.

## Hidden coupling: shared Whisper worker

The default provider calls `transcribeBlob` from [AI/whisperTranscribe.ts](../AI/whisperTranscribe.ts):

- **Shared model setting.** `ozwellConfig.whisper` / `window.__ozwell.whisper` also changes the Voice components (HandsFreeChat and others).
- **English only.** The worker pins `language: 'english'` for turbo, and the small models are `.en`. Changing this affects every Voice component.
- **No cancel.** The worker cannot stop a running decode. `cancel()` only drops the result, so a quick retry competes with the cancelled decode. To add real cancellation, the worker needs per-request cancel or `resetWhisperWorker()`. Note that a reset rejects every in-flight request.

## Tests

- `useDictation.test.ts` covers the hook with fake `MediaRecorder` and `getUserMedia`, and mocks `whisperTranscribe`.
- `DictationButton.test.tsx` mocks the hook and tests only the UI mapping.
- Visual baselines are in `tests/visual/components.spec.ts` (`media-dictationbutton--*`). They show the idle state only, because a recording state needs a real mic.
- Test a real mic in Chrome, Safari or Firefox. VS Code's integrated browser produces takes that will not decode.
