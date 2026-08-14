import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Dropdown, DropdownContent, DropdownItem } from '../Dropdown';
import { CheckIcon, CloseIcon, PencilIcon } from '../Icons';
import { Toast } from '../Toast';
import { Tooltip } from '../Tooltip';
import {
  ComposerModelSelector,
  type ProviderModelOption,
  type ProviderModelValue,
} from './ComposerModelSelector';
import { AIChat } from './AIChat';
import type {
  AIMessage,
  AIRenderMessageFooter,
  AIRenderTextContent,
} from './types';

export type OzwellThinkingMode = 'never' | 'collapsed' | 'auto' | 'expanded';
export type OzwellModelOption = ProviderModelOption;
export type OzwellModelValue = ProviderModelValue;

type OzwellModels = {
  options: OzwellModelOption[];
  value: OzwellModelValue | null;
  onChange: (value: OzwellModelValue) => void;
} & (
  | {
      providerFilter: string | null;
      onProviderFilterChange: (provider: string | null) => void;
    }
  | {
      providerFilter?: undefined;
      onProviderFilterChange?: (provider: string | null) => void;
    }
);

const THINKING_OPTIONS: Array<{
  value: OzwellThinkingMode;
  label: string;
  description: string;
}> = [
  {
    value: 'never',
    label: 'Never',
    description: 'Hide all thinking blocks in the chat.',
  },
  {
    value: 'collapsed',
    label: 'Collapsed',
    description: 'Show a compact thinking row that can be opened.',
  },
  {
    value: 'auto',
    label: 'Auto',
    description: 'Open while thinking, then collapse after the answer.',
  },
  {
    value: 'expanded',
    label: 'Expanded',
    description: 'Keep thinking blocks open by default.',
  },
];

const QUEUED_MESSAGE_ID = 'ozwell-queued-message';

export interface OzwellChatProps {
  /** Messages prepared by the Ozwell API adapter, excluding `queuedMessage`. */
  messages: AIMessage[];
  /** Whether the adapter is receiving an assistant response. */
  isGenerating?: boolean;
  /** Placeholder for the single assistant composer. */
  inputPlaceholder?: string;
  /** Called with a user message; transport remains the adapter's responsibility. */
  onSendMessage?: (message: string) => void;
  /** Follow-up held by the adapter while an assistant turn is still in progress. */
  queuedMessage?: string | null;
  /** Updates the adapter-owned queued follow-up. */
  onQueuedMessageChange?: (message: string) => void;
  /** Removes the adapter-owned queued follow-up. */
  onCancelQueuedMessage?: () => void;
  /** Optional host renderer for text blocks such as sanitized Markdown. */
  renderTextContent?: AIRenderTextContent;
  /** Controlled thinking display settings. */
  thinking?: {
    enabled: boolean;
    mode: OzwellThinkingMode;
    onModeChange?: (mode: OzwellThinkingMode) => void;
  };
  /** Controlled, already-discovered models for the composer picker. */
  models?: OzwellModels;
  /** Adapter-supplied warning, such as an SSE fallback warning. */
  warning?: string | null;
  /** Called when the warning's close button is pressed. */
  onDismissWarning?: () => void;
  /** Footer copy. Defaults to the current widget footer. */
  footer?: string;
  className?: string;
}

function applyThinkingMode(
  messages: AIMessage[],
  mode: OzwellThinkingMode
): AIMessage[] {
  return messages
    .map((message) => {
      const hasTextContent = message.content.some(
        (block) => block.type === 'text' && Boolean(block.text)
      );
      const content = message.content
        .filter((block) => mode !== 'never' || block.type !== 'thinking')
        .map((block) => {
          if (block.type !== 'thinking') return block;
          return {
            ...block,
            collapsed:
              mode === 'collapsed' ||
              (mode === 'auto' &&
                (message.status !== 'streaming' || hasTextContent)),
          };
        });

      return { ...message, content };
    })
    .filter(
      (message) =>
        message.status === 'streaming' ||
        message.content.length > 0 ||
        message.role === 'tool'
    );
}

