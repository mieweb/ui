import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Button } from '../Button';
import { useMediaTransport } from '../../hooks/useMediaTransport';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type MediaPlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error';

export type MediaKind = 'video' | 'audio';

/** Ref handle for controlling {@link MediaPlayer} programmatically. */
export interface MediaPlayerRef {
  /** Seek to a specific time in milliseconds. */
  seekToMs: (timeMs: number) => void;
  /** Start playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Get current playback time in milliseconds. */
  getCurrentTimeMs: () => number;
  /** Get total duration in milliseconds. */
  getDurationMs: () => number;
  /** Whether playback is currently paused. */
  isPaused: () => boolean;
  /** Set playback speed multiplier. */
  setPlaybackRate: (rate: number) => void;
  /**
   * The underlying media element.
   * Escape hatch for host integrations (e.g. thumbnail capture); prefer the
   * typed methods above for playback control.
   */
  mediaElement: HTMLVideoElement | HTMLAudioElement | null;
}

export interface MediaPlayerProps extends VariantProps<
  typeof mediaPlayerVariants
> {
  /** Media source URL. */
  src: string;
  /** Force the media kind; when omitted it is inferred from the src extension. */
  kind?: MediaKind;
  /** Whether to show native controls (default `true`). */
  controls?: boolean;
  /** Begin muted; native controls can still change the volume. */
  muted?: boolean;
  /** Repeat playback when the media ends. */
  loop?: boolean;
  /** Video thumbnail displayed before playback. */
  poster?: string;
  /** Browser preload hint (default browser behavior when omitted). */
  preload?: 'none' | 'metadata' | 'auto';
  /** Caption/subtitle `<track>` elements. The `src` attribute is always set
   * on the media element, so alternative `<source>` children are ignored. */
  children?: React.ReactNode;
  /** Localized load-error and retry text. */
  labels?: { error?: string; retry?: string };
  /** Callback when playback state changes. */
  onStateChange?: (state: MediaPlayerState) => void;
  /** Callback when playback ends. */
  onEnded?: () => void;
  /** Callback when an error occurs. */
  onError?: (error: Error) => void;
  /** Callback after the user requests a fresh media load on the error surface. */
  onRetry?: () => void;
  /** Callback on time updates (milliseconds). */
  onTimeUpdate?: (currentTimeMs: number, durationMs: number) => void;
  /** Additional class name. */
  className?: string;
  /** Accessible label for the media element. */
  'aria-label'?: string;
  /**
   * Transitional: exposes the raw media element to legacy consumers.
   * Prefer {@link MediaPlayerRef} for playback control.
   */
  mediaElementRef?: React.RefObject<HTMLVideoElement | HTMLAudioElement | null>;
}

// ============================================================================
// Variants
// ============================================================================

const mediaPlayerVariants = cva(
  'flex h-full w-full items-center justify-center',
  {
    variants: {
      variant: {
        plain: '',
        card: 'rounded-xl border border-border bg-card text-card-foreground p-2',
      },
    },
    defaultVariants: {
      variant: 'plain',
    },
  }
);

// ============================================================================
// Helpers
// ============================================================================

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|m4v)$/i;

/** Infer media kind from a URL's file extension; defaults to audio. */
export function inferMediaKind(src: string): MediaKind {
  // Strip any query string / fragment before matching. Testing the extension
  // against the full URL required a trailing `.*`, which backtracks
  // polynomially on crafted inputs (ReDoS); splitting first is linear.
  const path = src.split(/[?#]/, 1)[0];
  return VIDEO_EXTENSIONS.test(path) ? 'video' : 'audio';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Media playback surface for audio and video with a shared imperative handle.
 *
 * Renders a native `<video>` or `<audio>` element (kind inferred from the src
 * extension unless forced) with themed error/retry handling. Playback state and
 * controls come from the shared {@link useMediaTransport} hook and are exposed
 * through {@link MediaPlayerRef} (all times in milliseconds) — consumers should
 * not reach into the DOM element directly.
 */
export const MediaPlayer = React.forwardRef<MediaPlayerRef, MediaPlayerProps>(
  (
    {
      src,
      kind,
      controls = true,
      muted,
      loop,
      poster,
      preload,
      children,
      labels,
      variant,
      onStateChange,
      onEnded,
      onError,
      onRetry,
      onTimeUpdate,
      className,
      'aria-label': ariaLabel,
      mediaElementRef,
    },
    ref
  ) => {
    const [error, setError] = React.useState<string | null>(null);

    // A failed load must not outlive its src: clearing on change lets a host
    // swap in a corrected URL without being trapped on the error surface
    // (which unmounts the media element, so the new src would never load).
    React.useEffect(() => {
      setError(null);
    }, [src]);
    const resolvedKind = kind ?? inferMediaKind(src);

    const transport = useMediaTransport({
      onTimeUpdate,
      onStateChange,
      onEnded,
      onError: (err) => {
        setError(
          labels?.error ??
            'Unable to load media. The server may be unavailable.'
        );
        onError?.(err);
      },
      endedState: 'paused',
      errorLabel: `media: ${src}`,
    });

    const { setMediaElement, mediaElement } = transport;

    const setElement = React.useCallback(
      (el: HTMLVideoElement | HTMLAudioElement | null) => {
        setMediaElement(el);
        if (mediaElementRef) {
          (mediaElementRef as React.MutableRefObject<typeof el>).current = el;
        }
      },
      [setMediaElement, mediaElementRef]
    );

    React.useImperativeHandle(
      ref,
      (): MediaPlayerRef => ({
        seekToMs: transport.seekToMs,
        play: transport.play,
        pause: transport.pause,
        getCurrentTimeMs: transport.getCurrentTimeMs,
        getDurationMs: transport.getDurationMs,
        isPaused: transport.isPaused,
        setPlaybackRate: transport.setPlaybackRate,
        get mediaElement() {
          return mediaElement;
        },
      }),
      [transport, mediaElement]
    );

    const handleRetry = React.useCallback(() => {
      setError(null);
      mediaElement?.load();
      onRetry?.();
    }, [mediaElement, onRetry]);

    const sharedMediaProps = {
      src,
      controls,
      muted,
      loop,
      preload,
      'aria-label': ariaLabel,
    };

    if (error) {
      return (
        <div className={mediaPlayerVariants({ variant, className })}>
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center"
          >
            {/* destructive-700/300 instead of the base token: #dc2626 on the
                destructive/10 tint is 4.14:1 — below WCAG AA (axe: color-contrast). */}
            <p className="text-destructive-700 dark:text-destructive-300 m-0 text-sm">
              {error}
            </p>
            {/* bg-background: the outline button is transparent, and its text on
                the destructive/10 tint sits exactly at the 4.5:1 AA boundary. */}
            <Button
              variant="outline"
              size="sm"
              className="bg-background"
              onClick={handleRetry}
            >
              {labels?.retry ?? 'Retry'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={mediaPlayerVariants({ variant, className })}>
        {resolvedKind === 'video' ? (
          // Tracks belong to the caller's media resource and can be supplied as
          // children. The feed also supports a custom renderer for captions.
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={setElement as React.Ref<HTMLVideoElement>}
            playsInline
            poster={poster}
            className="h-auto max-h-full w-auto max-w-full object-contain"
            {...sharedMediaProps}
          >
            {children}
          </video>
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio
            ref={setElement as React.Ref<HTMLAudioElement>}
            className="my-4 w-[90%] max-w-lg"
            {...sharedMediaProps}
          >
            {children}
          </audio>
        )}
      </div>
    );
  }
);

MediaPlayer.displayName = 'MediaPlayer';

export { mediaPlayerVariants };
