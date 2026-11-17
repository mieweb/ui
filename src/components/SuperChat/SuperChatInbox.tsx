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
import {
  SuperChatConversations,
  type SuperChatConversationsProps,
} from './SuperChatConversations';
import { SidebarResizeHandle } from './SidebarResizeHandle';
import { useSuperChatLabels } from './labels';
import type {
  AIRenderTextContent,
  AttachmentKind,
  SuperChatConversation,
  SuperChatCopyFormat,
  SuperChatLabels,
  SuperChatLinkBuilder,
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// SuperChatInbox (list + panel)
// ============================================================================

/** Narrowest the conversation panel may be squeezed to by a wide list, in px. */
const MIN_PANEL_WIDTH = 240;

/**
 * Panel props the inbox passes straight to the active {@link SuperChat}, with
 * the same meaning and defaults there. Composer-only ones (`placeholder`,
 * `allowAttachments`, the selectors, `isStreaming`/`onStop`, `dictation`) are
 * convenience shorthands: a key also set in `composerProps` wins, as on
 * `SuperChat`, and none of them apply when a host `composer` replaces the
 * built-in message box.
 */
type SuperChatPanelPassthroughProps = Pick<
  SuperChatProps,
  | 'showHeader'
  | 'headerActions'
  | 'placeholder'
  | 'allowAttachments'
  | 'agents'
  | 'selectedAgent'
  | 'onAgentChange'
  | 'agentSelectorLabel'
  | 'modelSelectorProps'
  | 'composerSelectorsEndSlot'
  | 'isStreaming'
  | 'onStop'
  | 'stopLabel'
  | 'dictation'
>;

export interface SuperChatInboxProps extends SuperChatPanelPassthroughProps {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled thread/media view, forwarded to the active conversation panel. */
  view?: SuperChatProps['view'];
  /** Initial uncontrolled panel view; defaults to 'thread'. */
  defaultView?: SuperChatProps['defaultView'];
  /** Fired with the active conversation when its view is changed. */
  onViewChange?: SuperChatProps['onViewChange'];
  /** MediaFeed behavior and slots; items remain scoped to the active conversation. */
  mediaFeedProps?: SuperChatProps['mediaFeedProps'];
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
   * The host's own composer for the active panel, replacing the built-in
   * message box (see {@link SuperChatProps.composer}). `null` renders none.
   */
  composer?: React.ReactNode;
  /**
   * Group consecutive tool calls with approval controls in the active panel
   * (see {@link SuperChatProps.toolCallGroup}).
   */
  toolCallGroup?: SuperChatProps['toolCallGroup'];
  /**
   * Host controls under each message in the active panel (see
   * {@link SuperChatProps.renderMessageFooter}).
   */
  renderMessageFooter?: SuperChatProps['renderMessageFooter'];
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
  /**
   * Narrowest the divider can make the sidebar, in px. Defaults to `200`. An
   * inbox too narrow for this plus the panel's 240px lowers it to what's left.
   */
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
  /** Accessible name of the resize divider. Wins over `labels.sidebarResize`. @default 'Resize conversation list' */
  sidebarResizeLabel?: string;
  /**
   * Every user-visible string in the inbox, list and panel, for localization;
   * forwarded to both. Unset keys use the English defaults (through
   * `MessagesProvider` when present). The narrower `listTitle`, `search`
   * labels, `sidebarResizeLabel`, `mediaLabels`, `messageLabels`,
   * `placeholder`, `agentSelectorLabel`, `stopLabel` and `composerProps` win
   * where they overlap. See {@link SuperChatLabels}.
   */
  labels?: Partial<SuperChatLabels>;
  /** BCP 47 locale for message times, forwarded to the panel. Defaults to the runtime's locale. */
  locale?: string;
  /** Heading above the conversation list; `null` hides it. See {@link SuperChatConversationsProps.listTitle}. */
  listTitle?: SuperChatConversationsProps['listTitle'];
  /** Host content in the list header, e.g. filters. See {@link SuperChatConversationsProps.listHeader}. */
  listHeader?: SuperChatConversationsProps['listHeader'];
  /**
   * Search box in the list header. The host filters and passes the matches as
   * `listConversations`. See {@link SuperChatConversationsProps.search}.
   */
  search?: SuperChatConversationsProps['search'];
  /**
   * The conversations the list shows, e.g. search or filter results. Defaults
   * to `conversations`. The panel still opens from `conversations`, so
   * narrowing the list never closes the open conversation or drops its
   * unsent draft.
   */
  listConversations?: SuperChatConversation[];
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
  composer,
  toolCallGroup,
  renderMessageFooter,
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
  sidebarResizeLabel,
  labels: labelOverrides,
  locale,
  listTitle,
  listHeader,
  search,
  listConversations,
  linkBuilder,
  defaultCopyFormat,
  className,
  showHeader,
  headerActions,
  placeholder,
  allowAttachments,
  agents,
  selectedAgent,
  onAgentChange,
  agentSelectorLabel,
  modelSelectorProps,
  composerSelectorsEndSlot,
  isStreaming,
  onStop,
  stopLabel,
  dictation,
  onMessageSent,
  onMessageEdited,
  onConversationOpened,
  onConversationClosed,
  onNewConversation,
  onReferenceClick,
}: SuperChatInboxProps) {
  const labels = useSuperChatLabels(labelOverrides);
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId ?? conversations[0]?.id
  );
  const requestedId = activeConversationId ?? internalActive;
  // A controlled id the host hasn't loaded (a deep link outside the current
  // page, or still loading) shows the empty panel rather than another
  // conversation; uncontrolled selection still falls back to the first.
  const active =
    conversations.find((c) => c.id === requestedId) ??
    (activeConversationId === undefined ? conversations[0] : undefined);
  // Resolve the active id from the conversation actually shown so the sidebar
  // highlight never disagrees with the panel when `conversations` changes. A
  // controlled id that isn't loaded is still passed down (matching no row), so
  // the list doesn't fall back to highlighting its first conversation.
  const activeId = active?.id ?? activeConversationId;

  // On small screens the list and panel can't fit side by side, so we show one
  // at a time (master-detail). `mobileView` tracks which is visible; on `sm`+
  // both are always shown and this state is ignored.
  const [requestedMobileView, setMobileView] = React.useState<'list' | 'chat'>(
    defaultMobileView
  );
  // With no conversation to open, the chat pane would be an empty panel with
  // no way back, so the list shows until there is one.
  const mobileView = active ? requestedMobileView : 'list';

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
          0,
          Math.min(maxSidebarWidth, availableWidth - MIN_PANEL_WIDTH)
        );
  // An inbox narrower than both minimums together gives the panel its 240px
  // first: the list's minimum (and its announced bound) drops to what's left.
  const narrowestSidebar = Math.min(minSidebarWidth, widestSidebar);

  const clampStoredWidth = (w: number) =>
    Math.round(Math.min(maxSidebarWidth, Math.max(minSidebarWidth, w)));
  const clampWidth = (w: number) =>
    Math.round(Math.min(widestSidebar, Math.max(narrowestSidebar, w)));
  const [internalWidth, setInternalWidth] = React.useState(defaultSidebarWidth);
  // Width while a drag is in progress; kept here so the host re-renders once
  // per drag, not once per pointermove.
  const [dragWidth, setDragWidth] = React.useState<number | null>(null);
  const settledWidth = clampWidth(sidebarWidth ?? internalWidth);
  // What is stored, which a narrow inbox can show smaller than this. Only a
  // reset compares against it, so a key press that leaves the divider where it
  // is never overwrites the stored width.
  const savedWidth = clampStoredWidth(sidebarWidth ?? internalWidth);
  // Re-clamped every render, so an inbox that shrinks mid-drag never leaves
  // the panel under its minimum or announces a width past the maximum.
  const width = dragWidth === null ? settledWidth : clampWidth(dragWidth);
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
      aria-label={
        active ? labels.inboxLabel(active.title) : labels.emptyInboxLabel
      }
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
          conversations={listConversations ?? conversations}
          activeConversationId={activeId}
          onConversationOpened={handleOpen}
          onNewConversation={onNewConversation}
          listFooter={listFooter}
          listTitle={listTitle}
          listHeader={listHeader}
          search={search}
          labels={labelOverrides}
          className={cn(
            'w-full sm:w-[var(--superchat-sidebar-width)]',
            mobileView === 'chat' && 'hidden sm:flex'
          )}
        />
      )}
      {showSidebar && resizableSidebar && (
        <SidebarResizeHandle
          width={width}
          minWidth={narrowestSidebar}
          maxWidth={widestSidebar}
          onResize={resizeSidebar}
          onReset={() => resizeSidebar(defaultSidebarWidth, true, true)}
          label={sidebarResizeLabel ?? labels.sidebarResize}
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
          mediaLabels={mediaLabels}
          messageLabels={messageLabels}
          labels={labelOverrides}
          locale={locale}
          currentParticipantId={currentParticipantId}
          renderPlugins={renderPlugins}
          renderTextContent={renderTextContent}
          trustedContent={trustedContent}
          readOnly={readOnly}
          composerProps={composerProps}
          composer={composer}
          toolCallGroup={toolCallGroup}
          renderMessageFooter={renderMessageFooter}
          acceptedFileTypes={acceptedFileTypes}
          order={order}
          virtualized={virtualized}
          linkBuilder={linkBuilder}
          defaultCopyFormat={defaultCopyFormat}
          showHeader={showHeader}
          headerActions={headerActions}
          placeholder={placeholder}
          allowAttachments={allowAttachments}
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentChange={onAgentChange}
          agentSelectorLabel={agentSelectorLabel}
          modelSelectorProps={modelSelectorProps}
          composerSelectorsEndSlot={composerSelectorsEndSlot}
          isStreaming={isStreaming}
          onStop={onStop}
          stopLabel={stopLabel}
          dictation={dictation}
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
          {labels.noConversationSelected}
        </section>
      )}
    </div>
  );
}
