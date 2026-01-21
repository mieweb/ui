import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AudioRecorderState =
  | 'idle'
  | 'listening'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'playback';

export interface AudioRecorderProps extends VariantProps<
  typeof audioRecorderVariants
> {
  /** Current state of the recorder */
  state?: AudioRecorderState;
  /** Callback when state changes */
  onStateChange?: (state: AudioRecorderState) => void;
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
  /** Waveform color (uses theme primary by default) */
  waveColor?: string;
  /** Progress/recorded waveform color */
  progressColor?: string;
  /** Cursor color */
  cursorColor?: string;
  /** Height of the waveform display */
  waveformHeight?: number;
  /** Show time display */
  showTime?: boolean;
  /** Show waveform visualization */
  showWaveform?: boolean;
  /** Additional class name */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** Pre-loaded audio URL for playback mode */
  audioUrl?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom controls render function */
  renderControls?: (props: AudioRecorderControlsRenderProps) => React.ReactNode;
}

export interface AudioRecorderControlsRenderProps {
  state: AudioRecorderState;
  currentTime: number;
  duration: number;
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  onRecord: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onPlay: () => void;
  onSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
}

// ============================================================================
// Variants
// ============================================================================

const audioRecorderVariants = cva(
  [
    'relative flex flex-col gap-3',
    'rounded-xl border border-border',
    'bg-card text-card-foreground',
    'transition-all duration-200',
  ],
  {
    variants: {
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
      },
      variant: {
        default: '',
        minimal: 'border-none bg-transparent shadow-none',
        elevated: 'shadow-lg border-0',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const waveformContainerVariants = cva(
  [
    'relative w-full overflow-hidden rounded-lg',
    'bg-neutral-100 dark:bg-neutral-800',
    'transition-all duration-200',
  ],
  {
    variants: {
      state: {
        idle: 'opacity-50',
        listening: 'opacity-75',
        recording: '',
        paused: 'opacity-90',
        stopped: '',
        playback: '',
      },
    },
    defaultVariants: {
      state: 'idle',
    },
  }
);

const controlButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white',
          'hover:bg-primary-700',
          'active:bg-primary-800',
        ],
        secondary: [
          'bg-neutral-200 text-neutral-700',
          'hover:bg-neutral-300',
          'dark:bg-neutral-700 dark:text-neutral-200',
          'dark:hover:bg-neutral-600',
        ],
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'active:bg-red-800',
        ],
        ghost: [
          'bg-transparent text-neutral-600',
          'hover:bg-neutral-100',
          'dark:text-neutral-400 dark:hover:bg-neutral-800',
        ],
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(seconds: number): string {
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

// ============================================================================
// Recording Indicator
// ============================================================================

interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
}

function RecordingIndicator({
  isRecording,
  isPaused,
}: RecordingIndicatorProps) {
  if (!isRecording && !isPaused) return null;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-3 w-3 rounded-full',
          isRecording && !isPaused
            ? 'animate-pulse bg-red-500'
            : 'bg-yellow-500'
        )}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {isPaused ? 'Paused' : 'Recording'}
      </span>
    </div>
  );
}

// ============================================================================
// Time Display
// ============================================================================

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  maxDuration?: number;
  showMax?: boolean;
}

function TimeDisplay({
  currentTime,
  duration,
  maxDuration,
  showMax,
}: TimeDisplayProps) {
  return (
    <div className="flex items-center gap-1 font-mono text-sm text-neutral-600 dark:text-neutral-400">
      <span>{formatTime(currentTime)}</span>
      <span>/</span>
      <span>{formatTime(showMax && maxDuration ? maxDuration : duration)}</span>
    </div>
  );
}

// ============================================================================
// Live Visualizer (for recording mode without WaveSurfer)
// ============================================================================

interface LiveVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  height: number;
  barColor?: string;
}

