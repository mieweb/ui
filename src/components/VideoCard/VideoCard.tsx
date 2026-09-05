'use client';

import * as React from 'react';
import { Play, VolumeX } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useYouTubeHoverPreview } from '../../hooks/useYouTubeHoverPreview';

// =============================================================================
// PlayButton
// =============================================================================

export interface PlayButtonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Disc diameter. Default `md` (56px). */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show the spinning brand ring. Default `hover` — the ring appears and spins
   * only while the nearest `.group` ancestor is hovered; `always` keeps it on.
   */
  ring?: 'hover' | 'always' | 'none';
}

const DISC_SIZE = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
} as const;
const ICON_SIZE = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' } as const;

/**
 * The branded play affordance: a white disc with a filled brand triangle and a
 * conic-gradient ring that lights up and spins on hover. Decorative — the
 * surrounding card/link carries the accessible label.
 */
export function PlayButton({
  size = 'md',
  ring = 'hover',
  className,
  ...props
}: PlayButtonProps) {
  return (
    <span
      data-slot="play-button"
      aria-hidden="true"
      className={cn(
        'relative inline-flex items-center justify-center',
        DISC_SIZE[size],
        className
      )}
      {...props}
    >
      {ring !== 'none' && (
        <span
          className={cn(
            'pointer-events-none absolute -inset-2 rounded-full transition-opacity duration-300',
            'motion-safe:animate-[mie-spin_1.4s_linear_infinite]',
            '[background:conic-gradient(from_0deg,transparent_0deg,var(--mieweb-primary-500)_90deg,var(--mieweb-primary-300)_240deg,var(--mieweb-primary-200)_320deg,transparent_360deg)]',
            '[mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-4px))]',
            '[-webkit-mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-4px))]',
            'drop-shadow-[0_0_5px_color-mix(in_srgb,var(--mieweb-primary-400)_60%,transparent)]',
            ring === 'hover'
              ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
              : 'opacity-100'
          )}
        />
      )}
      <span
        className={cn(
          'relative flex items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110',
          DISC_SIZE[size]
        )}
      >
        <Play
          className={cn('text-primary-600 ml-0.5', ICON_SIZE[size])}
          fill="currentColor"
        />
      </span>
    </span>
  );
}

// =============================================================================
// VideoCard
// =============================================================================

export interface VideoCardProps {
  /** Video title — also the accessible name ("Watch: {title}"). */
  title: string;
  /** Navigates on click. Omit to render a `<button>` driven by `onClick`. */
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Anchor target (e.g. `_blank`). */
  target?: string;
  /** Enables the muted hover preview and the default YouTube thumbnail. */
  youtubeId?: string;
  /** Thumbnail URL. Defaults to the YouTube `hqdefault` when `youtubeId` is set. */
  thumbnailUrl?: string;
  /** Thumbnail alt. Defaults to `title`. */
  thumbnailAlt?: string;
  /** Duration label, e.g. `34 min` or `2:44`. */
  duration?: string;
  /** Word before the duration in the pill. Default `Watch` → "Watch · 34 min". Pass `null` for just the duration. */
  durationPrefix?: string | null;
  /** Turn the hover preview off even when `youtubeId` is set. */
  preview?: boolean;
  /** Label shown on the pill while the muted preview plays. Default `Silent`. */
  silentLabel?: string;
  /** Slot above the title in the body — a category `Badge`, for instance. */
  eyebrow?: React.ReactNode;
  description?: string;
  /** Slot below the description — speaker, view count, date. */
  footer?: React.ReactNode;
  /**
   * `card` renders thumbnail + body; `plate` renders only the media plate
   * (for heroes and detail panels where the copy lives elsewhere).
   */
  variant?: 'card' | 'plate';
  /** Heading level for the title in `card` variant. Default `h3`. */
  headingLevel?: 'h2' | 'h3' | 'h4';
  className?: string;
}

