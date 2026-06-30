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

// Hey Ozwell — the voice entry point. <HeyOzwell> is the drop-in (octopus toggle + settings menu +
// floating chat, wired end-to-end); useHeyOzwell is the headless core for custom layouts.
export {
  HeyOzwellToggle,
  type HeyOzwellToggleProps,
} from './HeyOzwell/HeyOzwellToggle';
export { HeyOzwell, type HeyOzwellProps } from './HeyOzwell/HeyOzwell';
export {
  OzwellSettingsMenu,
  type OzwellSettingsMenuProps,
} from './HeyOzwell/OzwellSettingsMenu';
export {
  useHeyOzwell,
  type UseHeyOzwellOptions,
  type UseHeyOzwellResult,
  type HeyOzwellPhase,
  type HeyOzwellToggleBindings,
  type HeyOzwellChatBindings,
} from './HeyOzwell/useHeyOzwell';
export { ModelInfoList, type ModelInfoListProps } from './HeyOzwell/ModelInfoList';
export {
  MODEL_MANIFEST,
  type ModelInfo,
  type ModelStatus,
  type ModelStatusKey,
} from './HeyOzwell/modelManifest';

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
