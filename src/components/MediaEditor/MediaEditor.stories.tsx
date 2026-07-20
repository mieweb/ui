import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaEditor } from './MediaEditor';
import type { EditableWord } from '../TranscriptView/transcript';
import type { Transcript } from '../TranscriptView/transcript';
import { getSampleAudio } from '../AudioPlayer/sampleAudio';

// ============================================================================
// Sample data
// ============================================================================

/**
 * A ~5s word-level transcript aligned to the synthetic sample audio. Includes
 * a filler word ('um') and an inter-word gap so the silence-detection and
 * filler-removal flows have something to act on.
 */
const sampleTranscript: Transcript = {
  durationMs: 5000,
  words: [
    { text: 'So', startMs: 0, endMs: 300 },
    { text: 'um', startMs: 300, endMs: 600 },
    { text: 'the', startMs: 600, endMs: 800 },
    { text: 'patient', startMs: 800, endMs: 1300 },
    { text: 'reports', startMs: 1300, endMs: 1900 },
    { text: 'a', startMs: 1900, endMs: 2050 },
    { text: 'mild', startMs: 2050, endMs: 2500 },
    { text: 'headache', startMs: 2500, endMs: 3200 },
    // gap 3200 -> 3900 (700ms) triggers a detected silence
    { text: 'since', startMs: 3900, endMs: 4300 },
    { text: 'yesterday', startMs: 4300, endMs: 5000 },
  ],
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof MediaEditor> = {
  title: 'Components/Images & Media/MediaEditor',
  component: MediaEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A media playback + editable word-level transcript surface. Composes ' +
          'MediaPlayer with an editable transcript driven by the ' +
          '`useTranscriptEdits` hook: delete/restore words, cut/copy/paste, ' +
          'edit word text, split silences, remove filler words, and set ' +
          'per-word playback-speed markers. Controlled and persistence-agnostic ' +
          '(edits flow out via `onEditorStateChange`). Timestamps in milliseconds.',
      },
    },
  },
  argTypes: {
    splitLayout: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MediaEditor>;

// A fixed-height frame so the fullscreen editor has room to lay out.
const Frame: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="h-[600px] w-full p-4">{children}</div>
);

// ============================================================================
// Stories
// ============================================================================

export const Horizontal: Story = {
  render: (args) => (
    <Frame>
      <MediaEditor {...args} />
    </Frame>
  ),
  args: {
    src: getSampleAudio(),
    kind: 'audio',
    transcript: sampleTranscript,
    splitLayout: 'horizontal',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <Frame>
      <MediaEditor {...args} />
    </Frame>
  ),
  args: {
    src: getSampleAudio(),
    kind: 'audio',
    transcript: sampleTranscript,
    splitLayout: 'vertical',
  },
};

/** Surfaces the edit state emitted through `onEditorStateChange`. */
const WithEditTrackingDemo = (args: React.ComponentProps<typeof MediaEditor>) => {
  const [edits, setEdits] = React.useState<EditableWord[] | null>(null);
  const activeCount = edits?.filter((w) => !w.deleted && (w.word.wordType ?? 'word') === 'word').length;

  return (
    <Frame>
      <div className="flex h-full flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {edits === null
            ? 'Delete or edit a word to see the edited timeline update.'
            : `Active spoken words: ${activeCount} of ${args.transcript.words.length}`}
        </p>
        <div className="min-h-0 flex-1">
          <MediaEditor {...args} onEditorStateChange={(next) => setEdits(next)} />
        </div>
      </div>
    </Frame>
  );
};

export const WithEditTracking: Story = {
  render: (args) => <WithEditTrackingDemo {...args} />,
  args: {
    src: getSampleAudio(),
    kind: 'audio',
    transcript: sampleTranscript,
    splitLayout: 'horizontal',
  },
};
