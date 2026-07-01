/**
 * AI Message Component
 *
 * Renders AI chat messages with support for text, tool calls, and streaming.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type {
  AIMessage,
  AIMessageContent,
  AIRenderTextContent,
  MCPResourceLink,
} from './types';
import { MCPToolCallDisplay } from './MCPToolCall';
import { SparklesIcon } from './icons';
import { CollapsiblePill } from './CollapsiblePill';
import { AudioPlayer } from '../AudioPlayer';

// ============================================================================
// Avatar Component
// ============================================================================

const avatarVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      role: {
        user: 'bg-primary-100 text-primary-900 dark:bg-primary-900/50 dark:text-primary-300',
        assistant: 'bg-primary-800 text-white dark:bg-primary-800',
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
    <div
      data-slot="ai-message-avatar"
      className={cn(avatarVariants({ role, size }), className)}
    >
      {role === 'assistant' ? (
        <SparklesIcon size="md" />
      ) : role === 'user' ? (
        <span className="font-medium">{getInitials(userName)}</span>
      ) : role === 'system' ? (
        <svg
          aria-hidden="true"
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
          aria-hidden="true"
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
    <div
      data-slot="ai-typing-indicator"
      className={cn('inline-flex items-center justify-center gap-2', className)}
    >
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
// Thinking Block
// ============================================================================

function ThinkingBlock({
  text,
  streaming,
  defaultCollapsed = false,
}: {
  text: string;
  streaming: boolean;
  defaultCollapsed?: boolean;
}) {
  const startedAt = React.useRef(Date.now());
  const [elapsed, setElapsed] = React.useState<number | null>(null);
  const prevStreaming = React.useRef(streaming);

  React.useEffect(() => {
    if (prevStreaming.current && !streaming) {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
    }
    prevStreaming.current = streaming;
  }, [streaming]);

  const label = streaming
    ? 'Thinking'
    : elapsed !== null && elapsed > 0
      ? `Thought for ${elapsed}s`
      : 'Thought';

  const dot = streaming ? (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400"
      style={{ animation: 'thinking-pulse 1.2s ease-in-out infinite' }}
    />
  ) : null;

  return (
    <div data-slot="ai-message-thinking">
      <style>{`@keyframes thinking-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
      <CollapsiblePill
        label={label}
        leadingIcon={dot}
        defaultOpen={!defaultCollapsed}
        pillClassName="bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/50 focus-visible:ring-violet-500"
      >
        <div className="border-l-2 border-violet-200 pl-3 text-[13px] leading-relaxed text-neutral-600 italic dark:border-violet-700 dark:text-neutral-400">
          {text}
        </div>
      </CollapsiblePill>
    </div>
  );
}

// ============================================================================
// Content Block Renderer
// ============================================================================

interface ContentBlockProps {
  content: AIMessageContent;
  onLinkClick?: (link: MCPResourceLink) => void;
  messageId: string;
  streaming: boolean;
  role: AIMessage['role'];
  renderTextContent?: AIRenderTextContent;
}

function ContentBlock({
  content,
  onLinkClick,
  messageId,
  streaming,
  role,
  renderTextContent,
}: ContentBlockProps) {
  if (content.type === 'text' && content.text) {
    if (renderTextContent) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderTextContent(content.text, { messageId, streaming, role })}
        </div>
      );
    }
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
      <ThinkingBlock
        text={content.text}
        streaming={streaming}
        defaultCollapsed={content.collapsed ?? false}
      />
    );
  }

  if (content.type === 'code' && content.text) {
    return (
      <pre
        data-slot="ai-message-code"
        className="rounded-lg bg-neutral-900 p-3 text-sm dark:bg-neutral-950"
      >
        <code
          className={content.language ? `language-${content.language}` : ''}
        >
          {content.text}
        </code>
      </pre>
    );
  }

  if (content.type === 'audio' && content.audioUrl) {
    // Guard against `javascript:` URLs, mirroring the image/file blocks.
    if (/^\s*javascript:/i.test(content.audioUrl)) {
      return null;
    }
    return (
      <AudioPlayer
        src={content.audioUrl}
        title={content.text || 'Audio recording'}
        variant="waveform"
        showTime
        showPlaybackRate
        fallbackDuration={content.duration}
      />
    );
  }

  if (content.type === 'image' && content.imageUrl) {
    const safeHref = /^\s*javascript:/i.test(content.imageUrl)
      ? undefined
      : content.imageUrl;
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-fit transition-transform hover:scale-[1.02]"
        aria-label={`View ${content.name || 'Uploaded image'}`}
      >
        <img
          src={content.imageUrl}
          alt={content.name || 'Uploaded image'}
          loading="lazy"
          className="my-1 max-h-64 w-auto rounded-lg object-cover"
        />
      </a>
    );
  }

  if (content.type === 'file') {
    const sizeLabel =
      typeof content.fileSize === 'number'
        ? formatFileSize(content.fileSize)
        : undefined;
    const card = (
      <div className="my-1 flex items-center gap-3 rounded-lg bg-neutral-100 p-3 transition-colors dark:bg-neutral-800">
        <div className="rounded-lg bg-neutral-200 p-2 dark:bg-neutral-700">
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {content.name || 'Document'}
          </p>
          {sizeLabel && <p className="text-xs opacity-70">{sizeLabel}</p>}
        </div>
      </div>
    );

    if (content.fileUrl) {
      const safeFileHref = /^\s*javascript:/i.test(content.fileUrl)
        ? undefined
        : content.fileUrl;
      return (
        <a
          href={safeFileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-fit no-underline"
        >
          {card}
        </a>
      );
    }
    return card;
  }

  return null;
}

/** Human-readable file size (e.g. "1.2 MB"). */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const bubbleVariants = cva('rounded-2xl px-4 py-2.5 w-fit max-w-[85%]', {
  variants: {
    variant: {
      user: 'bg-primary-800 text-white dark:bg-primary-800',
      assistant:
        'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
      system:
        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-center text-sm max-w-[95%]',
      tool: 'bg-transparent p-0 max-w-full w-full',
    },
  },
  defaultVariants: {
    variant: 'assistant',
  },
});

