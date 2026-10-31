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
} from '../AI/types';

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

/**
 * A document attached to a message (a PDF, a spreadsheet, any file that isn't
 * a picture or a clip). Drawn in the thread as a row in the message's files
 * tile, opened at `url`; never part of the media view.
 */
export interface SuperChatFileAttachment {
  /** Stable id, unique within the message. */
  id: string;
  /** File name as shown, extension included (its type is read from it). */
  name: string;
  /** Where it opens (a new tab). */
  url: string;
  /** Size in bytes, shown beside its type when known. */
  size?: number;
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

/** One attachment in the thread, as {@link SuperChatRenderMessageMedia} gets it. */
export interface SuperChatMessageMediaRenderProps {
  message: SuperChatMessage;
  attachment: SuperChatMediaAttachment;
  /** Opens this attachment in the conversation's media view; `play` starts it there. */
  open: (play?: boolean) => void;
  /**
   * Set as `data-media-launch-id` on the control that calls `open`, so focus
   * returns to it when the viewer goes back to the conversation.
   */
  launchId: string;
  /**
   * The box the card fits in, both ways, as a CSS length (SuperChat's
   * `mediaMaxSize`): a wide clip up to this wide, an upright one up to this
   * tall, and never wider than the message. The built-in card is this wide.
   */
  maxSize: string;
}

/**
 * Renders one attachment in the thread in place of the built-in card, e.g. a
 * host's own video card. Returning `null` or `undefined` keeps the built-in
 * card for that attachment. Keep it referentially stable: message rows are
 * memoized.
 */
export type SuperChatRenderMessageMedia = (
  props: SuperChatMessageMediaRenderProps
) => React.ReactNode;

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
  /** The last gallery cell's name for the attachments it hides, e.g. "3 more". */
  moreMedia: (count: number) => string;
  /** Under a `pending` message's attachments; `percent` when its `progress` is known. */
  sending: (percent?: number) => string;
  /** A media tile whose picture or clip didn't load. */
  mediaUnavailable: string;
  /**
   * The conversation list's preview of a last message with no text: what it
   * carries, e.g. "Photo", "2 photos", "Video", "Q3 report.pdf".
   */
  attachmentsPreview: (attachments: {
    pictures: number;
    videos: number;
    audio: number;
    files: string[];
  }) => string;
  unknownAuthor: string;
}

/** Labels for per-message states in the thread. */
export interface SuperChatMessageLabels {
  /** Prefix of a scheduled message's indicator, before its time. */
  scheduled: string;
}

/** The media labels a thread's attachment tiles use. */
export type SuperChatAttachmentLabels = Pick<
  SuperChatMediaLabels,
  'moreMedia' | 'sending' | 'mediaUnavailable'
>;

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
  /** Documents attached to the message, shown after its media. */
  files?: SuperChatFileAttachment[];
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
  /**
   * How far a `pending` message's attachments have uploaded, 0 to 1, shown
   * under them while it sends. Leave it out when the host can't tell.
   */
  progress?: number;
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
 * allowed via `acceptedFileTypes`; each maps to `<input accept>` tokens and a
 * MIME matcher used to filter pastes and file-picker selections.
 * - `image` → JPEG, PNG, GIF, WebP, AVIF: what every browser shows. A HEIC
 *   photo is refused, and an iPhone's picker converts it to JPEG first.
 * - `video` → `video/*`
 * - `audio` → `audio/*`
 * - `pdf` → `application/pdf`
 * - `document` → Word, Excel, plain text and CSV files
 */
export type AttachmentKind = 'image' | 'video' | 'audio' | 'pdf' | 'document';

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

export type { AIMessageContent, AIMessageStatus, MCPResourceLink };
