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
  title: 'Components/Images & Media/MediaPlayer',
  component: MediaPlayer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A native audio/video playback surface with a shared imperative ' +
          'handle (`MediaPlayerRef`, times in milliseconds), themed error/retry ' +
          'handling, and transport driven by the `useMediaTransport` hook.',
      },
    },
  },
  tags: ['autodocs'],
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
