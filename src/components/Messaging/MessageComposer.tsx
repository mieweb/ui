import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import type { AttachmentType, NewMessage } from './types';
import {
  AttachmentPicker,
  AttachmentPreviewItem,
  CameraButton,
  DragDropZone,
  getFileType,
  generateAttachmentId,
} from './AttachmentPicker';

// ============================================================================
// Types
// ============================================================================

interface PendingAttachment {
  id: string;
  file: File;
  previewUrl?: string;
  type: AttachmentType;
  state: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress?: number;
  error?: string;
}

/**
 * A candidate for the composer's `@mention` autocomplete. Generic so any
 * surface (multi-party chat, agent picker, …) can supply its own list.
 */
export interface MentionOption {
  /** Stable id (returned to the host so it can map a selection back). */
  id: string;
  /** Display name shown in the suggestion list. */
  label: string;
  /** Text inserted after `@` on selection. Defaults to the first word of `label`. */
  value?: string;
  /** Optional secondary text shown after the label. */
  description?: string;
  /** Optional leading node (e.g. an avatar). */
  icon?: React.ReactNode;
  /** Optional trailing meta text (e.g. a kind tag). */
  meta?: string;
}

/** An in-progress `@mention` token located under the caret. */
export interface MentionToken {
  /** Text typed after the `@`. */
  query: string;
  /** Index of the `@` within the value. */
  start: number;
}

/**
 * Find the active `@query` immediately before the caret, if any. The `@` must
 * start the string or follow whitespace, and the token must contain no spaces
 * or further `@`.
 *
 * Exported so hosts supplying their own mention menu can reuse the parsing
 * rather than reimplement it, and so a custom `mentionQuery` can build on it.
 */
export function activeMentionQuery(
  value: string,
  caret: number
): MentionToken | null {
  const upToCaret = value.slice(0, caret);
  const match = /(^|\s)@([^\s@]*)$/.exec(upToCaret);
  if (!match) return null;
  const query = match[2];
  return { query, start: caret - query.length - 1 };
}

/**
 * Replace the token at `token.start` with `@text ` and report where the caret
 * should land afterwards. Counterpart to {@link activeMentionQuery}.
 */
export function replaceMentionToken(
  value: string,
  token: MentionToken,
  text: string
): { value: string; caret: number } {
  const mention = `@${text} `;
  const end = token.start + token.query.length + 1;
  return {
    value: value.slice(0, token.start) + mention + value.slice(end),
    caret: token.start + mention.length,
  };
}

/**
 * Whether a file satisfies one of the accepted `<input accept>` tokens.
 * Supports `type/*` wildcards, exact `type/subtype` tokens, and `.ext`
 * extension tokens (matched against the file name, mirroring the native
 * `<input accept>` behavior used by the picker and drag-and-drop).
 */
function isFileAccepted(file: File, accepted: string[]): boolean {
  if (!accepted || accepted.length === 0) return true;
  const mime = file.type;
  const name = file.name.toLowerCase();
  return accepted.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token.toLowerCase());
    if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1));
    if (token.includes('/')) return mime === token;
    return false;
  });
}

// ============================================================================
// Labels
// ============================================================================

/**
 * User-facing strings the composer renders. Every entry is optional and falls
 * back to English, so the component stays dependency-free while hosts that run
 * a translation layer can supply localized text.
 */
export interface MessageComposerLabels {
  /** `aria-label` for the textarea. */
  message: string;
  /** `aria-label` for the send button at rest. */
  send: string;
  /** `aria-label` for the send button while a message is in flight. */
  sending: string;
  /** `aria-label` for the cancel-reply button. */
  cancelReply: string;
  /** Heading above the reply preview. */
  replyingTo: (senderName: string) => string;
  /** `aria-label` for the mention suggestion listbox. */
  mentionList: string;
  /** `aria-label` for the character counter. */
  characterCount: (current: number, max: number) => string;
  /** Error surfaced when `onSend` rejects. */
  sendFailed: string;
  /** Error surfaced when more files are added than `maxAttachments` allows. */
  tooManyAttachments: (max: number) => string;
}

