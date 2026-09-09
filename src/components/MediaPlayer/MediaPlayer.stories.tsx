import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaPlayer, type MediaPlayerRef } from './MediaPlayer';
import { getSampleAudio } from '../AudioPlayer/sampleAudio';
import { getSampleVideo } from '../AudioPlayer/sampleVideo';
import { Button } from '../Button';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof MediaPlayer> = {
  id: 'media-mediaplayer',
  title: 'Modules/Media/MediaPlayer',
  component: MediaPlayer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**A native \`<video>\` / \`<audio>\` surface with a millisecond imperative handle.** \`MediaPlayer\` renders the browser's own element (\`controls\` default \`true\`), infers the \`kind\` from the \`src\` extension (\`mp4|mov|avi|webm|mkv|m4v\` → video, else audio; force it with \`kind\`) and wires transport through the shared \`useMediaTransport\` hook. \`MediaPlayerRef\` exposes \`seekToMs\`, \`play\`, \`pause\`, \`getCurrentTimeMs\`, \`getDurationMs\`, \`isPaused\`, \`setPlaybackRate\` and the raw \`mediaElement\`; \`onTimeUpdate(currentTimeMs, durationMs)\`, \`onStateChange\`, \`onEnded\`, \`onError\` report back. A failed load swaps in a \`role="alert"\` panel with a **Retry** button and clears when \`src\` changes. \`variant\` is \`plain\` or \`card\`. Also exported: \`inferMediaKind\`, \`mediaPlayerVariants\`.

### Use it when

- The media may be **video** or audio and you want the browser's controls, fullscreen and keyboard handling for free.
- Something else must **follow or drive** playback in milliseconds — a \`TranscriptView\` (\`currentTimeMs\` ← \`onTimeUpdate\`, \`onSeek\` → \`seekToMs\`), a marker list, a thumbnail capture from \`mediaElement\`.
- You are building a larger surface (\`MediaEditor\` embeds it) and want one transport API for both kinds.

### Don't use it when

- You want a **small, styled** audio control with a waveform or inline play button — \`AudioPlayer\`.
- The user edits the words of the recording — \`MediaEditor\`, which already contains a \`MediaPlayer\`.
- You are recording, not playing — \`AudioRecorder\` / \`RecordButton\`.

### Example

\`\`\`tsx
const playerRef = useRef<MediaPlayerRef>(null);
const [positionMs, setPositionMs] = useState(0);

<div className="grid gap-4 md:grid-cols-2">
  <MediaPlayer
    ref={playerRef}
    src={visit.recordingUrl}
    aria-label={\`Recording of \${visit.title}\`}
    onTimeUpdate={(ms) => setPositionMs(ms)}
    onError={(err) => log.warn('media failed', err)}
  />
  <TranscriptView
    transcript={visit.transcript}
    currentTimeMs={positionMs}
    onSeek={(ms) => {
      playerRef.current?.seekToMs(ms);
      playerRef.current?.play();
    }}
  />
</div>
\`\`\`

The host owns the position as plain state; the player and the transcript never talk to each other directly.

### Limitations

- Accessibility: with native \`controls\` the browser supplies labelled, keyboard-operable controls; the component adds nothing but the \`aria-label\` you pass (no default). \`controls={false}\` leaves **no visible or keyboard control** — you must drive the ref yourself. The error panel is \`role="alert"\`, so it is announced, but its text ("Unable to load media. The server may be unavailable.") and the "Retry" label are hard-coded English.
- No caption slot: the component accepts no \`children\` and renders no \`<track>\`, so subtitles cannot be attached (the \`jsx-a11y/media-has-caption\` rule is suppressed inside).
- \`kind\` inference is by extension only — signed URLs without an extension fall back to audio; pass \`kind="video"\` explicitly. The transport reports \`durationMs\` as \`0\` until metadata is known or when it is non-finite (live streams).
- Layout: \`<video>\` is \`object-contain\` inside a full-height flex box; \`<audio>\` is \`w-[90%] max-w-lg\` with \`my-4\`. The container is symmetric, so RTL is unaffected; the browser's control bar follows the platform.
- Theming: \`card\` uses \`border-border bg-card\`; the error surface uses \`destructive\` tokens. Depends on \`Button\`, \`useMediaTransport\`, \`class-variance-authority\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'media-audioplayer',
          why: 'AudioPlayer is a styled audio-only player (seconds, optional waveform); MediaPlayer is the native audio/video surface with a millisecond ref for transcript sync.',
        },
        {
          type: 'composes with',
          target: 'media-transcriptview',
          why: 'MediaPlayer onTimeUpdate feeds TranscriptView currentTimeMs, and TranscriptView onSeek calls the ref seekToMs.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    src: { control: false, description: 'Media source URL' },
    kind: {
      control: 'select',
      options: [undefined, 'audio', 'video'],
      description: 'Force the media kind (otherwise inferred from the src)',
    },
    variant: {
      control: 'select',
      options: ['plain', 'card'],
      description: 'Container styling',
    },
    controls: { control: 'boolean', description: 'Show native controls' },
  },
};

export default meta;
type Story = StoryObj<typeof MediaPlayer>;

/** Resolves the async synthetic video sample before rendering. */
function VideoSample(
  props: Omit<React.ComponentProps<typeof MediaPlayer>, 'src'>
) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    void getSampleVideo().then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, []);
  if (!src)
    return (
      <p className="text-muted-foreground text-sm">Generating sample video…</p>
    );
  return <MediaPlayer {...props} src={src} />;
}

// ============================================================================
// Stories
// ============================================================================

export const Audio: Story = {
  render: (args) => (
    <div className="w-[28rem]">
      <MediaPlayer {...args} src={getSampleAudio()} kind="audio" />
    </div>
  ),
};

export const Video: Story = {
  render: (args) => (
    <div className="w-[28rem]">
      <VideoSample {...args} kind="video" />
    </div>
  ),
};

export const CardVariant: Story = {
  name: 'Card variant',
  render: (args) => (
    <div className="w-[28rem]">
      <MediaPlayer
        {...args}
        src={getSampleAudio()}
        kind="audio"
        variant="card"
      />
    </div>
  ),
};

export const ErrorState: Story = {
  name: 'Error + retry',
  render: (args) => (
    <div className="w-[28rem]">
      <MediaPlayer
        {...args}
        src="https://example.invalid/does-not-exist.mp3"
        kind="audio"
      />
    </div>
  ),
};

const ImperativeControlsDemo = () => {
  const ref = React.useRef<MediaPlayerRef>(null);
  return (
    <div className="flex w-[28rem] flex-col gap-3">
      <MediaPlayer ref={ref} src={getSampleAudio()} kind="audio" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => ref.current?.play()}>
          Play
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.pause()}
        >
          Pause
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.seekToMs(5000)}
        >
          Seek 5s
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.setPlaybackRate(1.5)}
        >
          1.5×
        </Button>
      </div>
    </div>
  );
};

export const ImperativeControls: Story = {
  name: 'Imperative ref (ms)',
  render: () => <ImperativeControlsDemo />,
};
