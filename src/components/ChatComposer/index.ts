export {
  ChatComposer,
  type ChatComposerProps,
  type ChatComposerHandle,
  type ChatComposerError,
  type ChatComposerMenuItem,
  type ChatComposerSendOption,
  type ChatComposerSendMeta,
  type ChatComposerAgentOption,
  type ChatComposerUploadLabels,
} from './ChatComposer';
export {
  UploadAnnouncer,
  type UploadAnnouncerLabels,
  type UploadAnnouncerProps,
} from './UploadAnnouncer';
export {
  useAttachmentUploads,
  hasBusyUpload,
  type AttachmentUpload,
  type AttachmentUploadState,
  type AttachmentUploadContext,
  type AttachmentUploads,
  type UploadAttachment,
  type DiscardAttachment,
  type UploadedAttachment,
  type UseAttachmentUploadsOptions,
} from './useAttachmentUploads';
// Mention candidates live in the shared Messaging mention module;
// re-exported here so ChatComposer hosts don't need to know where the type
// lives.
export type { MentionOption } from '../Messaging/useMentionAutocomplete';
