import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from './AudioPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Text } from '../Text';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';

// ============================================================================
// Audio Sample Generation
// ============================================================================

/**
 * Creates a synthetic audio blob URL using Web Audio API.
 * This generates a short tone that works locally without CORS issues.
 */
function createSampleAudioUrl(durationSec = 5, frequency = 440): string {
  // Create audio context
  const audioContext = new (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  )();
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSec);

  // Create stereo buffer
  const buffer = audioContext.createBuffer(2, numSamples, sampleRate);

  // Generate a pleasant tone with envelope
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Apply envelope (fade in/out)
      const envelope =
        Math.min(t * 4, 1) * Math.min((durationSec - t) * 4, 1) * 0.3;
      // Generate tone with harmonics
      const fundamental = Math.sin(2 * Math.PI * frequency * t);
      const harmonic1 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.5;
      const harmonic2 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.25;
      data[i] = envelope * (fundamental + harmonic1 + harmonic2);
    }
  }

  // Convert to WAV format
  const wavBuffer = audioBufferToWav(buffer);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Converts an AudioBuffer to WAV format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function audioBufferToWav(buffer: any): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved audio data
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return arrayBuffer;
}

// Create sample audio URLs (memoized to avoid regenerating)
let _sampleAudioUrl: string | null = null;
let _shortAudioUrl: string | null = null;
let _longAudioUrl: string | null = null;

function getSampleAudio(): string {
  if (!_sampleAudioUrl) {
    _sampleAudioUrl = createSampleAudioUrl(10, 440); // 10 seconds, A4 note
  }
  return _sampleAudioUrl;
}

function getShortAudio(): string {
  if (!_shortAudioUrl) {
    _shortAudioUrl = createSampleAudioUrl(3, 523.25); // 3 seconds, C5 note
  }
  return _shortAudioUrl;
}

function getLongAudio(): string {
  if (!_longAudioUrl) {
    _longAudioUrl = createSampleAudioUrl(30, 329.63); // 30 seconds, E4 note
  }
  return _longAudioUrl;
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AudioPlayer> = {
  title: 'Components/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile audio player component with multiple variants, playback controls, and customizable appearance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: false, // Can't easily control blob URLs
      description: 'Audio source URL',
    },
    variant: {
      control: 'select',
      options: ['inline', 'compact', 'waveform'],
      description: 'Visual variant of the player',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the player',
    },
    title: {
      control: 'text',
      description:
        'Title/label for the audio (used for accessibility and display)',
    },
    showTime: {
      control: 'boolean',
      description: 'Show time display (compact and waveform variants)',
    },
    showDuration: {
      control: 'boolean',
      description: 'Show duration (inline variant)',
    },
    showPlaybackRate: {
      control: 'boolean',
      description: 'Show playback speed control',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the player',
    },
    waveColor: {
      control: 'color',
      description: 'Waveform color (for waveform variant)',
      if: { arg: 'variant', eq: 'waveform' },
    },
    progressColor: {
      control: 'color',
      description: 'Progress/played waveform color (for waveform variant)',
      if: { arg: 'variant', eq: 'waveform' },
    },
    waveformHeight: {
      control: { type: 'range', min: 40, max: 200, step: 10 },
      description: 'Height of the waveform (for waveform variant)',
      if: { arg: 'variant', eq: 'waveform' },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    variant: 'compact',
    size: 'md',
    showTime: true,
    showDuration: true,
    showPlaybackRate: false,
    disabled: false,
    title: '',
    waveformHeight: 64,
  },
};

export default meta;
type Story = StoryObj<typeof AudioPlayer>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  render: (args) => <AudioPlayer {...args} src={getSampleAudio()} />,
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Inline: Story = {
  render: () => (
    <AudioPlayer src={getShortAudio()} variant="inline" showDuration />
  ),
};

