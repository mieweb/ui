import { useVirtualizer } from '@tanstack/react-virtual';
import { Pause, Play } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../../../utils/cn';
import type { TranscriptPlayerLabels } from './labels';
import { formatClock, type PlayerSpeaker, type Utterance } from './model';

/** Plain rendering is simpler and fine below this; above it rows are virtualized. */
const VIRTUALIZE_AFTER = 150;
const FOLLOW_SCROLL_MS = 400;
const USER_SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

function highlight(text: string, query: string): React.ReactNode {
  const needle = query.trim();
  if (!needle) return text;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-sm bg-yellow-200 dark:bg-yellow-700">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const Row = React.memo(function Row({
  utterance,
  speaker,
  overlap,
  active,
  playing,
  query,
  onPlay,
  onPause,
  labels,
  setSize,
  posInSet,
}: {
  utterance: Utterance;
  speaker: PlayerSpeaker | undefined;
  /** Names of the other speakers talking at the same time, already joined. */
  overlap: string | undefined;
  active: boolean;
  playing: boolean;
  query: string;
  onPlay: (u: Utterance) => void;
  onPause: () => void;
  labels: TranscriptPlayerLabels;
  /** Set when virtualized, so screen readers know the full length and position. */
  setSize?: number;
  posInSet?: number;
}) {
  const name = speaker?.name ?? labels.unknownSpeaker;
  const color = speaker?.color ?? 'currentColor';
  const time = formatClock(utterance.start);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- whole-row click target; keyboard users use the row's play button
    <div
      role="listitem"
      data-id={utterance.id}
      aria-current={active || undefined}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      onClick={() => onPlay(utterance)}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm',
        active ? 'bg-primary-50 dark:bg-primary-950/40' : 'hover:bg-muted/60'
      )}
    >
      <button
        type="button"
        aria-label={labels.playLine(name, time)}
        aria-pressed={playing}
        onClick={(e) => {
          e.stopPropagation();
          if (playing) onPause();
          else onPlay(utterance);
        }}
        className="border-border text-foreground hover:bg-muted focus-visible:ring-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none"
      >
        {playing ? (
          <Pause aria-hidden="true" className="h-3 w-3 fill-current" />
        ) : (
          <Play aria-hidden="true" className="ms-0.5 h-3 w-3 fill-current" />
        )}
      </button>
      <span className="text-muted-foreground w-12 shrink-0 pt-0.5 text-xs tabular-nums">
        {time}
      </span>
      <span
        className="text-foreground flex w-24 shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        }}
      >
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate">{name}</span>
      </span>
      <span className="min-w-0 flex-1">
        {utterance.text ? (
          highlight(utterance.text, query)
        ) : (
          <span className="text-muted-foreground italic">{labels.noWords}</span>
        )}
        {overlap && (
          <span className="text-muted-foreground border-border ms-2 inline-block max-w-full rounded border px-1.5 text-[11px] break-words">
            {labels.overlapWith(overlap)}
          </span>
        )}
      </span>
    </div>
  );
});

export interface TranscriptListProps {
  utterances: readonly Utterance[];
  speakersById: ReadonlyMap<string, PlayerSpeaker>;
  activeId: string | null;
  playingId: string | null;
  query: string;
  onPlay: (u: Utterance) => void;
  onPause: () => void;
  emptyMessage: string;
  labels: TranscriptPlayerLabels;
}

/**
 * Fixed-height transcript that follows playback until the reader scrolls it themselves; then a
 * "Back to current" button re-attaches it.
 */
export function TranscriptList({
  utterances,
  speakersById,
  activeId,
  playingId,
  query,
  onPlay,
  onPause,
  emptyMessage,
  labels,
}: TranscriptListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [detached, setDetached] = React.useState(false);
  /** Until this time, scroll events come from our own follow-along, not the reader. */
  const followUntil = React.useRef(0);
  const virtualize = utterances.length > VIRTUALIZE_AFTER;
  const virtualizer = useVirtualizer({
    count: virtualize ? utterances.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
    overscan: 12,
    getItemKey: (index) => utterances[index]?.id ?? index,
  });

  const scrollToActive = React.useCallback(() => {
    if (!activeId) return;
    followUntil.current = Date.now() + FOLLOW_SCROLL_MS;
    if (virtualize) {
      const index = utterances.findIndex((u) => u.id === activeId);
      if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' });
      return;
    }
    scrollRef.current
      ?.querySelector(`[data-id="${activeId}"]`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId, utterances, virtualize, virtualizer]);

  React.useEffect(() => {
    if (!detached) scrollToActive();
  }, [activeId, detached, scrollToActive]);

  // Catches scrollbar drags too: the reader has scrolled away once the active line is out of view.
  const onScroll = () => {
    const container = scrollRef.current;
    if (detached || !activeId || !container || Date.now() < followUntil.current)
      return;
    const line = container
      .querySelector(`[data-id="${activeId}"]`)
      ?.getBoundingClientRect();
    const view = container.getBoundingClientRect();
    if (!line || line.bottom <= view.top || line.top >= view.bottom)
      setDetached(true);
  };

  const play = React.useCallback(
    (u: Utterance) => {
      setDetached(false);
      onPlay(u);
    },
    [onPlay]
  );

  const row = (u: Utterance, index?: number) => (
    <Row
      utterance={u}
      speaker={speakersById.get(u.speakerId)}
      overlap={u.overlapSpeakerIds
        ?.map((id) => speakersById.get(id)?.name ?? id)
        .join(', ')}
      active={u.id === activeId}
      playing={u.id === playingId}
      query={query}
      onPlay={play}
      onPause={onPause}
      labels={labels}
      setSize={index === undefined ? undefined : utterances.length}
      posInSet={index === undefined ? undefined : index + 1}
    />
  );

  if (utterances.length === 0)
    return (
      <p
        role="status"
        className="text-muted-foreground flex h-80 items-center justify-center p-6 text-center text-sm"
      >
        {emptyMessage}
      </p>
    );

  return (
    <div className="relative">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the handlers only notice the reader scrolling */}
      <div
        ref={scrollRef}
        role="list"
        aria-label={labels.transcript}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable
        tabIndex={0}
        onWheel={() => setDetached(true)}
        onTouchMove={() => setDetached(true)}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && USER_SCROLL_KEYS.has(e.key))
            setDetached(true);
        }}
        className="focus-visible:ring-ring h-80 overflow-y-auto rounded-lg focus-visible:ring-2 focus-visible:outline-none"
      >
        {virtualize ? (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${item.start}px)` }}
              >
                {row(utterances[item.index], item.index)}
              </div>
            ))}
          </div>
        ) : (
          utterances.map((u) => (
            <React.Fragment key={u.id}>{row(u)}</React.Fragment>
          ))
        )}
      </div>
      {detached && activeId && (
        <button
          type="button"
          onClick={() => {
            setDetached(false);
            scrollToActive();
          }}
          className="bg-primary-800 hover:bg-primary-900 focus-visible:ring-ring absolute end-4 bottom-3 rounded-full px-3 py-1 text-xs font-medium text-white shadow focus-visible:ring-2 focus-visible:outline-none"
        >
          {labels.backToCurrent}
        </button>
      )}
    </div>
  );
}
