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

interface MessageRowProps {
  message: SuperChatMessage;
  participant?: Participant;
  isSelf: boolean;
  renderText: AIRenderTextContent;
  linkBuilder?: SuperChatLinkBuilder;
  onReferenceClick?: (ref: SuperChatRef) => void;
}

export function MessageRow({
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

  return (
    <div
      data-slot="superchat-message"
      role="article"
      aria-label={`${authorName}, ${formatTime(message.time)}`}
      className={cn('flex gap-2', isSelf ? 'flex-row-reverse' : 'flex-row')}
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
        </div>

        <div
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
          {/* Rich content blocks (tool calls etc.) reused from the AI module. */}
          {message.content?.map((block, i) => {
            if (block.type === 'tool_use' && block.toolCall) {
              return <MCPToolCallDisplay key={i} toolCall={block.toolCall} />;
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
}: {
  participants: Participant[];
  disabled?: boolean;
  onSend: (text: string, mentions: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');
  const [mention, setMention] = React.useState<{
    query: string;
    start: number;
  } | null>(null);
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
    if (!text) return;
    onSend(text, detectMentions(text, participants));
    setDraft('');
    setMention(null);
  };

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
        className="focus:border-primary-500 focus:ring-primary-500 max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !draft.trim()}
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