export const InlineWithTitle: Story = {
  render: () => (
    <AudioPlayer
      src={getSampleAudio()}
      variant="inline"
      title="Voice Message"
      showDuration
    />
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="w-80">
      <AudioPlayer src={getSampleAudio()} variant="compact" showTime />
    </div>
  ),
};

export const CompactWithPlaybackRate: Story = {
  render: () => (
    <div className="w-96">
      <AudioPlayer
        src={getSampleAudio()}
        variant="compact"
        showTime
        showPlaybackRate
      />
    </div>
  ),
};

export const Waveform: Story = {
  render: () => (
    <div className="w-96">
      <AudioPlayer src={getSampleAudio()} variant="waveform" showTime />
    </div>
  ),
};

export const WaveformWithTitle: Story = {
  render: () => (
    <div className="w-[500px]">
      <AudioPlayer
        src={getLongAudio()}
        variant="waveform"
        title="Meeting Recording - January 2026"
        showTime
        showPlaybackRate
      />
    </div>
  ),
};

// ============================================================================
// Size Variants
// ============================================================================

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Text weight="medium">Small</Text>
        <div className="w-64">
          <AudioPlayer
            src={getSampleAudio()}
            variant="compact"
            size="sm"
            showTime
          />
        </div>
      </div>
      <div className="space-y-2">
        <Text weight="medium">Medium (default)</Text>
        <div className="w-72">
          <AudioPlayer
            src={getSampleAudio()}
            variant="compact"
            size="md"
            showTime
          />
        </div>
      </div>
      <div className="space-y-2">
        <Text weight="medium">Large</Text>
        <div className="w-80">
          <AudioPlayer
            src={getSampleAudio()}
            variant="compact"
            size="lg"
            showTime
          />
        </div>
      </div>
    </div>
  ),
};

export const InlineSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Text size="sm" className="w-16">
          Small
        </Text>
        <AudioPlayer
          src={getShortAudio()}
          variant="inline"
          size="sm"
          title="Audio"
          showDuration
        />
      </div>
      <div className="flex items-center gap-4">
        <Text size="sm" className="w-16">
          Medium
        </Text>
        <AudioPlayer
          src={getShortAudio()}
          variant="inline"
          size="md"
          title="Audio"
          showDuration
        />
      </div>
      <div className="flex items-center gap-4">
        <Text size="sm" className="w-16">
          Large
        </Text>
        <AudioPlayer
          src={getShortAudio()}
          variant="inline"
          size="lg"
          title="Audio"
          showDuration
        />
      </div>
    </div>
  ),
};

// ============================================================================
// Custom Colors (Waveform)
// ============================================================================

export const CustomWaveformColors: Story = {
  render: () => (
    <div className="w-96">
      <AudioPlayer
        src={getSampleAudio()}
        variant="waveform"
        showTime
        waveColor="#e2e8f0"
        progressColor="#22c55e"
      />
    </div>
  ),
};

// ============================================================================
// Real-World Use Cases
// ============================================================================

