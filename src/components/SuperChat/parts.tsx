/**
 * SuperChat — shared internal building blocks.
 *
 * Pure helpers + presentational pieces used by the three public components
 * ({@link SuperChat}, {@link SuperChatConversations}, {@link SuperChatInbox}).
 * Not part of the public API — import the components from `index.ts` instead.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { MCPToolCallDisplay } from '../AI/MCPToolCall';
import { SendIcon, SparklesIcon } from '../AI/icons';
import type {
  AIRenderTextContent,
  AttachmentKind,
  ComposerAttachment,
  Participant,
  SuperChatConversation,
  SuperChatLinkBuilder,
  SuperChatMessage,
  SuperChatRef,
} from './types';

// ============================================================================
// Helpers
// ============================================================================

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatTime(time: Date | string): string {
  return new Date(time).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function byTime(a: SuperChatMessage, b: SuperChatMessage): number {
  return new Date(a.time).getTime() - new Date(b.time).getTime();
}

export function lastActivityOf(c: SuperChatConversation): number {
  if (c.lastActivity) return new Date(c.lastActivity).getTime();
  const last = c.thread[c.thread.length - 1];
  return last ? new Date(last.time).getTime() : 0;
}

/** Compute mentioned participant ids from `@Name` tokens in the draft. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectMentions(
  text: string,
  participants: Participant[]
): string[] {
  const ids: string[] = [];
  for (const p of participants) {
    if (p.kind === 'system') continue;
    const token = '@' + p.name.split(' ')[0];
    // Match a whole mention token only: the `@` must not be preceded by a word
    // character or another `@`, and the token must not be followed by a word
    // character (so `@Triage` does not match `@TriageAgent`).
    const pattern = new RegExp(
      `(?<![\\w@])${escapeRegExp(token)}(?![\\w])`,
      'i'
    );
    if (pattern.test(text)) ids.push(p.id);
  }
  return ids;
}

export function lastMessageByTime(
  thread: SuperChatMessage[]
): SuperChatMessage | undefined {
  let latest: SuperChatMessage | undefined;
  let latestTime = -Infinity;
  for (const message of thread) {
    const t = new Date(message.time).getTime();
    if (t >= latestTime) {
      latest = message;
      latestTime = t;
    }
  }
  return latest;
}

// ============================================================================
// Avatar
// ============================================================================

export function ParticipantAvatar({
  participant,
  size = 'md',
}: {
  participant?: Participant;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';
  if (participant?.avatar) {
    return (
      <img
        src={participant.avatar}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', dim)}
      />
    );
  }
  const isAgent = participant?.kind === 'agent';
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        dim
      )}
      style={{
        backgroundColor:
          participant?.color ??
          (isAgent ? 'var(--mieweb-primary-700, #1f2937)' : '#64748b'),
      }}
      aria-hidden="true"
    >
      {isAgent ? (
        <SparklesIcon size="sm" />
      ) : (
        initials(participant?.name ?? '?')
      )}
    </div>
  );
}

// ============================================================================
// Reference chip (chat-component `ref` thread items)
// ============================================================================

export function ReferenceChip({
  reference,
  linkBuilder,
  onReferenceClick,
}: {
  reference: SuperChatRef;
  linkBuilder?: SuperChatLinkBuilder;
  onReferenceClick?: (ref: SuperChatRef) => void;
}) {
  const href = linkBuilder?.(reference);
  const content = (
    <>
      <span className="bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
        {reference.refType}
      </span>
      <span className="truncate">{reference.title}</span>
    </>
  );
  const className =
    'inline-flex max-w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200';
  if (href) {
    return (
      <a
        href={href}
        className={className}
        onClick={() => onReferenceClick?.(reference)}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => onReferenceClick?.(reference)}
    >
      {content}
    </button>
  );
}

// ============================================================================
// Message row
// ============================================================================

/** Small pencil glyph for the inline message-edit affordance. */
function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/** Paperclip glyph for the composer's attach-file affordance. */
function PaperclipIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

