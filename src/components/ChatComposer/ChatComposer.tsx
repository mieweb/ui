import * as React from 'react';
import { cn } from '../../utils/cn';
import { Dropdown, DropdownItem, DropdownSeparator } from '../Dropdown';
import {
  ComposerModelSelector,
  type ComposerModelSelectorProps,
} from '../AI/ComposerModelSelector';
import {
  ComposerSelector,
  type ComposerSelectorOption,
} from './ComposerSelector';
import {
  AttachmentPreviewItem,
  DragDropZone,
  validateFile,
} from '../Messaging/AttachmentPicker';
import {
  hasBusyUpload,
  useAttachmentUploads,
  type AttachmentUpload,
  type AttachmentUploadState,
  type DiscardAttachment,
  type UploadAttachment,
  type UploadedAttachment,
} from './useAttachmentUploads';
import {
  MentionMenu,
  useMentionAutocomplete,
  type MentionOption,
} from '../Messaging/useMentionAutocomplete';
import type { AttachmentState, NewMessage } from '../Messaging/types';
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  BotIcon,
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

/**
 * What the composer says about uploads (`uploadAttachment`), each overridable
 * through `uploadLabels`.
 */
export interface ChatComposerUploadLabels {
  /** A file uploading: its tile's progress name, and what's announced. */
  uploading: (name: string) => string;
  /** On a tile once the last byte is in and the host is still finishing. */
  processing: string;
  /** Announced when a file has uploaded. */
  uploaded: (name: string) => string;
  /** Announced, and reported through `onError`, when a file didn't upload. */
  failed: (name: string) => string;
  /** The failed tile's button. */
  retry: string;
  /** The remove button while a file is uploading. */
  cancel: (name: string) => string;
}

/** How each upload state shows on its tile (processing is still a busy tile). */
const TILE_STATE = {
  pending: 'pending',
  uploading: 'uploading',
  processing: 'uploading',
  uploaded: 'uploaded',
  failed: 'failed',
} as const satisfies Record<AttachmentUploadState, AttachmentState>;

const DEFAULT_UPLOAD_LABELS: ChatComposerUploadLabels = {
  uploading: (name) => `Uploading ${name}`,
  processing: 'Processing…',
  uploaded: (name) => `${name} uploaded`,
  failed: (name) => `${name} didn't upload`,
  retry: 'Retry',
  cancel: (name) => `Cancel upload of ${name}`,
};

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

/** An alternative way to send, offered in the menu beside the send button. */
export interface ChatComposerSendOption {
  /** Stable id, passed back to `onSend` as `meta.sendOption`. */
  id: string;
  /** Display label, e.g. "Send later…" or "Send without notifying". */
  label: React.ReactNode;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Whether the option is disabled. */
  disabled?: boolean;
}

/** Context for a send, beyond the message itself. */
export interface ChatComposerSendMeta {
  /** Id of the {@link ChatComposerSendOption} chosen; absent for a plain send. */
  sendOption?: string;
}

// An interface (not an alias) so hosts can keep augmenting it via declaration merging.
/** An agent shown in the composer's agent selector (trigger icon defaults to a bot glyph). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ChatComposerAgentOption extends ComposerSelectorOption {}

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
  /**
   * Stage files that were uploaded already (`uploadAttachment`), without
   * uploading them again: e.g. putting a failed send's attachments back.
   */
  restoreAttachments: (uploads: UploadedAttachment[]) => void;
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
  reason:
    | 'file-type'
    | 'file-size'
    | 'attachment-limit'
    | 'send-failed'
    | 'upload-failed';
  /** The rejected file, when the error concerns a single file. */
  file?: File;
}

