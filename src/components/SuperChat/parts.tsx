/**
 * SuperChat — shared internal building blocks.
 *
 * Pure helpers + presentational pieces used by the three public components
 * ({@link SuperChat}, {@link SuperChatConversations}, {@link SuperChatInbox}).
 * Not part of the public API — import the components from `index.ts` instead.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import {
  Check as CheckIcon,
  Clipboard as ClipboardIcon,
  Pencil as PencilIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Dropdown, DropdownItem } from '../Dropdown';
import { MCPToolCallDisplay } from '../AI/MCPToolCall';
import { ChatBubble, AITypingIndicator } from '../AI/AIMessage';
import { SparklesIcon } from '../AI/icons';
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
}: {
  participant?: Participant;
}) {
  const isAgent = participant?.kind === 'agent';
  const backgroundColor =
    participant?.color ??
    (isAgent ? 'var(--mieweb-primary-700, #1f2937)' : '#64748b');
  return (
    <Avatar
      size="xs"
      src={participant?.avatar}
      alt=""
      name={participant?.name ?? '?'}
      fallback={isAgent ? <SparklesIcon size="sm" /> : undefined}
      // Per-participant color (or agent/default) disambiguates concurrent
      // speakers; overrides Avatar's default primary background.
      style={{ backgroundColor }}
      aria-hidden="true"
      className="shrink-0"
    />
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
      <Badge
        variant="default"
        size="sm"
        className="rounded px-1.5 text-[10px] font-semibold tracking-wide uppercase"
      >
        {reference.refType}
      </Badge>
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

/**
 * Map SuperChat's high-level {@link AttachmentKind} categories to the
 * `<input accept>` tokens consumed by the shared `MessageComposer`.
 */
export function acceptTokensFor(
  kinds: AttachmentKind[] = DEFAULT_ACCEPTED_FILE_TYPES
): string[] {
  const source = kinds.length > 0 ? kinds : DEFAULT_ACCEPTED_FILE_TYPES;
  return Array.from(
    new Set(source.map((k) => ATTACHMENT_KIND_CONFIG[k].accept))
  );
}

/**
 * Read the `File` objects emitted by the shared `MessageComposer` into the
 * base64 `data:` URL {@link ComposerAttachment}s SuperChat hosts expect.
 */
export function filesToComposerAttachments(
  files: File[]
): Promise<ComposerAttachment[]> {
  return Promise.all(
    files.map(
      (file, i) =>
        new Promise<ComposerAttachment>((resolve, reject) => {
          const reader = new window.FileReader();
          reader.onload = () => {
            const dataUrl =
              typeof reader.result === 'string' ? reader.result : '';
            resolve({
              id: `att-${Date.now()}-${i}`,
              name: file.name || `attachment-${i}`,
              type: file.type || 'application/octet-stream',
              dataUrl,
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
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
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

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
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        placement={isSelf ? 'top-end' : 'top-start'}
        trigger={
          <button
            type="button"
            data-slot="superchat-copy-button"
            aria-label="Copy message"
            className="rounded p-1 text-neutral-400 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-neutral-600 focus-visible:opacity-100 dark:hover:text-neutral-200"
          >
            {copied ? (
              <CheckIcon size={14} aria-hidden="true" />
            ) : (
              <ClipboardIcon size={14} aria-hidden="true" />
            )}
          </button>
        }
      >
        <DropdownItem onClick={() => run(writeBoth)}>
          <span className="flex flex-col items-start">
            <span>Copy</span>
            <span className="text-[10px] font-normal text-neutral-400">
              Rich text + Markdown
            </span>
          </span>
        </DropdownItem>
        <DropdownItem
          onClick={() => run(() => writeText(markdown || getText()))}
        >
          Copy as Markdown
        </DropdownItem>
        <DropdownItem onClick={() => run(() => writeText(getText()))}>
          Copy as plain text
        </DropdownItem>
      </Dropdown>
    </div>
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
  const hasBody = !!message.text || (message.content?.length ?? 0) > 0;
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
      <ParticipantAvatar participant={participant} />
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
              <PencilIcon size={14} aria-hidden="true" />
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
          <ChatBubble
            ref={bubbleRef}
            data-slot="superchat-bubble"
            variant={isSelf ? 'user' : 'assistant'}
            hasError={message.status === 'error'}
            className="text-sm"
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

                {/* Animated typing indicator while a reply streams in with no
                    body yet — matches the AI chat's streaming affordance. */}
                {streaming && !hasBody && (
                  <div className="flex items-center justify-center">
                    <AITypingIndicator />
                  </div>
                )}
              </>
            )}
          </ChatBubble>
        </div>
      </div>
    </div>
  );
});

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
