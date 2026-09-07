import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TranscriptView } from './TranscriptView';
import type { Transcript } from './transcript';
import { Button } from '../Button';

// ============================================================================
// Sample data
// ============================================================================

/** A short diarized clinical exchange (ms-canonical). */
const sampleTranscript: Transcript = {
  durationMs: 12000,
  speakers: [
    { id: 'spk_0', name: 'Clinician' },
    { id: 'spk_1', name: 'Patient' },
  ],
  words: [
    { text: 'Good', startMs: 0, endMs: 400, speakerId: 'spk_0' },
    { text: 'morning,', startMs: 400, endMs: 900, speakerId: 'spk_0' },
    { text: 'how', startMs: 900, endMs: 1200, speakerId: 'spk_0' },
    { text: 'are', startMs: 1200, endMs: 1400, speakerId: 'spk_0' },
    { text: 'you', startMs: 1400, endMs: 1700, speakerId: 'spk_0' },
    { text: 'feeling', startMs: 1700, endMs: 2200, speakerId: 'spk_0' },
    { text: 'today?', startMs: 2200, endMs: 2800, speakerId: 'spk_0' },
    { text: '', startMs: 2800, endMs: 3400, wordType: 'silence' },
    { text: 'A', startMs: 3400, endMs: 3600, speakerId: 'spk_1' },
    { text: 'little', startMs: 3600, endMs: 4000, speakerId: 'spk_1' },
    { text: 'tired,', startMs: 4000, endMs: 4600, speakerId: 'spk_1' },
    { text: 'but', startMs: 4600, endMs: 4900, speakerId: 'spk_1' },
    { text: 'the', startMs: 4900, endMs: 5100, speakerId: 'spk_1' },
    { text: 'headaches', startMs: 5100, endMs: 5800, speakerId: 'spk_1' },
    { text: 'are', startMs: 5800, endMs: 6000, speakerId: 'spk_1' },
    { text: 'better.', startMs: 6000, endMs: 6600, speakerId: 'spk_1' },
  ],
  segments: [
    {
      text: 'Good morning, how are you feeling today?',
      startMs: 0,
      endMs: 2800,
      speakerId: 'spk_0',
      words: [],
    },
    {
      text: 'A little tired, but the headaches are better.',
      startMs: 3400,
      endMs: 6600,
      speakerId: 'spk_1',
      words: [],
    },
  ],
};

