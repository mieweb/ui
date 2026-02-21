import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type {
  Message,
  MessageStatus,
  MessageAttachment,
  ReadReceipt,
} from './types';

// ============================================================================
// Message Status Icon Component
// ============================================================================

const statusIconVariants = cva(
  'inline-flex items-center gap-0.5 text-current',
  {
    variants: {
      status: {
        sending: 'text-neutral-500',
        sent: 'text-neutral-500',
        delivered: 'text-neutral-600 dark:text-neutral-400',
        read: 'text-primary-600 dark:text-primary-400',
        failed: 'text-red-500',
      },
    },
    defaultVariants: {
      status: 'sent',
    },
  }
);

export interface MessageStatusIconProps {
  status: MessageStatus;
  className?: string;
}

/**
 * Visual status indicator for messages (checkmarks).
 */
function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
  return (
    <span
      className={cn(statusIconVariants({ status }), className)}
      role="img"
      aria-label={`Message ${status}`}
    >
      {status === 'sending' && (
        <svg
          className="h-3.5 w-3.5 animate-spin"
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
      )}
      {status === 'sent' && (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {(status === 'delivered' || status === 'read') && (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 13l4 4L26 7"
            transform="translate(-5, 0)"
          />
        </svg>
      )}
      {status === 'failed' && (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )}
    </span>
  );
}

// ============================================================================
// Read Receipt Indicator Component
// ============================================================================

export interface ReadReceiptIndicatorProps {
  /** Read receipts to display */
  receipts: ReadReceipt[];
  /** Maximum avatars to show before +N */
  maxAvatars?: number;
  /** Size of avatars */
  size?: 'xs' | 'sm';
  className?: string;
}

/**
 * Displays read receipt avatars for group conversations.
 */
function ReadReceiptIndicator({
  receipts,
  maxAvatars = 3,
  size = 'xs',
  className,
}: ReadReceiptIndicatorProps) {
  if (receipts.length === 0) return null;

  const visibleReceipts = receipts.slice(0, maxAvatars);
  const remainingCount = receipts.length - maxAvatars;

  const sizeClasses = {
    xs: 'h-4 w-4 text-[8px]',
    sm: 'h-5 w-5 text-[10px]',
  };

  return (
    <div
      className={cn('flex items-center -space-x-1', className)}
      aria-label={`Read by ${receipts.map((r) => r.participant.name).join(', ')}`}
    >
      {visibleReceipts.map((receipt) => (
        <div
          key={receipt.participant.id}
          className={cn(
            'rounded-full ring-2 ring-white dark:ring-neutral-900',
            'bg-primary-800 font-medium text-white',
            'flex items-center justify-center',
            sizeClasses[size]
          )}
          title={`Read by ${receipt.participant.name}`}
        >
          {receipt.participant.avatarUrl ? (
            <img
              src={receipt.participant.avatarUrl}
              alt={receipt.participant.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            receipt.participant.name.charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full ring-2 ring-white dark:ring-neutral-900',
            'bg-neutral-500 font-medium text-white',
            'flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Message Attachment Preview Component
// ============================================================================

export interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  onClick?: () => void;
  className?: string;
}

/**
 * Renders an attachment preview within a message bubble.
 */
function AttachmentPreview({
  attachment,
  onClick,
  className,
}: AttachmentPreviewProps) {
  const isImage = attachment.type === 'image';
  const isVideo = attachment.type === 'video';

  if (isImage || isVideo) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative block overflow-hidden rounded-lg',
          'focus:ring-primary-500 focus:ring-2 focus:outline-none',
          'transition-transform hover:scale-[1.02]',
          className
        )}
        aria-label={`View ${attachment.alt || attachment.filename}`}
      >
        <img
          src={attachment.thumbnailUrl || attachment.url}
          alt={attachment.alt || attachment.filename}
          className="max-h-64 w-auto rounded-lg object-cover"
          loading="lazy"
        />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="rounded-full bg-white/90 p-3">
              <svg
                className="h-6 w-6 text-neutral-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
        {attachment.state === 'uploading' &&
          attachment.progress !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <svg
                  className="mx-auto h-8 w-8 animate-spin"
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
                <span className="mt-1 text-sm">{attachment.progress}%</span>
              </div>
            </div>
          )}
        {attachment.state === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <svg
                className="mx-auto h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="mt-1 text-sm">Upload failed</span>
            </div>
          </div>
        )}
      </button>
    );
  }

  // File/document attachment
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg p-3',
        'bg-white/10 hover:bg-white/20',
        'transition-colors',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        className
      )}
    >
      <div className="rounded-lg bg-white/20 p-2">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{attachment.filename}</p>
        <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
      </div>
    </button>
  );
}

