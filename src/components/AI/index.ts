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

// Collapsible Pill (shared primitive for thinking + tool display)
export { CollapsiblePill, type CollapsiblePillProps } from './CollapsiblePill';

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
export {
  ModelInfoList,
  type ModelInfoListProps,
} from './HeyOzwell/ModelInfoList';
export {
  MODEL_MANIFEST,
  type ModelInfo,
  type ModelStatus,
  type ModelStatusKey,
} from './HeyOzwell/modelManifest';

// Hands-free chat surface + voice enrollment (full inline-chat composition; enrollment builds the
// WHO + WHAT prints). Both build on the primitives below.
export {
  HandsFreeChat,
  type HandsFreeChatProps,
} from './HeyOzwell/HandsFreeChat';
export { VoiceSetup, type VoiceSetupProps } from './HeyOzwell/VoiceSetup';
export { VoiceManager, type VoiceManagerProps } from './HeyOzwell/VoiceManager';
export {
  useVoiceSetup,
  type UseVoiceSetupOptions,
  type UseVoiceSetupResult,
  type VoiceSetupPhase,
} from './HeyOzwell/useVoiceSetup';

// Voice primitives — the headless building blocks the components above compose. Exported so a host can
// build a custom voice flow (or reuse one piece) instead of copying it.
export {
  useWakeWord,
  warmWakeModels,
  subscribeWakeWarm,
  getWakeWarm,
  type UseWakeWordOpts,
  type WakeWordState,
  type WakeWordControls,
  type WakeWarmState,
} from './HeyOzwell/WakeWord/useWakeWord';
export {
  useSpeakerVerify,
  type UseSpeakerVerifyOpts,
  type SpeakerVerifyHandle,
  type VerifyResult,
  type VoiceInfo,
  type VoiceMatch,
  type EnrollOpts,
} from './HeyOzwell/SpeakerVerify/useSpeakerVerify';
export {
  transcribeBlob,
  transcribeSamples,
  transcribeSegments,
  trimTrailingStopPhrase,
  decodeTo16kMono,
  transcribeServer,
  transcribeGate,
  stripStopPhrase,
  endsWithDone,
  warmWhisper,
  warmStopGate,
  isWhisperLoaded,
  getDictationLoad,
  subscribeDictationLoad,
  type WhisperLoadState,
} from './whisperTranscribe';

// Visit Scribe — ambient-visit surface: record a multi-person encounter → speaker-labeled transcript.
export { VisitScribe, type VisitScribeProps } from './HeyOzwell/VisitScribe';
export {
  useVisitScribe,
  type UseVisitScribeOptions,
  type UseVisitScribeResult,
} from './HeyOzwell/useVisitScribe';

// Speaker diarization — on-device "who spoke when" (useDiarization) + its pure clustering/attribution core.
export {
  useDiarization,
  type UseDiarizationOptions,
  type UseDiarizationResult,
} from './HeyOzwell/useDiarization';
export {
  clusterEmbeddings,
  labelClusters,
  attributeSegments,
  mergeTurns,
  inferSpeakerRoles,
  cosine,
  centroid,
  type TranscriptSegment,
  type DiarizedSegment,
  type ClusterOptions,
  type RoleInferenceOptions,
} from './diarize';
export {
  askOzwell,
  askOzwellStream,
  isOzwellConfigured,
  toOzwellMessages,
  getOzwellConfig,
  type OzwellMessage,
  type OzwellConfig,
  type AskOpts,
} from './ozwellChat';
export {
  getVoiceprints,
  setVoiceprints,
  clearVoiceprints,
  loadWhatPrints,
  saveWhatPrints,
  clearWhatPrints,
} from './voiceprintStore';
export {
  openRollingRecorder,
  chime,
  type RollingRecorder,
} from './HeyOzwell/audio';

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
