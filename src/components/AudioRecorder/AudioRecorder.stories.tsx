import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AudioRecorder } from './AudioRecorder';

const meta: Meta<typeof AudioRecorder> = {
  title: 'Components/AudioRecorder',
  component: AudioRecorder,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
An audio recorder component with waveform visualization using WaveSurfer.js.

## Features
- **Recording states**: idle, listening, recording, paused, stopped, playback
- **Live visualization**: Real-time audio frequency visualization during recording
- **Waveform display**: WaveSurfer.js integration for playback visualization
- **Theme-aware**: Uses CSS variables for colors, adapts to light/dark mode
- **Accessible**: Full ARIA support and keyboard navigation
- **Customizable**: Custom controls via render props, adjustable sizes and variants

## Installation

Requires \`wavesurfer.js\` as a peer dependency:

\`\`\`bash
npm install wavesurfer.js
\`\`\`

## Usage

\`\`\`tsx
import { AudioRecorder } from '@mieweb/ui';

function VoiceMessage() {
  const handleComplete = (blob: Blob, duration: number) => {
    // Upload or process the recording
    console.log('Recording:', blob, 'Duration:', duration);
  };

  return (
    <AudioRecorder
      maxDuration={60}
      onRecordingComplete={handleComplete}
    />
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: [
        'idle',
        'listening',
        'recording',
        'paused',
        'stopped',
        'playback',
      ],
      description: 'Current state of the recorder',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'elevated'],
      description: 'Visual variant',
    },
    maxDuration: {
      control: { type: 'number', min: 0, max: 300 },
      description: 'Maximum recording duration in seconds (0 for unlimited)',
    },
    waveformHeight: {
      control: { type: 'number', min: 40, max: 200 },
      description: 'Height of the waveform display',
    },
    showTime: {
      control: 'boolean',
      description: 'Show time display',
    },
    showWaveform: {
      control: 'boolean',
      description: 'Show waveform visualization',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the component',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AudioRecorder>;

// ============================================================================
// Basic Examples
// ============================================================================

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default audio recorder in idle state, ready to start recording.',
      },
    },
  },
};

export const WithMaxDuration: Story = {
  args: {
    maxDuration: 30,
    showTime: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Recorder with a 30-second maximum duration limit.',
      },
    },
  },
};

// ============================================================================
// Size Variants
// ============================================================================

export const Small: Story = {
  args: {
    size: 'sm',
    waveformHeight: 60,
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    waveformHeight: 80,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    waveformHeight: 100,
  },
};

// ============================================================================
// Visual Variants
// ============================================================================

export const DefaultVariant: Story = {
  args: {
    variant: 'default',
  },
};

export const MinimalVariant: Story = {
  args: {
    variant: 'minimal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal variant without border or background.',
      },
    },
  },
};

export const ElevatedVariant: Story = {
  args: {
    variant: 'elevated',
  },
  parameters: {
    docs: {
      description: {
        story: 'Elevated variant with shadow for a floating appearance.',
      },
    },
  },
};

// ============================================================================
// Custom Styling
// ============================================================================

export const CustomColors: Story = {
  args: {
    waveColor: '#10b981',
    progressColor: '#059669',
    cursorColor: '#047857',
  },
  parameters: {
    docs: {
      description: {
        story: 'Recorder with custom waveform colors (green theme).',
      },
    },
  },
};

export const TallWaveform: Story = {
  args: {
    waveformHeight: 150,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Recorder with a taller waveform display.',
      },
    },
  },
};

// ============================================================================
// Configuration Examples
// ============================================================================

export const NoTimeDisplay: Story = {
  args: {
    showTime: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Recorder without the time display.',
      },
    },
  },
};

export const NoWaveform: Story = {
  args: {
    showWaveform: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Recorder without waveform visualization - just controls.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled recorder that cannot be interacted with.',
      },
    },
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

export const WithCallbacks: Story = {
  args: {
    maxDuration: 60,
    onStateChange: (state) => console.log('State changed:', state),
    onRecordingStart: () => console.log('Recording started'),
    onRecordingComplete: (blob, duration) =>
      console.log('Recording complete:', { blob, duration }),
    onError: (error) => console.error('Error:', error),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Recorder with all callbacks configured. Check the console for events.',
      },
    },
  },
};

export const ControlledState: Story = {
  render: function ControlledStateStory() {
    const [state, setState] = React.useState<
      'idle' | 'listening' | 'recording' | 'paused' | 'stopped' | 'playback'
    >('idle');

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setState('idle')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'idle'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Idle
          </button>
          <button
            onClick={() => setState('recording')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'recording'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Recording
          </button>
          <button
            onClick={() => setState('paused')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'paused'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Paused
          </button>
          <button
            onClick={() => setState('stopped')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'stopped'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Stopped
          </button>
        </div>
        <AudioRecorder
          state={state}
          onStateChange={setState}
          maxDuration={30}
        />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Current state: <code className="font-mono">{state}</code>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with externally controlled state.',
      },
    },
  },
};

// ============================================================================
// Custom Controls
// ============================================================================

export const CustomControls: Story = {
  args: {
    renderControls: ({
      state,
      isRecording,
      isPaused,
      isPlaying,
      onRecord,
      onPause,
      onResume,
      onStop,
      onPlay,
      formatTime,
      currentTime,
      duration,
    }) => (
      <div className="flex flex-col gap-3">
        <div className="flex justify-center gap-2">
          {state === 'idle' && (
            <button
              onClick={onRecord}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              🎙️ Start Recording
            </button>
          )}
          {isRecording && (
            <>
              <button
                onClick={onPause}
                className="rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
              >
                ⏸️ Pause
              </button>
              <button
                onClick={onStop}
                className="rounded-lg bg-neutral-600 px-4 py-2 text-white transition-colors hover:bg-neutral-700"
              >
                ⏹️ Stop
              </button>
            </>
          )}
          {isPaused && (
            <>
              <button
                onClick={onResume}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                ▶️ Resume
              </button>
              <button
                onClick={onStop}
                className="rounded-lg bg-neutral-600 px-4 py-2 text-white transition-colors hover:bg-neutral-700"
              >
                ⏹️ Stop
              </button>
            </>
          )}
          {state === 'stopped' && (
            <button
              onClick={onPlay}
              className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-white transition-colors"
            >
              ▶️ Play Recording
            </button>
          )}
          {isPlaying && (
            <button
              onClick={onPause}
              className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-white transition-colors"
            >
              ⏸️ Pause Playback
            </button>
          )}
        </div>
        <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with completely custom controls using the render props pattern.',
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const VoiceMessage: Story = {
  render: function VoiceMessageStory() {
    const [recordings, setRecordings] = React.useState<
      Array<{ id: string; blob: Blob; duration: number }>
    >([]);

    const handleComplete = (blob: Blob, duration: number) => {
      setRecordings((prev) => [
        ...prev,
        { id: Date.now().toString(), blob, duration },
      ]);
    };

    return (
      <div className="space-y-4">
        <AudioRecorder
          maxDuration={120}
          variant="elevated"
          onRecordingComplete={handleComplete}
        />
        {recordings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Recordings ({recordings.length})
            </h3>
            <ul className="space-y-1">
              {recordings.map((rec) => (
                <li
                  key={rec.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-100 p-2 text-sm dark:bg-neutral-800"
                >
                  <span>
                    Recording #{recordings.indexOf(rec) + 1} -{' '}
                    {Math.round(rec.duration)}s
                  </span>
                  <span className="text-neutral-500">
                    {(rec.blob.size / 1024).toFixed(1)} KB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A voice message recorder that collects multiple recordings.',
      },
    },
  },
};

export const InlineRecorder: Story = {
  render: function InlineRecorderStory() {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        <div className="flex-1">
          <AudioRecorder
            variant="minimal"
            size="sm"
            waveformHeight={40}
            showTime={false}
          />
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 rounded-lg px-3 py-1.5 text-sm text-white transition-colors">
          Send
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact inline recorder for chat or messaging interfaces.',
      },
    },
  },
};

// ============================================================================
// Theme Examples
// ============================================================================

export const DarkModePreview: Story = {
  render: () => (
    <div className="dark rounded-xl bg-neutral-900 p-6">
      <AudioRecorder variant="elevated" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preview of the recorder in dark mode.',
      },
    },
  },
};

export const AllSizeComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
          Small
        </p>
        <AudioRecorder size="sm" waveformHeight={50} />
      </div>
      <div>
        <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
          Medium
        </p>
        <AudioRecorder size="md" waveformHeight={80} />
      </div>
      <div>
        <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
          Large
        </p>
        <AudioRecorder size="lg" waveformHeight={100} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all size variants.',
      },
    },
  },
};
