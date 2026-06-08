/**
 * SuperChat — a native, multi-participant chat surface for `@mieweb/ui`.
 *
 * Preserves the `chat-component` API shape (conversation/thread, sidebar,
 * compose, read-only, `linkBuilder`, callbacks) while generalizing roles into a
 * {@link Participant} model (any mix of multiple agents + multiple humans).
 * Message text renders through the pluggable Markdown pipeline
 * ({@link createMarkdownRenderer}); rich plugins (code/math/genui/…) are opt-in.
 *
 * Controlled-props: the host owns conversation state. Concurrent agent replies
 * interleave by `time`; per-participant `color`/avatar/name keep them legible.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { MCPToolCallDisplay } from '../AI/MCPToolCall';
import { SendIcon, SparklesIcon, CloseIcon } from '../AI/icons';
import { createMarkdownRenderer } from './render/createMarkdownRenderer';
import type {
  AIRenderTextContent,
  Participant,
  SuperChatConversation,
  SuperChatLinkBuilder,
  SuperChatMessage,
  SuperChatRef,
  SuperChatRenderPlugin,
} from './types';

// ============================================================================
// Helpers
// ============================================================================

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(time: Date | string): string {
  return new Date(time).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function byTime(a: SuperChatMessage, b: SuperChatMessage): number {
  return new Date(a.time).getTime() - new Date(b.time).getTime();
}

function lastActivityOf(c: SuperChatConversation): number {
  if (c.lastActivity) return new Date(c.lastActivity).getTime();
  const last = c.thread[c.thread.length - 1];
  return last ? new Date(last.time).getTime() : 0;
}

/** Compute mentioned participant ids from `@Name` tokens in the draft. */
function detectMentions(text: string, participants: Participant[]): string[] {
  const ids: string[] = [];
  for (const p of participants) {
    if (p.kind === 'system') continue;
    const token = '@' + p.name.split(' ')[0];
    if (text.toLowerCase().includes(token.toLowerCase())) ids.push(p.id);
  }
  return ids;
}

function lastMessageByTime(
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

function ParticipantAvatar({
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
        alt={participant.name}
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
          participant?.color ?? (isAgent ? 'var(--mieweb-primary-700, #1f2937)' : '#64748b'),
      }}
      aria-hidden="true"
    >
      {isAgent ? <SparklesIcon size="sm" /> : initials(participant?.name ?? '?')}
    </div>
  );
}

// ============================================================================
// Reference chip (chat-component `ref` thread items)
// ============================================================================

