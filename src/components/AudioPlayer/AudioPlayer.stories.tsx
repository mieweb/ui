import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from './AudioPlayer';
import { getLongAudio, getSampleAudio, getShortAudio } from './sampleAudio';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Text } from '../Text';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AudioPlayer> = {
  title: 'Components/Images & Media/AudioPlayer',
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
          <div className="bg-primary-800 rounded-2xl rounded-tr-sm px-3 py-2">
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
        <div className="flex gap-4" data-slot="podcast-header">
          <div
            className="bg-primary-800 h-24 w-24 shrink-0 overflow-hidden rounded-lg"
            data-slot="podcast-cover"
          >
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
              className="text-primary-800 dark:text-primary-400 h-4 w-4"
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
