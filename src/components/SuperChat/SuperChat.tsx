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
import { ArrowLeft } from 'lucide-react';
import { Animated, AnimatedPresence } from '../../motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import {
  useStickToBottom,
  useStreamEndedBelowFold,
} from '../../hooks/useStickToBottom';
import { CloseIcon } from '../AI/icons';
import { ChatComposer } from '../ChatComposer/ChatComposer';
import type { ChatComposerAgentOption } from '../ChatComposer/ChatComposer';
import type { ComposerModelSelectorProps } from '../AI/ComposerModelSelector';
import { notifyComposerMigrationOnce } from '../ChatComposer/migration-notice';
import { JumpToBottomButton } from '../ChatComposer/JumpToBottomButton';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { MediaFeed } from '../MediaFeed';
import { getConversationMediaItems } from './media';
import type { NewMessage } from '../Messaging/types';
import { createMarkdownRenderer } from './render/createMarkdownRenderer';
import {
  ParticipantAvatar,
  MessageRow,
  byTime,
  detectMentions,
  filesToComposerAttachments,
  acceptTokensFor,
} from './parts';
import { VirtualThread } from './VirtualThread';
import type {
  AIRenderTextContent,
  AttachmentKind,
  ComposerAttachment,
  Participant,
  SuperChatConversation,
  SuperChatCopyFormat,
  SuperChatLinkBuilder,
  SuperChatMessage,
  SuperChatMediaFeedProps,
  SuperChatMediaItem,
  SuperChatMediaLabels,
  SuperChatView,
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// SuperChat (single-conversation panel)
// ============================================================================

export interface SuperChatProps {
  /** The conversation to display (host-owned state). */
  conversation: SuperChatConversation;
  /** Controlled conversation view. The host still owns the same messages. */
  view?: SuperChatView;
  /** Initial uncontrolled view; defaults to the existing message thread. */
  defaultView?: SuperChatView;
  /** Fired when the user requests a thread/media view change. */
  onViewChange?: (
    view: SuperChatView,
    meta: { conversation: SuperChatConversation }
  ) => void;
  /** MediaFeed behavior, labels and action/render slots for explicit attachments. */
  mediaFeedProps?: SuperChatMediaFeedProps;
  /** Labels for media launches and returning to the conversation. */
  mediaLabels?: Partial<SuperChatMediaLabels>;
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
   * File categories the composer accepts for paste, drag-and-drop, and the
   * file picker in the `+` → “Attach files” menu.
   * Defaults to `['image', 'video', 'audio', 'pdf']`.
   */
  acceptedFileTypes?: AttachmentKind[];
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
  /**
   * Format for a message's default copy action (Ctrl/Cmd-click on the footer
   * copy button). All formats stay reachable per message via the copy menus.
   * Defaults to `'rich'`.
   */
  defaultCopyFormat?: SuperChatCopyFormat;
  /** Additional class name. */
  className?: string;
  /** Show the conversation header (title + participants). Defaults to `true`. */
  showHeader?: boolean;
  /** Composer placeholder override. */
  placeholder?: string;
  /** Allow file attachments in the composer. Defaults to `true` unless read-only. */
  allowAttachments?: boolean;
  /** Agents offered by the composer's agent selector (shown when non-empty). */
  agents?: ChatComposerAgentOption[];
  /** Selected agent id for the composer's agent selector. */
  selectedAgent?: string | null;
  onAgentChange?: (agentId: string) => void;
  /** Localized accessible label / empty-state text for the agent selector. */
  agentSelectorLabel?: string;
  /** Props for the composer's model selector (shown when provided). */
  modelSelectorProps?: ComposerModelSelectorProps;
  /** While true, the send button becomes a stop button (requires `onStop`). */
  isStreaming?: boolean;
  onStop?: () => void;
  /** Localized accessible label for the icon-only stop button. */
  stopLabel?: string;

  // --- callbacks (chat-component-compatible) ---
  /**
   * Fired when the local user sends a message. If the callback returns a
   * promise it is awaited, and a rejected send restores the typed text into
   * the composer (the declared `void` return keeps every previously valid
   * callback assignable).
   */
  onMessageSent?: (
    text: string,
    meta: {
      conversation: SuperChatConversation;
      mentions: string[];
      attachments: ComposerAttachment[];
    }
  ) => void | Promise<void>;
  /**
   * Fired when the local user saves an edit to one of their own messages.
   * Providing this enables the inline "Edit" affordance on self-authored
   * messages (the host owns state, so apply the new `text` to the message and
   * typically stamp `editedAt`).
   */
  onMessageEdited?: (
    messageId: string,
    text: string,
    meta: { conversation: SuperChatConversation }
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
  view,
  defaultView = 'thread',
  onViewChange,
  mediaFeedProps,
  mediaLabels,
  currentParticipantId,
  renderPlugins,
  renderTextContent,
  trustedContent,
  readOnly,
  acceptedFileTypes,
  order = 'asc',
  virtualized = false,
  linkBuilder,
  defaultCopyFormat,
  className,
  showHeader = true,
  placeholder,
  allowAttachments,
  agents,
  selectedAgent,
  onAgentChange,
  agentSelectorLabel,
  modelSelectorProps,
  isStreaming,
  onStop,
  stopLabel,
  onMessageSent,
  onMessageEdited,
  onConversationClosed,
  onReferenceClick,
  onBack,
}: SuperChatProps) {
  const headingId = React.useId();
  const [internalView, setInternalView] = React.useState({
    conversationId: conversation.id,
    view: defaultView,
  });
  // A different uncontrolled conversation begins on its thread immediately,
  // before child effects can start a player from a previous media selection.
  const activeView =
    view ??
    (internalView.conversationId === conversation.id
      ? internalView.view
      : 'thread');
  const labels: SuperChatMediaLabels = {
    backToConversation: 'Back to conversation',
    openMedia: 'Open in media feed',
    playMedia: 'Play',
    unknownAuthor: 'Unknown',
    ...mediaLabels,
  };
  const mediaItems = React.useMemo(() => {
    const items = getConversationMediaItems(conversation);
    return order === 'desc' ? items.reverse() : items;
  }, [conversation, order]);
  const [mediaSelection, setMediaSelection] = React.useState<{
    conversationId: string;
    itemId: string;
  }>();
  const [manualPlaybackRequest, setManualPlaybackRequest] = React.useState<{
    conversationId: string;
    itemId: string;
    requestId: number;
  }>();
  const playbackRequestCounter = React.useRef(0);
  const mediaFeedRef = React.useRef<HTMLDivElement>(null);
  const backToConversationRef = React.useRef<HTMLButtonElement>(null);
  const focusMediaOnOpenRef = React.useRef(false);
  const focusThreadOnBackRef = React.useRef(false);
  const mediaReturnTargetRef = React.useRef<
    | {
        conversationId: string;
        messageId: string;
        attachmentId: string;
      }
    | undefined
  >(undefined);
  // Stable callbacks keep existing memoized thread rows from re-rendering on
  // every streamed update just because the feed's conversation changed.
  const mediaContextRef = React.useRef({
    conversation,
    view,
    onViewChange,
    mediaFeedProps,
    mediaItems,
  });
  mediaContextRef.current = {
    conversation,
    view,
    onViewChange,
    mediaFeedProps,
    mediaItems,
  };
  const setView = React.useCallback((next: SuperChatView) => {
    const context = mediaContextRef.current;
    if (context.view === undefined)
      setInternalView({ conversationId: context.conversation.id, view: next });
    context.onViewChange?.(next, { conversation: context.conversation });
  }, []);
  const handleMediaSelection = React.useCallback((item: SuperChatMediaItem) => {
    setMediaSelection({ conversationId: item.conversationId, itemId: item.id });
    mediaContextRef.current.mediaFeedProps?.onActiveItemChange?.(item);
  }, []);
  const handleOpenMedia = React.useCallback(
    (messageId: string, attachmentId: string, play = false) => {
      const item = mediaContextRef.current.mediaItems.find(
        (candidate) =>
          candidate.message.id === messageId &&
          candidate.attachment.id === attachmentId
      );
      if (!item) return;
      handleMediaSelection(item);
      mediaReturnTargetRef.current = {
        conversationId: item.conversationId,
        messageId,
        attachmentId,
      };
      focusMediaOnOpenRef.current = true;
      setManualPlaybackRequest(
        play
          ? {
              conversationId: item.conversationId,
              itemId: item.id,
              requestId: ++playbackRequestCounter.current,
            }
          : undefined
      );
      setView('media');
    },
    [handleMediaSelection, setView]
  );
  const handleBackToConversation = React.useCallback(() => {
    focusMediaOnOpenRef.current = false;
    focusThreadOnBackRef.current = true;
    setManualPlaybackRequest(undefined);
    setView('thread');
  }, [setView]);

  // A fresh host playback request supersedes a consumed inline Play launch, so
  // `mediaFeedProps.playbackRequest` keeps working while the media view is open.
  const hostPlaybackRequest = mediaFeedProps?.playbackRequest;
  const hostPlaybackKey = hostPlaybackRequest
    ? `${hostPlaybackRequest.itemId}\u0000${hostPlaybackRequest.requestId}`
    : undefined;
  React.useEffect(() => {
    if (hostPlaybackKey === undefined) return;
    setManualPlaybackRequest(undefined);
  }, [hostPlaybackKey]);

  React.useEffect(() => {
    if (internalView.conversationId !== conversation.id) {
      setInternalView({ conversationId: conversation.id, view: 'thread' });
    }
    if (mediaReturnTargetRef.current?.conversationId !== conversation.id) {
      mediaReturnTargetRef.current = undefined;
      focusMediaOnOpenRef.current = false;
      focusThreadOnBackRef.current = false;
      setManualPlaybackRequest(undefined);
    }
  }, [conversation.id, internalView.conversationId]);

  React.useEffect(() => {
    if (activeView !== 'media' || !focusMediaOnOpenRef.current) return;
    // The inline action is unmounted by the view switch. Move its focus to the
    // selected media item, or the Back control while data is unavailable.
    const target =
      mediaFeedRef.current?.querySelector<HTMLElement>(
        'article[tabindex="0"]'
      ) ?? mediaFeedRef.current?.querySelector<HTMLElement>('[role="feed"]');
    if (target) focusMediaOnOpenRef.current = false;
    (target ?? backToConversationRef.current)?.focus({ preventScroll: true });
  }, [
    activeView,
    mediaFeedProps?.loading,
    mediaFeedProps?.error,
    mediaItems.length,
  ]);

  React.useEffect(() => {
    notifyComposerMigrationOnce('SuperChat');
  }, []);

  const renderText = React.useMemo<AIRenderTextContent>(
    () =>
      renderTextContent ??
      createMarkdownRenderer({
        plugins: renderPlugins,
        trusted: trustedContent,
      }),
    [renderTextContent, renderPlugins, trustedContent]
  );

  // --- Scroll anchoring -----------------------------------------------------
  // The thread pins to the newest message only while the user is at the
  // bottom. Once they scroll up to read, streaming growth and appended
  // messages leave their position alone; a floating "jump to bottom" button
  // offers the way back (and flags unseen messages). `desc` (feed-style)
  // threads keep their top anchor and skip the affordance.
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    containerRef: threadRef,
    contentRef: threadContentRef,
    isAtBottom,
    scrollToBottom,
    anchorToTurnStart,
    followIfPinned,
    stopFollowing,
  } = useStickToBottom({
    disabled: order === 'desc' || activeView === 'media',
  });
  React.useEffect(() => {
    if (activeView !== 'thread') return;
    setManualPlaybackRequest(undefined);
    if (!focusThreadOnBackRef.current) return;
    focusThreadOnBackRef.current = false;
    const source = mediaReturnTargetRef.current;
    const launchId = source
      ? JSON.stringify([source.messageId, source.attachmentId])
      : undefined;
    const launcher =
      source?.conversationId === conversation.id
        ? Array.from(
            threadRef.current?.querySelectorAll<HTMLButtonElement>(
              '[data-media-launch-id]'
            ) ?? []
          ).find((button) => button.dataset.mediaLaunchId === launchId)
        : undefined;
    (launcher ?? threadRef.current)?.focus({ preventScroll: true });
  }, [activeView, conversation.id, threadRef]);
  const [hasNewBelow, setHasNewBelow] = React.useState(false);
  // Own-send turn anchoring (ChatGPT/Claude-style): the freshly sent message
  // opens a "turn" that reserves a viewport of space, anchored so the bubble
  // sits at the top and replies stream into the space below. Plain thread
  // only — the virtualizer owns row layout, so virtualized mode keeps the
  // pin-to-bottom behavior for own sends.
  const [turnStartId, setTurnStartId] = React.useState<string | null>(null);
  const [turnMinHeight, setTurnMinHeight] = React.useState<number>();
  const anchoredTurnRef = React.useRef<string | null>(null);
  const threadSnapshotRef = React.useRef<
    | {
        conversationId: string;
        order: 'asc' | 'desc';
        scrollTop: number;
        atBottom: boolean;
      }
    | undefined
  >(undefined);
  const atBottomRef = React.useRef(isAtBottom);
  atBottomRef.current = isAtBottom;
  const pendingMediaOwnSendRef = React.useRef(false);
  const pendingMediaAppendRef = React.useRef(false);

  // Anchor to the newest message on mount and when switching conversations:
  // bottom for ascending order, top for descending (feed-style) order.
  React.useEffect(() => {
    threadSnapshotRef.current = undefined;
    pendingMediaOwnSendRef.current = false;
    pendingMediaAppendRef.current = false;
    setTurnStartId(null);
    anchoredTurnRef.current = null;
    if (order === 'desc') {
      const el = threadRef.current;
      if (el) el.scrollTop = 0;
    } else {
      scrollToBottom('auto');
    }
    setHasNewBelow(false);
    // `threadRef`/`scrollToBottom` are stable for the hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, order]);

  const threadLength = conversation.thread.length;

  // New-message policy: follow while pinned, always follow the local user's
  // own sends, otherwise flag that unseen content arrived below. Own sends
  // are detected by diffing message ids: a batch update can append the local
  // user's message together with someone else's (or a placeholder), and
  // timestamps can reorder the batch, so the newest message alone is not a
  // reliable signal.
  const prevThreadLengthRef = React.useRef(threadLength);
  const prevMessageIdsRef = React.useRef<Set<string>>(
    new Set(conversation.thread.map((message) => message.id))
  );
  const policyConversationRef = React.useRef(conversation.id);
  const policyBaselinedRef = React.useRef(false);
  React.useEffect(() => {
    // A conversation switch replaces the thread wholesale: the reset effect
    // above owns the scroll, so rebase the diff baselines instead of
    // mistaking the replacement's own messages for a fresh send. The first
    // run baselines the mount the same way.
    if (
      !policyBaselinedRef.current ||
      policyConversationRef.current !== conversation.id
    ) {
      policyBaselinedRef.current = true;
      policyConversationRef.current = conversation.id;
      prevThreadLengthRef.current = threadLength;
      prevMessageIdsRef.current = new Set(
        conversation.thread.map((message) => message.id)
      );
      // A thread that arrives mid-stream must hold like an appended stream:
      // the reset effect revealed the newest message, so hold there and let
      // useStreamEndedBelowFold release the hold on completion.
      if (
        order !== 'desc' &&
        [...conversation.thread].sort(byTime).at(-1)?.status === 'streaming'
      ) {
        stopFollowing();
      }
      return;
    }
    if (threadLength === prevThreadLengthRef.current) return;
    const grew = threadLength > prevThreadLengthRef.current;
    prevThreadLengthRef.current = threadLength;
    if (grew && activeView === 'media') pendingMediaAppendRef.current = true;
    if (order === 'desc') {
      const el = threadRef.current;
      if (el) el.scrollTop = 0;
      return;
    }
    const prevIds = prevMessageIdsRef.current;
    // The latest newly appended own message (in thread order) starts a turn.
    let turnStart: string | undefined;
    if (grew && currentParticipantId) {
      for (const message of [...conversation.thread].sort(byTime)) {
        if (
          !prevIds.has(message.id) &&
          message.participantId === currentParticipantId
        ) {
          turnStart = message.id;
        }
      }
    }
    if (turnStart) {
      if (activeView === 'media') pendingMediaOwnSendRef.current = true;
      if (virtualized) {
        // No turn reserve under the virtualizer — pin the own send instead.
        scrollToBottom('auto');
      } else {
        // Own send: open a new anchored turn (the layout effect below scrolls
        // it to the top of the viewport once the reserve is in place).
        setTurnStartId(turnStart);
      }
    } else if (grew) {
      const newest = [...conversation.thread].sort(byTime).at(-1);
      if (newest?.status === 'streaming') {
        // An incoming stream fills below the fold instead of pushing the
        // view: reveal its first line if we were following, then hold
        // position. On completion useStreamEndedBelowFold raises the hint
        // (below the fold) or resumes following (the reply never outgrew
        // the viewport).
        followIfPinned('auto');
        stopFollowing();
      } else if (!followIfPinned('auto')) {
        setHasNewBelow(true);
      }
    } else {
      followIfPinned('auto');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadLength, order, isAtBottom, conversation.id, activeView]);

  // The media view unmounts the thread's players, so capture its actual DOM
  // position before leaving and restore it before the scroll hook re-attaches.
  // Appends still follow the usual policy: a reader keeps their position; a
  // pinned thread follows incoming messages; an own send opens its fresh turn.
  React.useLayoutEffect(() => {
    if (activeView !== 'thread') return;
    const container = threadRef.current;
    if (!container) return;
    const snapshot = threadSnapshotRef.current;
    const sameThread =
      snapshot?.conversationId === conversation.id && snapshot.order === order;
    const ownSend = pendingMediaOwnSendRef.current;
    const appended = pendingMediaAppendRef.current;
    pendingMediaOwnSendRef.current = false;
    pendingMediaAppendRef.current = false;

    if (order === 'desc') {
      container.scrollTop = sameThread && !appended ? snapshot.scrollTop : 0;
    } else if (ownSend && !virtualized) {
      // The turn layout effect below measures and anchors the newly mounted
      // thread. Do not clear the turn or override that position with bottom.
    } else if (sameThread && !ownSend && (!snapshot.atBottom || !appended)) {
      container.scrollTop = snapshot.scrollTop;
      if (!snapshot.atBottom) stopFollowing();
    } else {
      scrollToBottom('auto');
      if ([...conversation.thread].sort(byTime).at(-1)?.status === 'streaming')
        stopFollowing();
    }

    return () => {
      threadSnapshotRef.current = {
        conversationId: conversation.id,
        order,
        scrollTop: container.scrollTop,
        atBottom: atBottomRef.current,
      };
    };
    // Record only actual thread/view changes, never restore during an append.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, order, activeView, virtualized]);

  // Apply the turn reserve, then anchor the turn's start to the viewport top.
  // Two passes: the first render after a send measures the viewport and sets
  // the min-height; once it's in place there is room to scroll the bubble to
  // the top, so the re-run performs the actual anchor.
  React.useLayoutEffect(() => {
    if (!turnStartId || anchoredTurnRef.current === turnStartId) return;
    const container = threadRef.current;
    if (!container) return;
    // Just under a full viewport (minus the p-4 padding) so the anchored
    // bubble's top lands at the top edge of the scroll area.
    const reserve = Math.max(0, container.clientHeight - 32);
    if (turnMinHeight !== reserve) {
      setTurnMinHeight(reserve);
      return;
    }
    const target = container.querySelector<HTMLElement>(
      '[data-slot="superchat-turn"]'
    );
    if (target) {
      anchorToTurnStart(target, prefersReducedMotion ? 'auto' : 'smooth');
      anchoredTurnRef.current = turnStartId;
    }
  }, [
    turnStartId,
    turnMinHeight,
    anchorToTurnStart,
    prefersReducedMotion,
    threadRef,
    activeView,
  ]);

  // Snapshot the ids after the policy effect above so it always diffs against
  // the pre-render thread.
  React.useEffect(() => {
    prevMessageIdsRef.current = new Set(
      conversation.thread.map((message) => message.id)
    );
  });

  // The hint clears once the user reaches the bottom again.
  React.useEffect(() => {
    if (isAtBottom) setHasNewBelow(false);
  }, [isAtBottom]);

  // A reply that finishes streaming below the fold upgrades the jump button
  // to the "New messages" hint — the reader hasn't seen the end of it.
  const newestMessage = React.useMemo(
    () => [...conversation.thread].sort(byTime).at(-1),
    [conversation]
  );
  const raiseNewBelow = React.useCallback(() => {
    if (order !== 'desc') setHasNewBelow(true);
  }, [order]);
  const resumeFollowing = React.useCallback(() => {
    if (order !== 'desc') scrollToBottom('auto');
  }, [order, scrollToBottom]);
  useStreamEndedBelowFold(
    newestMessage,
    isAtBottom,
    raiseNewBelow,
    resumeFollowing
  );

  const handleJumpToBottom = React.useCallback(() => {
    scrollToBottom(prefersReducedMotion ? 'auto' : 'smooth');
  }, [scrollToBottom, prefersReducedMotion]);

  const participantById = React.useMemo(() => {
    const map = new Map<string, Participant>();
    conversation.participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [conversation]);

  const orderedThread = React.useMemo(() => {
    const sorted = [...conversation.thread].sort(byTime);
    return order === 'desc' ? sorted.reverse() : sorted;
  }, [conversation, order]);

  const turnIndex = React.useMemo(
    () =>
      turnStartId && order !== 'desc'
        ? orderedThread.findIndex((message) => message.id === turnStartId)
        : -1,
    [orderedThread, turnStartId, order]
  );

  const renderMessageRow = (m: SuperChatMessage) => (
    <MessageRow
      key={m.id}
      message={m}
      participant={participantById.get(m.participantId)}
      isSelf={
        !!currentParticipantId && m.participantId === currentParticipantId
      }
      renderText={renderText}
      linkBuilder={linkBuilder}
      onReferenceClick={onReferenceClick}
      editable={editable}
      onMessageEdited={handleMessageEdited}
      defaultCopyFormat={defaultCopyFormat}
      onOpenMedia={handleOpenMedia}
      openMediaLabel={labels.openMedia}
      playMediaLabel={labels.playMedia}
      mediaErrorLabel={mediaFeedProps?.labels?.mediaError}
      mediaRetryLabel={mediaFeedProps?.labels?.retry}
    />
  );

  // Stable edit handler so memoized rows don't re-render when the conversation
  // changes. Latest `onMessageEdited`/`conversation` are read from refs.
  const onMessageEditedRef = React.useRef(onMessageEdited);
  onMessageEditedRef.current = onMessageEdited;
  const conversationRef = React.useRef(conversation);
  conversationRef.current = conversation;
  const handleMessageEdited = React.useCallback(
    (messageId: string, text: string) => {
      onMessageEditedRef.current?.(messageId, text, {
        conversation: conversationRef.current,
      });
    },
    []
  );
  const editable = !readOnly && !!onMessageEdited;

  // Agents/humans addressable via `@` (exclude the system participant).
  const mentionOptions = React.useMemo(
    () =>
      conversation.participants
        .filter((p) => p.kind !== 'system')
        .map((p) => ({
          id: p.id,
          label: p.name,
          description: p.role,
          meta: p.kind,
          icon: <ParticipantAvatar participant={p} />,
        })),
    [conversation.participants]
  );

  const composerAccept = React.useMemo(
    () => acceptTokensFor(acceptedFileTypes),
    [acceptedFileTypes]
  );

  // Controlled composer draft so a failed send can restore the typed text
  // (ChatComposer clears optimistically and delegates restore to the host).
  const [draft, setDraft] = React.useState('');
  // Bumped on every user edit (including the optimistic clear that precedes
  // a send), so a stale failed send never overwrites newer typed input.
  const draftEpochRef = React.useRef(0);
  const handleDraftChange = React.useCallback((value: string) => {
    draftEpochRef.current += 1;
    setDraft(value);
  }, []);

  // Bridge the shared composer's `NewMessage` (File[] attachments) to
  // SuperChat's host callback (mentions + base64 `data:` URL attachments).
  const handleComposerSend = React.useCallback(
    async (message: NewMessage) => {
      const epoch = draftEpochRef.current;
      try {
        const text = message.content;
        const mentions = detectMentions(text, conversation.participants);
        const attachments = await filesToComposerAttachments(
          message.attachments ?? []
        );
        // The declared type is `void` for backward compatibility, but a
        // returned promise (e.g. an async host callback) is awaited so its
        // rejection follows the same restore path as a synchronous throw.
        await Promise.resolve(
          onMessageSent?.(text, { conversation, mentions, attachments })
        );
      } catch {
        // Parity with the previous MessageComposer: restore the text when
        // file conversion or the host callback fails (attachments are not
        // restaged, matching the old behavior) — unless the user has typed
        // a newer draft while this send was pending.
        if (draftEpochRef.current === epoch) {
          setDraft(message.content);
        }
      }
    },
    [conversation, onMessageSent]
  );

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
      {showHeader ? (
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
                className="-ms-1 shrink-0 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 sm:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
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
                    <ParticipantAvatar participant={p} />
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
      ) : (
        // Keeps the panel's aria-labelledby reference valid without a visible header.
        <h2 id={headingId} className="sr-only">
          {conversation.title}
        </h2>
      )}

      {activeView === 'media' ? (
        <div
          data-slot="superchat-media-view"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="px-4 pt-2">
            <ButtonGroup className="justify-start">
              <Button
                ref={backToConversationRef}
                variant="ghost"
                size="sm"
                leftIcon={
                  <ArrowLeft
                    className="size-4 rtl:rotate-180"
                    aria-hidden="true"
                  />
                }
                onClick={handleBackToConversation}
              >
                {labels.backToConversation}
              </Button>
            </ButtonGroup>
          </div>
          <MediaFeed
            {...mediaFeedProps}
            ref={mediaFeedRef}
            key={conversation.id}
            items={mediaItems}
            getId={(item) => item.id}
            getMedia={(item) => item.attachment}
            getTitle={(item) => item.attachment.title ?? ''}
            getCaption={(item) => item.attachment.caption ?? item.message.text}
            getAuthor={(item) => ({
              name: item.participant?.name ?? labels.unknownAuthor,
              avatar: item.participant?.avatar,
            })}
            activeItemId={
              mediaFeedProps?.activeItemId ??
              (mediaSelection?.conversationId === conversation.id
                ? mediaSelection.itemId
                : undefined)
            }
            onActiveItemChange={handleMediaSelection}
            playbackRequest={
              manualPlaybackRequest?.conversationId === conversation.id
                ? manualPlaybackRequest
                : mediaFeedProps?.playbackRequest
            }
            className={cn('min-h-0 flex-1', mediaFeedProps?.className)}
          />
        </div>
      ) : (
        <div
          data-slot="superchat-thread-viewport"
          className="relative flex min-h-0 flex-1 flex-col"
        >
          {virtualized ? (
            <VirtualThread
              items={orderedThread}
              participantById={participantById}
              currentParticipantId={currentParticipantId}
              renderText={renderText}
              linkBuilder={linkBuilder}
              onReferenceClick={onReferenceClick}
              editable={editable}
              onMessageEdited={handleMessageEdited}
              defaultCopyFormat={defaultCopyFormat}
              onOpenMedia={handleOpenMedia}
              openMediaLabel={labels.openMedia}
              playMediaLabel={labels.playMedia}
              mediaErrorLabel={mediaFeedProps?.labels?.mediaError}
              mediaRetryLabel={mediaFeedProps?.labels?.retry}
              scrollRef={threadRef}
              contentRef={threadContentRef}
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
              className="flex-1 overflow-y-auto p-4"
            >
              <div ref={threadContentRef} className="space-y-4">
                {(turnIndex === -1
                  ? orderedThread
                  : orderedThread.slice(0, turnIndex)
                ).map(renderMessageRow)}
                {turnIndex !== -1 && (
                  <div
                    data-slot="superchat-turn"
                    className="space-y-4"
                    style={{ minHeight: turnMinHeight }}
                  >
                    {orderedThread.slice(turnIndex).map(renderMessageRow)}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* The wrapper is a zero-height strip pinned to the viewport bottom:
            the button keeps its own absolute placement (now relative to the
            strip, which lands it in the same spot) and the strip carries the
            fade, so the button's `-translate-x-1/2` never meets a motion
            transform. */}
          <AnimatedPresence>
            {order !== 'desc' && !isAtBottom && (
              <Animated
                key="jump-to-bottom"
                preset="fade"
                mode="presence"
                className="absolute inset-x-0 bottom-0 z-20"
              >
                <JumpToBottomButton
                  dataSlot="superchat-jump-to-bottom"
                  hasNewMessages={hasNewBelow}
                  onClick={handleJumpToBottom}
                />
              </Animated>
            )}
          </AnimatedPresence>
        </div>
      )}

      <ChatComposer
        value={draft}
        onValueChange={handleDraftChange}
        onSend={handleComposerSend}
        disabled={readOnly}
        // Matches the thread's p-4 gutter so the composer card lines up with
        // the messages instead of running flush against the panel edges.
        className="px-4 pb-4"
        placeholder={
          readOnly
            ? 'Read-only conversation'
            : (placeholder ?? 'Type a message… use @ to address an agent')
        }
        mentionOptions={mentionOptions}
        allowAttachments={!readOnly && (allowAttachments ?? true)}
        acceptedFileTypes={composerAccept}
        // Same cap MessageComposer applied by default.
        maxFileSize={25 * 1024 * 1024}
        maxLength={100000}
        inputLabel="Message"
        showAgentSelector={!!agents?.length}
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentChange={onAgentChange}
        agentSelectorLabel={agentSelectorLabel}
        showModelSelector={!!modelSelectorProps}
        modelSelectorProps={modelSelectorProps}
        isStreaming={isStreaming}
        onStop={onStop}
        stopLabel={stopLabel}
      />
    </section>
  );
}
