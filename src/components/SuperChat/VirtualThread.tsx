/**
 * VirtualThread — windowed (virtualized) message list for {@link SuperChat}.
 *
 * Renders only the rows near the viewport using `@tanstack/react-virtual` with
 * dynamic measurement, so a thread of thousands of messages mounts ~20-30 DOM
 * subtrees instead of all of them. This keeps first render, memory, and the
 * Markdown parse cost bounded by what is on screen rather than by the total
 * history length.
 *
 * Opt-in via the `virtualized` prop on `SuperChat`/`SuperChatInbox`. The
 * non-virtualized path remains the default for short threads, where the extra
 * absolute-positioning machinery is unnecessary.
 */

import * as React from 'react';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { MessageRow } from './parts';
import type {
  AIRenderTextContent,
  Participant,
  SuperChatCopyFormat,
  SuperChatLinkBuilder,
  SuperChatMessage,
  SuperChatRef,
  SuperChatRenderMessageMedia,
} from './types';

/** What a remounted thread needs to come back on the same rows. */
export interface VirtualThreadLayout {
  measurements: VirtualItem[];
  offset: number;
}

export interface VirtualThreadProps {
  /** The messages to render, already sorted in display order. */
  items: SuperChatMessage[];
  /** Lookup from participant id to participant. */
  participantById: Map<string, Participant>;
  /** The local user id (drives self-alignment). */
  currentParticipantId?: string;
  /** Text renderer (Markdown pipeline). */
  renderText: AIRenderTextContent;
  /** Build hrefs for `ref` items. */
  linkBuilder?: SuperChatLinkBuilder;
  /** Fired when a reference chip is activated. */
  onReferenceClick?: (ref: SuperChatRef) => void;
  /** Whether self-authored text messages expose an inline "Edit" affordance. */
  editable?: boolean;
  /** Save handler for an inline message edit (bound to the message's id). */
  onMessageEdited?: (messageId: string, text: string) => void;
  /** Format for a message's default copy action (Ctrl/Cmd-click on copy). */
  defaultCopyFormat?: SuperChatCopyFormat;
  onOpenMedia?: (
    messageId: string,
    attachmentId: string,
    play?: boolean
  ) => void;
  openMediaLabel?: string;
  playMediaLabel?: string;
  /** Localized preview load-error/retry text, forwarded to each row. */
  mediaErrorLabel?: string;
  mediaRetryLabel?: string;
  /** Prefix of a scheduled message's indicator, forwarded to each row. */
  scheduledLabel?: string;
  /** The host's card for an attachment, forwarded to each row. */
  renderMessageMedia?: SuperChatRenderMessageMedia;
  /** The attachment cards' box, a CSS length, forwarded to each row. */
  mediaMaxSize?: string;
  /**
   * Host-owned ref for the scroll container. {@link SuperChat} owns all
   * scroll anchoring (bottom-pinning, jump-to-bottom) through this ref.
   */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Host-owned ref for the inner sizer — its growth re-pins the scroll. */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Host-owned store for the measured rows and scroll offset, kept across
   * remounts (the media view unmounts the thread) so the thread comes back
   * on the same rows instead of fresh estimates.
   */
  layoutRef?: React.RefObject<VirtualThreadLayout | undefined>;
  /** Props forwarded to the scroll container (role/aria/tabIndex/className). */
  containerProps: React.HTMLAttributes<HTMLDivElement> & {
    'data-slot'?: string;
  };
}

export function VirtualThread({
  items,
  participantById,
  currentParticipantId,
  renderText,
  linkBuilder,
  onReferenceClick,
  editable,
  onMessageEdited,
  defaultCopyFormat,
  onOpenMedia,
  openMediaLabel,
  playMediaLabel,
  mediaErrorLabel,
  mediaRetryLabel,
  scheduledLabel,
  renderMessageMedia,
  mediaMaxSize,
  scrollRef,
  contentRef,
  layoutRef,
  containerProps,
}: VirtualThreadProps) {
  const [initialLayout] = React.useState(() => layoutRef?.current);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    // Rough first guess; real heights are measured via measureElement.
    estimateSize: () => 88,
    overscan: 10,
    getItemKey: (index) => items[index]?.id ?? index,
    initialMeasurementsCache: initialLayout?.measurements,
    initialOffset: initialLayout?.offset,
  });
  React.useEffect(
    () => () => {
      if (layoutRef)
        layoutRef.current = {
          measurements: virtualizer.takeSnapshot(),
          offset: virtualizer.scrollOffset ?? 0,
        };
    },
    [layoutRef, virtualizer]
  );

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div {...containerProps} ref={scrollRef}>
      <div
        ref={contentRef}
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative',
          width: '100%',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const message = items[virtualRow.index];
          if (!message) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                insetInlineStart: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Bottom padding stands in for the non-virtual `space-y-4` gap
                  and is included in the measured height. */}
              <div className="pb-4">
                <MessageRow
                  message={message}
                  participant={participantById.get(message.participantId)}
                  isSelf={
                    !!currentParticipantId &&
                    message.participantId === currentParticipantId
                  }
                  renderText={renderText}
                  linkBuilder={linkBuilder}
                  onReferenceClick={onReferenceClick}
                  editable={editable}
                  onMessageEdited={onMessageEdited}
                  defaultCopyFormat={defaultCopyFormat}
                  onOpenMedia={onOpenMedia}
                  openMediaLabel={openMediaLabel}
                  playMediaLabel={playMediaLabel}
                  mediaErrorLabel={mediaErrorLabel}
                  mediaRetryLabel={mediaRetryLabel}
                  scheduledLabel={scheduledLabel}
                  renderMessageMedia={renderMessageMedia}
                  mediaMaxSize={mediaMaxSize}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
