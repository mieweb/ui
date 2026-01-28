import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React$1 from 'react';
import React__default, { ReactNode } from 'react';
import { AgGridReactProps, AgGridReact } from 'ag-grid-react';
export { AgGridReact } from 'ag-grid-react';
import { RowClickedEvent, RowSelectionOptions, ColDef as ColDef$1, ICellRendererParams } from 'ag-grid-community';
export { ColDef as AGColDef, CellClickedEvent, CellValueChangedEvent, FilterChangedEvent, FirstDataRenderedEvent, GridApi, GridReadyEvent, RowClickedEvent, RowSelectedEvent, SelectionChangedEvent, SortChangedEvent } from 'ag-grid-community';
import { VariantProps } from 'class-variance-authority';
import { BrandConfig } from './brands/types.js';
export { BrandBorderRadius, BrandBoxShadow, BrandColors, BrandTypography, ColorScale, SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme } from './brands/types.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
export { Alert, AlertDescription, AlertProps, AlertTitle, alertVariants } from './components/Alert/index.js';
export { AudioPlayer, AudioPlayerProps, AudioPlayerState, ProgressBar, audioPlayerVariants, formatAudioTime, playButtonVariants } from './components/AudioPlayer/index.js';
export { AudioRecorder, AudioRecorderControlsRenderProps, AudioRecorderProps, AudioRecorderState, audioRecorderVariants, controlButtonVariants, formatTime, waveformContainerVariants } from './components/AudioRecorder/index.js';
export { Avatar, AvatarGroup, AvatarGroupProps, AvatarProps, avatarVariants, getInitials } from './components/Avatar/index.js';
export { Badge, BadgeProps, badgeVariants } from './components/Badge/index.js';
export { Breadcrumb, BreadcrumbItem, BreadcrumbProps, BreadcrumbSlash } from './components/Breadcrumb/index.js';
export { Button, ButtonProps, buttonVariants } from './components/Button/index.js';
export { Card, CardActions, CardActionsProps, CardBadge, CardBadgeProps, CardCollapsible, CardCollapsibleProps, CardContent, CardDescription, CardDivider, CardFooter, CardHeader, CardMedia, CardMediaProps, CardProps, CardStat, CardStatProps, CardTitle, cardAccentVariants, cardVariants } from './components/Card/index.js';
export { Checkbox, CheckboxGroup, CheckboxGroupProps, CheckboxProps, checkboxVariants } from './components/Checkbox/index.js';
export { DateInput, DateInputMode, DateInputProps } from './components/DateInput/index.js';
export { Dropdown, DropdownContent, DropdownContentProps, DropdownHeader, DropdownHeaderProps, DropdownItem, DropdownItemProps, DropdownLabel, DropdownPlacement, DropdownProps, DropdownSeparator } from './components/Dropdown/index.js';
export { Input, InputProps, inputVariants } from './components/Input/index.js';
export { Modal, ModalBody, ModalBodyProps, ModalClose, ModalCloseProps, ModalFooter, ModalFooterProps, ModalHeader, ModalHeaderProps, ModalProps, ModalTitle, ModalTitleProps, modalContentVariants, modalOverlayVariants } from './components/Modal/index.js';
export { Pagination, PaginationProps, SimplePagination, SimplePaginationProps, paginationButtonVariants } from './components/Pagination/index.js';
export { PhoneInput, PhoneInputProps } from './components/PhoneInput/index.js';
export { CircularProgress, CircularProgressProps, Progress, ProgressProps, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants } from './components/Progress/index.js';
export { QuickAction, QuickActionColor, QuickActionGroup, QuickActionGroupProps, QuickActionIcons, QuickActionProps, quickActionIconVariants, quickActionVariants } from './components/QuickAction/index.js';
export { Radio, RadioGroup, RadioGroupProps, RadioProps, radioVariants } from './components/Radio/index.js';
export { RecordButton, RecordButtonProps, RecordButtonState, TranscriptionResult, TranscriptionState, formatDuration, recordButtonVariants, recordingIndicatorVariants } from './components/RecordButton/index.js';
export { DateButton, DateButtonProps, DatePicker, DatePickerProps, RadioOption, RadioOptionProps, SchedulePicker, SchedulePickerProps, TimeButton, TimeButtonProps, TimePicker, TimePickerProps, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './components/SchedulePicker/index.js';
export { Select, SelectGroup, SelectOption, SelectProps, selectTriggerVariants } from './components/Select/index.js';
export { Skeleton, SkeletonCard, SkeletonCardProps, SkeletonProps, SkeletonTable, SkeletonTableProps, SkeletonText, SkeletonTextProps, skeletonVariants } from './components/Skeleton/index.js';
export { FullPageSpinner, FullPageSpinnerProps, Spinner, SpinnerProps, SpinnerWithLabel, SpinnerWithLabelProps, spinnerVariants } from './components/Spinner/index.js';
export { Switch, SwitchProps, switchThumbVariants, switchTrackVariants } from './components/Switch/index.js';
export { Table, TableBody, TableBodyProps, TableCaption, TableCaptionProps, TableCell, TableCellProps, TableFooter, TableFooterProps, TableHead, TableHeadProps, TableHeader, TableHeaderProps, TableProps, TableRow, TableRowProps } from './components/Table/index.js';
export { Tabs, TabsContent, TabsContentProps, TabsList, TabsListProps, TabsProps, TabsTrigger, TabsTriggerProps, tabsListVariants, tabsTriggerVariants } from './components/Tabs/index.js';
export { SmallMuted, Text, TextProps, textVariants } from './components/Text/index.js';
export { Textarea, TextareaProps, textareaVariants } from './components/Textarea/index.js';
export { ThemeProvider, ThemeProviderContext, ThemeProviderContextValue, ThemeProviderProps, ThemeToggle, ThemeToggleProps, themeToggleIconVariants, themeToggleVariants, useThemeContext } from './components/ThemeProvider/index.js';
export { Tooltip, TooltipPlacement, TooltipProps } from './components/Tooltip/index.js';
export { VisuallyHidden, VisuallyHiddenProps } from './components/VisuallyHidden/index.js';
export { R as ResolvedTheme, T as Theme, u as useTheme } from './useTheme-B9SWu6ui.js';
export { KeyboardShortcutOptions, useClickOutside, useCommandK, useEscapeKey, useFocusTrap, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery, usePrefersReducedMotion } from './hooks/index.js';
export { calculateAge, cn, formatDateValue, formatPhoneNumber, isDateEmpty, isDateInFuture, isDateInPast, isPhoneNumberEmpty, isValidDate, isValidDrivingAge, isValidPhoneNumber, parseDateValue, unformatPhoneNumber } from './utils/index.js';
export { default as miewebUIPreset, miewebUISafelist } from './tailwind-preset.js';
export { brands, defaultBrand, enterpriseHealthBrand, miewebBrand, wagglelineBrand, webchartBrand } from './brands/index.js';
export { default as bluehiveBrand } from './brands/bluehive.js';
import 'clsx';

declare const agGridVariants: (props?: ({
    variant?: "default" | "bordered" | "striped" | "card" | null | undefined;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | null | undefined;
    brand?: "default" | "mieweb" | "bluehive" | "waggleline" | "webchart" | "enterprise-health" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AGGridProps<TData = unknown> extends Omit<AgGridReactProps<TData>, 'className' | 'rowSelection'>, VariantProps<typeof agGridVariants> {
    /** Additional CSS classes for the grid container */
    className?: string;
    /** Height of the grid container */
    height?: string | number;
    /** Loading state */
    loading?: boolean;
    /** Callback when a row is clicked */
    onRowClick?: (event: RowClickedEvent<TData>) => void;
    /** Reference to access the grid API */
    gridRef?: React$1.RefObject<AgGridReact<TData> | null>;
    /** Row selection configuration (v35+ object format or legacy string) */
    rowSelection?: RowSelectionOptions | 'single' | 'multiple';
    /** Brand configuration for theming */
    brandConfig?: BrandConfig;
    /** Show pagination controls */
    pagination?: boolean;
    /** Enable column resizing */
    resizable?: boolean;
    /** Enable sorting */
    sortable?: boolean;
    /** Enable filtering */
    filterable?: boolean;
    /** Custom empty state message */
    noDataMessage?: string;
    /** Custom loading message */
    loadingMessage?: string;
}
declare const AGGrid: <TData = unknown>(props: AGGridProps<TData> & {
    ref?: React$1.ForwardedRef<AgGridReact<TData>>;
}) => React$1.ReactElement;

type ColDef<TData = unknown, TValue = unknown> = ColDef$1<TData, TValue>;

/**
 * AG Grid Cell Renderers
 *
 * Rich, visually appealing cell renderers for AG Grid tables.
 * Based on Waggleline's production-tested implementations with
 * full dark mode support and design system integration.
 *
 * All renderers are memoized with React.memo for performance optimization.
 */

/**
 * Format a phone number with dashes for display
 */
declare function formatPhoneDisplay(phone: string | null | undefined): string;
interface StatusConfig {
    label: string;
    bgClass: string;
    textClass: string;
    iconName?: string;
}
declare const statusColors: Record<string, StatusConfig>;
interface AvatarNameRendererProps extends ICellRendererParams {
    avatarField?: string;
    domainField?: string;
}
/**
 * Renders an avatar with name, suitable for contact/owner columns
 */
declare function AvatarNameRenderer(props: AvatarNameRendererProps): React$1.ReactElement;
interface StatusBadgeRendererProps extends ICellRendererParams {
    /** Custom status color configuration */
    statusConfig?: Record<string, StatusConfig>;
}
/**
 * Renders a colorful status badge
 */
declare function StatusBadgeRenderer(props: StatusBadgeRendererProps): React$1.ReactElement;
/**
 * Renders engagement score with color-coded progress bar
 */
declare function EngagementScoreRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders email with mailto link
 */
declare function EmailRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders phone with click-to-call
 */
declare function PhoneRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders a domain/website URL with icon
 */
declare function DomainRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders a LinkedIn URL with icon
 */
declare function LinkedInRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders currency with proper formatting
 */
declare function CurrencyRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders number with comma formatting
 */
declare function NumberRenderer(props: ICellRendererParams): React$1.ReactElement;
interface DateRendererProps extends ICellRendererParams {
    format?: 'short' | 'medium' | 'long' | 'relative' | 'datetime';
}
/**
 * Renders date with formatting options
 */
declare function DateRenderer(props: DateRendererProps): React$1.ReactElement;
/**
 * Renders boolean as styled Yes/No badge
 */
declare function BooleanRenderer(props: ICellRendererParams): React$1.ReactElement;
interface CompanyRendererProps extends ICellRendererParams {
    companyIdField?: string;
    domainField?: string;
}
/**
 * Renders company name with favicon
 */
declare function CompanyRenderer(props: CompanyRendererProps): React$1.ReactElement;
interface ProgressRendererProps extends ICellRendererParams {
    /** Color of the progress bar */
    barColor?: string;
    /** Maximum value (default 100) */
    max?: number;
}
/**
 * Renders a progress bar
 */
declare function ProgressRenderer(props: ProgressRendererProps): React$1.ReactElement;
/**
 * Renders an array of tags as badges
 */
declare function TagsRenderer(props: ICellRendererParams): React$1.ReactElement;
declare const MemoizedAvatarNameRenderer: React$1.MemoExoticComponent<typeof AvatarNameRenderer>;
declare const MemoizedStatusBadgeRenderer: React$1.MemoExoticComponent<typeof StatusBadgeRenderer>;
declare const MemoizedEngagementScoreRenderer: React$1.MemoExoticComponent<typeof EngagementScoreRenderer>;
declare const MemoizedEmailRenderer: React$1.MemoExoticComponent<typeof EmailRenderer>;
declare const MemoizedPhoneRenderer: React$1.MemoExoticComponent<typeof PhoneRenderer>;
declare const MemoizedLinkedInRenderer: React$1.MemoExoticComponent<typeof LinkedInRenderer>;
declare const MemoizedDomainRenderer: React$1.MemoExoticComponent<typeof DomainRenderer>;
declare const MemoizedCurrencyRenderer: React$1.MemoExoticComponent<typeof CurrencyRenderer>;
declare const MemoizedNumberRenderer: React$1.MemoExoticComponent<typeof NumberRenderer>;
declare const MemoizedDateRenderer: React$1.MemoExoticComponent<typeof DateRenderer>;
declare const MemoizedBooleanRenderer: React$1.MemoExoticComponent<typeof BooleanRenderer>;
declare const MemoizedCompanyRenderer: React$1.MemoExoticComponent<typeof CompanyRenderer>;
declare const MemoizedProgressRenderer: React$1.MemoExoticComponent<typeof ProgressRenderer>;
declare const MemoizedTagsRenderer: React$1.MemoExoticComponent<typeof TagsRenderer>;
declare const CellRenderers: {
    AvatarNameRenderer: typeof AvatarNameRenderer;
    StatusBadgeRenderer: typeof StatusBadgeRenderer;
    EngagementScoreRenderer: typeof EngagementScoreRenderer;
    EmailRenderer: typeof EmailRenderer;
    PhoneRenderer: typeof PhoneRenderer;
    LinkedInRenderer: typeof LinkedInRenderer;
    DomainRenderer: typeof DomainRenderer;
    CurrencyRenderer: typeof CurrencyRenderer;
    NumberRenderer: typeof NumberRenderer;
    DateRenderer: typeof DateRenderer;
    BooleanRenderer: typeof BooleanRenderer;
    CompanyRenderer: typeof CompanyRenderer;
    ProgressRenderer: typeof ProgressRenderer;
    TagsRenderer: typeof TagsRenderer;
    MemoizedAvatarNameRenderer: React$1.MemoExoticComponent<typeof AvatarNameRenderer>;
    MemoizedStatusBadgeRenderer: React$1.MemoExoticComponent<typeof StatusBadgeRenderer>;
    MemoizedEngagementScoreRenderer: React$1.MemoExoticComponent<typeof EngagementScoreRenderer>;
    MemoizedEmailRenderer: React$1.MemoExoticComponent<typeof EmailRenderer>;
    MemoizedPhoneRenderer: React$1.MemoExoticComponent<typeof PhoneRenderer>;
    MemoizedLinkedInRenderer: React$1.MemoExoticComponent<typeof LinkedInRenderer>;
    MemoizedDomainRenderer: React$1.MemoExoticComponent<typeof DomainRenderer>;
    MemoizedCurrencyRenderer: React$1.MemoExoticComponent<typeof CurrencyRenderer>;
    MemoizedNumberRenderer: React$1.MemoExoticComponent<typeof NumberRenderer>;
    MemoizedDateRenderer: React$1.MemoExoticComponent<typeof DateRenderer>;
    MemoizedBooleanRenderer: React$1.MemoExoticComponent<typeof BooleanRenderer>;
    MemoizedCompanyRenderer: React$1.MemoExoticComponent<typeof CompanyRenderer>;
    MemoizedProgressRenderer: React$1.MemoExoticComponent<typeof ProgressRenderer>;
    MemoizedTagsRenderer: React$1.MemoExoticComponent<typeof TagsRenderer>;
    formatPhoneDisplay: typeof formatPhoneDisplay;
};

/**
 * AI Component Types
 *
 * Type definitions for AI-related components including MCP (Model Context Protocol)
 * interactions, tool calls, and chat messages.
 */
/**
 * Status of an MCP tool invocation
 */
type MCPToolStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';
/**
 * MCP Tool parameter definition
 */
interface MCPToolParameter {
    name: string;
    type: string;
    value: unknown;
    description?: string;
}
/**
 * MCP Tool invocation
 */
interface MCPToolCall {
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
interface MCPToolResult {
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
interface MCPResourceLink {
    /** URL or path to the resource */
    href: string;
    /** Display text for the link */
    label: string;
    /** Type of resource */
    type?: 'patient' | 'document' | 'appointment' | 'order' | 'external' | 'internal';
    /** Icon name or component */
    icon?: string;
}
/**
 * MCP Resource definition
 */
interface MCPResource {
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
/**
 * Role of the message sender
 */
type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';
/**
 * Status of an AI message
 */
type AIMessageStatus = 'pending' | 'streaming' | 'complete' | 'error';
/**
 * Content block within a message
 */
interface AIMessageContent {
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
interface AIMessage {
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
/**
 * Suggested action/prompt
 */
interface AISuggestedAction {
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
interface AIChatSession {
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
interface MCPToolInfo {
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
interface AIChatCallbacks {
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

/**
 * AI Component Icons
 *
 * Shared icon components for AI features to follow DRY principles.
 */
interface SparklesIconProps {
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}
/**
 * Sparkles icon - the modern symbol for AI features
 * Used by ChatGPT, GitHub Copilot, Google Gemini, etc.
 */
declare function SparklesIcon({ className, size }: SparklesIconProps): react_jsx_runtime.JSX.Element;
interface AILogoIconProps {
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}
/**
 * The AI assistant logo - a stacked layers/prism icon
 * @deprecated Use SparklesIcon for a more recognizable AI symbol
 */
declare function AILogoIcon({ className, size }: AILogoIconProps): react_jsx_runtime.JSX.Element;
interface CloseIconProps {
    className?: string;
}
declare function CloseIcon({ className }: CloseIconProps): react_jsx_runtime.JSX.Element;
interface RefreshIconProps {
    className?: string;
}
declare function RefreshIcon({ className }: RefreshIconProps): react_jsx_runtime.JSX.Element;
interface ChevronIconProps {
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}
declare function ChevronIcon({ className, direction, }: ChevronIconProps): react_jsx_runtime.JSX.Element;
interface SendIconProps {
    className?: string;
}
declare function SendIcon({ className }: SendIconProps): react_jsx_runtime.JSX.Element;
interface SpinnerIconProps {
    className?: string;
}
declare function SpinnerIcon({ className }: SpinnerIconProps): react_jsx_runtime.JSX.Element;

interface ToolStatusIconProps {
    status: MCPToolStatus;
    className?: string;
}
declare function ToolStatusIcon({ status, className }: ToolStatusIconProps): react_jsx_runtime.JSX.Element;
declare function getToolIcon(toolName: string): React$1.ReactNode;
interface ResourceLinkProps {
    link: MCPResourceLink;
    onClick?: (link: MCPResourceLink) => void;
    className?: string;
}
declare function ResourceLink({ link, onClick, className }: ResourceLinkProps): react_jsx_runtime.JSX.Element;
declare const toolCallVariants: (props?: ({
    status?: "running" | "pending" | "success" | "error" | "cancelled" | null | undefined;
    compact?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface MCPToolCallDisplayProps extends VariantProps<typeof toolCallVariants> {
    /** The tool call to display */
    toolCall: MCPToolCall;
    /** Whether to show parameters (in detailed view) */
    showParameters?: boolean;
    /** Whether the component is collapsible to show details */
    collapsible?: boolean;
    /** Default collapsed state (true = hide details) */
    defaultCollapsed?: boolean;
    /** Callback when a resource link is clicked */
    onLinkClick?: (link: MCPResourceLink) => void;
    /** Additional class name */
    className?: string;
}
/**
 * Displays an MCP tool call with its status, parameters, and results.
 * Shows a user-friendly summary by default, with technical details available on expand.
 */
declare function MCPToolCallDisplay({ toolCall, showParameters, collapsible, defaultCollapsed, compact, onLinkClick, className, }: MCPToolCallDisplayProps): react_jsx_runtime.JSX.Element;

declare const avatarVariants: (props?: ({
    role?: "user" | "assistant" | "system" | "tool" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface MessageAvatarProps extends VariantProps<typeof avatarVariants> {
    userName?: string;
    className?: string;
}
declare function MessageAvatar({ role, size, userName, className, }: MessageAvatarProps): react_jsx_runtime.JSX.Element;
declare function AITypingIndicator({ className }: {
    className?: string;
}): react_jsx_runtime.JSX.Element;
interface AIMessageDisplayProps {
    /** The message to display */
    message: AIMessage;
    /** User name for user messages */
    userName?: string;
    /** Whether to show the avatar */
    showAvatar?: boolean;
    /** Whether to show timestamp */
    showTimestamp?: boolean;
    /** Callback when a resource link is clicked */
    onLinkClick?: (link: MCPResourceLink) => void;
    /** Additional class name */
    className?: string;
}
/**
 * Displays an AI chat message with support for text, tool calls, and streaming.
 */
declare function AIMessageDisplay({ message, userName, showAvatar, showTimestamp, onLinkClick, className, }: AIMessageDisplayProps): react_jsx_runtime.JSX.Element;

/**
 * Messaging Component Types
 *
 * Core type definitions for the messaging system, designed to be
 * backend-agnostic and extensible for various use cases including
 * SMS, MMS, and enterprise messaging.
 */
/**
 * Message delivery and read status.
 */
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
/**
 * Visual indicators for message status (checkmarks style).
 */
interface MessageStatusIndicator {
    status: MessageStatus;
    /** Timestamp when status was achieved */
    timestamp?: Date | string;
}
/**
 * Supported attachment/media types.
 */
type AttachmentType = 'image' | 'video' | 'audio' | 'document' | 'file';
/**
 * Attachment loading/upload state.
 */
type AttachmentState = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'downloading';
/**
 * Attachment/media associated with a message.
 */
interface MessageAttachment {
    /** Unique identifier for the attachment */
    id: string;
    /** Type of attachment */
    type: AttachmentType;
    /** URL to the attachment (can be blob URL for pending uploads) */
    url: string;
    /** Thumbnail URL for images/videos */
    thumbnailUrl?: string;
    /** Original filename */
    filename: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    mimeType: string;
    /** Image/video dimensions */
    dimensions?: {
        width: number;
        height: number;
    };
    /** Duration in seconds for audio/video */
    duration?: number;
    /** Upload/download progress (0-100) */
    progress?: number;
    /** Current state of the attachment */
    state: AttachmentState;
    /** Alt text for accessibility */
    alt?: string;
}
/**
 * A participant in a conversation.
 */
interface MessageParticipant {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Avatar image URL */
    avatarUrl?: string;
    /** Phone number (for SMS/MMS) */
    phoneNumber?: string;
    /** Email address */
    email?: string;
    /** Whether this participant is the current user */
    isCurrentUser?: boolean;
    /** Whether this participant is online */
    isOnline?: boolean;
    /** Last seen timestamp */
    lastSeen?: Date | string;
}
/**
 * Read receipt for a message.
 */
interface ReadReceipt {
    /** Participant who read the message */
    participant: MessageParticipant;
    /** Timestamp when the message was read */
    readAt: Date | string;
}
/**
 * Type of message content.
 */
type MessageType = 'text' | 'media' | 'system' | 'typing';
/**
 * System message types for special notifications.
 */
type SystemMessageType = 'user-joined' | 'user-left' | 'conversation-created' | 'name-changed' | 'info' | 'warning' | 'error';
/**
 * Core message interface.
 */
interface Message {
    /** Unique identifier */
    id: string;
    /** Message type */
    type: MessageType;
    /** Text content */
    content: string;
    /** Message sender */
    sender: MessageParticipant;
    /** Timestamp when message was created */
    timestamp: Date | string;
    /** Current delivery/read status */
    status: MessageStatus;
    /** Attachments/media */
    attachments?: MessageAttachment[];
    /** Read receipts (for group conversations) */
    readReceipts?: ReadReceipt[];
    /** For system messages, the specific type */
    systemMessageType?: SystemMessageType;
    /** Reply-to message reference */
    replyTo?: {
        id: string;
        content: string;
        sender: MessageParticipant;
    };
    /** Reactions to the message */
    reactions?: MessageReaction[];
    /** Whether the message has been edited */
    isEdited?: boolean;
    /** Edit timestamp */
    editedAt?: Date | string;
    /** Whether the message is deleted (soft delete) */
    isDeleted?: boolean;
    /** Custom metadata for extensibility */
    metadata?: Record<string, unknown>;
}
/**
 * Message reaction.
 */
interface MessageReaction {
    /** Emoji or reaction type */
    emoji: string;
    /** Participants who reacted */
    participants: MessageParticipant[];
    /** Count of reactions */
    count: number;
}
/**
 * Type of conversation.
 */
type ConversationType = 'direct' | 'group' | 'channel' | 'broadcast';
/**
 * Conversation/thread interface.
 */
interface Conversation {
    /** Unique identifier */
    id: string;
    /** Conversation type */
    type: ConversationType;
    /** Conversation name (for groups/channels) */
    name?: string;
    /** Participants */
    participants: MessageParticipant[];
    /** Last message preview */
    lastMessage?: Message;
    /** Unread message count */
    unreadCount: number;
    /** Whether the conversation is muted */
    isMuted?: boolean;
    /** Whether the conversation is pinned */
    isPinned?: boolean;
    /** Whether the conversation is archived */
    isArchived?: boolean;
    /** Avatar/image URL for the conversation */
    avatarUrl?: string;
    /** Timestamp of last activity */
    lastActivityAt: Date | string;
    /** Created timestamp */
    createdAt: Date | string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * New message to be sent (before ID is assigned).
 */
interface NewMessage {
    /** Text content */
    content: string;
    /** Attachments to include */
    attachments?: File[];
    /** Reply-to message ID */
    replyToId?: string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Message action type for context menus.
 */
type MessageAction = 'copy' | 'reply' | 'forward' | 'edit' | 'delete' | 'react' | 'resend' | 'report';
/**
 * Event handlers for messaging components.
 */
interface MessagingEventHandlers {
    /** Called when a message is sent */
    onSendMessage?: (message: NewMessage) => void | Promise<void>;
    /** Called when a failed message should be retried */
    onRetryMessage?: (messageId: string) => void | Promise<void>;
    /** Called when an attachment is added */
    onAttachmentAdded?: (files: File[]) => void;
    /** Called when an attachment is removed */
    onAttachmentRemoved?: (attachmentId: string) => void;
    /** Called when a read receipt is triggered */
    onReadReceipt?: (messageId: string) => void;
    /** Called when the user starts typing */
    onTypingStart?: () => void;
    /** Called when the user stops typing */
    onTypingStop?: () => void;
    /** Called when a message action is triggered */
    onMessageAction?: (action: MessageAction, message: Message) => void;
    /** Called when scrolling to load more history */
    onLoadMore?: () => void | Promise<void>;
    /** Called when an attachment is clicked */
    onAttachmentClick?: (attachment: MessageAttachment, message: Message) => void;
    /** Called when a participant is clicked */
    onParticipantClick?: (participant: MessageParticipant) => void;
    /** Called when a reaction is toggled */
    onReactionToggle?: (messageId: string, emoji: string) => void;
}
/**
 * Loading states for the messaging interface.
 */
interface MessagingLoadingState {
    /** Initial loading of messages */
    isLoadingMessages: boolean;
    /** Loading more history */
    isLoadingMore: boolean;
    /** Sending a message */
    isSending: boolean;
    /** Uploading attachments */
    isUploadingAttachments: boolean;
}
/**
 * Typing indicator state.
 */
interface TypingState {
    /** Participants currently typing */
    participants: MessageParticipant[];
    /** Timestamp of last typing activity */
    lastUpdated?: Date | string;
}
/**
 * Date grouping for message lists.
 */
interface MessageGroup {
    /** Date label (e.g., "Today", "Yesterday", "January 21, 2026") */
    label: string;
    /** Date key for grouping */
    date: string;
    /** Messages in this group */
    messages: Message[];
}

interface CharacterCounterProps {
    current: number;
    max: number;
    showWarningAt?: number;
    className?: string;
}
/**
 * Displays character count with warning colors.
 */
declare function CharacterCounter({ current, max, showWarningAt, className, }: CharacterCounterProps): react_jsx_runtime.JSX.Element;
declare namespace CharacterCounter {
    var displayName: string;
}
declare const sendButtonVariants: (props?: ({
    variant?: "primary" | "subtle" | null | undefined;
    canSend?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SendButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof sendButtonVariants> {
    isLoading?: boolean;
}
/**
 * Send button with loading state.
 */
declare const SendButton: React$1.ForwardRefExoticComponent<SendButtonProps & React$1.RefAttributes<HTMLButtonElement>>;
interface MessageComposerProps {
    /** Called when a message is sent */
    onSend: (message: NewMessage) => void | Promise<void>;
    /** Called when the user starts typing */
    onTypingStart?: () => void;
    /** Called when the user stops typing */
    onTypingStop?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Maximum message length */
    maxLength?: number;
    /** Show character count */
    showCharacterCount?: boolean;
    /** Whether the composer is disabled */
    disabled?: boolean;
    /** Whether a message is currently being sent */
    isSending?: boolean;
    /** Show attachment picker */
    showAttachmentPicker?: boolean;
    /** Show camera button (mobile) */
    showCameraButton?: boolean;
    /** Accepted file types */
    acceptedFileTypes?: string[];
    /** Maximum file size */
    maxFileSize?: number;
    /** Maximum number of attachments */
    maxAttachments?: number;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    /** Auto-focus the input */
    autoFocus?: boolean;
    /** Reply-to message reference */
    replyTo?: {
        id: string;
        content: string;
        senderName: string;
    } | null;
    /** Called when reply is cancelled */
    onCancelReply?: () => void;
    /** Visual variant - 'default' shows border-t, 'minimal' has no border */
    variant?: 'default' | 'minimal';
    /** Additional class name */
    className?: string;
}
/**
 * A message input component with attachment support and send button.
 *
 * @example
 * ```tsx
 * <MessageComposer
 *   onSend={handleSend}
 *   placeholder="Type a message..."
 *   showAttachmentPicker
 *   maxLength={1600}
 * />
 * ```
 */
declare const MessageComposer: React$1.ForwardRefExoticComponent<MessageComposerProps & React$1.RefAttributes<HTMLTextAreaElement>>;

interface SuggestedActionsProps {
    /** Available suggested actions */
    actions: AISuggestedAction[];
    /** Callback when an action is selected */
    onSelect: (action: AISuggestedAction) => void;
    /** Additional class name */
    className?: string;
}
declare function SuggestedActions({ actions, onSelect, className, }: SuggestedActionsProps): react_jsx_runtime.JSX.Element;
declare const chatVariants: (props?: ({
    variant?: "default" | "embedded" | "floating" | null | undefined;
    size?: "sm" | "md" | "lg" | "xl" | "full" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AIChatProps extends VariantProps<typeof chatVariants>, AIChatCallbacks {
    /** Chat session data */
    session?: AIChatSession;
    /** Messages to display (alternative to session) */
    messages?: AIMessage[];
    /** Whether the AI is generating */
    isGenerating?: boolean;
    /** Current user name */
    userName?: string;
    /** Title for the chat header */
    title?: string;
    /** Suggested actions */
    suggestions?: AISuggestedAction[];
    /** Whether to show the header */
    showHeader?: boolean;
    /** Whether to show timestamps */
    showTimestamps?: boolean;
    /** Placeholder for input */
    inputPlaceholder?: string;
    /** Height constraint */
    height?: string | number;
    /** Props to pass to the MessageComposer */
    composerProps?: Partial<MessageComposerProps>;
    /** Callback when close button is clicked (shows close button when provided) */
    onClose?: () => void;
    /** Additional class name */
    className?: string;
}
/**
 * A complete AI chat interface with message history, input, and tool call support.
 * Reuses MessageComposer from the Messaging components for consistent UX.
 */
declare function AIChat({ session, messages: messagesProp, isGenerating: isGeneratingProp, userName, title, suggestions, showHeader, showTimestamps, inputPlaceholder, variant, size, height, composerProps, className, onSendMessage, onToolCall: _onToolCall, onResourceClick, onSuggestedAction, onCancel, onClear, onClose, }: AIChatProps): react_jsx_runtime.JSX.Element;

interface AIChatTriggerProps {
    /** Whether the chat is open */
    isOpen?: boolean;
    /** Callback when clicked */
    onClick?: () => void;
    /** Pulse animation to draw attention */
    pulse?: boolean;
    /** Badge count for notifications */
    badge?: number;
    /** Position of the button */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /** Additional class name */
    className?: string;
}
declare function AIChatTrigger({ isOpen, onClick, pulse, badge, position, className, }: AIChatTriggerProps): react_jsx_runtime.JSX.Element;
interface AIChatModalProps extends Omit<AIChatProps, 'variant' | 'size'> {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onOpenChange: (open: boolean) => void;
    /** Position of the modal */
    position?: 'bottom-right' | 'bottom-left' | 'center';
    /** Width of the modal */
    width?: string | number;
    /** Height of the modal */
    height?: string | number;
    /** Additional class name for the modal */
    modalClassName?: string;
}
/**
 * A modal chat window that can be positioned in the corner or center.
 */
declare function AIChatModal({ open, onOpenChange, position, width, height, modalClassName, ...chatProps }: AIChatModalProps): react_jsx_runtime.JSX.Element | null;
interface FloatingAIChatProps extends Omit<AIChatModalProps, 'open' | 'onOpenChange'> {
    /** Initial open state */
    defaultOpen?: boolean;
    /** Controlled open state */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Button position */
    buttonPosition?: AIChatTriggerProps['position'];
    /** Show pulse animation */
    pulse?: boolean;
}
/**
 * A complete floating AI chat with trigger button and modal.
 */
declare function FloatingAIChat({ defaultOpen, open: controlledOpen, onOpenChange: controlledOnOpenChange, buttonPosition, position, pulse, ...chatProps }: FloatingAIChatProps): react_jsx_runtime.JSX.Element;

interface AppHeaderProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether the header is sticky (default: true) */
    sticky?: boolean;
    /** Whether to show border (default: true) */
    bordered?: boolean;
    /** Custom height class (default: 'h-16') */
    height?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeader({ children, className, sticky, bordered, height, 'data-testid': testId, }: AppHeaderProps): React__default.JSX.Element;
interface AppHeaderSectionProps {
    children: ReactNode;
    /** Section alignment */
    align?: 'left' | 'center' | 'right';
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderSection({ children, align, className, }: AppHeaderSectionProps): React__default.JSX.Element;
interface AppHeaderTitleProps {
    children: ReactNode;
    /** Optional subtitle */
    subtitle?: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderTitle({ children, subtitle, className, }: AppHeaderTitleProps): React__default.JSX.Element;
interface AppHeaderActionsProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderActions({ children, className, }: AppHeaderActionsProps): React__default.JSX.Element;
interface AppHeaderDividerProps {
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderDivider({ className, }: AppHeaderDividerProps): React__default.JSX.Element;
interface AppHeaderIconButtonProps {
    /** Button icon */
    icon: ReactNode;
    /** Accessible label */
    label: string;
    /** Click handler */
    onClick?: () => void;
    /** Badge count */
    badge?: number;
    /** Whether the button is active */
    isActive?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderIconButton({ icon, label, onClick, badge, isActive, className, 'data-testid': testId, }: AppHeaderIconButtonProps): React__default.JSX.Element;
interface AppHeaderSearchProps {
    /** Click handler to open search */
    onClick?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether to show on mobile (default: false) */
    showOnMobile?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderSearch({ onClick, placeholder, showOnMobile, className, 'data-testid': testId, }: AppHeaderSearchProps): React__default.JSX.Element;
interface AppHeaderUserMenuProps {
    /** User's name */
    name: string;
    /** User's email or subtitle */
    email?: string;
    /** User's avatar URL */
    avatarUrl?: string;
    /** Fallback initials when no avatar */
    initials?: string;
    /** Whether the menu is open */
    isOpen?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderUserMenu({ name, email, avatarUrl, initials, isOpen, onClick, className, 'data-testid': testId, }: AppHeaderUserMenuProps): React__default.JSX.Element;

interface CommandPaletteItem {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Optional description text */
    description?: string;
    /** Category/group for grouping items */
    category?: string;
    /** Custom icon element */
    icon?: ReactNode;
    /** Keyboard shortcut hint */
    shortcut?: string;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Additional metadata for filtering/display */
    metadata?: Record<string, unknown>;
}
interface CommandPaletteCategory {
    /** Unique identifier for the category */
    id: string;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: ReactNode;
    /** Optional color class for styling */
    colorClass?: string;
}
interface CommandPaletteContextValue {
    /** Whether the palette is currently open */
    isOpen: boolean;
    /** Open the command palette */
    open: () => void;
    /** Close the command palette */
    close: () => void;
    /** Toggle the command palette */
    toggle: () => void;
    /** Current search query */
    query: string;
    /** Set the search query */
    setQuery: (query: string) => void;
    /** Currently selected item index */
    selectedIndex: number;
    /** Set the selected item index */
    setSelectedIndex: (index: number) => void;
    /** Active category filter */
    activeCategory: string | null;
    /** Set the active category filter */
    setActiveCategory: (category: string | null) => void;
    /** Register items (used by consumers) */
    items: CommandPaletteItem[];
    /** Register categories (used by consumers) */
    categories: CommandPaletteCategory[];
    /** Set items */
    setItems: (items: CommandPaletteItem[]) => void;
    /** Set categories */
    setCategories: (categories: CommandPaletteCategory[]) => void;
}
interface CommandPaletteProviderProps {
    children: ReactNode;
    /** Whether to enable the Cmd/Ctrl+K shortcut (default: true) */
    enableShortcut?: boolean;
    /** Custom event name for opening (for integration with other systems) */
    customEventName?: string;
}
declare function CommandPaletteProvider({ children, enableShortcut, customEventName, }: CommandPaletteProviderProps): React__default.JSX.Element;
/**
 * Hook to access the command palette context.
 * Must be used within a CommandPaletteProvider.
 *
 * @example
 * ```tsx
 * function SearchButton() {
 *   const { open } = useCommandPalette();
 *   return <button onClick={open}>Search (⌘K)</button>;
 * }
 * ```
 */
declare function useCommandPalette(): CommandPaletteContextValue;

interface CommandPaletteProps {
    /** Placeholder text for search input */
    placeholder?: string;
    /** Whether search is loading */
    isLoading?: boolean;
    /** Called when an item is selected */
    onSelect?: (item: CommandPaletteItem) => void;
    /** Custom empty state content */
    emptyState?: React__default.ReactNode;
    /** Custom render function for items */
    renderItem?: (item: CommandPaletteItem, options: {
        isSelected: boolean;
        index: number;
    }) => React__default.ReactNode;
    /** Custom footer content */
    footer?: React__default.ReactNode;
    /** Additional CSS classes for the modal */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function CommandPalette({ placeholder, isLoading, onSelect, emptyState, renderItem, footer, className, 'data-testid': testId, }: CommandPaletteProps): React__default.JSX.Element | null;
interface CommandPaletteTriggerProps {
    /** Button content (default shows search icon and keyboard hint) */
    children?: React__default.ReactNode;
    /** Placeholder text to show in the trigger */
    placeholder?: string;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function CommandPaletteTrigger({ children, placeholder, className, 'data-testid': testId, }: CommandPaletteTriggerProps): React__default.JSX.Element;

/**
 * Types for the DocumentScanner component
 */
/**
 * Accepted file types for document scanning
 */
declare const DEFAULT_ACCEPTED_FILE_TYPES: readonly ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp", "application/pdf"];
/**
 * Default maximum file size in MB
 */
declare const DEFAULT_MAX_FILE_SIZE_MB = 10;
/**
 * Scanner source type
 */
type ScannerSource = 'upload' | 'camera' | 'webcam';
/**
 * Scanner state
 */
type ScannerState = 'idle' | 'capturing' | 'preview' | 'processing' | 'success' | 'error';
/**
 * File with preview URL
 */
interface PreviewFile {
    /** The actual file object */
    file: File;
    /** Generated preview URL for display */
    previewUrl: string;
    /** Source of the file (upload, camera, or webcam) */
    source: ScannerSource;
    /** Unique ID for the file */
    id: string;
}
/**
 * Validation error
 */
interface ValidationError {
    /** File that caused the error */
    file: File;
    /** Error type */
    type: 'size' | 'type' | 'unknown';
    /** Human-readable error message */
    message: string;
}
/**
 * Camera permissions state
 */
type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unavailable';
/**
 * DocumentScanner component props
 */
interface DocumentScannerProps {
    /**
     * Callback function that processes the scanned files.
     * Should return extracted data from the AI vision endpoint.
     */
    onScan: (files: File[]) => Promise<unknown>;
    /**
     * Callback function called with the extracted data after successful processing.
     */
    onResult: (data: unknown) => void;
    /**
     * Allow multiple file selection/capture.
     * @default false
     */
    multiple?: boolean;
    /**
     * Accepted file MIME types.
     * @default ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
     */
    acceptedFileTypes?: string[];
    /**
     * Maximum file size in megabytes.
     * @default 10
     */
    maxFileSizeMb?: number;
    /**
     * Disable the entire scanner.
     * @default false
     */
    disabled?: boolean;
    /**
     * Enable webcam capture on desktop.
     * @default true
     */
    enableWebcam?: boolean;
    /**
     * Enable camera capture on mobile.
     * @default true
     */
    enableCamera?: boolean;
    /**
     * Custom title text.
     * @default "Scan your document"
     */
    title?: string;
    /**
     * Custom description text.
     * @default "Upload a file, take a photo, or use your webcam"
     */
    description?: string;
    /**
     * Additional CSS classes.
     */
    className?: string;
    /**
     * Callback when an error occurs during file validation.
     */
    onValidationError?: (errors: ValidationError[]) => void;
    /**
     * Callback when the scanner state changes.
     */
    onStateChange?: (state: ScannerState) => void;
}
/**
 * WebcamModal component props
 */
interface WebcamModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback to close the modal */
    onOpenChange: (open: boolean) => void;
    /** Callback when a photo is captured */
    onCapture: (file: File) => void;
    /** Camera permission state */
    permission: CameraPermission;
    /** Request camera permission */
    onRequestPermission: () => Promise<void>;
    /** Enable auto-capture when document is detected (default: true) */
    enableAutoCapture?: boolean;
}
/**
 * FilePreview component props
 */
interface FilePreviewProps {
    /** Files to preview */
    files: PreviewFile[];
    /** Callback to remove a file */
    onRemove: (id: string) => void;
    /** Whether removal is disabled */
    disabled?: boolean;
}
/**
 * DropZone component props
 */
interface DropZoneProps {
    /** Callback when files are dropped or selected */
    onFilesSelected: (files: FileList) => void;
    /** Accepted file types */
    acceptedFileTypes: string[];
    /** Allow multiple file selection */
    multiple: boolean;
    /** Whether the dropzone is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Children content */
    children?: React.ReactNode;
}

/**
 * DropZone component for drag-and-drop file uploads
 *
 * @example
 * ```tsx
 * <DropZone
 *   onFilesSelected={handleFiles}
 *   acceptedFileTypes={['image/jpeg', 'image/png']}
 *   multiple={false}
 * >
 *   <p>Drop files here or click to browse</p>
 * </DropZone>
 * ```
 */
declare function DropZone({ onFilesSelected, acceptedFileTypes, multiple, disabled, className, children, }: DropZoneProps): react_jsx_runtime.JSX.Element;
declare namespace DropZone {
    var displayName: string;
}

/**
 * FilePreview component for displaying uploaded/captured files
 *
 * @example
 * ```tsx
 * <FilePreview
 *   files={previewFiles}
 *   onRemove={(id) => removeFile(id)}
 * />
 * ```
 */
declare function FilePreview({ files, onRemove, disabled }: FilePreviewProps): react_jsx_runtime.JSX.Element | null;
declare namespace FilePreview {
    var displayName: string;
}

/**
 * WebcamModal component for capturing photos using device webcam
 *
 * @example
 * ```tsx
 * <WebcamModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onCapture={(file) => handleCapture(file)}
 *   permission={permission}
 *   onRequestPermission={requestPermission}
 * />
 * ```
 */
declare function WebcamModal({ open, onOpenChange, onCapture, enableAutoCapture, }: Omit<WebcamModalProps, 'permission' | 'onRequestPermission'> & {
    /** Enable auto-capture when document is detected */
    enableAutoCapture?: boolean;
}): react_jsx_runtime.JSX.Element;
declare namespace WebcamModal {
    var displayName: string;
}

/**
 * Hook options for useFileUpload
 */
interface UseFileUploadOptions {
    /** Accepted file MIME types */
    acceptedFileTypes?: string[];
    /** Maximum file size in MB */
    maxFileSizeMb?: number;
    /** Allow multiple files */
    multiple?: boolean;
    /** Callback for validation errors */
    onValidationError?: (errors: ValidationError[]) => void;
}
/**
 * Hook return type for useFileUpload
 */
interface UseFileUploadReturn {
    /** Current preview files */
    files: PreviewFile[];
    /** Add files from FileList */
    addFiles: (fileList: FileList, source?: ScannerSource) => void;
    /** Add a single file */
    addFile: (file: File, source?: ScannerSource) => void;
    /** Remove a file by ID */
    removeFile: (id: string) => void;
    /** Clear all files */
    clearFiles: () => void;
    /** Get raw File objects */
    getFiles: () => File[];
    /** Whether there are files selected */
    hasFiles: boolean;
}
/**
 * Hook for managing file uploads with validation and preview URLs
 *
 * @example
 * ```tsx
 * const {
 *   files,
 *   addFiles,
 *   removeFile,
 *   clearFiles,
 *   hasFiles,
 * } = useFileUpload({
 *   acceptedFileTypes: ['image/jpeg', 'image/png'],
 *   maxFileSizeMb: 5,
 *   multiple: true,
 *   onValidationError: (errors) => console.error(errors),
 * });
 * ```
 */
declare function useFileUpload({ acceptedFileTypes, maxFileSizeMb, multiple, onValidationError, }?: UseFileUploadOptions): UseFileUploadReturn;

/**
 * Hook options for useCamera
 */
interface UseCameraOptions {
    /** Preferred facing mode for mobile cameras */
    facingMode?: 'user' | 'environment';
    /** Ideal video width */
    width?: number;
    /** Ideal video height */
    height?: number;
}
/**
 * Hook return type for useCamera
 */
interface UseCameraReturn {
    /** Current camera permission state */
    permission: CameraPermission;
    /** Video stream */
    stream: MediaStream | null;
    /** Ref to attach to video element */
    videoRef: React$1.RefObject<HTMLVideoElement | null>;
    /** Whether the camera is ready */
    isReady: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Start the camera */
    startCamera: () => Promise<void>;
    /** Stop the camera */
    stopCamera: () => void;
    /** Capture a photo from the video stream */
    capturePhoto: () => File | null;
    /** Switch between front and back camera */
    switchCamera: () => void;
    /** Current facing mode */
    currentFacingMode: 'user' | 'environment';
}
/**
 * Hook for managing camera access and photo capture
 *
 * @example
 * ```tsx
 * const {
 *   permission,
 *   videoRef,
 *   isReady,
 *   startCamera,
 *   stopCamera,
 *   capturePhoto,
 * } = useCamera({
 *   facingMode: 'environment',
 *   width: 1920,
 *   height: 1080,
 * });
 * ```
 */
declare function useCamera({ facingMode: initialFacingMode, width, height, }?: UseCameraOptions): UseCameraReturn;

/**
 * DocumentScanner - A comprehensive component for scanning documents, IDs, and cards
 *
 * Supports:
 * - File upload (drag-and-drop or click to browse)
 * - Camera capture on mobile devices
 * - Webcam capture on desktop devices
 * - AI-powered document scanning and data extraction
 *
 * @example
 * ```tsx
 * <DocumentScanner
 *   onScan={async (files) => {
 *     const response = await fetch('/api/scan', {
 *       method: 'POST',
 *       body: createFormData(files),
 *     });
 *     return response.json();
 *   }}
 *   onResult={(data) => {
 *     console.log('Extracted data:', data);
 *   }}
 *   title="Scan your driver's license"
 *   description="Upload a photo or use your camera to scan"
 * />
 * ```
 */
declare function DocumentScanner({ onScan, onResult, multiple, acceptedFileTypes, maxFileSizeMb, disabled, enableWebcam, enableCamera, title, description, className, onValidationError, onStateChange, }: DocumentScannerProps): react_jsx_runtime.JSX.Element;
declare namespace DocumentScanner {
    var displayName: string;
}

/**
 * useDocumentDetection hook
 *
 * Provides real-time quality detection for auto-capture functionality.
 * Uses simple focus (blur) detection and stability tracking.
 * Designed to be forgiving and easy to use.
 */
/**
 * Point in 2D space
 */
interface Point {
    x: number;
    y: number;
}
/**
 * Document boundary corners (clockwise from top-left)
 */
interface DocumentBoundary {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
}
/**
 * Detection quality metrics
 */
interface DetectionMetrics {
    /** Focus score (Laplacian variance) - higher is sharper */
    focusScore: number;
    /** Whether the image is considered in-focus */
    isInFocus: boolean;
    /** Brightness score (0-255 average) */
    brightness: number;
    /** Whether brightness is acceptable */
    isBrightnessOk: boolean;
    /** Detected document boundary (if found) */
    boundary: DocumentBoundary | null;
    /** Whether a document boundary was detected */
    isDocumentDetected: boolean;
    /** Coverage percentage of detected document (0-100) */
    documentCoverage: number;
    /** Whether the document has been stable for sufficient time */
    isStable: boolean;
    /** Stability duration in milliseconds */
    stabilityDuration: number;
}
/**
 * Detection state
 */
interface DetectionState {
    /** Whether detection is currently running */
    isDetecting: boolean;
    /** Current detection metrics */
    metrics: DetectionMetrics;
    /** Whether all conditions are met for auto-capture */
    isReadyForCapture: boolean;
    /** Auto-capture countdown (seconds remaining, 0 when not counting) */
    captureCountdown: number;
    /** Error message if detection failed */
    error: string | null;
}
/**
 * Detection configuration
 */
interface DetectionConfig {
    /** Minimum focus score to consider in-focus (default: 15) */
    minFocusScore?: number;
    /** Minimum brightness (0-255, default: 30) */
    minBrightness?: number;
    /** Maximum brightness (0-255, default: 240) */
    maxBrightness?: number;
    /** Minimum document coverage percentage (default: 10) - not used in simplified mode */
    minDocumentCoverage?: number;
    /** Maximum document coverage percentage (default: 95) - not used in simplified mode */
    maxDocumentCoverage?: number;
    /** Stability duration required before capture (ms, default: 500) */
    stabilityDuration?: number;
    /** Auto-capture countdown duration (seconds, default: 2) */
    captureCountdown?: number;
    /** Detection frame rate (fps, default: 5) */
    detectionFps?: number;
    /** Whether to enable auto-capture (default: true) */
    enableAutoCapture?: boolean;
}
/**
 * Hook for document detection with auto-capture
 */
declare function useDocumentDetection(videoRef: React.RefObject<HTMLVideoElement | null>, config?: DetectionConfig, onAutoCapture?: () => void): DetectionState & {
    startDetection: () => void;
    stopDetection: () => void;
    resetDetection: () => void;
};

interface DocumentDetectionOverlayProps {
    /** Detection metrics from useDocumentDetection */
    metrics: DetectionMetrics;
    /** Whether all conditions are met for capture */
    isReadyForCapture: boolean;
    /** Countdown value (seconds remaining, 0 when not counting) */
    captureCountdown: number;
    /** Video element dimensions */
    videoDimensions: {
        width: number;
        height: number;
    };
    /** Whether to show detailed metrics (debug mode) */
    showDetailedMetrics?: boolean;
}
/**
 * Main overlay component
 */
declare function DocumentDetectionOverlay({ metrics, isReadyForCapture, captureCountdown, videoDimensions: _videoDimensions, showDetailedMetrics, }: DocumentDetectionOverlayProps): react_jsx_runtime.JSX.Element;

interface MessageStatusIconProps {
    status: MessageStatus;
    className?: string;
}
/**
 * Visual status indicator for messages (checkmarks).
 */
declare function MessageStatusIcon({ status, className }: MessageStatusIconProps): react_jsx_runtime.JSX.Element;
interface ReadReceiptIndicatorProps {
    /** Read receipts to display */
    receipts: ReadReceipt[];
    /** Maximum avatars to show before +N */
    maxAvatars?: number;
    /** Size of avatars */
    size?: 'xs' | 'sm';
    className?: string;
}
/**
 * Displays read receipt avatars for group conversations.
 */
declare function ReadReceiptIndicator({ receipts, maxAvatars, size, className, }: ReadReceiptIndicatorProps): react_jsx_runtime.JSX.Element | null;
interface AttachmentPreviewProps {
    attachment: MessageAttachment;
    onClick?: () => void;
    className?: string;
}
/**
 * Renders an attachment preview within a message bubble.
 */
declare function AttachmentPreview({ attachment, onClick, className, }: AttachmentPreviewProps): react_jsx_runtime.JSX.Element;
/**
 * Format file size in human-readable format.
 */
declare function formatFileSize(bytes: number): string;
declare const bubbleVariants: (props?: ({
    variant?: "system" | "outgoing" | "incoming" | null | undefined;
    status?: "sending" | "sent" | "delivered" | "read" | "failed" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface MessageBubbleProps extends Omit<React$1.HTMLAttributes<HTMLDivElement>, 'id'>, VariantProps<typeof bubbleVariants> {
    /** The message to display */
    message: Message;
    /** Whether to show the sender's avatar */
    showAvatar?: boolean;
    /** Whether to show the sender's name (for group chats) */
    showSenderName?: boolean;
    /** Whether to show the timestamp */
    showTimestamp?: boolean;
    /** Whether to show message status */
    showStatus?: boolean;
    /** Whether to show read receipts */
    showReadReceipts?: boolean;
    /** Called when retry is clicked for failed messages */
    onRetry?: () => void;
    /** Called when an attachment is clicked */
    onAttachmentClick?: (attachment: MessageAttachment) => void;
    /** Whether this is the current user's message */
    isOutgoing?: boolean;
    /** Custom timestamp formatter */
    formatTimestamp?: (timestamp: Date | string) => string;
}
/**
 * A message bubble component for displaying individual messages.
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isOutgoing={message.sender.isCurrentUser}
 *   showAvatar
 *   showTimestamp
 * />
 * ```
 */
declare const MessageBubble: React$1.ForwardRefExoticComponent<MessageBubbleProps & React$1.RefAttributes<HTMLDivElement>>;

/**
 * Groups messages by date.
 */
declare function groupMessagesByDate(messages: Message[]): MessageGroup[];
/**
 * Format date label for message grouping.
 */
declare function formatDateLabel(date: Date): string;
/**
 * Check if two messages are from the same sender within a time threshold.
 */
declare function isSameSenderGroup(prev: Message | undefined, current: Message, thresholdMinutes?: number): boolean;
interface SkeletonMessageProps {
    isOutgoing?: boolean;
    showAvatar?: boolean;
    className?: string;
}
/**
 * A skeleton placeholder for loading messages.
 */
declare function SkeletonMessage({ isOutgoing, showAvatar, className, }: SkeletonMessageProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonMessage {
    var displayName: string;
}
interface TypingIndicatorProps {
    typingState: TypingState;
    className?: string;
}
/**
 * Displays who is currently typing.
 */
declare function TypingIndicator({ typingState, className }: TypingIndicatorProps): react_jsx_runtime.JSX.Element | null;
declare namespace TypingIndicator {
    var displayName: string;
}
interface DateSeparatorProps {
    label: string;
    className?: string;
}
/**
 * A visual separator showing the date between message groups.
 */
declare function DateSeparator({ label, className }: DateSeparatorProps): react_jsx_runtime.JSX.Element;
declare namespace DateSeparator {
    var displayName: string;
}
interface EmptyStateProps {
    /** Custom title */
    title?: string;
    /** Custom description */
    description?: string;
    /** Custom icon */
    icon?: React$1.ReactNode;
    /** Action button */
    action?: React$1.ReactNode;
    className?: string;
}
/**
 * Empty state shown when there are no messages.
 */
declare function EmptyState({ title, description, icon, action, className, }: EmptyStateProps): react_jsx_runtime.JSX.Element;
declare namespace EmptyState {
    var displayName: string;
}
interface LoadMoreButtonProps {
    isLoading?: boolean;
    onClick: () => void;
    className?: string;
}
/**
 * Button to load more message history.
 */
declare function LoadMoreButton({ isLoading, onClick, className, }: LoadMoreButtonProps): react_jsx_runtime.JSX.Element;
declare namespace LoadMoreButton {
    var displayName: string;
}
interface MessageListProps {
    /** Array of messages to display */
    messages: Message[];
    /** Current user for determining outgoing messages */
    currentUser: MessageParticipant;
    /** Whether messages are loading */
    isLoading?: boolean;
    /** Whether more messages are available */
    hasMore?: boolean;
    /** Whether more messages are being loaded */
    isLoadingMore?: boolean;
    /** Typing indicator state */
    typingState?: TypingState;
    /** Show avatars for incoming messages */
    showAvatars?: boolean;
    /** Show sender names (for group conversations) */
    showSenderNames?: boolean;
    /** Group messages by date */
    groupByDate?: boolean;
    /** Callback when load more is triggered */
    onLoadMore?: () => void;
    /** Callback when a message action (retry) is triggered */
    onRetryMessage?: (messageId: string) => void;
    /** Callback when an attachment is clicked */
    onAttachmentClick?: (attachment: MessageAttachment, message: Message) => void;
    /** Custom empty state */
    emptyState?: React$1.ReactNode;
    /** Custom timestamp formatter */
    formatTimestamp?: (timestamp: Date | string) => string;
    /** Additional class name */
    className?: string;
    /** Auto-scroll behavior */
    autoScroll?: 'always' | 'onNewMessage' | 'manual';
}
/**
 * A scrollable list of messages with date grouping, auto-scroll, and loading states.
 *
 * @example
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   currentUser={currentUser}
 *   typingState={typingState}
 *   onLoadMore={handleLoadMore}
 *   showAvatars
 *   groupByDate
 * />
 * ```
 */
declare const MessageList: React$1.ForwardRefExoticComponent<MessageListProps & React$1.RefAttributes<HTMLDivElement>>;

/**
 * Get file type from MIME type.
 */
declare function getFileType(mimeType: string): AttachmentType;
/**
 * Validate file type and size.
 */
declare function validateFile(file: File, acceptedTypes?: string[], maxSize?: number): {
    valid: boolean;
    error?: string;
};
/**
 * Generate a unique ID for attachments.
 */
declare function generateAttachmentId(): string;
interface AttachmentPreviewItemProps {
    /** The attachment to preview */
    attachment: {
        id: string;
        file: File;
        previewUrl?: string;
        type: AttachmentType;
        state: AttachmentState;
        progress?: number;
        error?: string;
    };
    /** Called when remove is clicked */
    onRemove: () => void;
    /** Called when retry is clicked */
    onRetry?: () => void;
    className?: string;
}
/**
 * Preview item for a pending attachment.
 */
declare function AttachmentPreviewItem({ attachment, onRemove, onRetry, className, }: AttachmentPreviewItemProps): react_jsx_runtime.JSX.Element;
declare namespace AttachmentPreviewItem {
    var displayName: string;
}
interface AttachmentPickerProps {
    /** Called when files are selected */
    onFilesSelected: (files: File[]) => void;
    /** Accepted file types (MIME types or extensions) */
    acceptedTypes?: string[];
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Whether multiple files can be selected */
    multiple?: boolean;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    className?: string;
    children?: React$1.ReactNode;
}
/**
 * A button/trigger component for selecting attachments.
 */
declare const AttachmentPicker: React$1.ForwardRefExoticComponent<AttachmentPickerProps & React$1.RefAttributes<HTMLInputElement>>;
interface DragDropZoneProps {
    /** Called when files are dropped */
    onFilesDropped: (files: File[]) => void;
    /** Accepted file types */
    acceptedTypes?: string[];
    /** Maximum file size */
    maxFileSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Whether the zone is disabled */
    disabled?: boolean;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    /** Children to render inside the zone */
    children: React$1.ReactNode;
    className?: string;
}
/**
 * A wrapper component that accepts drag-and-drop files.
 */
declare function DragDropZone({ onFilesDropped, acceptedTypes, maxFileSize, maxFiles, disabled, onError, children, className, }: DragDropZoneProps): react_jsx_runtime.JSX.Element;
declare namespace DragDropZone {
    var displayName: string;
}
interface CameraButtonProps {
    /** Called when a photo is captured */
    onCapture: (file: File) => void;
    /** Whether to use front camera */
    useFrontCamera?: boolean;
    /** Whether the button is disabled */
    disabled?: boolean;
    className?: string;
}
/**
 * Button to capture photos from camera (mobile).
 */
declare function CameraButton({ onCapture, useFrontCamera, disabled, className, }: CameraButtonProps): react_jsx_runtime.JSX.Element;
declare namespace CameraButton {
    var displayName: string;
}

declare const headerVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ConversationHeaderProps extends React$1.HTMLAttributes<HTMLElement>, VariantProps<typeof headerVariants> {
    /** The conversation to display */
    conversation?: Conversation;
    /** Custom title (overrides conversation name) */
    title?: string;
    /** Custom subtitle */
    subtitle?: string;
    /** Avatar URL */
    avatarUrl?: string;
    /** Participant for direct messages */
    participant?: MessageParticipant;
    /** Show online status indicator */
    showOnlineStatus?: boolean;
    /** Show back button (mobile) */
    showBackButton?: boolean;
    /** Called when back button is clicked */
    onBack?: () => void;
    /** Additional actions (menu, call, etc.) */
    actions?: React$1.ReactNode;
    /** Custom left content */
    leftContent?: React$1.ReactNode;
    /** Custom right content */
    rightContent?: React$1.ReactNode;
}
/**
 * Get display title for a conversation.
 */
declare function getConversationTitle(conversation?: Conversation, participant?: MessageParticipant): string;
/**
 * Get subtitle for a conversation.
 */
declare function getConversationSubtitle(conversation?: Conversation, participant?: MessageParticipant, showOnlineStatus?: boolean): string | undefined;
/**
 * Format last seen time.
 */
declare function formatLastSeen(date: Date): string;
/**
 * Header component for a conversation/message thread.
 *
 * @example
 * ```tsx
 * <ConversationHeader
 *   conversation={conversation}
 *   showBackButton
 *   onBack={() => navigate('/conversations')}
 *   actions={<IconButton icon={<MoreIcon />} />}
 * />
 * ```
 */
declare const ConversationHeader: React$1.ForwardRefExoticComponent<ConversationHeaderProps & React$1.RefAttributes<HTMLElement>>;
interface ConversationListItemProps extends Omit<React$1.HTMLAttributes<HTMLButtonElement>, 'onSelect'> {
    /** The conversation to display */
    conversation: Conversation;
    /** Whether this item is selected */
    isSelected?: boolean;
    /** Called when the item is clicked */
    onSelect?: (conversation: Conversation) => void;
}
/**
 * A list item for displaying a conversation in a list.
 */
declare const ConversationListItem: React$1.ForwardRefExoticComponent<ConversationListItemProps & React$1.RefAttributes<HTMLButtonElement>>;
interface ConversationListSkeletonProps {
    count?: number;
    className?: string;
}
/**
 * Skeleton loading state for conversation list.
 */
declare function ConversationListSkeleton({ count, className, }: ConversationListSkeletonProps): react_jsx_runtime.JSX.Element;
declare namespace ConversationListSkeleton {
    var displayName: string;
}

interface LightboxModalProps {
    /** The attachment to display */
    attachment: MessageAttachment | null;
    /** Called when the modal is closed */
    onClose: () => void;
}
/**
 * Full-screen lightbox for viewing media attachments.
 */
declare function LightboxModal({ attachment, onClose }: LightboxModalProps): react_jsx_runtime.JSX.Element | null;
declare namespace LightboxModal {
    var displayName: string;
}
interface MessageThreadProps {
    /** The conversation being displayed */
    conversation?: Conversation;
    /** Array of messages in the thread */
    messages: Message[];
    /** Current user for determining message direction */
    currentUser: MessageParticipant;
    /** Typing indicator state */
    typingState?: TypingState;
    /** Whether messages are loading */
    isLoading?: boolean;
    /** Whether more messages are available */
    hasMore?: boolean;
    /** Whether more messages are being loaded */
    isLoadingMore?: boolean;
    /** Whether a message is being sent */
    isSending?: boolean;
    /** Event handlers */
    eventHandlers?: MessagingEventHandlers;
    /** Show header */
    showHeader?: boolean;
    /** Show back button in header */
    showBackButton?: boolean;
    /** Called when back is clicked */
    onBack?: () => void;
    /** Custom header actions */
    headerActions?: React$1.ReactNode;
    /** Composer placeholder */
    placeholder?: string;
    /** Maximum message length */
    maxMessageLength?: number;
    /** Show character count */
    showCharacterCount?: boolean;
    /** Show attachment picker */
    showAttachmentPicker?: boolean;
    /** Show camera button */
    showCameraButton?: boolean;
    /** Accepted file types */
    acceptedFileTypes?: string[];
    /** Maximum file size */
    maxFileSize?: number;
    /** Maximum attachments */
    maxAttachments?: number;
    /** Show avatars in message list */
    showAvatars?: boolean;
    /** Show sender names (group chats) */
    showSenderNames?: boolean;
    /** Group messages by date */
    groupByDate?: boolean;
    /** Custom empty state */
    emptyState?: React$1.ReactNode;
    /** Custom timestamp formatter */
    formatTimestamp?: (timestamp: Date | string) => string;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    /** Additional class name */
    className?: string;
}
/**
 * A complete message thread component combining header, message list, and composer.
 *
 * @example
 * ```tsx
 * <MessageThread
 *   conversation={conversation}
 *   messages={messages}
 *   currentUser={currentUser}
 *   typingState={typingState}
 *   eventHandlers={{
 *     onSendMessage: handleSend,
 *     onLoadMore: handleLoadMore,
 *     onRetryMessage: handleRetry,
 *   }}
 *   showHeader
 *   showBackButton
 *   onBack={() => navigate('/conversations')}
 * />
 * ```
 */
declare const MessageThread: React$1.ForwardRefExoticComponent<MessageThreadProps & React$1.RefAttributes<HTMLDivElement>>;
interface MessagingSplitViewProps {
    /** Conversation list content */
    conversationList: React$1.ReactNode;
    /** Message thread content */
    messageThread: React$1.ReactNode;
    /** Whether a conversation is selected */
    hasSelectedConversation?: boolean;
    /** Width of the conversation list on desktop */
    listWidth?: string | number;
    /** Breakpoint for mobile view */
    mobileBreakpoint?: 'sm' | 'md' | 'lg';
    /** Additional class name */
    className?: string;
}
/**
 * Split view container for desktop with responsive mobile behavior.
 *
 * @example
 * ```tsx
 * <MessagingSplitView
 *   conversationList={<ConversationList />}
 *   messageThread={<MessageThread />}
 *   hasSelectedConversation={!!selectedConversation}
 * />
 * ```
 */
declare function MessagingSplitView({ conversationList, messageThread, hasSelectedConversation, listWidth, mobileBreakpoint, className, }: MessagingSplitViewProps): react_jsx_runtime.JSX.Element;
declare namespace MessagingSplitView {
    var displayName: string;
}

interface UseMessagesOptions {
    /** Initial messages */
    initialMessages?: Message[];
    /** Current user */
    currentUser: MessageParticipant;
    /** Called when a message is sent */
    onSend?: (message: NewMessage) => Promise<Message>;
    /** Called when a message is retried */
    onRetry?: (messageId: string) => Promise<void>;
    /** Called when messages need to be loaded */
    onLoadMore?: () => Promise<Message[]>;
}
interface UseMessagesReturn {
    /** Current messages */
    messages: Message[];
    /** Add a new message (from external source) */
    addMessage: (message: Message) => void;
    /** Update a message */
    updateMessage: (messageId: string, updates: Partial<Message>) => void;
    /** Remove a message */
    removeMessage: (messageId: string) => void;
    /** Send a new message */
    sendMessage: (content: NewMessage) => Promise<void>;
    /** Retry a failed message */
    retryMessage: (messageId: string) => Promise<void>;
    /** Load more messages */
    loadMore: () => Promise<void>;
    /** Whether sending is in progress */
    isSending: boolean;
    /** Whether loading more is in progress */
    isLoadingMore: boolean;
    /** Mark a message as read */
    markAsRead: (messageId: string) => void;
    /** Update message status */
    updateStatus: (messageId: string, status: MessageStatus) => void;
}
/**
 * Hook for managing message state with optimistic updates.
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   isSending,
 * } = useMessages({
 *   currentUser,
 *   onSend: async (msg) => await api.sendMessage(msg),
 * });
 * ```
 */
declare function useMessages(options: UseMessagesOptions): UseMessagesReturn;
interface UseTypingIndicatorOptions {
    /** Current typing participants (from server) */
    typingParticipants?: MessageParticipant[];
    /** Debounce time for typing stop (ms) */
    debounceTime?: number;
    /** Called when local user starts typing */
    onTypingStart?: () => void;
    /** Called when local user stops typing */
    onTypingStop?: () => void;
}
interface UseTypingIndicatorReturn {
    /** Current typing state */
    typingState: TypingState;
    /** Signal that local user is typing */
    startTyping: () => void;
    /** Signal that local user stopped typing */
    stopTyping: () => void;
    /** Update remote typing participants */
    setTypingParticipants: (participants: MessageParticipant[]) => void;
}
/**
 * Hook for managing typing indicator state.
 *
 * @example
 * ```tsx
 * const { typingState, startTyping, stopTyping } = useTypingIndicator({
 *   onTypingStart: () => socket.emit('typing', true),
 *   onTypingStop: () => socket.emit('typing', false),
 * });
 * ```
 */
declare function useTypingIndicator(options?: UseTypingIndicatorOptions): UseTypingIndicatorReturn;
interface UseMessageScrollOptions {
    /** Messages to watch for changes */
    messages: Message[];
    /** Current user ID */
    currentUserId: string;
    /** Threshold from bottom to consider "at bottom" (px) */
    threshold?: number;
}
interface UseMessageScrollReturn {
    /** Ref to attach to scroll container */
    scrollContainerRef: React$1.RefObject<HTMLDivElement | null>;
    /** Ref to attach to bottom anchor element */
    bottomRef: React$1.RefObject<HTMLDivElement | null>;
    /** Whether user has scrolled up from bottom */
    isScrolledUp: boolean;
    /** Scroll to bottom */
    scrollToBottom: (smooth?: boolean) => void;
}
/**
 * Hook for managing message list scroll behavior.
 *
 * @example
 * ```tsx
 * const { scrollContainerRef, bottomRef, isScrolledUp, scrollToBottom } =
 *   useMessageScroll({ messages, currentUserId: user.id });
 * ```
 */
declare function useMessageScroll(options: UseMessageScrollOptions): UseMessageScrollReturn;
interface UseReadReceiptsOptions {
    /** Messages to track */
    messages: Message[];
    /** Current user ID */
    currentUserId: string;
    /** Called when a message should be marked as read */
    onMarkRead?: (messageId: string) => void;
    /** IntersectionObserver threshold */
    threshold?: number;
}
/**
 * Hook for automatically marking messages as read when visible.
 *
 * @example
 * ```tsx
 * const { observeMessage } = useReadReceipts({
 *   messages,
 *   currentUserId: user.id,
 *   onMarkRead: (id) => socket.emit('read', id),
 * });
 * ```
 */
declare function useReadReceipts(options: UseReadReceiptsOptions): {
    observeMessage: (element: HTMLElement | null, message: Message) => void;
};

interface SidebarProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Width when expanded (default: '280px') */
    expandedWidth?: string;
    /** Width when collapsed (default: '80px') */
    collapsedWidth?: string;
    /** Custom styles object */
    style?: React__default.CSSProperties;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function Sidebar({ children, className, expandedWidth, collapsedWidth, style, 'data-testid': testId, }: SidebarProps): React__default.JSX.Element;
interface SidebarHeaderProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show mobile close button (default: true) */
    showMobileClose?: boolean;
}
declare function SidebarHeader({ children, className, showMobileClose, }: SidebarHeaderProps): React__default.JSX.Element;
interface SidebarFooterProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarFooter({ children, className, }: SidebarFooterProps): React__default.JSX.Element;
interface SidebarContentProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarContent({ children, className, }: SidebarContentProps): React__default.JSX.Element;
interface SidebarNavProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarNav({ children, className, }: SidebarNavProps): React__default.JSX.Element;
interface SidebarNavGroupProps {
    /** Group label */
    label: string;
    /** Group icon */
    icon?: ReactNode;
    /** Group items */
    children: ReactNode;
    /** Whether the group starts expanded (for controlled accordion) */
    defaultExpanded?: boolean;
    /** Group identifier for accordion behavior */
    groupId?: string;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarNavGroup({ label, icon, children, defaultExpanded, groupId, className, }: SidebarNavGroupProps): React__default.JSX.Element;
interface SidebarNavItemProps {
    /** Item label */
    label: string;
    /** Item icon */
    icon?: ReactNode;
    /** Whether this item is currently active */
    isActive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Optional href for link items */
    href?: string;
    /** Badge content (number or text) */
    badge?: ReactNode;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function SidebarNavItem({ label, icon, isActive, onClick, href, badge, disabled, className, 'data-testid': testId, }: SidebarNavItemProps): React__default.JSX.Element;
interface SidebarToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Position of the toggle (default: 'inline') */
    position?: 'inline' | 'floating';
}
declare function SidebarToggle({ className, position, }: SidebarToggleProps): React__default.JSX.Element;
interface SidebarMobileToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Custom icon */
    icon?: ReactNode;
}
declare function SidebarMobileToggle({ className, icon, }: SidebarMobileToggleProps): React__default.JSX.Element;
interface SidebarSearchProps {
    /** Search query value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Keyboard shortcut hint */
    shortcutHint?: string;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function SidebarSearch({ value, onChange, placeholder, shortcutHint, className, 'data-testid': testId, }: SidebarSearchProps): React__default.JSX.Element;

interface SidebarContextValue {
    /** Whether the sidebar is collapsed (desktop) */
    isCollapsed: boolean;
    /** Toggle collapsed state */
    toggleCollapsed: () => void;
    /** Set collapsed state */
    setCollapsed: (collapsed: boolean) => void;
    /** Whether the mobile sidebar is open */
    isMobileOpen: boolean;
    /** Open mobile sidebar */
    openMobile: () => void;
    /** Close mobile sidebar */
    closeMobile: () => void;
    /** Toggle mobile sidebar */
    toggleMobile: () => void;
    /** Whether we're on a mobile/tablet viewport */
    isMobileViewport: boolean;
    /** Currently expanded group (for accordion behavior) */
    expandedGroup: string | null;
    /** Set the expanded group */
    setExpandedGroup: (group: string | null) => void;
    /** Toggle a group's expanded state */
    toggleGroup: (group: string) => void;
}
interface SidebarProviderProps {
    children: ReactNode;
    /** Default collapsed state (default: false) */
    defaultCollapsed?: boolean;
    /** Storage key for persisting collapsed state (default: 'sidebar-collapsed') */
    storageKey?: string;
    /** Whether to persist collapsed state to localStorage (default: true) */
    persistCollapsed?: boolean;
    /** Default expanded group */
    defaultExpandedGroup?: string | null;
    /** Breakpoint for mobile detection (default: 1024px) */
    mobileBreakpoint?: string;
}
declare function SidebarProvider({ children, defaultCollapsed, storageKey, persistCollapsed, defaultExpandedGroup, mobileBreakpoint, }: SidebarProviderProps): React__default.JSX.Element;
/**
 * Hook to access the sidebar context.
 * Must be used within a SidebarProvider.
 *
 * @example
 * ```tsx
 * function MenuButton() {
 *   const { isMobileViewport, openMobile, toggleCollapsed } = useSidebar();
 *
 *   return (
 *     <button onClick={isMobileViewport ? openMobile : toggleCollapsed}>
 *       Menu
 *     </button>
 *   );
 * }
 * ```
 */
declare function useSidebar(): SidebarContextValue;

type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
interface ToastData {
    /** Unique identifier for the toast */
    id: string;
    /** Toast message content */
    message: ReactNode;
    /** Optional title for the toast */
    title?: string;
    /** Toast variant/type (default: 'info') */
    variant?: ToastVariant;
    /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss, default: 5000) */
    duration?: number;
    /** Whether the toast can be dismissed by clicking (default: true) */
    dismissible?: boolean;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Custom icon to display */
    icon?: ReactNode;
    /** Callback when toast is dismissed */
    onDismiss?: () => void;
}
type ToastOptions = Omit<ToastData, 'id'>;
interface ToastContextValue {
    /** Currently visible toasts */
    toasts: ToastData[];
    /** Add a new toast and return its ID */
    toast: (options: ToastOptions) => string;
    /** Shorthand for success toast */
    success: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for error toast */
    error: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for warning toast */
    warning: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for info toast */
    info: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Dismiss a specific toast by ID */
    dismiss: (id: string) => void;
    /** Dismiss all toasts */
    dismissAll: () => void;
}
interface ToastProviderProps {
    children: ReactNode;
    /** Maximum number of toasts to show at once (default: 5) */
    maxToasts?: number;
    /** Position of toasts on screen (default: 'bottom-right') */
    position?: ToastPosition;
    /** Default duration for toasts in ms (default: 5000) */
    defaultDuration?: number;
}
declare function ToastProvider({ children, maxToasts, defaultDuration, }: ToastProviderProps): React__default.JSX.Element;
/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, error } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Data saved successfully!');
 *     } catch (e) {
 *       error('Failed to save data');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
declare function useToast(): ToastContextValue;

interface ToastProps extends ToastData {
    /** Called when the toast is dismissed */
    onClose: () => void;
}
declare function Toast({ title, message, variant, dismissible, action, icon, onClose, }: ToastProps): React__default.JSX.Element;
interface ToastContainerProps {
    /** Toasts to display */
    toasts: ToastData[];
    /** Position of the toast container (default: 'bottom-right') */
    position?: ToastPosition;
    /** Called when a toast should be dismissed */
    onDismiss: (id: string) => void;
}
declare function ToastContainer({ toasts, position, onDismiss, }: ToastContainerProps): React__default.JSX.Element | null;

export { AGGrid, type AGGridProps, AIChat, type AIChatCallbacks, AIChatModal, type AIChatModalProps, type AIChatProps, type AIChatSession, AIChatTrigger, type AIChatTriggerProps, AILogoIcon, type AILogoIconProps, type AIMessage, type AIMessageContent, AIMessageDisplay, type AIMessageDisplayProps, type AIMessageRole, type AIMessageStatus, type AISuggestedAction, AITypingIndicator, AppHeader, AppHeaderActions, type AppHeaderActionsProps, AppHeaderDivider, type AppHeaderDividerProps, AppHeaderIconButton, type AppHeaderIconButtonProps, type AppHeaderProps, AppHeaderSearch, type AppHeaderSearchProps, AppHeaderSection, type AppHeaderSectionProps, AppHeaderTitle, type AppHeaderTitleProps, AppHeaderUserMenu, type AppHeaderUserMenuProps, AttachmentPicker, type AttachmentPickerProps, AttachmentPreview, AttachmentPreviewItem, type AttachmentPreviewItemProps, type AttachmentPreviewProps, type AttachmentState, type AttachmentType, AvatarNameRenderer, BooleanRenderer, BrandConfig, CameraButton, type CameraButtonProps, type CameraPermission, CellRenderers, CharacterCounter, type CharacterCounterProps, ChevronIcon, type ChevronIconProps, CloseIcon, type CloseIconProps, type ColDef, CommandPalette, type CommandPaletteCategory, type CommandPaletteContextValue, type CommandPaletteItem, type CommandPaletteProps, CommandPaletteProvider, type CommandPaletteProviderProps, CommandPaletteTrigger, type CommandPaletteTriggerProps, CompanyRenderer, type Conversation, ConversationHeader, type ConversationHeaderProps, ConversationListItem, type ConversationListItemProps, ConversationListSkeleton, type ConversationListSkeletonProps, type ConversationType, CurrencyRenderer, DEFAULT_ACCEPTED_FILE_TYPES, DEFAULT_MAX_FILE_SIZE_MB, DateRenderer, type DateRendererProps, DateSeparator, type DateSeparatorProps, type DetectionConfig, type DetectionMetrics, type DetectionState, type DocumentBoundary, DocumentDetectionOverlay, DocumentScanner, type DocumentScannerProps, DomainRenderer, DragDropZone, type DragDropZoneProps, DropZone, type DropZoneProps, EmailRenderer, EmptyState, type EmptyStateProps, EngagementScoreRenderer, FilePreview, type FilePreviewProps, FloatingAIChat, type FloatingAIChatProps, LightboxModal, type LightboxModalProps, LinkedInRenderer, LoadMoreButton, type LoadMoreButtonProps, type MCPResource, type MCPResourceLink, type MCPToolCall, MCPToolCallDisplay, type MCPToolCallDisplayProps, type MCPToolInfo, type MCPToolParameter, type MCPToolResult, type MCPToolStatus, MemoizedAvatarNameRenderer, MemoizedBooleanRenderer, MemoizedCompanyRenderer, MemoizedCurrencyRenderer, MemoizedDateRenderer, MemoizedDomainRenderer, MemoizedEmailRenderer, MemoizedEngagementScoreRenderer, MemoizedLinkedInRenderer, MemoizedNumberRenderer, MemoizedPhoneRenderer, MemoizedProgressRenderer, MemoizedStatusBadgeRenderer, MemoizedTagsRenderer, type Message, type MessageAction, type MessageAttachment, MessageAvatar, MessageBubble, type MessageBubbleProps, MessageComposer, type MessageComposerProps, type MessageGroup, MessageList, type MessageListProps, type MessageParticipant, type MessageReaction, type MessageStatus, MessageStatusIcon, type MessageStatusIconProps, type MessageStatusIndicator, MessageThread, type MessageThreadProps, type MessageType, type MessagingEventHandlers, type MessagingLoadingState, MessagingSplitView, type MessagingSplitViewProps, type NewMessage, NumberRenderer, PhoneRenderer, type Point, type PreviewFile, ProgressRenderer, type ProgressRendererProps, type ReadReceipt, ReadReceiptIndicator, type ReadReceiptIndicatorProps, RefreshIcon, type RefreshIconProps, ResourceLink, type ResourceLinkProps, type ScannerSource, type ScannerState, SendButton, type SendButtonProps, SendIcon, type SendIconProps, Sidebar, SidebarContent, type SidebarContentProps, type SidebarContextValue, SidebarFooter, type SidebarFooterProps, SidebarHeader, type SidebarHeaderProps, SidebarMobileToggle, type SidebarMobileToggleProps, SidebarNav, SidebarNavGroup, type SidebarNavGroupProps, SidebarNavItem, type SidebarNavItemProps, type SidebarNavProps, type SidebarProps, SidebarProvider, type SidebarProviderProps, SidebarSearch, type SidebarSearchProps, SidebarToggle, type SidebarToggleProps, SkeletonMessage, type SkeletonMessageProps, SparklesIcon, type SparklesIconProps, SpinnerIcon, type SpinnerIconProps, StatusBadgeRenderer, type StatusBadgeRendererProps, type StatusConfig, SuggestedActions, type SuggestedActionsProps, type SystemMessageType, TagsRenderer, Toast, ToastContainer, type ToastContainerProps, type ToastContextValue, type ToastData, type ToastOptions, type ToastPosition, type ToastProps, ToastProvider, type ToastProviderProps, type ToastVariant, ToolStatusIcon, TypingIndicator, type TypingIndicatorProps, type TypingState, type UseMessageScrollOptions, type UseMessageScrollReturn, type UseMessagesOptions, type UseMessagesReturn, type UseReadReceiptsOptions, type UseTypingIndicatorOptions, type UseTypingIndicatorReturn, type ValidationError, WebcamModal, type WebcamModalProps, bubbleVariants, formatDateLabel, formatFileSize, formatLastSeen, formatPhoneDisplay, generateAttachmentId, getConversationSubtitle, getConversationTitle, getFileType, getToolIcon, groupMessagesByDate, headerVariants, isSameSenderGroup, sendButtonVariants, statusColors, useCamera, useCommandPalette, useDocumentDetection, useFileUpload, useMessageScroll, useMessages, useReadReceipts, useSidebar, useToast, useTypingIndicator, validateFile };
