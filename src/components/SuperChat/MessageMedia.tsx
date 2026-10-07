import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { MediaPlayer } from '../MediaPlayer';
import { Play } from 'lucide-react';
import type { SuperChatMediaAttachment } from './types';

/** Thread previews reuse the same native transport as the full media feed. */
export function MessageMedia({
  attachment,
  onOpen,
  openLabel,
  playLabel,
  errorLabel,
  retryLabel,
  launchId,
}: {
  attachment: SuperChatMediaAttachment;
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
  return (
    <div
      data-slot="superchat-message-media"
      className="mt-3 flex w-72 max-w-full flex-col gap-2"
    >
      {attachment.title && (
        <p className="text-sm font-medium">{attachment.title}</p>
      )}
      {attachment.kind === 'image' && attachment.src ? (
        <img
          src={attachment.src}
          alt={attachment.alt ?? attachment.title ?? ''}
          loading="lazy"
          className="max-h-72 w-full rounded-lg object-contain"
        />
      ) : (attachment.kind === 'video' || attachment.kind === 'audio') &&
        attachment.src ? (
        // An opaque themed surface: the player's semi-transparent states
        // (error, loading) must never compose onto a colored chat bubble.
        <div className="bg-background overflow-hidden rounded-lg">
          <MediaPlayer
            src={attachment.src}
            kind={attachment.kind}
            poster={attachment.poster}
            aria-label={attachment.alt ?? attachment.title ?? openLabel}
            controls={!onOpen}
            preload="metadata"
            labels={{ error: errorLabel, retry: retryLabel }}
            className="max-h-72"
          />
        </div>
      ) : attachment.poster ? (
        <img
          src={attachment.poster}
          alt={attachment.alt ?? attachment.title ?? ''}
          loading="lazy"
          className="max-h-72 w-full rounded-lg object-contain"
        />
      ) : null}
      {attachment.caption && <p className="text-sm">{attachment.caption}</p>}
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