export interface ChatComposerProps {
  /**
   * Called when the user sends a message. `meta` is passed only when the
   * send came from one of `sendOptions`.
   */
  onSend?: (
    message: NewMessage,
    meta?: ChatComposerSendMeta
  ) => void | Promise<void>;
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
   * How the input and its controls are arranged.
   * - `'responsive'`: below `md` the input sits on its own row with the `+`
   *   and actions underneath; at `md+` everything shares one pill-shaped row.
   * - `'stacked'`: the input always sits on its own full-width row with the
   *   controls underneath, at every width — for hosts that put labelled
   *   buttons in `leadingSlot`, which need the room.
   * @default 'responsive'
   */
  layout?: 'responsive' | 'stacked';
  /**
   * Maximum height of the auto-growing input: a pixel number or any CSS
   * length. Prefer small-viewport units (e.g. `'30svh'`) over `vh`: on iOS
   * `vh` is the full screen and ignores the on-screen keyboard.
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

  /**
   * Custom node rendered at the leading edge, before the `+` menu (e.g. a
   * voice-activation toggle). Wrapped in a 32px-tall (`h-8`) flex row so it
   * aligns with the other controls; taller content overflows and stays
   * vertically centered. Interaction state is not managed: pass your own
   * disabled state when the composer is `disabled`.
   */
  leadingSlot?: React.ReactNode;
  /** Extra entries for the `+` menu, rendered after the built-in items. */
  addMenuItems?: ChatComposerMenuItem[];
  /**
   * Other ways to send the draft (e.g. "Send later…"), shown in a menu on a
   * chevron beside the send button. Choosing one sends exactly like the send
   * button, with the option's id in `onSend`'s `meta.sendOption`; the host
   * decides what it means. Enter always does a plain send.
   */
  sendOptions?: ChatComposerSendOption[];
  /** Enable file attachments (built-in "Attach files" menu item, paste-to-attach, drag-and-drop, chips). @default true */
  allowAttachments?: boolean;
  /** Accepted file types for the picker/paste validation (native `accept` tokens). */
  acceptedFileTypes?: string[];
  /**
   * Largest file the composer takes, in bytes; a larger one is refused
   * (`onError`, reason `'file-size'`). A function sets the cap per file, e.g.
   * a higher one for videos than for photos; `undefined` from it means no cap.
   */
  maxFileSize?: number | ((file: File) => number | undefined);
  /** Maximum number of staged attachments. @default 10 */
  maxAttachments?: number;
  /**
   * Upload each file as soon as it's attached, instead of handing the host
   * `File`s at send. The tile shows its progress; removing it aborts
   * `context.signal`; a failure shows Retry. Send stays enabled: pressed
   * while files are uploading, it waits for them, then calls `onSend` with
   * `message.uploads` (each file and what this resolved to). If one failed,
   * nothing is sent and `onError` reports `'upload-failed'`.
   */
  uploadAttachment?: UploadAttachment<unknown>;
  /** Undo a finished upload removed (or abandoned on unmount) before it was sent. */
  discardAttachment?: DiscardAttachment<unknown>;
  /** Overrides for the upload wording (`uploadAttachment`). */
  uploadLabels?: Partial<ChatComposerUploadLabels>;

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
  /**
   * Custom node at the end of the bottom row, after the model selector (e.g.
   * a voice-activation selector). Shows the row even when no built-in
   * selector is enabled. Interaction state is not managed: pass your own
   * disabled state when the composer is `disabled`.
   */
  selectorsEndSlot?: React.ReactNode;

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
  /** Accessible label for the `sendOptions` menu trigger. @default 'More send options' */
  sendOptionsLabel?: string;
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

const MAX_INPUT_HEIGHT = 160;

/** Touch-first devices (phones, tablets without a trackpad). */
const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)';

// Touch detection as an external store: during hydration React renders the
// server snapshot (fine pointer) and then re-renders with the client value,
// so SSR-emitted attributes like `enterkeyhint` never go stale.
const subscribeTouchDevice = (onChange: () => void) => {
  const query = window.matchMedia?.(TOUCH_DEVICE_QUERY);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
};
const getTouchDeviceSnapshot = () =>
  window.matchMedia?.(TOUCH_DEVICE_QUERY).matches ?? false;
const getServerTouchDeviceSnapshot = () => false;

/**
 * Card descendants that keep their own pointer behavior (and text that
 * stays selectable) instead of forwarding a tap to the textarea.
 */
