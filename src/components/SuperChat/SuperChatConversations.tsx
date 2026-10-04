/**
 * SuperChatConversations — the conversation list (inbox sidebar) for
 * `@mieweb/ui`.
 *
 * Renders the host-owned conversations sorted by last activity, with unread
 * badges and an optional "new conversation" action. Supports both controlled
 * (`activeConversationId`) and uncontrolled (`defaultActiveConversationId`)
 * selection. Pair with {@link SuperChat} for the message panel, or use
 * {@link SuperChatInbox} for the combined surface.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Animated, AnimatedPresence } from '../../motion';
import { sidebarItem, lastActivityOf, lastMessageByTime } from './parts';
import { defaultSuperChatLabels, type SuperChatLabels } from './labels';
import { resolveActiveConversation } from './selection';
import type { SuperChatConversation } from './types';

// ============================================================================
// SuperChatConversations (conversation list)
// ============================================================================

export interface SuperChatConversationsProps extends React.HTMLAttributes<HTMLElement> {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled active conversation id. `null` explicitly selects nothing. */
  activeConversationId?: string | null;
  /** Uncontrolled initial active conversation id. */
  defaultActiveConversationId?: string | null;
  /** Missing-id behavior. Defaults to the legacy first-row selection. */
  selectionFallback?: 'first' | 'none';
  /** Catalog is loading; existing rows remain visible. */
  loading?: boolean;
  /** Host-rendered catalog error; existing rows remain visible. */
  error?: React.ReactNode;
  /** Replace the empty catalog message. */
  renderEmpty?: () => React.ReactNode;
  /** Override user-facing strings. */
  labels?: Partial<SuperChatLabels>;
  /** Additional class name. */
  className?: string;

  // --- callbacks ---
  onConversationOpened?: (conversation: SuperChatConversation) => void;
  onNewConversation?: () => void;
}

/**
 * Conversation list. See the module `MAINTAINERS.md` for the data model.
 */
export const SuperChatConversations = React.forwardRef<
  HTMLElement,
  SuperChatConversationsProps
>(function SuperChatConversations(
  {
    conversations,
    activeConversationId,
    defaultActiveConversationId,
    selectionFallback = 'first',
    loading = false,
    error,
    renderEmpty,
    labels,
    className,
    onConversationOpened,
    onNewConversation,
    ...rest
  },
  ref
) {
  const text = { ...defaultSuperChatLabels, ...labels };
  const hasError = error != null && error !== false;
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId !== undefined
      ? defaultActiveConversationId
      : selectionFallback === 'first'
        ? conversations[0]?.id
        : undefined
  );
  // Badges present on the list's first render are state, not news. Tracked
  // here rather than per row so a row inserted later still pops its badge.
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => setHasMounted(true), []);
  const requestedId =
    activeConversationId !== undefined ? activeConversationId : internalActive;
  const activeId = resolveActiveConversation(
    conversations,
    requestedId,
    selectionFallback
  )?.id;

  const sortedConversations = React.useMemo(
    () =>
      [...conversations].sort((a, b) => lastActivityOf(b) - lastActivityOf(a)),
    [conversations]
  );

  const selectConversation = (c: SuperChatConversation) => {
    if (activeConversationId === undefined) setInternalActive(c.id);
    onConversationOpened?.(c);
  };

  return (
    <aside
      {...rest}
      ref={ref}
      data-slot="superchat-conversations"
      aria-label={rest['aria-label'] ?? text.conversations}
      aria-busy={loading || undefined}
      className={cn(
        'flex w-64 shrink-0 flex-col border-e border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      <div className="flex items-center justify-between p-3">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {text.conversations}
        </span>
        {onNewConversation && (
          <button
            type="button"
            onClick={onNewConversation}
            aria-label={text.newConversation}
            className="focus-visible:ring-primary-500 min-h-11 min-w-11 rounded-md px-2 py-1 text-lg leading-none text-neutral-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-neutral-800"
          >
            +
          </button>
        )}
      </div>
      {loading && (
        <div
          role="status"
          className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300"
        >
          {text.loadingConversations}
        </div>
      )}
      {hasError && (
        <div
          role="alert"
          className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300"
        >
          {error}
        </div>
      )}
      {!loading && !hasError && conversations.length === 0 && (
        <div className="p-3 text-sm text-neutral-600 dark:text-neutral-300">
          {renderEmpty ? renderEmpty() : text.emptyConversations}
        </div>
      )}
      <div
        data-slot="superchat-conversation-list"
        role="list"
        className="flex-1 space-y-1 overflow-y-auto px-2 pb-2"
      >
        {sortedConversations.map((c) => {
          const last = lastMessageByTime(c.thread);
          const preview = c.preview ?? last?.text;
          const isActive = c.id === activeId;
          return (
            <div key={c.id} role="listitem">
              <button
                type="button"
                data-slot="superchat-conversation-button"
                data-conversation-id={c.id}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => selectConversation(c)}
                className={cn(
                  sidebarItem({ active: isActive }),
                  'focus-visible:ring-primary-500 min-h-11 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset'
                )}
              >
                <span className="flex-1 truncate">
                  <span className="block truncate font-medium">{c.title}</span>
                  {preview && (
                    <span className="block truncate text-xs text-neutral-600 dark:text-neutral-400">
                      {preview}
                    </span>
                  )}
                </span>
                <AnimatedPresence initial={hasMounted}>
                  {!!c.unread && (
                    <Animated
                      key="unread"
                      as="span"
                      preset="pop"
                      mode="presence"
                      data-slot="superchat-unread-badge"
                      className="bg-primary-600 ms-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white"
                    >
                      <span aria-hidden="true">{c.unread}</span>
                      <span className="sr-only">
                        {text.unreadMessages(c.unread)}
                      </span>
                    </Animated>
                  )}
                </AnimatedPresence>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
});
