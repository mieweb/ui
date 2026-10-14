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

/** Drive dictation from code, e.g. when a wake word fires. */
export interface DictationButtonHandle {
  /** Does nothing while `disabled` or while a take is already in progress. */
  start: () => void;
  /** Stop recording and transcribe. */
  stop: () => void;
  /** Discard the take; `onText` will not fire. */
  cancel: () => void;
}

export interface DictationButtonProps
  extends
    UseDictationOptions,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      // The ARIA attributes follow the dictation state; customise text through `labels`.
      | 'children'
      | 'onClick'
      | 'onError'
      | 'disabled'
      | 'className'
      | 'aria-label'
      | 'aria-pressed'
      | 'aria-busy'
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
  /** Start, stop or cancel from code. `ref` stays the `<button>`. */
  handleRef?: React.Ref<DictationButtonHandle>;
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
      getStream,
      disabled = false,
      size = 'sm',
      variant = 'ghost',
      showDuration = false,
      showStatus = false,
      labels: labelOverrides,
      className,
      handleRef,
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
      getStream,
    });

    // Covers a pending permission prompt (status still idle) and transcribing, not just recording.
    React.useEffect(() => {
      if (disabled) cancel();
    }, [disabled, cancel]);

    React.useImperativeHandle(
      handleRef,
      () => ({
        start: () => {
          if (!disabled) void start();
        },
        stop,
        cancel,
      }),
      [disabled, start, stop, cancel]
    );

    // Document-level so Escape works while focus stays in the composer.
    React.useEffect(() => {
      if (status !== 'recording') return;
      const onEscape = (e: KeyboardEvent) => {
        if (e.key !== 'Escape' || e.defaultPrevented) return;
        e.preventDefault();
        cancel();
      };
      document.addEventListener('keydown', onEscape);
      return () => document.removeEventListener('keydown', onEscape);
    }, [status, cancel]);

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