const CARD_INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'label',
  'video',
  '[role="listbox"]',
  '[role="menu"]',
  '[data-slot="chat-composer-reply-preview"]',
  '[data-slot="chat-composer-attachments"]',
].join(',');

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
    layout = 'responsive',
    maxHeight = MAX_INPUT_HEIGHT,
    textareaProps,
    leadingSlot,
    addMenuItems,
    sendOptions,
    allowAttachments = true,
    acceptedFileTypes,
    maxFileSize,
    maxAttachments = 10,
    uploadAttachment,
    discardAttachment,
    uploadLabels,
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
    selectorsEndSlot,
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
    sendOptionsLabel = 'More send options',
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

  // The staged files, each uploading as soon as it's added when the host
  // gives `uploadAttachment` (useAttachmentUploads).
  const uploads = useAttachmentUploads<unknown>({
    upload: uploadAttachment,
    discard: discardAttachment,
  });
  const attachments = uploads.items;
  const labels = React.useMemo(
    () => ({ ...DEFAULT_UPLOAD_LABELS, ...uploadLabels }),
    [uploadLabels]
  );
  // A send waiting for its files to finish uploading.
  const [awaitingUploads, setAwaitingUploads] = React.useState(false);
  const showSending = isSending || awaitingUploads;

  // What's announced as files upload: a start, a finish (politely) and a
  // failure (as an alert) — never each percent.
  const [uploadStatus, setUploadStatus] = React.useState({
    polite: '',
    alert: '',
  });
  const announcedStates = React.useRef(new Map<string, string>());
  React.useEffect(() => {
    if (!uploadAttachment) return;
    const seen = new Map<string, string>();
    let polite = '';
    let alert = '';
    for (const item of attachments) {
      const before = announcedStates.current.get(item.id);
      seen.set(item.id, item.state);
      if (before === item.state) continue;
      const name = item.file.name;
      if (item.state === 'uploading' && before !== 'processing') {
        polite = labels.uploading(name);
      } else if (item.state === 'uploaded' && before !== undefined) {
        polite = labels.uploaded(name);
      } else if (item.state === 'failed') {
        alert = labels.failed(name);
      }
    }
    announcedStates.current = seen;
    if (polite || alert) {
      setUploadStatus((prev) => ({
        polite: polite || prev.polite,
        alert: alert || prev.alert,
      }));
    }
  }, [attachments, labels, uploadAttachment]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const [sendMenuOpen, setSendMenuOpen] = React.useState(false);

  const isTouchDevice = React.useSyncExternalStore(
    subscribeTouchDevice,
    getTouchDeviceSnapshot,
    getServerTouchDeviceSnapshot
  );
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

  // Host-opt-in autofocus, applied on the client only after confirming a
  // fine pointer. A rendered `autofocus` attribute would ship in SSR markup
  // (where the touch check can't run) and pop the on-screen keyboard over
  // the page the user just navigated to.
  React.useEffect(() => {
    if (!autoFocus) return;
    if (window.matchMedia?.(TOUCH_DEVICE_QUERY).matches) return;
    textareaRef.current?.focus();
    // Mount-only, matching native `autofocus` semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasText = value.trim().length > 0;
  const hasContent = hasText || attachments.length > 0;
  const isOverLimit = maxLength !== undefined && value.length > maxLength;
  // Without an onSend handler, sending would silently discard the draft.
  const canSend =
    (hasContent || canSendWhenEmpty) &&
    onSend !== undefined &&
    !disabled &&
    !isSending &&
    !awaitingUploads &&
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
      const room = maxAttachments - uploads.current().length;
      if (files.length > room) {
        onError?.(limitMessage, { reason: 'attachment-limit' });
        if (room <= 0) return;
      }
      const accepted: File[] = [];
      for (const file of files.slice(0, Math.max(room, 0))) {
        const typeCheck = validateFile(file, acceptedFileTypes, undefined);
        if (!typeCheck.valid) {
          onError?.(`${file.name}: ${typeCheck.error}`, {
            reason: 'file-type',
            file,
          });
          continue;
        }
        const sizeCheck = validateFile(
          file,
          undefined,
          typeof maxFileSize === 'function' ? maxFileSize(file) : maxFileSize
        );
        if (!sizeCheck.valid) {
          onError?.(`${file.name}: ${sizeCheck.error}`, {
            reason: 'file-size',
            file,
          });
          continue;
        }
        accepted.push(file);
      }
      // Staged synchronously (uploads.current() sees them at once), so a
      // second addFiles call in the same React batch can't overshoot the cap.
      uploads.add(accepted);
    },
    [
      maxAttachments,
      acceptedFileTypes,
      maxFileSize,
      onError,
      attachmentLimitLabel,
      uploads,
    ]
  );

  // Preview URLs are revoked, uploads aborted and unsent ones discarded by
  // useAttachmentUploads, on removal and on unmount.

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
      restoreAttachments: uploads.restore,
      focus: () => textareaRef.current?.focus(),
      getTextarea: () => textareaRef.current,
    }),
    [addFiles, uploads.restore]
  );

  // --------------------------------------------------------------------
  // Sending
  // --------------------------------------------------------------------

  // The draft as of now, for a send that goes out once its uploads finish.
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reportFailedUpload = (failed: AttachmentUpload) =>
    onError?.(labels.failed(failed.file.name), {
      reason: 'upload-failed',
      file: failed.file,
    });

  const deliver = (sendOption?: string) => {
    if (!onSend) return;
    const staged = uploads.take();
    const message: NewMessage = {
      content: valueRef.current.trim(),
      attachments: staged.map((attachment) => attachment.file),
      // Only with uploadAttachment: what each file's upload resolved to.
      ...(uploadAttachment
        ? {
            uploads: staged.map(({ file, result }) => ({ file, result })),
          }
        : {}),
      // Only add the key when replying — hosts may key-check the payload.
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    };
    setValue('');
    // The draft is cleared optimistically; hosts own retry/restore. Both a
    // synchronous throw and a rejected promise surface through onError
    // instead of being swallowed.
    try {
      // `meta` only for an option send, so plain-send payloads stay unchanged.
      const sent =
        sendOption === undefined
          ? onSend(message)
          : onSend(message, { sendOption });
      Promise.resolve(sent).catch(() => {
        onError?.(sendFailedLabel, { reason: 'send-failed' });
      });
    } catch {
      onError?.(sendFailedLabel, { reason: 'send-failed' });
    }
  };

  const handleSend = (sendOption?: string) => {
    if (!canSend || !onSend) return;
    textareaRef.current?.focus();
    const failed = uploads.current().find((item) => item.state === 'failed');
    if (failed) {
      reportFailedUpload(failed);
      return;
    }
    if (!hasBusyUpload(uploads.current())) {
      deliver(sendOption);
      return;
    }
    // Send stays pressable while files upload: wait for them, keeping the
    // draft and tiles in place, then send — or stop if one didn't make it.
    setAwaitingUploads(true);
    void uploads.settle().then((result) => {
      if (!alive.current) return;
      setAwaitingUploads(false);
      if (result.failed.length > 0) {
        reportFailedUpload(result.failed[0]);
        return;
      }
      deliver(sendOption);
    });
  };

  // Pressing a button moves focus off the textarea, which on mobile starts
  // dismissing the keyboard before `handleSend` refocuses it (a visible
  // close/reopen bounce). Cancelling mousedown keeps focus where it is; the
  // click still fires, and keyboard users can still tab to the button.
  const keepInputFocus = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  // Tapping the card's padding or empty toolbar space focuses the input
  // (claude.ai / chatgpt.com parity) instead of doing nothing — or, with the
  // keyboard open, blurring the input and dismissing it.
  const focusInputFromCard = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = event.target as HTMLElement;
    if (target.closest(CARD_INTERACTIVE_SELECTOR)) return;
    event.preventDefault();
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
  const showModel = showModelSelector && modelSelectorProps != null;
  const showSelectorsEnd = showModel || selectorsEndSlot != null;
  const showSelectorRow =
    showAgentSelector || showModelSelector || selectorsEndSlot != null;

  // One grid: the input sits on row 1 spanning all columns with the `+`/
  // actions on row 2. In the responsive layout, at `md+` the `+`, input and
  // actions move side by side onto row 1 as a single pill (actions pin to the
  // bottom via self-end as the input grows); the stacked layout keeps two rows.
  const stacked = layout === 'stacked';
  const cells = {
    // pb-3: breathing room below the textarea — otherwise its focus ring sits
    // flush against (or, with a short gap, still crowds) row 2's buttons.
    input: cn(
      'col-span-3 col-start-1 row-start-1 px-1 pt-1 pb-3',
      !stacked && 'md:col-span-1 md:col-start-2 md:self-end md:px-0 md:py-1.5'
    ),
    textarea: cn('px-2 pt-2 pb-1', !stacked && 'md:py-1.5'),
    // min-w-0 + flex-wrap: a `leadingSlot` with several buttons (e.g. Huddle's
    // Pulse/Ticket chips) must wrap onto its own lines instead of forcing this
    // auto-sized grid column — and the whole composer — wider than its container.
    add: cn(
      'col-start-1 row-start-2 min-w-0 flex-wrap pb-2 ps-2',
      !stacked && 'md:row-start-1 md:self-end md:p-1.5 md:pe-0.5'
    ),
    actions: cn(
      'col-start-3 row-start-2 flex items-center gap-1 pb-2 pe-2',
      !stacked && 'md:row-start-1 md:self-end md:gap-0.5 md:p-1.5 md:ps-0.5'
    ),
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
          {attachments.map((attachment) => {
            const busy =
              attachment.state === 'uploading' ||
              attachment.state === 'processing';
            const name = attachment.file.name;
            return (
              <AttachmentPreviewItem
                key={attachment.id}
                attachment={{
                  ...attachment,
                  state: TILE_STATE[attachment.state],
                  progress: busy
                    ? Math.round(attachment.progress * 100)
                    : undefined,
                }}
                onRemove={() => uploads.remove(attachment.id)}
                onRetry={
                  uploadAttachment
                    ? () => uploads.retry(attachment.id)
                    : undefined
                }
                disabled={disabled}
                progressLabel={labels.uploading(name)}
                processingLabel={labels.processing}
                retryLabel={labels.retry}
                removeLabel={busy ? labels.cancel(name) : undefined}
              />
            );
          })}
        </div>
      )}

      {uploadAttachment && (
        <>
          <span role="status" className="sr-only">
            {uploadStatus.polite}
          </span>
          <span role="alert" className="sr-only">
            {uploadStatus.alert}
          </span>
        </>
      )}

      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto]">
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
            inputMode="text"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck
            // Follows the typed script, so RTL text aligns correctly.
            dir="auto"
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
              // 16px below `sm`: iOS zooms the page when focusing an input
              // with a smaller font.
              'rounded-lg text-base sm:text-sm',
              cells.textarea,
              'text-neutral-900 placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500',
              // Ring the input itself on focus rather than the whole shell.
              'focus:ring-primary-500 focus:ring-1 focus:outline-none',
              'disabled:cursor-not-allowed',
              textareaProps?.className
            )}
          />
        </div>

        {(showAddMenu || leadingSlot != null) && (
          <div
            className={cn(
              cells.add,
              leadingSlot != null && 'flex items-center gap-0.5'
            )}
          >
            {leadingSlot != null && (
              <div
                data-slot="chat-composer-leading-slot"
                // min-w-0 + min-h (not a fixed h/shrink-0) so a crowded slot wraps
                // onto more lines instead of running under the send button.
                className="flex min-h-8 min-w-0 flex-wrap items-center"
              >
                {leadingSlot}
              </div>
            )}

            {showAddMenu && (
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
                {allowAttachments &&
                  addMenuItems &&
                  addMenuItems.length > 0 && <DropdownSeparator />}
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
            )}
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
              onMouseDown={keepInputFocus}
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
              aria-label={showSending ? sendingLabel : sendLabel}
              aria-busy={showSending || undefined}
              disabled={!canSend}
              onMouseDown={keepInputFocus}
              onClick={() => handleSend()}
              className={cn(
                iconButtonClasses,
                canSend &&
                  'bg-primary-800 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 text-white hover:text-white dark:hover:text-white'
              )}
            >
              {showSending ? (
                <LoaderIcon
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}

          {!(isStreaming && onStop) &&
            sendOptions &&
            sendOptions.length > 0 && (
              <Dropdown
                placement="top-end"
                open={sendMenuOpen}
                onOpenChange={setSendMenuOpen}
                trigger={
                  <button
                    type="button"
                    data-slot="chat-composer-send-options"
                    aria-label={sendOptionsLabel}
                    disabled={!canSend}
                    onMouseDown={keepInputFocus}
                    className={cn(iconButtonClasses, 'w-6')}
                  >
                    <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                }
              >
                {sendOptions.map((option) => (
                  <DropdownItem
                    key={option.id}
                    icon={option.icon}
                    disabled={option.disabled}
                    onClick={() => {
                      setSendMenuOpen(false);
                      handleSend(option.id);
                    }}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                  </DropdownItem>
                ))}
              </Dropdown>
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
        <ComposerSelector
          options={agents}
          value={selectedAgent}
          onChange={onAgentChange}
          label={agentSelectorLabel}
          icon={<BotIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          disabled={disabled}
          triggerSlot="chat-composer-agent-trigger"
        />
      ) : (
        <span aria-hidden="true" />
      )}

      {showSelectorsEnd && (
        <div
          data-slot="chat-composer-selectors-end"
          className="flex min-w-0 items-center gap-1"
        >
          {showModel && (
            <ComposerModelSelector
              variant="ghost"
              {...modelSelectorProps}
              disabled={disabled || modelSelectorProps.disabled}
            />
          )}
          {selectorsEndSlot}
        </div>
      )}
    </div>
  );

  // The bordered card holds only the input row(s); the selector row hangs
  // below it on the page background. When attachments are enabled the card
  // doubles as a drop target; all dropped files run through `addFiles` so
  // validation and structured `onError` reporting stay in one place (the
  // zone itself does not validate).
  const card = (
    // Pointer-only convenience: the textarea stays the keyboard/AT target.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      data-slot="chat-composer-card"
      onMouseDown={focusInputFromCard}
      className={cn(
        'cursor-text rounded-2xl border border-neutral-200 bg-white shadow-sm',
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
