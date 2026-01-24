/**
 * AI Components
 *
 * Components for building AI-powered interfaces with support for
 * MCP (Model Context Protocol) tool calls, chat messages, and more.
 */

// Types
export * from './types';

// Icons
export {
  AILogoIcon,
  CloseIcon,
  RefreshIcon,
  ChevronIcon,
  SendIcon,
  SpinnerIcon,
  type AILogoIconProps,
  type CloseIconProps,
  type RefreshIconProps,
  type ChevronIconProps,
  type SendIconProps,
  type SpinnerIconProps,
} from './icons';

// MCP Tool Call Display
export {
  MCPToolCallDisplay,
  ResourceLink,
  ToolStatusIcon,
  getToolIcon,
  type MCPToolCallDisplayProps,
  type ResourceLinkProps,
} from './MCPToolCall';

// AI Message Display
export {
  AIMessageDisplay,
  MessageAvatar,
  AITypingIndicator,
  type AIMessageDisplayProps,
} from './AIMessage';

// AI Chat
export {
  AIChat,
  SuggestedActions,
  type AIChatProps,
  type SuggestedActionsProps,
} from './AIChat';

// AI Chat Modal
export {
  AIChatModal,
  AIChatTrigger,
  FloatingAIChat,
  type AIChatModalProps,
  type AIChatTriggerProps,
  type FloatingAIChatProps,
} from './AIChatModal';
