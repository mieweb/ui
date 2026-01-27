import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export type RecordButtonState = 'idle' | 'recording' | 'processing';

/** Transcription state for integration with transcription services */
export type TranscriptionState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'streaming'
  | 'complete'
  | 'error';

export interface TranscriptionResult {
  /** The transcribed text */
  text: string;
  /** Whether this is a partial (streaming) or final result */
  isFinal: boolean;
  /** Confidence score (0-1) if available */
  confidence?: number;
}

export interface RecordButtonProps extends VariantProps<
  typeof recordButtonVariants
> {
  /** Callback when recording is complete with the audio blob */
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Maximum recording duration in seconds (0 for unlimited) */
  maxDuration?: number;
  /** Audio MIME type */
  mimeType?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** Show recording duration while recording */
  showDuration?: boolean;
  /** Custom idle icon */
  idleIcon?: React.ReactNode;
  /** Custom recording icon */
  recordingIcon?: React.ReactNode;
  /** Current transcription state (for external control) */
  transcriptionState?: TranscriptionState;
  /** Show transcription state indicator */
  showTranscriptionState?: boolean;
}

// ============================================================================
// Variants
// ============================================================================

const recordButtonVariants = cva(
  [
    'relative inline-flex items-center justify-center',
    'rounded-full transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100',
          'dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800',
        ],
        filled: [
          'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
          'dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
        ],
        primary: [
          'bg-primary-600 text-white hover:bg-primary-700',
          'dark:bg-primary-500 dark:hover:bg-primary-600',
        ],
      },
      size: {
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const recordingIndicatorVariants = cva(
  [
    'absolute -top-1 -right-1',
    'flex items-center justify-center',
    'rounded-full bg-red-500 text-white',
    'animate-pulse',
  ],
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Icons
// ============================================================================

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * A simple microphone recording button that can be placed anywhere.
 * Perfect for adding voice input to text fields, chat inputs, or forms.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RecordButton
 *   onRecordingComplete={(blob, duration) => {
 *     console.log('Recorded:', blob, duration);
 *   }}
 * />
 *
 * // In an input field
 * <div className="relative">
 *   <Input className="pr-12" />
 *   <div className="absolute right-2 top-1/2 -translate-y-1/2">
 *     <RecordButton size="sm" onRecordingComplete={handleRecording} />
 *   </div>
 * </div>
 *
 * // With max duration
 * <RecordButton maxDuration={30} showDuration />
 * ```
 */
function RecordButton({
  onRecordingComplete,
  onRecordingStart,
  onError,
  maxDuration = 0,
  mimeType = 'audio/webm',
  disabled = false,
  variant,
  size,
  className,
  'aria-label': ariaLabel,
  showDuration = false,
  idleIcon,
  recordingIcon,
  transcriptionState,
  showTranscriptionState = false,
}: RecordButtonProps) {
  const [state, setState] = React.useState<RecordButtonState>('idle');
  const [duration, setDuration] = React.useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<number | undefined>(undefined);
  const startTimeRef = React.useRef<number>(0);

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isTranscribing =
    transcriptionState === 'transcribing' || transcriptionState === 'streaming';

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopRecording = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startRecording = React.useCallback(async () => {
    if (disabled || isRecording || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = { mimeType };
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mediaRecorderRef.current = new MediaRecorder(stream);
      } else {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      }

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        setState('processing');

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const finalDuration = duration;

        // Small delay to show processing state
        setTimeout(() => {
          onRecordingComplete?.(blob, finalDuration);
          setState('idle');
          setDuration(0);
        }, 200);
      };

      mediaRecorderRef.current.start(100);
      startTimeRef.current = Date.now();
      setState('recording');
      onRecordingStart?.();

      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);

        if (maxDuration > 0 && elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (error) {
      onError?.(error as Error);
      setState('idle');
    }
  }, [
    disabled,
    isRecording,
    isProcessing,
    mimeType,
    maxDuration,
    duration,
    onRecordingComplete,
    onRecordingStart,
    onError,
    stopRecording,
  ]);

  const handleClick = React.useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const iconSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  const getIcon = () => {
    if (isProcessing || isTranscribing) {
      return <SpinnerIcon className={iconSize} />;
    }
    if (isRecording) {
      return recordingIcon || <StopIcon className={iconSize} />;
    }
    return idleIcon || <MicrophoneIcon className={iconSize} />;
  };

  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (isTranscribing) return 'Transcribing audio';
    if (isProcessing) return 'Processing recording';
    if (isRecording) return 'Stop recording';
    return 'Start recording';
  };

  const getTranscriptionLabel = () => {
    if (transcriptionState === 'streaming') return 'Listening...';
    if (transcriptionState === 'transcribing') return 'Transcribing...';
    return null;
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing || isTranscribing}
        className={cn(
          recordButtonVariants({ variant, size }),
          isRecording && 'text-red-600 dark:text-red-400',
          isTranscribing && 'text-primary-600 dark:text-primary-400',
          className
        )}
        aria-label={getAriaLabel()}
        aria-pressed={isRecording}
      >
        {getIcon()}
        {isRecording && !isTranscribing && (
          <span
            className={cn(recordingIndicatorVariants({ size }))}
            aria-hidden="true"
          />
        )}
      </button>
      {showDuration && isRecording && (
        <span className="font-mono text-xs text-red-600 tabular-nums dark:text-red-400">
          {formatDuration(duration)}
        </span>
      )}
      {showTranscriptionState && getTranscriptionLabel() && (
        <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
          {getTranscriptionLabel()}
        </span>
      )}
    </div>
  );
}

RecordButton.displayName = 'RecordButton';

// ============================================================================
// Exports
// ============================================================================

export {
  RecordButton,
  recordButtonVariants,
  recordingIndicatorVariants,
  formatDuration,
};
