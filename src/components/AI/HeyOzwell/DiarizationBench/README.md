# Diarization Bench

Dev-only bench for [mieweb/ui#492](https://github.com/mieweb/ui/issues/492): compares the legacy diarization pipeline, Nemotron named by TitaNet, and Nemotron named by stored Nemotron voiceprints on the same clip. Nothing in this folder is exported from `@mieweb/ui`.

Open it in Storybook: **Modules / Voice / Speaker Scribe**, story **Diarization Bench**.

| File                   | Purpose                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `DiarizationBench.tsx` | The bench UI: pick or record a clip, run all modes, show metrics and timelines, copy a JSON report.                           |
| `compare.ts`           | Summary metrics, frame-based diarization error rate, identification outcomes (correct / false accept / missed), solo windows. |

The Nemotron runtime lives in [`../nemotron/`](../nemotron), shared with the experimental `SpeakerScribe`. It is ported from [khawjaahmad/nemotron-diarization-web](https://github.com/khawjaahmad/nemotron-diarization-web) at `0dc1980` (MIT, see `../nemotron/LICENSE`) and was verified upstream frame-for-frame against a Python reference. Changes here: the ONNX Runtime module is passed in (the worker loads `onnxruntime-web` 1.30.0 from jsDelivr, leaving the package's pinned 1.19.0 for the wake word untouched), and the speaker cache can be pre-filled with stored voiceprints. The model is `onnx-community/Nemotron-3-Diarization-ONNX` at revision `353b6f8`, loaded from Hugging Face.

Results go on #492. See [nemotron-plan.md](../../../../../nemotron-plan.md).
