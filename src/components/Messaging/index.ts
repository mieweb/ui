// Types
export * from './types';

// Core Components
export {
  MessageBubble,
  MessageStatusIcon,
  ReadReceiptIndicator,
  AttachmentPreview,
  bubbleVariants,
  formatFileSize,
  type MessageBubbleProps,
  type MessageStatusIconProps,
  type ReadReceiptIndicatorProps,
  type AttachmentPreviewProps,
} from './MessageBubble';

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
  type MessageListProps,
  type SkeletonMessageProps,
  type TypingIndicatorProps,
  type DateSeparatorProps,
  type EmptyStateProps,
  type LoadMoreButtonProps,
} from './MessageList';

// `MessageComposer` retired in 0.10.0 — superseded by ChatComposer
// (see MIGRATION.md#chat-composer). The shared mention module stays.
export { type MentionOption } from './useMentionAutocomplete';

export {
  AttachmentPicker,
  AttachmentPreviewItem,
  DragDropZone,
  CameraButton,
  getFileType,
  validateFile,
  generateAttachmentId,
  type AttachmentPickerProps,
  type AttachmentPreviewItemProps,
  type DragDropZoneProps,
  type CameraButtonProps,
} from './AttachmentPicker';

export {
  ConversationHeader,
  ConversationListItem,
  ConversationListSkeleton,
  headerVariants,
  getConversationTitle,
  getConversationSubtitle,
  formatLastSeen,
  type ConversationHeaderProps,
  type ConversationListItemProps,
  type ConversationListSkeletonProps,
} from './ConversationHeader';

export {
  MessageThread,
  LightboxModal,
  MessagingSplitView,
  type MessageThreadProps,
  type LightboxModalProps,
  type MessagingSplitViewProps,
} from './MessageThread';

// Hooks
export {
  useMessages,
  useTypingIndicator,
  useMessageScroll,
  useReadReceipts,
  useTypingEmulation,
  type UseMessagesOptions,
  type UseMessagesReturn,
  type UseTypingIndicatorOptions,
  type UseTypingIndicatorReturn,
  type UseMessageScrollOptions,
  type UseMessageScrollReturn,
  type UseReadReceiptsOptions,
  type UseTypingEmulationOptions,
  type UseTypingEmulationReturn,
} from './hooks';
