import * as React from 'react';
import {
  Captions,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { cn } from '../../utils/cn';
import type { UseMediaTransportReturn } from '../../hooks/useMediaTransport';
import { formatTime } from '../AudioPlayer/AudioPlayer';
import { Button } from '../Button';
import { Slider } from '../Slider';
import {
  overlayButtonClass,
  playBadgeClass,
  playBadgeIconClass,
} from './overlayButton';
import {
  canPictureInPicture,
  exitPictureInPicture,
  isInPictureInPicture,
  PIP_EVENTS,
  type WebKitVideo,
} from './pictureInPicture';

/** Every string the controls show or announce, for the host to localize. */
export interface MediaControlsLabels {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  seek: string;
  fullscreen: string;
  exitFullscreen: string;
  pictureInPicture: string;
  exitPictureInPicture: string;
  /** The elapsed and total time, already formatted (`1:05`, `4:30`). */
  time: (current: string, duration: string) => string;
  /** The speed button's text for a rate (`1.5×`). */
  rate: (rate: number) => string;
  /** The speed button's accessible name, given its text. */
  speed: (rate: string) => string;
  showCaptions: string;
  hideCaptions: string;
}

/** The English defaults; MediaFeed reuses them for its player labels. */
export const defaultMediaControlsLabels: MediaControlsLabels = {
  play: 'Play',
  pause: 'Pause',
  mute: 'Mute',
  unmute: 'Unmute',
  seek: 'Seek',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  pictureInPicture: 'Picture in picture',
  exitPictureInPicture: 'Exit picture in picture',
  time: (current, duration) => `${current} / ${duration}`,
  rate: (rate) => `${rate}×`,
  speed: (rate) => `Playback speed ${rate}`,
  showCaptions: 'Show captions',
  hideCaptions: 'Hide captions',
};

export interface MediaControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The transport attached to the `<video>` these controls drive. */
  transport: UseMediaTransportReturn;
  /**
   * The box that goes full screen with the controls (the video and these
   * controls' shared parent). Where the browser can't take an element full
   * screen (an iPhone), the video opens in the system's own player instead.
   */
  fullscreenTarget?: React.RefObject<HTMLElement | null>;
  /** Localized text for every control; English by default. */
  labels?: Partial<MediaControlsLabels>;
  /** The speeds the speed button cycles through (default `[1, 1.5, 2]`). */
  playbackRates?: readonly number[];
}

const defaultPlaybackRates = [1, 1.5, 2] as const;

const formatMs = (ms: number) => formatTime(ms / 1000);

/** Whether `video` is in picture in picture, following every change. */
function useInPictureInPicture(video: HTMLVideoElement | null): boolean {
  const [inPip, setInPip] = React.useState(false);
  React.useEffect(() => {
    if (!video) return;
    const update = () => setInPip(isInPictureInPicture(video));
    update();
    for (const event of PIP_EVENTS) video.addEventListener(event, update);
    return () => {
      for (const event of PIP_EVENTS) video.removeEventListener(event, update);
    };
  }, [video]);
  return inPip;
}

/**
 * The video's caption and subtitle tracks, and whether one is showing,
 * following tracks the host adds, removes or switches itself.
 */
function useCaptionTracks(video: HTMLVideoElement | null) {
  const [tracks, setTracks] = React.useState<globalThis.TextTrack[]>([]);
  const [showing, setShowing] = React.useState(false);
  React.useEffect(() => {
    const list = video?.textTracks;
    if (!list) {
      setTracks([]);
      setShowing(false);
      return;
    }
    // Browsers draw cues at the very bottom, under the bar: lift any cue the
    // host left on the default line a few lines up. Cues load lazily, so this
    // runs again as they become active.
    const lift = (event: Event) => {
      const track = event.target as globalThis.TextTrack;
      const active = new Set(Array.from(track.activeCues ?? []));
      const redraw: globalThis.TextTrackCue[] = [];
      for (const cue of Array.from(track.cues ?? [])) {
        if (!('line' in cue) || cue.line !== 'auto') continue;
        (cue as globalThis.VTTCue).line = -4;
        if (active.has(cue)) redraw.push(cue);
      }
      // A cue already on screen keeps its old place until it's re-added.
      for (const cue of redraw) {
        track.removeCue(cue);
        track.addCue(cue);
      }
    };
    let watched: globalThis.TextTrack[] = [];
    const update = () => {
      const captions = Array.from(list).filter(
        (track) => track.kind === 'captions' || track.kind === 'subtitles'
      );
      for (const track of watched)
        track.removeEventListener?.('cuechange', lift);
      for (const track of captions) track.addEventListener?.('cuechange', lift);
      watched = captions;
      setTracks(captions);
      setShowing(captions.some((track) => track.mode === 'showing'));
    };
    update();
    const events = ['addtrack', 'removetrack', 'change'];
    for (const name of events) list.addEventListener?.(name, update);
    return () => {
      for (const name of events) list.removeEventListener?.(name, update);
      for (const track of watched)
        track.removeEventListener?.('cuechange', lift);
    };
  }, [video]);
  return { tracks, showing };
}

