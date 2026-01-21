import * as React from 'react';
import { cn } from '../../utils/cn';
import type {
  Message,
  MessageParticipant,
  MessageAttachment,
  TypingState,
  Conversation,
  NewMessage,
  MessagingEventHandlers,
} from './types';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { ConversationHeader } from './ConversationHeader';
import { DragDropZone } from './AttachmentPicker';

// ============================================================================
// Lightbox Modal Component
// ============================================================================

export interface LightboxModalProps {
  /** The attachment to display */
  attachment: MessageAttachment | null;
  /** Called when the modal is closed */
  onClose: () => void;
}

/**
 * Full-screen lightbox for viewing media attachments.
 */
function LightboxModal({ attachment, onClose }: LightboxModalProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (attachment) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [attachment, onClose]);

  if (!attachment) return null;

  const isImage = attachment.type === 'image';
  const isVideo = attachment.type === 'video';

  return (
    <div
      className={cn('fixed inset-0 z-50', 'flex items-center justify-center')}
      role="dialog"
      aria-modal="true"
      aria-label={`View ${attachment.filename}`}
    >
      {/* Backdrop - clickable to close */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/90"
        onClick={onClose}
        aria-label="Close lightbox"
      />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'absolute top-4 right-4 z-10',
          'rounded-full p-2',
          'bg-white/10 text-white',
          'hover:bg-white/20',
          'focus:ring-2 focus:ring-white focus:outline-none',
          'transition-colors'
        )}
        aria-label="Close"
      >
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Media content */}
      <div className="relative z-10 max-h-[90vh] max-w-[90vw]">
        {isImage && (
          <img
            src={attachment.url}
            alt={attachment.alt || attachment.filename}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        )}
        {isVideo && (
          <video
            src={attachment.url}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw]"
          >
            <track kind="captions" />
          </video>
        )}
      </div>

      {/* Filename */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <p className="rounded-full bg-black/50 px-4 py-2 text-sm text-white">
          {attachment.filename}
        </p>
      </div>
    </div>
  );
}

LightboxModal.displayName = 'LightboxModal';

// ============================================================================
// Message Thread Component
// ============================================================================

export interface MessageThreadProps {
  /** The conversation being displayed */
  conversation?: Conversation;
  /** Array of messages in the thread */
  messages: Message[];
  /** Current user for determining message direction */
  currentUser: MessageParticipant;
  /** Typing indicator state */
  typingState?: TypingState;
  /** Whether messages are loading */
  isLoading?: boolean;
  /** Whether more messages are available */
  hasMore?: boolean;
  /** Whether more messages are being loaded */
  isLoadingMore?: boolean;
  /** Whether a message is being sent */
  isSending?: boolean;
  /** Event handlers */
  eventHandlers?: MessagingEventHandlers;
  /** Show header */
  showHeader?: boolean;
  /** Show back button in header */
  showBackButton?: boolean;
  /** Called when back is clicked */
  onBack?: () => void;
  /** Custom header actions */
  headerActions?: React.ReactNode;
  /** Composer placeholder */
  placeholder?: string;
  /** Maximum message length */
  maxMessageLength?: number;
  /** Show character count */
  showCharacterCount?: boolean;
  /** Show attachment picker */
  showAttachmentPicker?: boolean;
  /** Show camera button */
  showCameraButton?: boolean;
  /** Accepted file types */
  acceptedFileTypes?: string[];
  /** Maximum file size */
  maxFileSize?: number;
  /** Maximum attachments */
  maxAttachments?: number;
  /** Show avatars in message list */
  showAvatars?: boolean;
  /** Show sender names (group chats) */
  showSenderNames?: boolean;
  /** Group messages by date */
  groupByDate?: boolean;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Custom timestamp formatter */
  formatTimestamp?: (timestamp: Date | string) => string;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Additional class name */
  className?: string;
}

/**
 * A complete message thread component combining header, message list, and composer.
 *
 * @example
 * ```tsx
 * <MessageThread
 *   conversation={conversation}
 *   messages={messages}
 *   currentUser={currentUser}
 *   typingState={typingState}
 *   eventHandlers={{
 *     onSendMessage: handleSend,
 *     onLoadMore: handleLoadMore,
 *     onRetryMessage: handleRetry,
 *   }}
 *   showHeader
 *   showBackButton
 *   onBack={() => navigate('/conversations')}
 * />
 * ```
 */
