import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type {
  Transcript,
  TranscriptSegment,
  TranscriptWord,
} from './transcript';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type TranscriptGranularity = 'word' | 'segment';

export interface TranscriptViewProps extends VariantProps<
  typeof transcriptViewVariants
> {
  /** The transcript to render */
  transcript: Transcript;
  /**
   * Rendering granularity. Defaults to 'segment' when the transcript has
   * segments, otherwise 'word'.
   */
  granularity?: TranscriptGranularity;
  /** Controlled playback position (ms); the matching word/segment is highlighted */
  currentTimeMs?: number;
  /** Called with the start time (ms) of a clicked word/segment; the host performs the seek/play */
  onSeek?: (timeMs: number) => void;
  /** Auto-scroll the active word/segment into view (default true) */
  followPlayback?: boolean;
  /**
   * Maps Speaker.id to a display label (e.g. Clinician/Patient). Falls back to
   * Speaker.name from transcript.speakers, then the raw id.
   */
  speakerLabels?: Record<string, string>;
  /** Segment mode: merge consecutive same-speaker segments into one row (default false) */
  mergeSameSpeaker?: boolean;
  /** Segment mode: show mm:ss timestamps (default true) */
  showTimestamps?: boolean;
  /** Rendered in a header row (host supplies copy/re-transcribe/remove buttons) */
  actions?: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Accessible label for the transcript container (default 'Transcript') */
  'aria-label'?: string;
}

// ============================================================================
// Variants
// ============================================================================

const transcriptViewVariants = cva('flex flex-col text-foreground', {
  variants: {
    variant: {
      plain: '',
      card: 'rounded-xl border border-border bg-card text-card-foreground p-3',
    },
  },
  defaultVariants: {
    variant: 'plain',
  },
});

// ============================================================================
// Helpers
// ============================================================================

/** Format milliseconds as m:ss (osheet timestamp style) */
export function formatTimestampMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Resolve a speaker id to its display label */
function resolveSpeakerLabel(
  speakerId: string | undefined,
  speakerLabels: Record<string, string> | undefined,
  transcript: Transcript
): string | undefined {
  if (!speakerId) return undefined;
  return (
    speakerLabels?.[speakerId] ??
    transcript.speakers?.find((s) => s.id === speakerId)?.name ??
    speakerId
  );
}

/** A display row in segment mode (possibly the merge of several source segments) */
interface SegmentRow {
  text: string;
  startMs: number;
  endMs: number;
  speakerId?: string;
}

/**
 * Build segment display rows, optionally merging consecutive same-speaker
 * segments (osheet formatTranscriptText behavior). Empty segments are skipped.
 */
function buildSegmentRows(
  segments: TranscriptSegment[],
  merge: boolean
): SegmentRow[] {
  const rows: SegmentRow[] = [];
  for (const segment of segments) {
    const text = segment.text.trim();
    if (!text) continue;
    const prev = rows[rows.length - 1];
    if (merge && prev && prev.speakerId === segment.speakerId) {
      prev.text += ' ' + text;
      prev.endMs = segment.endMs;
    } else {
      rows.push({
        text,
        startMs: segment.startMs,
        endMs: segment.endMs,
        speakerId: segment.speakerId,
      });
    }
  }
  return rows;
}

/** Index of the item whose [startMs, endMs) range contains timeMs, or -1 */
function findActiveIndex(
  items: ReadonlyArray<{ startMs: number; endMs: number }>,
  timeMs: number | undefined
): number {
  if (timeMs === undefined) return -1;
  return items.findIndex(
    (item) => timeMs >= item.startMs && timeMs < item.endMs
  );
}

