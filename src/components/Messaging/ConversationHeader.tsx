import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type { Conversation, MessageParticipant } from './types';

// ============================================================================
// Conversation Header Component
// ============================================================================

const headerVariants = cva(
  [
    'flex items-center gap-3 px-4 py-3',
    'bg-white dark:bg-neutral-900',
    'border-b border-neutral-200 dark:border-neutral-700',
  ],
  {
    variants: {
      size: {
        sm: 'py-2',
        md: 'py-3',
        lg: 'py-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ConversationHeaderProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  /** The conversation to display */
  conversation?: Conversation;
  /** Custom title (overrides conversation name) */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Participant for direct messages */
  participant?: MessageParticipant;
  /** Show online status indicator */
  showOnlineStatus?: boolean;
  /** Show back button (mobile) */
  showBackButton?: boolean;
  /** Called when back button is clicked */
  onBack?: () => void;
  /** Additional actions (menu, call, etc.) */
  actions?: React.ReactNode;
  /** Custom left content */
  leftContent?: React.ReactNode;
  /** Custom right content */
  rightContent?: React.ReactNode;
}

/**
 * Get display title for a conversation.
 */
function getConversationTitle(
  conversation?: Conversation,
  participant?: MessageParticipant
): string {
  if (conversation?.name) return conversation.name;
  if (participant?.name) return participant.name;
  if (conversation?.participants && conversation.participants.length > 0) {
    const names = conversation.participants
      .filter((p) => !p.isCurrentUser)
      .map((p) => p.name);
    if (names.length <= 2) return names.join(' & ');
    return `${names[0]} and ${names.length - 1} others`;
  }
  return 'Conversation';
}

/**
 * Get subtitle for a conversation.
 */
function getConversationSubtitle(
  conversation?: Conversation,
  participant?: MessageParticipant,
  showOnlineStatus?: boolean
): string | undefined {
  if (participant) {
    if (showOnlineStatus && participant.isOnline) {
      return 'Online';
    }
    if (participant.lastSeen) {
      const lastSeen = new Date(participant.lastSeen);
      return `Last seen ${formatLastSeen(lastSeen)}`;
    }
    if (participant.phoneNumber) {
      return participant.phoneNumber;
    }
  }
  if (conversation?.type === 'group' && conversation.participants) {
    return `${conversation.participants.length} participants`;
  }
  return undefined;
}

/**
 * Format last seen time.
 */
function formatLastSeen(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Header component for a conversation/message thread.
 *
 * @example
 * ```tsx
 * <ConversationHeader
 *   conversation={conversation}
 *   showBackButton
 *   onBack={() => navigate('/conversations')}
 *   actions={<IconButton icon={<MoreIcon />} />}
 * />
 * ```
 */
const ConversationHeader = React.forwardRef<
  HTMLElement,
  ConversationHeaderProps
>(
  (
    {
      className,
      size,
      conversation,
      title,
      subtitle,
      avatarUrl,
      participant,
      showOnlineStatus = true,
      showBackButton = false,
      onBack,
      actions,
      leftContent,
      rightContent,
      ...props
    },
    ref
  ) => {
    const displayTitle =
      title || getConversationTitle(conversation, participant);
    const displaySubtitle =
      subtitle ||
      getConversationSubtitle(conversation, participant, showOnlineStatus);
    const displayAvatar =
      avatarUrl || conversation?.avatarUrl || participant?.avatarUrl;
    const isOnline = participant?.isOnline;

    return (
      <header
        ref={ref}
        className={cn(headerVariants({ size }), className)}
        {...props}
      >
        {/* Left content / Back button */}
        {leftContent ||
          (showBackButton && onBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                '-ml-2 rounded-full p-2',
                'text-neutral-500 hover:text-neutral-700',
                'dark:text-neutral-400 dark:hover:text-neutral-200',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'focus:ring-primary-500 focus:ring-2 focus:outline-none',
                'transition-colors'
              )}
              aria-label="Go back"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ))}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-primary-800 font-medium text-white'
            )}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayTitle}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              displayTitle.charAt(0).toUpperCase()
            )}
          </div>
          {/* Online indicator */}
          {showOnlineStatus && isOnline && (
            <span
              className={cn(
                'absolute right-0 bottom-0',
                'h-3 w-3 rounded-full',
                'bg-green-500 ring-2 ring-white dark:ring-neutral-900'
              )}
              aria-label="Online"
            />
          )}
        </div>

        {/* Title and subtitle */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p
              className={cn(
                'truncate text-sm',
                isOnline
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Right content / Actions */}
        {rightContent ||
          (actions && (
            <div className="flex shrink-0 items-center gap-1">{actions}</div>
          ))}
      </header>
    );
  }
);