export interface ChatBubbleProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bubbleVariants> {
  /** Show error styling (red border). */
  hasError?: boolean;
  /**
   * Optional left-border accent color. Used by multi-participant surfaces
   * (e.g. SuperChat) to tint a speaker's bubble; AI chat leaves it unset.
   */
  accent?: string;
}

/**
 * The shared chat bubble shell. This is the single source of truth for how a
 * chat message bubble looks across the library (AI chat, SuperChat, etc.).
 * Presentational only — callers render their own content inside.
 */
const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  (
    { className, variant, hasError, accent, style, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-slot="chat-bubble"
        className={cn(
          bubbleVariants({ variant }),
          hasError && 'border border-red-300 dark:border-red-700',
          className
        )}
        style={accent ? { borderLeft: `3px solid ${accent}`, ...style } : style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ChatBubble.displayName = 'ChatBubble';

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
  /**
   * Optional renderer for `text` content blocks (e.g. Markdown). Called per
   * text block with `{ messageId, streaming, role }`. Host must sanitize.
   */
  renderTextContent?: AIRenderTextContent;
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
  renderTextContent,
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
      <div
        data-slot="ai-message"
        className={cn(messageVariants({ role: message.role }), className)}
      >
        {showAvatar && <MessageAvatar role={message.role} />}
        <div className="flex-1 space-y-2">
          {message.content.map((content, index) => (
            <ContentBlock
              key={index}
              content={content}
              onLinkClick={onLinkClick}
              messageId={message.id}
              streaming={isStreaming}
              role={message.role}
              renderTextContent={renderTextContent}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="ai-message"
      className={cn(messageVariants({ role: message.role }), className)}
    >
      {showAvatar && message.role !== 'system' && (
        <MessageAvatar role={message.role} userName={userName} />
      )}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1',
          message.role === 'user' && 'items-end'
        )}
      >
        <ChatBubble
          data-slot="ai-message-bubble"
          variant={message.role}
          hasError={message.status === 'error'}
        >
          {hasContent ? (
            <div className="space-y-3">
              {message.content.map((content, index) => (
                <ContentBlock
                  key={index}
                  content={content}
                  onLinkClick={onLinkClick}
                  messageId={message.id}
                  streaming={isStreaming}
                  role={message.role}
                  renderTextContent={renderTextContent}
                />
              ))}
            </div>
          ) : isStreaming ? (
            <div className="flex items-center justify-center">
              <AITypingIndicator />
            </div>
          ) : null}
        </ChatBubble>

        {showTimestamp && (
          <span
            data-slot="ai-message-timestamp"
            className="px-2 text-xs text-neutral-500"
          >
            {formatTime(message.timestamp)}
          </span>
        )}

        {message.status === 'error' && (
          <span className="px-2 text-xs text-red-500">
            {message.role === 'user' ? 'Failed to send' : 'An error occurred'}
          </span>
        )}
      </div>
    </div>
  );
}

export { MessageAvatar, AITypingIndicator, ChatBubble, bubbleVariants };
