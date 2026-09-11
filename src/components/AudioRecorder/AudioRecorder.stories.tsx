import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AudioRecorder } from './AudioRecorder';

const meta: Meta<typeof AudioRecorder> = {
  id: 'media-audiorecorder',
  title: 'Modules/Media/AudioRecorder',
  component: AudioRecorder,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**A complete record → review → keep/discard panel for a single audio take.** \`AudioRecorder\` asks for the microphone (\`navigator.mediaDevices.getUserMedia({ audio: true })\`), records with \`MediaRecorder\` (\`mimeType\` default \`audio/webm\`, falling back to the browser default when unsupported), shows a live frequency visualiser from an \`AnalyserNode\` while recording, then loads the finished \`Blob\` into a **wavesurfer.js** waveform for playback, seek and delete. States: \`idle\` → \`recording\` ⇄ \`paused\` → \`stopped\` ⇄ \`playback\` (\`listening\` is reserved). \`onRecordingComplete(blob, duration)\` is the hand-off; \`onRecordingStart\`, \`onStateChange\`, \`onError\` report progress; \`maxDuration\` (seconds, \`0\` = unlimited) auto-stops; \`audioUrl\` opens the panel in playback mode on an existing file. \`renderControls\` replaces the default buttons with your own, fed by \`AudioRecorderControlsRenderProps\` (\`onRecord\`, \`onPause\`, \`onResume\`, \`onStop\`, \`onPlay\`, \`onSeek\`, \`formatTime\`, flags). \`state\` can be controlled. Also exported: \`audioRecorderVariants\`, \`waveformContainerVariants\`, \`controlButtonVariants\`, \`formatTime\`.

### Use it when

- The user records a **deliberate take** they will want to listen back to before submitting — a voicemail, a dictated note, a pronunciation sample — and the recorder can own a card-sized area (\`size\`, \`variant\` \`default\` | \`minimal\` | \`elevated\`).
- You need pause/resume and a maximum length.

### Don't use it when

- You need a **single mic button** in a toolbar or chat composer that fires-and-forgets a blob (e.g. to a transcription service) — \`RecordButton\`.
- You are only **playing** audio — \`AudioPlayer\`.
- You want an on-device, speaker-labelled visit transcript rather than a raw blob — \`VisitScribe\` (Voice).
- The app cannot ship \`wavesurfer.js\`: playback of the take depends on it (see Limitations).

### Example

\`\`\`tsx
const [take, setTake] = useState<{ blob: Blob; url: string } | null>(null);
const [status, setStatus] = useState<AudioRecorderState>('idle');

<AudioRecorder
  maxDuration={120}
  onStateChange={setStatus}
  onRecordingComplete={(blob) =>
    setTake({ blob, url: URL.createObjectURL(blob) })
  }
  onError={(err) =>
    toast.error(err.name === 'NotAllowedError' ? t('mic.denied') : err.message)
  }
/>
<Button disabled={!take || status === 'recording'} onClick={() => upload(take!.blob)}>
  Save voice note
</Button>
\`\`\`

The host keeps the blob; the recorder keeps the UI state. Revoke the object URL when you are done with it.

### Limitations

- Browser APIs: requires a secure context and a microphone permission prompt; a denied prompt surfaces only through \`onError\` (state returns to \`idle\`) — there is no built-in message. \`MediaRecorder\` output formats differ by browser (Chrome/Firefox \`audio/webm\`, Safari \`audio/mp4\`), and when the requested \`mimeType\` is unsupported the recorder falls back **but still labels the Blob with the requested type**.
- \`onRecordingComplete\`'s \`duration\` is read from a closure captured when recording *started*, so as implemented it does not reflect the take's real length — measure from the blob or the \`onStateChange\` timer yourself.
- Playback of the take is **WaveSurfer-only**: with \`showWaveform={false}\` the Play button does nothing, and \`wavesurfer.js\` (optional peer) is dynamically imported on mount whenever the waveform is shown.
- Accessibility: root is \`role="group"\` with \`aria-label\` (default "Audio recorder"); control buttons carry English \`aria-label\`s ("Start recording", "Pause recording", "Stop recording", "Play recording", "Delete recording"). The "Recording"/"Paused" indicator, the elapsed time and the \`<canvas>\` visualiser are **not** announced (\`aria-live\` absent, canvas has no \`aria-hidden\`). Keyboard reaches the buttons but there is no keyboard seek on the waveform.
- i18n: indicator text, button labels and \`m:ss\` formatting are hard-coded English/Latin digits. Controlled \`state\` only mirrors the visual state — the internal \`MediaRecorder\` still runs its own lifecycle.
- Theming: \`bg-card\`/\`border-border\` container, but \`primary-800/900\`, \`neutral-*\`, \`red-600\`, \`yellow-500\` and \`text-white\` are hard-coded; waveform colours read \`--color-primary-400/600/800\` with hex fallbacks. RTL: symmetric flex, no physical offsets. Depends on \`class-variance-authority\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      peers: ['wavesurfer.js'],
      relationships: [
        {
          type: 'alternative to',
          target: 'media-recordbutton',
          why: 'AudioRecorder is a full record/pause/review panel with waveform playback; RecordButton is one toolbar button that hands off a Blob.',
        },
        {
          type: 'alternative to',
          target: 'voice-visit-scribe',
          why: 'AudioRecorder captures a raw Blob for the host; VisitScribe records the room and produces an on-device speaker-labelled transcript.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
                ? 'bg-primary-800 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Idle
          </button>
          <button
            onClick={() => setState('recording')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'recording'
                ? 'bg-primary-800 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Recording
          </button>
          <button
            onClick={() => setState('paused')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'paused'
                ? 'bg-primary-800 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            Paused
          </button>
          <button
            onClick={() => setState('stopped')}
            className={`rounded px-3 py-1 text-sm ${
              state === 'stopped'
                ? 'bg-primary-800 text-white'
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
        <p className="text-muted-foreground text-sm">
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
              className="bg-primary-800 hover:bg-primary-900 rounded-lg px-4 py-2 text-white transition-colors"
            >
              ▶️ Play Recording
            </button>
          )}
          {isPlaying && (
            <button
              onClick={onPause}
              className="bg-primary-800 hover:bg-primary-900 rounded-lg px-4 py-2 text-white transition-colors"
            >
              ⏸️ Pause Playback
            </button>
          )}
        </div>
        <div className="text-muted-foreground text-center text-sm">
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
        <button className="bg-primary-800 hover:bg-primary-900 rounded-lg px-3 py-1.5 text-sm text-white transition-colors">
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
// Size Comparison
// ============================================================================

export const AllSizeComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Small</p>
        <AudioRecorder size="sm" waveformHeight={50} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Medium</p>
        <AudioRecorder size="md" waveformHeight={80} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Large</p>
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