const defaultLabels: MessageComposerLabels = {
  message: 'Message',
  send: 'Send message',
  sending: 'Sending message',
  cancelReply: 'Cancel reply',
  replyingTo: (senderName) => `Replying to ${senderName}`,
  mentionList: 'Mention',
  characterCount: (current, max) => `${current} of ${max} characters`,
  sendFailed: 'Failed to send message',
  tooManyAttachments: (max) => `Maximum ${max} attachments allowed`,
};

// ============================================================================
// Character Counter Component
// ============================================================================

export interface CharacterCounterProps {
  current: number;
  max: number;
  showWarningAt?: number;
  className?: string;
  /** Overrides the default `"{current} of {max} characters"` label. */
  label?: string;
}

/**
 * Displays character count with warning colors.
 */
function CharacterCounter({
  current,
  max,
  showWarningAt = 0.9,
  className,
  label,
}: CharacterCounterProps) {
  const percentage = current / max;
  const isWarning = percentage >= showWarningAt && percentage < 1;
  const isOver = current > max;

  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        isOver
          ? 'font-medium text-red-700 dark:text-red-400'
          : isWarning
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-neutral-600 dark:text-neutral-400',
        className
      )}
      aria-live="polite"
      aria-label={label ?? defaultLabels.characterCount(current, max)}
    >
      {current}/{max}
    </span>
  );
}

CharacterCounter.displayName = 'CharacterCounter';

// ============================================================================
// Send Button Component
// ============================================================================

const sendButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full p-3 self-start',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-800 text-white',
          'hover:bg-primary-900',
          'active:scale-95',
        ],
        subtle: [
          'bg-transparent text-primary-800',
          'hover:bg-primary-50 dark:hover:bg-primary-900/20',
        ],
      },
      canSend: {
        true: '',
        false: 'opacity-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      variant: 'primary',
      canSend: false,
    },
  }
);

export interface SendButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sendButtonVariants> {
  isLoading?: boolean;
  /** Overrides the default `"Send message"` label. */
  label?: string;
  /** Overrides the default `"Sending message"` label used while loading. */
  loadingLabel?: string;
}

/**
 * Send button with loading state.
 */