export const VoiceNotesList: Story = {
  render: () => {
    const voiceNotes = [
      {
        id: '1',
        title: 'Meeting Notes',
        timestamp: '2 hours ago',
        duration: '1:45',
      },
      {
        id: '2',
        title: 'Quick Reminder',
        timestamp: 'Yesterday',
        duration: '0:32',
      },
      {
        id: '3',
        title: 'Project Ideas',
        timestamp: '2 days ago',
        duration: '3:15',
      },
    ];

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Voice Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {voiceNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <AudioPlayer src={getSampleAudio()} variant="inline" size="sm" />
              <div className="min-w-0 flex-1">
                <Text size="sm" weight="medium" truncate>
                  {note.title}
                </Text>
                <Text size="xs" variant="muted">
                  {note.timestamp} • {note.duration}
                </Text>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  },
};

export const ChatMessage: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      {/* Received message */}
      <div className="flex gap-2">
        <Avatar name="Jane Smith" size="sm" />
        <div className="space-y-1">
          <div className="rounded-2xl rounded-tl-sm bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
            <AudioPlayer
              src={getSampleAudio()}
              variant="compact"
              size="sm"
              showTime
            />
          </div>
          <Text size="xs" variant="muted">
            2:34 PM
          </Text>
        </div>
      </div>

      {/* Sent message */}
      <div className="flex flex-row-reverse gap-2">
        <Avatar name="You" size="sm" />
        <div className="space-y-1">
          <div className="bg-primary-600 rounded-2xl rounded-tr-sm px-3 py-2">
            <AudioPlayer
              src={getShortAudio()}
              variant="compact"
              size="sm"
              showTime
              className="[&_button]:bg-white/20 [&_button]:text-white [&_div]:bg-white/30 [&_div>div]:bg-white [&_span]:text-white/80"
            />
          </div>
          <Text size="xs" variant="muted" className="text-right">
            2:35 PM
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PodcastPlayer: Story = {
  render: () => (
    <Card className="w-[500px]">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="bg-primary-500 h-24 w-24 shrink-0 overflow-hidden rounded-lg">
            <div className="flex h-full items-center justify-center text-2xl text-white">
              🎙️
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="secondary" size="sm" className="mb-2">
              Episode 42
            </Badge>
            <Text weight="semibold" className="line-clamp-2">
              The Future of Voice Interfaces in Healthcare
            </Text>
            <Text size="sm" variant="muted" className="mt-1">
              Tech Health Podcast • 45 min
            </Text>
          </div>
        </div>
        <div className="mt-4">
          <AudioPlayer
            src={getLongAudio()}
            variant="waveform"
            showTime
            showPlaybackRate
            waveformHeight={48}
          />
        </div>
      </CardContent>
    </Card>
  ),
};

export const AudioAttachment: Story = {
  render: () => (
    <div className="w-72">
      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        <div className="mb-2 flex items-center gap-2">
          <div className="bg-primary-100 dark:bg-primary-900/30 flex h-8 w-8 items-center justify-center rounded">
            <svg
              className="text-primary-600 dark:text-primary-400 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <Text size="sm" weight="medium" truncate>
              voice-memo-2026-01-21.mp3
            </Text>
            <Text size="xs" variant="muted">
              1.2 MB
            </Text>
          </div>
        </div>
        <AudioPlayer
          src={getSampleAudio()}
          variant="compact"
          size="sm"
          showTime
        />
      </div>
    </div>
  ),
};

// ============================================================================
// States
// ============================================================================

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <AudioPlayer src={getSampleAudio()} variant="compact" showTime disabled />
    </div>
  ),
};

// ============================================================================
// All Variants Overview
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <Text as="h3" weight="semibold">
          Inline Variant
        </Text>
        <Text size="sm" variant="muted" className="mb-4">
          Minimal footprint - perfect for lists and inline contexts
        </Text>
        <div className="flex flex-wrap gap-4">
          <AudioPlayer src={getShortAudio()} variant="inline" showDuration />
          <AudioPlayer
            src={getShortAudio()}
            variant="inline"
            title="Voice Note"
            showDuration
          />
        </div>
      </div>

      <div className="space-y-2">
        <Text as="h3" weight="semibold">
          Compact Variant
        </Text>
        <Text size="sm" variant="muted" className="mb-4">
          Progress bar with time - great for messages and attachments
        </Text>
        <div className="w-80">
          <AudioPlayer src={getSampleAudio()} variant="compact" showTime />
        </div>
      </div>

      <div className="space-y-2">
        <Text as="h3" weight="semibold">
          Waveform Variant
        </Text>
        <Text size="sm" variant="muted" className="mb-4">
          Full waveform visualization - ideal for podcasts and detailed playback
        </Text>
        <div className="w-96">
          <AudioPlayer
            src={getSampleAudio()}
            variant="waveform"
            title="Audio Recording"
            showTime
            showPlaybackRate
          />
        </div>
      </div>
    </div>
  ),
};
