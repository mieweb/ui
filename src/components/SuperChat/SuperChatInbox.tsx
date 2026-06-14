/**
 * SuperChatInbox — the combined inbox surface for `@mieweb/ui`.
 *
 * Composes {@link SuperChatConversations} (the list) and {@link SuperChat} (the
 * single-conversation panel) into one framed surface. Owns active-conversation
 * coordination and supports both controlled (`activeConversationId`) and
 * uncontrolled (`defaultActiveConversationId`) selection.
 *
 * This is the drop-in equivalent of the original monolithic `SuperChat`: it
 * accepts the same props (conversations array + callbacks).
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { SuperChat } from './SuperChat';
import { SuperChatConversations } from './SuperChatConversations';
import type {
  AIRenderTextContent,
  SuperChatConversation,
  SuperChatLinkBuilder,
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// SuperChatInbox (list + panel)
// ============================================================================

export interface SuperChatInboxProps {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled active conversation id. */
  activeConversationId?: string;
  /** Uncontrolled initial active conversation id. */
  defaultActiveConversationId?: string;
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
  /** Show the conversation sidebar. */
  showSidebar?: boolean;
  /** Build hrefs for `ref` thread items. */
  linkBuilder?: SuperChatLinkBuilder;
  /** Additional class name. */
  className?: string;

  // --- callbacks (chat-component-compatible) ---
  onMessageSent?: (
    text: string,
    meta: { conversation: SuperChatConversation; mentions: string[] }
  ) => void;
  onConversationOpened?: (conversation: SuperChatConversation) => void;
  onConversationClosed?: (conversation: SuperChatConversation) => void;
  onNewConversation?: () => void;
  onReferenceClick?: (ref: SuperChatRef) => void;
}

/**
 * Combined inbox surface (conversation list + active conversation panel). See
 * the module `MAINTAINERS.md` for the participant model and render-plugin
 * architecture.
 */
export function SuperChatInbox({
  conversations,
  activeConversationId,
  defaultActiveConversationId,
  currentParticipantId,
  renderPlugins,
  renderTextContent,
  trustedContent,
  readOnly,
  showSidebar = true,
  linkBuilder,
  className,
  onMessageSent,
  onConversationOpened,
  onConversationClosed,
  onNewConversation,
  onReferenceClick,
}: SuperChatInboxProps) {
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId ?? conversations[0]?.id
  );
  const requestedId = activeConversationId ?? internalActive;
  const active =
    conversations.find((c) => c.id === requestedId) ?? conversations[0];
  // Resolve the active id from the conversation actually shown so the sidebar
  // highlight never disagrees with the panel when `conversations` changes.
  const activeId = active?.id;

  const handleOpen = (c: SuperChatConversation) => {
    if (activeConversationId === undefined) setInternalActive(c.id);
    onConversationOpened?.(c);
  };

  return (
    <div
      data-slot="superchat-inbox"
      role="group"
      aria-label={active ? `Chat: ${active.title}` : 'Chat'}
      className={cn(
        'flex h-full overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
        className
      )}
    >
      {showSidebar && (
        <SuperChatConversations
          conversations={conversations}
          activeConversationId={activeId}
          onConversationOpened={handleOpen}
          onNewConversation={onNewConversation}
        />
      )}

      {active ? (
        <SuperChat
          conversation={active}
          currentParticipantId={currentParticipantId}
          renderPlugins={renderPlugins}
          renderTextContent={renderTextContent}
          trustedContent={trustedContent}
          readOnly={readOnly}
          linkBuilder={linkBuilder}
          onMessageSent={onMessageSent}
          onConversationClosed={onConversationClosed}
          onReferenceClick={onReferenceClick}
        />
      ) : (
        <section
          data-slot="superchat"
          className="flex min-w-0 flex-1 items-center justify-center text-sm text-neutral-400"
        >
          No conversation selected
        </section>
      )}
    </div>
  );
}
