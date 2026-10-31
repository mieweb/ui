import * as React from 'react';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { MediaPlayer } from '../MediaPlayer';
import { Play } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { SuperChatMediaAttachment } from './types';

/** One attachment as a gallery or tile gets it: what to show and how to open it. */
export interface MessageMediaEntry {
  attachment: SuperChatMediaAttachment;
  /** `data-media-launch-id`, so Back returns focus to its control. */
  launchId: string;
  /** Opens it in the media view; `play` starts it there. */
  open: (play?: boolean) => void;
}

/** Drawn as a picture in the thread (a tile, a gallery cell), not a player. */
export function isVisualMedia(attachment: SuperChatMediaAttachment): boolean {
  return (
    attachment.kind === 'image' ||
    attachment.kind === 'video' ||
    (attachment.kind === 'youtube' && !!attachment.poster)
  );
}

/**
 * The accessible name of an attachment's open control, naming the picture so
 * a gallery's cells can be told apart: "Play Launch overview",
 * "Open in media feed, Whiteboard".
 */
function actionName(
  attachment: SuperChatMediaAttachment,
  openLabel: string,
  playLabel: string
): string {
  if (attachment.kind !== 'image') {
    return attachment.title ? `${playLabel} ${attachment.title}` : playLabel;
  }
  const name = attachment.title ?? attachment.alt;
  return name ? `${openLabel}, ${name}` : openLabel;
}

/**
 * A still of the attachment filling its box: the image, a video's poster, or
 * with no poster the video's first frame (nothing more of it loads). Reports
 * its width ÷ height once known.
 */
function MediaStill({
  attachment,
  onAspect,
}: {
  attachment: SuperChatMediaAttachment;
  onAspect?: (aspect: number) => void;
}) {
  const report = (width: number, height: number) => {
    if (width && height) onAspect?.(width / height);
  };
  const still =
    attachment.kind === 'image' ? attachment.src : attachment.poster;
  const className = 'block size-full object-cover';
  return still ? (
    <img
      src={still}
      alt={attachment.alt ?? ''}
      loading="lazy"
      onLoad={(event) =>
        report(
          event.currentTarget.naturalWidth,
          event.currentTarget.naturalHeight
        )
      }
      className={className}
    />
  ) : (
    <video
      src={attachment.src}
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      onLoadedMetadata={(event) =>
        report(event.currentTarget.videoWidth, event.currentTarget.videoHeight)
      }
      className={className}
    />
  );
}

/** ▶ over a video's still. */
function PlayBadge({ small = false }: { small?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-black/60 text-white',
          small ? 'size-8' : 'size-11'
        )}
      >
        <Play
          className={cn('fill-current', small ? 'size-4' : 'size-5')}
          aria-hidden="true"
        />
      </span>
    </span>
  );
}

/** Shared by a tile and a gallery cell: a button over the still, ring inset (the tile clips). */
const stillButton =
  'focus-visible:ring-ring relative block overflow-hidden bg-neutral-900 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset';

/**
 * Two or more pictures in one message, as one tile (iMessage, WhatsApp,
 * Telegram): two side by side, three as one large and two small, four or more
 * in a 2×2 grid whose last cell says how many more. Each cell opens the media
 * view at its own attachment, where the rest are a swipe away.
 */
