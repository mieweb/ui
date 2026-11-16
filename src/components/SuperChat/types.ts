/**
 * SuperChat Types
 *
 * A multi-participant chat model that generalizes the AI module's
 * `user`/`assistant` roles and the standalone `chat-component`'s
 * `external`/`internal`/`system` roles into a single **participant** concept,
 * plus the pluggable Markdown render pipeline contracts.
 *
 * See `MAINTAINERS.md` (Mission → Decisions 2 & 3) for the design rationale.
 */

import type * as React from 'react';
import type { MediaFeedMedia, MediaFeedProps } from '../MediaFeed';
import type {
  AIMessageContent,
  AIMessageStatus,
  AIRenderTextContent,
  AITextRenderContext,
  MCPResourceLink,
  MCPToolCall,
} from '../AI/types';
import type {
  MCPToolCallGroupLabelOverrides,
  MCPToolCallGroupOptions,
} from '../AI/MCPToolCallGroup';

export type { AIRenderTextContent, AITextRenderContext };

// ============================================================================
// Participant model (Decision 2)
// ============================================================================

/** What kind of actor a participant is. */
export type ParticipantKind = 'human' | 'agent' | 'system';

/** Presence/activity status for a participant. */
export type ParticipantStatus = 'online' | 'offline' | 'busy' | 'typing';

/**
 * A single actor in a conversation. Any mix of multiple agents and multiple
 * humans can participate in one conversation.
 */
export interface Participant {
  /** Stable unique id, referenced by `SuperChatMessage.participantId`. */
  id: string;
  /** Whether this is a human, an AI agent, or the system. */
  kind: ParticipantKind;
  /** Display name. */
  name: string;
  /** Optional avatar image URL. */
  avatar?: string;
  /**
   * Optional accent color (any CSS color) used as a visual cue so concurrent /
   * interleaved replies from multiple agents stay legible.
   */
  color?: string;
  /** Optional sub-label, e.g. "Triage agent" or "Front desk". */
  role?: string;
  /** Optional presence indicator. */
  status?: ParticipantStatus;
}

// ============================================================================
// Conversation / thread model (chat-component-compatible shape)
// ============================================================================

/** Channel a message arrived/was sent on (healthcare-messaging compatible). */
export type SuperChatChannel =
  | 'portal'
  | 'sms'
  | 'voicemail'
  | 'auto'
  | (string & {});

/**
 * Format used when a message's copy action is triggered without picking an
 * explicit variant (Ctrl/Cmd-click on the footer copy button).
 * - `'rich'` (default): writes rich text (`text/html`) *and* Markdown
 *   (`text/plain`) in one clipboard write — the paste target decides.
 * - `'markdown'`: writes the Markdown source as plain text.
 * - `'plain'`: writes the rendered plain text.
 *
 * All formats stay reachable per message via the copy menus.
 */
export type SuperChatCopyFormat = 'rich' | 'markdown' | 'plain';

/** Reference attachment carried by a `ref` thread item. */
export interface SuperChatRef {
  /** Kind of referenced entity. */
  refType: 'doc' | 'rx' | 'appt' | (string & {});
  /** Id of the referenced entity. */
  refId: string;
  /** Display title for the reference. */
  title: string;
}

/** Kind of thread item. */
export type SuperChatItemType = 'message' | 'ref' | 'system';

/** Persisted media belonging to a message; ids are unique within that message. */
export interface SuperChatMediaAttachment extends MediaFeedMedia {
  /** Stable attachment id assigned by the host when the media is persisted. */
  id: string;
  /** Optional display title, independent of the source filename. */
  title?: string;
  /** Optional plain-text caption; defaults to the source message text. */
  caption?: string;
}

/** A conversation media item retains the original message and author identity. */
export interface SuperChatMediaItem {
  /** Collision-safe identity derived from conversation, message and attachment ids. */
  id: string;
  conversationId: string;
  message: SuperChatMessage;
  attachment: SuperChatMediaAttachment;
  participant?: Participant;
}

export type SuperChatView = 'thread' | 'media';

/** Feed behavior and extension slots; conversation data/accessors are fixed. */
export type SuperChatMediaFeedProps = Omit<
  MediaFeedProps<SuperChatMediaItem>,
  'items' | 'getId' | 'getMedia' | 'getTitle' | 'getCaption' | 'getAuthor'
>;

/** Labels introduced by the conversation's media view. */
export interface SuperChatMediaLabels {
  backToConversation: string;
  openMedia: string;
  playMedia: string;
  unknownAuthor: string;
}

/** Labels for per-message states in the thread. */
export interface SuperChatMessageLabels {
  /** Prefix of a scheduled message's indicator, before its time. */
  scheduled: string;
}

