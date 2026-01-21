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

export {
  MessageComposer,
  CharacterCounter,
  SendButton,
  sendButtonVariants,
  type MessageComposerProps,
  type CharacterCounterProps,
  type SendButtonProps,
} from './MessageComposer';

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
  type UseMessagesOptions,
  type UseMessagesReturn,
  type UseTypingIndicatorOptions,
  type UseTypingIndicatorReturn,
  type UseMessageScrollOptions,
  type UseMessageScrollReturn,
  type UseReadReceiptsOptions,
} from './hooks';
