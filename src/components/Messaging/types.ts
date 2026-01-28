/**
 * Messaging Component Types
 *
 * Core type definitions for the messaging system, designed to be
 * backend-agnostic and extensible for various use cases including
 * SMS, MMS, and enterprise messaging.
 */

// ============================================================================
// Message Status Types
// ============================================================================

/**
 * Message delivery and read status.
 */
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * Visual indicators for message status (checkmarks style).
 */
export interface MessageStatusIndicator {
  status: MessageStatus;
  /** Timestamp when status was achieved */
  timestamp?: Date | string;
}

// ============================================================================
// Attachment Types
// ============================================================================

/**
 * Supported attachment/media types.
 */
export type AttachmentType = 'image' | 'video' | 'audio' | 'document' | 'file';

/**
 * Attachment loading/upload state.
 */
export type AttachmentState =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'downloading';

/**
 * Attachment/media associated with a message.
 */
export interface MessageAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** Type of attachment */
  type: AttachmentType;
  /** URL to the attachment (can be blob URL for pending uploads) */
  url: string;
  /** Thumbnail URL for images/videos */
  thumbnailUrl?: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Image/video dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Duration in seconds for audio/video */
  duration?: number;
  /** Upload/download progress (0-100) */
  progress?: number;
  /** Current state of the attachment */
  state: AttachmentState;
  /** Alt text for accessibility */
  alt?: string;
}

// ============================================================================
// User/Participant Types
// ============================================================================

/**
 * A participant in a conversation.
 */
export interface MessageParticipant {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Avatar image URL */
  avatarUrl?: string;
  /** Phone number (for SMS/MMS) */
  phoneNumber?: string;
  /** Email address */
  email?: string;
  /** Whether this participant is the current user */
  isCurrentUser?: boolean;
  /** Whether this participant is online */
  isOnline?: boolean;
  /** Last seen timestamp */
  lastSeen?: Date | string;
}

// ============================================================================
// Read Receipt Types
// ============================================================================

/**
 * Read receipt for a message.
 */
export interface ReadReceipt {
  /** Participant who read the message */
  participant: MessageParticipant;
  /** Timestamp when the message was read */
  readAt: Date | string;
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Type of message content.
 */
export type MessageType = 'text' | 'media' | 'system' | 'typing';

/**
 * System message types for special notifications.
 */
export type SystemMessageType =
  | 'user-joined'
  | 'user-left'
  | 'conversation-created'
  | 'name-changed'
  | 'info'
  | 'warning'
  | 'error';

/**
 * Core message interface.
 */
export interface Message {
  /** Unique identifier */
  id: string;
  /** Message type */
  type: MessageType;
  /** Text content */
  content: string;
  /** Message sender */
  sender: MessageParticipant;
  /** Timestamp when message was created */
  timestamp: Date | string;
  /** Current delivery/read status */
  status: MessageStatus;
  /** Attachments/media */
  attachments?: MessageAttachment[];
  /** Read receipts (for group conversations) */
  readReceipts?: ReadReceipt[];
  /** For system messages, the specific type */
  systemMessageType?: SystemMessageType;
  /** Reply-to message reference */
  replyTo?: {
    id: string;
    content: string;
    sender: MessageParticipant;
  };
  /** Reactions to the message */
  reactions?: MessageReaction[];
  /** Whether the message has been edited */
  isEdited?: boolean;
  /** Edit timestamp */
  editedAt?: Date | string;
  /** Whether the message is deleted (soft delete) */
  isDeleted?: boolean;
  /** Custom metadata for extensibility */
  metadata?: Record<string, unknown>;
}

/**
 * Message reaction.
 */
export interface MessageReaction {
  /** Emoji or reaction type */
  emoji: string;
  /** Participants who reacted */
  participants: MessageParticipant[];
  /** Count of reactions */
  count: number;
}

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Type of conversation.
 */
export type ConversationType = 'direct' | 'group' | 'channel' | 'broadcast';

/**
 * Conversation/thread interface.
 */
export interface Conversation {
  /** Unique identifier */
  id: string;
  /** Conversation type */
  type: ConversationType;
  /** Conversation name (for groups/channels) */
  name?: string;
  /** Participants */
  participants: MessageParticipant[];
  /** Last message preview */
  lastMessage?: Message;
  /** Unread message count */
  unreadCount: number;
  /** Whether the conversation is muted */
  isMuted?: boolean;
  /** Whether the conversation is pinned */
  isPinned?: boolean;
  /** Whether the conversation is archived */
  isArchived?: boolean;
  /** Avatar/image URL for the conversation */
  avatarUrl?: string;
  /** Timestamp of last activity */
  lastActivityAt: Date | string;
  /** Created timestamp */
  createdAt: Date | string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Event/Callback Types
// ============================================================================

/**
 * New message to be sent (before ID is assigned).
 */
export interface NewMessage {
  /** Text content */
  content: string;
  /** Attachments to include */
  attachments?: File[];
  /** Reply-to message ID */
  replyToId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Message action type for context menus.
 */
export type MessageAction =
  | 'copy'
  | 'reply'
  | 'forward'
  | 'edit'
  | 'delete'
  | 'react'
  | 'resend'
  | 'report';

/**
 * Event handlers for messaging components.
 */
export interface MessagingEventHandlers {
  /** Called when a message is sent */
  onSendMessage?: (message: NewMessage) => void | Promise<void>;
  /** Called when a failed message should be retried */
  onRetryMessage?: (messageId: string) => void | Promise<void>;
  /** Called when an attachment is added */
  onAttachmentAdded?: (files: File[]) => void;
  /** Called when an attachment is removed */
  onAttachmentRemoved?: (attachmentId: string) => void;
  /** Called when a read receipt is triggered */
  onReadReceipt?: (messageId: string) => void;
  /** Called when the user starts typing */
  onTypingStart?: () => void;
  /** Called when the user stops typing */
  onTypingStop?: () => void;
  /** Called when a message action is triggered */
  onMessageAction?: (action: MessageAction, message: Message) => void;
  /** Called when scrolling to load more history */
  onLoadMore?: () => void | Promise<void>;
  /** Called when an attachment is clicked */
  onAttachmentClick?: (attachment: MessageAttachment, message: Message) => void;
  /** Called when a participant is clicked */
  onParticipantClick?: (participant: MessageParticipant) => void;
  /** Called when a reaction is toggled */
  onReactionToggle?: (messageId: string, emoji: string) => void;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Loading states for the messaging interface.
 */
export interface MessagingLoadingState {
  /** Initial loading of messages */
  isLoadingMessages: boolean;
  /** Loading more history */
  isLoadingMore: boolean;
  /** Sending a message */
  isSending: boolean;
  /** Uploading attachments */
  isUploadingAttachments: boolean;
}

/**
 * Typing indicator state.
 */
export interface TypingState {
  /** Participants currently typing */
  participants: MessageParticipant[];
  /** Timestamp of last typing activity */
  lastUpdated?: Date | string;
}

/**
 * Date grouping for message lists.
 */
export interface MessageGroup {
  /** Date label (e.g., "Today", "Yesterday", "January 21, 2026") */
  label: string;
  /** Date key for grouping */
  date: string;
  /** Messages in this group */
  messages: Message[];
}