/**
 * Every user-visible string in `SuperChatInbox`, `SuperChatConversations` and
 * `SuperChat` (text, accessible names, titles, placeholders, screen-reader
 * text). Pass a `Partial` as `labels`; unset keys fall back to a
 * `MessagesProvider` translation of the English default, then to English.
 *
 * The narrower props that predate it win over it for the keys they share:
 * `listTitle`, `search.{label,placeholder,noResultsLabel}`,
 * `sidebarResizeLabel`, `mediaLabels`, `messageLabels`, `placeholder`,
 * `agentSelectorLabel`, `stopLabel` and `composerProps`.
 */
export interface SuperChatLabels {
  // --- Inbox ---
  /** Accessible name of the inbox with a conversation open. @default (title) => `Chat: ${title}` */
  inboxLabel: (title: string) => string;
  /** Accessible name of the inbox with no conversation open. @default 'Chat' */
  emptyInboxLabel: string;
  /** Empty panel text. @default 'No conversation selected' */
  noConversationSelected: string;
  /** Accessible name of the list/panel divider. @default 'Resize conversation list' */
  sidebarResize: string;

  // --- Conversation list ---
  /** The list's accessible name and default heading. @default 'Conversations' */
  conversations: string;
  /** "+" button's accessible name. @default 'New conversation' */
  newConversation: string;
  /** Screen-reader text of an unread badge. @default (count) => `${count} unread messages` */
  unreadCount: (count: number) => string;
  /** Search box accessible name. @default 'Search conversations' */
  searchConversations: string;
  /** Search box placeholder. @default 'Search…' */
  searchPlaceholder: string;
  /** Status when the search matches nothing. @default 'No matching conversations' */
  noMatchingConversations: string;

  // --- Panel header and thread ---
  /** Small-screen Back button. @default 'Back to conversations' */
  backToConversations: string;
  /** Participant avatars group. @default 'Participants' */
  participants: string;
  /** Close button. @default 'Close conversation' */
  closeConversation: string;
  /** The message thread (`role="log"`). @default 'Messages' */
  messages: string;
  /** Jump-to-bottom button. @default 'Scroll to bottom' */
  scrollToBottom: string;
  /** Jump-to-bottom text when unseen messages arrived. @default 'New messages' */
  newMessages: string;
  /** Jump-to-bottom accessible name when unseen messages arrived. @default 'New messages — scroll to bottom' */
  newMessagesScrollToBottom: string;

  // --- Media ---
  /** Media view's return button. @default 'Back to conversation' */
  backToConversation: string;
  /** Open an image in the media view. @default 'Open in media feed' */
  openMedia: string;
  /** Play a video/audio attachment. @default 'Play' */
  playMedia: string;

  // --- Composer ---
  /** Message box accessible name. @default 'Message' */
  messageInput: string;
  /** Message box placeholder. @default 'Type a message… use @ to address an agent' */
  composerPlaceholder: string;
  /** Placeholder while `readOnly`. @default 'Read-only conversation' */
  readOnlyPlaceholder: string;
  /** "+" menu. @default 'Add to message' */
  addToMessage: string;
  /** Attach item in the "+" menu. @default 'Attach files' */
  attachFiles: string;
  /** Send button. @default 'Send message' */
  sendMessage: string;
  /** Send button while sending. @default 'Sending message…' */
  sendingMessage: string;
  /** Reported when a send fails. @default 'Failed to send message' */
  sendFailed: string;
  /** Send-options menu. @default 'More send options' */
  moreSendOptions: string;
  /** Stop button while streaming. @default 'Stop generating' */
  stopGenerating: string;
  /** Agent selector. @default 'Select agent' */
  selectAgent: string;
  /** `@mention` suggestion list. @default 'Mention' */
  mentionList: string;
  /** Drag-and-drop overlay. @default 'Drop files here' */
  dropFiles: string;

