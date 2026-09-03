# Speaker diarization — plan + status (mieweb/ui, Hey Ozwell)

"Who spoke when" for a clinical visit, so the ambient-scribe transcript reads
`Doctor: … / Patient: … / Speaker 3: …` instead of one undifferentiated blob. A visit isn't always
1-on-1 — there may be a patient, a parent/caregiver, a nurse, or another MA in the room — so this must
handle a **variable, unknown number of speakers**, name the ones we know, and stay **on-device** (PHI
never leaves the browser).

## Status — what shipped (Phases 1–2 done)
- **`diarize.ts`** — pure clustering + attribution core (agglomerative, average-linkage, cosine), unit-tested.
- **`useDiarization`** — batch hook wiring Whisper-timestamps → TitaNet embed → cluster → anchor → attribute,
  with optional LLM role inference. Tunable: `threshold` (default **0.65**), `maxSpeakers`,
  `minSegmentSeconds` (default **1.0**), `enabled`.
- **`useVisitScribe` + `<VisitScribe>`** — the product surface: record the room → speaker-labeled transcript,
  with a live rough transcript toggle and (behind "Advanced") a merge-threshold + speaker-cap + **Re-analyze**
  the same clip without re-recording.
- **Conversation mode** (`useHeyOzwell` / `<HandsFreeChat>`) — on "done", diarize the dictation clip and send a
  speaker-labeled transcript to the assistant instead of a flat blob.
- **Defaults tuned for over-splitting:** the merge threshold moved 0.5 → **0.65** and a **1.0s minimum
  segment** was added, because short/varied segments were splitting one person into several speakers.
- **Still pending:** Phase 3 (overlap-aware pyannote WASM), and moving model hosting off personal accounts.

## We already have the hard parts
Diarization = segment → embed → cluster → (optionally) identify → align to a transcript. We ship every
piece except the clustering/attribution glue:

| Need | Have it? |
|---|---|
| VAD / speech segments | ✅ Silero (in the wake stack) |
| Speaker embeddings (text-independent) | ✅ **TitaNet** in the sherpa-onnx WASM (`SpeakerVerify`) |
| Enrolled voiceprints (to name known people) | ✅ per-voice centroids (`useSpeakerVerify`, Phase-2 multi-voice) |
| On-device transcription + timestamps | ✅ Whisper via transformers.js |
| Clustering + transcript attribution | ➕ this work (`diarize.ts`) |

So the MVP needs **no new WASM build** — Whisper gives the segments (its own timestamps), TitaNet embeds
each segment, we cluster in JS, and the existing voiceprints anchor identities.

## Pipeline

```
audio (Float32 / Blob)
  └─ transcribeSegments()  → [{ start, end, text }]        (Whisper w/ timestamps)
      └─ for each segment: embed the audio window          (TitaNet: SpeakerVerify.embed)
          └─ clusterEmbeddings()  → cluster id per segment  (agglomerative, auto-K)   [diarize.ts]
              └─ identify each cluster vs enrolled voices    (SpeakerVerify.identify → best voice or null)
                  └─ attribute: label each transcript segment → DiarizedSegment       [diarize.ts]
```

Output: `DiarizedSegment[] = { start, end, text, cluster, speaker }` where `speaker` is an enrolled name
("Dr. Smith", "MA Sarah") or a generic label ("Speaker 2").

## Naming the unknowns (patient vs. parent vs. nurse)
You can't voiceprint a patient you've never met, so combine:
1. **Voiceprint anchor (known people).** Match each cluster to enrolled voices via TitaNet cosine — the
   doctor and any enrolled care-team get their real name; everyone else is `Speaker N`. (Reuses the
   multi-voice enrollment already shipped.)
2. **LLM role inference (unknowns).** Feed the diarized transcript to Ozwell: "who is the patient vs. the
   clinician vs. a caregiver, from what's said?" Post-hoc semantic labeling — uniquely available since the
   chat backend is already wired.
3. **Manual relabel.** The doctor renames a speaker once (same UX as VoiceManager's rename); optionally
   enroll that cluster on the fly so the rest of the visit stays consistent.

Combination: **anchor the known → LLM-guess the unknown roles → let the doctor correct.**

## Design decisions
- **Batch for the labels, live for feedback.** Speaker attribution is computed at visit end (batch is far
  more accurate). A separate live rough transcript can stream while recording, but it's unlabeled — labels
  need the whole clip.
- **Auto speaker count.** Agglomerative clustering with a cosine-distance threshold (default **0.65**, +
  optional `maxSpeakers` cap) — never hardcode 2. The threshold is exposed for tuning: higher = fewer
  speakers. A **minimum segment length** (default 1.0s) keeps brief interjections from spawning phantom
  speakers — the main over-splitting cause on real audio.
- **On-device vs. server (the real fork).** On-device (TitaNet + JS clustering, what we have) keeps PHI
  local — the differentiator — but trails server SOTA (pyannote + faster-whisper / WhisperX). We push
  on-device and treat the accuracy gap as a known tradeoff.
- **Overlap is the weak spot.** VAD+embedding+clustering isn't overlap-aware; cross-talk segments will be
  messy. A dedicated pyannote-segmentation WASM (Phase 3) improves this.

## Phasing
1. ✅ **MVP (no new WASM):** Whisper segments → TitaNet per-segment embed → JS cluster → anchor to enrolled
   voices → attributed transcript. Doctor (and enrolled staff) named; others `Speaker N`. Surfaced in
   `<VisitScribe>` + conversation mode.
2. ✅ **LLM role inference** for the unknown speakers (manual relabel via VoiceManager rename).
3. **Accuracy upgrade:** build the sherpa-onnx *speaker-diarization* WASM (same recipe as the speaker-verify
   build, on the os.mieweb.org container) — pyannote segmentation for better boundaries + overlap handling —
   and swap it in behind the same `diarize()` interface.

## What needs the Linux container (not buildable on the Mac)
Only Phase 3 (the pyannote-segmentation WASM). The MVP runs entirely on assets we already ship.

## De-risk / validate
Run the MVP on a recorded **multi-speaker** clip in-browser and measure **DER** (diarization error rate)
and how reliably the doctor-anchor picks the right cluster, before investing in Phase 3.
