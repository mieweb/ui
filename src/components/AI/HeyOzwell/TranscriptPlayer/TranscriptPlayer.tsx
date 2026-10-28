/**
 * TranscriptPlayer (mieweb/ui#654): a clinical audio review surface. One playhead is shared by the
 * waveform, the who-spoke-when lanes, a zoomable overview of the whole recording and a searchable
 * transcript. Segments and transcript lines play just their own interval. Data is the library's
 * `Transcript`; its optional `speakerActivity` keeps overlapping speech intact in the lanes.
 */
import {
  LocateFixed,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Search,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as React from 'react';
import { cn } from '../../../../utils/cn';
import { Button } from '../../../Button';
import { Input } from '../../../Input/Input';
import { Select } from '../../../Select/Select';
import { Slider } from '../../../Slider/Slider';
import {
  PLAYBACK_SPEEDS,
  type Transcript,
} from '../../../TranscriptView/transcript';
import {
  DEFAULT_TRANSCRIPT_PLAYER_LABELS,
  type TranscriptPlayerLabels,
} from './labels';
import {
  activeUtteranceAt,
  clampView,
  filterUtterances,
  finiteSeconds,
  followView,
  formatClock,
  hasOverlap,
  initialView,
  MIN_VIEW_SECONDS,
  talkTime,
  ticksFor,
  toLaneSegments,
  toSpeakers,
  toUtterances,
  zoomView,
  type LaneSegment,
  type TimelineView,
  type Utterance,
} from './model';
import { useWaveformPeaks, type WaveformPeaks } from './peaks';
import {
  SpeakerLanes,
  ROW_GRID,
  timeAtPointer,
  viewFraction,
} from './SpeakerLanes';
import { SpeakerPanel } from './SpeakerPanel';
import { TimelineOverview } from './TimelineOverview';
import { TranscriptList } from './TranscriptList';
import { usePlayback } from './usePlayback';
import { Waveform } from './Waveform';

export type { TranscriptPlayerLabels } from './labels';
export type { WaveformPeaks } from './peaks';

export interface TranscriptPlayerProps {
  /** Audio URL, e.g. `URL.createObjectURL(blob)`. The host owns and revokes it. */
  src: string | null | undefined;
  transcript: Transcript;
  /** Maps `Speaker.id` to a display name, as in `TranscriptView`. */
  speakerLabels?: Record<string, string>;
  /** Precomputed waveform; recommended for long recordings to avoid decoding them again. */
  peaks?: WaveformPeaks;
  /** Replaces any of the English UI strings, for translation. */
  labels?: Partial<TranscriptPlayerLabels>;
  className?: string;
}

const SEEK_STEP_SECONDS = 5;
const ALL_SPEAKERS = 'all';
const SOME_SPEAKERS = 'some';
/** Speaker ids can be empty or anything, so their filter values live in their own namespace. */
const SPEAKER_PREFIX = 'speaker:';

/** Makes everything outside `element` inert (siblings up to <body>); returns the undo. */
function inertOutside(element: HTMLElement): () => void {
  const changed: Element[] = [];
  for (
    let node: HTMLElement | null = element;
    node && node !== document.body;
    node = node.parentElement
  ) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling === node || sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      changed.push(sibling);
    }
  }
  return () => changed.forEach((el) => el.removeAttribute('inert'));
}
/** Width of the label column plus its gap in `ROW_GRID`, for overlays that span the track column. */
const TRACK_OFFSET = '7.25rem';

/** Pressed state for toggle buttons such as Follow playback. */
const pressedButton =
  'aria-pressed:bg-primary-50 aria-pressed:text-primary-800 dark:aria-pressed:bg-primary-950 dark:aria-pressed:text-primary-200';

