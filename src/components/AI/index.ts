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
  SparklesIcon,
  AILogoIcon,
  CloseIcon,
  RefreshIcon,
  ChevronIcon,
  SendIcon,
  SpinnerIcon,
  type SparklesIconProps,
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
  ChatBubble,
  type AIMessageDisplayProps,
  type ChatBubbleProps,
} from './AIMessage';

// AI Chat
export {
  AIChat,
  SuggestedActions,
  type AIChatProps,
  type SuggestedActionsProps,
} from './AIChat';

// Hey Ozwell — the in-header voice toggle (octopus that pulses with room volume).
// The floating chat button is the existing FloatingAIChat, shown while this is active.
export {
  HeyOzwellToggle,
  type HeyOzwellToggleProps,
} from './HeyOzwell/HeyOzwellToggle';

// AI Chat Modal
export {
  AIChatModal,
  AIChatTrigger,
  FloatingAIChat,
  type AIChatModalProps,
  type AIChatTriggerProps,
  type FloatingAIChatProps,
} from './AIChatModal';

// AI Reconciliation Panel
export {
  AIReconciliationPanel,
  defaultReconciliationIsEqual,
  reconciliationPanelVariants,
  type AIReconciliationPanelProps,
  type ReconciliationProposal,
  type ReconciliationSource,
  type ReconciliationAcceptedChange,
  type ReconciliationConfidenceLevel,
} from './Reconciliation';