/** Whether `element`'s audio is muted, following every change to it. */
function useMuted(element: HTMLMediaElement | null): boolean {
  const [muted, setMuted] = React.useState(element?.muted ?? false);
  React.useEffect(() => {
    if (!element) return;
    const update = () => setMuted(element.muted);
    update();
    element.addEventListener('volumechange', update);
    return () => element.removeEventListener('volumechange', update);
  }, [element]);
  return muted;
}

/** Whether `target` is the page's full-screen element. */
function useIsFullscreen(
  target: React.RefObject<HTMLElement | null> | undefined
): boolean {
  const [fullscreen, setFullscreen] = React.useState(false);
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () =>
      setFullscreen(
        !!target?.current && document.fullscreenElement === target.current
      );
    // Controls that mount while their box is already full screen say so.
    update();
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [target]);
  return fullscreen;
}

/**
 * Touch-first controls laid over a `<video>`, in place of the browser's own.
 * A tap on the picture plays or pauses it, a round ▶ shows while it's paused,
 * and a bar along the bottom has play/pause, the time, a seek bar, mute, and
 * picture in picture and full screen where the browser supports them.
 *
 * `MediaPlayer` renders it for `controlsStyle="overlay"`. To use it directly,
 * render it in a positioned box with the video and attach
 * `transport.setMediaElement` to the video's `ref`.
 */
export const MediaControls = React.forwardRef<
  HTMLDivElement,
  MediaControlsProps
