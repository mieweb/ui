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
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageRow } from './parts';
import type {
  AIRenderTextContent,
  Participant,
  SuperChatLinkBuilder,
  SuperChatMessage,
  SuperChatRef,
} from './types';

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
  /**
   * Thread ordering. `'asc'` anchors new messages to the bottom; `'desc'`
   * anchors them to the top (feed style).
   */
  order: 'asc' | 'desc';
  /** Conversation id — changing it re-anchors scroll to the newest message. */
  conversationId: string;
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
  order,
  conversationId,
  containerProps,
}: VirtualThreadProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    // Rough first guess; real heights are measured via measureElement.
    estimateSize: () => 88,
    overscan: 10,
    getItemKey: (index) => items[index]?.id ?? index,
  });

  // Anchor to the newest message: bottom for ascending order, top for
  // descending (feed-style) order. Runs on mount, when the conversation
  // changes, and when a message is appended.
  const count = items.length;
  React.useEffect(() => {
    if (count === 0) return;
    if (order === 'desc') {
      virtualizer.scrollToIndex(0, { align: 'start' });
    } else {
      virtualizer.scrollToIndex(count - 1, { align: 'end' });
    }
    // `virtualizer` is stable across renders for a given instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, conversationId, order]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div {...containerProps} ref={parentRef}>
      <div
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
                left: 0,
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
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
