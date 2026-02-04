import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';

type RecordButtonState = 'idle' | 'recording' | 'processing' | 'disabled' | 'error' | 'success';
type RecordButtonVariant = 'default' | 'outline' | 'ghost' | 'minimal';
type RecordButtonSize = 'sm' | 'md' | 'lg';
/** Transcription state for integration with transcription services */
type TranscriptionState = 'idle' | 'recording' | 'transcribing' | 'streaming' | 'complete' | 'error';
interface TranscriptionResult {
    /** The transcribed text */
    text: string;
    /** Whether this is a partial (streaming) or final result */
    isFinal: boolean;
    /** Confidence score (0-1) if available */
    confidence?: number;
}
interface RecordButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
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
declare const recordButtonVariants: (props?: ({
    variant?: "ghost" | "outline" | "default" | "minimal" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function formatDuration(seconds: number): string;
/**
 * A voice recording button with 6 states and 4 visual variants.
 * Supports pulse animations, waveform visualization, and transcription integration.
 *
 * ## Controlled vs Uncontrolled Mode
 *
 * **Uncontrolled mode** (default): The component manages its own recording state.
 * Use `onRecordingComplete`, `onRecordingStart`, and `onRecordingError` callbacks.
 *
 * **Controlled mode**: When the `state` prop is provided, the component becomes
 * controlled and you must manage state changes externally. Note: In controlled mode,
 * the internal MediaRecorder functionality is disabled - you must implement your own
 * recording logic.
 *
 * ## State Precedence
 *
 * When multiple state-controlling props are provided, they follow this precedence:
 * 1. `disabled` prop (highest priority)
 * 2. `transcriptionState` prop
 * 3. `state` prop
 * 4. Internal state (uncontrolled)
 *
 * @example
 * ```tsx
 * // Uncontrolled with recording callbacks
 * <RecordButton
 *   onRecordingComplete={(blob, duration) => console.log('Recorded:', blob)}
 *   onRecordingError={(error) => console.error('Recording failed:', error)}
 * />
 *
 * // Controlled state (requires external recording implementation)
 * <RecordButton state="idle" onClick={handleClick} />
 *
 * // Different variants
 * <RecordButton variant="outline" size="lg" />
 *
 * // With waveform animation
 * <RecordButton state="recording" showWaveform showPulse />
 * ```
 */
declare const RecordButton: React.ForwardRefExoticComponent<RecordButtonProps & React.RefAttributes<HTMLButtonElement>>;

export { RecordButton, type RecordButtonProps, type RecordButtonSize, type RecordButtonState, type RecordButtonVariant, type TranscriptionResult, type TranscriptionState, formatDuration, recordButtonVariants };
