/**
 * SuperChat — multi-participant chat for `@mieweb/ui`.
 *
 * Three composable surfaces share one import path:
 * - {@link SuperChat} — a single-conversation message panel.
 * - {@link SuperChatConversations} — the conversation list (sidebar).
 * - {@link SuperChatInbox} — the combined list + panel (drop-in for the
 *   original monolithic component).
 *
 * The base entry ships the Markdown core ({@link createMarkdownRenderer}). Rich
 * render plugins (code / math / genui / NITRO / mermaid) are opt-in via the
 * subpath: `@mieweb/ui/components/SuperChat/plugins`.
 */

export { SuperChat, type SuperChatProps } from './SuperChat';

export {
  SuperChatConversations,
  type SuperChatConversationsProps,
} from './SuperChatConversations';

export { SuperChatInbox, type SuperChatInboxProps } from './SuperChatInbox';

export {
  createMarkdownRenderer,
  type CreateMarkdownRendererOptions,
} from './render/createMarkdownRenderer';

export {
  TextRenderContext,
  useTextRenderContext,
  type SuperChatTextContext,
} from './render/renderContext';

export type {
  // participant model
  Participant,
  ParticipantKind,
  ParticipantStatus,
  // conversation / thread
  SuperChatConversation,
  SuperChatMessage,
  SuperChatItemType,
  SuperChatChannel,
  SuperChatRef,
  SuperChatLinkBuilder,
  ComposerAttachment,
  // render pipeline
  SuperChatRenderPlugin,
  SuperChatPluggable,
  SuperChatPluggableList,
  AIRenderTextContent,
  AITextRenderContext,
  // genui
  GenUIRegistry,
  GenUIWidgetEntry,
  GenUIWidgetProps,
  GenUIPrefetchPolicy,
  GenUIBlockPayload,
  StandardSchemaV1,
  // re-exports
  AIMessageContent,
  AIMessageStatus,
  MCPResourceLink,
} from './types';
