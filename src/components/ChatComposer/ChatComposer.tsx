import * as React from 'react';
import { cn } from '../../utils/cn';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Dropdown, DropdownItem, DropdownSeparator } from '../Dropdown';
import {
  ComposerModelSelector,
  type ComposerModelSelectorProps,
} from '../AI/ComposerModelSelector';
import {
  AttachmentPreviewItem,
  DragDropZone,
  getFileType,
  validateFile,
  generateAttachmentId,
} from '../Messaging/AttachmentPicker';
import {
  MentionMenu,
  useMentionAutocomplete,
  type MentionOption,
} from '../Messaging/useMentionAutocomplete';
import type { AttachmentType, NewMessage } from '../Messaging/types';
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  BotIcon,
  CheckIcon,
  ChevronUpIcon,
  LoaderIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  StopIcon,
  XIcon,
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
  /**
   * Toggle state. When set (true or false) the item renders as a
   * `menuitemcheckbox` with `aria-checked` and a leading checkbox.
   */
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
  /**
   * Stage files programmatically (e.g. from a page-level drop zone or a
   * camera capture in `micSlot`). Deliberately NOT gated by
   * `allowAttachments` — that prop only hides the composer's own attach
   * affordances (the + button, paste, internal drop zone). Imperative calls
   * are explicit host actions; validation and `onError` still apply.
   */
  addFiles: (files: File[]) => void;
  /** Focus the text input. */
  focus: () => void;
  /**
   * The underlying textarea element, for host integrations that need caret
   * access (e.g. mention insertion via `setSelectionRange`).
   */
  getTextarea: () => HTMLTextAreaElement | null;
}

/** Structured context passed to `onError` so hosts can localize by reason. */
export interface ChatComposerError {
  reason: 'file-type' | 'file-size' | 'attachment-limit' | 'send-failed';
  /** The rejected file, when the error concerns a single file. */
  file?: File;
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
  /**
   * Disables all built-in interaction. Custom content (`micSlot`,
   * `addMenuItems` icons) is rendered as-is — hosts must disable their own
   * controls when they disable the composer.
   */
  disabled?: boolean;
  /** Shows the send button in a busy state and prevents duplicate sends. */
  isSending?: boolean;
  /** Autofocus the input on mount. */
  autoFocus?: boolean;
  /** Maximum message length. Sends are blocked while over the limit. */
  maxLength?: number;
  /** Show a character counter (requires `maxLength`). */
  showCharacterCount?: boolean;
  /**
   * Allow sending while the composer itself is empty (e.g. when the host
   * stages attachments outside the composer). The host receives a message
   * with empty `content` and no attachments and owns any further guarding.
   * @default false
   */
  canSendWhenEmpty?: boolean;
  /**
   * When the Enter key sends. `'desktop'` sends on Enter only on devices
   * with a fine pointer; on touch devices Return inserts a newline and the
   * send button sends (claude.ai / chatgpt.com parity). Shift+Enter always
   * inserts a newline, and Enter never sends mid IME composition.
   * @default 'desktop'
   */
  submitOnEnter?: 'desktop' | 'always' | 'never';
  /**
   * Maximum height of the auto-growing input: a pixel number or any CSS
   * length (e.g. `'40vh'`).
   * @default 160
   */
  maxHeight?: number | string;
  /**
   * Extra props spread onto the underlying textarea. Event handlers run
   * before the composer's built-in handlers; call `event.preventDefault()`
   * in `onKeyDown` / `onPaste` to claim that event (e.g. for a mention
   * menu's arrow/Enter navigation). `className` and `style` are merged
   * with the composer's own.
   */
  textareaProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'defaultValue'
  >;

  /** Extra entries for the `+` menu, rendered after the built-in items. */
  addMenuItems?: ChatComposerMenuItem[];
  /** Enable file attachments (built-in "Attach files" menu item, paste-to-attach, drag-and-drop, chips). @default true */
  allowAttachments?: boolean;
  /** Accepted file types for the picker/paste validation (native `accept` tokens). */
  acceptedFileTypes?: string[];
  /** Maximum file size in bytes. */
  maxFileSize?: number;
  /** Maximum number of staged attachments. @default 10 */
  maxAttachments?: number;

  /**
   * Candidates for `@mention` autocomplete. When provided (non-empty), typing
   * `@` opens a suggestion listbox (same behavior as `MessageComposer`).
   * Omit to disable mentions entirely (default).
   */
  mentionOptions?: MentionOption[];

