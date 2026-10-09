import * as React from 'react';
import {
  RecordButton,
  formatDuration,
  type RecordButtonSize,
  type RecordButtonState,
  type RecordButtonVariant,
} from '../RecordButton';
import { cn } from '../../utils/cn';
import {
  useDictation,
  type DictationStatus,
  type UseDictationOptions,
} from './useDictation';

export interface DictationButtonLabels {
  start: string;
  stop: string;
  listening: string;
  transcribing: string;
  error: string;
  micBlocked: string;
}

export const defaultDictationLabels: DictationButtonLabels = {
  start: 'Start dictation',
  stop: 'Stop dictation',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  error: 'Dictation failed. Try again.',
  micBlocked: 'Microphone access is blocked.',
};

export interface DictationButtonProps
  extends
    UseDictationOptions,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'children' | 'onClick' | 'onError' | 'disabled' | 'className'
    > {
  disabled?: boolean;
  size?: RecordButtonSize;
  variant?: RecordButtonVariant;
  /** Show `m:ss` while recording. */
  showDuration?: boolean;
  /** Show the listening/transcribing/error caption. It is always announced to screen readers. */
  showStatus?: boolean;
  /** Override any user-facing string (i18n). */
  labels?: Partial<DictationButtonLabels>;
  className?: string;
}

const buttonState: Record<DictationStatus, RecordButtonState> = {
  idle: 'idle',
  recording: 'recording',
  transcribing: 'processing',
  error: 'error',
};

/**
 * Mic button that turns speech into editable text via `onText`. Never sends anything itself.
 * Escape while recording discards the take.
 */
export const DictationButton = React.forwardRef<
  HTMLButtonElement,
  DictationButtonProps
>(
  (
    {
      onText,
      transcribe,
      onError,
      maxDurationSeconds,
      disabled = false,
      size = 'sm',
      variant = 'ghost',
      showDuration = false,
      showStatus = false,
      labels: labelOverrides,
      className,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const labels = { ...defaultDictationLabels, ...labelOverrides };
    const { status, error, elapsedMs, start, stop, cancel } = useDictation({
      onText,
      transcribe,
      onError,
      maxDurationSeconds,
    });

    // Covers a pending permission prompt (status still idle) and transcribing, not just recording.
    React.useEffect(() => {
      if (disabled) cancel();
    }, [disabled, cancel]);

    const errorText =
      error?.name === 'NotAllowedError' ? labels.micBlocked : labels.error;
    const statusText =
      status === 'recording'
        ? labels.listening
        : status === 'transcribing'
          ? labels.transcribing
          : status === 'error'
            ? errorText
            : '';
    const ariaLabel =
      status === 'recording'
        ? labels.stop
        : status === 'transcribing'
          ? labels.transcribing
          : status === 'error'
            ? errorText
            : labels.start;

    return (
      <div
        data-slot="dictation-button"
        className={cn('inline-flex items-center gap-2', className)}
      >
        <RecordButton
          {...rest}
          ref={ref}
          state={disabled ? 'disabled' : buttonState[status]}
          disabled={disabled}
          size={size}
          variant={variant}
          aria-label={ariaLabel}
          onClick={() => {
            if (status === 'recording') stop();
            else void start();
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (e.key === 'Escape' && status === 'recording') {
              e.preventDefault();
              cancel();
            }
          }}
        />
        {showDuration && status === 'recording' && (
          <span
            data-slot="dictation-button-duration"
            className="text-destructive font-mono text-xs tabular-nums"
          >
            {formatDuration(elapsedMs / 1000)}
          </span>
        )}
        <span
          role="status"
          data-slot="dictation-button-status"
          className={cn(
            'text-xs',
            status === 'error' ? 'text-destructive' : 'text-muted-foreground',
            !showStatus && 'sr-only'
          )}
        >
          {statusText}
        </span>
      </div>
    );
  }
);

DictationButton.displayName = 'DictationButton';
