'use client';

import * as React from 'react';

// =============================================================================
// YouTube IFrame API (lazy, shared)
// =============================================================================
// Loaded only the first time a visitor dwells on a card, then reused. A minimal
// hand-written shape instead of @types/youtube keeps the dependency graph flat.

interface YTPreviewPlayer {
  playVideo(): void;
  mute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPreviewPlayer;
  data?: number;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: Record<string, unknown>
  ) => YTPreviewPlayer;
}

type YTWindow = Window & {
  YT?: YTNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as YTWindow;
  if (w.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

// =============================================================================
// Hook
// =============================================================================

export type HoverPreviewState = 'idle' | 'loading' | 'playing';

export interface UseYouTubeHoverPreviewOptions {
  /** Hover dwell before the player mounts. Default 600ms. */
  dwellMs?: number;
  /** Player host. Default `https://www.youtube-nocookie.com`. */
  host?: string;
  /** Disable entirely (e.g. when the card has no YouTube id). */
  enabled?: boolean;
}

export interface UseYouTubeHoverPreviewReturn {
  /** Lifecycle phase of the muted preview. */
  preview: HoverPreviewState;
  /** Normalised playback position (0–1) for a timeline bar. */
  progress: number;
  /** Attach to the element the muted iframe should fill. */
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** Wire to the hover target's `onMouseEnter` / `onFocus`. */
  handleEnter: () => void;
  /** Wire to the hover target's `onMouseLeave` / `onBlur` (and any manual reset). */
  stopPreview: () => void;
}

/**
 * Drives a muted, looping YouTube hover preview for a single `youtubeId` — the
 * "silent autoplay on dwell" pattern from YouTube's own grid. After a short
 * hover dwell a muted player is mounted lazily inside `hostRef`; `progress`
 * tracks playback for a timeline bar; everything tears down on leave so only
 * one preview is ever live. Honours `prefers-reduced-motion` and skips
 * pointer-less (touch) inputs.
 *
 * @example
 * ```tsx
 * const { preview, progress, hostRef, handleEnter, stopPreview } =
 *   useYouTubeHoverPreview('dQw4w9WgXcQ');
 * <a onMouseEnter={handleEnter} onMouseLeave={stopPreview}>
 *   <div ref={hostRef} className={preview === 'playing' ? 'opacity-100' : 'opacity-0'} />
 * </a>
 * ```
 */
export function useYouTubeHoverPreview(
  youtubeId: string | undefined,
  {
    dwellMs = 600,
    host = 'https://www.youtube-nocookie.com',
    enabled = true,
  }: UseYouTubeHoverPreviewOptions = {}
): UseYouTubeHoverPreviewReturn {
  const [preview, setPreview] = React.useState<HoverPreviewState>('idle');
  const [progress, setProgress] = React.useState(0);

  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<YTPreviewPlayer | null>(null);
  const hoveringRef = React.useRef(false);
  const enterTimerRef = React.useRef<number | null>(null);
  const pollRef = React.useRef<number | null>(null);

  const stopPreview = React.useCallback(() => {
    hoveringRef.current = false;
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        /* player already torn down */
      }
      playerRef.current = null;
    }
    if (hostRef.current) hostRef.current.innerHTML = '';
    setPreview('idle');
    setProgress(0);
  }, []);

  const beginPlayer = React.useCallback(() => {
    const el = hostRef.current;
    const YT = (window as YTWindow).YT;
    if (
      !el ||
      !YT?.Player ||
      playerRef.current ||
      !hoveringRef.current ||
      !youtubeId
    )
      return;

    const target = document.createElement('div');
    el.appendChild(target);

    const startPolling = () => {
      if (pollRef.current !== null) return;
      pollRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        const d = p.getDuration();
        if (d > 0) setProgress(Math.min(p.getCurrentTime() / d, 1));
      }, 200);
    };

    playerRef.current = new YT.Player(target, {
      videoId: youtubeId,
      host,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        start: 0,
      },
      events: {
        onReady: (e: YTPlayerEvent) => {
          if (!hoveringRef.current) {
            stopPreview();
            return;
          }
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: (e: YTPlayerEvent) => {
          if (e.data === 1) {
            // PLAYING — reveal only once frames are actually flowing
            setPreview('playing');
            startPolling();
          } else if (e.data === 0 && playerRef.current) {
            // ENDED — loop like YouTube's own previews
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          }
        },
        onError: () => stopPreview(),
      },
    });

    // the visitor may have left during async player construction
    if (!hoveringRef.current) stopPreview();
  }, [youtubeId, host, stopPreview]);

  const handleEnter = React.useCallback(() => {
    if (
      !enabled ||
      !youtubeId ||
      typeof window === 'undefined' ||
      !window.matchMedia('(hover: hover)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    hoveringRef.current = true;
    if (enterTimerRef.current !== null || playerRef.current) return;
    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      if (!hoveringRef.current) return;
      setPreview('loading');
      void loadYouTubeIframeApi().then(() => {
        if (hoveringRef.current) beginPlayer();
        else stopPreview();
      });
    }, dwellMs);
  }, [enabled, youtubeId, dwellMs, beginPlayer, stopPreview]);

  React.useEffect(() => stopPreview, [stopPreview]);

  return { preview, progress, hostRef, handleEnter, stopPreview };
}