  /**
   * Message being replied to. When set, a dismissible preview row renders at
   * the top of the card, the input is focused, and the sent `NewMessage`
   * carries `replyToId`. The host owns the state: sending does not clear it
   * (clear it in `onSend`), and the preview's close button only calls
   * `onCancelReply`. Same contract as `MessageComposer`.
   */
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  /** Called when the reply preview's cancel button is clicked. */
  onCancelReply?: () => void;

  /** Show the built-in mic button. @default false */
  showMic?: boolean;
  /** Called when the built-in mic button is clicked. */
  onMicClick?: () => void;
  /**
   * Custom node rendered in place of the built-in mic button (e.g.
   * `RecordButton`). The slot is wrapped in a 32px-tall (`h-8`) flex row so it
   * aligns with the other composer controls; taller content overflows and
   * stays vertically centered without inflating the row. Interaction state is
   * not managed: pass your own disabled state when the composer is `disabled`.
   */
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

  /**
   * Called when a file is rejected or a send fails. `message` is a default
   * English string; `context.reason` lets hosts substitute localized copy.
   */
  onError?: (message: string, context?: ChatComposerError) => void;

  /** Message reported when the attachment limit is hit. Overrides the English default. */
  attachmentLimitLabel?: string;
  /** Message reported when an async `onSend` rejects. @default 'Failed to send message' */
  sendFailedLabel?: string;
  /** Accessible label for the send button while `isSending`. @default 'Sending message…' */
  sendingLabel?: string;

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
  /** Accessible label for the `@mention` suggestion listbox. @default 'Mention' */
  mentionListLabel?: string;
  /** Overlay text shown while dragging files over the composer. @default 'Drop files here' */
  dropFilesLabel?: string;
  /** Prefix shown before the sender name in the reply preview. @default 'Replying to' */
  replyingToLabel?: string;
  /** Accessible label for the reply preview's cancel button. @default 'Cancel reply' */
  cancelReplyLabel?: string;

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

/** Touch-first devices (phones, tablets without a trackpad). */
const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)';

// ============================================================================
// Component
// ============================================================================

