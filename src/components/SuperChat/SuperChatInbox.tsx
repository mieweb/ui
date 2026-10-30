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
import {
  SuperChat,
  type SuperChatComposerProps,
  type SuperChatProps,
} from './SuperChat';
import { SuperChatConversations } from './SuperChatConversations';
import { SidebarResizeHandle } from './SidebarResizeHandle';
import type {
  AIRenderTextContent,
  AttachmentKind,
  SuperChatConversation,
  SuperChatCopyFormat,
  SuperChatLinkBuilder,
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// SuperChatInbox (list + panel)
// ============================================================================

/** Narrowest the conversation panel may be squeezed to by a wide list, in px. */
const MIN_PANEL_WIDTH = 240;

export interface SuperChatInboxProps {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled thread/media view, forwarded to the active conversation panel. */
  view?: SuperChatProps['view'];
  /** Initial uncontrolled panel view; defaults to 'thread'. */
  defaultView?: SuperChatProps['defaultView'];
  /** Fired with the active conversation when its view is changed. */
  onViewChange?: SuperChatProps['onViewChange'];
  /**
   * MediaFeed behavior and slots; items remain scoped to the active
   * conversation. With `layout: 'overlay'`, mount `useKeyboardInset()` in the
   * app shell (see SuperChat's `mediaFeedProps`).
   */
  mediaFeedProps?: SuperChatProps['mediaFeedProps'];
  /** The host's card for a thread attachment (see {@link SuperChatProps.renderMessageMedia}). */
  renderMessageMedia?: SuperChatProps['renderMessageMedia'];
  /** Labels for the view switch and attachment previews. */
  mediaLabels?: SuperChatProps['mediaLabels'];
  /** Labels for per-message states (see {@link SuperChatProps.messageLabels}). */
  messageLabels?: SuperChatProps['messageLabels'];
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
  /** Props for the active panel's message box (see {@link SuperChatProps.composerProps}). */
  composerProps?: SuperChatComposerProps;
  /**
   * File categories the composer accepts for paste, drag-and-drop, and the
   * file picker in the `+` → “Attach files” menu.
   * Defaults to `['image', 'video', 'audio', 'pdf']`.
   */
  acceptedFileTypes?: AttachmentKind[];
  /** Thread ordering: `'asc'` (oldest→newest, default) or `'desc'` (feed-style). */
  order?: 'asc' | 'desc';
  /** Virtualize the message thread (windowed rendering) for long histories. */
  virtualized?: boolean;
  /** Show the conversation sidebar. */
  showSidebar?: boolean;
  /** Content after the last conversation in the sidebar list (see {@link SuperChatConversationsProps.listFooter}). */
  listFooter?: React.ReactNode;
  /**
   * Which pane a small screen starts on, where only one of list and chat fits
   * (below `sm`). Defaults to the list; `'chat'` opens the active conversation.
   */
  defaultMobileView?: 'list' | 'chat';
  /**
   * Show a divider the user can drag (or move with the arrow keys) to resize
   * the sidebar, from `sm` up. Double-clicking it restores
   * `defaultSidebarWidth`. Defaults to `false`.
   */
  resizableSidebar?: boolean;
  /** Controlled sidebar width in px, from `sm` up. Pair with `onSidebarWidthChange`. */
  sidebarWidth?: number;
  /**
   * Starting sidebar width in px when uncontrolled, and the width a
   * double-click on the divider restores. Defaults to `256`.
   */
  defaultSidebarWidth?: number;
  /** Narrowest the divider can make the sidebar, in px. Defaults to `200`. */
  minSidebarWidth?: number;
  /**
   * Widest the divider can make the sidebar, in px. Defaults to `480`. A narrow
   * inbox lowers it further so the panel keeps at least 240px.
   */
  maxSidebarWidth?: number;
  /**
   * Fired with the new, clamped width whenever the user resizes the sidebar.
   * Hosts persist it here (e.g. to `localStorage`) and pass it back as
   * `sidebarWidth` or `defaultSidebarWidth`.
   */
  onSidebarWidthChange?: (width: number) => void;
  /** Accessible name of the resize divider. Defaults to `'Resize conversation list'`. */
  sidebarResizeLabel?: string;
  /** Build hrefs for `ref` thread items. */
  linkBuilder?: SuperChatLinkBuilder;
  /** Format for a message's default copy action (Ctrl/Cmd-click on copy). */
  defaultCopyFormat?: SuperChatCopyFormat;
  /** Additional class name. */
  className?: string;

  // --- callbacks (chat-component-compatible) ---
  /**
   * Fired when the local user sends a message. If the callback returns a
   * promise it is awaited, and a rejected send restores the typed text into
   * the composer (same contract as {@link SuperChatProps.onMessageSent}).
   */
  onMessageSent?: SuperChatProps['onMessageSent'];
  /** Fired when the local user saves an edit to one of their own messages. */
  onMessageEdited?: (
    messageId: string,
    text: string,
    meta: { conversation: SuperChatConversation }
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
  view,
  defaultView,
  onViewChange,
  mediaFeedProps,
  renderMessageMedia,
  mediaLabels,
  messageLabels,
  activeConversationId,
  defaultActiveConversationId,
  currentParticipantId,
  renderPlugins,
  renderTextContent,
  trustedContent,
  readOnly,
  composerProps,
  acceptedFileTypes,
  order,
  virtualized,
  showSidebar = true,
  listFooter,
  defaultMobileView = 'list',
  resizableSidebar = false,
  sidebarWidth,
  defaultSidebarWidth = 256,
  minSidebarWidth = 200,
  maxSidebarWidth = 480,
  onSidebarWidthChange,
  sidebarResizeLabel = 'Resize conversation list',
  linkBuilder,
  defaultCopyFormat,
  className,
  onMessageSent,
  onMessageEdited,
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

  // On small screens the list and panel can't fit side by side, so we show one
  // at a time (master-detail). `mobileView` tracks which is visible; on `sm`+
  // both are always shown and this state is ignored.
  const [mobileView, setMobileView] = React.useState<'list' | 'chat'>(
    defaultMobileView
  );

  // The list can't be wider than leaves the panel `MIN_PANEL_WIDTH`, so the
  // width shown, dragged and announced is always the one actually rendered.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = React.useState<number>();
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !resizableSidebar || typeof ResizeObserver === 'undefined')
      return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry?.contentRect) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [resizableSidebar]);
  const widestSidebar =
    availableWidth === undefined
      ? maxSidebarWidth
      : Math.max(
          minSidebarWidth,
          Math.min(maxSidebarWidth, availableWidth - MIN_PANEL_WIDTH)
        );

  const clampStoredWidth = (w: number) =>
    Math.round(Math.min(maxSidebarWidth, Math.max(minSidebarWidth, w)));
  const clampWidth = (w: number) =>
    Math.round(Math.min(widestSidebar, Math.max(minSidebarWidth, w)));
  const [internalWidth, setInternalWidth] = React.useState(defaultSidebarWidth);
  // Width while a drag is in progress; kept here so the host re-renders once
  // per drag, not once per pointermove.
  const [dragWidth, setDragWidth] = React.useState<number | null>(null);
  const settledWidth = clampWidth(sidebarWidth ?? internalWidth);
  // What is stored, which a narrow inbox can show smaller than this. Only a
  // reset compares against it, so a key press that leaves the divider where it
  // is never overwrites the stored width.
  const savedWidth = clampStoredWidth(sidebarWidth ?? internalWidth);
  const width = dragWidth ?? settledWidth;
  const resizeSidebar = (next: number, final: boolean, reset = false) => {
    const clamped = clampWidth(next);
    if (!final) {
      setDragWidth(clamped);
      return;
    }
    setDragWidth(null);
    // A reset stores the default itself; a narrow inbox only caps what is drawn.
    const stored = reset ? clampStoredWidth(next) : clamped;
    if (stored === (reset ? savedWidth : settledWidth)) return;
    if (sidebarWidth === undefined) setInternalWidth(stored);
    onSidebarWidthChange?.(stored);
  };

  const handleOpen = (c: SuperChatConversation) => {
    if (activeConversationId === undefined) setInternalActive(c.id);
    setMobileView('chat');
    onConversationOpened?.(c);
  };

  return (
    <div
      ref={rootRef}
      data-slot="superchat-inbox"
      role="group"
      aria-label={active ? `Chat: ${active.title}` : 'Chat'}
      className={cn(
        'flex h-full overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
        className
      )}
      // The sidebar reads its `sm`+ width from this variable.
      style={
        { '--superchat-sidebar-width': `${width}px` } as React.CSSProperties
      }
    >
      {showSidebar && (
        <SuperChatConversations
          conversations={conversations}
          activeConversationId={activeId}
          onConversationOpened={handleOpen}
          onNewConversation={onNewConversation}
          listFooter={listFooter}
          className={cn(
            'w-full sm:w-(--superchat-sidebar-width)',
            mobileView === 'chat' && 'hidden sm:flex'
          )}
        />
      )}
      {showSidebar && resizableSidebar && (
        <SidebarResizeHandle
          width={width}
          minWidth={minSidebarWidth}
          maxWidth={widestSidebar}
          onResize={resizeSidebar}
          onReset={() => resizeSidebar(defaultSidebarWidth, true, true)}
          label={sidebarResizeLabel}
          // One pane at a time below `sm`: nothing to divide.
          className="hidden sm:block"
        />
      )}

      {active ? (
        <SuperChat
          conversation={active}
          view={view}
          defaultView={defaultView}
          onViewChange={onViewChange}
          mediaFeedProps={mediaFeedProps}
          renderMessageMedia={renderMessageMedia}
          mediaLabels={mediaLabels}
          messageLabels={messageLabels}
          currentParticipantId={currentParticipantId}
          renderPlugins={renderPlugins}
          renderTextContent={renderTextContent}
          trustedContent={trustedContent}
          readOnly={readOnly}
          composerProps={composerProps}
          acceptedFileTypes={acceptedFileTypes}
          order={order}
          virtualized={virtualized}
          linkBuilder={linkBuilder}
          defaultCopyFormat={defaultCopyFormat}
          onMessageSent={onMessageSent}
          onMessageEdited={onMessageEdited}
          onConversationClosed={onConversationClosed}
          onReferenceClick={onReferenceClick}
          onBack={showSidebar ? () => setMobileView('list') : undefined}
          className={cn(
            showSidebar && mobileView === 'list' && 'hidden sm:flex'
          )}
        />
      ) : (
        <section
          data-slot="superchat"
          className={cn(
            'min-w-0 flex-1 items-center justify-center text-sm text-neutral-400',
            showSidebar && mobileView === 'list' ? 'hidden sm:flex' : 'flex'
          )}
        >
          No conversation selected
        </section>
      )}
    </div>
  );
}
