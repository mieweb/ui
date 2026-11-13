/**
 * SuperChatConversations — the conversation list (inbox sidebar) for
 * `@mieweb/ui`.
 *
 * Renders the host-owned conversations sorted by last activity, with unread
 * badges and an optional "new conversation" action. The header can carry a
 * custom title, a search box and host content such as filters; the host owns
 * the query and passes the conversations already filtered. Supports both controlled
 * (`activeConversationId`) and uncontrolled (`defaultActiveConversationId`)
 * selection. Pair with {@link SuperChat} for the message panel, or use
 * {@link SuperChatInbox} for the combined surface.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import { Animated, AnimatedPresence } from '../../motion';
import { SearchIcon } from '../Icons';
import { Input } from '../Input';
import { sidebarItem, lastActivityOf, lastMessageByTime } from './parts';
import type { SuperChatConversation } from './types';

// ============================================================================
// SuperChatConversations (conversation list)
// ============================================================================

/** The list's search box. The host owns the query and filters `conversations`. */
export interface SuperChatConversationsSearch {
  /** Current query. */
  value: string;
  /** Called on every change to the query. */
  onChange: (value: string) => void;
  /** Placeholder text. @default 'Search…' */
  placeholder?: string;
  /** Accessible label (visually hidden). @default 'Search conversations' */
  label?: string;
  /** Status shown when the query matches nothing. @default 'No matching conversations' */
  noResultsLabel?: string;
}

export interface SuperChatConversationsProps {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled active conversation id. */
  activeConversationId?: string;
  /** Uncontrolled initial active conversation id. */
  defaultActiveConversationId?: string;
  /**
   * Heading above the list. `null` hides it (the row stays only for the
   * "new conversation" button). @default 'Conversations'
   */
  listTitle?: React.ReactNode;
  /**
   * Host content under the heading (and the search box), e.g. filter
   * dropdowns or a date range. Stays put while the list scrolls.
   */
  listHeader?: React.ReactNode;
  /** Adds a search box to the header. See {@link SuperChatConversationsSearch}. */
  search?: SuperChatConversationsSearch;
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
  listTitle,
  listHeader,
  search,
  className,
  onConversationOpened,
  onNewConversation,
}: SuperChatConversationsProps) {
  const m = useMessages();
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId ?? conversations[0]?.id
  );
  // Badges present on the list's first render are state, not news. Tracked
  // here rather than per row so a row inserted later still pops its badge.
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => setHasMounted(true), []);
  // Uncontrolled: fall back to the first conversation when the remembered id
  // no longer exists (e.g. it was removed) so an item stays highlighted.
  // Controlled: trust the host. Its active conversation may be filtered out
  // of this list (a search), and highlighting another row would be wrong.
  const activeId =
    activeConversationId !== undefined
      ? activeConversationId
      : conversations.some((c) => c.id === internalActive)
        ? internalActive
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
      aria-label={m('Conversations')}
      className={cn(
        'flex w-64 shrink-0 flex-col border-e border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      {(listTitle !== null || onNewConversation) && (
        <div
          data-slot="superchat-conversations-title"
          className="flex items-center justify-between p-3"
        >
          {listTitle !== null && (
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {listTitle ?? m('Conversations')}
            </span>
          )}
          {onNewConversation && (
            <button
              type="button"
              onClick={onNewConversation}
              aria-label={m('New conversation')}
              className="ms-auto rounded-md px-2 py-1 text-lg leading-none text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              +
            </button>
          )}
        </div>
      )}
      {(search || listHeader) && (
        <div
          data-slot="superchat-conversations-header"
          className={cn(
            'flex flex-col gap-3 px-3 pb-3',
            listTitle === null && !onNewConversation && 'pt-3'
          )}
        >
          {search && (
            <div
              data-slot="superchat-conversations-search"
              className="relative"
            >
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute start-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              />
              <Input
                type="search"
                size="sm"
                label={search.label ?? m('Search conversations')}
                hideLabel
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? m('Search…')}
                className="ps-8"
              />
            </div>
          )}
          {listHeader}
        </div>
      )}
      {search && (
        // Always mounted so screen readers announce the change, not just the text.
        <p
          role="status"
          data-slot="superchat-conversations-no-results"
          className={cn(
            'px-3 pb-2 text-xs text-neutral-500 dark:text-neutral-400',
            !(search.value.trim() && conversations.length === 0) && 'sr-only'
          )}
        >
          {search.value.trim() && conversations.length === 0
            ? (search.noResultsLabel ?? m('No matching conversations'))
            : ''}
        </p>
      )}
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
            </div>
          );
        })}
      </div>
    </aside>
  );
}
