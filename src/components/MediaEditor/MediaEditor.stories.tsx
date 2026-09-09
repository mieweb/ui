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
  id: 'media-mediaeditor',
  title: 'Modules/Media/MediaEditor',
  component: MediaEditor,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**Editing a recording by editing its words.** \`MediaEditor\` stacks a \`MediaPlayer\` over (or beside, \`splitLayout="vertical"\`) a word-level transcript where every word is a selectable token: delete/restore, cut/copy/paste, edit text, split a silence, strip filler words, and pin per-word playback-speed markers. All edit state lives in the headless \`useTranscriptEdits\` hook; the component adds cursor, selection, modals and sequence playback (Space plays the *edited* timeline from the cursor, honouring deletions and speed markers). It is controlled and persistence-agnostic: seed it with \`transcript\` (+ \`initialEditedWords\`, \`initialUndoStack\`, \`initialSpeedMarkers\`, \`initialDefaultSpeed\`) and persist what comes out of \`onEditorStateChange(editedWords, undoStack)\`, \`onSpeedStateChange\`, \`onHasEditsChange\`, \`onCursorTimestampChange\`. Hosts that version the document can chain their own history through \`onUndoBeyond\` / \`canUndoBeyond\` / \`onRedo\` / \`canRedo\` so there is one Undo button. Timestamps are **milliseconds**. The dialogs are exported for advanced hosts: \`FillerWordsModal\`, \`WordEditorModal\`, \`SilenceSettingsModal\`, \`SpeedMarkerMenu\`.

### Use it when

- You have a **word-timestamped** \`Transcript\` (\`words[].startMs/endMs\`) and the user's job is to tighten the recording — remove "um"s, cut a tangent, fix a misheard word — for export or re-cut.
- Edits must survive reloads and be auditable: the host stores the \`EditableWord[]\` list and undo stack, not a rendered file.

### Don't use it when

- The transcript is **read-only** and only needs click-to-seek and follow-along highlight — \`TranscriptView\`.
- You only need playback — \`MediaPlayer\` or \`AudioPlayer\`.
- You have segment-level timestamps only (no per-word times): the token model needs word times; render with \`TranscriptView\` in segment mode instead.
- You want to *produce* the transcript — see the **MediaEditor Live Demo**, which transcribes in the browser and then opens this editor.

### Example

\`\`\`tsx
const [edits, setEdits] = useState(() => loadEdits(clipId));
const playerRef = useRef<MediaPlayerRef>(null);

<div className="h-[70vh]">
  <MediaEditor
    src={clip.url}
    transcript={clip.transcript}
    initialEditedWords={edits?.editedWords}
    initialUndoStack={edits?.undoStack}
    initialSpeedMarkers={edits?.speedMarkers}
    initialDefaultSpeed={edits?.defaultSpeed}
    onEditorStateChange={(editedWords, undoStack) =>
      setEdits((e) => ({ ...e, editedWords, undoStack }))
    }
    onSpeedStateChange={(speedMarkers, defaultSpeed) =>
      setEdits((e) => ({ ...e, speedMarkers, defaultSpeed }))
    }
    onHasEditsChange={setDirty}
    playerRef={playerRef}
  />
</div>
\`\`\`

Give it a **fixed-height** parent: the transcript scrolls inside its own box only when the editor has bounded height; otherwise the page grows.

### Limitations

- Accessibility: the transcript is a \`role="listbox"\` (\`aria-label="Transcript words"\`) with \`aria-activedescendant\` pointing at \`role="option"\` spans, so a screen reader hears the cursor word but not the selection range. Keyboard: Arrow keys (+Shift to extend), Home/End, Backspace/Delete toggle delete, ⌘/Ctrl+X/C/V, ⌘/Ctrl+Z and ⇧⌘Z / Ctrl+Y, Enter opens the word editor, Space plays from the cursor. **Speed markers are right-click only** (\`onContextMenu\`) and the range-select gestures (double-click anchor, drag, 500 ms long-press) have no keyboard equivalent. Toolbar buttons carry \`aria-label\`/\`title\`; nothing is announced via \`aria-live\` when words are deleted or pasted.
- Clipboard: copy puts plain text on the system clipboard (\`clipboardData.setData\`), but **paste reads only the internal clipboard** — you cannot paste words from another editor instance or app.
- The shortcut hints are rendered as Mac glyphs (\`⌘Z\`, \`⇧⌘Z\`, \`⌫\`) on every platform; all toolbar copy ("Speed:", "Edited", "silences", "Remove filler words", modal text) is hard-coded English. Filler defaults (\`DEFAULT_FILLER_WORDS\`) and silence thresholds (400 ms / 1500 ms) are English/heuristic.
- Undo is a single word-level stack; there is no redo of host-level changes unless you wire \`onRedo\`. Word text edits live only in \`EditableWord\` — the audio itself is never modified; export/re-cut is the host's job (\`PlaybackSegment\` describes the edited timeline).
- Responsive/RTL: below \`md\` the media area is capped at \`55dvh\` and the split becomes a column; the vertical split uses physical \`md:border-r\`, cursor bars use \`-left-px\` / \`right-0.5\`, and the deleted-word rule is \`border-l\`.
- Theming: semantic tokens (\`bg-card\`, \`border-border\`, \`bg-muted\`, \`text-destructive\`, \`warning\`) plus \`primary-500\` highlights. Depends on \`MediaPlayer\`, \`Button\`, \`Select\`, \`useTranscriptEdits\`, \`class-variance-authority\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'contains',
          target: 'media-mediaplayer',
          why: 'The media surface at the top of the editor is a MediaPlayer driven through its millisecond ref.',
        },
        {
          type: 'alternative to',
          target: 'media-transcriptview',
          why: 'MediaEditor when the user edits words (delete, cut, speed markers); TranscriptView when the transcript is read-only click-to-seek.',
        },
      ],
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
const WithEditTrackingDemo = (
  args: React.ComponentProps<typeof MediaEditor>
) => {
  const [edits, setEdits] = React.useState<EditableWord[] | null>(null);
  const activeCount = edits?.filter(
    (w) => !w.deleted && (w.word.wordType ?? 'word') === 'word'
  ).length;

  return (
    <Frame>
      <div className="flex h-full flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          {edits === null
            ? 'Delete or edit a word to see the edited timeline update.'
            : `Active spoken words: ${activeCount} of ${args.transcript.words.length}`}
        </p>
        <div className="min-h-0 flex-1">
          <MediaEditor
            {...args}
            onEditorStateChange={(next) => setEdits(next)}
          />
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
