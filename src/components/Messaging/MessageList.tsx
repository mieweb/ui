import * as React from 'react';
import { cn } from '../../utils/cn';
import type {
  Message,
  MessageGroup,
  MessageParticipant,
  MessageAttachment,
  TypingState,
} from './types';
import { MessageBubble } from './MessageBubble';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Groups messages by date.
 */
function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: Map<string, Message[]> = new Map();

  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateKey = date.toDateString();
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, message]);
  });

  return Array.from(groups.entries()).map(([dateKey, msgs]) => ({
    date: dateKey,
    label: formatDateLabel(new Date(dateKey)),
    messages: msgs,
  }));
}

/**
 * Format date label for message grouping.
 */
function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // Check if same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if two messages are from the same sender within a time threshold.
 */
function isSameSenderGroup(
  prev: Message | undefined,
  current: Message,
  thresholdMinutes: number = 5
): boolean {
  if (!prev) return false;
  if (prev.sender.id !== current.sender.id) return false;
  if (prev.type === 'system' || current.type === 'system') return false;

  const prevTime = new Date(prev.timestamp).getTime();
  const currentTime = new Date(current.timestamp).getTime();
  const diffMinutes = (currentTime - prevTime) / (1000 * 60);

  return diffMinutes < thresholdMinutes;
}

// ============================================================================
// Skeleton Message Component
// ============================================================================

export interface SkeletonMessageProps {
  isOutgoing?: boolean;
  showAvatar?: boolean;
  className?: string;
}

/**
 * A skeleton placeholder for loading messages.
 */
function SkeletonMessage({
  isOutgoing = false,
  showAvatar = true,
  className,
}: SkeletonMessageProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOutgoing ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      aria-hidden="true"
    >
      {showAvatar && !isOutgoing && (
        <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
      )}
      <div
        className={cn(
          'animate-pulse rounded-2xl',
          isOutgoing
            ? 'bg-primary-800/30 rounded-br-md'
            : 'rounded-bl-md bg-neutral-200 dark:bg-neutral-700',
          'h-10 w-48'
        )}
      />
      {showAvatar && isOutgoing && <div className="w-8" />}
    </div>
  );
}

SkeletonMessage.displayName = 'SkeletonMessage';

// ============================================================================
// Typing Indicator Component
// ============================================================================

export interface TypingIndicatorProps {
  typingState: TypingState;
  className?: string;
}

/**
 * Displays who is currently typing.
 */
function TypingIndicator({ typingState, className }: TypingIndicatorProps) {
  const { participants } = typingState;

  if (participants.length === 0) return null;

  const typingText =
    participants.length === 1
      ? `${participants[0].name} is typing`
      : participants.length === 2
        ? `${participants[0].name} and ${participants[1].name} are typing`
        : `${participants[0].name} and ${participants.length - 1} others are typing`;

  return (
    <div
      className={cn('flex items-center gap-2 px-4 py-2', className)}
      role="status"
      aria-live="polite"
      aria-label={typingText}
    >
      {/* Typing bubble animation */}
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-neutral-200 px-4 py-3 dark:bg-neutral-700">
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-neutral-500"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-neutral-500"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-neutral-500"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs text-neutral-500 dark:text-neutral-400">
        {typingText}
      </span>
    </div>
  );
}

TypingIndicator.displayName = 'TypingIndicator';

// ============================================================================
// Date Separator Component
// ============================================================================

export interface DateSeparatorProps {
  label: string;
  className?: string;
}

/**
 * A visual separator showing the date between message groups.
 */
function DateSeparator({ label, className }: DateSeparatorProps) {
  return (
    <div
      className={cn('flex items-center justify-center py-4', className)}
      role="separator"
      aria-label={label}
    >
      <span
        className={cn(
          'rounded-full px-3 py-1 text-xs font-medium',
          'bg-neutral-100 text-neutral-500',
          'dark:bg-neutral-800 dark:text-neutral-400'
        )}
      >
        {label}
      </span>
    </div>
  );
}

