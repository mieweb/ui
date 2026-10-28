import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Button } from '../../../Button';
import { conversation, shortVisit, type DemoRecording } from './demoRecordings';
import {
  TranscriptPlayer,
  type TranscriptPlayerLabels,
} from './TranscriptPlayer';

const meta: Meta<typeof TranscriptPlayer> = {
  id: 'voice-transcript-player',
  title: 'Modules/Voice/Transcript Player',
  component: TranscriptPlayer,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**Reviewing a diarized recording: who spoke when, and what they said.** \`TranscriptPlayer\` takes an audio \`src\` and a \`Transcript\` and shows one playhead across a waveform, one lane per speaker, an overview of the whole recording with a draggable window, and a searchable transcript. Hover a lane segment for its speaker and times; click it, or a transcript line, to play just that interval. The speaker panel shows each person's talk time and share and hides or shows them. Long recordings open on a 5-minute window you can zoom and pan; long transcripts are virtualized.

Lanes come from \`transcript.speakerActivity\` when present (raw diarizer output, so overlap and "mm-hm" with no words stay visible), else from \`segments\`. A segment's \`overlapSpeakerIds\` shows as "Overlaps …" on its line.

### Use it when

- A clinician or reviewer checks a visit recording and needs to hear **who said a line**, including cross-talk.
- You have diarization output (\`speakerActivity\`) and want it visible next to the words.
- Recordings run from seconds to an hour or more.

### Don't use it when

- You only need read-along with click-to-seek next to your own player: \`TranscriptView\` with \`MediaPlayer\`.
- The user edits words or cuts the recording: \`MediaEditor\`.
- There is no audio and no timing: render the text.

### Example

\`\`\`tsx
import { TranscriptPlayer, type Transcript } from '@mieweb/ui';

// The host owns the audio URL: create it for the recording, revoke it when done.
const src = useMemo(() => URL.createObjectURL(recording), [recording]);
useEffect(() => () => URL.revokeObjectURL(src), [src]);

const transcript: Transcript = {
  durationMs: 9000,
  speakers: [{ id: 'doc', name: 'Dr. Smith' }, { id: 'pt', name: 'Patient' }],
  words: [],
  segments: [
    { text: 'How is the knee?', startMs: 0, endMs: 2000, speakerId: 'doc', words: [] },
    { text: 'Better but sore.', startMs: 2500, endMs: 5000, speakerId: 'pt', overlapSpeakerIds: ['doc'], words: [] },
  ],
  speakerActivity: [
    { speakerId: 'doc', startMs: 0, endMs: 2000 },
    { speakerId: 'pt', startMs: 2500, endMs: 5000 },
    { speakerId: 'doc', startMs: 4500, endMs: 9000 },
  ],
};

<TranscriptPlayer
  src={src}
  transcript={transcript}
  labels={{ play: t('play'), pause: t('pause') }}
/>
\`\`\`

### Limitations

- **Experimental.** Props may change while mieweb/ui#654 is validated.
- **Waveform.** Without \`peaks\`, the player fetches and decodes the audio once to draw it, and skips files over 50 MB (decoding needs memory in proportion to length). Pass \`computePeaks(samples, sampleRate)\` for long recordings you have already decoded.
- **Audio** must be playable by an \`<audio>\` element; the host owns \`src\` (for example an object URL) and revokes it.
- **Timeline is left to right** in every locale, as in other audio tools; the rest of the layout follows the page direction. Times use \`m:ss\` / \`h:mm:ss\`.
- **i18n.** Every string is in \`labels\` (English defaults in \`DEFAULT_TRANSCRIPT_PLAYER_LABELS\`); strings with values are functions, including \`formatDuration\`, \`formatSpeed\` and \`formatShare\`.
- **Keyboard.** Seek slider: arrows ±5 s, Home/End, Space/Enter plays. Lane segments: Tab into a lane, arrows move between its segments in the visible window, Enter plays (again pauses), Escape hides the details. The overview window moves with arrows. Full screen: the page behind is inert, and Escape leaves.
- Speaker colours repeat after eight speakers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'media-transcriptview',
          why: 'TranscriptView for read-along next to a host player; TranscriptPlayer when reviewers need who-spoke-when lanes, overlap and segment playback built in.',
        },
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof TranscriptPlayer>;

/** Builds a demo recording once per mount and frees its audio URL on unmount. */
function Demo({ make }: { make: () => DemoRecording }) {
  const recording = React.useMemo(make, [make]);
  React.useEffect(() => () => URL.revokeObjectURL(recording.src), [recording]);
  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <TranscriptPlayer
        src={recording.src}
        transcript={recording.transcript}
        peaks={recording.peaks}
      />
    </div>
  );
}

const medium = () => conversation({ duration: 300, speakers: 3 });
const long = () => conversation({ duration: 45 * 60, speakers: 3, seed: 11 });
const overlapping = () =>
  conversation({ duration: 120, speakers: 3, overlapRate: 0.6, seed: 5 });
const many = () => conversation({ duration: 240, speakers: 6, seed: 3 });
const manyLines = () =>
  conversation({ duration: 20 * 60, speakers: 2, pace: 0.35, seed: 9 });
const noTranscript = (): DemoRecording => {
  const recording = shortVisit();
  return {
    ...recording,
    transcript: { durationMs: recording.transcript.durationMs, words: [] },
  };
};
const audioUnavailable = (): DemoRecording => {
  const { src, transcript } = shortVisit();
  URL.revokeObjectURL(src);
  return { src: '/missing-recording.wav', transcript };
};

/**
 * A 10 s visit with an overlap at 5.0–5.6 s and an "mm-hm" at 8 s that has no transcript words.
 * Each speaker in these demos is a different pitch, so you can hear that the right interval plays.
 */
export const ShortVisit: Story = {
  render: () => <Demo make={shortVisit} />,
};

/** Five minutes, three speakers; the timeline opens on the whole recording. */
export const FiveMinutes: Story = {
  render: () => <Demo make={medium} />,
};

/** 45 minutes: the lanes show a 5-minute window; drag the overview box or zoom to move. */
export const FortyFiveMinutes: Story = {
  render: () => <Demo make={long} />,
};

/** Frequent cross-talk: two lanes lit at once, "Overlaps …" on lines, and shares above 100% in total. */
export const OverlappingSpeakers: Story = {
  render: () => <Demo make={overlapping} />,
};

/** Six speakers, each with a consistent colour across lanes, transcript and panel. */
export const SixSpeakers: Story = {
  render: () => <Demo make={many} />,
};

/** Several hundred short lines, rendered with virtualization; try search and the speaker filter. */
export const LongTranscript: Story = {
  render: () => <Demo make={manyLines} />,
};

/** Audio but no transcript or diarization yet. */
export const NoTranscript: Story = {
  render: () => <Demo make={noTranscript} />,
};

/** The audio URL fails to load: an error is shown and the transcript stays readable. */
export const AudioUnavailable: Story = {
  render: () => <Demo make={audioUnavailable} />,
};

/** Switching recordings resets playback, the timeline window, filters and search. */
export const SwitchRecording: Story = {
  render: function SwitchRecording() {
    const [which, setWhich] = React.useState<'short' | 'medium'>('short');
    return (
      <div>
        <div className="mx-auto flex max-w-[1100px] gap-2 px-6 pt-6">
          {(['short', 'medium'] as const).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={which === key ? 'primary' : 'outline'}
              aria-pressed={which === key}
              onClick={() => setWhich(key)}
            >
              {key === 'short' ? '10 s visit' : '5 min visit'}
            </Button>
          ))}
        </div>
        <Demo key={which} make={which === 'short' ? shortVisit : medium} />
      </div>
    );
  },
};

const spanish: Partial<TranscriptPlayerLabels> = {
  play: 'Reproducir',
  pause: 'Pausa',
  transcript: 'Transcripción',
  searchTranscript: 'Buscar en la transcripción',
  searchPlaceholder: 'Buscar en la transcripción…',
  speakers: 'Hablantes',
  allSpeakers: 'Todos los hablantes',
  overlapNote:
    'Hubo personas hablando a la vez, así que los porcentajes pueden sumar más del 100 %.',
  hint: 'Pase el cursor sobre un segmento para ver detalles y haga clic para reproducir solo esa parte.',
  speakingTurns: (speaker) => `Turnos de ${speaker}`,
  overlapWith: (speakers) => `Se superpone con ${speakers}`,
};

/** Spanish labels through the `labels` prop. */
export const Translated: Story = {
  render: function Translated() {
    const recording = React.useMemo(shortVisit, []);
    React.useEffect(
      () => () => URL.revokeObjectURL(recording.src),
      [recording]
    );
    return (
      <div className="mx-auto max-w-[1100px] p-6">
        <TranscriptPlayer
          src={recording.src}
          transcript={recording.transcript}
          peaks={recording.peaks}
          labels={spanish}
        />
      </div>
    );
  },
};