ConversationHeader.displayName = 'ConversationHeader';

// ============================================================================
// Conversation List Item Component
// ============================================================================

export interface ConversationListItemProps extends Omit<
  React.HTMLAttributes<HTMLButtonElement>,
  'onSelect'
> {
  /** The conversation to display */
  conversation: Conversation;
  /** Whether this item is selected */
  isSelected?: boolean;
  /** Called when the item is clicked */
  onSelect?: (conversation: Conversation) => void;
}

/**
 * A list item for displaying a conversation in a list.
 */
const ConversationListItem = React.forwardRef<
  HTMLButtonElement,
  ConversationListItemProps
>(({ className, conversation, isSelected, onSelect, ...props }, ref) => {
  const participant = conversation.participants.find((p) => !p.isCurrentUser);
  const title = getConversationTitle(conversation, participant);
  const avatarUrl = conversation.avatarUrl || participant?.avatarUrl;
  const lastMessage = conversation.lastMessage;
  const isUnread = conversation.unreadCount > 0;

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect?.(conversation)}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3',
        'text-left transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        'focus:bg-neutral-50 focus:outline-none dark:focus:bg-neutral-800/50',
        className
      )}
      aria-current={isSelected ? 'true' : undefined}
      {...props}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            'bg-primary-800 font-medium text-white'
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            title.charAt(0).toUpperCase()
          )}
        </div>
        {participant?.isOnline && (
          <span
            className={cn(
              'absolute right-0 bottom-0',
              'h-3 w-3 rounded-full',
              'bg-green-500 ring-2 ring-white dark:ring-neutral-900'
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={cn(
              'truncate text-sm',
              isUnread
                ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                : 'font-medium text-neutral-700 dark:text-neutral-300'
            )}
          >
            {title}
          </h3>
          {lastMessage && (
            <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              isUnread
                ? 'text-neutral-700 dark:text-neutral-300'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {lastMessage?.content || 'No messages yet'}
          </p>
          {isUnread && (
            <span
              className={cn(
                'flex shrink-0 items-center justify-center',
                'h-5 min-w-[20px] rounded-full px-1.5',
                'bg-primary-600 text-xs font-medium text-white'
              )}
            >
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Pinned/Muted indicators */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        {conversation.isPinned && (
          <svg
            className="text-primary-500 h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16 4v8l2 2v2h-6v6l-1 1-1-1v-6H4v-2l2-2V4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z" />
          </svg>
        )}
        {conversation.isMuted && (
          <svg
            className="h-4 w-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        )}
      </div>
    </button>
  );
});

ConversationListItem.displayName = 'ConversationListItem';

// ============================================================================
// Conversation List Skeleton Component
// ============================================================================

export interface ConversationListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loading state for conversation list.
 */
function ConversationListSkeleton({
  count = 5,
  className,
}: ConversationListSkeletonProps) {
  return (
    <div
      className={cn(
        'divide-y divide-neutral-200 dark:divide-neutral-700',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          aria-hidden="true"
        >
          <div className="h-12 w-12 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

ConversationListSkeleton.displayName = 'ConversationListSkeleton';

export {
  ConversationHeader,
  ConversationListItem,
  ConversationListSkeleton,
  headerVariants,
  getConversationTitle,
  getConversationSubtitle,
  formatLastSeen,
};
