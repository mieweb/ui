/**
 * SuperChat — a single-conversation chat panel for `@mieweb/ui`.
 *
 * Renders one {@link SuperChatConversation}: header (title + participants +
 * optional close), a `role="log"` message thread, and the compose box. Message
 * text renders through the pluggable Markdown pipeline
 * ({@link createMarkdownRenderer}); rich plugins (code/math/genui/…) are opt-in.
 *
 * For a conversation list use {@link SuperChatConversations}; for the combined
 * inbox (list + panel) use {@link SuperChatInbox}.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { CloseIcon } from '../AI/icons';
import { createMarkdownRenderer } from './render/createMarkdownRenderer';
import { ParticipantAvatar, Composer, MessageRow, byTime } from './parts';
import { VirtualThread } from './VirtualThread';
import type {
  AIRenderTextContent,
  Participant,
  SuperChatConversation,
  SuperChatLinkBuilder,
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// SuperChat (single-conversation panel)
// ============================================================================

export interface SuperChatProps {
  /** The conversation to display (host-owned state). */
  conversation: SuperChatConversation;
  /** The participant id representing the local user (alignment + compose). */
  currentParticipantId?: string;
  /** Opt-in rich render plugins (code/math/genui/…). */
  renderPlugins?: SuperChatRenderPlugin[];
  /** Override the entire text renderer (advanced). */
  renderTextContent?: AIRenderTextContent;
  /** Treat content as trusted and skip sanitization (host-authored only). */
  trustedContent?: boolean;
  /** Disable the composer. */
  readOnly?: boolean;
  /**
   * Thread ordering.
   * - `'asc'` (default): oldest → newest, anchored to the bottom like a
   *   classic messenger (auto-scrolls to the newest message).
   * - `'desc'`: newest → oldest, anchored to the top like a social feed
   *   (auto-scrolls to the top when a new message arrives).
   */
  order?: 'asc' | 'desc';
  /**
   * Virtualize the message thread (windowed rendering). Only the rows near the
   * viewport are mounted, so very long threads (hundreds to thousands of
   * messages) stay responsive. Off by default — enable for long histories.
   */
  virtualized?: boolean;
  /** Build hrefs for `ref` thread items. */
  linkBuilder?: SuperChatLinkBuilder;
  /** Additional class name. */
  className?: string;

  // --- callbacks (chat-component-compatible) ---
  onMessageSent?: (
    text: string,
    meta: { conversation: SuperChatConversation; mentions: string[] }
  ) => void;
  onConversationClosed?: (conversation: SuperChatConversation) => void;
  onReferenceClick?: (ref: SuperChatRef) => void;
  /**
   * Show a "back" affordance in the header (used by {@link SuperChatInbox} on
   * small screens to return from the chat panel to the conversation list).
   */
  onBack?: () => void;
}

/**
 * Single-conversation chat panel. See the module `MAINTAINERS.md` for the
 * participant model and render-plugin architecture.
 */
export function SuperChat({
  conversation,
  currentParticipantId,
  renderPlugins,
  renderTextContent,
  trustedContent,
  readOnly,
  order = 'asc',
  virtualized = false,
  linkBuilder,
  className,
  onMessageSent,
  onConversationClosed,
  onReferenceClick,
  onBack,
}: SuperChatProps) {
  const headingId = React.useId();

  const renderText = React.useMemo<AIRenderTextContent>(
    () =>
      renderTextContent ??
      createMarkdownRenderer({
        plugins: renderPlugins,
        trusted: trustedContent,
      }),
    [renderTextContent, renderPlugins, trustedContent]
  );

  const threadRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (virtualized) return; // VirtualThread manages its own scroll anchoring.
    const el = threadRef.current;
    if (!el) return;
    // Anchor to the newest message: bottom for ascending order, top for
    // descending (feed-style) order.
    el.scrollTop = order === 'desc' ? 0 : el.scrollHeight;
  }, [conversation.thread.length, conversation.id, order, virtualized]);

  const participantById = React.useMemo(() => {
    const map = new Map<string, Participant>();
    conversation.participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [conversation]);

  const orderedThread = React.useMemo(() => {
    const sorted = [...conversation.thread].sort(byTime);
    return order === 'desc' ? sorted.reverse() : sorted;
  }, [conversation, order]);

  return (
    <section
      data-slot="superchat"
      role="group"
      aria-labelledby={headingId}
      className={cn(
        'flex min-w-0 flex-1 flex-col bg-white dark:bg-neutral-900',
        className
      )}
    >
      <header
        data-slot="superchat-header"
        className="flex items-center justify-between gap-2 border-b border-neutral-200 p-3 dark:border-neutral-700"
      >
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="-ml-1 shrink-0 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 sm:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h2
              id={headingId}
              className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100"
            >
              {conversation.title}
            </h2>
            <div
              data-slot="superchat-participants"
              role="group"
              aria-label="Participants"
              className="mt-0.5 flex items-center gap-1"
            >
              {conversation.participants.slice(0, 6).map((p) => (
                <span key={p.id} role="img" aria-label={p.name}>
                  <ParticipantAvatar participant={p} size="sm" />
                </span>
              ))}
            </div>
          </div>
        </div>
        {onConversationClosed && (
          <button
            type="button"
            onClick={() => onConversationClosed(conversation)}
            aria-label="Close conversation"
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <CloseIcon />
          </button>
        )}
      </header>

      {virtualized ? (
        <VirtualThread
          items={orderedThread}
          participantById={participantById}
          currentParticipantId={currentParticipantId}
          renderText={renderText}
          linkBuilder={linkBuilder}
          onReferenceClick={onReferenceClick}
          order={order}
          conversationId={conversation.id}
          containerProps={{
            'data-slot': 'superchat-thread',
            role: 'log',
            'aria-label': 'Messages',
            'aria-live': 'polite',
            // Focusable so keyboard-only users can scroll the message history.
            tabIndex: 0,
            className: 'flex-1 overflow-y-auto p-4',
          }}
        />
      ) : (
        <div
          data-slot="superchat-thread"
          ref={threadRef}
          role="log"
          aria-label="Messages"
          aria-live="polite"
          // Focusable so keyboard-only users can scroll the message history.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="flex-1 space-y-4 overflow-y-auto p-4"
        >
          {orderedThread.map((m) => (
            <MessageRow
              key={m.id}
              message={m}
              participant={participantById.get(m.participantId)}
              isSelf={
                !!currentParticipantId &&
                m.participantId === currentParticipantId
              }
              renderText={renderText}
              linkBuilder={linkBuilder}
              onReferenceClick={onReferenceClick}
            />
          ))}
        </div>
      )}

      <Composer
        participants={conversation.participants}
        disabled={readOnly}
        onSend={(text, mentions) =>
          onMessageSent?.(text, { conversation, mentions })
        }
      />
    </section>
  );
}
