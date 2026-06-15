import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
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

/**
 * Find the active `@query` immediately before the caret, if any. The `@` must
 * start the string or follow whitespace, and the token must contain no spaces
 * or further `@`.
 */
function activeMentionQuery(
  value: string,
  caret: number
): { query: string; start: number } | null {
  const upToCaret = value.slice(0, caret);
  const match = /(^|\s)@([^\s@]*)$/.exec(upToCaret);
  if (!match) return null;
  const query = match[2];
  return { query, start: caret - query.length - 1 };
}

/**
 * Whether a MIME type satisfies one of the accepted `<input accept>` tokens.
 * Supports `type/*` wildcards and exact `type/subtype` tokens; extension tokens
 * (e.g. `.pdf`) can't be matched against a pasted blob and are ignored here.
 */
function isMimeAccepted(mime: string, accepted: string[]): boolean {
  if (!accepted || accepted.length === 0) return true;
  return accepted.some((token) => {
    if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1));
    if (token.includes('/')) return mime === token;
    return false;
  });
}

// ============================================================================
// Character Counter Component
// ============================================================================

export interface CharacterCounterProps {
  current: number;
  max: number;
  showWarningAt?: number;
  className?: string;
}

/**
 * Displays character count with warning colors.
 */
function CharacterCounter({
  current,
  max,
  showWarningAt = 0.9,
  className,
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
      aria-label={`${current} of ${max} characters`}
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
}

/**
 * Send button with loading state.
 */
const SendButton = React.forwardRef<HTMLButtonElement, SendButtonProps>(
  ({ className, variant, canSend, isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="submit"
        disabled={disabled || !canSend || isLoading}
        data-slot="composer-send-button"
        className={cn(sendButtonVariants({ variant, canSend }), className)}
        aria-label={isLoading ? 'Sending message' : 'Send message'}
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
  /** Content to render inside the input wrapper (e.g. a mic button) */
  inputTrailing?: React.ReactNode;
  /**
   * Candidates for `@mention` autocomplete. When provided (non-empty), typing
   * `@` opens a picker. Omit to disable mentions entirely (default).
   */
  mentionOptions?: MentionOption[];
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
      inputTrailing,
      mentionOptions,
      className,
    },
    ref
  ) => {
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

    // Auto-resize textarea
    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
      }
    }, [content]);

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
    const mentionsEnabled = !!mentionOptions && mentionOptions.length > 0;
    const [mention, setMention] = React.useState<{
      query: string;
      start: number;
    } | null>(null);
    const [mentionHighlight, setMentionHighlight] = React.useState(0);
    const mentionListId = React.useId();
    const mentionOptionId = (i: number) => `${mentionListId}-option-${i}`;

    const mentionSuggestions = React.useMemo(() => {
      if (!mention || !mentionOptions) return [];
      const q = mention.query.toLowerCase();
      return mentionOptions.filter((o) => o.label.toLowerCase().includes(q));
    }, [mention, mentionOptions]);

    const mentionMenuOpen =
      mentionsEnabled && mention !== null && mentionSuggestions.length > 0;
    const activeMentionOptionId = mentionMenuOpen
      ? mentionOptionId(mentionHighlight)
      : undefined;

    const syncMention = React.useCallback(
      (value: string, caret: number) => {
        if (!mentionsEnabled) return;
        setMention(activeMentionQuery(value, caret));
        setMentionHighlight(0);
      },
      [mentionsEnabled]
    );

    const insertMention = (option: MentionOption) => {
      if (!mention) return;
      const insertValue = option.value ?? option.label.split(' ')[0];
      const before = content.slice(0, mention.start);
      const after = content.slice(mention.start + 1 + mention.query.length);
      const insert = `@${insertValue} `;
      setContent(before + insert + after);
      setMention(null);
      // Restore caret just after the inserted mention.
      const caret = before.length + insert.length;
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(caret, caret);
        }
      });
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
        onError?.('Failed to send message');
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // @mention menu navigation takes priority over send.
      if (mentionMenuOpen) {
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
          setMention(null);
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
        onError?.(`Maximum ${maxAttachments} attachments allowed`);
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
      if (!showAttachmentPicker || disabled) return;
      const pasted = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)
        .filter((f) => isMimeAccepted(f.type, acceptedFileTypes));
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
                'border-primary-500 border-l-4'
              )}
            >
              <div className="min-w-0 flex-1">
                <span className="text-primary-800 dark:text-primary-400 text-xs font-medium">
                  Replying to {replyTo.senderName}
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
                aria-label="Cancel reply"
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
              'flex items-center gap-2 p-3',
              'bg-white dark:bg-neutral-900',
              variant === 'default' &&
                'border-t border-neutral-200 dark:border-neutral-700'
            )}
          >
            {/* Attachment buttons */}
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

            {/* Text input */}
            <div data-slot="composer-input-wrapper" className="relative flex-1">
              {mentionMenuOpen && (
                <ul
                  id={mentionListId}
                  role="listbox"
                  aria-label="Mention"
                  data-slot="composer-mention-list"
                  className="absolute bottom-full left-0 z-10 mb-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {mentionSuggestions.map((option, i) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        id={mentionOptionId(i)}
                        role="option"
                        aria-selected={i === mentionHighlight}
                        // onMouseDown (not onClick) so the textarea keeps focus.
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertMention(option);
                        }}
                        onMouseEnter={() => setMentionHighlight(i)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                          i === mentionHighlight
                            ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100'
                            : 'text-neutral-700 dark:text-neutral-200'
                        )}
                      >
                        {option.icon}
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{option.label}</span>
                          {option.description && (
                            <span className="ml-1 text-xs text-neutral-400">
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
                </ul>
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
                  inputTrailing ? 'pr-10 pl-4' : 'px-4',
                  'bg-neutral-100 dark:bg-neutral-800',
                  'text-neutral-900 dark:text-neutral-100',
                  'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                  'focus:ring-primary-500 focus:ring-2 focus:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'transition-colors',
                  'max-h-[150px]'
                )}
                aria-label="Message"
                aria-describedby={showCharacterCount ? 'char-count' : undefined}
                {...(mentionsEnabled
                  ? {
                      role: 'combobox' as const,
                      'aria-expanded': mentionMenuOpen,
                      'aria-controls': mentionMenuOpen
                        ? mentionListId
                        : undefined,
                      'aria-activedescendant': activeMentionOptionId,
                      'aria-autocomplete': 'list' as const,
                      'aria-haspopup': 'listbox' as const,
                    }
                  : {})}
              />

              {/* Trailing content (e.g. record button) */}
              {inputTrailing && (
                <div
                  data-slot="composer-input-trailing"
                  className="pointer-events-none absolute top-0 right-1 flex h-[44px] items-center [&>*]:pointer-events-auto"
                >
                  {inputTrailing}
                </div>
              )}

              {/* Character count */}
              {showCharacterCount && (
                <div
                  data-slot="composer-char-count"
                  id="char-count"
                  className="absolute right-3 bottom-1.5"
                >
                  <CharacterCounter current={content.length} max={maxLength} />
                </div>
              )}
            </div>

            {/* Send button */}
            <SendButton
              canSend={canSend}
              isLoading={isSending}
              disabled={disabled}
            />
          </div>
        </form>
      </DragDropZone>
    );
  }
);

MessageComposer.displayName = 'MessageComposer';

export { MessageComposer, CharacterCounter, SendButton, sendButtonVariants };
