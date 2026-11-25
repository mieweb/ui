/**
 * SuperChat labels — resolves a host's `Partial<SuperChatLabels>` against the
 * English defaults. Internal to the SuperChat module.
 */

import * as React from 'react';
import { useMessages, type MessageTranslator } from '../../utils/messages';
import type { SuperChatLabels } from './types';

/**
 * The English defaults, each passed through the `MessagesProvider` translator
 * (`m`) so an app-wide message catalog still applies to keys the host leaves
 * unset. The English source strings are the catalog keys.
 */
function defaultLabels(m: MessageTranslator): SuperChatLabels {
  return {
    inboxLabel: (title) => m('Chat: {title}', { title }),
    emptyInboxLabel: m('Chat'),
    noConversationSelected: m('No conversation selected'),
    sidebarResize: m('Resize conversation list'),

    conversations: m('Conversations'),
    newConversation: m('New conversation'),
    unreadCount: (count) => m('{count} unread messages', { count }),
    searchConversations: m('Search conversations'),
    searchPlaceholder: m('Search…'),
    noMatchingConversations: m('No matching conversations'),

    backToConversations: m('Back to conversations'),
    participants: m('Participants'),
    closeConversation: m('Close conversation'),
    messages: m('Messages'),
    scrollToBottom: m('Scroll to bottom'),
    newMessages: m('New messages'),
    newMessagesScrollToBottom: m('New messages — scroll to bottom'),

    backToConversation: m('Back to conversation'),
    openMedia: m('Open in media feed'),
    playMedia: m('Play'),

    messageInput: m('Message'),
    composerPlaceholder: m('Type a message… use @ to address an agent'),
    readOnlyPlaceholder: m('Read-only conversation'),
    addToMessage: m('Add to message'),
    attachFiles: m('Attach files'),
    sendMessage: m('Send message'),
    sendingMessage: m('Sending message…'),
    sendFailed: m('Failed to send message'),
    moreSendOptions: m('More send options'),
    stopGenerating: m('Stop generating'),
    selectAgent: m('Select agent'),
    mentionList: m('Mention'),
    dropFiles: m('Drop files here'),

    messageLabel: (author, time, scheduled) =>
      scheduled
        ? m('{author}, {time}, {scheduled}', { author, time, scheduled })
        : m('{author}, {time}', { author, time }),
    unknownAuthor: m('Unknown'),
    scheduled: m('Scheduled'),
    edited: m('(edited)'),
    editedAt: (time) => m('Edited {time}', { time }),
    messageActions: m('Message actions'),
    copyMessage: m('Copy message'),
    copyMessageTitle: m('Copy message (\u2318/Ctrl-click: default format)'),
    copyAs: m('Copy as'),
    copyAsRichText: m('Copy as rich text'),
    copyAsRichTextDescription: m('Rich text + Markdown'),
    copyAsMarkdown: m('Copy as Markdown'),
    copyAsPlainText: m('Copy as plain text'),
    editMessage: m('Edit message'),
    save: m('Save'),
    cancel: m('Cancel'),
    thinking: m('Thinking'),
    thought: m('Thought'),
    thoughtFor: (seconds) => m('Thought for {seconds}s', { seconds }),
  };
}

function shallowEqual<T extends object>(a: T | undefined, b: T | undefined) {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a) as (keyof T)[];
  return (
    aKeys.length === Object.keys(b).length &&
    aKeys.every((key) => Object.is(a[key], b[key]))
  );
}

/**
 * The host's overrides merged over the defaults. The result keeps its identity
 * while the overrides are shallow-equal, so an inline `labels={{ … }}` of
 * strings (or stable functions) doesn't re-render every memoized message row.
 */
export function useSuperChatLabels(
  overrides: Partial<SuperChatLabels> | undefined
): SuperChatLabels {
  const m = useMessages();
  const stableRef = React.useRef(overrides);
  if (!shallowEqual(stableRef.current, overrides)) {
    stableRef.current = overrides;
  }
  const stable = stableRef.current;
  return React.useMemo(() => {
    const merged = { ...defaultLabels(m) };
    if (stable) {
      for (const key of Object.keys(stable) as (keyof SuperChatLabels)[]) {
        // An explicit `undefined` keeps the default.
        if (stable[key] !== undefined) {
          (merged as Record<string, unknown>)[key] = stable[key];
        }
      }
    }
    return merged;
  }, [m, stable]);
}