const MessageThread = React.forwardRef<HTMLDivElement, MessageThreadProps>(
  (
    {
      conversation,
      messages,
      currentUser,
      typingState,
      isLoading = false,
      hasMore = false,
      isLoadingMore = false,
      isSending = false,
      eventHandlers = {},
      showHeader = true,
      showBackButton = false,
      onBack,
      headerActions,
      placeholder = 'Type a message...',
      maxMessageLength = 1600,
      showCharacterCount = false,
      showAttachmentPicker = true,
      showCameraButton = false,
      acceptedFileTypes,
      maxFileSize,
      maxAttachments,
      showAvatars = true,
      showSenderNames = false,
      groupByDate = true,
      emptyState,
      formatTimestamp,
      onError,
      className,
    },
    ref
  ) => {
    const [lightboxAttachment, setLightboxAttachment] =
      React.useState<MessageAttachment | null>(null);
    const [replyTo, setReplyTo] = React.useState<{
      id: string;
      content: string;
      senderName: string;
    } | null>(null);

    // Get participant for direct messages
    const participant =
      conversation?.type === 'direct'
        ? conversation.participants.find((p) => p.id !== currentUser.id)
        : undefined;

    // Handle attachment click
    const handleAttachmentClick = (
      attachment: MessageAttachment,
      message: Message
    ) => {
      if (attachment.type === 'image' || attachment.type === 'video') {
        setLightboxAttachment(attachment);
      }
      eventHandlers.onAttachmentClick?.(attachment, message);
    };

    // Handle send message
    const handleSendMessage = async (newMessage: NewMessage) => {
      const messageWithReply: NewMessage = {
        ...newMessage,
        replyToId: replyTo?.id || newMessage.replyToId,
      };
      setReplyTo(null);
      await eventHandlers.onSendMessage?.(messageWithReply);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full flex-col',
          'bg-white dark:bg-neutral-900',
          className
        )}
      >
        {/* Header */}
        {showHeader && (
          <ConversationHeader
            conversation={conversation}
            participant={participant}
            showBackButton={showBackButton}
            onBack={onBack}
            actions={headerActions}
          />
        )}

        {/* Message list */}
        <DragDropZone
          onFilesDropped={() => {
            // Could trigger composer with attachments
            onError?.('Drop files on the composer to attach them');
          }}
          disabled={!showAttachmentPicker}
          className="flex-1 overflow-hidden"
        >
          <MessageList
            messages={messages}
            currentUser={currentUser}
            isLoading={isLoading}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            typingState={typingState}
            showAvatars={showAvatars}
            showSenderNames={showSenderNames}
            groupByDate={groupByDate}
            onLoadMore={eventHandlers.onLoadMore}
            onRetryMessage={eventHandlers.onRetryMessage}
            onAttachmentClick={handleAttachmentClick}
            emptyState={emptyState}
            formatTimestamp={formatTimestamp}
            className="h-full"
          />
        </DragDropZone>

        {/* Composer */}
        <MessageComposer
          onSend={handleSendMessage}
          onTypingStart={eventHandlers.onTypingStart}
          onTypingStop={eventHandlers.onTypingStop}
          placeholder={placeholder}
          maxLength={maxMessageLength}
          showCharacterCount={showCharacterCount}
          isSending={isSending}
          showAttachmentPicker={showAttachmentPicker}
          showCameraButton={showCameraButton}
          acceptedFileTypes={acceptedFileTypes}
          maxFileSize={maxFileSize}
          maxAttachments={maxAttachments}
          onError={onError}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />

        {/* Lightbox */}
        <LightboxModal
          attachment={lightboxAttachment}
          onClose={() => setLightboxAttachment(null)}
        />
      </div>
    );
  }
);

MessageThread.displayName = 'MessageThread';

// ============================================================================
// Split View Container Component
// ============================================================================

export interface MessagingSplitViewProps {
  /** Conversation list content */
  conversationList: React.ReactNode;
  /** Message thread content */
  messageThread: React.ReactNode;
  /** Whether a conversation is selected */
  hasSelectedConversation?: boolean;
  /** Width of the conversation list on desktop */
  listWidth?: string | number;
  /** Breakpoint for mobile view */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

/**
 * Split view container for desktop with responsive mobile behavior.
 *
 * @example
 * ```tsx
 * <MessagingSplitView
 *   conversationList={<ConversationList />}
 *   messageThread={<MessageThread />}
 *   hasSelectedConversation={!!selectedConversation}
 * />
 * ```
 */
function MessagingSplitView({
  conversationList,
  messageThread,
  hasSelectedConversation = false,
  listWidth = 320,
  mobileBreakpoint = 'md',
  className,
}: MessagingSplitViewProps) {
  const breakpointClasses = {
    sm: 'sm:flex',
    md: 'md:flex',
    lg: 'lg:flex',
  };

  const hideMobileClasses = {
    sm: hasSelectedConversation ? 'hidden sm:block' : 'block sm:block',
    md: hasSelectedConversation ? 'hidden md:block' : 'block md:block',
    lg: hasSelectedConversation ? 'hidden lg:block' : 'block lg:block',
  };

  const showMobileClasses = {
    sm: hasSelectedConversation ? 'block sm:block' : 'hidden sm:block',
    md: hasSelectedConversation ? 'block md:block' : 'hidden md:block',
    lg: hasSelectedConversation ? 'block lg:block' : 'hidden lg:block',
  };

  return (
    <div
      className={cn(
        'h-full w-full',
        breakpointClasses[mobileBreakpoint],
        className
      )}
    >
      {/* Conversation list */}
      <div
        className={cn(
          'h-full w-full flex-shrink-0',
          'border-r border-neutral-200 dark:border-neutral-700',
          hideMobileClasses[mobileBreakpoint]
        )}
        style={{
          width: typeof listWidth === 'number' ? `${listWidth}px` : listWidth,
        }}
      >
        {conversationList}
      </div>

      {/* Message thread */}
      <div
        className={cn(
          'h-full min-w-0 flex-1',
          showMobileClasses[mobileBreakpoint]
        )}
      >
        {messageThread}
      </div>
    </div>
  );
}

MessagingSplitView.displayName = 'MessagingSplitView';

export { MessageThread, LightboxModal, MessagingSplitView };