export function MessageGallery({
  entries,
  maxSize,
  openLabel,
  playLabel,
  moreLabel,
}: {
  entries: MessageMediaEntry[];
  /** The tile's width, a CSS length (`mediaMaxSize`). */
  maxSize: string;
  openLabel: string;
  playLabel: string;
  /** The hidden count's name on the last cell, e.g. "3 more". */
  moreLabel: (count: number) => string;
}) {
  const shown = entries.slice(0, 4);
  const more = entries.length - shown.length;
  return (
    <div
      data-slot="superchat-message-gallery"
      role="group"
      style={{ width: maxSize }}
      className={cn(
        'grid max-w-full grid-cols-2 gap-0.5',
        shown.length === 2 ? 'aspect-[4/3]' : 'aspect-square grid-rows-2'
      )}
    >
      {shown.map(({ attachment, launchId, open }, index) => {
        const playable = attachment.kind !== 'image';
        const last = more > 0 && index === shown.length - 1;
        const name = actionName(attachment, openLabel, playLabel);
        return (
          <button
            key={attachment.id}
            type="button"
            data-media-launch-id={launchId}
            aria-label={last ? `${name}, ${moreLabel(more)}` : name}
            onClick={() => open(playable)}
            className={cn(
              stillButton,
              shown.length === 3 && index === 0 && 'row-span-2'
            )}
          >
            <MediaStill attachment={attachment} />
            {last ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white"
              >
                +{more}
              </span>
            ) : (
              playable && <PlayBadge small />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Thread previews reuse the same native transport as the full media feed. */
export function MessageMedia({
  attachment,
  onOpen,
  openLabel,
  playLabel,
  errorLabel,
  retryLabel,
  launchId,
  maxSize,
}: {
  attachment: SuperChatMediaAttachment;
  /** The card's box, a CSS length: this wide, its picture at most this tall. */
  maxSize: string;
  onOpen?: (play?: boolean) => void;
  openLabel: string;
  playLabel: string;
  /** Localized load-error text; the player's default applies when omitted. */
  errorLabel?: string;
  /** Localized retry text; the player's default applies when omitted. */
  retryLabel?: string;
  launchId: string;
}) {
  const playable = attachment.kind !== 'image';
  const actionLabel = playable ? playLabel : openLabel;
  // Width ÷ height, once the still says.
  const [aspect, setAspect] = React.useState<number>();
  if (onOpen && isVisualMedia(attachment)) {
    // A picture alone: the still in its own shape inside the box (a wide one
    // up to that wide, an upright one up to that tall), a tap to open it.
    const shape = aspect ?? 16 / 9;
    return (
      <button
        type="button"
        data-slot="superchat-message-media"
        data-media-launch-id={launchId}
        aria-label={actionName(attachment, openLabel, playLabel)}
        onClick={() => onOpen(playable)}
        style={{
          width: `min(${maxSize}, calc(${maxSize} * ${shape}))`,
          aspectRatio: shape,
        }}
        className={cn(stillButton, 'max-w-full')}
      >
        <MediaStill attachment={attachment} onAspect={setAspect} />
        {playable && <PlayBadge />}
      </button>
    );
  }
  return (
    <div
      data-slot="superchat-message-media"
      // Never wider than the message. Its own tile beside the text bubble, on
      // the thread's neutral surface rather than the author's color.
      style={{ width: maxSize }}
      className="flex max-w-full flex-col gap-2 bg-neutral-100 p-2 text-neutral-900 dark:bg-neutral-800 dark:text-white"
    >
      {attachment.title && (
        <p className="px-1 text-sm font-medium">{attachment.title}</p>
      )}
      {attachment.kind === 'image' && attachment.src ? (
        <img
          src={attachment.src}
          alt={attachment.alt ?? attachment.title ?? ''}
          loading="lazy"
          style={{ maxHeight: maxSize }}
          className="w-full rounded-lg object-contain"
        />
      ) : (attachment.kind === 'video' || attachment.kind === 'audio') &&
        attachment.src ? (
        // An opaque themed surface: the player's semi-transparent states
        // (error, loading) must never compose onto a colored chat bubble.
        <div
          style={{ maxHeight: maxSize }}
          className="bg-background overflow-hidden rounded-lg"
        >
          <MediaPlayer
            src={attachment.src}
            kind={attachment.kind}
            poster={attachment.poster}
            aria-label={attachment.alt ?? attachment.title ?? openLabel}
            controls={!onOpen}
            preload="metadata"
            labels={{ error: errorLabel, retry: retryLabel }}
            className="max-h-[inherit]"
          />
        </div>
      ) : attachment.poster ? (
        <img
          src={attachment.poster}
          alt={attachment.alt ?? attachment.title ?? ''}
          loading="lazy"
          style={{ maxHeight: maxSize }}
          className="w-full rounded-lg object-contain"
        />
      ) : null}
      {attachment.caption && (
        <p className="px-1 text-sm">{attachment.caption}</p>
      )}
      {onOpen && (
        <ButtonGroup>
          <Button
            data-media-launch-id={launchId}
            variant="secondary"
            size="sm"
            leftIcon={
              playable ? (
                <Play className="size-4" aria-hidden="true" />
              ) : undefined
            }
            aria-label={
              playable && attachment.title
                ? `${playLabel} ${attachment.title}`
                : actionLabel
            }
            onClick={() => onOpen(playable)}
          >
            {actionLabel}
          </Button>
        </ButtonGroup>
      )}
    </div>
  );
}