export function TranscriptPlayer({
  src,
  transcript,
  speakerLabels,
  peaks: providedPeaks,
  labels: labelOverrides,
  className,
}: TranscriptPlayerProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const fullscreenButtonRef = React.useRef<HTMLButtonElement>(null);
  const transcriptHeadingId = React.useId();
  const labels = React.useMemo(
    () => ({ ...DEFAULT_TRANSCRIPT_PLAYER_LABELS, ...labelOverrides }),
    [labelOverrides]
  );
  const playback = usePlayback(src);
  const peaks = useWaveformPeaks(src, providedPeaks);

  const utterances = React.useMemo(
    () => toUtterances(transcript),
    [transcript]
  );
  const segments = React.useMemo(
    () => toLaneSegments(transcript, utterances),
    [transcript, utterances]
  );
  const speakers = React.useMemo(
    () =>
      toSpeakers(
        transcript,
        [
          ...segments.map((s) => s.speakerId),
          ...utterances.flatMap((u) => [
            u.speakerId,
            ...(u.overlapSpeakerIds ?? []),
          ]),
        ],
        speakerLabels,
        labels.unknownSpeaker
      ),
    [transcript, segments, utterances, speakerLabels, labels.unknownSpeaker]
  );
  const speakersById = React.useMemo(
    () => new Map(speakers.map((s) => [s.id, s])),
    [speakers]
  );
  const talk = React.useMemo(() => talkTime(segments), [segments]);
  const overlapping = React.useMemo(() => hasOverlap(segments), [segments]);
  const dataEnd = React.useMemo(
    () =>
      [
        finiteSeconds(transcript.durationMs),
        ...segments.map((s) => s.end),
        ...utterances.map((u) => u.end),
      ].reduce((end, t) => (Number.isFinite(t) && t > end ? t : end), 0),
    [transcript.durationMs, segments, utterances]
  );

  const duration = Math.max(playback.duration, dataEnd);

  const [userView, setUserView] = React.useState<TimelineView | null>(null);
  const [follow, setFollow] = React.useState(true);
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = React.useState('');
  const [fullscreen, setFullscreen] = React.useState(false);
  const [lastVolume, setLastVolume] = React.useState(1);

  // A new recording starts fresh; edits to the same recording's transcript keep the view.
  React.useEffect(() => {
    setUserView(null);
    setFollow(true);
    setHidden(new Set());
    setQuery('');
  }, [src]);

  const view = React.useMemo(
    () => clampView(userView ?? initialView(duration), duration),
    [userView, duration]
  );
  const { currentTime, playing } = playback;

  React.useEffect(() => {
    if (!follow || !playing) return;
    const next = followView(view, currentTime, duration);
    if (next.start !== view.start) setUserView(next);
  }, [follow, playing, currentTime, duration, view]);

  React.useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // While the player covers the page, the page behind it is inert; menus portaled later stay usable.
  React.useEffect(() => {
    const root = rootRef.current;
    const button = fullscreenButtonRef.current;
    if (!fullscreen || !root) return;
    const restore = inertOutside(root);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      // The Fullscreen API handles Escape itself; this covers browsers without it.
      if (event.key !== 'Escape' || document.fullscreenElement) return;
      const target = event.target as HTMLInputElement | null;
      // Escape first closes an open menu, or clears a search box.
      if (target?.closest?.('[aria-expanded="true"]')) return;
      if (target?.type === 'search' && target.value) return;
      setFullscreen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restore();
      // Also covers unmounting while fullscreen, which would otherwise leave the page fullscreen.
      if (document.fullscreenElement === document.documentElement)
        void document.exitFullscreen?.()?.catch(() => {});
      button?.focus();
    };
  }, [fullscreen]);

  const visibleSpeakers = React.useMemo(
    () => speakers.filter((s) => !hidden.has(s.id)),
    [speakers, hidden]
  );
  const visibleSegments = React.useMemo(
    () => segments.filter((s) => !hidden.has(s.speakerId)),
    [segments, hidden]
  );
  const shown = React.useMemo(
    () => filterUtterances(utterances, hidden, query),
    [utterances, hidden, query]
  );
  const active = activeUtteranceAt(shown, currentTime);
  const playingId = (playing && playback.range?.id) || null;
  // A refused play() can be retried; only a recording that failed to load disables playback.
  const canPlay = Boolean(src) && playback.error !== 'load';

  const { playRange, seek, pause } = playback;
  // A seek while paused does not move the view on its own, so keep the playhead on screen here.
  const seekTo = React.useCallback(
    (time: number) => {
      seek(time);
      if (follow)
        setUserView((current) =>
          followView(
            clampView(current ?? initialView(duration), duration),
            Math.min(Math.max(0, time), duration),
            duration
          )
        );
    },
    [seek, follow, duration]
  );
  const playSegment = React.useCallback(
    (s: LaneSegment) => {
      setFollow(true);
      playRange(s);
    },
    [playRange]
  );
  const playUtterance = React.useCallback(
    (u: Utterance) => {
      setFollow(true);
      playRange(u);
    },
    [playRange]
  );
  const navigate = (next: TimelineView) => {
    setFollow(false);
    setUserView(next);
  };
  const zoom = (factor: number) => {
    const anchor =
      currentTime >= view.start && currentTime <= view.start + view.span
        ? currentTime
        : view.start + view.span / 2;
    setUserView(zoomView(view, factor, anchor, duration));
  };

  const toggleSpeaker = React.useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const visibleIds = visibleSpeakers.map((s) => s.id);
  const filterValue =
    hidden.size === 0
      ? ALL_SPEAKERS
      : visibleIds.length === 1
        ? SPEAKER_PREFIX + visibleIds[0]
        : SOME_SPEAKERS;

  const onSeekKey = (event: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowLeft: -SEEK_STEP_SECONDS,
      ArrowRight: SEEK_STEP_SECONDS,
      Home: -duration,
      End: duration,
    };
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      playback.toggle();
    } else if (event.key in step) {
      event.preventDefault();
      seekTo(currentTime + step[event.key]);
    }
  };

  const toggleFullscreen = () => {
    if (fullscreen) {
      setFullscreen(false);
      if (document.fullscreenElement) void document.exitFullscreen?.();
      return;
    }
    // Fullscreen the page and pin the player over it, so menus portaled to <body> stay visible.
    setFullscreen(true);
    void document.documentElement.requestFullscreen?.()?.catch(() => {});
  };

  const playhead = viewFraction(currentTime, view);
  const playheadVisible =
    duration > 0 &&
    currentTime >= view.start &&
    currentTime <= view.start + view.span;

  return (
    <div
      ref={rootRef}
      className={cn(
        'text-foreground flex flex-col gap-4',
        fullscreen && 'bg-background fixed inset-0 z-50 overflow-y-auto p-6',
        className
      )}
    >
      {src && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- the synced transcript below is the text alternative
        <audio
          key={src}
          ref={playback.setMediaElement}
          src={src}
          preload="metadata"
        />
      )}
      <section
        aria-label={labels.recording}
        className="border-border bg-card text-card-foreground sticky top-0 z-10 rounded-xl border p-4"
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            type="button"
            variant="primary"
            size="icon"
            onClick={playback.toggle}
            disabled={!canPlay}
            aria-label={playing ? labels.pause : labels.play}
            className="shrink-0 rounded-full"
          >
            {playing ? (
              <Pause aria-hidden="true" className="h-4 w-4 fill-current" />
            ) : (
              <Play
                aria-hidden="true"
                className="ms-0.5 h-4 w-4 fill-current"
              />
            )}
          </Button>
          <span dir="ltr" className="text-sm tabular-nums">
            {formatClock(currentTime)}{' '}
            <span className="text-muted-foreground">
              / {formatClock(duration)}
            </span>
          </span>
          {playback.error && (
            <span role="alert" className="text-destructive text-sm">
              {playback.error === 'load' ? labels.loadError : labels.playError}
            </span>
          )}
          {!src && (
            <span className="text-muted-foreground text-sm">
              {labels.noRecording}
            </span>
          )}
          <div className="ms-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={playback.volume === 0 ? labels.unmute : labels.mute}
              onClick={() => {
                if (playback.volume === 0) playback.setVolume(lastVolume || 1);
                else {
                  setLastVolume(playback.volume);
                  playback.setVolume(0);
                }
              }}
            >
              {playback.volume === 0 ? (
                <VolumeX aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Volume2 aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
            <Slider
              aria-label={labels.volume}
              min={0}
              max={1}
              step={0.05}
              value={playback.volume}
              onValueChange={playback.setVolume}
              size="sm"
              className="w-24"
            />
            <Select
              aria-label={labels.playbackSpeed}
              size="sm"
              className="w-20"
              value={String(playback.rate)}
              onValueChange={(v) => playback.setRate(Number(v))}
              options={PLAYBACK_SPEEDS.map((s) => ({
                value: String(s),
                label: labels.formatSpeed(s),
              }))}
            />
            <Button
              ref={fullscreenButtonRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                fullscreen ? labels.exitFullScreen : labels.fullScreen
              }
              onClick={toggleFullscreen}
            >
              {fullscreen ? (
                <Minimize2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Maximize2 aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Time runs left to right in every locale, as in other audio tools. */}
        <div dir="ltr" className="relative space-y-1.5">
          <div className={ROW_GRID}>
            <span />
            <div
              role="slider"
              tabIndex={0}
              aria-label={labels.seek}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              aria-valuetext={labels.seekValue(
                formatClock(currentTime),
                formatClock(duration)
              )}
              onKeyDown={onSeekKey}
              onClick={(e) =>
                seekTo(timeAtPointer(e.clientX, e.currentTarget, view))
              }
              className="focus-visible:ring-ring cursor-pointer rounded focus-visible:ring-2 focus-visible:outline-none"
            >
              <Waveform peaks={peaks} view={view} currentTime={currentTime} />
            </div>
          </div>

          {visibleSpeakers.length > 0 ? (
            <SpeakerLanes
              key={src ?? ''}
              speakers={visibleSpeakers}
              segments={visibleSegments}
              view={view}
              playingId={playingId}
              onPlaySegment={playSegment}
              onPause={pause}
              onSeek={seekTo}
              labels={labels}
            />
          ) : (
            <p className="text-muted-foreground py-2 text-center text-xs">
              {speakers.length ? labels.allSpeakersHidden : labels.noActivity}
            </p>
          )}

          <div className={cn(ROW_GRID, 'h-4')} aria-hidden="true">
            <span />
            <div className="text-muted-foreground relative text-[11px] tabular-nums">
              {ticksFor(view).map((t) => (
                <span
                  key={t}
                  className="absolute -translate-x-1/2"
                  style={{
                    // rtl-ignore -- time axis inside the player's dir="ltr" timeline
                    left: `${viewFraction(t, view) * 100}%`,
                  }}
                >
                  {formatClock(t)}
                </span>
              ))}
            </div>
          </div>

          {playheadVisible && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0"
              style={{
                // rtl-ignore -- time axis inside the player's dir="ltr" timeline
                left: `calc(${TRACK_OFFSET} + (100% - ${TRACK_OFFSET}) * ${playhead})`,
              }}
            >
              <span className="bg-primary-600 absolute inset-y-0 w-0.5 -translate-x-1/2" />
              <span className="bg-primary-800 absolute -top-5 -translate-x-1/2 rounded px-1 text-[10px] font-medium text-white tabular-nums">
                {formatClock(currentTime)}
              </span>
            </div>
          )}
        </div>

        <div dir="ltr" className={cn(ROW_GRID, 'mt-3 items-start')}>
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.zoomOut}
              disabled={view.span >= duration}
              onClick={() => zoom(2)}
            >
              <ZoomOut aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.zoomIn}
              disabled={view.span <= Math.min(MIN_VIEW_SECONDS, duration)}
              onClick={() => zoom(0.5)}
            >
              <ZoomIn aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={pressedButton}
              aria-label={labels.followPlayback}
              aria-pressed={follow}
              onClick={() => setFollow((f) => !f)}
            >
              <LocateFixed aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          <TimelineOverview
            speakers={visibleSpeakers}
            segments={visibleSegments}
            duration={duration}
            view={view}
            currentTime={currentTime}
            onViewChange={navigate}
            labels={labels}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section
          aria-labelledby={transcriptHeadingId}
          className="border-border bg-card text-card-foreground rounded-xl border p-4"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 id={transcriptHeadingId} className="text-base font-semibold">
              {labels.transcript}
            </h3>
            <div className="relative min-w-40 flex-1">
              <Search
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
              />
              <Input
                type="search"
                label={labels.searchTranscript}
                hideLabel
                placeholder={labels.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                size="sm"
                className="ps-8"
              />
            </div>
            <Select
              aria-label={labels.showSpeakers}
              size="sm"
              className="w-44"
              value={filterValue}
              onValueChange={(v) => {
                if (v === ALL_SPEAKERS) setHidden(new Set());
                else if (v.startsWith(SPEAKER_PREFIX)) {
                  const id = v.slice(SPEAKER_PREFIX.length);
                  setHidden(
                    new Set(
                      speakers.filter((s) => s.id !== id).map((s) => s.id)
                    )
                  );
                }
              }}
              options={[
                { value: ALL_SPEAKERS, label: labels.allSpeakers },
                ...speakers.map((s) => ({
                  value: SPEAKER_PREFIX + s.id,
                  label: s.name,
                })),
                ...(filterValue === SOME_SPEAKERS
                  ? [
                      {
                        value: SOME_SPEAKERS,
                        label: labels.someSpeakers,
                        disabled: true,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
          <TranscriptList
            key={src ?? ''}
            utterances={shown}
            speakersById={speakersById}
            activeId={active?.id ?? null}
            playingId={playingId}
            query={query}
            onPlay={playUtterance}
            onPause={pause}
            labels={labels}
            emptyMessage={
              utterances.length === 0 ? labels.noTranscript : labels.noMatches
            }
          />
        </section>

        <div className="space-y-4">
          <SpeakerPanel
            speakers={speakers}
            talkTime={talk}
            duration={duration}
            hidden={hidden}
            onToggle={toggleSpeaker}
            overlapping={overlapping}
            labels={labels}
          />
          <p className="text-muted-foreground bg-muted/50 rounded-xl p-4 text-xs">
            {labels.hint}
          </p>
        </div>
      </div>
    </div>
  );
}