/**
 * A video thumbnail card with the branded `PlayButton`, a "Watch · 34 min"
 * duration pill and — when a `youtubeId` is supplied — a muted, looping
 * hover preview with a progress bar, exactly as YouTube's own grid behaves.
 * Ported from the Enterprise Health video library and hero HUD.
 *
 * @example
 * ```tsx
 * <VideoCard
 *   title="Ozwell AI in the exam room"
 *   href="/videos/ozwell-ai/"
 *   youtubeId="dQw4w9WgXcQ"
 *   duration="2:44"
 *   eyebrow={<Badge variant="secondary" size="sm">Demo</Badge>}
 *   description="Documentation and surveillance, native to the platform."
 * />
 * ```
 */
export function VideoCard({
  title,
  href,
  onClick,
  target,
  youtubeId,
  thumbnailUrl,
  thumbnailAlt,
  duration,
  durationPrefix = 'Watch',
  preview = true,
  silentLabel = 'Silent',
  eyebrow,
  description,
  footer,
  variant = 'card',
  headingLevel: Heading = 'h3',
  className,
}: VideoCardProps) {
  const thumb =
    thumbnailUrl ??
    (youtubeId
      ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
      : undefined);

  const hover = useYouTubeHoverPreview(youtubeId, { enabled: preview });
  const playing = hover.preview === 'playing';

  const pill =
    duration && (durationPrefix ? `${durationPrefix} · ${duration}` : duration);

  const media = (
    <div
      data-slot="video-card-media"
      className="bg-primary-950 relative aspect-video overflow-hidden"
    >
      {thumb && (
        <img
          src={thumb}
          alt={thumbnailAlt ?? title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}

      {/* Muted preview player — fades in once frames are flowing. pointer-events-none
          so clicks fall through to the card. */}
      <div
        ref={hover.hostRef}
        aria-hidden="true"
        className={cn(
          'bg-primary-950 pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-500',
          '[&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0',
          playing ? 'opacity-100' : 'opacity-0'
        )}
      />

      {playing && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <VolumeX className="h-3 w-3" aria-hidden="true" />
          {silentLabel}
        </span>
      )}

      <div
        className={cn(
          'bg-primary-950/20 group-hover:bg-primary-950/30 absolute inset-0 flex items-center justify-center transition-all duration-300',
          playing && 'opacity-0'
        )}
      >
        <PlayButton size={variant === 'plate' ? 'lg' : 'md'} />
      </div>

      {pill && !playing && (
        <span
          data-slot="video-card-duration"
          className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          {pill}
        </span>
      )}

      {hover.preview !== 'idle' && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div
            className="h-full rounded-r-full bg-[linear-gradient(90deg,var(--mieweb-primary-500),var(--mieweb-primary-300))] transition-[width] duration-200 ease-linear"
            style={{ width: `${Math.max(hover.progress * 100, 1.5)}%` }}
          />
        </div>
      )}
    </div>
  );

  const body = variant === 'card' && (
    <div data-slot="video-card-body" className="p-4 text-start">
      {eyebrow && <div className="mb-2 flex items-center gap-2">{eyebrow}</div>}
      <Heading className="text-foreground group-hover:text-primary-700 dark:group-hover:text-primary-300 text-lg font-semibold transition-colors">
        {title}
      </Heading>
      {description && (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {description}
        </p>
      )}
      {footer && (
        <div className="text-muted-foreground mt-2 text-sm">{footer}</div>
      )}
    </div>
  );

  const shell = cn(
    'group block w-full overflow-hidden no-underline transition-shadow',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    variant === 'card'
      ? 'rounded-xl border border-border bg-card text-card-foreground shadow-md hover:shadow-lg'
      : 'rounded-xl shadow-lg',
    className
  );

  const interaction = {
    onMouseEnter: hover.handleEnter,
    onMouseLeave: hover.stopPreview,
    onFocus: hover.handleEnter,
    onBlur: hover.stopPreview,
    'aria-label': `Watch: ${title}`,
    'data-slot': 'video-card',
    'data-preview': hover.preview,
  };

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        onClick={onClick}
        className={shell}
        {...interaction}
      >
        {media}
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={shell} {...interaction}>
      {media}
      {body}
    </button>
  );
}