  // --- Messages ---
  /**
   * A message's accessible name.
   * @default (author, time, scheduled) => [author, time, scheduled].filter(Boolean).join(', ')
   */
  messageLabel: (author: string, time: string, scheduled?: string) => string;
  /** Author of a message whose participant is unknown. @default 'Unknown' */
  unknownAuthor: string;
  /** Prefix of a scheduled message's indicator, before its time. @default 'Scheduled' */
  scheduled: string;
  /** Edited indicator. @default '(edited)' */
  edited: string;
  /** Edited indicator's tooltip. @default (time) => `Edited ${time}` */
  editedAt: (time: string) => string;
  /** Overflow (⋯) menu. @default 'Message actions' */
  messageActions: string;
  /** Copy action. @default 'Copy message' */
  copyMessage: string;
  /** Copy button tooltip. @default 'Copy message (⌘/Ctrl-click: default format)' */
  copyMessageTitle: string;
  /** Copy-format submenu. @default 'Copy as' */
  copyAs: string;
  /** @default 'Copy as rich text' */
  copyAsRichText: string;
  /** Secondary line under "Copy as rich text". @default 'Rich text + Markdown' */
  copyAsRichTextDescription: string;
  /** @default 'Copy as Markdown' */
  copyAsMarkdown: string;
  /** @default 'Copy as plain text' */
  copyAsPlainText: string;
  /** Edit action and the inline editor's accessible name. @default 'Edit message' */
  editMessage: string;
  /** Inline editor save. @default 'Save' */
  save: string;
  /** Inline editor cancel. @default 'Cancel' */
  cancel: string;
  /** Reasoning pill while the model thinks. @default 'Thinking' */
  thinking: string;
  /** Reasoning pill once done. @default 'Thought' */
  thought: string;
  /** Reasoning pill once done, with its duration. @default (seconds) => `Thought for ${seconds}s` */
  thoughtFor: (seconds: number) => string;
}

/**
 * A single thread item. Preserves the `chat-component` thread-item shape
 * (`senderId`/`sender_name`/`channel`/`time`/`text`) while adding a
 * `participantId` (Decision 2) and optional rich `content` blocks reused from
 * the AI module.
 */
export interface SuperChatMessage {
  /** Unique identifier. */
  id: string;
  /** Item type. Defaults to `'message'`. */
  type?: SuperChatItemType;
  /** Participant who authored the item. */
  participantId: string;
  /** Plain-text body (rendered through the Markdown pipeline). */
  text?: string;
  /**
   * Optional rich content blocks (text / tool_use / tool_result / thinking /
   * code), reused from the AI module for tool-call visualization etc.
   */
  content?: AIMessageContent[];
  /** Explicit persisted image/video/audio/YouTube attachments for thread and feed views. */
  media?: SuperChatMediaAttachment[];
  /** Timestamp; the thread is append-only and ordered by `time`. */
  time: Date | string;
  /**
   * Timestamp of the most recent edit, if the message has been edited. When
   * set, surfaces an "(edited)" indicator next to the message time.
   */
  editedAt?: Date | string;
  /** Delivery/generation status. */
  status?: AIMessageStatus;
  /**
   * When the message is scheduled to be delivered. While set, the bubble is
   * drawn as pending (dashed outline) with a "Scheduled · {time}" indicator.
   * The host owns delivery: clear it once the message has gone out.
   */
  scheduledFor?: Date | string;
  /** Channel the item belongs to. */
  channel?: SuperChatChannel;
  /** Reference payload when `type === 'ref'`. */
  ref?: SuperChatRef;
  /** Participant ids addressed via `@`-mention. */
  mentions?: string[];
  /** Custom metadata. */
  metadata?: Record<string, unknown>;

  // --- chat-component legacy aliases (optional, for migration) ---
  /** @deprecated use `participantId`. */
  senderId?: string;
  /** @deprecated derive from the participant. */
  sender_name?: string;
}

/**
 * A file (typically an image) the local user pasted or attached in the
 * composer, surfaced to the host via the send callback so it can be embedded,
 * uploaded, or otherwise added to the conversation.
 */
export interface ComposerAttachment {
  /** Stable id for the attachment (unique within a single draft). */
  id: string;
  /** File name, derived from the pasted file or a generated fallback. */
  name: string;
  /** MIME type, e.g. `image/png`. */
  type: string;
  /** Base64 `data:` URL of the file contents. */
  dataUrl: string;
}

/**
 * Categories of files the composer can accept. Developers pick which kinds are
 * allowed via `acceptedFileTypes`; each maps to an `<input accept>` token and a
 * MIME matcher used to filter pastes and file-picker selections.
 * - `image` → `image/*`
 * - `video` → `video/*`
 * - `audio` → `audio/*`
 * - `pdf` → `application/pdf`
 */
export type AttachmentKind = 'image' | 'video' | 'audio' | 'pdf';

/** A conversation: participants + an ordered thread. */
export interface SuperChatConversation {
  /** Unique identifier. */
  id: string;
  /** Display title. */
  title: string;
  /** Optional external reference id (e.g. patient/chart id). */
  reference_id?: string;
  /** Whether the conversation is currently open. */
  open?: boolean;
  /** Unread message count. */
  unread?: number;
  /** Timestamp of the last activity (used for sidebar ordering). */
  lastActivity?: Date | string;
  /** Everyone taking part in this conversation. */
  participants: Participant[];
  /** Ordered thread items. */
  thread: SuperChatMessage[];
}

/** Builds an href for a reference item (e.g. doc/rx/appt deep link). */
export type SuperChatLinkBuilder = (ref: SuperChatRef) => string | undefined;

