import * as React from 'react';
import { cn } from '../../utils/cn';
import { Dropdown, DropdownItem, DropdownSeparator } from '../Dropdown';
import {
  ComposerModelSelector,
  type ComposerModelSelectorProps,
} from '../AI/ComposerModelSelector';
import {
  AttachmentPreviewItem,
  getFileType,
  validateFile,
  generateAttachmentId,
} from '../Messaging/AttachmentPicker';
import type { AttachmentType, NewMessage } from '../Messaging/types';
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  BotIcon,
  CheckIcon,
  ChevronUpIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  StopIcon,
} from '../Icons';

// ============================================================================
// Types
// ============================================================================

/** A file staged for sending, with preview metadata. */
interface StagedAttachment {
  id: string;
  file: File;
  previewUrl?: string;
  type: AttachmentType;
}

/** An entry in the composer's `+` menu. */
export interface ChatComposerMenuItem {
  /** Stable id (used as the React key). */
  id: string;
  /** Display label. */
  label: React.ReactNode;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Renders a trailing check for toggleable items. */
  checked?: boolean;
  /** Danger styling for destructive actions. */
  variant?: 'default' | 'danger';
  /** Called when the item is selected. */
  onSelect?: () => void;
}

/** An agent shown in the composer's agent selector. */
export interface ChatComposerAgentOption {
  /** Stable id (returned via `onAgentChange`). */
  id: string;
  /** Display label. */
  label: string;
  /** Optional leading icon (defaults to a bot glyph in the trigger). */
  icon?: React.ReactNode;
  /** Optional secondary text shown in the menu. */
  description?: string;
}

/** Imperative handle exposed via `ref` for host-level integrations. */
export interface ChatComposerHandle {
  /** Stage files programmatically (e.g. from a page-level drop zone). */
  addFiles: (files: File[]) => void;
  /** Focus the text input. */
  focus: () => void;
}

export interface ChatComposerProps {
  /** Called when the user sends a message. */
  onSend?: (message: NewMessage) => void | Promise<void>;
  /** Controlled input value. Leave undefined for uncontrolled usage. */
  value?: string;
  /** Called when the input value changes. */
  onValueChange?: (value: string) => void;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Disables all interaction. */
  disabled?: boolean;
  /** Shows the send button in a busy state and prevents duplicate sends. */
  isSending?: boolean;
  /** Autofocus the input on mount. */
  autoFocus?: boolean;
  /** Maximum message length. Sends are blocked while over the limit. */
  maxLength?: number;
  /** Show a character counter (requires `maxLength`). */
  showCharacterCount?: boolean;

  /** Extra entries for the `+` menu, rendered after the built-in items. */
  addMenuItems?: ChatComposerMenuItem[];
  /** Enable file attachments (built-in "Attach files" menu item, paste-to-attach, chips). @default true */
  allowAttachments?: boolean;
  /** Accepted file types for the picker/paste validation (native `accept` tokens). */
  acceptedFileTypes?: string[];
  /** Maximum file size in bytes. */
  maxFileSize?: number;
  /** Maximum number of staged attachments. @default 10 */
  maxAttachments?: number;

  /** Show the built-in mic button. @default false */
  showMic?: boolean;
  /** Called when the built-in mic button is clicked. */
  onMicClick?: () => void;
  /** Custom node rendered in place of the built-in mic button (e.g. `RecordButton`). */
  micSlot?: React.ReactNode;
  /** When to show the mic: always, or only while the composer is empty. @default 'always' */
  micBehavior?: 'always' | 'whenEmpty';

  /** While true, the send button becomes a stop button (requires `onStop`). */
  isStreaming?: boolean;
  /** Called when the stop button is clicked during streaming. */
  onStop?: () => void;

  /** Show the agent selector in the bottom row. @default false */
  showAgentSelector?: boolean;
  /** Agents available in the agent selector. */
  agents?: ChatComposerAgentOption[];
  /** Selected agent id (controlled). */
  selectedAgent?: string | null;
  /** Called when an agent is selected. */
  onAgentChange?: (agentId: string) => void;

