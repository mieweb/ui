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
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
  useStickToBottom,
  useStreamEndedBelowFold,
} from '../../hooks/useStickToBottom';
import { CloseIcon } from '../AI/icons';
import {
  ChatComposer,
  type ChatComposerAgentOption,
  type ChatComposerProps,
  type ChatComposerSendMeta,
} from '../ChatComposer/ChatComposer';
import type { ComposerModelSelectorProps } from '../AI/ComposerModelSelector';
import { notifyComposerMigrationOnce } from '../ChatComposer/migration-notice';
import { JumpToBottomButton } from '../ChatComposer/JumpToBottomButton';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { MediaFeed } from '../MediaFeed';
import { overlayButtonClass } from '../MediaPlayer/overlayButton';
import {
  isInPictureInPicture,
  PIP_EVENTS,
} from '../MediaPlayer/pictureInPicture';
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
  SuperChatMessageLabels,
  SuperChatRenderMessageMedia,
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
  /** Labels for per-message states, e.g. a scheduled message's indicator. */
  messageLabels?: Partial<SuperChatMessageLabels>;
  /**
   * Renders an attachment in the thread in place of the built-in card, e.g. the
   * host's own video card. Its `open` opens the media view at that attachment.
   */
  renderMessageMedia?: SuperChatRenderMessageMedia;
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
   * Props for the message box (`ChatComposer`), applied over SuperChat's own
   * defaults: e.g. `placeholder`, `leadingSlot` for the host's own buttons
   * beside `+`, `layout: 'stacked'`, `maxFileSize`, `canSendWhenEmpty`, or
   * `mentionOptions: []` to turn @mentions off. `className` is merged.
   */
  composerProps?: SuperChatComposerProps;
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
   * callback assignable). `sendOption` is the id of the
   * `composerProps.sendOptions` entry the user sent with, if any.
   */
  onMessageSent?: (
    text: string,
    meta: {
      conversation: SuperChatConversation;
      mentions: string[];
      attachments: ComposerAttachment[];
      sendOption?: string;
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
 * Message box props a host may set through `composerProps`. SuperChat owns the
 * draft and the send path, so `value`, `onValueChange` and `onSend` stay its.
 */
export type SuperChatComposerProps = Omit<
  ChatComposerProps,
  'value' | 'onValueChange' | 'onSend'
>;

/**
 * Phone-sized screens, upright (under 40rem wide) or sideways (under 30rem
 * tall): with the `overlay` media view open, the panel covers the screen
 * there, the media above the message box.
 * The query matches the classes below; `useMediaQuery` reads it for the modal
 * behaviour.
 */
const PHONE_QUERY =
  '(width < 40rem), (max-height: 30rem) and (orientation: landscape)';
const PHONE_FULLSCREEN = [
  'max-sm:fixed max-sm:inset-0 max-sm:z-50',
  '[@media(max-height:30rem)_and_(orientation:landscape)]:fixed [@media(max-height:30rem)_and_(orientation:landscape)]:inset-0 [@media(max-height:30rem)_and_(orientation:landscape)]:z-50',
  // Clear the notch and home bar on every side; native shells can override
  // the insets with the --mieweb-safe-area-* variables (Modal's top and
  // bottom ones, plus left and right for a sideways phone).
  'max-sm:pt-[var(--mieweb-safe-area-top,env(safe-area-inset-top))] max-sm:pb-[var(--mieweb-safe-area-bottom,env(safe-area-inset-bottom))]',
  // rtl-ignore -- safe-area insets are physical screen edges
  'max-sm:pr-[var(--mieweb-safe-area-right,env(safe-area-inset-right))] max-sm:pl-[var(--mieweb-safe-area-left,env(safe-area-inset-left))]',
  '[@media(max-height:30rem)_and_(orientation:landscape)]:pt-[var(--mieweb-safe-area-top,env(safe-area-inset-top))] [@media(max-height:30rem)_and_(orientation:landscape)]:pb-[var(--mieweb-safe-area-bottom,env(safe-area-inset-bottom))]',
  // rtl-ignore -- safe-area insets are physical screen edges
  '[@media(max-height:30rem)_and_(orientation:landscape)]:pr-[var(--mieweb-safe-area-right,env(safe-area-inset-right))] [@media(max-height:30rem)_and_(orientation:landscape)]:pl-[var(--mieweb-safe-area-left,env(safe-area-inset-left))]',
].join(' ');
/** The header gives its room to the clip on the same screens. */
const PHONE_HIDDEN =
  'max-sm:hidden [@media(max-height:30rem)_and_(orientation:landscape)]:hidden';

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
  messageLabels,
  renderMessageMedia,
  currentParticipantId,
  renderPlugins,
  renderTextContent,
  trustedContent,
  readOnly,
  composerProps,
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
  const scheduledLabel = messageLabels?.scheduled ?? 'Scheduled';
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
  const overlay = mediaFeedProps?.layout === 'overlay';
  const isPhone = useMediaQuery(PHONE_QUERY);
  // With the overlay media view open on a phone, the panel covers the
  // screen (media above, message box below), so it acts as a modal there:
  // focus stays inside and Escape goes back. SuperChat focuses the chosen
  // item itself, so the trap doesn't.
  const mediaOpen = overlay && activeView === 'media';
  const covering = mediaOpen && isPhone;
  const panelRef = useFocusTrap<HTMLElement>(covering, {
    initialFocus: false,
  });
  const mediaViewRef = React.useRef<HTMLDivElement>(null);
  // A clip floating in picture in picture: the media view stays mounted
  // (hidden) after Back, since a browser closes the floating window when its
  // video leaves the page, and the viewer floated it to keep watching while
  // they reply. PiP events are heard on the document, which the hidden
  // view's events still reach.
  const [floating, setFloating] = React.useState(false);
  // Ask the browser rather than trusting the last event: a floating video
  // that leaves the page (a conversation change, a removed message) takes its
  // window with it, and its own events no longer reach the document.
  const checkFloating = React.useCallback(() => {
    const view = mediaViewRef.current;
    const floatingNow =
      !!view &&
      Array.from(view.querySelectorAll('video')).some(isInPictureInPicture);
    setFloating(floatingNow);
  }, [mediaViewRef]);
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    for (const name of PIP_EVENTS)
      document.addEventListener(name, checkFloating, true);
    return () => {
      for (const name of PIP_EVENTS)
        document.removeEventListener(name, checkFloating, true);
    };
  }, [checkFloating]);
  // Whatever re-renders the panel may have taken the floating video away.
  React.useEffect(() => {
    if (floating) checkFloating();
  });
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
  // While it covers the screen, Escape goes back unless another layer (the
  // feed's viewer, a host menu) is open.
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!covering || !panel) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const target = event.target as Node | null;
      if (target !== document.body && !(target && panel.contains(target)))
        return;
      const layered = Array.from(
        document.querySelectorAll(
          '[role="dialog"], [role="menu"], [role="listbox"]'
        )
      ).some((layer) => layer !== panel && !layer.closest('[hidden]'));
      if (!layered) handleBackToConversation();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [covering, handleBackToConversation, panelRef]);

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
    const findLauncher = () =>
      source?.conversationId === conversation.id
        ? Array.from(
            threadRef.current?.querySelectorAll<HTMLElement>(
              '[data-media-launch-id]'
            ) ?? []
          ).find((button) => button.dataset.mediaLaunchId === launchId)
        : undefined;
    // A virtualized thread mounts its rows a frame or two after the thread
    // itself, so look again for a few frames before settling on the thread.
    let frame = 0;
    let framesLeft = virtualized ? 10 : 0;
    const focusLauncher = () => {
      const launcher = findLauncher();
      if (!launcher && framesLeft-- > 0) {
        frame = requestAnimationFrame(focusLauncher);
        return;
      }
      (launcher ?? threadRef.current)?.focus({ preventScroll: true });
    };
    focusLauncher();
    return () => cancelAnimationFrame(frame);
  }, [activeView, conversation.id, threadRef, virtualized]);
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
      scheduledLabel={scheduledLabel}
      renderMessageMedia={renderMessageMedia}
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
    async (message: NewMessage, sendMeta?: ChatComposerSendMeta) => {
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
          onMessageSent?.(text, {
            conversation,
            mentions,
            attachments,
            ...(sendMeta?.sendOption !== undefined
              ? { sendOption: sendMeta.sendOption }
              : {}),
          })
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
      ref={panelRef}
      data-slot="superchat"
      role={covering ? 'dialog' : 'group'}
      aria-modal={covering || undefined}
      aria-labelledby={headingId}
      className={cn(
        'flex min-w-0 flex-1 flex-col bg-white dark:bg-neutral-900',
        // Mobile first: on a phone, upright or sideways, the overlay media
        // view takes the whole screen above the message box.
        mediaOpen && PHONE_FULLSCREEN,
        className
      )}
    >
      {showHeader ? (
        <header
          data-slot="superchat-header"
          className={cn(
            'flex items-center justify-between gap-2 border-b border-neutral-200 p-3 dark:border-neutral-700',
            // Its room goes to the clip; Back sits over the clip's corner.
            mediaOpen && PHONE_HIDDEN
          )}
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

      {(activeView === 'media' || floating) && (
        <div
          ref={mediaViewRef}
          data-slot="superchat-media-view"
          data-theme={overlay ? 'dark' : undefined}
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            overlay && 'bg-background relative',
            // A clip floating in picture in picture keeps the view mounted
            // after Back (its window closes if its video leaves the page).
            activeView !== 'media' && 'hidden'
          )}
        >
          {!overlay && (
            <div className="px-4 pt-2">
              <ButtonGroup className="justify-start">
                <Button
                  ref={backToConversationRef}
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <ArrowLeft
                      className="size-4 rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  }
                  onClick={handleBackToConversation}
                >
                  {labels.backToConversation}
                </Button>
              </ButtonGroup>
            </div>
          )}
          {/* One tree for both layouts, so switching keeps the feed (and its
              playback) mounted. In the overlay it sits inside the safe-area
              padding, so Back clears the notch. */}
          <div
            data-slot="superchat-media-stage"
            className="relative flex min-h-0 flex-1 flex-col"
          >
            {overlay && (
              // Over the clip's top corner, so the clip keeps the whole view.
              <Button
                ref={backToConversationRef}
                variant="ghost"
                size="icon"
                aria-label={labels.backToConversation}
                title={labels.backToConversation}
                className={cn(
                  overlayButtonClass,
                  'absolute start-2 top-2 z-20'
                )}
                onClick={handleBackToConversation}
              >
                <ArrowLeft
                  className="size-5 rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </Button>
            )}
            <MediaFeed
              {...mediaFeedProps}
              // In the overlay layout the media view is already the full view
              // (the whole screen on a phone), and the player's own controls
              // go full screen: no viewer on top unless the host asks.
              allowFullscreen={mediaFeedProps?.allowFullscreen ?? !overlay}
              classNames={{
                ...mediaFeedProps?.classNames,
                // Clear the Back button over the top corner.
                details: cn(
                  overlay && 'ps-14',
                  mediaFeedProps?.classNames?.details
                ),
              }}
              ref={mediaFeedRef}
              key={conversation.id}
              items={mediaItems}
              getId={(item) => item.id}
              getMedia={(item) => item.attachment}
              getTitle={(item) => item.attachment.title ?? ''}
              getCaption={(item) =>
                item.attachment.caption ?? item.message.text
              }
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
        </div>
      )}
      {activeView !== 'media' && (
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
              scheduledLabel={scheduledLabel}
              renderMessageMedia={renderMessageMedia}
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
        disabled={readOnly}
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
        {...composerProps}
        // Matches the thread's p-4 gutter so the composer card lines up with
        // the messages instead of running flush against the panel edges.
        className={cn('px-4 pb-4', composerProps?.className)}
        value={draft}
        onValueChange={handleDraftChange}
        onSend={handleComposerSend}
      />
    </section>
  );
}
