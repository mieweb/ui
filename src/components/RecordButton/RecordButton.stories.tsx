import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { RecordButton, type TranscriptionState } from './RecordButton';
import { Input } from '../Input';
import { Textarea } from '../Textarea';

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
// Transcription Textarea Component
// ============================================================================

interface TranscriptionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  transcriptionState: TranscriptionState;
  streamingText?: string;
  rows?: number;
  className?: string;
}

/**
 * A textarea that handles transcription states gracefully.
 * Shows appropriate UI for transcribing, streaming, and idle states.
 */
function TranscriptionTextarea({
  value,
  onChange,
  placeholder = 'Type or record a message...',
  transcriptionState,
  streamingText,
  rows = 3,
  className,
}: TranscriptionTextareaProps) {
  const isTranscribing = transcriptionState === 'transcribing';
  const isStreaming = transcriptionState === 'streaming';
  const isProcessing = isTranscribing || isStreaming;

  // Display streaming text when available, otherwise show value
  const displayValue = isStreaming && streamingText ? streamingText : value;

  // Determine placeholder based on state
  const getPlaceholder = () => {
    if (isTranscribing) return 'Transcribing your audio...';
    if (isStreaming) return '';
    return placeholder;
  };

  return (
    <div className="relative">
      <Textarea
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={getPlaceholder()}
        rows={rows}
        readOnly={isProcessing}
        className={`transition-all duration-200 ${isProcessing ? 'bg-neutral-50 dark:bg-neutral-900' : ''} ${isStreaming ? 'border-primary-400 dark:border-primary-600' : ''} ${isTranscribing ? 'border-amber-400 dark:border-amber-600' : ''} ${className || ''} `}
      />
      {/* Transcription indicator overlay */}
      {isTranscribing && !displayValue && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-50/80 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Transcribing audio...</span>
          </div>
        </div>
      )}
      {/* Streaming cursor effect */}
      {isStreaming && (
        <span className="text-primary-600 dark:text-primary-400 pointer-events-none absolute bottom-3">
          <span
            className="inline-block h-4 w-0.5 animate-pulse bg-current"
            style={{
              marginLeft: '0.125rem',
              position: 'relative',
              top: '0.125rem',
            }}
          />
        </span>
      )}
    </div>
  );
}