DateSeparator.displayName = 'DateSeparator';

// ============================================================================
// Empty State Component
// ============================================================================

export interface EmptyStateProps {
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Action button */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state shown when there are no messages.
 */
function EmptyState({
  title = 'No messages yet',
  description = 'Start the conversation by sending a message below.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center p-8 text-center',
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon || (
        <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
          <svg
            className="h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="mb-4 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

// ============================================================================
// Load More Button Component
// ============================================================================

export interface LoadMoreButtonProps {
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Button to load more message history.
 */
function LoadMoreButton({
  isLoading,
  onClick,
  className,
}: LoadMoreButtonProps) {
  return (
    <div className={cn('flex justify-center py-4', className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          'rounded-full px-4 py-2 text-sm font-medium',
          'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
          'hover:bg-neutral-200 dark:hover:bg-neutral-700',
          'focus:ring-primary-500 focus:ring-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors'
        )}
        aria-label={isLoading ? 'Loading more messages' : 'Load more messages'}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
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
            Loading...
          </span>
        ) : (
          'Load earlier messages'
        )}
      </button>
    </div>
  );
}

LoadMoreButton.displayName = 'LoadMoreButton';

// ============================================================================
// Message List Component
// ============================================================================

export interface MessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Current user for determining outgoing messages */
  currentUser: MessageParticipant;
  /** Whether messages are loading */
  isLoading?: boolean;
  /** Whether more messages are available */
  hasMore?: boolean;
  /** Whether more messages are being loaded */
  isLoadingMore?: boolean;
  /** Typing indicator state */
  typingState?: TypingState;
  /** Show avatars for incoming messages */
  showAvatars?: boolean;
  /** Show sender names (for group conversations) */
  showSenderNames?: boolean;
  /** Group messages by date */
  groupByDate?: boolean;
  /** Callback when load more is triggered */
  onLoadMore?: () => void;
  /** Callback when a message action (retry) is triggered */
  onRetryMessage?: (messageId: string) => void;
  /** Callback when an attachment is clicked */
  onAttachmentClick?: (attachment: MessageAttachment, message: Message) => void;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Custom timestamp formatter */
  formatTimestamp?: (timestamp: Date | string) => string;
  /** Additional class name */
  className?: string;
  /** Auto-scroll behavior */
  autoScroll?: 'always' | 'onNewMessage' | 'manual';
}

/**
 * A scrollable list of messages with date grouping, auto-scroll, and loading states.
 *
 * @example
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   currentUser={currentUser}
 *   typingState={typingState}
 *   onLoadMore={handleLoadMore}
 *   showAvatars
 *   groupByDate
 * />
 * ```
 */
const MessageList = React.forwardRef<HTMLDivElement, MessageListProps>(
  (
    {
      messages,
      currentUser,
      isLoading = false,
      hasMore = false,
      isLoadingMore = false,
      typingState,
      showAvatars = true,
      showSenderNames = false,
      groupByDate = true,
      onLoadMore,
      onRetryMessage,
      onAttachmentClick,
      emptyState,
      formatTimestamp,
      className,
      autoScroll = 'onNewMessage',
    },
    ref
  ) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const [isUserScrolled, setIsUserScrolled] = React.useState(false);
    const prevMessageCountRef = React.useRef(messages.length);

    // Combine refs
    React.useImperativeHandle(ref, () => scrollContainerRef.current!);

    // Handle scroll to detect if user has scrolled up
    const handleScroll = React.useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolled(!isAtBottom);
    }, []);