  /** Show the model selector in the bottom row. @default false */
  showModelSelector?: boolean;
  /** Props passed through to the embedded `ComposerModelSelector`. */
  modelSelectorProps?: ComposerModelSelectorProps;

  /** Replaces the composer with a read-only notice. */
  readOnly?: boolean;
  /** Notice text shown when `readOnly` is set. */
  readOnlyMessage?: string;

  /** Called with a human-readable message when a file is rejected. */
  onError?: (error: string) => void;

  /** Accessible label for the text input. @default 'Message input' */
  inputLabel?: string;
  /** Accessible label for the `+` menu trigger. @default 'Add to message' */
  addMenuLabel?: string;
  /** Label for the built-in attach menu item. @default 'Attach files' */
  attachFilesLabel?: string;
  /** Accessible label for the built-in mic button. @default 'Start voice input' */
  micLabel?: string;
  /** Accessible label for the send button. @default 'Send message' */
  sendLabel?: string;
  /** Accessible label for the stop button. @default 'Stop generating' */
  stopLabel?: string;
  /** Accessible label / empty-state text for the agent selector. @default 'Select agent' */
  agentSelectorLabel?: string;

  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const iconButtonClasses = cn(
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
  'text-neutral-500 dark:text-neutral-400',
  'transition-colors duration-150',
  'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  'disabled:pointer-events-none disabled:opacity-40'
);

const selectorTriggerClasses = cn(
  'flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-xs',
  'text-neutral-600 dark:text-neutral-400',
  'transition-colors duration-150',
  'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  'disabled:pointer-events-none disabled:opacity-40'
);

const MAX_INPUT_HEIGHT = 160;

// ============================================================================
// Component
// ============================================================================

/**
 * Standardized chat input: an always-available text area on top, a quiet icon
 * toolbar below it (`+` menu, mic, send/stop), and an optional bottom row with
 * agent and model selectors.
 */
export const ChatComposer = React.forwardRef<
  ChatComposerHandle,
  ChatComposerProps
>(function ChatComposer(
  {
    onSend,
    value: controlledValue,
    onValueChange,
    placeholder = 'Type a message…',
    disabled = false,
    isSending = false,
    autoFocus = false,
    maxLength,
    showCharacterCount = false,
    addMenuItems,
    allowAttachments = true,
    acceptedFileTypes,
    maxFileSize,
    maxAttachments = 10,
    showMic = false,
    onMicClick,
    micSlot,
    micBehavior = 'always',
    isStreaming = false,
    onStop,
    showAgentSelector = false,
    agents = [],
    selectedAgent = null,
    onAgentChange,
    showModelSelector = false,
    modelSelectorProps,
    readOnly = false,
    readOnlyMessage = 'You have read-only access and cannot send messages.',
    onError,
    inputLabel = 'Message input',
    addMenuLabel = 'Add to message',
    attachFilesLabel = 'Attach files',
    micLabel = 'Start voice input',
    sendLabel = 'Send message',
    stopLabel = 'Stop generating',
    agentSelectorLabel = 'Select agent',
    className,
  },
  ref
) {
  const [internalValue, setInternalValue] = React.useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const [attachments, setAttachments] = React.useState<StagedAttachment[]>([]);
  const attachmentsRef = React.useRef(attachments);
  attachmentsRef.current = attachments;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasText = value.trim().length > 0;
  const hasContent = hasText || attachments.length > 0;
  const isOverLimit = maxLength !== undefined && value.length > maxLength;
  const canSend =
    hasContent && !disabled && !isSending && !isStreaming && !isOverLimit;

  // --------------------------------------------------------------------
  // Input handling
  // --------------------------------------------------------------------

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  // Auto-grow the textarea up to MAX_INPUT_HEIGHT.
  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [value]);

  // --------------------------------------------------------------------
  // Attachments
  // --------------------------------------------------------------------

  const addFiles = React.useCallback(
    (files: File[]) => {
      if (!allowAttachments || files.length === 0) return;
      setAttachments((current) => {
        const room = maxAttachments - current.length;
        if (room <= 0) {
          onError?.(`Maximum ${maxAttachments} attachments allowed`);
          return current;
        }
        if (files.length > room) {
          onError?.(`Maximum ${maxAttachments} attachments allowed`);
        }
        const staged: StagedAttachment[] = [];
        for (const file of files.slice(0, room)) {
          const validation = validateFile(file, acceptedFileTypes, maxFileSize);
          if (!validation.valid) {
            onError?.(`${file.name}: ${validation.error}`);
            continue;
          }
          const type = getFileType(file.type);
          staged.push({
            id: generateAttachmentId(),
            file,
            type,
            previewUrl:
              type === 'image' ? URL.createObjectURL(file) : undefined,
          });
        }
        return staged.length > 0 ? [...current, ...staged] : current;
      });
    },
    [allowAttachments, maxAttachments, acceptedFileTypes, maxFileSize, onError]
  );

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((attachment) => attachment.id !== id);
    });
  }, []);

  // Revoke any outstanding preview URLs on unmount.
  React.useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, []);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    addFiles(files);
    event.target.value = '';
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!allowAttachments) return;
    const files = Array.from(event.clipboardData.files);
    if (files.length > 0) {
      event.preventDefault();
      addFiles(files);
    }
  };

  React.useImperativeHandle(
    ref,
    () => ({
      addFiles,
      focus: () => textareaRef.current?.focus(),
    }),
    [addFiles]
  );

  // --------------------------------------------------------------------
  // Sending
  // --------------------------------------------------------------------

  const handleSend = () => {
    if (!canSend) return;
    const message: NewMessage = {
      content: value.trim(),
      attachments: attachments.map((attachment) => attachment.file),
    };
    for (const attachment of attachments) {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachments([]);
    setValue('');
    void onSend?.(message);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------

  if (readOnly) {
    return (
      <div
        data-slot="chat-composer"
        role="note"
        className={cn(
          'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm',
          'border-amber-300 bg-amber-50 text-amber-900',
          'dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200',
          className
        )}
      >
        <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span data-slot="chat-composer-readonly">{readOnlyMessage}</span>
      </div>
    );
  }

  const showAddMenu =
    allowAttachments || (addMenuItems && addMenuItems.length > 0);
  const micVisible =
    (showMic || onMicClick !== undefined || micSlot !== undefined) &&
    (micBehavior === 'always' || !hasContent);
  const showSelectorRow = showAgentSelector || showModelSelector;
  const selectedAgentOption =
    agents.find((agent) => agent.id === selectedAgent) ?? null;

  return (
    <div
      data-slot="chat-composer"
      className={cn(
        'rounded-xl border border-neutral-200 bg-white shadow-sm',
        'focus-within:border-primary-500 focus-within:ring-primary-500 focus-within:ring-1',
        'dark:border-neutral-700 dark:bg-neutral-800',
        disabled && 'opacity-60',
        className
      )}
    >
      {attachments.length > 0 && (
        <div
          data-slot="chat-composer-attachments"
          className="flex flex-wrap gap-2 px-3 pt-3"
        >
          {attachments.map((attachment) => (
            <AttachmentPreviewItem
              key={attachment.id}
              attachment={{ ...attachment, state: 'pending' }}
              onRemove={() => removeAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        data-slot="chat-composer-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        // Host-opt-in only; off by default.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        rows={1}
        aria-label={inputLabel}
        className={cn(
          'block w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm',
          'text-neutral-900 placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500',
          'focus:outline-none disabled:cursor-not-allowed'
        )}
      />

      <div
        data-slot="chat-composer-toolbar"
        className="flex items-center gap-1 px-2 pb-2"
      >
        {showAddMenu && (
          <Dropdown
            placement="top-start"
            trigger={
              <button
                type="button"
                data-slot="chat-composer-add-button"
                aria-label={addMenuLabel}
                disabled={disabled}
                className={iconButtonClasses}
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            }
          >
            {allowAttachments && (
              <DropdownItem
                icon={<PaperclipIcon className="h-4 w-4" aria-hidden="true" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {attachFilesLabel}
              </DropdownItem>
            )}
            {allowAttachments && addMenuItems && addMenuItems.length > 0 && (
              <DropdownSeparator />
            )}
            {addMenuItems?.map((item) => (
              <DropdownItem
                key={item.id}
                icon={item.icon}
                disabled={item.disabled}
                variant={item.variant}
                onClick={item.onSelect}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.checked && (
                    <CheckIcon
                      className="text-primary-600 dark:text-primary-400 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </DropdownItem>
            ))}
          </Dropdown>
        )}

        {allowAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes?.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

        <div className="ms-auto flex items-center gap-1">
          {showCharacterCount && maxLength !== undefined && (
            <span
              data-slot="chat-composer-char-count"
              aria-live="polite"
              className={cn(
                'pe-1 text-xs tabular-nums',
                isOverLimit
                  ? 'font-medium text-red-700 dark:text-red-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {value.length}/{maxLength}
            </span>
          )}

          {micVisible &&
            (micSlot ?? (
              <button
                type="button"
                data-slot="chat-composer-mic-button"
                aria-label={micLabel}
                disabled={disabled}
                onClick={onMicClick}
                className={iconButtonClasses}
              >
                <MicIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}

          {isStreaming && onStop ? (
            <button
              type="button"
              data-slot="chat-composer-stop-button"
              aria-label={stopLabel}
              onClick={onStop}
              className={cn(
                iconButtonClasses,
                'text-neutral-700 dark:text-neutral-200'
              )}
            >
              <StopIcon
                className="h-3.5 w-3.5 fill-current"
                aria-hidden="true"
              />
            </button>
          ) : (
            <button
              type="button"
              data-slot="chat-composer-send-button"
              aria-label={sendLabel}
              disabled={!canSend}
              onClick={handleSend}
              className={cn(
                iconButtonClasses,
                canSend &&
                  'bg-primary-800 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 text-white hover:text-white dark:hover:text-white'
              )}
            >
              <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {showSelectorRow && (
        <div
          data-slot="chat-composer-selectors"
          className="flex items-center justify-between gap-2 border-t border-neutral-100 px-2 py-1.5 dark:border-neutral-700"
        >
          {showAgentSelector ? (
            <Dropdown
              placement="top-start"
              trigger={
                <button
                  type="button"
                  data-slot="chat-composer-agent-trigger"
                  aria-label={agentSelectorLabel}
                  disabled={disabled}
                  className={selectorTriggerClasses}
                >
                  {selectedAgentOption?.icon ?? (
                    <BotIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span className="min-w-0 truncate">
                    {selectedAgentOption?.label ?? agentSelectorLabel}
                  </span>
                  <ChevronUpIcon
                    className="h-3 w-3 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              }
            >
              {agents.map((agent) => (
                <DropdownItem
                  key={agent.id}
                  icon={agent.icon}
                  onClick={() => onAgentChange?.(agent.id)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate">{agent.label}</span>
                      {agent.description && (
                        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {agent.description}
                        </span>
                      )}
                    </span>
                    {agent.id === selectedAgent && (
                      <CheckIcon
                        className="text-primary-600 dark:text-primary-400 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </DropdownItem>
              ))}
            </Dropdown>
          ) : (
            <span aria-hidden="true" />
          )}

          {showModelSelector && modelSelectorProps && (
            <ComposerModelSelector variant="ghost" {...modelSelectorProps} />
          )}
        </div>
      )}
    </div>
  );
});

ChatComposer.displayName = 'ChatComposer';