const SendButton = React.forwardRef<HTMLButtonElement, SendButtonProps>(
  (
    {
      className,
      variant,
      canSend,
      isLoading,
      disabled,
      label,
      loadingLabel,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="submit"
        disabled={disabled || !canSend || isLoading}
        data-slot="composer-send-button"
        className={cn(sendButtonVariants({ variant, canSend }), className)}
        aria-label={
          isLoading
            ? (loadingLabel ?? defaultLabels.sending)
            : (label ?? defaultLabels.send)
        }
        {...props}
      >
        {isLoading ? (
          <svg
            aria-hidden="true"
            className="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </button>
    );
  }
);

SendButton.displayName = 'SendButton';

// ============================================================================
// Message Composer Component
// ============================================================================

/** Handles a host-rendered mention menu gets to drive the composer's text. */
export interface MentionMenuContext {
  /** The token currently under the caret. */
  token: MentionToken;
  /** Replace the token with `@text ` and restore focus after the mention. */
  insert: (text: string) => void;
  /** Dismiss the menu without changing the text. */
  close: () => void;
}

/** Context handed to `renderSendButton` so a custom button can drive sending. */
export interface SendButtonContext {
  /** Whether the composer currently has something worth sending. */
  canSend: boolean;
  /** Whether a previous send is still in flight. */
  isSending: boolean;
  /** Whether the composer is disabled. */
  disabled: boolean;
}

export interface MessageComposerProps {
  /** Called when a message is sent */
  onSend: (message: NewMessage) => void | Promise<void>;
  /** Called when the user starts typing */
  onTypingStart?: () => void;
  /** Called when the user stops typing */
  onTypingStop?: () => void;
  /** Controlled value for the textarea */
  value?: string;
  /** Callback when value changes (for controlled mode) */
  onValueChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum message length */
  maxLength?: number;
  /** Show character count */
  showCharacterCount?: boolean;
  /** Whether the composer is disabled */
  disabled?: boolean;
  /** Whether a message is currently being sent */
  isSending?: boolean;
  /** Show attachment picker */
  showAttachmentPicker?: boolean;
  /** Show camera button (mobile) */
  showCameraButton?: boolean;
  /** Accepted file types */
  acceptedFileTypes?: string[];
  /** Maximum file size */
  maxFileSize?: number;
  /** Maximum number of attachments */
  maxAttachments?: number;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Auto-focus the input */
  autoFocus?: boolean;
  /** Reply-to message reference */
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  /** Called when reply is cancelled */
  onCancelReply?: () => void;
  /** Visual variant - 'default' shows border-t, 'minimal' has no border */
  variant?: 'default' | 'minimal';
  /**
   * How the input and its controls are arranged. `'inline'` (default) keeps
   * everything on one row. `'stacked'` gives the textarea a full-width row of
   * its own and moves the attachment picker, toolbar slots, and send button to
   * a control row beneath it — the shape narrow screens need.
   */
  layout?: 'inline' | 'stacked';
  /** Content to render inside the input wrapper (e.g. a mic button) */
  inputTrailing?: React.ReactNode;
  /**
   * Controls placed at the leading edge of the control row (e.g. a model
   * picker). `layout="stacked"` only.
   */
  toolbarStart?: React.ReactNode;
  /**
   * Controls placed at the trailing edge of the control row, before the send
   * button (e.g. a mic button). `layout="stacked"` only.
   */
  toolbarEnd?: React.ReactNode;
  /**
   * Replaces the built-in send button. Return `null` to drop it entirely and
   * supply your own via `toolbarEnd`. A custom button should use
   * `type="submit"` so it still submits the composer's form.
   */
  renderSendButton?: (context: SendButtonContext) => React.ReactNode;
  /**
   * Cap on the textarea's auto-grow height. Accepts any CSS length; the
   * viewport-relative default lets long drafts use a short screen instead of
   * being pinned to a fixed pixel height.
   *
   * @default '40vh'
   */
  maxHeight?: number | string;
  /**
   * Overrides for the composer's user-facing strings. Unspecified entries fall
   * back to English.
   */
  labels?: Partial<MessageComposerLabels>;
  /**
   * Called before the composer's own paste handling. Call `preventDefault()`
   * to take over the paste entirely (e.g. to read images as base64 rather than
   * staging `File`s).
   */
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
  /**
   * Candidates for `@mention` autocomplete. When provided (non-empty), typing
   * `@` opens a picker. Omit to disable mentions entirely (default).
   */
  mentionOptions?: MentionOption[];
  /**
   * Overrides how the `@token` under the caret is located. Defaults to
   * {@link activeMentionQuery}; supply your own to widen what counts as a
   * mention (e.g. to allow an email address).
   */
  mentionQuery?: (value: string, caret: number) => MentionToken | null;
  /** Called whenever the token under the caret changes. */
  onMentionChange?: (token: MentionToken | null) => void;
  /**
   * Replaces the built-in suggestion list with a host-rendered menu, which is
   * what surfaces that need to search a backend or run a follow-up flow
   * require. Rendered inside the (relatively positioned) input wrapper, so the
   * menu positions itself. Enables mentions on its own — `mentionOptions` is
   * ignored when set.
   */
  renderMentionMenu?: (context: MentionMenuContext) => React.ReactNode;
  /**
   * Whether a host-rendered mention menu currently has selectable options. The
   * composer yields Arrow/Enter/Tab/Escape to the menu while this is true, so
   * Enter picks a suggestion instead of sending. With no options it must be
   * `false` or a literal `@foo` could never be sent.
   */
  mentionMenuHasOptions?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * A message input component with attachment support and send button.
 *
 * @example
 * ```tsx
 * <MessageComposer
 *   onSend={handleSend}
 *   placeholder="Type a message..."
 *   showAttachmentPicker
 *   maxLength={1600}
 * />
 * ```
 */
const MessageComposer = React.forwardRef<
  HTMLTextAreaElement,
  MessageComposerProps
>(
  (
    {
      onSend,
      onTypingStart,
      onTypingStop,
      value: controlledValue,
      onValueChange,
      placeholder = 'Type a message...',
      maxLength = 1600,
      showCharacterCount = false,
      disabled = false,
      isSending = false,
      showAttachmentPicker = true,
      showCameraButton = false,
      acceptedFileTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
      maxFileSize = 25 * 1024 * 1024,
      maxAttachments = 10,
      onError,
      autoFocus = false,
      replyTo = null,
      onCancelReply,
      variant = 'default',
      layout = 'inline',
      inputTrailing,
      toolbarStart,
      toolbarEnd,
      renderSendButton,
      maxHeight = '40vh',
      labels: labelOverrides,
      onPaste,
      mentionOptions,
      mentionQuery = activeMentionQuery,
      onMentionChange,
      renderMentionMenu,
      mentionMenuHasOptions = false,
      className,
    },
    ref
  ) => {
    const labels = React.useMemo(
      () => ({ ...defaultLabels, ...labelOverrides }),
      [labelOverrides]
    );
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [internalContent, setInternalContent] = React.useState('');
    const isControlled = controlledValue !== undefined;
    const content = isControlled ? controlledValue : internalContent;
    const setContent = React.useCallback(
      (val: string | ((prev: string) => string)) => {
        if (isControlled) {
          const newVal = typeof val === 'function' ? val(controlledValue) : val;
          onValueChange?.(newVal);
        } else {
          setInternalContent(val);
        }
      },
      [isControlled, controlledValue, onValueChange]
    );
    const [attachments, setAttachments] = React.useState<PendingAttachment[]>(
      []
    );
    const [isTyping, setIsTyping] = React.useState(false);
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-resize textarea. The cap is read back from the resolved `max-height`
    // so a viewport-relative value (the default) yields real pixels.
    const resizeTextarea = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const resolved = parseFloat(
        window.getComputedStyle(textarea).maxHeight ?? ''
      );
      textarea.style.height = 'auto';
      textarea.style.height = `${
        Number.isNaN(resolved)
          ? textarea.scrollHeight
          : Math.min(textarea.scrollHeight, resolved)
      }px`;
    }, []);

    React.useEffect(() => {
      resizeTextarea();
    }, [content, maxHeight, resizeTextarea]);

    // A viewport-relative cap goes stale on rotation, address-bar collapse, and
    // on-screen keyboard show/hide, none of which re-render the composer.
    React.useEffect(() => {
      const viewport = window.visualViewport;
      window.addEventListener('resize', resizeTextarea);
      viewport?.addEventListener('resize', resizeTextarea);
      return () => {
        window.removeEventListener('resize', resizeTextarea);
        viewport?.removeEventListener('resize', resizeTextarea);
      };
    }, [resizeTextarea]);

    // Handle typing indicators
    React.useEffect(() => {
      if (content.length > 0 && !isTyping) {
        setIsTyping(true);
        onTypingStart?.();
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingStop?.();
        }
      }, 2000);

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, [content, isTyping, onTypingStart, onTypingStop]);

    // Focus on mount if autoFocus
    React.useEffect(() => {
      if (autoFocus) {
        textareaRef.current?.focus();
      }
    }, [autoFocus]);

    // Focus when reply is set
    React.useEffect(() => {
      if (replyTo) {
        textareaRef.current?.focus();
      }
    }, [replyTo]);

    // --- @mention autocomplete (opt-in via `mentionOptions`) ---
    // A host-rendered menu enables mentions on its own and takes over the list.
    const hostMentionMenu = !!renderMentionMenu;
    const mentionsEnabled =
      hostMentionMenu || (!!mentionOptions && mentionOptions.length > 0);
    const [mention, setMention] = React.useState<MentionToken | null>(null);
    const [mentionHighlight, setMentionHighlight] = React.useState(0);
    const mentionListId = React.useId();
    const mentionOptionId = (i: number) => `${mentionListId}-option-${i}`;

    const mentionSuggestions = React.useMemo(() => {
      if (hostMentionMenu || !mention || !mentionOptions) return [];
      const q = mention.query.toLowerCase();
      return mentionOptions.filter((o) => o.label.toLowerCase().includes(q));
    }, [hostMentionMenu, mention, mentionOptions]);

    const mentionMenuOpen =
      mentionsEnabled &&
      !hostMentionMenu &&
      mention !== null &&
      mentionSuggestions.length > 0;

    /** Whether a mention menu — built-in or host-rendered — owns the keyboard. */
    const mentionMenuCapturesKeys = hostMentionMenu
      ? mention !== null && mentionMenuHasOptions
      : mentionMenuOpen;

    // Portal + fixed positioning so the mention menu escapes overflow-hidden
    // ancestors.
    const {
      anchorRef: mentionAnchorRef,
      floatingRef: mentionFloatingRef,
      style: mentionStyle,
    } = useAnchoredPosition<HTMLDivElement, HTMLUListElement>({
      open: mentionMenuOpen,
      placement: 'top-start',
      maxHeight: 224,
    });
    // Clamp the highlight to the current suggestion range so the active option
    // never points at a stale/out-of-range index (the list can shrink while the
    // menu is open as the query narrows). The same clamped index drives
    // `aria-activedescendant`, `aria-selected`, and the visual highlight so they
    // can never disagree.
    const clampedMentionHighlight = mentionMenuOpen
      ? Math.min(mentionHighlight, mentionSuggestions.length - 1)
      : -1;
    const activeMentionOptionId = mentionMenuOpen
      ? mentionOptionId(clampedMentionHighlight)
      : undefined;

    const syncMention = React.useCallback(
      (value: string, caret: number) => {
        if (!mentionsEnabled) return;
        const token = mentionQuery(value, caret);
        setMention(token);
        setMentionHighlight(0);
        onMentionChange?.(token);
      },
      [mentionsEnabled, mentionQuery, onMentionChange]
    );

    const closeMention = React.useCallback(() => {
      setMention(null);
      onMentionChange?.(null);
    }, [onMentionChange]);

    /** Swaps the active token for `@text ` and puts the caret after it. */
    const insertMentionText = (token: MentionToken, text: string) => {
      const next = replaceMentionToken(content, token, text);
      setContent(next.value);
      closeMention();
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(next.caret, next.caret);
        }
      });
    };

    const insertMention = (option: MentionOption) => {
      if (!mention) return;
      insertMentionText(mention, option.value ?? option.label.split(' ')[0]);
    };

    const canSend =
      (content.trim().length > 0 || attachments.length > 0) &&
      content.length <= maxLength &&
      !disabled &&
      !isSending;

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canSend) return;

      const message: NewMessage = {
        content: content.trim(),
        attachments: attachments.map((a) => a.file),
        replyToId: replyTo?.id,
      };

      // Clear state before sending for optimistic UI
      setContent('');
      setAttachments([]);
      setIsTyping(false);
      onTypingStop?.();

      try {
        await onSend(message);
      } catch {
        // Restore content on failure
        setContent(message.content);
        // Note: attachments would need to be re-added manually
        onError?.(labels.sendFailed);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // A host-rendered menu handles its own navigation; step aside entirely so
      // Enter picks a suggestion rather than sending.
      if (hostMentionMenu) {
        if (
          mentionMenuCapturesKeys &&
          ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(event.key)
        ) {
          return;
        }
      } else if (mentionMenuOpen) {
        // @mention menu navigation takes priority over send.
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setMentionHighlight((h) => (h + 1) % mentionSuggestions.length);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setMentionHighlight(
            (h) =>
              (h - 1 + mentionSuggestions.length) % mentionSuggestions.length
          );
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          // `mentionHighlight` can fall out of range if the list shrank while
          // the menu was open; fall back to the first suggestion.
          const chosen =
            mentionSuggestions[mentionHighlight] ?? mentionSuggestions[0];
          if (chosen) insertMention(chosen);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMention();
          return;
        }
      }
      // Send on Enter (without Shift)
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (canSend) {
          handleSubmit(event);
        }
      }
    };

    const handleFilesSelected = (files: File[]) => {
      const remainingSlots = maxAttachments - attachments.length;
      const filesToAdd = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        onError?.(labels.tooManyAttachments(maxAttachments));
      }

      const newAttachments: PendingAttachment[] = filesToAdd.map((file) => {
        const type = getFileType(file.type);
        let previewUrl: string | undefined;

        if (type === 'image' || type === 'video') {
          previewUrl = URL.createObjectURL(file);
        }

        return {
          id: generateAttachmentId(),
          file,
          previewUrl,
          type,
          state: 'pending' as const,
        };
      });

      setAttachments((prev) => [...prev, ...newAttachments]);
    };

    // Paste-to-attach: route pasted files through the same path as the picker.
    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // The host gets first refusal so it can stage pasted files its own way.
      onPaste?.(event);
      if (event.defaultPrevented) return;
      if (!showAttachmentPicker || disabled) return;
      const pasted = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)
        .filter((f) => isFileAccepted(f, acceptedFileTypes));
      if (pasted.length === 0) return;
      // We're attaching the file ourselves; don't also paste a blob/path.
      event.preventDefault();
      handleFilesSelected(pasted);
    };

    const handleRemoveAttachment = (attachmentId: string) => {
      setAttachments((prev) => {
        const attachment = prev.find((a) => a.id === attachmentId);
        if (attachment?.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
        return prev.filter((a) => a.id !== attachmentId);
      });
    };

    // Cleanup preview URLs on unmount
    React.useEffect(() => {
      // Capture current attachments for cleanup
      const currentAttachments = attachments;
      return () => {
        currentAttachments.forEach((a) => {
          if (a.previewUrl) {
            URL.revokeObjectURL(a.previewUrl);
          }
        });
      };
    }, [attachments]);

    const attachmentControls = (
      <>
        {showAttachmentPicker && (
          <AttachmentPicker
            onFilesSelected={handleFilesSelected}
            acceptedTypes={acceptedFileTypes}
            maxFileSize={maxFileSize}
            maxFiles={maxAttachments - attachments.length}
            disabled={disabled || attachments.length >= maxAttachments}
            onError={onError}
          />
        )}

        {showCameraButton && (
          <CameraButton
            onCapture={(file) => handleFilesSelected([file])}
            disabled={disabled || attachments.length >= maxAttachments}
          />
        )}
      </>
    );

    const sendButton = renderSendButton ? (
      renderSendButton({ canSend, isSending, disabled })
    ) : (
      <SendButton
        canSend={canSend}
        isLoading={isSending}
        disabled={disabled}
        label={labels.send}
        loadingLabel={labels.sending}
      />
    );

    return (
      <DragDropZone
        onFilesDropped={handleFilesSelected}
        acceptedTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
        maxFiles={maxAttachments - attachments.length}
        disabled={disabled || attachments.length >= maxAttachments}
        onError={onError}
        className={cn('w-full', className)}
      >
        <form
          onSubmit={handleSubmit}
          data-slot="message-composer"
          className="w-full"
        >
          {/* Reply preview */}
          {replyTo && (
            <div
              data-slot="composer-reply-preview"
              className={cn(
                'flex items-center gap-2 px-4 py-2',
                'bg-neutral-50 dark:bg-neutral-800/50',
                'border-primary-500 border-s-4'
              )}
            >
              <div className="min-w-0 flex-1">
                <span className="text-primary-800 dark:text-primary-400 text-xs font-medium">
                  {labels.replyingTo(replyTo.senderName)}
                </span>
                <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">
                  {replyTo.content}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelReply}
                className={cn(
                  'shrink-0 rounded p-1',
                  'text-neutral-500 hover:text-neutral-700',
                  'dark:text-neutral-400 dark:hover:text-neutral-200',
                  'focus:ring-primary-500 focus:ring-2 focus:outline-none'
                )}
                aria-label={labels.cancelReply}
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div
              data-slot="composer-attachments"
              className={cn(
                'flex flex-wrap gap-2 p-3',
                'border-t border-neutral-200 dark:border-neutral-700'
              )}
            >
              {attachments.map((attachment) => (
                <AttachmentPreviewItem
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={() => handleRemoveAttachment(attachment.id)}
                />
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            data-slot="composer-input-area"
            className={cn(
              'flex gap-2 p-3',
              layout === 'stacked' ? 'flex-col' : 'items-center',
              'bg-white dark:bg-neutral-900',
              variant === 'default' &&
                'border-t border-neutral-200 dark:border-neutral-700'
            )}
          >
            {/* Attachment buttons. The stacked layout moves them onto the
                control row below the textarea instead. */}
            {layout === 'inline' && attachmentControls}

            {/* Text input */}
            <div
              data-slot="composer-input-wrapper"
              className={cn(
                'relative',
                layout === 'stacked' ? 'w-full min-w-0' : 'flex-1'
              )}
              ref={mentionAnchorRef}
            >
              {mentionMenuOpen &&
                createPortal(
                  <ul
                    ref={mentionFloatingRef}
                    style={mentionStyle}
                    id={mentionListId}
                    role="listbox"
                    aria-label={labels.mentionList}
                    data-slot="composer-mention-list"
                    className="w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    {mentionSuggestions.map((option, i) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          id={mentionOptionId(i)}
                          role="option"
                          aria-selected={i === clampedMentionHighlight}
                          // onMouseDown (not onClick) so the textarea keeps focus.
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertMention(option);
                          }}
                          onMouseEnter={() => setMentionHighlight(i)}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm',
                            i === clampedMentionHighlight
                              ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100'
                              : 'text-neutral-700 dark:text-neutral-200'
                          )}
                        >
                          {option.icon}
                          <span className="min-w-0 flex-1 truncate">
                            <span className="font-medium">{option.label}</span>
                            {option.description && (
                              <span className="ms-1 text-xs text-neutral-400">
                                {option.description}
                              </span>
                            )}
                          </span>
                          {option.meta && (
                            <span className="text-[10px] text-neutral-400">
                              {option.meta}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>,
                  document.body
                )}
              <textarea
                ref={textareaRef}
                data-slot="composer-input"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  syncMention(
                    e.target.value,
                    e.target.selectionStart ?? e.target.value.length
                  );
                }}
                onClick={(e) => {
                  const el = e.currentTarget;
                  syncMention(el.value, el.selectionStart ?? el.value.length);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                disabled={disabled || isSending}
                rows={1}
                className={cn(
                  'w-full resize-none rounded-2xl py-2.5',
                  inputTrailing ? 'ps-4 pe-10' : 'px-4',
                  'bg-neutral-100 dark:bg-neutral-800',
                  'text-neutral-900 dark:text-neutral-100',
                  'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                  'focus:ring-primary-500 focus:ring-2 focus:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'transition-colors'
                )}
                style={{
                  maxHeight:
                    typeof maxHeight === 'number'
                      ? `${maxHeight}px`
                      : maxHeight,
                }}
                aria-label={labels.message}
                aria-describedby={showCharacterCount ? 'char-count' : undefined}
                {...(mentionsEnabled
                  ? {
                      'aria-controls': mentionMenuOpen
                        ? mentionListId
                        : undefined,
                      'aria-activedescendant': activeMentionOptionId,
                      'aria-autocomplete': 'list' as const,
                    }
                  : {})}
              />

              {/* Trailing content (e.g. record button) */}
              {inputTrailing && (
                <div
                  data-slot="composer-input-trailing"
                  className="pointer-events-none absolute end-1 top-0 flex h-[44px] items-center [&>*]:pointer-events-auto"
                >
                  {inputTrailing}
                </div>
              )}

              {/* Character count */}
              {showCharacterCount && (
                <div
                  data-slot="composer-char-count"
                  id="char-count"
                  className="absolute end-3 bottom-1.5"
                >
                  <CharacterCounter
                    current={content.length}
                    max={maxLength}
                    label={labels.characterCount(content.length, maxLength)}
                  />
                </div>
              )}

              {/* Host-rendered mention menu. Positioned by the host against
                  this relatively-positioned wrapper. */}
              {hostMentionMenu &&
                mention &&
                renderMentionMenu({
                  token: mention,
                  insert: (text) => insertMentionText(mention, text),
                  close: closeMention,
                })}
            </div>

            {/* Send button, on its own control row when stacked */}
            {layout === 'stacked' ? (
              <div
                data-slot="composer-toolbar"
                className="flex w-full min-w-0 items-center gap-2"
              >
                {attachmentControls}
                {toolbarStart}
                <div
                  data-slot="composer-toolbar-end"
                  className="ms-auto flex shrink-0 items-center gap-2"
                >
                  {toolbarEnd}
                  {sendButton}
                </div>
              </div>
            ) : (
              sendButton
            )}
          </div>
        </form>
      </DragDropZone>
    );
  }
);

MessageComposer.displayName = 'MessageComposer';

export { MessageComposer, CharacterCounter, SendButton, sendButtonVariants };
