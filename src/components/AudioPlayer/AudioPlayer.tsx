import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AudioPlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error';

export interface AudioPlayerProps extends VariantProps<
  typeof audioPlayerVariants
> {
  /** Audio source URL */
  src: string;
  /** Title/label for the audio (used for accessibility and display) */
  title?: string;
  /** Callback when playback state changes */
  onStateChange?: (state: AudioPlayerState) => void;
  /** Callback when playback ends */
  onEnded?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when time updates during playback */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Whether to show the time display */
  showTime?: boolean;
  /** Whether to show the duration (for inline variant) */
  showDuration?: boolean;
  /** Waveform color (for waveform variant) */
  waveColor?: string;
  /** Progress/played waveform color (for waveform variant) */
  progressColor?: string;
  /** Height of the waveform (for waveform variant) */
  waveformHeight?: number;
  /** Whether the player is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** Playback speed options */
  playbackRates?: number[];
  /** Whether to show playback speed control */
  showPlaybackRate?: boolean;
}

// ============================================================================
// Variants
// ============================================================================

const audioPlayerVariants = cva('', {
  variants: {
    variant: {
      inline: 'inline-flex items-center gap-2',
      compact: [
        'flex items-center gap-3 p-3',
        'rounded-lg border border-border',
        'bg-card text-card-foreground',
      ],
      waveform: [
        'flex flex-col gap-3 p-4',
        'rounded-xl border border-border',
        'bg-card text-card-foreground',
      ],
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { variant: 'compact', size: 'sm', class: 'p-2 gap-2' },
    { variant: 'compact', size: 'lg', class: 'p-4 gap-4' },
    { variant: 'waveform', size: 'sm', class: 'p-3 gap-2' },
    { variant: 'waveform', size: 'lg', class: 'p-5 gap-4' },
  ],
  defaultVariants: {
    variant: 'compact',
    size: 'md',
  },
});

const playButtonVariants = cva(
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
        inline: [
          'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100',
          'dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800',
        ],
        compact: [
          'bg-primary-600 text-white',
          'hover:bg-primary-700',
          'active:bg-primary-800',
        ],
        waveform: [
          'bg-primary-600 text-white',
          'hover:bg-primary-700',
          'active:bg-primary-800',
        ],
      },
      size: {
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'compact',
      size: 'md',
    },
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Icons
// ============================================================================

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
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
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
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
// Progress Bar Component (for compact variant)
// ============================================================================

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
}

function ProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled,
}: ProgressBarProps) {
  const progressRef = React.useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  return (
    <div
      ref={progressRef}
      role="slider"
      aria-label="Audio progress"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'relative h-1.5 flex-1 cursor-pointer rounded-full bg-neutral-200 dark:bg-neutral-700',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (disabled) return;
        const step = duration * 0.05; // 5% steps
        if (e.key === 'ArrowRight') {
          onSeek(Math.min(currentTime + step, duration));
        } else if (e.key === 'ArrowLeft') {
          onSeek(Math.max(currentTime - step, 0));
        }
      }}
    >
      <div
        className="bg-primary-600 absolute inset-y-0 left-0 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />
      <div
        className="bg-primary-600 absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-sm transition-all"
        style={{ left: `calc(${progress}% - 6px)` }}
      />
    </div>
  );
}

// ============================================================================
// Waveform Component (lazy-loaded WaveSurfer)
// ============================================================================

interface WaveformProps {
  src: string;
  isPlaying: boolean;
  playbackRate?: number;
  onReady: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onFinish: () => void;
  onSeek: (time: number) => void;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  showHoverCursor?: boolean;
  onHoverTimeChange?: (time: number | null) => void;
  cursorColor?: string;
}