/** A word-only transcript (no diarization/segments). */
const wordOnlyTranscript: Transcript = {
  durationMs: 4000,
  words: [
    { text: 'The', startMs: 0, endMs: 300 },
    { text: 'quick', startMs: 300, endMs: 700 },
    { text: 'brown', startMs: 700, endMs: 1100 },
    { text: 'fox', startMs: 1100, endMs: 1500 },
    { text: '', startMs: 1500, endMs: 2200, wordType: 'silence-newline' },
    { text: 'jumps', startMs: 2200, endMs: 2700 },
    { text: 'over', startMs: 2700, endMs: 3100 },
    { text: 'the', startMs: 3100, endMs: 3300 },
    { text: 'lazy', startMs: 3300, endMs: 3700 },
    { text: 'dog.', startMs: 3700, endMs: 4000 },
  ],
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof TranscriptView> = {
  id: 'media-transcriptview',
  title: 'Modules/Media/TranscriptView',
  component: TranscriptView,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Showing a transcript that follows playback and seeks on click — read-only.** \`TranscriptView\` renders a \`Transcript\` (\`durationMs\`, \`words[]\`, optional \`segments[]\` and \`speakers[]\`) at one of two \`granularity\`s: \`word\` (inline tokens, silences as an interpunct or a line break) or \`segment\` (rows of timestamp | speaker | text, the osheet artifact-viewer layout). The default is \`segment\` when the transcript has segments, else \`word\`. It is controlled: the host passes \`currentTimeMs\` and the matching item gets \`aria-current\` + highlight; clicking (or Enter/Space on) an item reports its \`startMs\` through \`onSeek\` and the host performs the seek. \`followPlayback\` (default \`true\`) scrolls the active item into view unless the pointer is over the transcript. \`speakerLabels\` remaps speaker ids (Clinician/Patient), \`mergeSameSpeaker\` collapses consecutive rows, \`showTimestamps\` toggles \`m:ss\`, \`actions\` renders a header row for host buttons. Types (\`Transcript\`, \`TranscriptWord\`, \`TranscriptSegment\`, \`Speaker\`, \`EditableWord\`, \`PlaybackSpeed\`…), \`PLAYBACK_SPEEDS\` and \`formatTimestampMs\` are exported from the same entry.

### Use it when

- A recording plays in a \`MediaPlayer\` (or anything with a millisecond position) and the user wants to **read along and jump** — visit notes, dictation review, call recordings.
- The transcript is diarized and you want speaker rows; or word-timed and you want karaoke-style highlighting.

### Don't use it when

- The user must **change** the words or the cut — \`MediaEditor\` (same \`Transcript\` type, editable).
- There is no media position to follow and you just need formatted text — render the text; the component adds seek affordances that would go nowhere.
- Times are in seconds: convert to milliseconds first (\`AudioPlayer\` reports seconds; \`MediaPlayer\` reports ms).

### Example

\`\`\`tsx
const playerRef = useRef<MediaPlayerRef>(null);
const [positionMs, setPositionMs] = useState(0);

<MediaPlayer ref={playerRef} src={call.url} onTimeUpdate={setPositionMs} />
<TranscriptView
  variant="card"
  transcript={call.transcript}
  granularity="segment"
  speakerLabels={{ spk_0: 'Clinician', spk_1: 'Patient' }}
  mergeSameSpeaker
  currentTimeMs={positionMs}
  onSeek={(ms) => {
    playerRef.current?.seekToMs(ms);
    playerRef.current?.play();
  }}
  actions={<Button size="sm" variant="ghost" onClick={copyTranscript}>Copy</Button>}
/>
\`\`\`

### Limitations

- Accessibility: segment mode is a \`role="list"\` of \`<button>\` rows; word mode renders each word as a focusable \`<span role="button" tabIndex={0}>\`, so a long transcript adds **one Tab stop per word** and the container is a \`div\` with \`aria-label\` but no role. Silences are labelled "Silence, N seconds" in English. No \`aria-live\` announces the active item; \`aria-current="true"\` is the only signal.
- Empty segments are skipped; a word/segment is active only while \`startMs ≤ t < endMs\`, so gaps between items leave nothing highlighted.
- Auto-scroll uses \`scrollIntoView({ block: 'nearest' })\`, which scrolls the **nearest scrollable ancestor** — give the component a bounded, scrolling parent or the page itself will move.
- No search, copy, or export built in — supply them via \`actions\`. Speaker names come from \`speakerLabels\` → \`transcript.speakers[].name\` → raw id.
- RTL/layout: segment rows are \`text-left\` with fixed-width timestamp (\`w-12\`) and speaker (\`w-24\`) columns that truncate long names.
- Theming: semantic tokens plus \`primary-500/20\` highlight and \`text-primary-900\` speaker names. Depends on \`class-variance-authority\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'media-mediaplayer',
          why: 'MediaPlayer onTimeUpdate feeds TranscriptView currentTimeMs, and TranscriptView onSeek calls the ref seekToMs.',
        },
        {
          type: 'alternative to',
          target: 'media-mediaeditor',
          why: 'MediaEditor when the user edits words (delete, cut, speed markers); TranscriptView when the transcript is read-only click-to-seek.',
        },
      ],
    },
  },
  argTypes: {
    granularity: {
      control: 'inline-radio',
      options: ['word', 'segment'],
    },
    variant: {
      control: 'inline-radio',
      options: ['plain', 'card'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TranscriptView>;

// ============================================================================
// Stories
// ============================================================================

export const SegmentMode: Story = {
  args: {
    transcript: sampleTranscript,
    granularity: 'segment',
    variant: 'card',
  },
};

export const WordMode: Story = {
  args: {
    transcript: sampleTranscript,
    granularity: 'word',
    variant: 'card',
  },
};

export const WordOnly: Story = {
  args: {
    transcript: wordOnlyTranscript,
    variant: 'card',
  },
};

export const WithActions: Story = {
  args: {
    transcript: sampleTranscript,
    granularity: 'segment',
    variant: 'card',
    actions: (
      <>
        <Button size="sm" variant="ghost">
          Copy
        </Button>
        <Button size="sm" variant="ghost">
          Re-transcribe
        </Button>
      </>
    ),
  },
};

/** Drives `currentTimeMs` on a timer and highlights + follows the active row. */
const FollowPlaybackDemo = (
  args: React.ComponentProps<typeof TranscriptView>
) => {
  const [timeMs, setTimeMs] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTimeMs((t) => (t + 200) % (args.transcript.durationMs || 1));
    }, 200);
    return () => window.clearInterval(id);
  }, [args.transcript.durationMs]);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Simulated playback position: {(timeMs / 1000).toFixed(1)}s
      </p>
      <TranscriptView
        {...args}
        currentTimeMs={timeMs}
        onSeek={(ms) => setTimeMs(ms)}
      />
    </div>
  );
};

export const FollowPlayback: Story = {
  render: (args) => <FollowPlaybackDemo {...args} />,
  args: {
    transcript: sampleTranscript,
    granularity: 'segment',
    variant: 'card',
  },
};

/** Clicking a word/segment reports its start time through `onSeek`. */
const ClickToSeekDemo = (args: React.ComponentProps<typeof TranscriptView>) => {
  const [lastSeek, setLastSeek] = React.useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {lastSeek === null
          ? 'Click any word or segment to seek.'
          : `Requested seek to ${(lastSeek / 1000).toFixed(1)}s`}
      </p>
      <TranscriptView
        {...args}
        currentTimeMs={lastSeek ?? undefined}
        onSeek={(ms) => setLastSeek(ms)}
      />
    </div>
  );
};

export const ClickToSeek: Story = {
  render: (args) => <ClickToSeekDemo {...args} />,
  args: {
    transcript: sampleTranscript,
    granularity: 'word',
    variant: 'card',
  },
};
