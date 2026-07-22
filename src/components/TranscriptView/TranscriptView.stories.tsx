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
  title: 'Components/Images & Media/TranscriptView',
  component: TranscriptView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A read-only transcript viewer with word-level and segment-level ' +
          '(diarized) rendering. Controlled and persistence-agnostic: the host ' +
          'owns playback and passes the position via `currentTimeMs`; clicking a ' +
          'word/segment reports the target time through `onSeek` (milliseconds).',
      },
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
const FollowPlaybackDemo = (args: React.ComponentProps<typeof TranscriptView>) => {
  const [timeMs, setTimeMs] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTimeMs((t) => (t + 200) % (args.transcript.durationMs || 1));
    }, 200);
    return () => window.clearInterval(id);
  }, [args.transcript.durationMs]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Simulated playback position: {(timeMs / 1000).toFixed(1)}s
      </p>
      <TranscriptView {...args} currentTimeMs={timeMs} onSeek={(ms) => setTimeMs(ms)} />
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
      <p className="text-sm text-muted-foreground">
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
