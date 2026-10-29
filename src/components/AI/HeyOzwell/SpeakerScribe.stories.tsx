/**
 * Speaker Scribe: experimental Nemotron successor to Visit Scribe (mieweb/ui#492).
 * Not exported from the package yet.
 */
import type { Meta, StoryObj } from '@storybook/react';
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

**Overlap-aware, on-device speaker labels for a recorded conversation.** Enroll the people you know, record or upload a clip, and \`SpeakerScribe\` shows the result in \`TranscriptPlayer\`: who spoke when on one lane per speaker, with **two people talking at once** and **short interjections** kept instead of merged into a neighbour. **Edit speakers** renames, merges (give two speakers the same name) or moves lines. It is the experimental successor to \`VisitScribe\`, which stays unchanged; see the **Before And After** story for the diagram.

How it differs from \`VisitScribe\`:

| | VisitScribe | SpeakerScribe |
|---|---|---|
| Who spoke when | TitaNet on every Whisper segment + clustering | Nemotron 3 Diarization: 8 lanes, overlap-aware |
| Who is it | TitaNet voiceprints from \`VoiceManager\` | Nemotron voiceprints enrolled here, pre-filled into its speaker cache |
| Overlap | One speaker per segment | Line marked "Overlaps …", both lanes lit |
| Review | Text list | \`TranscriptPlayer\`: lanes, waveform, play any line or segment |

Built on \`useNemotronDiarization\` (\`enroll\`, \`removeVoice\`, \`diarize\`, \`voices\`, \`result\`), whose \`result\` is a \`Transcript\` (with \`speakerActivity\` and \`overlapSpeakerIds\`) plus waveform \`peaks\`.

### Use it when

- Several people talk in one recording and you need who said what, including overlap and interjections.
- The people you care about can enroll a short voice sample to be named.

### Don't use it when

- You need a supported, exported scribe today: use \`VisitScribe\`.
- You already have a diarized \`Transcript\` and only need to review it: use \`TranscriptPlayer\`.
- You only need the audio file: use \`AudioRecorder\`.

### Example

1. Type a name, then record or upload at least 5 seconds of that person alone. Repeat for each enrolled person.
2. Record or upload a clip of the conversation. Lines from enrolled people come back named; anyone else is "Speaker N". Click a lane segment or line to hear it.
3. Enroll someone you missed and **Re-analyze** to name them.

### Limitations

- **Experimental and unexported.** The API and stored voiceprint format may change.
- **Voiceprints** are tied to the model and pinned revision; voices from another model show "re-enroll". At most 7 voices; one lane stays free for unenrolled people. Stored in IndexedDB per \`voiceprintNamespace\`, separately from TitaNet voiceprints.
- **Identity has no confidence threshold.** A similar-sounding stranger can be named as an enrolled person.
- **Words no lane claims** go to the most active lane; there is no separate "uncertain" marker.
- **Edits** change names and line speakers only; the lanes keep what the diarizer heard.
- **Downloads:** ONNX Runtime Web 1.30 from jsDelivr and Nemotron weights from Hugging Face, kept in the browser's Cache API after the first visit: fp32 on WebGPU (~398 MB) on desktops with a GPU, else int8 on WASM (~121 MB). Plus Whisper (turbo ~1.3 GB).
- **Recording** labels speakers while it records, so results follow soon after **Stop**; uploads are processed a minute at a time.
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

/** Enroll voices, analyze a clip, and correct the speakers. */
export const Scribe: Story = {
  render: () => <SpeakerScribe />,
};

/** How a recording becomes speaker labels with Visit Scribe and with Speaker Scribe. */
export const BeforeAndAfter: Story = {
  render: () => (
    <iframe
      src="./diagrams/nemotron-before-after.html"
      title="Speaker diarization before and after Nemotron"
      className="h-[1400px] w-full border-0"
    />
  ),
};
