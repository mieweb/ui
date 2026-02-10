/**
 * AI Component Types
 *
 * Type definitions for AI-related components including MCP (Model Context Protocol)
 * interactions, tool calls, and chat messages.
 */

// ============================================================================
// MCP Tool Types
// ============================================================================

/**
 * Status of an MCP tool invocation
 */
export type MCPToolStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'cancelled';

/**
 * MCP Tool parameter definition
 */
export interface MCPToolParameter {
  name: string;
  type: string;
  value: unknown;
  description?: string;
}

/**
 * MCP Tool invocation
 */
export interface MCPToolCall {
  /** Unique identifier for this tool call */
  id: string;
  /** Name of the tool being invoked */
  toolName: string;
  /** Human-readable description of what the tool does */
  description?: string;
  /** Parameters passed to the tool */
  parameters: MCPToolParameter[];
  /** Current status of the tool execution */
  status: MCPToolStatus;
  /** Timestamp when tool was invoked */
  startedAt: Date | string;
  /** Timestamp when tool completed */
  completedAt?: Date | string;
  /** Duration in milliseconds */
  duration?: number;
  /** Result data if successful */
  result?: MCPToolResult;
  /** Error message if failed */
  error?: string;
}

/**
 * Result from an MCP tool execution
 */
export interface MCPToolResult {
  /** Type of result data */
  type: 'text' | 'json' | 'link' | 'resource' | 'error';
  /** The result data */
  data: unknown;
  /** Human-readable summary of the result */
  summary?: string;
  /** Link to a resource (for link type) */
  link?: MCPResourceLink;
  /** Resources created or modified */
  resources?: MCPResource[];
}

/**
 * Link to a resource
 */
export interface MCPResourceLink {
  /** URL or path to the resource */
  href: string;
  /** Display text for the link */
  label: string;
  /** Type of resource */
  type?:
    | 'patient'
    | 'document'
    | 'appointment'
    | 'order'
    | 'provider'
    | 'external'
    | 'internal';
  /** Icon name or component */
  icon?: string;
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  /** Unique identifier */
  id: string;
  /** Resource type (e.g., 'patient', 'appointment', 'document') */
  type: string;
  /** Display name */
  name: string;
  /** URL to access the resource */
  uri?: string;
  /** Brief description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AI Message Types
// ============================================================================

/**
 * Role of the message sender
 */
export type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Status of an AI message
 */
export type AIMessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

/**
 * Content block within a message
 */
export interface AIMessageContent {
  /** Type of content */
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'code';
  /** Text content */
  text?: string;
  /** Tool call reference */
  toolCall?: MCPToolCall;
  /** Language for code blocks */
  language?: string;
  /** Whether this content is collapsed by default */
  collapsed?: boolean;
}

/**
 * AI Chat Message
 */
export interface AIMessage {
  /** Unique identifier */
  id: string;
  /** Role of sender */
  role: AIMessageRole;
  /** Message content blocks */
  content: AIMessageContent[];
  /** Timestamp */
  timestamp: Date | string;
  /** Current status */
  status: AIMessageStatus;
  /** Model used (for assistant messages) */
  model?: string;
  /** Token usage info */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AI Chat Types
// ============================================================================

/**
 * Suggested action/prompt
 */
export interface AISuggestedAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Full prompt text */
  prompt: string;
  /** Icon name */
  icon?: string;
  /** Category for grouping */
  category?: string;
}

/**
 * AI Chat session
 */
export interface AIChatSession {
  /** Unique session identifier */
  id: string;
  /** Session title */
  title?: string;
  /** Messages in the session */
  messages: AIMessage[];
  /** Available tools */
  availableTools?: MCPToolInfo[];
  /** Created timestamp */
  createdAt: Date | string;
  /** Last updated timestamp */
  updatedAt: Date | string;
  /** Whether the assistant is currently generating */
  isGenerating: boolean;
  /** Context information */
  context?: {
    /** Current page/location */
    page?: string;
    /** Selected entity */
    entity?: MCPResource;
    /** Additional context */
    custom?: Record<string, unknown>;
  };
}

/**
 * Information about an available MCP tool
 */
export interface MCPToolInfo {
  /** Tool name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Input schema */
  inputSchema?: Record<string, unknown>;
  /** Category for grouping */
  category?: string;
  /** Whether the tool is enabled */
  enabled?: boolean;
}

// ============================================================================
// Callback Types
// ============================================================================

export interface AIChatCallbacks {
  /** Called when user sends a message */
  onSendMessage?: (message: string) => void | Promise<void>;
  /** Called when a tool call is initiated */
  onToolCall?: (toolCall: MCPToolCall) => void | Promise<void>;
  /** Called when a tool call completes */
  onToolComplete?: (toolCall: MCPToolCall, result: MCPToolResult) => void;
  /** Called when user clicks a resource link */
  onResourceClick?: (resource: MCPResource | MCPResourceLink) => void;
  /** Called when user selects a suggested action */
  onSuggestedAction?: (action: AISuggestedAction) => void;
  /** Called when user wants to cancel generation */
  onCancel?: () => void;
  /** Called when user wants to retry */
  onRetry?: () => void;
  /** Called when session is cleared */
  onClear?: () => void;
}
