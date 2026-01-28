import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

type RecordButtonState = 'idle' | 'recording' | 'processing';
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
interface RecordButtonProps extends VariantProps<typeof recordButtonVariants> {
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
declare const recordButtonVariants: (props?: ({
    variant?: "default" | "filled" | "primary" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const recordingIndicatorVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function formatDuration(seconds: number): string;
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
declare function RecordButton({ onRecordingComplete, onRecordingStart, onError, maxDuration, mimeType, disabled, variant, size, className, 'aria-label': ariaLabel, showDuration, idleIcon, recordingIcon, transcriptionState, showTranscriptionState, }: RecordButtonProps): react_jsx_runtime.JSX.Element;
declare namespace RecordButton {
    var displayName: string;
}

export { RecordButton, type RecordButtonProps, type RecordButtonState, type TranscriptionResult, type TranscriptionState, formatDuration, recordButtonVariants, recordingIndicatorVariants };
