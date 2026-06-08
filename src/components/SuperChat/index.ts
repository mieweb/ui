/**
 * SuperChat — multi-participant chat for `@mieweb/ui`.
 *
 * The base entry ships the {@link SuperChat} shell + Markdown core
 * ({@link createMarkdownRenderer}). Rich render plugins (code / math / genui /
 * NITRO / mermaid) are opt-in via the subpath:
 * `@mieweb/ui/components/SuperChat/plugins`.
 */

export { SuperChat, type SuperChatProps } from './SuperChat';

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