const ATTACHMENT_ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** Document glyph used for PDFs and unrecognized files. */
function FileIcon() {
  return (
    <svg {...ATTACHMENT_ICON_PROPS}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** Film/clapper glyph for video attachments. */
function VideoFileIcon() {
  return (
    <svg {...ATTACHMENT_ICON_PROPS}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

/** Musical-note glyph for audio attachments. */
function AudioFileIcon() {
  return (
    <svg {...ATTACHMENT_ICON_PROPS}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/**
 * Supported attachment categories: their `<input accept>` token and a MIME
 * matcher used to filter pastes and file-picker selections.
 */
const ATTACHMENT_KIND_CONFIG: Record<
  AttachmentKind,
  { accept: string; match: (type: string) => boolean }
> = {
  image: { accept: 'image/*', match: (t) => t.startsWith('image/') },
  video: { accept: 'video/*', match: (t) => t.startsWith('video/') },
  audio: { accept: 'audio/*', match: (t) => t.startsWith('audio/') },
  pdf: { accept: 'application/pdf', match: (t) => t === 'application/pdf' },
};

const DEFAULT_ACCEPTED_FILE_TYPES: AttachmentKind[] = [
  'image',
  'video',
  'audio',
  'pdf',
];

/** Resolve a MIME type to its broad category (for preview icons). */
function attachmentKindOf(type: string): AttachmentKind | 'file' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  return 'file';
}

/** Pick the preview icon for a non-image attachment. */
function AttachmentTypeIcon({ type }: { type: string }) {
  switch (attachmentKindOf(type)) {
    case 'video':
      return <VideoFileIcon />;
    case 'audio':
      return <AudioFileIcon />;
    default:
      return <FileIcon />;
  }
}

function ClipboardIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface CopyMenuProps {
  /** Aligns the popover to the outer margin (right for self, left otherwise). */
  isSelf: boolean;
  /** Markdown source for this message (plain-text / Markdown copy). */
  markdown: string;
  /** Read the rendered bubble HTML at copy time (rich-text copy). */
  getHtml: () => string;
  /** Read the rendered bubble plain text at copy time. */
  getText: () => string;
}

/**
 * Per-message copy control. The primary **Copy** writes *both* a rich-text
 * (`text/html`) and a Markdown (`text/plain`) representation in a single
 * clipboard write, so the paste target decides: rich editors get formatting,
 * plain editors get Markdown. Explicit "as Markdown" / "as plain text" options
 * are also offered.
 */
function CopyMenu({ isSelf, markdown, getHtml, getText }: CopyMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Close on outside click / Escape while the menu is open.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  React.useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const flash = () => {
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1200);
  };

  const writeText = async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Clipboard may be unavailable (insecure context / denied permission).
    }
  };

  const writeBoth = async () => {
    const html = getHtml();
    const text = markdown || getText();
    try {
      if (
        typeof window !== 'undefined' &&
        'ClipboardItem' in window &&
        navigator.clipboard?.write
      ) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await writeText(text);
      }
    } catch {
      await writeText(text);
    }
  };

  const run = (fn: () => Promise<void>) => {
    setOpen(false);
    void fn().then(flash);
  };

  return (
    <div
      ref={rootRef}
      // Self-align to the bottom of the (possibly tall) message row and stick to
      // the viewport bottom: on long messages the control follows the scroll and
      // settles at the message's end once it is fully in view. Raise the whole
      // (sticky) stacking context above the sibling bubble while open so the
      // menu sits over rich content like tables.
      className={cn(
        'sticky bottom-2 shrink-0 self-end',
        // Rich content (e.g. NITRO tables) layers internals up to z-50, so the
        // open menu's stacking context must clear that.
        open ? 'z-[60]' : 'z-10'
      )}
    >
      <button
        type="button"
        data-slot="superchat-copy-button"
        aria-label="Copy message"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-neutral-400 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-neutral-600 focus-visible:opacity-100 dark:hover:text-neutral-200"
      >
        {copied ? <CheckIcon /> : <ClipboardIcon />}
      </button>
      {open && (
        <div
          role="menu"
          data-slot="superchat-copy-menu"
          className={cn(
            'absolute bottom-full z-[60] mb-1 min-w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-left text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-800',
            isSelf ? 'end-0' : 'start-0'
          )}
        >
          <CopyMenuItem
            label="Copy"
            hint="Rich text + Markdown"
            onSelect={() => run(writeBoth)}
          />
          <CopyMenuItem
            label="Copy as Markdown"
            onSelect={() => run(() => writeText(markdown || getText()))}
          />
          <CopyMenuItem
            label="Copy as plain text"
            onSelect={() => run(() => writeText(getText()))}
          />
        </div>
      )}
    </div>
  );
}

function CopyMenuItem({
  label,
  hint,
  onSelect,
}: {
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex w-full flex-col items-start px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
    >
      <span>{label}</span>
      {hint && <span className="text-[10px] text-neutral-400">{hint}</span>}
    </button>
  );
}

interface MessageRowProps {
  message: SuperChatMessage;
  participant?: Participant;
  isSelf: boolean;
  renderText: AIRenderTextContent;
  linkBuilder?: SuperChatLinkBuilder;
  onReferenceClick?: (ref: SuperChatRef) => void;
  /** Whether self-authored text messages expose an inline "Edit" affordance. */
  editable?: boolean;
  /** Save handler for an inline message edit (bound to this message's id). */
  onMessageEdited?: (messageId: string, text: string) => void;
}

/**
 * A single thread row (message / system notice / reference chip).
 *
 * Wrapped in {@link React.memo}: in long threads the parent re-renders on every
 * new message, but each existing row's props are stable (the host owns the
 * message objects), so memoization skips re-rendering — and, crucially,
 * re-running the Markdown pipeline — for the hundreds of rows that did not
 * change. Keep the props referentially stable from the host for this to help.
 */
export const MessageRow = React.memo(function MessageRow({
  message,
  participant,
  isSelf,
  renderText,
  linkBuilder,
  onReferenceClick,
  editable,
  onMessageEdited,
}: MessageRowProps) {
  const streaming = message.status === 'streaming';
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(message.text ?? '');
  const editRef = React.useRef<HTMLTextAreaElement>(null);
  // The rendered bubble content, read at copy time for the rich-text payload.
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  // Grow the editor to fit its content (accounts for wrapped lines, not just
  // explicit newlines), clamped by the textarea's CSS max-height.
  const autosize = React.useCallback(() => {
    const el = editRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  // Move focus into the editor (caret at end) and size it when editing starts.
  React.useEffect(() => {
    if (!isEditing) return;
    const el = editRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    autosize();
  }, [isEditing, autosize]);

  if (message.type === 'system') {
    return (
      <div
        data-slot="superchat-system-message"
        role="status"
        className="my-1 text-center text-xs text-neutral-500 dark:text-neutral-400"
      >
        {message.text}
      </div>
    );
  }

  if (message.type === 'ref' && message.ref) {
    return (
      <div
        data-slot="superchat-reference"
        className={cn('flex', isSelf && 'justify-end')}
      >
        <ReferenceChip
          reference={message.ref}
          linkBuilder={linkBuilder}
          onReferenceClick={onReferenceClick}
        />
      </div>
    );
  }

  const accent = participant?.color;
  const authorName = participant?.name ?? 'Unknown';

  // Inline editing applies only to the local user's own plain-text messages
  // (rich content blocks / streaming messages are not inline-editable).
  const canEdit =
    !!editable &&
    isSelf &&
    !streaming &&
    typeof message.text === 'string' &&
    !message.content?.length;

  const startEdit = () => {
    setDraft(message.text ?? '');
    setIsEditing(true);
  };
  const cancelEdit = () => setIsEditing(false);
  const saveEdit = () => {
    const next = draft.trim();
    if (next && next !== message.text) onMessageEdited?.(message.id, next);
    setIsEditing(false);
  };

  // Paste an image into the editor: splice its Markdown at the caret so it
  // becomes part of the message source (the bubble renders Markdown).
  const handleEditPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length === 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    Promise.all(
      files.map(
        (file, i) =>
          new Promise<string>((resolve) => {
            const reader = new window.FileReader();
            reader.onload = () => {
              const dataUrl =
                typeof reader.result === 'string' ? reader.result : '';
              const name = file.name || `pasted-image-${i + 1}.png`;
              resolve(dataUrl ? `![${name}](${dataUrl})` : '');
            };
            reader.readAsDataURL(file);
          })
      )
    ).then((snippets) => {
      const insert = snippets.filter(Boolean).join('\n');
      if (!insert) return;
      // Insert via `execCommand('insertText')` so the browser records it on its
      // native undo stack (Cmd/Ctrl+Z works) and fires a normal input event
      // that flows back through `onChange`. Fall back to a controlled-state
      // splice if the (deprecated) command is unavailable.
      el.focus();
      el.setSelectionRange(start, end);
      const text = `${insert}\n`;
      const inserted =
        typeof document !== 'undefined' &&
        typeof document.execCommand === 'function' &&
        document.execCommand('insertText', false, text);
      if (!inserted) {
        setDraft((prev) => `${prev.slice(0, start)}${text}${prev.slice(end)}`);
      }
      requestAnimationFrame(autosize);
    });
  };

  // The Markdown source for copying: prefer the raw `text`, otherwise assemble
  // it from the message's text/code content blocks.
  const markdownSource =
    typeof message.text === 'string' && message.text
      ? message.text
      : (message.content
          ?.map((block) => {
            if (block.type === 'code' && block.text) {
              return `\`\`\`${block.language ?? ''}\n${block.text}\n\`\`\``;
            }
            if (
              (block.type === 'text' || block.type === 'thinking') &&
              block.text
            ) {
              return block.text;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n\n') ?? '');

  // A copy affordance appears on every message that has a body (not while it is
  // being edited).
  const canCopy =
    !isEditing &&
    (!!message.content?.length ||
      (typeof message.text === 'string' && message.text.length > 0));

  return (
    <div
      data-slot="superchat-message"
      role="article"
      aria-label={`${authorName}, ${formatTime(message.time)}`}
      className={cn(
        'group flex gap-2',
        isSelf ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <ParticipantAvatar participant={participant} size="sm" />
      <div className={cn('flex min-w-0 flex-col gap-1', isSelf && 'items-end')}>
        <div
          data-slot="superchat-message-meta"
          className="flex items-baseline gap-2"
        >
          <span
            className="text-xs font-medium"
            style={accent ? { color: accent } : undefined}
          >
            {authorName}
          </span>
          {participant?.role && (
            <span className="text-[10px] text-neutral-400">
              {participant.role}
            </span>
          )}
          <span className="text-[10px] text-neutral-400">
            {formatTime(message.time)}
          </span>
          {message.editedAt && (
            <span
              data-slot="superchat-edited-indicator"
              className="text-[10px] text-neutral-400"
              title={`Edited ${formatTime(message.editedAt)}`}
            >
              (edited)
            </span>
          )}
          {canEdit && !isEditing && (
            <button
              type="button"
              data-slot="superchat-edit-button"
              onClick={startEdit}
              aria-label="Edit message"
              className="rounded p-0.5 text-neutral-400 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-neutral-600 focus-visible:opacity-100 dark:hover:text-neutral-200"
            >
              <PencilIcon />
            </button>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1',
            isSelf ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {canCopy && (
            <CopyMenu
              isSelf={isSelf}
              markdown={markdownSource}
              getHtml={() => bubbleRef.current?.innerHTML ?? ''}
              getText={() => bubbleRef.current?.textContent ?? ''}
            />
          )}
          <div
            ref={bubbleRef}
            data-slot="superchat-bubble"
            className={cn(
              'w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
              isSelf
                ? 'bg-primary-800 text-white'
                : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
              message.status === 'error' &&
                'border border-red-300 dark:border-red-700'
            )}
            style={
              !isSelf && accent
                ? { borderLeft: `3px solid ${accent}` }
                : undefined
            }
          >
            {isEditing ? (
              <div
                data-slot="superchat-message-editor"
                className="flex w-80 max-w-full flex-col gap-2"
              >
                <textarea
                  value={draft}
                  ref={editRef}
                  rows={2}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    autosize();
                  }}
                  onPaste={handleEditPaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                  aria-label="Edit message"
                  className="focus:ring-primary-500 max-h-60 min-h-16 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:ring-1 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-neutral-200 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!draft.trim() || draft.trim() === message.text}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Rich content blocks (tool calls etc.) reused from the AI module. */}
                {message.content?.map((block, i) => {
                  if (block.type === 'tool_use' && block.toolCall) {
                    return (
                      <MCPToolCallDisplay key={i} toolCall={block.toolCall} />
                    );
                  }
                  if (
                    (block.type === 'text' || block.type === 'thinking') &&
                    block.text
                  ) {
                    return (
                      <div
                        key={i}
                        className="prose prose-sm dark:prose-invert max-w-none **:wrap-break-word"
                      >
                        {renderText(block.text, {
                          messageId: message.id,
                          streaming,
                          role:
                            participant?.kind === 'human'
                              ? 'user'
                              : 'assistant',
                        })}
                      </div>
                    );
                  }
                  if (block.type === 'code' && block.text) {
                    const fenced = `\`\`\`${block.language ?? ''}\n${block.text}\n\`\`\``;
                    return (
                      <div
                        key={i}
                        className="prose prose-sm dark:prose-invert max-w-none **:wrap-break-word"
                      >
                        {renderText(fenced, {
                          messageId: message.id,
                          streaming,
                          role:
                            participant?.kind === 'human'
                              ? 'user'
                              : 'assistant',
                        })}
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Plain `text` body (the common case). */}
                {message.text && (
                  <div className="prose prose-sm dark:prose-invert max-w-none **:wrap-break-word">
                    {renderText(message.text, {
                      messageId: message.id,
                      streaming,
                      role:
                        participant?.kind === 'human' ? 'user' : 'assistant',
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Composer
// ============================================================================

/** Match a trailing `@token` immediately before the caret. */
export function activeMentionQuery(
  value: string,
  caret: number
): { query: string; start: number } | null {
  const upToCaret = value.slice(0, caret);
  const match = /(^|\s)@([^\s@]*)$/.exec(upToCaret);
  if (!match) return null;
  const query = match[2];
  return { query, start: caret - query.length - 1 };
}

export function Composer({
  participants,
  disabled,
  onSend,
  acceptedFileTypes = DEFAULT_ACCEPTED_FILE_TYPES,
}: {
  participants: Participant[];
  disabled?: boolean;
  onSend: (
    text: string,
    mentions: string[],
    attachments: ComposerAttachment[]
  ) => void;
  /** File categories the composer accepts (paste + paperclip). */
  acceptedFileTypes?: AttachmentKind[];
}) {
  const [draft, setDraft] = React.useState('');
  const [attachments, setAttachments] = React.useState<ComposerAttachment[]>(
    []
  );
  const attachmentSeq = React.useRef(0);
  const [mention, setMention] = React.useState<{
    query: string;
    start: number;
  } | null>(null);
  const [highlight, setHighlight] = React.useState(0);
  const textareaRef = React.useRef<React.ComponentRef<'textarea'>>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Accepted file types → `<input accept>` token + a predicate for filtering
  // pastes and picker selections.
  const acceptKinds =
    acceptedFileTypes.length > 0
      ? acceptedFileTypes
      : DEFAULT_ACCEPTED_FILE_TYPES;
  const acceptAttr = React.useMemo(
    () =>
      Array.from(
        new Set(acceptKinds.map((k) => ATTACHMENT_KIND_CONFIG[k].accept))
      ).join(','),
    [acceptKinds]
  );
  const acceptsType = React.useCallback(
    (type: string) =>
      acceptKinds.some((k) => ATTACHMENT_KIND_CONFIG[k].match(type)),
    [acceptKinds]
  );

  // Agents/humans you can address (exclude the system participant).
  const mentionable = React.useMemo(
    () => participants.filter((p) => p.kind !== 'system'),
    [participants]
  );

  const suggestions = React.useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return mentionable.filter((p) => p.name.toLowerCase().includes(q));
  }, [mention, mentionable]);

  const menuOpen = mention !== null && suggestions.length > 0;
  const listboxId = React.useId();
  const optionId = (i: number) => `${listboxId}-option-${i}`;
  const activeOptionId = menuOpen ? optionId(highlight) : undefined;

  const syncMention = (value: string, caret: number) => {
    const next = activeMentionQuery(value, caret);
    setMention(next);
    setHighlight(0);
  };

  const insertMention = (participant: Participant) => {
    if (!mention) return;
    const first = participant.name.split(' ')[0];
    const before = draft.slice(0, mention.start);
    const after = draft.slice(mention.start + 1 + mention.query.length);
    const insert = `@${first} `;
    const nextValue = before + insert + after;
    setDraft(nextValue);
    setMention(null);
    // Restore caret just after the inserted mention.
    const caret = before.length + insert.length;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const submit = () => {
    const text = draft.trim();
    if (!text && attachments.length === 0) return;
    onSend(text, detectMentions(text, participants), attachments);
    setDraft('');
    setAttachments([]);
    setMention(null);
  };

  const readFile = (file: File) => {
    const reader = new window.FileReader();
    reader.onload = () => {
      const dataUrl =
        typeof reader.result === 'string' ? reader.result : undefined;
      if (!dataUrl) return;
      attachmentSeq.current += 1;
      setAttachments((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}-${attachmentSeq.current}`,
          name: file.name || `attachment-${attachmentSeq.current}`,
          type: file.type || 'application/octet-stream',
          dataUrl,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === 'file' && acceptsType(item.type))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length === 0) return;
    // We're handling the file ourselves; don't also paste a file path/blob.
    e.preventDefault();
    files.forEach(readFile);
  };

  const openFilePicker = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      acceptsType(f.type)
    );
    files.forEach(readFile);
    // Reset so selecting the same file again still fires `change`.
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSend =
    !disabled && (draft.trim().length > 0 || attachments.length > 0);

  return (
    <div
      data-slot="superchat-composer"
      className="relative flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-700"
    >
      {menuOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Mention a participant"
          className="absolute bottom-full left-3 z-10 mb-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          {suggestions.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                id={optionId(i)}
                role="option"
                aria-selected={i === highlight}
                // onMouseDown (not onClick) so the textarea doesn't blur first.
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(p);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                  i === highlight
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100'
                    : 'text-neutral-700 dark:text-neutral-200'
                )}
              >
                <ParticipantAvatar participant={p} size="sm" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{p.name}</span>
                  {p.role && (
                    <span className="ml-1 text-xs text-neutral-400">
                      {p.role}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-400">{p.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {attachments.length > 0 && (
          <ul
            data-slot="superchat-composer-attachments"
            className="flex flex-wrap gap-2"
          >
            {attachments.map((att) => {
              const isImage = att.type.startsWith('image/');
              return (
                <li
                  key={att.id}
                  className={cn(
                    'group/att relative flex h-16 items-center overflow-hidden rounded-lg border border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800',
                    isImage ? 'w-16' : 'w-44 max-w-full gap-2 px-2'
                  )}
                  title={att.name}
                >
                  {isImage ? (
                    // Local preview of an image; data: URL stays in-browser.
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                        <AttachmentTypeIcon type={att.type} />
                      </span>
                      <span className="min-w-0 flex-1 truncate pe-4 text-xs text-neutral-700 dark:text-neutral-200">
                        {att.name}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    aria-label={`Remove ${att.name}`}
                    className="absolute end-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900/70 text-white opacity-0 transition-opacity group-hover/att:opacity-100 focus:opacity-100 focus:outline-none"
                  >
                    <span aria-hidden className="text-xs leading-none">
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            syncMention(
              e.target.value,
              e.target.selectionStart ?? e.target.value.length
            );
          }}
          onClick={(e) => {
            const el = e.currentTarget;
            syncMention(el.value, el.selectionStart ?? el.value.length);
          }}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (menuOpen) {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlight((h) => (h + 1) % suggestions.length);
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlight(
                  (h) => (h - 1 + suggestions.length) % suggestions.length
                );
                return;
              }
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                // `highlight` can fall out of range if `suggestions` shrank while
                // the menu was open; fall back to the first suggestion.
                const chosen = suggestions[highlight] ?? suggestions[0];
                if (chosen) insertMention(chosen);
                return;
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setMention(null);
                return;
              }
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder={
            disabled
              ? 'Read-only conversation'
              : 'Type a message… use @ to address an agent'
          }
          aria-label="Message"
          role="combobox"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          name="superchat-message"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          className="focus:border-primary-500 focus:ring-primary-500 max-h-32 min-h-10 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={openFilePicker}
        disabled={disabled}
        aria-label="Attach files"
        title="Attach files"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        <PaperclipIcon />
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        className="bg-primary-800 hover:bg-primary-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-40"
      >
        <SendIcon />
      </button>
    </div>
  );
}

// ============================================================================
// Sidebar item style
// ============================================================================

export const sidebarItem = cva(
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
  {
    variants: {
      active: {
        true: 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100',
        false:
          'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
      },
    },
    defaultVariants: { active: false },
  }
);