    // Auto-scroll on new messages
    React.useEffect(() => {
      const container = scrollContainerRef.current;
      const bottom = bottomRef.current;
      if (!container || !bottom) return;

      const messageCountChanged =
        messages.length !== prevMessageCountRef.current;
      prevMessageCountRef.current = messages.length;

      if (autoScroll === 'always') {
        bottom.scrollIntoView({ behavior: 'smooth' });
      } else if (autoScroll === 'onNewMessage' && messageCountChanged) {
        // Check if new message is from current user (outgoing)
        const lastMessage = messages[messages.length - 1];
        const isOutgoing = lastMessage?.sender.id === currentUser.id;

        // Always scroll on outgoing, only scroll on incoming if at bottom
        if (isOutgoing || !isUserScrolled) {
          bottom.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, [messages, currentUser.id, autoScroll, isUserScrolled]);

    // Scroll to bottom on initial load
    React.useEffect(() => {
      const bottom = bottomRef.current;
      if (bottom && !isLoading) {
        bottom.scrollIntoView();
      }
    }, [isLoading]);

    // Group messages
    const messageGroups = groupByDate
      ? groupMessagesByDate(messages)
      : [{ date: 'all', label: '', messages }];

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          className={cn(
            'flex flex-1 flex-col gap-3 overflow-y-auto p-4',
            className
          )}
          aria-busy="true"
          aria-label="Loading messages"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonMessage
              key={i}
              isOutgoing={i % 3 === 0}
              showAvatar={showAvatars}
            />
          ))}
        </div>
      );
    }

    // Empty state
    if (messages.length === 0) {
      return emptyState || <EmptyState />;
    }

    return (
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex flex-1 flex-col overflow-y-auto',
          'scroll-smooth',
          className
        )}
        onScroll={handleScroll}
        role="log"
        aria-label="Message history"
        aria-live="polite"
      >
        {/* Load more button */}
        {hasMore && onLoadMore && (
          <LoadMoreButton isLoading={isLoadingMore} onClick={onLoadMore} />
        )}

        {/* Messages grouped by date */}
        <div className="flex flex-col gap-1 p-4">
          {messageGroups.map((group) => (
            <React.Fragment key={group.date}>
              {/* Date separator */}
              {groupByDate && group.label && (
                <DateSeparator label={group.label} />
              )}

              {/* Messages in group */}
              {group.messages.map((message, index) => {
                const prevMessage = group.messages[index - 1];
                const isOutgoing = message.sender.id === currentUser.id;
                const isSameGroup = isSameSenderGroup(prevMessage, message);

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'transition-opacity duration-200',
                      isSameGroup ? 'mt-0.5' : 'mt-3',
                      index === 0 && 'mt-0'
                    )}
                  >
                    <MessageBubble
                      message={message}
                      isOutgoing={isOutgoing}
                      showAvatar={showAvatars && !isSameGroup && !isOutgoing}
                      showSenderName={
                        showSenderNames && !isSameGroup && !isOutgoing
                      }
                      showTimestamp={!isSameGroup}
                      onRetry={
                        message.status === 'failed' && onRetryMessage
                          ? () => onRetryMessage(message.id)
                          : undefined
                      }
                      onAttachmentClick={(attachment) =>
                        onAttachmentClick?.(attachment, message)
                      }
                      formatTimestamp={formatTimestamp}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Typing indicator */}
        {typingState && typingState.participants.length > 0 && (
          <TypingIndicator typingState={typingState} />
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-0" aria-hidden="true" />

        {/* Scroll to bottom button when user has scrolled up */}
        {isUserScrolled && (
          <button
            type="button"
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={cn(
              'fixed right-4 bottom-24 z-10',
              'rounded-full p-3 shadow-lg',
              'bg-white dark:bg-neutral-800',
              'border border-neutral-200 dark:border-neutral-700',
              'hover:bg-neutral-50 dark:hover:bg-neutral-700',
              'focus:ring-primary-500 focus:ring-2 focus:outline-none',
              'transition-all'
            )}
            aria-label="Scroll to bottom"
          >
            <svg
              className="h-5 w-5 text-neutral-600 dark:text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export {
  MessageList,
  SkeletonMessage,
  TypingIndicator,
  DateSeparator,
  EmptyState,
  LoadMoreButton,
  groupMessagesByDate,
  formatDateLabel,
  isSameSenderGroup,
};