/**
 * Format file size in human-readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Message Bubble Component
// ============================================================================

const bubbleVariants = cva(
  [
    'relative max-w-[85%] sm:max-w-[70%]',
    'rounded-2xl px-4 py-2',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        outgoing: ['bg-primary-800 text-white', 'rounded-br-md', 'ml-auto'],
        incoming: [
          'bg-neutral-100 text-neutral-900',
          'dark:bg-neutral-800 dark:text-neutral-100',
          'rounded-bl-md',
          'mr-auto',
        ],
        system: [
          'mx-auto max-w-none',
          'bg-transparent text-neutral-500 dark:text-neutral-400',
          'text-center text-sm',
          'py-1 px-2',
        ],
      },
      status: {
        sending: 'opacity-70',
        sent: '',
        delivered: '',
        read: '',
        failed: 'ring-2 ring-red-500/50',
      },
    },
    defaultVariants: {
      variant: 'incoming',
      status: 'sent',
    },
  }
);

export interface MessageBubbleProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>,
    VariantProps<typeof bubbleVariants> {
  /** The message to display */
  message: Message;
  /** Whether to show the sender's avatar */
  showAvatar?: boolean;
  /** Whether to show the sender's name (for group chats) */
  showSenderName?: boolean;
  /** Whether to show the timestamp */
  showTimestamp?: boolean;
  /** Whether to show message status */
  showStatus?: boolean;
  /** Whether to show read receipts */
  showReadReceipts?: boolean;
  /** Called when retry is clicked for failed messages */
  onRetry?: () => void;
  /** Called when an attachment is clicked */
  onAttachmentClick?: (attachment: MessageAttachment) => void;
  /** Whether this is the current user's message */
  isOutgoing?: boolean;
  /** Custom timestamp formatter */
  formatTimestamp?: (timestamp: Date | string) => string;
}

/**
 * Default timestamp formatter.
 */
function defaultFormatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * A message bubble component for displaying individual messages.
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isOutgoing={message.sender.isCurrentUser}
 *   showAvatar
 *   showTimestamp
 * />
 * ```
 */
const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      className,
      message,
      showAvatar = false,
      showSenderName = false,
      showTimestamp = true,
      showStatus = true,
      showReadReceipts = true,
      onRetry,
      onAttachmentClick,
      isOutgoing,
      formatTimestamp = defaultFormatTimestamp,
      ...props
    },
    ref
  ) => {
    const isSystem = message.type === 'system';
    const variant = isSystem ? 'system' : isOutgoing ? 'outgoing' : 'incoming';

    const hasAttachments =
      message.attachments && message.attachments.length > 0;
    const hasText = message.content && message.content.trim().length > 0;
    const isFailed = message.status === 'failed';

    // System messages render differently
    if (isSystem) {
      return (
        <div
          ref={ref}
          className={cn(bubbleVariants({ variant: 'system' }), className)}
          role="status"
          aria-live="polite"
          {...props}
        >
          {message.content}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'group flex items-end gap-2',
          isOutgoing ? 'flex-row-reverse' : 'flex-row',
          className
        )}
        {...props}
      >
        {/* Avatar */}
        {showAvatar && !isOutgoing && (
          <div className="mb-1 shrink-0">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'bg-primary-800 text-sm font-medium text-white'
              )}
            >
              {message.sender.avatarUrl ? (
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                message.sender.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        )}

        {/* Message content container */}
        <div
          className={cn(
            'flex flex-col',
            isOutgoing ? 'items-end' : 'items-start'
          )}
        >
          {/* Sender name (for group chats) */}
          {showSenderName && !isOutgoing && (
            <span className="mb-1 px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {message.sender.name}
            </span>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div
              className={cn(
                'mb-1 max-w-full rounded-lg px-3 py-1.5 text-xs',
                isOutgoing
                  ? 'bg-primary-700/50 text-white/80'
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
              )}
            >
              <span className="font-medium">{message.replyTo.sender.name}</span>
              <p className="truncate">{message.replyTo.content}</p>
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(bubbleVariants({ variant, status: message.status }))}
            role="article"
            aria-label={`Message from ${message.sender.name}`}
          >
            {/* Attachments */}
            {hasAttachments && (
              <div className={cn('space-y-2', hasText && 'mb-2')}>
                {message.attachments!.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    onClick={() => onAttachmentClick?.(attachment)}
                  />
                ))}
              </div>
            )}

            {/* Text content */}
            {hasText && (
              <p className="break-words whitespace-pre-wrap">
                {message.isDeleted ? (
                  <span className="italic opacity-60">
                    This message was deleted
                  </span>
                ) : (
                  message.content
                )}
              </p>
            )}

            {/* Edited indicator */}
            {message.isEdited && !message.isDeleted && (
              <span className="ml-1 text-xs opacity-60">(edited)</span>
            )}
          </div>

          {/* Footer: timestamp, status, read receipts */}
          <div
            className={cn(
              'mt-1 flex items-center gap-2 px-1',
              isOutgoing ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {showTimestamp && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatTimestamp(message.timestamp)}
              </span>
            )}

            {showStatus && isOutgoing && (
              <MessageStatusIcon status={message.status} />
            )}

            {showReadReceipts &&
              isOutgoing &&
              message.readReceipts &&
              message.readReceipts.length > 0 && (
                <ReadReceiptIndicator receipts={message.readReceipts} />
              )}

            {/* Retry button for failed messages */}
            {isFailed && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5',
                  'text-xs font-medium text-red-500',
                  'hover:bg-red-50 dark:hover:bg-red-900/20',
                  'focus:ring-2 focus:ring-red-500 focus:outline-none'
                )}
                aria-label="Retry sending message"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={cn(
                '-mt-1 flex flex-wrap gap-1',
                isOutgoing ? 'justify-end' : 'justify-start'
              )}
            >
              {message.reactions.map((reaction) => (
                <span
                  key={reaction.emoji}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                    'bg-neutral-100 text-xs dark:bg-neutral-800',
                    'border border-neutral-200 dark:border-neutral-700'
                  )}
                  title={reaction.participants.map((p) => p.name).join(', ')}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count > 1 && (
                    <span className="text-neutral-500">{reaction.count}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Spacer for avatar alignment when showing own messages */}
        {showAvatar && isOutgoing && <div className="w-8 shrink-0" />}
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

export {
  MessageBubble,
  MessageStatusIcon,
  ReadReceiptIndicator,
  AttachmentPreview,
  bubbleVariants,
  formatFileSize,
};