/** Run onActivate for click and Enter/Space keyboard activation */
function activationProps(onActivate: () => void) {
  return {
    onClick: onActivate,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only transcript viewer with word-level and segment-level (diarized)
 * rendering modes.
 *
 * Controlled and persistence-agnostic: the host owns playback and passes the
 * position via `currentTimeMs`; clicking a word/segment reports the target
 * time through `onSeek`. Segment mode matches the osheet artifact-viewer row
 * UX (timestamp | speaker | text, click to seek + play). Editing lives in
 * MediaEditor, not here.
 */
export const TranscriptView = React.forwardRef<
  HTMLDivElement,
  TranscriptViewProps
>(
  (
    {
      transcript,
      granularity,
      currentTimeMs,
      onSeek,
      followPlayback = true,
      speakerLabels,
      mergeSameSpeaker = false,
      showTimestamps = true,
      actions,
      variant,
      className,
      'aria-label': ariaLabel = 'Transcript',
    },
    ref
  ) => {
    const contentRef = React.useRef<HTMLDivElement>(null);
    const isHoveringRef = React.useRef(false);

    const resolvedGranularity: TranscriptGranularity =
      granularity ??
      (transcript.segments && transcript.segments.length > 0
        ? 'segment'
        : 'word');

    const segmentRows = React.useMemo(
      () =>
        resolvedGranularity === 'segment'
          ? buildSegmentRows(transcript.segments ?? [], mergeSameSpeaker)
          : [],
      [resolvedGranularity, transcript.segments, mergeSameSpeaker]
    );

    const activeIndex =
      resolvedGranularity === 'segment'
        ? findActiveIndex(segmentRows, currentTimeMs)
        : findActiveIndex(transcript.words, currentTimeMs);

    // Auto-scroll the active item into view, unless the user is hovering
    React.useEffect(() => {
      if (!followPlayback || activeIndex < 0 || isHoveringRef.current) return;
      const el = contentRef.current?.querySelector(
        `[data-transcript-index="${activeIndex}"]`
      );
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [followPlayback, activeIndex]);

    const seekTo = (timeMs: number) => onSeek?.(timeMs);

    // ------------------------------------------------------------------
    // Word mode rendering
    // ------------------------------------------------------------------
    const renderWord = (word: TranscriptWord, index: number) => {
      const isActive = index === activeIndex;
      const wordType = word.wordType ?? 'word';
      const durationSec = ((word.endMs - word.startMs) / 1000).toFixed(1);

      if (wordType === 'silence-newline') {
        // Longer pause: force a line break (block element inside inline flow)
        return (
          <span
            key={index}
            data-transcript-index={index}
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Silence, ${durationSec} seconds`}
            className={`hover:bg-muted focus-visible:ring-ring block h-3 cursor-pointer rounded transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              isActive ? 'bg-primary-500/20' : ''
            }`}
            {...activationProps(() => seekTo(word.startMs))}
          />
        );
      }

      if (wordType === 'silence') {
        // Short gap: subtle interpunct
        return (
          <span
            key={index}
            data-transcript-index={index}
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Silence, ${durationSec} seconds`}
            className={`text-muted-foreground/60 hover:bg-muted focus-visible:ring-ring cursor-pointer rounded px-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              isActive ? 'bg-primary-500/20' : ''
            }`}
            {...activationProps(() => seekTo(word.startMs))}
          >
            {'\u00B7 '}
          </span>
        );
      }

      return (
        <span
          key={index}
          data-transcript-index={index}
          role="button"
          tabIndex={0}
          aria-current={isActive ? 'true' : undefined}
          className={`hover:bg-muted focus-visible:ring-ring cursor-pointer rounded px-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none ${
            isActive ? 'bg-primary-500/20 text-foreground' : ''
          }`}
          {...activationProps(() => seekTo(word.startMs))}
        >
          {word.text}{' '}
        </span>
      );
    };

    // ------------------------------------------------------------------
    // Segment mode rendering (osheet artifact-viewer row parity)
    // ------------------------------------------------------------------
    const renderSegmentRow = (row: SegmentRow, index: number) => {
      const isActive = index === activeIndex;
      const speaker = resolveSpeakerLabel(
        row.speakerId,
        speakerLabels,
        transcript
      );

      return (
        <div key={index} role="listitem">
          <button
            type="button"
            data-transcript-index={index}
            aria-current={isActive ? 'true' : undefined}
            className={`hover:bg-muted focus-visible:ring-ring flex w-full cursor-pointer gap-3 rounded px-2 py-1 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              isActive ? 'bg-primary-500/20' : ''
            }`}
            onClick={() => seekTo(row.startMs)}
          >
            {showTimestamps && (
              <span className="text-muted-foreground w-12 shrink-0 font-mono">
                {formatTimestampMs(row.startMs)}
              </span>
            )}
            {speaker && (
              <span className="text-primary-900 w-24 shrink-0 font-semibold">
                {speaker}:
              </span>
            )}
            <span className="text-foreground">{row.text}</span>
          </button>
        </div>
      );
    };

    return (
      <div ref={ref} className={transcriptViewVariants({ variant, className })}>
        {actions && (
          <div className="border-border mb-2 flex items-center justify-end gap-2 border-b pb-2">
            {actions}
          </div>
        )}
        <div
          ref={contentRef}
          aria-label={ariaLabel}
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
          }}
          {...(resolvedGranularity === 'segment'
            ? { role: 'list', className: 'space-y-2' }
            : { className: 'text-sm leading-relaxed' })}
        >
          {resolvedGranularity === 'segment'
            ? segmentRows.map(renderSegmentRow)
            : transcript.words.map(renderWord)}
        </div>
      </div>
    );
  }
);

TranscriptView.displayName = 'TranscriptView';