export function OzwellChat({
  messages,
  isGenerating = false,
  inputPlaceholder = 'Ask a question...',
  onSendMessage,
  queuedMessage,
  onQueuedMessageChange,
  onCancelQueuedMessage,
  renderTextContent,
  thinking,
  models,
  warning,
  onDismissWarning,
  footer = 'Powered by Ozwell',
  className,
}: OzwellChatProps) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [thinkingMenuOpen, setThinkingMenuOpen] = React.useState(false);
  const [messagesMenuOpen, setMessagesMenuOpen] = React.useState(false);
  const [messagesButtonFlare, setMessagesButtonFlare] = React.useState(false);
  const [isEditingQueuedMessage, setIsEditingQueuedMessage] =
    React.useState(false);
  const [queuedMessageDraft, setQueuedMessageDraft] = React.useState('');
  const hasFlaredRef = React.useRef(false);
  const queuedMessageEditorRef = React.useRef<HTMLTextAreaElement>(null);

  const displayedMessages = React.useMemo(
    () => applyThinkingMode(messages, thinking?.mode ?? 'auto'),
    [messages, thinking?.mode]
  );
  const userMessageItems = React.useMemo(
    () =>
      displayedMessages.flatMap((message, chatIndex) => {
        if (message.role !== 'user') return [];
        const text = message.content
          .filter((block) => block.type === 'text' && block.text)
          .map((block) => block.text)
          .join(' ')
          .trim();
        return text ? [{ id: message.id, text, chatIndex }] : [];
      }),
    [displayedMessages]
  );
  const showMessagesNav = userMessageItems.length >= 3;
  const chatMessages = React.useMemo(
    () =>
      queuedMessage
        ? [
            ...displayedMessages,
            {
              id: QUEUED_MESSAGE_ID,
              role: 'user' as const,
              status: 'pending' as const,
              timestamp: new Date(),
              content: [{ type: 'text' as const, text: queuedMessage }],
            },
          ]
        : displayedMessages,
    [displayedMessages, queuedMessage]
  );
  const selectedThinkingOption = THINKING_OPTIONS.find(
    (option) => option.value === thinking?.mode
  );
  const showModelSelector = Boolean(models?.value && models.options.length > 1);

  React.useEffect(() => {
    if (!queuedMessage) setIsEditingQueuedMessage(false);
  }, [queuedMessage]);

  React.useEffect(() => {
    if (isEditingQueuedMessage) queuedMessageEditorRef.current?.focus();
  }, [isEditingQueuedMessage]);

  React.useEffect(() => {
    if (!showMessagesNav || hasFlaredRef.current) return;
    hasFlaredRef.current = true;
    setMessagesButtonFlare(true);
    const timeoutId = window.setTimeout(
      () => setMessagesButtonFlare(false),
      1800
    );
    return () => window.clearTimeout(timeoutId);
  }, [showMessagesNav]);

  const scrollToMessage = (chatIndex: number) => {
    const messageNodes = shellRef.current?.querySelectorAll<HTMLElement>(
      '[data-slot="ai-chat-messages"] [data-slot="ai-message"]'
    );
    messageNodes?.[chatIndex]?.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
    setMessagesMenuOpen(false);
  };

  const modelSelector =
    showModelSelector && models ? (
      <ComposerModelSelector
        models={models.options}
        value={models.value}
        onChange={models.onChange}
        {...(models.providerFilter !== undefined
          ? {
              providerFilter: models.providerFilter,
              onProviderFilterChange: models.onProviderFilterChange,
            }
          : { onProviderFilterChange: models.onProviderFilterChange })}
        boundaryRef={shellRef}
        className="border-border bg-card text-foreground max-w-[min(142px,38vw)] shadow-sm"
      />
    ) : undefined;

  const startQueuedMessageEdit = () => {
    setQueuedMessageDraft(queuedMessage ?? '');
    setIsEditingQueuedMessage(true);
  };

  const saveQueuedMessage = () => {
    const nextMessage = queuedMessageDraft.trim();
    if (nextMessage) onQueuedMessageChange?.(nextMessage);
    else if (onCancelQueuedMessage) onCancelQueuedMessage();
    else return;
    setIsEditingQueuedMessage(false);
  };

  const renderMessageTextContent: AIRenderTextContent = (text, context) => {
    if (context.messageId === QUEUED_MESSAGE_ID && isEditingQueuedMessage) {
      return (
        <textarea
          aria-label="Edit queued message"
          ref={queuedMessageEditorRef}
          className="border-border bg-card text-foreground focus-visible:ring-ring block min-h-20 w-full resize-y rounded border px-2 py-1.5 text-sm outline-none focus-visible:ring-2"
          value={queuedMessageDraft}
          onChange={(event) => setQueuedMessageDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsEditingQueuedMessage(false);
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              saveQueuedMessage();
            }
          }}
        />
      );
    }

    return renderTextContent?.(text, context) ?? text;
  };

  const renderQueuedMessageFooter: AIRenderMessageFooter = (message) => {
    if (message.id !== QUEUED_MESSAGE_ID) return null;

    return (
      <div className="flex items-center gap-1">
        {isEditingQueuedMessage ? (
          <>
            <Tooltip content="Save queued message">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Save queued message"
                onClick={saveQueuedMessage}
              >
                <CheckIcon size={14} aria-hidden="true" />
              </Button>
            </Tooltip>
            <Tooltip content="Cancel editing">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Cancel editing queued message"
                onClick={() => setIsEditingQueuedMessage(false)}
              >
                <CloseIcon size={14} aria-hidden="true" />
              </Button>
            </Tooltip>
          </>
        ) : (
          onQueuedMessageChange && (
            <Tooltip content="Edit queued message">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Edit queued message"
                onClick={startQueuedMessageEdit}
              >
                <PencilIcon size={14} aria-hidden="true" />
              </Button>
            </Tooltip>
          )
        )}
        {onCancelQueuedMessage && !isEditingQueuedMessage && (
          <Tooltip content="Cancel queued message">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Cancel queued message"
              onClick={onCancelQueuedMessage}
            >
              <CloseIcon size={14} aria-hidden="true" />
            </Button>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div
      ref={shellRef}
      data-slot="ozwell-chat"
      className={cn(
        'bg-muted text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden font-sans',
        '[&_[data-slot="ai-chat"]]:min-h-0 [&_[data-slot="ai-chat-messages"]]:min-h-0',
        '[&_[data-slot="ai-tool-call"]]:p-2 [&_[data-slot="ai-tool-icon"]]:h-7 [&_[data-slot="ai-tool-icon"]]:w-7',
        '[&_[data-slot="ai-tool-content"]]:text-sm [&_[data-slot="ai-tool-parameters"]]:text-xs [&_[data-slot="ai-tool-result"]]:text-xs',
        '[&_[data-slot="ai-message-thinking"]_button]:px-2.5 [&_[data-slot="ai-message-thinking"]_button]:py-[7px]',
        '[&_[data-slot="ai-message"].flex-row-reverse_[data-slot="ai-message-avatar"]]:hidden',
        className
      )}
    >
      {(thinking?.enabled || showMessagesNav) && (
        <div className="border-border bg-card text-foreground flex items-center justify-between gap-2 border-b px-2.5 py-[7px] text-xs font-semibold">
          <div className="flex min-w-0 items-center gap-1.5">
            {thinking?.enabled && (
              <Dropdown
                open={thinkingMenuOpen}
                onOpenChange={setThinkingMenuOpen}
                placement="bottom-start"
                width={248}
                className="max-w-[min(248px,calc(100vw-24px))] rounded-lg"
                trigger={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="max-w-[190px] overflow-hidden rounded-lg text-ellipsis whitespace-nowrap"
                    aria-label={`Show thinking: ${selectedThinkingOption?.label ?? 'Auto'}`}
                  >
                    Show thinking: {selectedThinkingOption?.label ?? 'Auto'}
                  </Button>
                }
              >
                <DropdownContent className="p-1.5">
                  {THINKING_OPTIONS.map((option) => (
                    <DropdownItem
                      key={option.value}
                      searchText={`${option.label} ${option.description}`}
                      onClick={() => {
                        thinking.onModeChange?.(option.value);
                        setThinkingMenuOpen(false);
                      }}
                      className={cn(
                        'p-2',
                        option.value === thinking.mode &&
                          'bg-primary-50 text-primary-800'
                      )}
                      aria-current={
                        option.value === thinking.mode ? 'true' : undefined
                      }
                    >
                      <Tooltip
                        content={option.description}
                        placement="right"
                        delay={150}
                        maxWidth={220}
                      >
                        <span className="grid w-full min-w-0 gap-0.5">
                          <span className="text-xs leading-tight font-bold">
                            {option.label}
                          </span>
                          <span
                            className={cn(
                              'text-muted-foreground truncate text-[11px] leading-tight font-medium',
                              option.value === thinking.mode &&
                                'text-primary-800'
                            )}
                          >
                            {option.description}
                          </span>
                        </span>
                      </Tooltip>
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            )}
          </div>

          {showMessagesNav && (
            <Dropdown
              open={messagesMenuOpen}
              onOpenChange={setMessagesMenuOpen}
              placement="bottom-end"
              width={260}
              className="max-w-[min(260px,calc(100vw-24px))] rounded-[10px]"
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'min-h-[30px] rounded-lg',
                    messagesButtonFlare &&
                      'bg-primary-50 text-primary-800 animate-ozwell-message-flare'
                  )}
                >
                  Messages
                </Button>
              }
            >
              <DropdownContent className="max-h-60 overflow-y-auto p-1.5">
                {userMessageItems.map((item, index) => (
                  <DropdownItem
                    key={item.id}
                    searchText={item.text}
                    onClick={() => scrollToMessage(item.chatIndex)}
                    className="grid grid-cols-[22px_minmax(0,1fr)] gap-2 p-2"
                  >
                    <span className="bg-primary-50 text-primary-800 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold">
                      {index + 1}
                    </span>
                    <span className="text-foreground truncate text-xs leading-[1.35] font-medium">
                      {item.text}
                    </span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      )}

      {warning && (
        <div className="border-warning-300 bg-warning-50 border-b px-2.5 py-2 [&_[data-slot=toast-message]]:text-xs [&_[data-slot=toast-message]]:leading-[1.35] [&_[data-slot=toast]]:max-w-none [&_[data-slot=toast]]:min-w-0 [&_[data-slot=toast]]:rounded-lg [&_[data-slot=toast]]:p-2 [&_[data-slot=toast]]:shadow-none">
          <Toast
            id="ozwell-chat-warning"
            message={warning}
            variant="warning"
            onClose={onDismissWarning ?? (() => undefined)}
            dismissible={Boolean(onDismissWarning)}
          />
        </div>
      )}

      <AIChat
        messages={chatMessages}
        isGenerating={isGenerating}
        className={
          showModelSelector
            ? '[&_[data-slot="composer-input"]]:pe-[min(160px,44vw)]'
            : undefined
        }
        showHeader={false}
        height="100%"
        variant="embedded"
        size="full"
        inputPlaceholder={
          showModelSelector ? 'Ask a question...' : inputPlaceholder
        }
        onSendMessage={onSendMessage}
        renderTextContent={renderMessageTextContent}
        renderMessageFooter={renderQueuedMessageFooter}
        composerProps={{
          inputTrailing: modelSelector,
          disabled: false,
          isSending: false,
        }}
      />

      <div className="border-border bg-card text-muted-foreground border-t px-3 pt-2 pb-2.5 text-center text-[11px] leading-none">
        {footer}
      </div>
    </div>
  );
}
