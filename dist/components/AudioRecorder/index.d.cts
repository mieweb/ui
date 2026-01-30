import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

type AudioRecorderState = 'idle' | 'listening' | 'recording' | 'paused' | 'stopped' | 'playback';
interface AudioRecorderProps extends VariantProps<typeof audioRecorderVariants> {
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
interface AudioRecorderControlsRenderProps {
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
declare const audioRecorderVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    variant?: "default" | "minimal" | "elevated" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const waveformContainerVariants: (props?: ({
    state?: "paused" | "idle" | "listening" | "recording" | "stopped" | "playback" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const controlButtonVariants: (props?: ({
    variant?: "primary" | "secondary" | "ghost" | "danger" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function formatTime(seconds: number): string;
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
declare function AudioRecorder({ state: controlledState, onStateChange, onRecordingComplete, onRecordingStart, onError, maxDuration, mimeType, waveColor, progressColor, cursorColor, waveformHeight, showTime, showWaveform, size, variant, className, 'aria-label': ariaLabel, audioUrl, disabled, renderControls, }: AudioRecorderProps): react_jsx_runtime.JSX.Element;
declare namespace AudioRecorder {
    var displayName: string;
}

export { AudioRecorder, type AudioRecorderControlsRenderProps, type AudioRecorderProps, type AudioRecorderState, audioRecorderVariants, controlButtonVariants, formatTime, waveformContainerVariants };
