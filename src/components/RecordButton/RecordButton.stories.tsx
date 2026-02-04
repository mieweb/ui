import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  RecordButton,
  type RecordButtonState,
  type RecordButtonVariant,
  type RecordButtonSize,
  type TranscriptionState,
} from './RecordButton';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { AudioPlayer } from '../AudioPlayer';

// ============================================================================
// Mock Transcription Service
// ============================================================================

/**
 * Simulates a batch transcription service that processes audio after recording.
 * Returns the full transcription after a delay.
 */
function useMockBatchTranscription() {
  const [state, setState] = React.useState<TranscriptionState>('idle');
  const [text, setText] = React.useState('');

  const transcribe = React.useCallback(
    async (_blob: Blob, _duration: number): Promise<string> => {
      setState('transcribing');
      setText('');

      // Simulate API call delay (1.5-3 seconds)
      const delay = 1500 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Mock transcription result
      const mockTexts = [
        "Hello, this is a test recording. I'm demonstrating the transcription feature.",
        'The quick brown fox jumps over the lazy dog. This is sample transcribed text.',
        'Thank you for using our voice recording feature. We hope you find it helpful.',
        'Please remember to speak clearly for the best transcription results.',
      ];
      const result = mockTexts[Math.floor(Math.random() * mockTexts.length)];

      setText(result);
      setState('complete');
      return result;
    },
    []
  );

  const reset = React.useCallback(() => {
    setState('idle');
    setText('');
  }, []);

  return { state, text, transcribe, reset };
}

/**
 * Simulates a real-time streaming transcription service.
 * Text appears word-by-word as if being transcribed live.
 */
function useMockStreamingTranscription() {
  const [state, setState] = React.useState<TranscriptionState>('idle');
  const [text, setText] = React.useState('');
  const [partialText, setPartialText] = React.useState('');
  const intervalRef = React.useRef<number | undefined>(undefined);

  const startStreaming = React.useCallback(() => {
    setState('streaming');
    setText('');
    setPartialText('');

    const mockSentence =
      'Hello, this is a live transcription demo. The words appear as you speak them in real time.';
    const words = mockSentence.split(' ');
    let currentIndex = 0;

    intervalRef.current = window.setInterval(
      () => {
        if (currentIndex < words.length) {
          const currentText = words.slice(0, currentIndex + 1).join(' ');
          setPartialText(currentText);
          currentIndex++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      },
      200 + Math.random() * 150
    );
  }, []);

  const stopStreaming = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState('transcribing');

    // Final processing delay
    setTimeout(() => {
      setText(partialText || 'Transcription complete.');
      setPartialText('');
      setState('complete');
    }, 500);
  }, [partialText]);

  const reset = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState('idle');
    setText('');
    setPartialText('');
  }, []);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    text,
    partialText,
    startStreaming,
    stopStreaming,
    reset,
  };
}

// ============================================================================
// State Card Component
// ============================================================================

