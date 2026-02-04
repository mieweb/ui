import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export type RecordButtonState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'disabled'
  | 'error'
  | 'success';

export type RecordButtonVariant = 'default' | 'outline' | 'ghost' | 'minimal';
export type RecordButtonSize = 'sm' | 'md' | 'lg';

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

export interface RecordButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'disabled'
> {
  /** Current state of the button */
  state?: RecordButtonState;
  /** Size of the button */
  size?: RecordButtonSize;
  /** Visual style variant */
  variant?: RecordButtonVariant;
  /** Show waveform bars when recording (instead of stop icon) */
  showWaveform?: boolean;
  /** Show pulse rings when recording */
  showPulse?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
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

  // Recording callbacks (for uncontrolled usage)
  /** Callback when recording is complete with the audio blob */
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback when a recording error occurs */
  onRecordingError?: (error: Error) => void;
  /** Maximum recording duration in seconds (0 for unlimited) */
  maxDuration?: number;
  /** Audio MIME type */
  mimeType?: string;
}

// ============================================================================
// Icons
// ============================================================================

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('animate-spin', className)}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ============================================================================
// Pulse Ring Animation (for recording state)
// ============================================================================

function PulseRings({ variant }: { variant: RecordButtonVariant }) {
  const ringColor = variant === 'minimal' ? 'bg-red-500/30' : 'bg-red-400/40';

  return (
    <>
      <span
        className={cn('absolute inset-0 animate-ping rounded-full', ringColor)}
        style={{ animationDuration: '1.5s' }}
      />
      <span
        className={cn('absolute inset-0 animate-ping rounded-full', ringColor)}
        style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}
      />
    </>
  );
}

// ============================================================================
// Waveform Animation (for recording state)
// ============================================================================

