/* eslint-disable no-undef */
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
          ? 'font-medium text-red-500'
          : isWarning
            ? 'text-amber-500'
            : 'text-neutral-400',
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
    'rounded-full p-2.5',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-800 text-white',
          'hover:bg-primary-700',
          'active:scale-95',
        ],
        subtle: [
          'bg-transparent text-primary-600',
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
        className={cn(sendButtonVariants({ variant, canSend }), className)}
        aria-label={isLoading ? 'Sending message' : 'Send message'}
        {...props}
      >
        {isLoading ? (
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
      className,
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = React.useState('');
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
        <form onSubmit={handleSubmit} className="w-full">
          {/* Reply preview */}
          {replyTo && (
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2',
                'bg-neutral-50 dark:bg-neutral-800/50',
                'border-primary-500 border-l-4'
              )}
            >
              <div className="min-w-0 flex-1">
                <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
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
                  'text-neutral-400 hover:text-neutral-600',
                  'dark:text-neutral-500 dark:hover:text-neutral-300',
                  'focus:ring-primary-500 focus:ring-2 focus:outline-none'
                )}
                aria-label="Cancel reply"
              >
                <svg
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
            className={cn(
              'flex items-end gap-2 p-3',
              'bg-white dark:bg-neutral-900',
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
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isSending}
                rows={1}
                className={cn(
                  'w-full resize-none rounded-2xl px-4 py-2.5',
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
              />

              {/* Character count */}
              {showCharacterCount && (
                <div id="char-count" className="absolute right-3 bottom-1.5">
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