function Waveform({
  src,
  isPlaying,
  playbackRate = 1,
  onReady,
  onTimeUpdate,
  onFinish,
  onSeek,
  waveColor,
  progressColor,
  height = 64,
  showHoverCursor = false,
  onHoverTimeChange,
  cursorColor = 'rgba(239, 68, 68, 0.8)',
}: WaveformProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = React.useRef<any>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [hoverPosition, setHoverPosition] = React.useState(0);

  // Initialize WaveSurfer
  React.useEffect(() => {
    if (!containerRef.current) return;

    const initWaveSurfer = async () => {
      try {
        const WaveSurfer = (await import('wavesurfer.js')).default;

        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        wavesurferRef.current = WaveSurfer.create({
          container: containerRef.current!,
          waveColor: waveColor || '#d1d5db',
          progressColor: progressColor || 'var(--color-primary-600, #2563eb)',
          cursorColor: 'transparent',
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          height,
          normalize: true,
          interact: !showHoverCursor,
        });

        wavesurferRef.current.on('ready', () => {
          setIsLoaded(true);
          onReady(wavesurferRef.current.getDuration());
        });

        wavesurferRef.current.on('audioprocess', () => {
          onTimeUpdate(wavesurferRef.current.getCurrentTime());
        });

        wavesurferRef.current.on('seeking', () => {
          onTimeUpdate(wavesurferRef.current.getCurrentTime());
        });

        if (!showHoverCursor) {
          wavesurferRef.current.on('interaction', () => {
            onSeek(wavesurferRef.current.getCurrentTime());
          });
        }

        wavesurferRef.current.on('finish', () => {
          onFinish();
        });

        wavesurferRef.current.load(src);
      } catch (error) {
        console.error('Failed to load WaveSurfer:', error);
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, showHoverCursor]);

  // Handle play/pause
  React.useEffect(() => {
    if (!wavesurferRef.current || !isLoaded) return;

    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isLoaded]);

  // Handle playback rate changes
  React.useEffect(() => {
    if (!wavesurferRef.current || !isLoaded) return;
    wavesurferRef.current.setPlaybackRate(playbackRate);
  }, [playbackRate, isLoaded]);

  // Hover cursor handlers
  const handleMouseMove = showHoverCursor
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !wavesurferRef.current || !isLoaded) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const duration = wavesurferRef.current.getDuration();
        setHoverPosition(percentage * 100);
        onHoverTimeChange?.(percentage * duration);
      }
    : undefined;

  const handleMouseEnter = showHoverCursor ? () => setIsHovering(true) : undefined;

  const handleMouseLeave = showHoverCursor
    ? () => {
        setIsHovering(false);
        setHoverPosition(0);
        onHoverTimeChange?.(null);
      }
    : undefined;

  const handleClick = showHoverCursor
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !wavesurferRef.current || !isLoaded) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        wavesurferRef.current.seekTo(percentage);
        onSeek(wavesurferRef.current.getDuration() * percentage);
        onHoverTimeChange?.(null);
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-lg bg-neutral-100 dark:bg-neutral-800',
        showHoverCursor && 'cursor-pointer',
        !isLoaded && 'animate-pulse'
      )}
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Hover cursor line */}
      {showHoverCursor && isHovering && isLoaded && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5"
          style={{ left: `${hoverPosition}%`, backgroundColor: cursorColor }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Main AudioPlayer Component
// ============================================================================

/**
 * A versatile audio player component with multiple display variants.
 *
 * @example
 * ```tsx
 * // Inline - minimal, just play button and duration
 * <AudioPlayer src="/audio.mp3" variant="inline" showDuration />
 *
 * // Compact - play button, progress bar, and time
 * <AudioPlayer src="/audio.mp3" variant="compact" showTime />
 *
 * // Waveform - full visualization with WaveSurfer
 * <AudioPlayer src="/audio.mp3" variant="waveform" showTime />
 * ```
 */
function AudioPlayer({
  src,
  title,
  variant = 'compact',
  size = 'md',
  onStateChange,
  onEnded,
  onError,
  onTimeUpdate,
  showTime = true,
  showDuration = true,
  waveColor,
  progressColor,
  waveformHeight = 64,
  disabled = false,
  className,
  'aria-label': ariaLabel,
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  showPlaybackRate = false,
  /** Whether to preload audio (set to false for lists with many items) */
  preload = false,
  /** Fallback duration in seconds to display before audio is loaded */
  fallbackDuration,
}: AudioPlayerProps & { preload?: boolean; fallbackDuration?: number }) {
  const [state, setState] = React.useState<AudioPlayerState>('idle');
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [audioInitialized, setAudioInitialized] = React.useState(false);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const audioRef = React.useRef<globalThis.HTMLAudioElement | null>(null);

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';

  // Update state helper
  const updateState = React.useCallback(
    (newState: AudioPlayerState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Initialize audio element (for non-waveform variants)
  const initAudio = React.useCallback(() => {
    if (variant === 'waveform' || audioInitialized) return null;

    const audio = new globalThis.Audio(src);
    audioRef.current = audio;
    setAudioInitialized(true);

    audio.addEventListener('loadstart', () => updateState('loading'));
    audio.addEventListener('canplay', () => {
      updateState('idle');
    });
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration);
    });
    audio.addEventListener('ended', () => {
      updateState('idle');
      setCurrentTime(0);
      onEnded?.();
    });
    audio.addEventListener('error', () => {
      updateState('error');
      onError?.(new Error('Failed to load audio'));
    });

    return audio;
  }, [
    src,
    variant,
    audioInitialized,
    updateState,
    onTimeUpdate,
    onEnded,
    onError,
  ]);

  // Auto-initialize if preload is true
  React.useEffect(() => {
    if (preload && !audioInitialized && variant !== 'waveform') {
      initAudio();
    }
  }, [preload, audioInitialized, variant, initAudio]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle playback rate changes
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlay = React.useCallback(() => {
    if (disabled) return;

    // Waveform variant uses WaveSurfer for playback - just toggle state
    if (variant === 'waveform') {
      if (isLoading) return;
      updateState(isPlaying ? 'paused' : 'playing');
      return;
    }

    // Lazy initialize audio on first play
    if (!audioInitialized && !isLoading) {
      const audio = initAudio();
      if (audio) {
        updateState('loading');
        audio.addEventListener(
          'canplay',
          () => {
            audio.play().catch((error) => {
              updateState('error');
              onError?.(error);
            });
            updateState('playing');
          },
          { once: true }
        );
      }
      return;
    }

    if (isLoading) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      updateState('paused');
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          updateState('error');
          onError?.(error);
        });
        updateState('playing');
      }
    }
  }, [
    disabled,
    variant,
    audioInitialized,
    isLoading,
    isPlaying,
    initAudio,
    updateState,
    onError,
  ]);

  const handleSeek = React.useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Waveform callbacks
  const handleWaveformReady = React.useCallback((dur: number) => {
    setDuration(dur);
    setState('idle');
  }, []);

  const handleWaveformTimeUpdate = React.useCallback(
    (time: number) => {
      setCurrentTime(time);
      onTimeUpdate?.(time, duration);
    },
    [duration, onTimeUpdate]
  );

  const handleWaveformFinish = React.useCallback(() => {
    updateState('idle');
    setCurrentTime(0);
    onEnded?.();
  }, [updateState, onEnded]);

  const handleWaveformSeek = React.useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleHoverTimeChange = React.useCallback((time: number | null) => {
    setHoverTime(time);
  }, []);

  const iconSize =
    size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (title) return `${isPlaying ? 'Pause' : 'Play'} ${title}`;
    return isPlaying ? 'Pause audio' : 'Play audio';
  };

  const renderPlayButton = () => (
    <button
      type="button"
      onClick={handlePlay}
      disabled={disabled || isLoading}
      className={cn(playButtonVariants({ variant, size }))}
      aria-label={getAriaLabel()}
      aria-pressed={isPlaying}
    >
      {isLoading ? (
        <SpinnerIcon className={iconSize} />
      ) : isPlaying ? (
        <PauseIcon className={iconSize} />
      ) : (
        <PlayIcon className={iconSize} />
      )}
    </button>
  );

  const renderTime = (useHoverTime = false) => {
    if (!showTime) return null;
    const displayTime = useHoverTime && hoverTime !== null ? hoverTime : currentTime;
    const isShowingHoverTime = useHoverTime && hoverTime !== null;
    return (
      <span className={cn(
        "font-mono text-xs tabular-nums",
        isShowingHoverTime 
          ? "text-primary-600 dark:text-primary-400" 
          : "text-neutral-500 dark:text-neutral-400"
      )}>
        {formatTime(displayTime)} / {formatTime(duration)}
      </span>
    );
  };

  const renderPlaybackRateControl = () => {
    if (!showPlaybackRate) return null;
    return (
      <select
        value={playbackRate}
        onChange={(e) => setPlaybackRate(Number(e.target.value))}
        className="rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-xs dark:border-neutral-700"
        aria-label="Playback speed"
      >
        {playbackRates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </select>
    );
  };

  // ============================================================================
  // Inline Variant
  // ============================================================================
  if (variant === 'inline') {
    const displayDuration = duration > 0 ? duration : (fallbackDuration ?? 0);
    return (
      <div className={cn(audioPlayerVariants({ variant, size }), className)}>
        {renderPlayButton()}
        {title && (
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {title}
          </span>
        )}
        {showDuration && displayDuration > 0 && (
          <span className="font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
            {isPlaying ? formatTime(currentTime) : formatTime(displayDuration)}
          </span>
        )}
      </div>
    );
  }

  // ============================================================================
  // Compact Variant
  // ============================================================================
  if (variant === 'compact') {
    return (
      <div className={cn(audioPlayerVariants({ variant, size }), className)}>
        {renderPlayButton()}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          disabled={disabled}
        />
        {renderTime()}
        {renderPlaybackRateControl()}
      </div>
    );
  }

  // ============================================================================
  // Waveform Variant
  // ============================================================================
  return (
    <div className={cn(audioPlayerVariants({ variant, size }), className)}>
      {title && (
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {title}
        </span>
      )}
      <Waveform
        src={src}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        onReady={handleWaveformReady}
        onTimeUpdate={handleWaveformTimeUpdate}
        onFinish={handleWaveformFinish}
        onSeek={handleWaveformSeek}
        waveColor={waveColor}
        progressColor={progressColor}
        height={waveformHeight}
        showHoverCursor
        onHoverTimeChange={handleHoverTimeChange}
      />
      <div className="flex items-center gap-3">
        {renderPlayButton()}
        <div className="flex flex-1 items-center justify-between">
          {renderTime(true)}
          {renderPlaybackRateControl()}
        </div>
      </div>
    </div>
  );
}

AudioPlayer.displayName = 'AudioPlayer';

// ============================================================================
// Exports
// ============================================================================

export { AudioPlayer, audioPlayerVariants, playButtonVariants, ProgressBar };