/**
 * Standardized chat input. At `md+` it renders as a single-row pill — `+`
 * menu, text input and actions (mic, send/stop) side by side; below `md` the
 * input stacks above the icon row. The optional agent/model selector row
 * hangs below the card on the page background.
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
    canSendWhenEmpty = false,
    submitOnEnter = 'desktop',
    maxHeight = MAX_INPUT_HEIGHT,
    textareaProps,
    addMenuItems,
    allowAttachments = true,
    acceptedFileTypes,
    maxFileSize,
    maxAttachments = 10,
    mentionOptions,
    replyTo = null,
    onCancelReply,
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
    attachmentLimitLabel,
    sendFailedLabel = 'Failed to send message',
    sendingLabel = 'Sending message…',
    inputLabel = 'Message input',
    addMenuLabel = 'Add to message',
    attachFilesLabel = 'Attach files',
    micLabel = 'Start voice input',
    sendLabel = 'Send message',
    stopLabel = 'Stop generating',
    agentSelectorLabel = 'Select agent',
    mentionListLabel = 'Mention',
    dropFilesLabel = 'Drop files here',
    replyingToLabel = 'Replying to',
    cancelReplyLabel = 'Cancel reply',
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

  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const [agentMenuOpen, setAgentMenuOpen] = React.useState(false);

  const isTouchDevice = useMediaQuery(TOUCH_DEVICE_QUERY);
  const sendsOnEnter =
    submitOnEnter === 'always' ||
    (submitOnEnter === 'desktop' && !isTouchDevice);

  // Focus the input when a reply target is set (MessageComposer parity).
  // Keyed on the id, not the object: hosts often build `replyTo` inline, so
  // an object dependency would re-steal focus (and reset the caret) on every
  // parent render while the user is typing.
  const replyToId = replyTo?.id;
  React.useEffect(() => {
    if (replyToId !== undefined) {
      textareaRef.current?.focus();
    }
  }, [replyToId]);

  const hasText = value.trim().length > 0;
  const hasContent = hasText || attachments.length > 0;
  const isOverLimit = maxLength !== undefined && value.length > maxLength;
  // Without an onSend handler, sending would silently discard the draft.
  const canSend =
    (hasContent || canSendWhenEmpty) &&
    onSend !== undefined &&
    !disabled &&
    !isSending &&
    !isStreaming &&
    !isOverLimit;

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

  // @mention autocomplete (opt-in via `mentionOptions`) — shared with
  // MessageComposer so both composers behave identically.
  const mention = useMentionAutocomplete({
    options: mentionOptions,
    value,
    setValue,
    textareaRef,
  });

  // Auto-grow the textarea. The cap is enforced with CSS max-height so it
  // can be any CSS length (e.g. '40vh'), not just a pixel number.
  const resizeTextarea = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    // While the textarea is not laid out (hidden container, e.g. a
    // just-mounted Storybook story or a closed panel) scrollHeight is 0 —
    // keep height auto and let the ResizeObserver below re-measure once
    // the element becomes visible.
    if (textarea.scrollHeight === 0) return;
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  React.useLayoutEffect(resizeTextarea, [resizeTextarea, value]);

  // Re-measure when the textarea's box changes for reasons other than
  // typing: the container becoming visible, width changes, font loading,
  // or crossing the md breakpoint (different paddings).
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === 'undefined') return;
    // Defer the re-measure to the next frame: mutating the observed
    // element's height synchronously inside the observer callback triggers
    // the browser's "ResizeObserver loop completed with undelivered
    // notifications" error, which dev overlays surface as a runtime error.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(resizeTextarea);
    });
    observer.observe(textarea);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [resizeTextarea]);

  // --------------------------------------------------------------------
  // Attachments
  // --------------------------------------------------------------------

  const addFiles = React.useCallback(
    (files: File[]) => {
      // No `allowAttachments` gate here: every user-facing entry point
      // (paste handler, + button, internal drop zone) is gated separately,
      // so this only opens the imperative `ref.addFiles()` path for hosts
      // (e.g. MessageThread's camera capture with the picker disabled).
      if (files.length === 0) return;
      // Staging happens outside the state updater so object-URL creation,
      // id generation and onError stay out of a function React may re-invoke.
      const limitMessage =
        attachmentLimitLabel ??
        `Attachment limit reached (max ${maxAttachments})`;
      const room = maxAttachments - attachmentsRef.current.length;
      if (files.length > room) {
        onError?.(limitMessage, { reason: 'attachment-limit' });
        if (room <= 0) return;
      }
      const staged: StagedAttachment[] = [];
      for (const file of files.slice(0, Math.max(room, 0))) {
        const typeCheck = validateFile(file, acceptedFileTypes, undefined);
        if (!typeCheck.valid) {
          onError?.(`${file.name}: ${typeCheck.error}`, {
            reason: 'file-type',
            file,
          });
          continue;
        }
        const sizeCheck = validateFile(file, undefined, maxFileSize);
        if (!sizeCheck.valid) {
          onError?.(`${file.name}: ${sizeCheck.error}`, {
            reason: 'file-size',
            file,
          });
          continue;
        }
        const type = getFileType(file.type);
        staged.push({
          id: generateAttachmentId(),
          file,
          type,
          previewUrl:
            type === 'image' || type === 'video'
              ? URL.createObjectURL(file)
              : undefined,
        });
      }
      if (staged.length > 0) {
        // Reserve slots synchronously: a second addFiles call in the same
        // React batch reads attachmentsRef before re-render, so without this
        // both calls could see the same free room and overshoot the cap.
        attachmentsRef.current = [...attachmentsRef.current, ...staged];
        setAttachments((current) => [...current, ...staged]);
      }
    },
    [
      maxAttachments,
      acceptedFileTypes,
      maxFileSize,
      onError,
      attachmentLimitLabel,
    ]
  );

  const removeAttachment = React.useCallback((id: string) => {
    // Same discipline as addFiles: revoke and update the ref synchronously,
    // keep the state updater pure (StrictMode may re-invoke it).
    const target = attachmentsRef.current.find(
      (attachment) => attachment.id === id
    );
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    attachmentsRef.current = attachmentsRef.current.filter(
      (attachment) => attachment.id !== id
    );
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== id)
    );
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
      getTextarea: () => textareaRef.current,
    }),
    [addFiles]
  );

  // --------------------------------------------------------------------
  // Sending
  // --------------------------------------------------------------------

  const handleSend = () => {
    if (!canSend || !onSend) return;
    const message: NewMessage = {
      content: value.trim(),
      attachments: attachments.map((attachment) => attachment.file),
      // Only add the key when replying — hosts may key-check the payload.
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    };
    for (const attachment of attachments) {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    }
    // Clear the ref alongside the state: the unmount cleanup reads the ref,
    // so if onSend unmounts the composer synchronously it must not see (and
    // re-revoke) the already-revoked preview URLs.
    attachmentsRef.current = [];
    setAttachments([]);
    setValue('');
    // The draft is cleared optimistically; hosts own retry/restore. Both a
    // synchronous throw and a rejected promise surface through onError
    // instead of being swallowed.
    try {
      Promise.resolve(onSend(message)).catch(() => {
        onError?.(sendFailedLabel, { reason: 'send-failed' });
      });
    } catch {
      onError?.(sendFailedLabel, { reason: 'send-failed' });
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // @mention menu navigation takes priority over send.
    if (mention.handleKeyDown(event)) return;
    // Enter confirms an IME candidate (CJK input) rather than sending.
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey && sendsOnEnter) {
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
        // A live status region (implicit aria-live="polite"): readOnly can
        // flip at runtime (e.g. after permissions resolve), and screen-reader
        // users must be told the input became read-only.
        role="status"
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

  // One responsive grid: below `md` the input sits on row 1 spanning all
  // columns with the `+`/actions on row 2; at `md+` the `+`, input and
  // actions sit side by side on row 1 as a single pill (actions pin to the
  // bottom via self-end as the input grows).
  const cells = {
    input:
      'col-span-3 col-start-1 row-start-1 px-1 pt-1 md:col-span-1 md:col-start-2 md:self-end md:px-0 md:py-1.5',
    textarea: 'px-2 pt-2 pb-1 md:py-1.5',
    add: 'col-start-1 row-start-2 pb-2 ps-2 md:row-start-1 md:self-end md:p-1.5 md:pe-0.5',
    actions:
      'col-start-3 row-start-2 flex items-center gap-1 pb-2 pe-2 md:row-start-1 md:self-end md:gap-0.5 md:p-1.5 md:ps-0.5',
  };

  const composerCard = (
    <>
      {replyTo && (
        <div
          data-slot="chat-composer-reply-preview"
          className={cn(
            'flex items-center gap-2 rounded-t-2xl px-4 py-2',
            'bg-neutral-50 dark:bg-neutral-800/50',
            'border-b border-neutral-200 dark:border-neutral-700',
            'border-s-primary-500 border-s-4'
          )}
        >
          {/* role="status" politely announces the reply target to screen readers
              when the row is inserted (focus jumps to the textarea, so the text
              would otherwise be skipped). The cancel button stays outside it. */}
          <div role="status" className="min-w-0 flex-1">
            <span className="text-primary-800 dark:text-primary-400 block text-xs font-medium">
              {replyingToLabel} {replyTo.senderName}
            </span>
            <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">
              {replyTo.content}
            </p>
          </div>
          <button
            type="button"
            data-slot="chat-composer-cancel-reply"
            aria-label={cancelReplyLabel}
            disabled={disabled}
            onClick={onCancelReply}
            className={iconButtonClasses}
          >
            <XIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

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
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto]">
        {/* Inset cell: the textarea sits inside the card with a matching
            inner radius so focus outlines / a11y highlights render as a
            clean nested rounded rect instead of stacking on the card's
            border. The padding split (cell + textarea) keeps the text in
            place using only standard utilities. */}
        <div className={cells.input} ref={mention.anchorRef}>
          <MentionMenu
            mention={mention}
            label={mentionListLabel}
            dataSlot="chat-composer-mention-list"
          />
          <textarea
            // Mobile keyboard hints; overridable via `textareaProps`.
            enterKeyHint={sendsOnEnter ? 'send' : 'enter'}
            {...textareaProps}
            ref={textareaRef}
            data-slot="chat-composer-input"
            value={value}
            onChange={(event) => {
              textareaProps?.onChange?.(event);
              setValue(event.target.value);
              mention.sync(
                event.target.value,
                event.target.selectionStart ?? event.target.value.length
              );
            }}
            // Host handlers run first; preventDefault() opts out of the
            // built-in behavior (mention menu, Enter-to-send,
            // paste-to-attach).
            onKeyDown={(event) => {
              textareaProps?.onKeyDown?.(event);
              if (event.defaultPrevented) return;
              handleKeyDown(event);
            }}
            onClick={(event) => {
              textareaProps?.onClick?.(event);
              if (event.defaultPrevented) return;
              const el = event.currentTarget;
              mention.sync(el.value, el.selectionStart ?? el.value.length);
            }}
            onPaste={(event) => {
              textareaProps?.onPaste?.(event);
              if (event.defaultPrevented) return;
              handlePaste(event);
            }}
            placeholder={placeholder}
            disabled={disabled}
            // Host-opt-in only; off by default.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            rows={1}
            aria-label={inputLabel}
            {...mention.inputProps}
            style={{
              ...textareaProps?.style,
              maxHeight:
                typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
            }}
            className={cn(
              'block w-full resize-none bg-transparent',
              'rounded-lg text-sm',
              cells.textarea,
              'text-neutral-900 placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500',
              // Ring the input itself on focus rather than the whole shell.
              'focus:ring-primary-500 focus:ring-1 focus:outline-none',
              'disabled:cursor-not-allowed',
              textareaProps?.className
            )}
          />
        </div>

        {showAddMenu && (
          <div className={cells.add}>
            <Dropdown
              placement="top-start"
              open={addMenuOpen}
              onOpenChange={setAddMenuOpen}
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
                  icon={
                    <PaperclipIcon className="h-4 w-4" aria-hidden="true" />
                  }
                  onClick={() => {
                    setAddMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
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
                  checked={item.checked}
                  onClick={() => {
                    setAddMenuOpen(false);
                    item.onSelect?.();
                  }}
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
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

        <div className={cells.actions}>
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
            (micSlot != null ? (
              // Normalize slot content (e.g. a RecordButton) to the 32px
              // control row: taller content overflow-centers instead of
              // inflating the pill and pushing the other cells apart. A div
              // so block-level slot content stays valid HTML.
              <div
                data-slot="chat-composer-mic-slot"
                className="flex h-8 shrink-0 items-center"
              >
                {micSlot}
              </div>
            ) : (
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
              disabled={disabled}
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
              aria-label={isSending ? sendingLabel : sendLabel}
              aria-busy={isSending || undefined}
              disabled={!canSend}
              onClick={handleSend}
              className={cn(
                iconButtonClasses,
                canSend &&
                  'bg-primary-800 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 text-white hover:text-white dark:hover:text-white'
              )}
            >
              {isSending ? (
                <LoaderIcon
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );

  const selectorsRow = showSelectorRow && (
    <div
      data-slot="chat-composer-selectors"
      className="flex items-center justify-between gap-2 px-2 pt-1"
    >
      {showAgentSelector ? (
        <Dropdown
          placement="top-start"
          open={agentMenuOpen}
          onOpenChange={setAgentMenuOpen}
          trigger={
            <button
              type="button"
              data-slot="chat-composer-agent-trigger"
              aria-label={
                selectedAgentOption
                  ? `${agentSelectorLabel}: ${selectedAgentOption.label}`
                  : agentSelectorLabel
              }
              disabled={disabled}
              className={selectorTriggerClasses}
            >
              {selectedAgentOption?.icon ?? (
                <BotIcon className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="min-w-0 truncate">
                {selectedAgentOption?.label ?? agentSelectorLabel}
              </span>
              <ChevronUpIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            </button>
          }
        >
          {agents.map((agent) => (
            <DropdownItem
              key={agent.id}
              icon={agent.icon}
              role="menuitemradio"
              aria-checked={agent.id === selectedAgent}
              onClick={() => {
                setAgentMenuOpen(false);
                onAgentChange?.(agent.id);
              }}
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
        <ComposerModelSelector
          variant="ghost"
          {...modelSelectorProps}
          disabled={disabled || modelSelectorProps.disabled}
        />
      )}
    </div>
  );

  // The bordered card holds only the input row(s); the selector row hangs
  // below it on the page background. When attachments are enabled the card
  // doubles as a drop target; all dropped files run through `addFiles` so
  // validation and structured `onError` reporting stay in one place (the
  // zone itself does not validate).
  const card = (
    <div
      data-slot="chat-composer-card"
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white shadow-sm',
        'dark:border-[#2e2e30] dark:bg-[#1c1c1e]'
      )}
    >
      {composerCard}
    </div>
  );

  return (
    <div
      data-slot="chat-composer"
      className={cn(
        'flex w-full flex-col',
        disabled && 'opacity-60',
        className
      )}
    >
      {allowAttachments ? (
        <DragDropZone
          onFilesDropped={addFiles}
          maxFiles={Number.MAX_SAFE_INTEGER}
          disabled={disabled}
          overlayLabel={dropFilesLabel}
        >
          {card}
        </DragDropZone>
      ) : (
        card
      )}
      {selectorsRow}
    </div>
  );
});

ChatComposer.displayName = 'ChatComposer';
