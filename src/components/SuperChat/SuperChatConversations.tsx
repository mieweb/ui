/**
 * SuperChatConversations — the conversation list (inbox sidebar) for
 * `@mieweb/ui`.
 *
 * Renders the host-owned conversations sorted by last activity, with unread
 * badges and an optional "new conversation" action. Conversations with
 * `children` render as accordion headers with their sub-conversations nested
 * beneath (e.g. date-range slices of a room). Supports both controlled
 * (`activeConversationId`) and uncontrolled (`defaultActiveConversationId`)
 * selection. Pair with {@link SuperChat} for the message panel, or use
 * {@link SuperChatInbox} for the combined surface.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Animated, AnimatedPresence } from '../../motion';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import {
  findConversation,
  sidebarItem,
  lastActivityOf,
  lastMessageByTime,
} from './parts';
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
  // Badges present on the list's first render are state, not news. Tracked
  // here rather than per row so a row inserted later still pops its badge.
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => setHasMounted(true), []);
  const requestedId = activeConversationId ?? internalActive;
  // Fall back to the first conversation when the requested id no longer exists
  // (e.g. the active conversation was removed) so an item stays highlighted.
  const active = findConversation(conversations, requestedId);
  const activeId = active ? requestedId : conversations[0]?.id;
  // The top-level entry holding the active item (itself, or a child's parent).
  const activeTopId = active?.parent?.id ?? activeId;

  // Accordion: at most one entry is open. `openId` is the user's choice (`null`
  // = all closed); until there is one, the entry holding the active item opens.
  const [openId, setOpenId] = React.useState<string | null>();
  const isExpanded = (c: SuperChatConversation) =>
    (openId === undefined ? activeTopId : openId) === c.id;
  const groupIdPrefix = React.useId();

  const sortedConversations = React.useMemo(
    () =>
      [...conversations].sort((a, b) => lastActivityOf(b) - lastActivityOf(a)),
    [conversations]
  );

  const selectConversation = (c: SuperChatConversation) => {
    if (activeConversationId === undefined) setInternalActive(c.id);
    onConversationOpened?.(c);
  };

  // An entry with children is an accordion header: opening it shows all of its
  // messages and expands it (closing any other); clicking it again while
  // active toggles it.
  const selectHeader = (c: SuperChatConversation) => {
    setOpenId(c.id === activeId && isExpanded(c) ? null : c.id);
    selectConversation(c);
  };

  // Opening a plain entry hands the accordion back to the active item.
  const selectTopLevel = (c: SuperChatConversation) => {
    setOpenId(undefined);
    selectConversation(c);
  };

  return (
    <aside
      data-slot="superchat-conversations"
      aria-label="Conversations"
      className={cn(
        'flex w-64 shrink-0 flex-col border-e border-neutral-200 dark:border-neutral-700',
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
          const children = c.children ?? [];
          const hasChildren = children.length > 0;
          const expanded = hasChildren && isExpanded(c);
          const groupId = `${groupIdPrefix}-${c.id}`;
          return (
            <div key={c.id} role="listitem">
              <button
                type="button"
                aria-current={isActive ? 'true' : undefined}
                aria-expanded={hasChildren ? expanded : undefined}
                aria-controls={expanded ? groupId : undefined}
                onClick={() =>
                  hasChildren ? selectHeader(c) : selectTopLevel(c)
                }
                className={sidebarItem({ active: isActive })}
              >
                {hasChildren && (
                  <ChevronRightIcon
                    size={14}
                    aria-hidden="true"
                    className={cn(
                      'shrink-0 text-neutral-500 transition-transform',
                      // Down when open (no mirroring needed); otherwise it
                      // points toward the inline end.
                      expanded ? 'rotate-90' : 'rtl:-scale-x-100'
                    )}
                  />
                )}
                <span className="flex-1 truncate">
                  <span className="block truncate font-medium">{c.title}</span>
                  {last?.text && (
                    <span className="block truncate text-xs text-neutral-600 dark:text-neutral-400">
                      {last.text}
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
                      {c.unread}
                      <span className="sr-only"> unread messages</span>
                    </Animated>
                  )}
                </AnimatedPresence>
              </button>
              {expanded && (
                <div
                  id={groupId}
                  data-slot="superchat-conversation-children"
                  role="list"
                  aria-label={c.title}
                  className="ms-5 mt-1 space-y-0.5 border-s border-neutral-200 ps-2 dark:border-neutral-700"
                >
                  {children.map((child) => {
                    const isChildActive = child.id === activeId;
                    return (
                      <div key={child.id} role="listitem">
                        <button
                          type="button"
                          aria-current={isChildActive ? 'true' : undefined}
                          onClick={() => selectConversation(child)}
                          className={cn(
                            sidebarItem({ active: isChildActive }),
                            'py-1.5'
                          )}
                        >
                          <span className="flex-1 truncate">{child.title}</span>
                          <span className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                            {child.thread.length}
                            <span className="sr-only"> messages</span>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
