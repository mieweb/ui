# Nemotron diarization plan (mieweb/ui#492)

Replace the TitaNet-clustering step of on-device diarization with
[Nemotron 3 Diarization](https://huggingface.co/nvidia/Nemotron-3-Diarization),
and identify enrolled people by pre-filling Nemotron's speaker memory with
stored voiceprints instead of matching TitaNet vectors.

- Ticket: [mieweb/ui#492](https://github.com/mieweb/ui/issues/492) · draft seam: [#493](https://github.com/mieweb/ui/pull/493)
- Sub-issues: [#654](https://github.com/mieweb/ui/issues/654) Transcript Player ([PR #656](https://github.com/mieweb/ui/pull/656)) · [#655](https://github.com/mieweb/ui/issues/655) Speaker Scribe + bench
- Port check (spike, upstream 30 s 6-speaker sample, upstream Python output as reference): Nemotron DER 0.066, 6/6 speakers, RTF 0.063; current pipeline DER 0.400, 4/6 speakers, RTF 0.168. A port check, not a quality result.
- Before/after diagram: [nemotron-before-after.html](.storybook/public/diagrams/nemotron-before-after.html)
  (served by Storybook at `/diagrams/nemotron-before-after.html`)
- Bench: the **Diarization Bench** story under Voice › Speaker Scribe ([DiarizationBench.tsx](src/components/AI/HeyOzwell/DiarizationBench/DiarizationBench.tsx))
- Legacy design: [DIARIZATION.md](src/components/AI/DIARIZATION.md)

## Before and after

|                               | Before (legacy)                             | After                                                       |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Words                         | Whisper turbo                               | Whisper turbo (unchanged)                                   |
| Who spoke when                | TitaNet on every segment + JS clustering    | Nemotron 3 Diarization (8 lanes, overlap-aware)             |
| Who is it                     | TitaNet cosine vs enrolled centroids        | Pre-filled Nemotron lanes from stored speaker-memory frames |
| Overlap / short interjections | Not representable / borrowed from neighbour | Native / own lane                                           |
| Live speaker labels           | No                                          | Possible (Phase 1)                                          |
| Hey Ozwell doctor gate        | TitaNet                                     | TitaNet (out of scope until the POC proves out)             |

**Why stored voiceprints work:** in our ONNX port the speaker memory is an
input (`cached_embeds`) owned by our JS
([speakerCache.ts](src/components/AI/HeyOzwell/nemotron/speakerCache.ts)),
so frames computed once at enrollment can be loaded before each recording. No
audio replay, no per-segment TitaNet.

## Components: new alongside legacy

The legacy path stays intact. The new one is a separate component so both can
be compared on the same clip.

| Legacy (stays)                                          | New (working names)                                                               | Notes                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `VisitScribe` / `useVisitScribe` (`voice-visit-scribe`) | `SpeakerScribe` (`voice-speaker-scribe`), recording via `RecordButton`            | `maturity:experimental` in Phase 0                                                  |
| `useDiarization` + `diarize.ts` clustering              | `useNemotronDiarization` (engine hook, worker)                                    | Runtime shared with the bench in `HeyOzwell/nemotron/`                              |
| TitaNet voiceprints (`useSpeakerVerify.enroll`)         | Nemotron voiceprints (speaker-memory frames)                                      | Separate record type, same `voiceprintNamespace`, stamped with model revision       |
| `DiarizedSegment` (seconds, one speaker per turn)       | `Transcript` (ms) with optional `speakerActivity` and segment `overlapSpeakerIds` | The shared media schema gains two optional fields; speaker ids are lanes (`lane-N`) |
| Text list of turns                                      | `TranscriptPlayer` (`voice-transcript-player`, exported, experimental)            | Lanes, waveform, overview, segment playback, synced transcript; `labels` for i18n   |

The Voice family is at its 10-page [taxonomy limit](CONTRIBUTING.md):
Transcript Player has its own page and the Diarization Bench is a story under
Speaker Scribe instead of a page.

### Deprecation (explained in Phase 0, applied at its exit)

Docs explain the legacy approach and why it is being replaced from the start of
Phase 0. The `maturity:deprecated` tag and `supersedes` / `superseded by`
relationships are applied only if the exit criteria pass; CONTRIBUTING
requires evidence before a deprecation.

| Legacy                          | Why                                                                                           | Migration                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `VisitScribe`, `useVisitScribe` | Clustering cannot represent overlap; interjections are mis-attributed; labels only after Stop | `SpeakerScribe` (same record/stop/rename UX)                        |
| `useDiarization`                | Same as above; TitaNet work grows with meeting length                                         | `useNemotronDiarization`                                            |
| TitaNet diarization voiceprints | Replaced by Nemotron voiceprints for diarization                                              | One-time re-enrollment; TitaNet prints stay for the Hey Ozwell gate |

## Phase 0: POC to play with and validate

**Goal:** an experimental Storybook component where I can enroll voices, record
or drop a clip, and see Nemotron's labelled transcript next to the legacy
result, plus the numbers that decide whether it wins.

**In scope:** batch (after Stop) processing, Storybook only, on-device.
**Out of scope:** live labels, Hey Ozwell doctor gate, removing TitaNet, ORT
version unification, production model hosting, host-app integration.

### 0a. Working-backward docs (first)

Write the docs as if the feature had shipped, then build to them.

- [x] Voice Overview ([HeyOzwell.mdx](src/components/AI/HeyOzwell/HeyOzwell.mdx)): a
      "Diarization: legacy vs Nemotron" section embedding the diagram
      (`<iframe src="./diagrams/nemotron-before-after.html" title="…" />`),
      explaining what changes, what stays, and that the legacy components are
      planned for deprecation pending Phase 0 results.
- [x] `SpeakerScribe` stories page: the five-heading description (what it's
      for / use it when / don't use it when / example / …), `alternative to`
      `voice-visit-scribe` declared on **both** pages, same diagram embedded.
- [x] `VisitScribe` page: a short "Legacy approach" note linking to the
      comparison.
- [x] [DIARIZATION.md](src/components/AI/DIARIZATION.md): mark Phase 3 (pyannote) as
      superseded by this plan.

### 0b. Nemotron voiceprints

- [x] Enroll: run Nemotron once on a sample, keep the frames assigned to that
      speaker in the speaker memory.
- [x] Store per `voiceprintNamespace` in IndexedDB with model id, revision and
      variant; reject on mismatch.
- [x] Seed: load stored frames into `SpeakerCache` before the first chunk.

### 0c. `SpeakerScribe` component (experimental)

- [x] Port the bench's `nemotron/` worker into `useNemotronDiarization`.
- [x] Whisper word timestamps (`transcribeWords`) aligned to lanes; overlap
      recorded as `overlapSpeakerIds` (words no lane claims go to the most
      active lane).
- [x] UI: enroll voices, record or drop a file, result in `TranscriptPlayer`,
      "compare with legacy" toggle that runs `useDiarization` on the same clip.
- [x] Rename / merge / reassign on the speaker (lane) id.
- [x] Namespace switch during processing discards the result (same guarantee as
      PR #407).

### 0d. Bench additions

- [x] Modes: legacy, Nemotron + TitaNet identify, Nemotron + stored voiceprints.
- [x] Identification metrics: correct match, **false accept**, miss.
- [x] Per-stage timing (Nemotron, TitaNet naming) and model load.

### 0e. Validation clips

Two-person visit; 3–4 people with interjections; deliberate overlap;
enrolled person **absent**; similar-sounding stranger; enrolled on one mic,
recorded on another; one 30+ minute clip.

### Phase 0 exit criteria

| Check                                      | Pass when                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Diarization error (overlap scored)         | Nemotron ≤ legacy on the clip set                                                                               |
| False accepts (stranger named as enrolled) | Stored voiceprints ≤ TitaNet identify                                                                           |
| Correct matches across microphones         | Stored voiceprints ≥ TitaNet identify                                                                           |
| Long clip                                  | Seeded identity holds late in the 30+ min clip                                                                  |
| Resources                                  | Load time, processing time and memory acceptable on Mac + one low-end device (budgets set before the final run) |

**Exit outcomes:** adopt (apply deprecation tags, start Phase 1), adopt with
TitaNet kept for identity (Nemotron + TitaNet identify), or stop and keep
legacy.

## Phase 1: Production path (to be detailed)

- Live speaker labels in the scribe (streaming mode)
- Hey Ozwell doctor gate on Nemotron voiceprints, or keep TitaNet
- Model hosting, variant choice, ORT version unification
- Host integration (BlueHive AI, Ozwell Workspace Capture → Artipod)
- Remove legacy after a deprecation window

## Open decisions

- Final names for the component and hooks.
- Nemotron variant for the POC (fp32 on WebGPU vs int8 / q4f16 on WASM).
