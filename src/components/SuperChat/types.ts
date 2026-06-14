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
  /** Timestamp; the thread is append-only and ordered by `time`. */
  time: Date | string;
  /**
   * Timestamp of the most recent edit, if the message has been edited. When
   * set, surfaces an "(edited)" indicator next to the message time.
   */
  editedAt?: Date | string;
  /** Delivery/generation status. */
  status?: AIMessageStatus;
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