>(function MediaControls(
  {
    transport,
    fullscreenTarget,
    labels: labelOverrides,
    playbackRates = defaultPlaybackRates,
    className,
    ...rest
  },
  ref
) {
  const labels = { ...defaultMediaControlsLabels, ...labelOverrides };
  const video = transport.mediaElement as WebKitVideo | null;
  const muted = useMuted(video);
  const isFullscreen = useIsFullscreen(fullscreenTarget);
  const inPip = useInPictureInPicture(video);
  const captions = useCaptionTracks(video);
  // What this browser can do is read once mounted: the server can't know it,
  // and markup that differs from the server's breaks hydration. Safari only
  // says a video can float once its metadata is in, so read again then (and
  // on each new source).
  const [support, setSupport] = React.useState({ box: false, pip: false });
  React.useEffect(() => {
    const read = () =>
      setSupport({
        box: document.fullscreenEnabled && !!fullscreenTarget,
        pip: canPictureInPicture(video),
      });
    read();
    video?.addEventListener('loadedmetadata', read);
    return () => video?.removeEventListener('loadedmetadata', read);
  }, [video, fullscreenTarget]);
  const playing = transport.isPlaying;
  const durationMs = transport.durationMs;

  const togglePlay = transport.togglePlay;
  const toggleMuted = () => {
    if (video) video.muted = !video.muted;
  };
  // The iPhone fallback only where it works: Chromium has the method too, but
  // it does nothing in a frame that isn't allowed full screen.
  const canFullscreen =
    support.box ||
    (!!video?.webkitEnterFullscreen && !!video.webkitSupportsFullscreen);
  // Leaves only a full screen these controls entered: a page that is full
  // screen itself (a kiosk, a presentation) stays that way.
  const toggleFullscreen = () => {
    if (isFullscreen) {
      void document.exitFullscreen?.()?.catch(() => {});
    } else if (support.box && fullscreenTarget?.current) {
      void fullscreenTarget.current.requestFullscreen?.()?.catch(() => {});
    } else {
      video?.webkitEnterFullscreen?.();
    }
  };
  // Each press moves to the next speed, and from the last back to the first.
  const rate = transport.playbackRate;
  const cycleSpeed = () => {
    const index = playbackRates.indexOf(rate);
    transport.setPlaybackRate(
      playbackRates[(index + 1) % playbackRates.length] ?? 1
    );
  };
  // Shows the first caption track, or hides whichever is showing.
  const toggleCaptions = () => {
    const [first] = captions.tracks;
    for (const track of captions.tracks)
      track.mode =
        !captions.showing && track === first ? 'showing' : 'disabled';
  };
  // The standard API, else Safari's presentation mode on an iPhone.
  const togglePictureInPicture = () => {
    if (!video) return;
    if (isInPictureInPicture(video)) {
      void exitPictureInPicture(video);
    } else if (document.pictureInPictureEnabled) {
      void video.requestPictureInPicture().catch(() => {});
    } else {
      video.webkitSetPresentationMode?.('picture-in-picture');
    }
  };

  const barButton = (
    label: string,
    onClick: () => void,
    icon: React.ReactElement,
    pressed?: boolean
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(overlayButtonClass, 'shrink-0 bg-transparent')}
    >
      {icon}
    </Button>
  );

  return (
    <div
      ref={ref}
      data-slot="media-controls"
      className={cn(
        // A container query: a narrow player (a portrait clip) gives the seek
        // bar a row of its own, so it's always long enough to drag.
        '@container pointer-events-none absolute inset-0 flex flex-col justify-end',
        className
      )}
      {...rest}
    >
      {/* A pointer convenience over the picture, as in every video app. The
          bar's Play is the keyboard and screen-reader control. */}
      <div
        data-slot="media-controls-surface"
        aria-hidden="true"
        className="pointer-events-auto absolute inset-0 flex cursor-pointer items-center justify-center"
        onClick={togglePlay}
      >
        {!playing && (
          <span className={playBadgeClass}>
            <Play className={playBadgeIconClass} />
          </span>
        )}
      </div>
      {/* Left to right in every language: a media timeline follows the
          media, not the reading direction (Material: don't mirror playback
          controls or their progress bar). Labels keep their own direction. */}
      <div
        data-slot="media-controls-bar"
        dir="ltr"
        className="pointer-events-auto relative flex flex-wrap items-center gap-x-1 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-1 pt-6 pb-1 text-white sm:px-2"
      >
        {barButton(
          playing ? labels.pause : labels.play,
          togglePlay,
          playing ? (
            <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5 fill-current" aria-hidden="true" />
          )
        )}
        <span
          data-slot="media-controls-time"
          className="shrink-0 px-1 text-xs whitespace-nowrap tabular-nums @max-md:me-auto"
        >
          {/* The label may be RTL text ("0:01 من 0:04"): isolate its
              direction without turning the bar's layout around. */}
          <bdi>
            {labels.time(
              formatMs(transport.currentTimeMs),
              formatMs(durationMs)
            )}
          </bdi>
        </span>
        <Slider
          // Taller to grab on a touch screen; the track itself stays thin.
          className="mx-1 min-w-0 flex-1 @max-md:order-first @max-md:mx-2 @max-md:basis-full pointer-coarse:[&_[data-slot=slider-track-wrapper]]:py-4"
          // dark: too, or the dark surface's own track colour wins.
          trackClassName="bg-white/30 dark:bg-white/30"
          size="sm"
          min={0}
          max={durationMs > 0 ? durationMs : 1}
          // A tap or drag lands where it's put (0.1s); an arrow key moves 2%
          // of the clip, so a few presses cross a short one and a long one
          // isn't hundreds of presses long.
          step={100}
          keyboardStep={Math.max(100, Math.round(durationMs / 50))}
          value={transport.currentTimeMs}
          onValueChange={transport.seekToMs}
          formatValue={formatMs}
          disabled={durationMs <= 0}
          aria-label={labels.seek}
        />
        {playbackRates.length > 1 &&
          barButton(
            labels.speed(labels.rate(rate)),
            cycleSpeed,
            <span className="text-xs font-semibold tabular-nums">
              {labels.rate(rate)}
            </span>
          )}
        {captions.tracks.length > 0 &&
          barButton(
            captions.showing ? labels.hideCaptions : labels.showCaptions,
            toggleCaptions,
            <Captions
              className={cn('h-5 w-5', !captions.showing && 'opacity-70')}
              aria-hidden="true"
            />,
            captions.showing
          )}
        {barButton(
          muted ? labels.unmute : labels.mute,
          toggleMuted,
          muted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )
        )}
        {support.pip &&
          barButton(
            inPip ? labels.exitPictureInPicture : labels.pictureInPicture,
            togglePictureInPicture,
            <PictureInPicture2 className="h-5 w-5" aria-hidden="true" />
          )}
        {canFullscreen &&
          barButton(
            isFullscreen ? labels.exitFullscreen : labels.fullscreen,
            toggleFullscreen,
            isFullscreen ? (
              <Minimize className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Maximize className="h-5 w-5" aria-hidden="true" />
            )
          )}
      </div>
    </div>
  );
});