function WaveformBars({ size }: { size: RecordButtonSize }) {
  const barHeight = size === 'sm' ? 'h-2' : size === 'md' ? 'h-3' : 'h-4';

  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            'animate-waveform w-0.5 rounded-full bg-current',
            barHeight
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Style Variants
// ============================================================================

const recordButtonVariants = cva(
  [
    'relative inline-flex items-center justify-center rounded-full',
    'transition-all duration-200',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  ],
  {
    variants: {
      variant: {
        default: '',
        outline: 'border-2',
        ghost: '',
        minimal: '',
      },
      size: {
        sm: 'size-10',
        md: 'size-12',
        lg: 'size-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const iconSizes: Record<RecordButtonSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

// ============================================================================
// State Styles
// ============================================================================

function getStateStyles(
  state: RecordButtonState,
  variant: RecordButtonVariant
): string {
  const styles: Record<
    RecordButtonVariant,
    Record<RecordButtonState, string>
  > = {
    default: {
      idle: 'bg-primary/10 text-primary hover:bg-primary/20',
      recording: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
      processing: 'bg-primary/10 text-primary cursor-wait',
      disabled: 'bg-muted text-muted-foreground cursor-not-allowed opacity-50',
      error: 'bg-destructive/10 text-destructive',
      success: 'bg-emerald-500/10 text-emerald-500',
    },
    outline: {
      idle: 'border-primary/50 text-primary bg-transparent hover:bg-primary/10 hover:border-primary',
      recording:
        'border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 hover:border-red-500',
      processing: 'border-primary/50 text-primary bg-transparent cursor-wait',
      disabled:
        'border-muted text-muted-foreground bg-transparent cursor-not-allowed opacity-50',
      error: 'border-destructive/50 text-destructive bg-transparent',
      success: 'border-emerald-500/50 text-emerald-500 bg-transparent',
    },
    ghost: {
      idle: 'text-primary hover:bg-primary/10',
      recording: 'text-red-500 hover:bg-red-500/10',
      processing: 'text-primary bg-primary/5 cursor-wait',
      disabled: 'text-muted-foreground cursor-not-allowed opacity-50',
      error: 'text-destructive',
      success: 'text-emerald-500',
    },
    minimal: {
      idle: 'text-primary hover:text-primary/80',
      recording: 'text-red-500 hover:text-red-500/80',
      processing: 'text-primary cursor-wait',
      disabled: 'text-muted-foreground/40 cursor-not-allowed',
      error: 'text-destructive',
      success: 'text-emerald-500',
    },
  };

  return styles[variant][state];
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * A voice recording button with 6 states and 4 visual variants.
 * Supports pulse animations, waveform visualization, and transcription integration.
 *
 * @example
 * ```tsx
 * // Controlled state
 * <RecordButton state="idle" onClick={handleClick} />
 *
 * // With recording callbacks (uncontrolled)
 * <RecordButton
 *   onRecordingComplete={(blob, duration) => console.log('Recorded:', blob)}
 * />
 *
 * // Different variants
 * <RecordButton variant="outline" size="lg" />
 *
 * // With waveform animation
 * <RecordButton state="recording" showWaveform showPulse />
 * ```
 */
const RecordButton = React.forwardRef<HTMLButtonElement, RecordButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      state: controlledState,
      showWaveform = false,
      showPulse = true,
      disabled,
      showDuration = false,
      idleIcon,
      recordingIcon,
      transcriptionState,
      showTranscriptionState = false,
      onRecordingComplete,
      onRecordingStart,
      onRecordingError,
      maxDuration = 0,
      mimeType = 'audio/webm',
      onClick,
      ...props
    },
    ref
  ) => {
    // Internal state for uncontrolled usage
    const [internalState, setInternalState] =
      React.useState<RecordButtonState>('idle');
    const [duration, setDuration] = React.useState(0);

    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);
    const timerRef = React.useRef<number | undefined>(undefined);
    const startTimeRef = React.useRef<number>(0);

    // Use controlled state if provided, otherwise internal state
    const isControlled = controlledState !== undefined;
    const currentState = isControlled ? controlledState : internalState;

    // Map transcription state to button state if provided
    const effectiveState: RecordButtonState = disabled
      ? 'disabled'
      : transcriptionState === 'error'
        ? 'error'
        : transcriptionState === 'transcribing' ||
            transcriptionState === 'streaming'
          ? 'processing'
          : transcriptionState === 'complete'
            ? 'success'
            : currentState;

    const iconSize = iconSizes[size];
    const isRecording = effectiveState === 'recording';
    const isProcessing = effectiveState === 'processing';
    const isDisabled =
      effectiveState === 'disabled' || effectiveState === 'processing';

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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
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
          if (!isControlled) {
            setInternalState('processing');
          }

          const blob = new Blob(chunksRef.current, { type: mimeType });
          const finalDuration = duration;

          // Small delay to show processing state
          setTimeout(() => {
            onRecordingComplete?.(blob, finalDuration);
            if (!isControlled) {
              setInternalState('success');
              // Reset to idle after showing success
              setTimeout(() => {
                setInternalState('idle');
              }, 1500);
            }
            setDuration(0);
          }, 200);
        };

        mediaRecorderRef.current.start(100);
        startTimeRef.current = Date.now();

        if (!isControlled) {
          setInternalState('recording');
        }
        onRecordingStart?.();

        timerRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setDuration(elapsed);

          if (maxDuration > 0 && elapsed >= maxDuration) {
            stopRecording();
          }
        }, 100);
      } catch (error) {
        onRecordingError?.(error as Error);
        if (!isControlled) {
          setInternalState('error');
          // Reset to idle after showing error
          setTimeout(() => {
            setInternalState('idle');
          }, 2000);
        }
      }
    }, [
      disabled,
      isRecording,
      isProcessing,
      isControlled,
      mimeType,
      maxDuration,
      duration,
      onRecordingComplete,
      onRecordingStart,
      onRecordingError,
      stopRecording,
    ]);

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Call external onClick if provided
        onClick?.(e);

        // Handle internal recording logic only if not fully controlled
        if (!isControlled) {
          if (isRecording) {
            stopRecording();
          } else if (effectiveState === 'idle') {
            startRecording();
          }
        }
      },
      [
        onClick,
        isControlled,
        isRecording,
        effectiveState,
        startRecording,
        stopRecording,
      ]
    );

    // Determine which icon to show
    const renderIcon = () => {
      switch (effectiveState) {
        case 'recording':
          if (showWaveform) {
            return <WaveformBars size={size} />;
          }
          return recordingIcon || <StopIcon className={iconSize} />;
        case 'processing':
          return <LoadingSpinner className={iconSize} />;
        case 'disabled':
        case 'error':
          return <MicOffIcon className={iconSize} />;
        case 'success':
          return <CheckIcon className={iconSize} />;
        default:
          return idleIcon || <MicIcon className={iconSize} />;
      }
    };

    const getAriaLabel = () => {
      switch (effectiveState) {
        case 'recording':
          return 'Stop recording';
        case 'processing':
          return 'Processing recording';
        case 'disabled':
          return 'Recording unavailable';
        case 'error':
          return 'Recording failed';
        case 'success':
          return 'Recording complete';
        default:
          return 'Start recording';
      }
    };

    const getTranscriptionLabel = () => {
      if (transcriptionState === 'streaming') return 'Listening...';
      if (transcriptionState === 'transcribing') return 'Transcribing...';
      return null;
    };

    return (
      <div className="relative inline-flex items-center gap-2">
        <button
          ref={ref}
          type="button"
          disabled={isDisabled}
          onClick={handleClick}
          className={cn(
            recordButtonVariants({ variant, size }),
            getStateStyles(effectiveState, variant),
            className
          )}
          aria-label={getAriaLabel()}
          aria-pressed={isRecording}
          {...props}
        >
          {/* Pulse animation for recording state */}
          {effectiveState === 'recording' && showPulse && (
            <PulseRings variant={variant} />
          )}

          {/* Icon */}
          <span className="relative z-10">{renderIcon()}</span>
        </button>

        {/* Duration display */}
        {showDuration && isRecording && (
          <span className="font-mono text-xs text-red-500 tabular-nums">
            {formatDuration(duration)}
          </span>
        )}

        {/* Transcription state label */}
        {showTranscriptionState && getTranscriptionLabel() && (
          <span className="text-primary text-xs font-medium">
            {getTranscriptionLabel()}
          </span>
        )}
      </div>
    );
  }
);

RecordButton.displayName = 'RecordButton';

// ============================================================================
// Exports
// ============================================================================

export { RecordButton, recordButtonVariants, formatDuration };