function LiveVisualizer({
  analyser,
  isActive,
  height,
  barColor,
}: LiveVisualizerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (!analyser || !canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Use CSS variable for primary color or fallback
        ctx.fillStyle =
          barColor ||
          getComputedStyle(document.documentElement).getPropertyValue(
            '--color-primary-500'
          ) ||
          '#3b82f6';

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, barColor]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height}
      className="w-full"
      style={{ height }}
    />
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * An audio recorder component with waveform visualization and custom controls.
 * Uses the Web Audio API and WaveSurfer.js for visualization.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AudioRecorder
 *   onRecordingComplete={(blob, duration) => {
 *     console.log('Recording complete:', blob, duration);
 *   }}
 * />
 *
 * // With max duration and custom styling
 * <AudioRecorder
 *   maxDuration={60}
 *   variant="elevated"
 *   size="lg"
 *   waveColor="#3b82f6"
 *   progressColor="#1d4ed8"
 * />
 *
 * // Playback mode with pre-loaded audio
 * <AudioRecorder
 *   audioUrl="/audio/message.wav"
 *   state="stopped"
 * />
 * ```
 */
function AudioRecorder({
  state: controlledState,
  onStateChange,
  onRecordingComplete,
  onRecordingStart,
  onError,
  maxDuration = 0,
  mimeType = 'audio/webm',
  waveColor,
  progressColor,
  cursorColor,
  waveformHeight = 80,
  showTime = true,
  showWaveform = true,
  size,
  variant,
  className,
  'aria-label': ariaLabel = 'Audio recorder',
  audioUrl,
  disabled = false,
  renderControls,
}: AudioRecorderProps) {
  // State
  const [internalState, setInternalState] =
    React.useState<AudioRecorderState>('idle');
  const state = controlledState ?? internalState;

  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = React.useState<string | null>(
    null
  );
  const [pendingBlob, setPendingBlob] = React.useState<Blob | null>(null);

  // Refs
  const waveformRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = React.useRef<any>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<number | undefined>(undefined);
  const startTimeRef = React.useRef<number>(0);
  const handleStopRef = React.useRef<() => void>(() => {});

  // Update state
  const updateState = React.useCallback(
    (newState: AudioRecorderState) => {
      if (!controlledState) {
        setInternalState(newState);
      }
      onStateChange?.(newState);
    },
    [controlledState, onStateChange]
  );

  // Initialize WaveSurfer for playback
  const initWaveSurfer = React.useCallback(async () => {
    if (!waveformRef.current || !showWaveform) return;

    // Dynamically import WaveSurfer
    const WaveSurferModule = await import('wavesurfer.js');
    const WaveSurfer = WaveSurferModule.default;

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Get computed styles for theming
    const computedStyle = getComputedStyle(document.documentElement);
    const defaultWaveColor =
      computedStyle.getPropertyValue('--color-primary-400').trim() || '#60a5fa';
    const defaultProgressColor =
      computedStyle.getPropertyValue('--color-primary-600').trim() || '#2563eb';
    const defaultCursorColor =
      computedStyle.getPropertyValue('--color-primary-800').trim() || '#1e40af';

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: waveColor || defaultWaveColor,
      progressColor: progressColor || defaultProgressColor,
      cursorColor: cursorColor || defaultCursorColor,
      cursorWidth: 2,
      height: waveformHeight,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      hideScrollbar: true,
    });

    const ws = wavesurferRef.current;

    ws.on('timeupdate', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('ready', () => {
      if (wavesurferRef.current) {
        setDuration(wavesurferRef.current.getDuration());
      }
    });

    ws.on('finish', () => {
      updateState('stopped');
    });
  }, [
    showWaveform,
    waveColor,
    progressColor,
    cursorColor,
    waveformHeight,
    updateState,
  ]);

  // Load audio URL if provided
  React.useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      wavesurferRef.current.load(audioUrl);
      updateState('stopped');
    }
  }, [audioUrl, updateState]);

  // Load pending blob into WaveSurfer after the waveform container becomes available
  React.useEffect(() => {
    if (pendingBlob && waveformRef.current && state === 'stopped') {
      const loadBlob = async () => {
        // Initialize WaveSurfer if needed
        if (!wavesurferRef.current) {
          await initWaveSurfer();
        }
        // Load the blob
        if (wavesurferRef.current && pendingBlob) {
          wavesurferRef.current.loadBlob(pendingBlob);
          setPendingBlob(null);
        }
      };
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(loadBlob, 50);
      return () => clearTimeout(timer);
    }
  }, [pendingBlob, state, initWaveSurfer]);

  // Initialize on mount
  React.useEffect(() => {
    initWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioObjectUrl) {
        URL.revokeObjectURL(audioObjectUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initWaveSurfer, audioObjectUrl]);

  // Start recording
  const handleRecord = React.useCallback(async () => {
    if (disabled) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Create media recorder
      const options = { mimeType };
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to default
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

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Clean up old URL
        if (audioObjectUrl) {
          URL.revokeObjectURL(audioObjectUrl);
        }

        const url = URL.createObjectURL(blob);
        setAudioObjectUrl(url);

        // Store the blob to load after the waveform container is rendered
        setPendingBlob(blob);

        onRecordingComplete?.(blob, duration);
        updateState('stopped');
      };

      // Start recording
      mediaRecorderRef.current.start(100);
      startTimeRef.current = Date.now();
      updateState('recording');
      onRecordingStart?.();

      // Start timer
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);
        setDuration(elapsed);

        // Check max duration
        if (maxDuration > 0 && elapsed >= maxDuration) {
          handleStopRef.current();
        }
      }, 100);
    } catch (error) {
      onError?.(error as Error);
      updateState('idle');
    }
  }, [
    disabled,
    mimeType,
    maxDuration,
    audioObjectUrl,
    duration,
    initWaveSurfer,
    onRecordingComplete,
    onRecordingStart,
    onError,
    updateState,
  ]);

  // Pause recording
  const handlePause = React.useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      updateState('paused');
    } else if (
      wavesurferRef.current &&
      (state === 'playback' || state === 'stopped')
    ) {
      wavesurferRef.current.pause();
      updateState('paused');
    }
  }, [state, updateState]);

  // Resume recording
  const handleResume = React.useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume();
      const pausedTime = currentTime;
      startTimeRef.current = Date.now() - pausedTime * 1000;
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);
        setDuration(elapsed);

        if (maxDuration > 0 && elapsed >= maxDuration) {
          handleStopRef.current();
        }
      }, 100);
      updateState('recording');
    } else if (wavesurferRef.current && state === 'paused') {
      wavesurferRef.current.play();
      updateState('playback');
    }
  }, [currentTime, maxDuration, state, updateState]);

  // Stop recording
  const handleStop = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' ||
        mediaRecorderRef.current.state === 'paused')
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    // State will be updated in onstop handler
  }, []);

  // Keep ref updated for use inside intervals
  handleStopRef.current = handleStop;

  // Play recording
  const handlePlay = React.useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play();
      updateState('playback');
    }
  }, [updateState]);

  // Seek
  const handleSeek = React.useCallback((time: number) => {
    if (wavesurferRef.current) {
      const progress = time / wavesurferRef.current.getDuration();
      wavesurferRef.current.seekTo(progress);
      setCurrentTime(time);
    }
  }, []);

  // Delete recording
  const handleDelete = React.useCallback(() => {
    setAudioBlob(null);
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
      setAudioObjectUrl(null);
    }
    setCurrentTime(0);
    setDuration(0);
    updateState('idle');
  }, [audioObjectUrl, updateState]);

  // Computed values
  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isPlaying = state === 'playback';
  const hasRecording = audioBlob !== null || audioUrl !== undefined;

  // Control render props
  const controlRenderProps: AudioRecorderControlsRenderProps = {
    state,
    currentTime,
    duration,
    isRecording,
    isPaused,
    isPlaying,
    onRecord: handleRecord,
    onPause: handlePause,
    onResume: handleResume,
    onStop: handleStop,
    onPlay: handlePlay,
    onSeek: handleSeek,
    formatTime,
  };

  return (
    <div
      className={cn(audioRecorderVariants({ size, variant }), className)}
      role="group"
      aria-label={ariaLabel}
    >
      {/* Waveform / Visualizer */}
      {showWaveform && (
        <div
          className={cn(waveformContainerVariants({ state }))}
          style={{ height: waveformHeight }}
        >
          {(state === 'recording' || state === 'listening') && !hasRecording ? (
            <LiveVisualizer
              analyser={analyserRef.current}
              isActive={isRecording}
              height={waveformHeight}
              barColor={waveColor}
            />
          ) : (
            <div ref={waveformRef} className="w-full" />
          )}
        </div>
      )}

      {/* Status and Time */}
      {showTime && (
        <div className="flex items-center justify-between">
          <RecordingIndicator isRecording={isRecording} isPaused={isPaused} />
          <TimeDisplay
            currentTime={currentTime}
            duration={duration}
            maxDuration={maxDuration}
            showMax={isRecording || isPaused}
          />
        </div>
      )}

      {/* Controls */}
      {renderControls ? (
        renderControls(controlRenderProps)
      ) : (
        <DefaultControls
          {...controlRenderProps}
          disabled={disabled}
          hasRecording={hasRecording}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

AudioRecorder.displayName = 'AudioRecorder';

// ============================================================================
// Default Controls
// ============================================================================

interface DefaultControlsProps extends AudioRecorderControlsRenderProps {
  disabled?: boolean;
  hasRecording: boolean;
  onDelete: () => void;
}

function DefaultControls({
  state,
  isRecording,
  isPaused,
  isPlaying,
  hasRecording,
  disabled,
  onRecord,
  onPause,
  onResume,
  onStop,
  onPlay,
  onDelete,
}: DefaultControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Delete button - only when we have a recording */}
      {hasRecording && !isRecording && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className={cn(
            controlButtonVariants({ variant: 'ghost', size: 'md' })
          )}
          aria-label="Delete recording"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      )}

      {/* Main control button */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={onRecord}
          disabled={disabled}
          className={cn(
            controlButtonVariants({ variant: 'danger', size: 'lg' })
          )}
          aria-label="Start recording"
        >
          <MicrophoneIcon className="h-6 w-6" />
        </button>
      )}

      {isRecording && (
        <>
          <button
            type="button"
            onClick={onPause}
            disabled={disabled}
            className={cn(
              controlButtonVariants({ variant: 'secondary', size: 'md' })
            )}
            aria-label="Pause recording"
          >
            <PauseIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={disabled}
            className={cn(
              controlButtonVariants({ variant: 'danger', size: 'lg' })
            )}
            aria-label="Stop recording"
          >
            <StopIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {isPaused && !hasRecording && (
        <>
          <button
            type="button"
            onClick={onResume}
            disabled={disabled}
            className={cn(
              controlButtonVariants({ variant: 'danger', size: 'lg' })
            )}
            aria-label="Resume recording"
          >
            <MicrophoneIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={disabled}
            className={cn(
              controlButtonVariants({ variant: 'secondary', size: 'md' })
            )}
            aria-label="Stop recording"
          >
            <StopIcon className="h-5 w-5" />
          </button>
        </>
      )}

      {(state === 'stopped' || (isPaused && hasRecording)) && hasRecording && (
        <button
          type="button"
          onClick={isPlaying || isPaused ? onPause : onPlay}
          disabled={disabled}
          className={cn(
            controlButtonVariants({ variant: 'primary', size: 'lg' })
          )}
          aria-label={
            isPaused
              ? 'Resume playback'
              : isPlaying
                ? 'Pause playback'
                : 'Play recording'
          }
        >
          {isPaused || !isPlaying ? (
            <PlayIcon className="h-6 w-6" />
          ) : (
            <PauseIcon className="h-6 w-6" />
          )}
        </button>
      )}

      {isPlaying && (
        <button
          type="button"
          onClick={onPause}
          disabled={disabled}
          className={cn(
            controlButtonVariants({ variant: 'primary', size: 'lg' })
          )}
          aria-label="Pause playback"
        >
          <PauseIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export {
  AudioRecorder,
  audioRecorderVariants,
  waveformContainerVariants,
  controlButtonVariants,
  formatTime,
};
