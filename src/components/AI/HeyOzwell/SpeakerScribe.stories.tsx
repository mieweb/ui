/**
 * Speaker Scribe: experimental Nemotron successor to Visit Scribe (mieweb/ui#492, Phase 0).
 * Not exported from the package yet; Storybook only while the approach is validated.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { DiarizationBench } from './DiarizationBench/DiarizationBench';
import { SpeakerScribe } from './SpeakerScribe';

const meta: Meta<typeof SpeakerScribe> = {
  id: 'voice-speaker-scribe',
  title: 'Modules/Voice/Speaker Scribe',
  component: SpeakerScribe,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The proof of concept for overlap-aware, on-device speaker labels (mieweb/ui#492).** Enroll the people you know, record or upload a clip, and \`SpeakerScribe\` shows the result in \`TranscriptPlayer\`: who spoke when on one lane per speaker, with **two people talking at once** and **short interjections** kept instead of merged into a neighbour. **Edit speakers** renames, merges (give two speakers the same name) or moves lines. It is the experimental successor to \`VisitScribe\`, which stays unchanged; see the **Before And After** story for the diagram.

How it differs from \`VisitScribe\`:

| | VisitScribe (legacy) | SpeakerScribe |
|---|---|---|
| Who spoke when | TitaNet on every Whisper segment + clustering | Nemotron 3 Diarization: 8 lanes, overlap-aware |
| Who is it | TitaNet voiceprints from \`VoiceManager\` | Nemotron voiceprints enrolled here, pre-filled into its speaker cache |
| Overlap | One speaker per segment | Line marked "Overlaps …", both lanes lit |
| Words | Whisper segments | Whisper word timestamps (segments as fallback) |
| Review | Text list | \`TranscriptPlayer\`: lanes, waveform, play any line or segment |

Built on \`useNemotronDiarization\` (\`enroll\`, \`removeVoice\`, \`diarize\`, \`voices\`, \`result\`), whose \`result\` is a \`Transcript\` (with \`speakerActivity\` and \`overlapSpeakerIds\`) plus waveform \`peaks\`. **Compare with legacy** runs \`useDiarization\` on the same clip below the result.

### Use it when

- You are validating the Nemotron approach on real clips: overlap, interjections, enrolled vs absent people, different microphones.
- You want to hear whether stored Nemotron voiceprints name enrolled people correctly without TitaNet.

### Don't use it when

- You need a supported scribe in a product today: use \`VisitScribe\` until Phase 0 exits.
- You need numbers (DER, false accepts, per-stage timing): use the **Diarization Bench** story below.
- You already have a diarized \`Transcript\` and only need to review it: use \`TranscriptPlayer\`.
- You only need the audio file: use \`AudioRecorder\`.

### Example

1. Type a name, then record or upload at least 5 seconds of that person alone. Repeat for each enrolled person.
2. Record or upload a clip of the conversation. Lines from enrolled people come back named; anyone else is "Speaker N". Click a lane segment or line to hear it.
3. Turn on **Compare with legacy** and **Re-analyze** to see \`VisitScribe\`'s pipeline on the same clip.

### Limitations

- **Experimental and unexported.** The API and stored voiceprint format may change; nothing here is a supported import yet.
- **Voiceprints** are tied to the model variant and pinned revision. Switching **Model** marks existing voices "re-enroll". At most 7 voices; one lane stays free for unenrolled people. Stored in IndexedDB per \`voiceprintNamespace\`, separately from TitaNet voiceprints.
- **Identity has no confidence threshold.** A similar-sounding stranger can be named as an enrolled person; Phase 0 measures this in the bench.
- **Words no lane claims** go to the most active lane; there is no separate "uncertain" marker.
- **Edits** change names and line speakers only; the lanes keep what the diarizer heard.
- **Downloads:** ONNX Runtime Web 1.30 from jsDelivr and Nemotron weights from Hugging Face (int8 ~121 MB; fp32 ~398 MB, the only variant that works on WebGPU), plus Whisper (turbo ~1.3 GB). Compare loads TitaNet (~50 MB).
- **Batch only:** labels arrive after the clip is processed; no live labels yet.
- **i18n:** Speaker Scribe's own strings are English and not yet externalised; \`TranscriptPlayer\` takes \`labels\`.`,
      },
    },
    catalog: {
      relationships: [
        {
          type: 'alternative to',
          target: 'voice-visit-scribe',
          why: 'Same record-and-label job; SpeakerScribe uses Nemotron for overlap-aware lanes and stored voiceprints instead of TitaNet clustering.',
        },
        {
          type: 'composes with',
          target: 'voice-transcript-player',
          why: 'SpeakerScribe renders its Nemotron result (Transcript + peaks) in TranscriptPlayer.',
        },
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof SpeakerScribe>;

/** Enroll voices, analyze a clip, compare with the legacy pipeline. */
export const Scribe: Story = {
  render: () => <SpeakerScribe />,
};

/** The before/after diagram shared with the Voice overview and nemotron-plan.md. */
export const BeforeAndAfter: Story = {
  render: () => (
    <iframe
      src="./diagrams/nemotron-before-after.html"
      title="Speaker diarization before and after Nemotron"
      className="h-[1400px] w-full border-0"
    />
  ),
};

/**
 * **Developer bench, not a product screen.** Pick or record a clip and it runs, one after the other:
 * the **current** pipeline (`useDiarization`: Whisper → TitaNet per segment → clustering),
 * **Nemotron + TitaNet** (Nemotron lanes, each named by TitaNet from its longest solo stretch) and,
 * when voices are enrolled in the **Scribe** story for the selected model, **Nemotron + voiceprints**.
 * It shows speakers detected, overlap, short turns, processing time and real-time factor, plus DER
 * and identification outcomes (named correctly, **false accepts**, missed enrolled) when you paste
 * reference labels that use the enrolled names. **Copy results (JSON)** gives a report for #492.
 *
 * 1. Enroll people in **Voice Manager** (TitaNet) and in **Scribe** (Nemotron) under the same names.
 * 2. Record 2–3 people, including stretches where two talk at once.
 * 3. Enter the expected speaker count and paste reference labels, such as
 *    `[{ "speaker": "Dr. Smith", "start": 0, "end": 4.2 }]`.
 * 4. **Run all** twice (the first run includes model downloads), then **Copy results (JSON)**.
 *
 * The current pipeline's first run includes Whisper loading; Nemotron reports load separately. On
 * WebGPU only fp32 gives correct Nemotron output. DER uses 10 ms frames, no collar, overlap included.
 */
export const Bench: Story = {
  name: 'Diarization Bench',
  parameters: { layout: 'centered' },
  render: () => <DiarizationBench />,
};
