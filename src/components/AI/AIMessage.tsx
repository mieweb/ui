/**
 * AI Message Component
 *
 * Renders AI chat messages with support for text, tool calls, and streaming.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type { AIMessage, AIMessageContent, MCPResourceLink } from './types';
import { MCPToolCallDisplay } from './MCPToolCall';
import { SparklesIcon, ChevronIcon } from './icons';

// ============================================================================
// Avatar Component
// ============================================================================

const avatarVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      role: {
        user: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
        assistant: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
        system:
          'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400',
        tool: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      },
      size: {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-10 w-10 text-base',
      },
    },
    defaultVariants: {
      role: 'user',
      size: 'md',
    },
  }
);

interface MessageAvatarProps extends VariantProps<typeof avatarVariants> {
  userName?: string;
  className?: string;
}

function MessageAvatar({
  role,
  size,
  userName,
  className,
}: MessageAvatarProps) {
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={cn(avatarVariants({ role, size }), className)}>
      {role === 'assistant' ? (
        <SparklesIcon size="md" />
      ) : role === 'user' ? (
        <span className="font-medium">{getInitials(userName)}</span>
      ) : role === 'system' ? (
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
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      ) : (
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
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
          />
        </svg>
      )}
    </div>
  );
}

// ============================================================================
// Typing Indicator
// ============================================================================

function AITypingIndicator({ className }: { className?: string }) {
  const dotStyle = {
    width: '6px',
    height: '6px',
    minWidth: '6px',
    minHeight: '6px',
    flexShrink: 0,
  };

  return (
    <div className={cn('inline-flex items-center justify-center gap-2', className)}>
      <span
        className="rounded-full bg-neutral-500 dark:bg-neutral-400"
        style={{
          ...dotStyle,
          animation: 'typing-dot 1.4s infinite ease-in-out both',
          animationDelay: '-0.32s',
        }}
      />
      <span
        className="rounded-full bg-neutral-500 dark:bg-neutral-400"
        style={{
          ...dotStyle,
          animation: 'typing-dot 1.4s infinite ease-in-out both',
          animationDelay: '-0.16s',
        }}
      />
      <span
        className="rounded-full bg-neutral-500 dark:bg-neutral-400"
        style={{
          ...dotStyle,
          animation: 'typing-dot 1.4s infinite ease-in-out both',
        }}
      />
      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.4; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Content Block Renderer
// ============================================================================

interface ContentBlockProps {
  content: AIMessageContent;
  onLinkClick?: (link: MCPResourceLink) => void;
}

function ContentBlock({ content, onLinkClick }: ContentBlockProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(
    content.collapsed ?? false
  );

  if (content.type === 'text' && content.text) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{content.text}</p>
      </div>
    );
  }

  if (content.type === 'tool_use' && content.toolCall) {
    return (
      <MCPToolCallDisplay
        toolCall={content.toolCall}
        onLinkClick={onLinkClick}
        defaultCollapsed={content.collapsed}
      />
    );
  }

  if (content.type === 'thinking' && content.text) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-between px-3 py-2 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
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
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            Thinking...
          </span>
          <ChevronIcon
            direction={isCollapsed ? 'right' : 'down'}
            className="text-neutral-400"
          />
        </button>
        {!isCollapsed && (
          <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 italic dark:text-neutral-400">
              {content.text}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (content.type === 'code' && content.text) {
    return (
      <pre className="rounded-lg bg-neutral-900 p-3 text-sm dark:bg-neutral-950">
        <code
          className={content.language ? `language-${content.language}` : ''}
        >
          {content.text}
        </code>
      </pre>
    );
  }

  return null;
}

// ============================================================================
// AI Message Component
// ============================================================================

const messageVariants = cva('flex gap-3', {
  variants: {
    role: {
      user: 'flex-row-reverse',
      assistant: 'flex-row',
      system: 'flex-row justify-center',
      tool: 'flex-row',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
});

const bubbleVariants = cva('rounded-2xl px-4 py-2.5 max-w-[85%]', {
  variants: {
    role: {
      user: 'bg-primary-600 text-white dark:bg-primary-500',
      assistant:
        'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
      system:
        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-center text-sm max-w-[95%]',
      tool: 'bg-transparent p-0 max-w-full w-full',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
});

export interface AIMessageDisplayProps {
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
export function AIMessageDisplay({
  message,
  userName,
  showAvatar = true,
  showTimestamp = false,
  onLinkClick,
  className,
}: AIMessageDisplayProps) {
  const isStreaming = message.status === 'streaming';
  const hasContent = message.content.length > 0;

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // For tool messages, render just the tool call without bubble
  if (message.role === 'tool') {
    return (
      <div className={cn(messageVariants({ role: message.role }), className)}>
        {showAvatar && <MessageAvatar role={message.role} />}
        <div className="flex-1 space-y-2">
          {message.content.map((content, index) => (
            <ContentBlock
              key={index}
              content={content}
              onLinkClick={onLinkClick}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(messageVariants({ role: message.role }), className)}>
      {showAvatar && message.role !== 'system' && (
        <MessageAvatar role={message.role} userName={userName} />
      )}

      <div
        className={cn(
          'flex flex-col gap-1',
          message.role === 'user' && 'items-end'
        )}
      >
        <div className={bubbleVariants({ role: message.role })}>
          {hasContent ? (
            <div className="space-y-3">
              {message.content.map((content, index) => (
                <ContentBlock
                  key={index}
                  content={content}
                  onLinkClick={onLinkClick}
                />
              ))}
            </div>
          ) : isStreaming ? (
            <AITypingIndicator />
          ) : null}
        </div>

        {showTimestamp && (
          <span className="px-2 text-xs text-neutral-500">
            {formatTime(message.timestamp)}
          </span>
        )}

        {message.status === 'error' && (
          <span className="px-2 text-xs text-red-500">Failed to send</span>
        )}
      </div>
    </div>
  );
}

export { MessageAvatar, AITypingIndicator };