const meta: Meta<typeof RecordButton> = {
  title: 'Components/RecordButton',
  component: RecordButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A simple microphone recording button that can be placed anywhere.
Perfect for adding voice input to text fields, chat inputs, or forms.

## Features
- Compact, embeddable design
- Recording states: idle, recording, processing
- Optional duration display while recording
- Customizable icons
- Theme-aware styling

## Usage

\`\`\`tsx
import { RecordButton } from '@mieweb/ui';

// Basic usage
<RecordButton
  onRecordingComplete={(blob, duration) => {
    // Handle the recorded audio
  }}
/>

// In an input field
<div className="relative">
  <Input className="pr-12" />
  <div className="absolute right-2 top-1/2 -translate-y-1/2">
    <RecordButton size="sm" />
  </div>
</div>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'primary'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    maxDuration: {
      control: { type: 'number', min: 0, max: 300 },
    },
    showDuration: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecordButton>;

// ============================================================================
// Basic Examples
// ============================================================================

export const Default: Story = {
  args: {},
};

export const WithDuration: Story = {
  args: {
    showDuration: true,
    maxDuration: 30,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows recording duration while recording.',
      },
    },
  },
};

// ============================================================================
// Variants
// ============================================================================

export const DefaultVariant: Story = {
  args: {
    variant: 'default',
  },
};

export const FilledVariant: Story = {
  args: {
    variant: 'filled',
  },
};

export const PrimaryVariant: Story = {
  args: {
    variant: 'primary',
  },
};

// ============================================================================
// Sizes
// ============================================================================

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <RecordButton size="sm" />
        <p className="mt-2 text-xs text-neutral-500">Small</p>
      </div>
      <div className="text-center">
        <RecordButton size="md" />
        <p className="mt-2 text-xs text-neutral-500">Medium</p>
      </div>
      <div className="text-center">
        <RecordButton size="lg" />
        <p className="mt-2 text-xs text-neutral-500">Large</p>
      </div>
    </div>
  ),
};

// ============================================================================
// In Context Examples
// ============================================================================

export const InInputField: Story = {
  render: function InInputFieldStory() {
    const [recordings, setRecordings] = React.useState<
      Array<{ id: string; duration: number }>
    >([]);

    return (
      <div className="w-80 space-y-3">
        <div className="relative">
          <Input placeholder="Type or record a message..." className="pr-12" />
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <RecordButton
              size="sm"
              onRecordingComplete={(blob, duration) => {
                setRecordings((prev) => [
                  ...prev,
                  { id: Date.now().toString(), duration },
                ]);
              }}
            />
          </div>
        </div>
        {recordings.length > 0 && (
          <div className="text-xs text-neutral-500">
            {recordings.length} recording(s) captured
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RecordButton embedded inside an input field.',
      },
    },
  },
};

export const InTextarea: Story = {
  render: function InTextareaStory() {
    return (
      <div className="w-80">
        <div className="relative">
          <Textarea
            placeholder="Write your message or record audio..."
            rows={4}
            className="pb-10"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <RecordButton size="sm" variant="filled" showDuration />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RecordButton at the bottom of a textarea.',
      },
    },
  },
};

export const ChatInputExample: Story = {
  render: function ChatInputExampleStory() {
    const [message, setMessage] = React.useState('');
    const [attachments, setAttachments] = React.useState<
      Array<{ name: string; duration: number }>
    >([]);

    const handleRecording = (blob: Blob, duration: number) => {
      const name = `recording-${new Date().toISOString()}.webm`;
      setAttachments((prev) => [...prev, { name, duration }]);
    };

    return (
      <div className="w-96 space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
                <span>{Math.round(att.duration)}s</span>
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="ml-1 text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="focus:ring-primary-500 flex-1 resize-none rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-neutral-700"
          />
          <RecordButton
            variant="filled"
            onRecordingComplete={handleRecording}
            showDuration
          />
          <button className="bg-primary-600 hover:bg-primary-700 h-9 rounded-lg px-4 text-sm font-medium text-white">
            Send
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Full chat input example with recording attachments.',
      },
    },
  },
};

// ============================================================================
// States
// ============================================================================

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithMaxDuration: Story = {
  args: {
    maxDuration: 10,
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Automatically stops recording after 10 seconds.',
      },
    },
  },
};

// ============================================================================
// Callbacks
// ============================================================================

export const WithCallbacks: Story = {
  args: {
    showDuration: true,
    onRecordingStart: () => console.log('Recording started'),
    onRecordingComplete: (blob, duration) =>
      console.log('Recording complete:', { blob, duration }),
    onError: (error) => console.error('Error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Check the console for callback events.',
      },
    },
  },
};

// ============================================================================
// Custom Icons
// ============================================================================

export const CustomIcons: Story = {
  args: {
    idleIcon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
          clipRule="evenodd"
        />
      </svg>
    ),
    recordingIcon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Using custom icons for idle and recording states.',
      },
    },
  },
};

// ============================================================================
// Dark Mode
// ============================================================================

export const DarkModePreview: Story = {
  render: () => (
    <div className="dark flex items-center gap-4 rounded-xl bg-neutral-900 p-6">
      <RecordButton variant="default" />
      <RecordButton variant="filled" />
      <RecordButton variant="primary" />
    </div>
  ),
};

// ============================================================================
// Transcription Examples
// ============================================================================

/**
 * Batch Transcription Mode
 *
 * Records audio, then sends it to a transcription service and waits for the result.
 * The textarea shows a loading state while transcription is in progress.
 */
export const BatchTranscription: Story = {
  render: function BatchTranscriptionStory() {
    const [text, setText] = React.useState('');
    const { state, transcribe, reset } = useMockBatchTranscription();

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
      const result = await transcribe(blob, duration);
      setText((prev) => (prev ? `${prev}\n\n${result}` : result));
    };

    return (
      <div className="w-96 space-y-3">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Batch Transcription Demo
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Record audio, then wait for the full transcription. The textarea
          becomes read-only during processing.
        </p>

        <TranscriptionTextarea
          value={text}
          onChange={setText}
          transcriptionState={state}
          placeholder="Click the mic to record and transcribe..."
          rows={4}
        />

        <div className="flex items-center justify-between">
          <RecordButton
            variant="filled"
            showDuration
            transcriptionState={state}
            showTranscriptionState
            onRecordingComplete={handleRecordingComplete}
            maxDuration={30}
          />
          {text && (
            <button
              onClick={() => {
                setText('');
                reset();
              }}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Batch Transcription Mode**

This mode is for "send it, wait, and get transcription back" workflows:

1. User clicks record and speaks
2. User stops recording
3. Audio is sent to transcription service
4. Textarea shows loading state (read-only)
5. Full transcription appears when complete

Best for: High accuracy needs, offline processing, longer recordings.
        `,
      },
    },
  },
};

