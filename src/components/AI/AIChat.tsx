/**
 * AI Chat Component
 *
 * A complete chat interface for AI interactions with support for
 * MCP tool calls, suggested actions, and streaming responses.
 *
 * This component reuses the shared ChatComposer for its input and the
 * Messaging module's EmptyState to maintain DRY principles.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type {
  AIMessage,
  AIChatSession,
  AISuggestedAction,
  AIChatCallbacks,
  AIRenderMessageFooter,
  AIRenderTextContent,
  MCPResourceLink,
} from './types';
import { AIMessageDisplay } from './AIMessage';
import {
  ChatComposer,
  type ChatComposerProps,
} from '../ChatComposer/ChatComposer';
import { notifyComposerMigrationOnce } from '../ChatComposer/migration-notice';
import type { NewMessage } from '../Messaging/types';
import {
  DEFAULT_ACCEPTED_FILE_TYPES,
  DEFAULT_MAX_FILE_SIZE,
} from '../Messaging/AttachmentPicker';
import { useTypingEmulation } from '../Messaging/hooks';
import {
  EmptyState as MessagingEmptyState,
  type EmptyStateProps as MessagingEmptyStateProps,
} from '../Messaging/MessageList';
import { RecordButton } from '../RecordButton';
import { SparklesIcon, CloseIcon, RefreshIcon } from './icons';

// ============================================================================
// Suggested Actions Component
// ============================================================================

export interface SuggestedActionsProps {
  /** Available suggested actions */
  actions: AISuggestedAction[];
  /** Callback when an action is selected */
  onSelect: (action: AISuggestedAction) => void;
  /** Additional class name */
  className?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  patient: (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      />
    </svg>
  ),
  search: (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  ),
  appointment: (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  ),
  document: (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  help: (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  ),
  default: (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export function SuggestedActions({
  actions,
  onSelect,
  className,
}: SuggestedActionsProps) {
  return (
    <div
      data-slot="ai-chat-suggestions"
      className={cn('flex flex-wrap gap-2', className)}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          data-slot="ai-chat-suggestion-btn"
          onClick={() => onSelect(action)}
          className={cn(
            'flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5',
            'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-900 text-sm text-neutral-700',
            'dark:border-neutral-700 dark:text-neutral-300',
            'dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-300',
            'transition-colors'
          )}
        >
          {ACTION_ICONS[action.icon || 'default'] || ACTION_ICONS.default}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// AI Empty State Component (wraps Messaging EmptyState with AI-specific defaults)
// ============================================================================

interface AIEmptyStateProps extends Omit<MessagingEmptyStateProps, 'icon'> {
  suggestions?: AISuggestedAction[];
  onSuggestionSelect?: (action: AISuggestedAction) => void;
}

function AIEmptyState({
  title = 'How can I help you today?',
  description = 'Ask me anything about patients, appointments, documents, or how to use the system.',
  suggestions,
  onSuggestionSelect,
  className,
  ...props
}: AIEmptyStateProps) {
  const aiIcon = (
    <div
      data-slot="ai-empty-state-icon"
      className="bg-primary-800 dark:bg-primary-800 flex h-16 w-16 items-center justify-center rounded-full text-white"
    >
      <SparklesIcon size="lg" className="h-8 w-8" />
    </div>
  );

  const suggestionsAction =
    suggestions && suggestions.length > 0 && onSuggestionSelect ? (
      <div className="mt-6">
        <p className="text-muted-foreground mb-3 text-sm">Try asking:</p>
        <SuggestedActions actions={suggestions} onSelect={onSuggestionSelect} />
      </div>
    ) : undefined;

  return (
    <MessagingEmptyState
      title={title}
      description={description}
      icon={aiIcon}
      action={suggestionsAction}
      className={className}
      {...props}
    />
  );
}

// ============================================================================
// AI Chat Component
// ============================================================================

/** How close to the bottom (px) still counts as "reading the latest message". */
const BOTTOM_PIN_THRESHOLD_PX = 32;

const chatVariants = cva('flex flex-col', {
  variants: {
    variant: {
      default: 'bg-white dark:bg-neutral-900',
      embedded: 'bg-transparent',
      floating:
        'bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700',
    },
    size: {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'full',
  },
});

/**
 * Legacy `MessageComposerProps`-era keys still accepted through
 * `composerProps` so hosts written against the old composer keep compiling
 * and working without changes. Each key is mapped onto its ChatComposer
 * equivalent (or emulated) — see the individual deprecation notes. New code
 * should pass `ChatComposerProps` keys directly.
 */
export interface AIChatLegacyComposerProps {
  /** @deprecated Use `allowAttachments` instead. */
  showAttachmentPicker?: boolean;
  /** @deprecated ChatComposer has no camera button; this prop is ignored. */
  showCameraButton?: boolean;
  /** @deprecated ChatComposer has a single presentation; this prop is ignored. */
  variant?: 'default' | 'minimal';
  /** @deprecated Use `micSlot` instead (rendered in the composer's action row). */
  inputTrailing?: React.ReactNode;
  /** @deprecated Emulated by AIChat: fires when the draft becomes non-empty (MessageComposer parity). */
  onTypingStart?: () => void;
  /** @deprecated Emulated by AIChat: fires after 2s idle or on send (MessageComposer parity). */
  onTypingStop?: () => void;
}

/** Props accepted by `AIChatProps.composerProps`. */
export type AIChatComposerProps = Partial<ChatComposerProps> &
  AIChatLegacyComposerProps;

// MessageComposer rendered its trailing slot behind `{inputTrailing && …}`,
// so any falsy value (e.g. `false` from `cond && <Mic />`, null, '')
// suppressed it. ChatComposer only skips `undefined` — anything else mounts
// the slot wrapper — so normalize falsy legacy slot values to undefined.
const normalizeLegacySlot = (node: React.ReactNode): React.ReactNode =>
  node || undefined;

export interface AIChatProps
  extends VariantProps<typeof chatVariants>, AIChatCallbacks {
  /** Chat session data */
  session?: AIChatSession;
  /** Messages to display (alternative to session) */
  messages?: AIMessage[];
  /** Whether the AI is generating */
  isGenerating?: boolean;
  /** Current user name */
  userName?: string;
  /** Title for the chat header */
  title?: string;
  /** Suggested actions */
  suggestions?: AISuggestedAction[];
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Placeholder for input */
  inputPlaceholder?: string;
  /** Height constraint */
  height?: string | number;
  /**
   * Props to pass to the internal ChatComposer. Legacy MessageComposer-era
   * keys (`showAttachmentPicker`, `inputTrailing`, `onTypingStart`, …) are
   * still accepted and mapped — see {@link AIChatLegacyComposerProps}.
   */
  composerProps?: AIChatComposerProps;
  /** Enable talk-to-text microphone button inside the input */
  talkToText?: boolean;
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback when recording completes (receives audio blob and duration) */
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  /** Callback when close button is clicked (shows close button when provided) */
  onClose?: () => void;
  /**
   * Optional renderer for `text` content blocks (e.g. Markdown). Called per
   * text block with `{ messageId, streaming, role }`. Host must sanitize.
   */
  renderTextContent?: AIRenderTextContent;
  /** Optional per-message footer rendered below each bubble (e.g. actions). */
  renderMessageFooter?: AIRenderMessageFooter;
  /** Additional class name */
  className?: string;
}

/**
 * A complete AI chat interface with message history, input, and tool call support.
 * Reuses the shared ChatComposer for a consistent input UX.
 */
export function AIChat({
  session,
  messages: messagesProp,
  isGenerating: isGeneratingProp,
  userName = 'You',
  title = 'AI Assistant',
  suggestions,
  showHeader = true,
  showTimestamps = false,
  inputPlaceholder = 'Ask anything...',
  variant,
  size,
  height,
  composerProps,
  talkToText = false,
  onRecordingStart,
  onRecordingComplete,
  className,
  onSendMessage,
  onToolCall: _onToolCall,
  onResourceClick,
  onSuggestedAction,
  onCancel,
  onClear,
  onClose,
  renderTextContent,
  renderMessageFooter,
}: AIChatProps) {
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    notifyComposerMigrationOnce('AIChat');
  }, []);

  const messages = React.useMemo(
    () => session?.messages || messagesProp || [],
    [session?.messages, messagesProp]
  );
  const isGenerating = session?.isGenerating || isGeneratingProp || false;

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  // Keep the latest message in view when the list itself shrinks (mobile
  // keyboard opening, composer growing) — but only if the reader was already
  // at the bottom, so scrolling back through history is never interrupted.
  React.useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    let pinnedToBottom = true;
    const handleScroll = () => {
      pinnedToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <=
        BOTTOM_PIN_THRESHOLD_PX;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (pinnedToBottom) container.scrollTop = container.scrollHeight;
          });
    observer?.observe(container);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer?.disconnect();
    };
  }, []);

  // Split legacy MessageComposer-era keys (mapped below) and the keys AIChat
  // must own (value/onValueChange for draft restore) from the passthrough.
  const {
    showAttachmentPicker,
    inputTrailing,
    onTypingStart,
    onTypingStop,
    value: hostValue,
    onValueChange: hostOnValueChange,
    onSend: hostOnSend,
    micSlot: hostMicSlot,
    ...composerRest
  } = composerProps ?? {};
  // `showCameraButton` and `variant` have no ChatComposer equivalent (see
  // the deprecation notes); strip them so they never reach the composer.
  delete composerRest.showCameraButton;
  delete composerRest.variant;

  const hasInputTrailing = !!composerProps && 'inputTrailing' in composerProps;

  // `showAttachmentPicker` needs a presence check: MessageComposer defaulted
  // it to true, so the old `{...composerProps}` spread turned a
  // present-but-undefined key into "enabled" (it erased AIChat's own
  // explicit `false`), while an absent key left attachments off.
  const legacyAttachments =
    !!composerProps && 'showAttachmentPicker' in composerProps
      ? (showAttachmentPicker ?? true)
      : false;

  // Controlled composer draft so a failed send can restore the typed text
  // (ChatComposer clears optimistically and delegates restore to the host;
  // MessageComposer restored it internally). When the host controls the
  // value via composerProps, restore flows through its onValueChange.
  const [draft, setDraft] = React.useState('');
  // Bumped on every user edit, so a stale failed send never overwrites
  // newer typed input.
  const draftEpochRef = React.useRef(0);
  const composerValue = hostValue ?? draft;
  // MessageComposer only invoked onValueChange when controlled
  // (value !== undefined); preserve that contract for legacy hosts that
  // pass onValueChange alone. This is a deliberate AIChat-owned exception
  // to the ChatComposer API: `composerProps.onValueChange` without `value`
  // receives no callbacks here (raw ChatComposer would fire it on every
  // edit). Pass `value` too if you need change notifications.
  const isHostControlled = hostValue !== undefined;
  const handleComposerValueChange = React.useCallback(
    (value: string) => {
      draftEpochRef.current += 1;
      setDraft(value);
      if (isHostControlled) hostOnValueChange?.(value);
    },
    [isHostControlled, hostOnValueChange]
  );

  // Emulate MessageComposer's typing callbacks for legacy composerProps
  // consumers (shared with MessageThread — see useTypingEmulation).
  const { stopTyping } = useTypingEmulation({
    value: composerValue,
    onTypingStart,
    onTypingStop,
  });

  // Shared send path: stop typing, await the handler, and restore the draft
  // on failure (epoch-guarded so a stale failure never clobbers newer input).
  // MessageComposer applied this to host-supplied `onSend` too.
  const sendWithRestore = async (
    message: NewMessage,
    send: (message: NewMessage) => void | Promise<void>
  ) => {
    stopTyping();
    const epoch = draftEpochRef.current;
    try {
      // A returned promise is awaited so an async rejection follows the
      // same draft-restore path as a synchronous throw.
      await Promise.resolve(send(message));
    } catch (error) {
      if (draftEpochRef.current === epoch) {
        setDraft(message.content);
        if (isHostControlled) hostOnValueChange?.(message.content);
      }
      // Rethrow so ChatComposer reports the failure through `onError`
      // ('Failed to send message' — the same copy MessageComposer used).
      throw error;
    }
  };

  const handleSend = async (message: NewMessage) => {
    if (!onSendMessage) return;
    const content = message.content.trim();
    const attachments = message.attachments?.length
      ? message.attachments
      : undefined;
    // ChatComposer has already cleared its staged files by the time `onSend`
    // runs, so attachment-only messages must still reach the host — dropping
    // them here would silently destroy the user's files.
    if (!content && !attachments) return;
    await sendWithRestore(message, () =>
      // Keep the exact legacy call shape for text-only sends.
      attachments ? onSendMessage(content, attachments) : onSendMessage(content)
    );
  };

  const handleSuggestionSelect = (action: AISuggestedAction) => {
    if (onSuggestedAction) {
      onSuggestedAction(action);
    } else if (onSendMessage) {
      onSendMessage(action.prompt);
    }
  };

  const handleLinkClick = (link: MCPResourceLink) => {
    if (onResourceClick) {
      onResourceClick(link);
    }
  };

  return (
    <div
      data-slot="ai-chat"
      className={cn(chatVariants({ variant, size }), className)}
      style={{ height: height || undefined }}
    >
      {/* Header */}
      {showHeader && (
        <div
          data-slot="ai-chat-header"
          className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700"
        >
          <div className="flex items-center gap-3">
            <div
              data-slot="ai-chat-header-icon"
              className="bg-primary-800 dark:bg-primary-800 flex h-8 w-8 items-center justify-center rounded-full text-white"
            >
              <SparklesIcon size="sm" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 dark:text-white">
                {title}
              </h2>
              {isGenerating && (
                <p className="text-xs text-neutral-500">Generating...</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isGenerating && onCancel && (
              <button
                onClick={onCancel}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm',
                  'bg-red-100 text-red-700 hover:bg-red-200',
                  'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                  'transition-colors'
                )}
              >
                Stop
              </button>
            )}
            {onClear && messages.length > 0 && (
              <button
                onClick={onClear}
                data-slot="ai-chat-header-action"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Clear chat"
                aria-label="Clear chat"
              >
                <RefreshIcon />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                data-slot="ai-chat-header-action"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Close chat"
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        data-slot="ai-chat-messages"
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <AIEmptyState
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <AIMessageDisplay
                key={message.id}
                message={message}
                userName={userName}
                showTimestamp={showTimestamps}
                onLinkClick={handleLinkClick}
                renderTextContent={renderTextContent}
                renderMessageFooter={renderMessageFooter}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input - Using the shared ChatComposer */}
      <div
        data-slot="ai-chat-input"
        className="shrink-0 border-t border-neutral-200 dark:border-neutral-700"
      >
        {suggestions &&
          suggestions.length > 0 &&
          messages.length > 0 &&
          !isGenerating && (
            <div data-slot="ai-chat-input-suggestions" className="px-4 pt-3">
              <SuggestedActions
                actions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            </div>
          )}
        {/* Same p-3 breathing room MessageComposer's input area used. */}
        <div data-slot="ai-chat-composer" className="p-3">
          <ChatComposer
            onSend={
              hostOnSend
                ? (message: NewMessage) => sendWithRestore(message, hostOnSend)
                : handleSend
            }
            placeholder={inputPlaceholder}
            disabled={isGenerating}
            isSending={isGenerating}
            // composerProps wins over the built-in talkToText slot (same
            // override order as the old {...composerProps} spread). micSlot
            // is a ChatComposer passthrough prop, so non-undefined values —
            // including null — forward raw and keep ChatComposer's own
            // semantics (null mounts its default mic button); only the
            // legacy inputTrailing path normalizes falsy values, preserving
            // MessageComposer's `{inputTrailing && …}` suppression.
            micSlot={
              hostMicSlot !== undefined ? (
                hostMicSlot
              ) : hasInputTrailing ? (
                normalizeLegacySlot(inputTrailing)
              ) : talkToText ? (
                <RecordButton
                  variant="ghost"
                  size="sm"
                  showPulse={false}
                  showWaveform
                  disabled={isGenerating}
                  onRecordingStart={onRecordingStart}
                  onRecordingComplete={onRecordingComplete}
                />
              ) : undefined
            }
            {...composerRest}
            // MessageComposer-parity defaults, applied after the spread so
            // explicit `undefined` in composerProps can't erase them
            // (MessageComposer's destructuring defaults treated undefined
            // as absent); explicit values still win.
            allowAttachments={
              composerRest.allowAttachments ?? legacyAttachments
            }
            maxLength={composerRest.maxLength ?? 1600}
            inputLabel={composerRest.inputLabel ?? 'Message'}
            acceptedFileTypes={
              composerRest.acceptedFileTypes ??
              (legacyAttachments ? DEFAULT_ACCEPTED_FILE_TYPES : undefined)
            }
            maxFileSize={
              composerRest.maxFileSize ??
              (legacyAttachments ? DEFAULT_MAX_FILE_SIZE : undefined)
            }
            value={composerValue}
            onValueChange={handleComposerValueChange}
          />
        </div>
      </div>
    </div>
  );
}

// Re-export for convenience
export type { AISuggestedAction };
