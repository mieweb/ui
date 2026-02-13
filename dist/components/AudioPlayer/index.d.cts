import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

type AudioPlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
/** Ref handle for controlling AudioPlayer programmatically */
interface AudioPlayerRef {
    /** The underlying container element */
    container: HTMLDivElement | null;
    /** Seek to a specific time in seconds */
    seekTo: (time: number) => void;
    /** Start playback */
    play: () => void;
    /** Pause playback */
    pause: () => void;
    /** Get current playback time in seconds */
    getCurrentTime: () => number;
    /** Get total duration in seconds */
    getDuration: () => number;
}
interface AudioPlayerProps extends VariantProps<typeof audioPlayerVariants> {
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
    /** Whether to show hover cursor on waveform for click-to-seek preview (for waveform variant) */
    showWaveformHoverCursor?: boolean;
    /** Color of the hover cursor line (for waveform variant) */
    waveformCursorColor?: string;
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
declare const audioPlayerVariants: (props?: ({
    variant?: "inline" | "compact" | "waveform" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const playButtonVariants: (props?: ({
    variant?: "inline" | "compact" | "waveform" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function formatTime(seconds: number): string;
interface ProgressBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    disabled?: boolean;
}
declare function ProgressBar({ currentTime, duration, onSeek, disabled, }: ProgressBarProps): react_jsx_runtime.JSX.Element;
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
 *
 * // With ref for programmatic control
 * const playerRef = useRef<AudioPlayerRef>(null);
 * <AudioPlayer ref={playerRef} src="/audio.mp3" variant="waveform" />
 * // Then: playerRef.current?.seekTo(30); playerRef.current?.play();
 * ```
 */
declare const AudioPlayer: React.ForwardRefExoticComponent<AudioPlayerProps & {
    preload?: boolean;
    fallbackDuration?: number;
} & React.RefAttributes<AudioPlayerRef>>;

export { AudioPlayer, type AudioPlayerProps, type AudioPlayerRef, type AudioPlayerState, ProgressBar, audioPlayerVariants, formatTime as formatAudioTime, playButtonVariants };
