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
import { sidebarItem, lastActivityOf, lastMessageByTime } from './parts';
import type { SuperChatConversation } from './types';

// ============================================================================
// SuperChatConversations (conversation list)
// ============================================================================

export interface SuperChatConversationsProps {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled active conversation id. */
  activeConversationId?: string;
  /** Uncontrolled initial active conversation id. */
  defaultActiveConversationId?: string;
  /** Additional class name. */
  className?: string;

  // --- callbacks ---
  onConversationOpened?: (conversation: SuperChatConversation) => void;
  onNewConversation?: () => void;
}

/**
 * Conversation list. See the module `MAINTAINERS.md` for the data model.
 */
export function SuperChatConversations({
  conversations,
  activeConversationId,
  defaultActiveConversationId,
  className,
  onConversationOpened,
  onNewConversation,
}: SuperChatConversationsProps) {
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId ?? conversations[0]?.id
  );
  const requestedId = activeConversationId ?? internalActive;
  // Fall back to the first conversation when the requested id no longer exists
  // (e.g. the active conversation was removed) so an item stays highlighted.
  const activeId = conversations.some((c) => c.id === requestedId)
    ? requestedId
    : conversations[0]?.id;

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
      data-slot="superchat-conversations"
      aria-label="Conversations"
      className={cn(
        'flex w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      <div className="flex items-center justify-between p-3">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Conversations
        </span>
        {onNewConversation && (
          <button
            type="button"
            onClick={onNewConversation}
            aria-label="New conversation"
            className="rounded-md px-2 py-1 text-lg leading-none text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            +
          </button>
        )}
      </div>
      <div
        data-slot="superchat-conversation-list"
        role="list"
        className="flex-1 space-y-1 overflow-y-auto px-2 pb-2"
      >
        {sortedConversations.map((c) => {
          const last = lastMessageByTime(c.thread);
          const isActive = c.id === activeId;
          return (
            <div key={c.id} role="listitem">
              <button
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => selectConversation(c)}
                className={sidebarItem({ active: isActive })}
              >
                <span className="flex-1 truncate">
                  <span className="block truncate font-medium">{c.title}</span>
                  {last?.text && (
                    <span className="block truncate text-xs text-neutral-600 dark:text-neutral-400">
                      {last.text}
                    </span>
                  )}
                </span>
                {!!c.unread && (
                  <span className="bg-primary-600 ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white">
                    {c.unread}
                    <span className="sr-only"> unread messages</span>
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
