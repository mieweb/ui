/**
 * AI Chat Component
 *
 * A complete chat interface for AI interactions with support for
 * MCP tool calls, suggested actions, and streaming responses.
 *
 * This component reuses the core Messaging components (MessageComposer,
 * EmptyState) to maintain DRY principles.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type {
  AIMessage,
  AIChatSession,
  AISuggestedAction,
  AIChatCallbacks,
  MCPResourceLink,
} from './types';
import { AIMessageDisplay } from './AIMessage';
import {
  MessageComposer,
  type MessageComposerProps,
} from '../Messaging/MessageComposer';
import {
  EmptyState as MessagingEmptyState,
  type EmptyStateProps as MessagingEmptyStateProps,
} from '../Messaging/MessageList';
import { SparklesIcon, CloseIcon, RefreshIcon } from './icons';

// ============================================================================
// Suggested Actions Component
// ============================================================================

export interface SuggestedActionsProps {
  /** Available suggested actions */
  actions: AISuggestedAction[];
  /** Callback when an action is selected */
  onSelect: (action: AISuggestedAction) => void;
  /** Additional class name */
  className?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  patient: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      />
    </svg>
  ),
  search: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  ),
  appointment: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  ),
  document: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  help: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  ),
  default: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export function SuggestedActions({
  actions,
  onSelect,
  className,
}: SuggestedActionsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelect(action)}
          className={cn(
            'flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5',
            'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 text-sm text-neutral-700',
            'dark:border-neutral-700 dark:text-neutral-300',
            'dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-300',
            'transition-colors'
          )}
        >
          {ACTION_ICONS[action.icon || 'default'] || ACTION_ICONS.default}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// AI Empty State Component (wraps Messaging EmptyState with AI-specific defaults)
// ============================================================================

interface AIEmptyStateProps extends Omit<MessagingEmptyStateProps, 'icon'> {
  suggestions?: AISuggestedAction[];
  onSuggestionSelect?: (action: AISuggestedAction) => void;
}

function AIEmptyState({
  title = 'How can I help you today?',
  description = 'Ask me anything about patients, appointments, documents, or how to use the system.',
  suggestions,
  onSuggestionSelect,
  className,
  ...props
}: AIEmptyStateProps) {
  const aiIcon = (
    <div className="bg-primary-500 dark:bg-primary-600 flex h-16 w-16 items-center justify-center rounded-full text-white">
      <SparklesIcon size="lg" className="h-8 w-8" />
    </div>
  );

  const suggestionsAction =
    suggestions && suggestions.length > 0 && onSuggestionSelect ? (
      <div className="mt-6">
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          Try asking:
        </p>
        <SuggestedActions actions={suggestions} onSelect={onSuggestionSelect} />
      </div>
    ) : undefined;

  return (
    <MessagingEmptyState
      title={title}
      description={description}
      icon={aiIcon}
      action={suggestionsAction}
      className={className}
      {...props}
    />
  );
}

// ============================================================================
// AI Chat Component
// ============================================================================

const chatVariants = cva('flex flex-col', {
  variants: {
    variant: {
      default: 'bg-white dark:bg-neutral-900',
      embedded: 'bg-transparent',
      floating:
        'bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700',
    },
    size: {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'full',
  },
});

export interface AIChatProps
  extends VariantProps<typeof chatVariants>, AIChatCallbacks {
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
export function AIChat({
  session,
  messages: messagesProp,
  isGenerating: isGeneratingProp,
  userName = 'You',
  title = 'AI Assistant',
  suggestions,
  showHeader = true,
  showTimestamps = false,
  inputPlaceholder = 'Ask anything...',
  variant,
  size,
  height,
  composerProps,
  className,
  onSendMessage,
  onToolCall: _onToolCall,
  onResourceClick,
  onSuggestedAction,
  onCancel,
  onClear,
  onClose,
}: AIChatProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const messages = React.useMemo(
    () => session?.messages || messagesProp || [],
    [session?.messages, messagesProp]
  );
  const isGenerating = session?.isGenerating || isGeneratingProp || false;

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message: { content: string }) => {
    if (message.content.trim() && onSendMessage) {
      onSendMessage(message.content.trim());
    }
  };

  const handleSuggestionSelect = (action: AISuggestedAction) => {
    if (onSuggestedAction) {
      onSuggestedAction(action);
    } else if (onSendMessage) {
      onSendMessage(action.prompt);
    }
  };

  const handleLinkClick = (link: MCPResourceLink) => {
    if (onResourceClick) {
      onResourceClick(link);
    }
  };

  return (
    <div
      className={cn(chatVariants({ variant, size }), className)}
      style={{ height: height || undefined }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 dark:bg-primary-600 flex h-8 w-8 items-center justify-center rounded-full text-white">
              <SparklesIcon size="sm" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 dark:text-white">
                {title}
              </h2>
              {isGenerating && (
                <p className="text-xs text-neutral-500">Generating...</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isGenerating && onCancel && (
              <button
                onClick={onCancel}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm',
                  'bg-red-100 text-red-600 hover:bg-red-200',
                  'dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                  'transition-colors'
                )}
              >
                Stop
              </button>
            )}
            {onClear && messages.length > 0 && (
              <button
                onClick={onClear}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Clear chat"
              >
                <RefreshIcon />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Close chat"
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <AIEmptyState
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <AIMessageDisplay
                key={message.id}
                message={message}
                userName={userName}
                showTimestamp={showTimestamps}
                onLinkClick={handleLinkClick}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - Using MessageComposer from Messaging */}
      <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-700">
        {suggestions &&
          suggestions.length > 0 &&
          messages.length > 0 &&
          !isGenerating && (
            <div className="px-4 pt-3">
              <SuggestedActions
                actions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            </div>
          )}
        <MessageComposer
          onSend={handleSend}
          placeholder={inputPlaceholder}
          disabled={isGenerating}
          isSending={isGenerating}
          showAttachmentPicker={false}
          showCameraButton={false}
          showCharacterCount={false}
          variant="minimal"
          {...composerProps}
        />
      </div>
    </div>
  );
}

// Re-export for convenience
export type { AISuggestedAction };