/**
 * Real-time Streaming Transcription
 *
 * Text appears word-by-word as the user speaks.
 * Shows a cursor effect to indicate live transcription.
 */
export const StreamingTranscription: Story = {
  render: function StreamingTranscriptionStory() {
    const [text, setText] = React.useState('');
    const { state, partialText, startStreaming, stopStreaming, reset } =
      useMockStreamingTranscription();

    const handleRecordingStart = () => {
      startStreaming();
    };

    const handleRecordingComplete = () => {
      stopStreaming();
      // After processing, append the final text
      setTimeout(() => {
        setText((prev) => {
          const newText = partialText || 'Transcription complete.';
          return prev ? `${prev}\n\n${newText}` : newText;
        });
      }, 600);
    };

    return (
      <div className="w-96 space-y-3">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Real-time Streaming Demo
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Text appears as you speak. Watch the words stream in real-time.
        </p>

        <TranscriptionTextarea
          value={text}
          onChange={setText}
          transcriptionState={state}
          streamingText={partialText}
          placeholder="Click the mic to start live transcription..."
          rows={4}
        />

        <div className="flex items-center justify-between">
          <RecordButton
            variant="filled"
            showDuration
            transcriptionState={state}
            showTranscriptionState
            onRecordingStart={handleRecordingStart}
            onRecordingComplete={handleRecordingComplete}
            maxDuration={60}
          />
          {(text || partialText) && (
            <button
              onClick={() => {
                setText('');
                reset();
              }}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Real-time Streaming Mode**

This mode shows text appearing word-by-word as the user speaks:

1. User clicks record
2. Transcription starts immediately
3. Words appear in the textarea as they're recognized
4. A blinking cursor indicates live transcription
5. When stopped, final processing occurs

Best for: Immediate feedback, live captioning, real-time note-taking.
        `,
      },
    },
  },
};

/**
 * Transcription States Demonstration
 *
 * Shows all possible transcription states for testing and documentation.
 */
export const TranscriptionStates: Story = {
  render: function TranscriptionStatesStory() {
    const [currentState, setCurrentState] =
      React.useState<TranscriptionState>('idle');

    const states: TranscriptionState[] = [
      'idle',
      'recording',
      'transcribing',
      'streaming',
      'complete',
      'error',
    ];

    return (
      <div className="w-96 space-y-4">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Transcription State Tester
        </div>

        <div className="flex flex-wrap gap-2">
          {states.map((state) => (
            <button
              key={state}
              onClick={() => setCurrentState(state)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                currentState === state
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              {state}
            </button>
          ))}
        </div>

        <TranscriptionTextarea
          value={
            currentState === 'complete'
              ? 'This is the transcribed text that appeared after processing.'
              : ''
          }
          onChange={() => {}}
          transcriptionState={currentState}
          streamingText={
            currentState === 'streaming'
              ? 'This text is streaming in word by word...'
              : undefined
          }
          placeholder="Select a state above to preview..."
          rows={3}
        />

        <div className="flex items-center gap-4">
          <RecordButton
            variant="filled"
            transcriptionState={currentState}
            showTranscriptionState
            disabled={currentState !== 'idle'}
          />
          <div className="text-xs text-neutral-500">
            Current state: <code className="font-mono">{currentState}</code>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo of all transcription states. Click buttons to preview each state.',
      },
    },
  },
};

/**
 * Full Chat with Voice Transcription
 *
 * Complete chat interface with voice-to-text transcription.
 */
export const ChatWithTranscription: Story = {
  render: function ChatWithTranscriptionStory() {
    const [message, setMessage] = React.useState('');
    const [messages, setMessages] = React.useState<
      Array<{ id: string; text: string; isVoice: boolean }>
    >([]);
    const { state, transcribe, reset } = useMockBatchTranscription();

    const handleSend = () => {
      if (!message.trim()) return;
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: message, isVoice: false },
      ]);
      setMessage('');
    };

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
      const result = await transcribe(blob, duration);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: result, isVoice: true },
      ]);
      reset();
    };

    return (
      <div className="flex h-96 w-96 flex-col rounded-lg border border-neutral-200 dark:border-neutral-700">
        {/* Messages */}
        <div className="flex-1 space-y-2 overflow-auto p-3">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              Send a message or record audio
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-2 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800"
            >
              {msg.isVoice && (
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              )}
              <p className="text-sm">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
          <TranscriptionTextarea
            value={message}
            onChange={setMessage}
            transcriptionState={state}
            placeholder="Type or record..."
            rows={2}
            className="mb-2"
          />
          <div className="flex items-center justify-between">
            <RecordButton
              variant="filled"
              size="sm"
              showDuration
              transcriptionState={state}
              showTranscriptionState
              onRecordingComplete={handleRecordingComplete}
              maxDuration={30}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || state !== 'idle'}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete chat interface demonstrating voice-to-text integration.',
      },
    },
  },
};

/**
 * Form Field with Voice Input
 *
 * Shows how to add voice transcription to a standard form field.
 */
export const FormFieldWithVoice: Story = {
  render: function FormFieldWithVoiceStory() {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const { state, transcribe, reset } = useMockBatchTranscription();
    const [activeField, setActiveField] = React.useState<
      'name' | 'description' | null
    >(null);

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
      const result = await transcribe(blob, duration);
      if (activeField === 'name') {
        setName(result);
      } else if (activeField === 'description') {
        setDescription(result);
      }
      setActiveField(null);
      reset();
    };

    return (
      <div className="w-96 space-y-4">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Voice-Enabled Form
        </div>

        {/* Name field */}
        <div className="space-y-1">
          <label
            htmlFor="voice-form-name"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Name
          </label>
          <div className="relative">
            <Input
              id="voice-form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="pr-12"
              readOnly={state !== 'idle' && activeField === 'name'}
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <RecordButton
                size="sm"
                variant="default"
                transcriptionState={activeField === 'name' ? state : 'idle'}
                onRecordingStart={() => setActiveField('name')}
                onRecordingComplete={handleRecordingComplete}
                disabled={state !== 'idle' && activeField !== 'name'}
              />
            </div>
          </div>
        </div>

        {/* Description field */}
        <div className="space-y-1">
          <label
            htmlFor="voice-form-description"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Description
          </label>
          <div className="relative">
            <Textarea
              id="voice-form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={3}
              className={`pr-12 ${
                state !== 'idle' && activeField === 'description'
                  ? 'bg-neutral-50 dark:bg-neutral-900'
                  : ''
              }`}
              readOnly={state !== 'idle' && activeField === 'description'}
            />
            <div className="absolute top-2 right-2">
              <RecordButton
                size="sm"
                variant="default"
                transcriptionState={
                  activeField === 'description' ? state : 'idle'
                }
                onRecordingStart={() => setActiveField('description')}
                onRecordingComplete={handleRecordingComplete}
                disabled={state !== 'idle' && activeField !== 'description'}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          className="bg-primary-600 hover:bg-primary-700 w-full rounded-lg py-2 text-sm font-medium text-white"
          disabled={state !== 'idle'}
        >
          Submit
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard form with voice input capability on multiple fields. Shows how to integrate voice transcription into existing forms.',
      },
    },
  },
};