/** What {@link SuperChatRenderMessageFooter} knows about the message it renders under. */
export interface SuperChatMessageFooterContext {
  /** The conversation the message belongs to (latest host state). */
  conversation: SuperChatConversation;
  /** The message's author, if they are in `conversation.participants`. */
  participant?: Participant;
  /** Whether the local user (`currentParticipantId`) wrote the message. */
  isSelf: boolean;
  /** Whether the message is still streaming (`status === 'streaming'`). */
  streaming: boolean;
}

/**
 * Render-prop for host controls under a message bubble — SuperChat's
 * counterpart of the AI module's `AIRenderMessageFooter`, with the
 * multi-participant context as a second argument. Return `null`/`false` to
 * render nothing for a message.
 */
export type SuperChatRenderMessageFooter = (
  message: SuperChatMessage,
  context: SuperChatMessageFooterContext
) => React.ReactNode;

// ============================================================================
// Render pipeline (Decision 3)
// ============================================================================

/**
 * A unified remark/rehype plugin entry. Kept dependency-light here (the public
 * type surface stays zero-dep); the composer casts to the concrete
 * `react-markdown` `PluggableList` type.
 */
export type SuperChatPluggable = unknown;
export type SuperChatPluggableList = SuperChatPluggable[];

/**
 * A render plugin contributes remark/rehype plugins, custom node components,
 * and/or GenUI widgets to the Markdown pipeline. Plugins are composed into a
 * single `renderTextContent` implementation.
 */
export interface SuperChatRenderPlugin {
  /** Unique plugin name. */
  name: string;
  /** remark plugins to add (operate on the Markdown AST). */
  remarkPlugins?: SuperChatPluggableList;
  /** rehype plugins to add (operate on the HTML AST). */
  rehypePlugins?: SuperChatPluggableList;
  /** Custom React components keyed by node/tag name. */
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
  /** Named interactive widgets for fenced ```genui blocks. */
  widgets?: GenUIRegistry;
  /**
   * Optional contribution to the `rehype-sanitize` allow-list schema, merged by
   * the composer so token classNames / KaTeX markup survive sanitization.
   */
  sanitizeSchema?: Record<string, unknown>;
}

// ============================================================================
// GenUI widget registry (Decision 3)
// ============================================================================

/** When to prefetch a GenUI widget's code/data. */
export type GenUIPrefetchPolicy = 'eager' | 'visible' | 'idle';

/**
 * Minimal subset of the Standard Schema (https://standardschema.dev) interface,
 * implemented by zod v4 and others, used to validate untrusted widget payloads.
 */
export interface StandardSchemaV1<Output = unknown, Input = Output> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown
    ) =>
      | { readonly value: Output }
      | { readonly issues: ReadonlyArray<{ readonly message: string }> }
      | Promise<
          | { readonly value: Output }
          | { readonly issues: ReadonlyArray<{ readonly message: string }> }
        >;
    readonly types?: { readonly input: Input; readonly output: Output };
  };
}

/** Props passed to a host-registered GenUI widget. */
export interface GenUIWidgetProps<T = unknown> {
  /** Payload, validated against the entry's `schema` when provided. */
  data: T;
  /** Render-time metadata. */
  meta: {
    name: string;
    version?: number;
    messageId: string;
    streaming: boolean;
  };
}

/** A single registry entry: lazy code + optional schema/prefetch policy. */
export interface GenUIWidgetEntry<T = unknown> {
  /** Lazy chunk — keeps the widget out of the base bundle. */
  component: () => Promise<{
    default: React.ComponentType<GenUIWidgetProps<T>>;
  }>;
  /** Optional runtime validation of the untrusted payload. */
  schema?: StandardSchemaV1<T>;
  /** Default policy if the wire payload omits one. */
  prefetch?: GenUIPrefetchPolicy;
  /** Optional data prefetch, distinct from loading the component code. */
  prefetchData?: (data: T) => Promise<unknown>;
}

/** Map of widget base-name → entry. Versions are resolved explicitly. */
export type GenUIRegistry = Record<string, GenUIWidgetEntry>;

/** Parsed body of a fenced ```genui block. */
export interface GenUIBlockPayload {
  /** Widget base name (resolved against the registry). */
  widget: string;
  /** Explicit version selector. */
  version?: number;
  /** Wire-level prefetch hint (registry policy overrides this). */
  prefetch?: GenUIPrefetchPolicy;
  /** Arbitrary widget props. */
  props?: unknown;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type {
  AIMessageContent,
  AIMessageStatus,
  MCPResourceLink,
  MCPToolCall,
  MCPToolCallGroupOptions,
  MCPToolCallGroupLabelOverrides,
};
