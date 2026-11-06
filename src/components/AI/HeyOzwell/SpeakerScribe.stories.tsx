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
- Your app records and transcribes the audio itself (for example on a server): use the hook with your own words; see **Hosts with their own transcription** below.

### Example

1. Type a name, then record or upload at least 5 seconds of that person alone. Repeat for each enrolled person.
2. Record or upload a clip of the conversation. Lines from enrolled people come back named; anyone else is "Speaker N". Click a lane segment or line to hear it.
3. Enroll someone you missed and **Re-analyze** to name them.

### Hosts with their own transcription

Choose this over \`diarize(blob)\` when your app owns the recorder and already has word timestamps, so the browser should not download Whisper or transcribe again. \`listen\` labels speakers while you record, \`finish\` returns only who spoke when (a \`SpeakerTimeline\`), and \`transcriptFromActivity\` combines it with your words into a \`Transcript\` for \`TranscriptPlayer\`.

\`\`\`tsx
import {
  TranscriptPlayer,
  transcriptFromActivity,
  useNemotronDiarization,
  type LiveDiarization,
  type Transcript,
} from '@mieweb/ui';

const nemotron = useNemotronDiarization({ voiceprintNamespace: userId });
const live = useRef<LiveDiarization | null>(null);

// Your recorder's events. listen() throws until nemotron.model is set, so start after it is.
const onStart = (stream: MediaStream) => (live.current = nemotron.listen(stream));
const onPause = () => live.current?.pause(); // paused audio is left out, so times match the file
const onResume = () => live.current?.resume();
const onDiscard = () => { live.current?.cancel(); live.current = null; };

async function onStop(recordingId: string) {
  const session = live.current;
  live.current = null;
  if (!session) return;
  const timeline = await nemotron.finish(session); // rejects if the user changed meanwhile
  // [{ text, start, end }] in seconds from the start of the recording.
  const words = await fetchWords(recordingId);
  setTranscript(transcriptFromActivity(words, timeline));
}
\`\`\`

- **Seconds, not milliseconds**, for word \`start\` / \`end\`; the timeline and the resulting \`Transcript\` use milliseconds.
- A word goes to the speaker active for most of it, else the nearest one; overlap is listed. Where two speakers overlap, this can pick a different speaker than \`diarize(blob)\`, which compares the model's probabilities.
- **Names:** a session started before the stored voices finish loading (a moment after mount or a \`voiceprintNamespace\` change) names fewer people, and \`finish\` cannot re-run without the clip.
- Pause and resume are accurate to about 0.1 s.

### Limitations

- **Experimental.** \`SpeakerScribe\` is not exported; \`useNemotronDiarization\`, \`transcriptFromActivity\` and their types are. The API and stored voiceprint format may change.
- **No save callback.** The recording, result and speaker edits stay inside \`SpeakerScribe\`, so a host cannot save a reviewed transcript. To persist one, call \`useNemotronDiarization\` directly, own the review and correction UI (\`TranscriptPlayer\` for review), and save its \`Transcript\` yourself.
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
      // Documented in Storybook but not exported from the package yet.
      unexported: true,
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
