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
  type AILogoIconProps,
  ChevronIcon,
  type ChevronIconProps,
  CloseIcon,
  type CloseIconProps,
  RefreshIcon,
  type RefreshIconProps,
  SendIcon,
  type SendIconProps,
  SparklesIcon,
  type SparklesIconProps,
  SpinnerIcon,
  type SpinnerIconProps,
} from './icons';

// MCP Tool Call Display
export {
  getToolIcon,
  MCPToolCallDisplay,
  type MCPToolCallDisplayProps,
  ResourceLink,
  type ResourceLinkProps,
  ToolStatusIcon,
} from './MCPToolCall';

// AI Message Display
export {
  AIMessageDisplay,
  type AIMessageDisplayProps,
  AITypingIndicator,
  MessageAvatar,
} from './AIMessage';

// AI Chat
export {
  AIChat,
  type AIChatProps,
  SuggestedActions,
  type SuggestedActionsProps,
} from './AIChat';

// AI Chat Modal
export {
  AIChatModal,
  type AIChatModalProps,
  AIChatTrigger,
  type AIChatTriggerProps,
  FloatingAIChat,
  type FloatingAIChatProps,
} from './AIChatModal';