function StateCard({
  state,
  label,
  description,
  variant = 'default',
  size = 'md',
  showWaveform,
  showPulse,
}: {
  state: RecordButtonState;
  label: string;
  description: string;
  variant?: RecordButtonVariant;
  size?: RecordButtonSize;
  showWaveform?: boolean;
  showPulse?: boolean;
}) {
  return (
    <div className="bg-card flex flex-col items-center gap-3 rounded-xl border p-4">
      <RecordButton
        state={state}
        variant={variant}
        size={size}
        showWaveform={showWaveform}
        showPulse={showPulse}
      />
      <div className="space-y-0.5 text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground max-w-[140px] text-xs">
          {description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Variant Row Component
// ============================================================================

function VariantRow({
  variant,
  label,
}: {
  variant: RecordButtonVariant;
  label: string;
}) {
  const states: RecordButtonState[] = [
    'idle',
    'recording',
    'processing',
    'disabled',
    'error',
    'success',
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
          variant=&quot;{variant}&quot;
        </code>
      </div>
      <div className="flex flex-wrap gap-4">
        {states.map((state) => (
          <div key={state} className="flex flex-col items-center gap-2">
            <RecordButton state={state} variant={variant} />
            <span className="text-muted-foreground text-xs">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Interactive Demo Component
// ============================================================================

function InteractiveDemo() {
  const [state, setState] = React.useState<RecordButtonState>('idle');
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (state === 'idle') {
      // Start recording
      setState('recording');
    } else if (state === 'recording') {
      // Stop recording, start processing
      setState('processing');

      // Simulate processing time
      timerRef.current = setTimeout(() => {
        setState('success');

        // Reset to idle after showing success
        timerRef.current = setTimeout(() => {
          setState('idle');
        }, 1500);
      }, 2000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-card flex flex-col items-center gap-6 rounded-xl border p-8">
      <RecordButton
        state={state}
        variant="default"
        size="lg"
        onClick={handleClick}
        showPulse
      />
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">
          {state === 'idle' && 'Click to start recording'}
          {state === 'recording' && 'Recording... Click to stop'}
          {state === 'processing' && 'Processing audio...'}
          {state === 'success' && 'Done!'}
        </p>
        <p className="text-muted-foreground text-xs">
          Current state:{' '}
          <code className="bg-muted rounded px-1 py-0.5">{state}</code>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Press and Hold Demo Component
// ============================================================================

function PressAndHoldDemo() {
  const [state, setState] = React.useState<RecordButtonState>('idle');
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    setState('recording');
  };

  const handleMouseUp = () => {
    if (state === 'recording') {
      setState('processing');

      timerRef.current = setTimeout(() => {
        setState('success');
        timerRef.current = setTimeout(() => {
          setState('idle');
        }, 1000);
      }, 1500);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-card flex flex-col items-center gap-6 rounded-xl border p-8">
      <RecordButton
        state={state}
        variant="default"
        size="lg"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        showWaveform
        showPulse
      />
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">
          {state === 'idle' && 'Press and hold to record'}
          {state === 'recording' && 'Recording... Release to stop'}
          {state === 'processing' && 'Processing...'}
          {state === 'success' && 'Sent!'}
        </p>
        <p className="text-muted-foreground text-xs">
          Shows waveform animation while recording
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof RecordButton> = {
  title: 'Components/RecordButton',
  component: RecordButton,
  parameters: {
    layout: 'centered',
    controls: {
      include: [
        'state',
        'size',
        'variant',
        'showWaveform',
        'showPulse',
        'showDuration',
        'disabled',
        'maxDuration',
      ],
    },
    docs: {
      description: {
        component: `
A voice recording button with 6 distinct states for AI applications.
Supports multiple visual variants, sizes, and interaction patterns.

## States
- **idle** — Ready to record, waiting for interaction
- **recording** — Actively capturing audio input
- **processing** — Transcribing or sending audio
- **disabled** — No mic permission or unavailable
- **error** — Recording failed or permission denied
- **success** — Recording captured successfully

## Features
- 4 visual variants: default, outline, ghost, minimal
- 3 sizes: sm, md, lg
- Pulse ring animation during recording
- Optional waveform visualization
- Transcription state integration
- Both controlled and uncontrolled modes
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
        'recording',
        'processing',
        'disabled',
        'error',
        'success',
      ],
      description: 'Current state of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost', 'minimal'],
      description: 'Visual style variant',
    },
    showWaveform: {
      control: 'boolean',
      description:
        'Show animated waveform bars when recording (only visible in recording state)',
    },
    showPulse: {
      control: 'boolean',
      description:
        'Show pulse rings when recording (only visible in recording state)',
    },
    showDuration: {
      control: 'boolean',
      description: 'Show recording duration',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    maxDuration: {
      control: { type: 'number', min: 0, max: 300 },
      description: 'Maximum recording duration in seconds',
    },
    // Hide less commonly used props
    onRecordingComplete: { table: { disable: true } },
    onRecordingStart: { table: { disable: true } },
    onRecordingError: { table: { disable: true } },
    mimeType: { table: { disable: true } },
    className: { table: { disable: true } },
    'aria-label': { table: { disable: true } },
    idleIcon: { table: { disable: true } },
    recordingIcon: { table: { disable: true } },
    transcriptionState: { table: { disable: true } },
    showTranscriptionState: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof RecordButton>;

// ============================================================================
// Default (Controllable Preview)
// ============================================================================

/**
 * Use the controls panel to preview different states, variants, and sizes.
 * This is a controlled preview - use the "Live Recording" story to test actual recording.
 */
export const Default: Story = {
  args: {
    state: 'idle',
    variant: 'default',
    size: 'md',
    showWaveform: true,
    showPulse: true,
    showDuration: false,
    disabled: false,
  },
};

// ============================================================================
// Live Recording Demo
// ============================================================================

/**
 * A fully functional recording button. Click to start recording,
 * click again to stop. The recorded audio will play back below.
 */
export const LiveRecording: Story = {
  render: function LiveRecordingStory() {
    const [lastRecording, setLastRecording] = React.useState<{
      blob: Blob;
      duration: number;
      url: string;
    } | null>(null);

    const handleRecordingComplete = (blob: Blob, duration: number) => {
      const url = URL.createObjectURL(blob);
      setLastRecording({ blob, duration, url });
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <RecordButton
          onRecordingComplete={handleRecordingComplete}
          showWaveform
          showPulse
          showDuration
        />
        <p className="text-muted-foreground text-sm">
          Click to start recording
        </p>
        {lastRecording && (
          <div className="w-72">
            <AudioPlayer
              src={lastRecording.url}
              title={`Recording (${lastRecording.duration.toFixed(1)}s)`}
              variant="compact"
              size="sm"
              showTime
            />
          </div>
        )}
      </div>
    );
  },
};

// ============================================================================
// State Previews
// ============================================================================

export const Recording: Story = {
  args: {
    state: 'recording',
    showWaveform: true,
    showPulse: true,
  },
};

export const Processing: Story = {
  args: {
    state: 'processing',
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
  },
};

export const Error: Story = {
  args: {
    state: 'error',
  },
};

export const Success: Story = {
  args: {
    state: 'success',
  },
};

// ============================================================================
// All States Overview
// ============================================================================

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">All States</h2>
        <p className="text-muted-foreground text-sm">
          The 6 essential states a mic button needs to cover all use cases.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StateCard
          state="idle"
          label="Idle"
          description="Ready to record, waiting for interaction"
        />
        <StateCard
          state="recording"
          label="Recording"
          description="Actively capturing audio input"
        />
        <StateCard
          state="processing"
          label="Processing"
          description="Transcribing or sending audio"
        />
        <StateCard
          state="disabled"
          label="Disabled"
          description="No mic permission or unavailable"
        />
        <StateCard
          state="error"
          label="Error"
          description="Recording failed or permission denied"
        />
        <StateCard
          state="success"
          label="Success"
          description="Recording captured successfully"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Variants
// ============================================================================

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Variants</h2>
        <p className="text-muted-foreground text-sm">
          Four visual styles to match different UI contexts.
        </p>
      </div>
      <div className="bg-card space-y-8 rounded-xl border p-6">
        <VariantRow variant="default" label="Default" />
        <VariantRow variant="outline" label="Outline" />
        <VariantRow variant="ghost" label="Ghost" />
        <VariantRow variant="minimal" label="Minimal" />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Sizes
// ============================================================================

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Sizes</h2>
        <p className="text-muted-foreground text-sm">
          Three sizes for different contexts and layouts.
        </p>
      </div>
      <div className="bg-card flex flex-wrap items-end gap-8 rounded-xl border p-6">
        {(['sm', 'md', 'lg'] as RecordButtonSize[]).map((size) => (
          <div key={size} className="flex flex-col items-center gap-3">
            <RecordButton size={size} />
            <div className="text-center">
              <p className="text-sm font-medium">{size.toUpperCase()}</p>
              <code className="text-muted-foreground text-xs">
                size=&quot;{size}&quot;
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Recording Animations
// ============================================================================

export const RecordingAnimations: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Recording Animations
        </h2>
        <p className="text-muted-foreground text-sm">
          Different visual feedback options for the recording state.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card flex flex-col items-center gap-4 rounded-xl border p-6">
          <RecordButton state="recording" showPulse showWaveform={false} />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">Pulse + Stop Icon</p>
            <p className="text-muted-foreground text-xs">
              Default recording state with pulse rings
            </p>
          </div>
        </div>
        <div className="bg-card flex flex-col items-center gap-4 rounded-xl border p-6">
          <RecordButton state="recording" showPulse showWaveform />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">Pulse + Waveform</p>
            <p className="text-muted-foreground text-xs">
              Shows audio activity with waveform bars
            </p>
          </div>
        </div>
        <div className="bg-card flex flex-col items-center gap-4 rounded-xl border p-6">
          <RecordButton state="recording" showPulse={false} showWaveform />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">Waveform Only</p>
            <p className="text-muted-foreground text-xs">
              Subtle animation without pulse rings
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// Interactive Demos
// ============================================================================

export const InteractiveDemos: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Interactive Demos
        </h2>
        <p className="text-muted-foreground text-sm">
          Try the different interaction patterns.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Toggle Pattern</span>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
              Click to toggle
            </span>
          </div>
          <InteractiveDemo />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Press & Hold Pattern</span>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
              Hold to record
            </span>
          </div>
          <PressAndHoldDemo />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// With Duration
// ============================================================================

export const WithDuration: Story = {
  render: function WithDurationStory() {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Click to start recording and see the duration timer.
        </p>
        <RecordButton showDuration maxDuration={30} />
      </div>
    );
  },
};

// ============================================================================
// In Input Field
// ============================================================================

export const InInputField: Story = {
  render: function InInputFieldStory() {
    const [inputValue, setInputValue] = React.useState('');

    const handleRecordingComplete = (blob: Blob, duration: number) => {
      // In a real app, you'd send the blob to a transcription service
      setInputValue(
        `[Voice message: ${duration.toFixed(1)}s, ${(blob.size / 1024).toFixed(1)}KB]`
      );
    };

    return (
      <div className="w-96 space-y-4">
        <p className="text-muted-foreground text-sm">
          RecordButton embedded in an input field. Click the mic to record.
        </p>
        <div className="relative">
          <Input
            placeholder="Type or record a message..."
            className="pr-14"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <RecordButton
              size="sm"
              variant="ghost"
              onRecordingComplete={handleRecordingComplete}
            />
          </div>
        </div>
        {inputValue && (
          <p className="text-muted-foreground text-xs">
            Value: <code className="bg-muted rounded px-1">{inputValue}</code>
          </p>
        )}
      </div>
    );
  },
};

// ============================================================================
// Transcription Integration
// ============================================================================

export const BatchTranscription: Story = {
  render: function BatchTranscriptionStory() {
    const [text, setText] = React.useState('');
    const {
      state,
      text: transcribedText,
      transcribe,
      reset,
    } = useMockBatchTranscription();

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
      await transcribe(blob, duration);
    };

    React.useEffect(() => {
      if (transcribedText) {
        setText(transcribedText);
      }
    }, [transcribedText]);

    return (
      <div className="w-96 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Batch Transcription</h3>
          <p className="text-muted-foreground text-xs">
            Record audio, then transcribe after recording completes.
          </p>
        </div>
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Record a message to transcribe..."
            rows={4}
            className={state === 'transcribing' ? 'bg-muted' : ''}
          />
        </div>
        <div className="flex items-center justify-between">
          <RecordButton
            transcriptionState={state}
            showTranscriptionState
            onRecordingComplete={handleRecordingComplete}
          />
          <button
            onClick={() => {
              reset();
              setText('');
            }}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Reset
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};

export const StreamingTranscription: Story = {
  render: function StreamingTranscriptionStory() {
    const [text, setText] = React.useState('');
    const {
      state,
      text: finalText,
      partialText,
      startStreaming,
      stopStreaming,
      reset,
    } = useMockStreamingTranscription();

    React.useEffect(() => {
      if (finalText) {
        setText(finalText);
      }
    }, [finalText]);

    const handleClick = () => {
      if (state === 'idle') {
        startStreaming();
      } else if (state === 'streaming') {
        stopStreaming();
      }
    };

    return (
      <div className="w-96 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Streaming Transcription</h3>
          <p className="text-muted-foreground text-xs">
            See text appear word-by-word as you speak.
          </p>
        </div>
        <div className="relative">
          <Textarea
            value={state === 'streaming' ? partialText : text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Record to see streaming transcription..."
            rows={4}
            readOnly={state === 'streaming' || state === 'transcribing'}
            className={state === 'streaming' ? 'border-primary' : ''}
          />
        </div>
        <div className="flex items-center justify-between">
          <RecordButton
            state={
              state === 'streaming'
                ? 'recording'
                : state === 'transcribing'
                  ? 'processing'
                  : state === 'complete'
                    ? 'success'
                    : 'idle'
            }
            onClick={handleClick}
            showWaveform
            showPulse
          />
          <button
            onClick={() => {
              reset();
              setText('');
            }}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Reset
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};
