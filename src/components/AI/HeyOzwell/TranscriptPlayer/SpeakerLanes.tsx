import { Play } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../../../utils/cn';
import { Button } from '../../../Button';
import type { TranscriptPlayerLabels } from './labels';
import {
  formatClock,
  type LaneSegment,
  type PlayerSpeaker,
  type TimelineView,
} from './model';

/** Shared by every timeline row so labels, waveform, lanes and overview line up. */
export const ROW_GRID =
  'grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3';

const HIDE_DELAY_MS = 150;

/** Fraction of `view` from its left edge, clamped to [0, 1]. */
export const viewFraction = (time: number, view: TimelineView) =>
  view.span > 0 ? Math.min(1, Math.max(0, (time - view.start) / view.span)) : 0;

/** Time under a pointer inside `element`, which spans `view`. */
export const timeAtPointer = (
  clientX: number,
  element: HTMLElement,
  view: TimelineView
) => {
  const rect = element.getBoundingClientRect();
  const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
  return view.start + Math.min(1, Math.max(0, ratio)) * view.span;
};

function describe(
  segment: LaneSegment,
  name: string,
  labels: TranscriptPlayerLabels
) {
  return labels.segment(
    name,
    formatClock(segment.start),
    formatClock(segment.end),
    labels.formatDuration(segment.end - segment.start)
  );
}

export interface SpeakerLanesProps {
  speakers: readonly PlayerSpeaker[];
  segments: readonly LaneSegment[];
  view: TimelineView;
  /** Id of the segment being played on its own. */
  playingId: string | null;
  onPlaySegment: (segment: LaneSegment) => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  labels: TranscriptPlayerLabels;
}

/**
 * One lane per speaker. Hover or focus a segment for its details (Escape hides them); click (or
 * Enter) plays just that segment, again pauses it; click empty lane space to seek. Arrow keys move
 * between a lane's segments in the visible window.
 */
export const SpeakerLanes = React.memo(function SpeakerLanes({
  speakers,
  segments,
  view,
  playingId,
  onPlaySegment,
  onPause,
  onSeek,
  labels,
}: SpeakerLanesProps) {
  const [hovered, setHovered] = React.useState<LaneSegment | null>(null);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const hideTimer = React.useRef<number | undefined>(undefined);
  const show = (segment: LaneSegment) => {
    window.clearTimeout(hideTimer.current);
    setHovered(segment);
  };
  const hide = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setHovered(null),
      HIDE_DELAY_MS
    );
  };
  React.useEffect(() => () => window.clearTimeout(hideTimer.current), []);
  // New segment data makes a hovered segment stale (old times, old interval).
  React.useEffect(() => {
    window.clearTimeout(hideTimer.current);
    setHovered(null);
  }, [segments]);
  // Escape dismisses the details wherever focus is (they also open on pointer hover).
  const lanesRef = React.useRef<HTMLDivElement>(null);
  const isOpen = hovered !== null;
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      // Swallow it only when it was meant for the lanes; elsewhere menus and dialogs still get it.
      if (lanesRef.current?.contains(document.activeElement))
        event.stopPropagation();
      window.clearTimeout(hideTimer.current);
      setHovered(null);
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen]);

  const end = view.start + view.span;
  // The focused segment stays rendered when the view moves, so keyboard focus is not dropped.
  const visible = segments.filter(
    (s) => (s.end > view.start && s.start < end) || s.id === focusedId
  );

  const onSegmentKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, (i: number, n: number) => number> = {
      ArrowRight: (i, n) => Math.min(n - 1, i + 1),
      ArrowLeft: (i) => Math.max(0, i - 1),
      Home: () => 0,
      End: (_, n) => n - 1,
    };
    const next = keys[event.key];
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[data-segment]'
      );
    if (!next || !buttons?.length) return;
    event.preventDefault();
    const index = Array.from(buttons).indexOf(event.currentTarget);
    buttons[next(index, buttons.length)]?.focus();
  };

  return (
    <div ref={lanesRef} className="space-y-1.5">
      {speakers.map((speaker) => {
        const lane = visible.filter((s) => s.speakerId === speaker.id);
        return (
          <div key={speaker.id} className={ROW_GRID}>
            <span className="text-muted-foreground truncate text-xs">
              {speaker.name}
            </span>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- click-to-seek on empty lane space; keyboard users seek with the Seek slider */}
            <div
              role="group"
              aria-label={labels.speakingTurns(speaker.name)}
              className="bg-muted relative h-4 cursor-pointer rounded-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget)
                  onSeek(timeAtPointer(e.clientX, e.currentTarget, view));
              }}
            >
              {lane.map((segment, i) => {
                const left = viewFraction(segment.start, view);
                const width = viewFraction(segment.end, view) - left;
                const isPlaying = segment.id === playingId;
                return (
                  <button
                    key={segment.id}
                    type="button"
                    data-segment
                    tabIndex={i === 0 ? 0 : -1}
                    aria-label={describe(segment, speaker.name, labels)}
                    aria-pressed={isPlaying}
                    onClick={() =>
                      isPlaying ? onPause() : onPlaySegment(segment)
                    }
                    onKeyDown={onSegmentKey}
                    onMouseEnter={() => show(segment)}
                    onMouseLeave={hide}
                    onFocus={() => {
                      setFocusedId(segment.id);
                      show(segment);
                    }}
                    onBlur={() => {
                      setFocusedId(null);
                      hide();
                    }}
                    className={cn(
                      // The outline keeps every turn's edges at 3:1+ against the lane, whatever the speaker colour.
                      'focus-visible:ring-ring absolute inset-y-0 rounded-sm ring-inset focus-visible:ring-2 focus-visible:outline-none',
                      isPlaying
                        ? 'ring-foreground ring-2'
                        : 'ring-foreground/70 ring-1'
                    )}
                    style={{
                      // rtl-ignore -- time axis inside the player's dir="ltr" timeline, matches clientX seek math
                      left: `${left * 100}%`,
                      width: `${width * 100}%`,
                      minWidth: 2,
                      backgroundColor: speaker.color,
                    }}
                  />
                );
              })}
              {hovered?.speakerId === speaker.id && (
                <div
                  className="absolute bottom-full z-20 mb-2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-md dark:bg-neutral-100 dark:text-neutral-900"
                  style={{
                    // Kept off the edges so the centred tooltip is never clipped.
                    // rtl-ignore -- time axis inside the player's dir="ltr" timeline
                    left: `${Math.min(85, Math.max(15, viewFraction((hovered.start + hovered.end) / 2, view) * 100))}%`,
                  }}
                  onMouseEnter={() => show(hovered)}
                  onMouseLeave={hide}
                >
                  <Button
                    type="button"
                    variant="primary"
                    size="icon-sm"
                    tabIndex={-1}
                    aria-label={labels.playSegment(
                      describe(hovered, speaker.name, labels)
                    )}
                    onClick={() => onPlaySegment(hovered)}
                    className="h-6 w-6 rounded-full"
                  >
                    <Play aria-hidden="true" className="h-3 w-3 fill-current" />
                  </Button>
                  <span>
                    <span className="block font-semibold">{speaker.name}</span>
                    <span className="tabular-nums opacity-75">
                      {labels.segmentRange(
                        formatClock(hovered.start),
                        formatClock(hovered.end),
                        labels.formatDuration(hovered.end - hovered.start)
                      )}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
