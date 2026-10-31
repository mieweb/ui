import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaPlayer, type MediaPlayerRef } from './MediaPlayer';
import { getSampleAudio } from '../AudioPlayer/sampleAudio';
import {
  getSampleVideo,
  type SampleVideoShape,
} from '../AudioPlayer/sampleVideo';
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

**A \`<video>\` / \`<audio>\` surface with a millisecond imperative handle.** \`MediaPlayer\` renders the browser's own element (\`controls\` default \`true\`). For video, \`controlsStyle="overlay"\` swaps the browser's controls for \`MediaControls\`: touch-first controls over the picture (tap to play or pause, a seek bar, playback speed, captions when the video has a track, mute, picture in picture and full screen), the same on every browser and in a mobile app's web view. It infers the \`kind\` from the \`src\` extension (\`mp4|mov|avi|webm|mkv|m4v\` → video, else audio; force it with \`kind\`) and wires transport through the shared \`useMediaTransport\` hook. \`MediaPlayerRef\` exposes \`seekToMs\`, \`play\`, \`pause\`, \`getCurrentTimeMs\`, \`getDurationMs\`, \`isPaused\`, \`setPlaybackRate\` and the raw \`mediaElement\`; \`onTimeUpdate(currentTimeMs, durationMs)\`, \`onStateChange\`, \`onEnded\`, \`onError\` report back. A failed load swaps in a \`role="alert"\` panel with a **Retry** button and clears when \`src\` changes. \`variant\` is \`plain\` or \`card\`. Also exported: \`inferMediaKind\`, \`mediaPlayerVariants\`.

### Use it when

- The media may be **video** or audio and you want the browser's controls, fullscreen and keyboard handling for free.
- A video needs controls that look and work the same everywhere, sized for touch: \`controlsStyle="overlay"\`.
- Something else must **follow or drive** playback in milliseconds — a \`TranscriptView\` (\`currentTimeMs\` ← \`onTimeUpdate\`, \`onSeek\` → \`seekToMs\`), a marker list, a thumbnail capture from \`mediaElement\`.
- You are building a larger surface (\`MediaEditor\` embeds it) and want one transport API for both kinds.

### Don't use it when

- You want a **small, styled** audio control with a waveform or inline play button — \`AudioPlayer\`.
- The user edits the words of the recording — \`MediaEditor\`, which already contains a \`MediaPlayer\`.
- You are recording, not playing — \`AudioRecorder\` / \`RecordButton\`.
- Viewers need a volume level, more speeds than the host offers, or a choice between several caption languages: keep \`controlsStyle="native"\`. The overlay has play, seek, speed, captions on/off (the first track), mute, picture in picture and full screen.

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

- Accessibility: with native \`controls\` the browser supplies labelled, keyboard-operable controls; the component adds the \`aria-label\` you pass (no default). Overlay controls are labelled icon buttons and a \`Slider\` whose \`aria-valuetext\` reads the time; the tap-to-play surface is a pointer convenience (\`aria-hidden\`), and the bar's Play is the keyboard path. Override their English labels, including the \`time\` and \`rate\` formatters, through \`labels\`. The speed button cycles \`playbackRates\` (default 1×, 1.5×, 2×); the captions toggle shows the first caption or subtitle track, and is a toggle button (\`aria-pressed\`). \`controls={false}\` leaves **no visible or keyboard control** — supply controls through the ref, as \`MediaFeed\` does. The error panel is \`role="alert"\`; override its English defaults with \`labels={{ error, retry }}\`.
- Caption tracks belong to the host’s media resource. Supply \`<track>\` elements through \`children\`; the component does not generate subtitles.
- \`kind\` inference is by extension only — signed URLs without an extension fall back to audio; pass \`kind="video"\` explicitly. The transport reports \`durationMs\` as \`0\` until metadata is known or when it is non-finite (live streams).
- Layout: \`<video>\` is \`object-contain\` inside a full-height flex box; \`<audio>\` is \`w-[90%] max-w-lg\` with \`my-4\`. The native container is symmetric, so RTL is unaffected; the browser's control bar follows the platform. The overlay bar stays left to right in RTL, as media timelines do (Play on the left, the seek fill growing to the right); its labels are still translated. Overlay controls fill the player's box: give it a height. A narrow player (under 28rem) puts the seek bar on its own row. Picture in picture and full screen show only where the browser supports them; on an iPhone, full screen opens the system player. Audio always uses the browser's controls. Captions left on the default line are lifted above the bar; cues the host positions keep their place.
- Overlay controls are a dark surface in every theme (\`data-theme="dark"\` on the box), so the controls read over any frame. The narrow-player layout uses a container query, which needs Tailwind 4 or the prebuilt \`styles.css\`.
- Theming: \`card\` uses \`border-border bg-card\`; the error surface uses \`destructive\` tokens. Overlay controls use black scrims (\`bg-black/*\`) and white text over the picture, as \`VideoCard\` does, since they must read over any frame. Depends on \`Button\`, \`Slider\`, \`useMediaTransport\`, \`lucide-react\`, \`class-variance-authority\`, and \`AudioPlayer\`'s time formatter. Entry \`@mieweb/ui\`.

\`MediaControls\` can also be used on its own, over a host's own \`<video>\`:

\`\`\`tsx
const transport = useMediaTransport();
<div className="relative aspect-video" data-theme="dark">
  <video ref={transport.setMediaElement} src={src} className="h-full w-full" />
  <MediaControls transport={transport} />
</div>
\`\`\``,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'media-mediafeed',
          why: 'MediaFeed coordinates one active native player across a scrollable collection and immersive viewer; MediaPlayer remains the surface for a single clip.',
        },
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
    controls: { control: 'boolean', description: 'Show controls' },
    controlsStyle: {
      control: 'inline-radio',
      options: ['native', 'overlay'],
      description:
        "A video's controls: the browser's own (`native`, default) or touch-first controls over the picture (`overlay`). Audio always uses the browser's.",
      table: { defaultValue: { summary: 'native' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MediaPlayer>;

/** Resolves the async synthetic video sample before rendering. */
function VideoSample({
  shape = 'landscape',
  ...props
}: Omit<React.ComponentProps<typeof MediaPlayer>, 'src'> & {
  shape?: SampleVideoShape;
}) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    void getSampleVideo(shape).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [shape]);
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

/** Touch-first controls over the picture, in place of the browser's. */
export const OverlayControls: Story = {
  name: 'Overlay controls',
  args: { controlsStyle: 'overlay' },
  render: (args) => (
    <div className="aspect-video w-[28rem]">
      <VideoSample {...args} kind="video" aria-label="Sample recording" />
    </div>
  ),
};

const sampleCaptions = `WEBVTT

00:00.000 --> 00:01.500
A caption from the host's own track.

00:01.500 --> 00:03.000
It shows when the captions button is on.
`;

/** A video with a captions track: the bar gains a captions toggle. */
function CaptionedSample(
  props: Omit<React.ComponentProps<typeof MediaPlayer>, 'src'>
) {
  const [track, setTrack] = React.useState<string>();
  React.useEffect(() => {
    const url = URL.createObjectURL(
      new Blob([sampleCaptions], { type: 'text/vtt' })
    );
    setTrack(url);
    return () => URL.revokeObjectURL(url);
  }, []);
  if (!track) return null;
  return (
    <VideoSample {...props}>
      <track kind="captions" srcLang="en" label="English" src={track} />
    </VideoSample>
  );
}

export const OverlayControlsRTL: Story = {
  name: 'Overlay controls, RTL',
  args: {
    controlsStyle: 'overlay',
    labels: {
      play: 'تشغيل',
      pause: 'إيقاف مؤقت',
      mute: 'كتم الصوت',
      unmute: 'إلغاء كتم الصوت',
      seek: 'موضع التشغيل',
      fullscreen: 'ملء الشاشة',
      exitFullscreen: 'الخروج من ملء الشاشة',
      pictureInPicture: 'صورة داخل صورة',
      exitPictureInPicture: 'الخروج من صورة داخل صورة',
      time: (current, duration) => `${current} من ${duration}`,
      speed: (rate) => `سرعة التشغيل ${rate}`,
    },
  },
  globals: { direction: 'rtl' },
  parameters: {
    docs: {
      description: {
        story:
          'Translated labels in a right-to-left page. The bar stays left to right on purpose: a media timeline follows the media, not the reading direction, as the browser’s own controls do. The time label keeps its own direction.',
      },
    },
  },
  render: (args) => (
    <div dir="rtl" className="aspect-video w-[28rem]">
      <VideoSample {...args} kind="video" aria-label="تسجيل نموذجي" />
    </div>
  ),
};

export const OverlayControlsWithCaptions: Story = {
  name: 'Overlay controls, with captions',
  args: { controlsStyle: 'overlay' },
  parameters: {
    docs: {
      description: {
        story:
          'The video has a captions track, so the bar shows a captions toggle; the speed button cycles 1×, 1.5× and 2×.',
      },
    },
  },
  render: (args) => (
    <div className="aspect-video w-[28rem]">
      <CaptionedSample {...args} kind="video" aria-label="Sample recording" />
    </div>
  ),
};

/** On a phone held upright, an upright clip fills the screen; the narrow
 * player gives the seek bar a row of its own. */
export const OverlayControlsPhonePortrait: Story = {
  name: 'Overlay controls, phone portrait',
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { layout: 'fullscreen' },
  args: { controlsStyle: 'overlay' },
  render: (args) => (
    <div className="h-dvh w-full">
      <VideoSample
        {...args}
        shape="portrait"
        kind="video"
        aria-label="Sample recording"
      />
    </div>
  ),
};

/** The same phone turned sideways, with a wide clip. */
export const OverlayControlsPhoneLandscape: Story = {
  name: 'Overlay controls, phone landscape',
  globals: { viewport: { value: 'mobile2', isRotated: true } },
  parameters: { layout: 'fullscreen' },
  args: { controlsStyle: 'overlay' },
  render: (args) => (
    <div className="h-dvh w-full">
      <VideoSample {...args} kind="video" aria-label="Sample recording" />
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