function ReferenceChip({
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
      <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-800 uppercase dark:bg-primary-900/40 dark:text-primary-200">
        {reference.refType}
      </span>
      <span className="truncate">{reference.title}</span>
    </>
  );
  const className =
    'inline-flex max-w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200';
  if (href) {
    return (
      <a href={href} className={className} onClick={() => onReferenceClick?.(reference)}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={() => onReferenceClick?.(reference)}>
      {content}
    </button>
  );
}

// ============================================================================
// Message row
// ============================================================================

interface MessageRowProps {
  message: SuperChatMessage;
  participant?: Participant;
  isSelf: boolean;
  renderText: AIRenderTextContent;
  linkBuilder?: SuperChatLinkBuilder;
  onReferenceClick?: (ref: SuperChatRef) => void;
}

function MessageRow({
  message,
  participant,
  isSelf,
  renderText,
  linkBuilder,
  onReferenceClick,
}: MessageRowProps) {
  const streaming = message.status === 'streaming';

  if (message.type === 'system') {
    return (
      <div className="my-1 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {message.text}
      </div>
    );
  }

  if (message.type === 'ref' && message.ref) {
    return (
      <div className={cn('flex', isSelf && 'justify-end')}>
        <ReferenceChip
          reference={message.ref}
          linkBuilder={linkBuilder}
          onReferenceClick={onReferenceClick}
        />
      </div>
    );
  }

  const accent = participant?.color;

  return (
    <div
      data-slot="superchat-message"
      className={cn('flex gap-2', isSelf ? 'flex-row-reverse' : 'flex-row')}
    >
      <ParticipantAvatar participant={participant} size="sm" />
      <div className={cn('flex min-w-0 flex-col gap-1', isSelf && 'items-end')}>
        <div className="flex items-baseline gap-2">
          <span
            className="text-xs font-medium"
            style={accent ? { color: accent } : undefined}
          >
            {participant?.name ?? 'Unknown'}
          </span>
          {participant?.role && (
            <span className="text-[10px] text-neutral-400">{participant.role}</span>
          )}
          <span className="text-[10px] text-neutral-400">{formatTime(message.time)}</span>
        </div>

        <div
          className={cn(
            'w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
            isSelf
              ? 'bg-primary-800 text-white'
              : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
            message.status === 'error' && 'border border-red-300 dark:border-red-700'
          )}
          style={
            !isSelf && accent
              ? { borderLeft: `3px solid ${accent}` }
              : undefined
          }
        >
          {/* Rich content blocks (tool calls etc.) reused from the AI module. */}
          {message.content?.map((block, i) => {
            if (block.type === 'tool_use' && block.toolCall) {
              return <MCPToolCallDisplay key={i} toolCall={block.toolCall} />;
            }
            if ((block.type === 'text' || block.type === 'thinking') && block.text) {
              return (
                <div
                  key={i}
                  className="prose prose-sm dark:prose-invert max-w-none **:wrap-break-word"
                >
                  {renderText(block.text, {
                    messageId: message.id,
                    streaming,
                    role: participant?.kind === 'human' ? 'user' : 'assistant',
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
                    role: participant?.kind === 'human' ? 'user' : 'assistant',
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
                role: participant?.kind === 'human' ? 'user' : 'assistant',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Composer
// ============================================================================

/** Match a trailing `@token` immediately before the caret. */
function activeMentionQuery(
  value: string,
  caret: number
): { query: string; start: number } | null {
  const upToCaret = value.slice(0, caret);
  const match = /(^|\s)@([^\s@]*)$/.exec(upToCaret);
  if (!match) return null;
  const query = match[2];
  return { query, start: caret - query.length - 1 };
}

function Composer({
  participants,
  disabled,
  onSend,
}: {
  participants: Participant[];
  disabled?: boolean;
  onSend: (text: string, mentions: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');
  const [mention, setMention] = React.useState<{ query: string; start: number } | null>(
    null
  );
  const [highlight, setHighlight] = React.useState(0);
  const textareaRef = React.useRef<React.ComponentRef<'textarea'>>(null);

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
    if (!text) return;
    onSend(text, detectMentions(text, participants));
    setDraft('');
    setMention(null);
  };

  return (
    <div className="relative flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-neutral-700">
      {menuOpen && (
        <ul
          role="listbox"
          aria-label="Mention a participant"
          className="absolute bottom-full left-3 z-10 mb-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          {suggestions.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
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
                    <span className="ml-1 text-xs text-neutral-400">{p.role}</span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-400">{p.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          syncMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => {
          const el = e.currentTarget;
          syncMention(el.value, el.selectionStart ?? el.value.length);
        }}
        onKeyDown={(e) => {
          if (menuOpen) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => (h + 1) % suggestions.length);
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
              return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              insertMention(suggestions[highlight]);
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
        placeholder={disabled ? 'Read-only conversation' : 'Type a message… use @ to address an agent'}
        aria-label="Message"
        name="superchat-message"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !draft.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-800 text-white hover:bg-primary-700 disabled:opacity-40"
      >
        <SendIcon />
      </button>
    </div>
  );
}

// ============================================================================
// Sidebar
// ============================================================================

const sidebarItem = cva(
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

// ============================================================================
// SuperChat
// ============================================================================

export interface SuperChatProps {
  /** All conversations (host-owned state). */
  conversations: SuperChatConversation[];
  /** Controlled active conversation id. */
  activeConversationId?: string;
  /** Uncontrolled initial active conversation id. */
  defaultActiveConversationId?: string;
  /** The participant id representing the local user (alignment + compose). */
  currentParticipantId?: string;
  /** Opt-in rich render plugins (code/math/genui/…). */
  renderPlugins?: SuperChatRenderPlugin[];
  /** Override the entire text renderer (advanced). */
  renderTextContent?: AIRenderTextContent;
  /** Treat content as trusted and skip sanitization (host-authored only). */
  trustedContent?: boolean;
  /** Disable the composer. */
  readOnly?: boolean;
  /** Show the conversation sidebar. */
  showSidebar?: boolean;
  /** Build hrefs for `ref` thread items. */
  linkBuilder?: SuperChatLinkBuilder;
  /** Additional class name. */
  className?: string;

  // --- callbacks (chat-component-compatible) ---
  onMessageSent?: (
    text: string,
    meta: { conversation: SuperChatConversation; mentions: string[] }
  ) => void;
  onConversationOpened?: (conversation: SuperChatConversation) => void;
  onConversationClosed?: (conversation: SuperChatConversation) => void;
  onNewConversation?: () => void;
  onReferenceClick?: (ref: SuperChatRef) => void;
}

/**
 * Multi-participant chat surface. See the module `MAINTAINERS.md` for the
 * participant model and render-plugin architecture.
 */
export function SuperChat({
  conversations,
  activeConversationId,
  defaultActiveConversationId,
  currentParticipantId,
  renderPlugins,
  renderTextContent,
  trustedContent,
  readOnly,
  showSidebar = true,
  linkBuilder,
  className,
  onMessageSent,
  onConversationOpened,
  onConversationClosed,
  onNewConversation,
  onReferenceClick,
}: SuperChatProps) {
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId ?? conversations[0]?.id
  );
  const activeId = activeConversationId ?? internalActive;
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const renderText = React.useMemo<AIRenderTextContent>(
    () =>
      renderTextContent ??
      createMarkdownRenderer({ plugins: renderPlugins, trusted: trustedContent }),
    [renderTextContent, renderPlugins, trustedContent]
  );

  const sortedConversations = React.useMemo(
    () => [...conversations].sort((a, b) => lastActivityOf(b) - lastActivityOf(a)),
    [conversations]
  );

  const threadRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.thread.length, active?.id]);

  const selectConversation = (c: SuperChatConversation) => {
    if (activeConversationId === undefined) setInternalActive(c.id);
    onConversationOpened?.(c);
  };

  const participantById = React.useMemo(() => {
    const map = new Map<string, Participant>();
    active?.participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [active]);

  const orderedThread = React.useMemo(
    () => (active ? [...active.thread].sort(byTime) : []),
    [active]
  );

  return (
    <div
      data-slot="superchat"
      className={cn(
        'flex h-full overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
        className
      )}
    >
      {showSidebar && (
        <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between p-3">
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Conversations
            </span>
            {onNewConversation && (
              <button
                type="button"
                onClick={onNewConversation}
                aria-label="New conversation"
                className="rounded-md px-2 py-1 text-lg leading-none text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                +
              </button>
            )}
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
            {sortedConversations.map((c) => {
              const last = lastMessageByTime(c.thread);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectConversation(c)}
                  className={sidebarItem({ active: c.id === active?.id })}
                >
                  <span className="flex-1 truncate">
                    <span className="block truncate font-medium">{c.title}</span>
                    {last?.text && (
                      <span className="block truncate text-xs text-neutral-400">
                        {last.text}
                      </span>
                    )}
                  </span>
                  {!!c.unread && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-semibold text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <header className="flex items-center justify-between border-b border-neutral-200 p-3 dark:border-neutral-700">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {active.title}
                </h2>
                <div className="mt-0.5 flex items-center gap-1">
                  {active.participants.slice(0, 6).map((p) => (
                    <span key={p.id} title={p.name}>
                      <ParticipantAvatar participant={p} size="sm" />
                    </span>
                  ))}
                </div>
              </div>
              {onConversationClosed && (
                <button
                  type="button"
                  onClick={() => onConversationClosed(active)}
                  aria-label="Close conversation"
                  className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <CloseIcon />
                </button>
              )}
            </header>

            <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {orderedThread.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  participant={participantById.get(m.participantId)}
                  isSelf={!!currentParticipantId && m.participantId === currentParticipantId}
                  renderText={renderText}
                  linkBuilder={linkBuilder}
                  onReferenceClick={onReferenceClick}
                />
              ))}
            </div>

            <Composer
              participants={active.participants}
              disabled={readOnly}
              onSend={(text, mentions) =>
                onMessageSent?.(text, { conversation: active, mentions })
              }
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            No conversation selected
          </div>
        )}
      </section>
    </div>
  );
}
