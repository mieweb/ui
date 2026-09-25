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
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import {
  useStickToBottom,
  useStreamEndedBelowFold,
} from '../../hooks/useStickToBottom';
import { CloseIcon } from '../AI/icons';
import { ChatComposer } from '../ChatComposer/ChatComposer';
import { notifyComposerMigrationOnce } from '../ChatComposer/migration-notice';
import { JumpToBottomButton } from '../ChatComposer/JumpToBottomButton';
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
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// SuperChat (single-conversation panel)
// ============================================================================

export interface SuperChatProps {
  /** The conversation to display (host-owned state). */
  conversation: SuperChatConversation;
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
  onMessageSent,
  onMessageEdited,
  onConversationClosed,
  onReferenceClick,
  onBack,
}: SuperChatProps) {
  const headingId = React.useId();

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
  } = useStickToBottom({ disabled: order === 'desc' });
  const [hasNewBelow, setHasNewBelow] = React.useState(false);
  // Own-send turn anchoring (ChatGPT/Claude-style): the freshly sent message
  // opens a "turn" that reserves a viewport of space, anchored so the bubble
  // sits at the top and replies stream into the space below. Plain thread
  // only — the virtualizer owns row layout, so virtualized mode keeps the
  // pin-to-bottom behavior for own sends.
  const [turnStartId, setTurnStartId] = React.useState<string | null>(null);
  const [turnMinHeight, setTurnMinHeight] = React.useState<number>();
  const anchoredTurnRef = React.useRef<string | null>(null);

  // Anchor to the newest message on mount and when switching conversations:
  // bottom for ascending order, top for descending (feed-style) order.
  React.useEffect(() => {
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
  }, [threadLength, order, isAtBottom, conversation.id]);

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
        {order !== 'desc' && !isAtBottom && (
          <JumpToBottomButton
            dataSlot="superchat-jump-to-bottom"
            hasNewMessages={hasNewBelow}
            onClick={handleJumpToBottom}
          />
        )}
      </div>

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
            : 'Type a message… use @ to address an agent'
        }
        mentionOptions={mentionOptions}
        allowAttachments={!readOnly}
        acceptedFileTypes={composerAccept}
        // Same cap MessageComposer applied by default.
        maxFileSize={25 * 1024 * 1024}
        maxLength={100000}
        inputLabel="Message"
      />
    </section>
  );
}
