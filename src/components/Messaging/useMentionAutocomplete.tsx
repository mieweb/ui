import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';

// ============================================================================
// @mention autocomplete — consumed by ChatComposer (and, before its
// retirement in 0.10.0, MessageComposer — it was extracted verbatim from it:
// query detection, keyboard navigation, insertion, ARIA combobox wiring,
// listbox rendering). Do not change semantics here without running
// ChatComposer's test suite plus the SuperChat/AIChat consumer suites.
// ============================================================================

/**
 * A candidate for the composer's `@mention` autocomplete. Generic so any
 * surface (multi-party chat, agent picker, …) can supply its own list.
 */
export interface MentionOption {
  /** Stable unique key for the suggestion list. */
  id: string;
  /** Display name shown in the suggestion list. */
  label: string;
  /** Text inserted after `@` on selection. Defaults to the first word of `label`. */
  value?: string;
  /** Optional secondary text shown after the label. */
  description?: string;
  /** Optional leading node (e.g. an avatar). */
  icon?: React.ReactNode;
  /** Optional trailing meta text (e.g. a kind tag). */
  meta?: string;
}

/**
 * Find the active `@query` immediately before the caret, if any. The `@` must
 * start the string or follow whitespace, and the token must contain no spaces
 * or further `@`.
 */
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

/**
 * The list half of an autocomplete, shared by {@link useMentionAutocomplete}
 * and RichEditor's references: the highlighted option, its ids for ARIA, and
 * arrow / Enter / Tab handling. Where the query comes from and what a pick
 * inserts stay with each caller.
 */
export interface SuggestionList {
  /** Clamped highlight index (`-1` while the list is closed). */
  highlight: number;
  /** Move the highlight (mouse hover); `0` starts a new query at the top. */
  setHighlight: (index: number) => void;
  /** id of the listbox element. */
  listId: string;
  /** id for the option at `index`. */
  optionId: (index: number) => string;
  /** id of the highlighted option while open, for `aria-activedescendant`. */
  activeOptionId: string | undefined;
  /**
   * Arrows move the highlight (wrapping), Enter or Tab picks it. Returns
   * `true` when the key was consumed (callers skip their own handling).
   */
  handleKey: (event: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => boolean;
}

export function useSuggestionList<T>(
  suggestions: readonly T[],
  open: boolean,
  pick: (option: T) => void
): SuggestionList {
  const [highlight, setHighlight] = React.useState(0);
  const listId = React.useId();
  const optionId = React.useCallback(
    (index: number) => `${listId}-option-${index}`,
    [listId]
  );
  // Clamp the highlight to the current suggestion range so the active option
  // never points at a stale/out-of-range index (the list can shrink while the
  // menu is open as the query narrows). The same clamped index drives
  // `aria-activedescendant`, `aria-selected`, the visual highlight and the
  // keys, so they can never disagree.
  const clamped = open ? Math.min(highlight, suggestions.length - 1) : -1;

  const handleKey: SuggestionList['handleKey'] = (event) => {
    if (!open) return false;
    const count = suggestions.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlight((h) => (Math.min(h, count - 1) + step + count) % count);
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const chosen = suggestions[clamped];
      if (chosen !== undefined) pick(chosen);
      return true;
    }
    return false;
  };

  return {
    highlight: clamped,
    setHighlight,
    listId,
    optionId,
    activeOptionId: open ? optionId(clamped) : undefined,
    handleKey,
  };
}

export interface UseMentionAutocompleteOptions {
  /** Mention candidates. Mentions are disabled when undefined or empty. */
  options?: MentionOption[];
  /** Current composer text. */
  value: string;
  /** Write the composer text (host handles controlled/uncontrolled). */
  setValue: (next: string) => void;
  /** The composer textarea, for caret restore after insertion. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export interface MentionAutocomplete {
  /** Whether mention support is active (options provided and non-empty). */
  enabled: boolean;
  /** Whether the suggestion menu is currently open. */
  menuOpen: boolean;
  /** Suggestions matching the active query. */
  suggestions: MentionOption[];
  /** Clamped highlight index (`-1` while the menu is closed). */
  highlight: number;
  /** id of the listbox element. */
  listId: string;
  /** id for the option at `index`. */
  optionId: (index: number) => string;
  /** Ref for the element the menu anchors to (the input wrapper). */
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** Ref for the floating listbox. */
  floatingRef: React.RefObject<HTMLUListElement | null>;
  /** Fixed-position style for the floating listbox. */
  menuStyle: React.CSSProperties;
  /** Re-derive the active query from the value and caret position. */
  sync: (value: string, caret: number) => void;
  /** Insert the given option at the active query and restore the caret. */
  insert: (option: MentionOption) => void;
  /** Move the highlight (mouse hover). */
  setHighlight: (index: number) => void;
  /**
   * Menu keyboard navigation. Returns `true` when the event was consumed
   * (callers must skip their own key handling, e.g. Enter-to-send).
   */
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  /** ARIA combobox attributes to spread onto the textarea. */
  inputProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

/**
 * State machine for `@mention` autocomplete in a composer textarea. Pair with
 * {@link MentionMenu} for the floating listbox.
 */
export function useMentionAutocomplete({
  options,
  value,
  setValue,
  textareaRef,
}: UseMentionAutocompleteOptions): MentionAutocomplete {
  const enabled = !!options && options.length > 0;
  const [mention, setMention] = React.useState<{
    query: string;
    start: number;
  } | null>(null);
  const suggestions = React.useMemo(() => {
    if (!mention || !options) return [];
    const q = mention.query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [mention, options]);

  const menuOpen = enabled && mention !== null && suggestions.length > 0;

  // Portal + fixed positioning so the mention menu escapes overflow-hidden
  // ancestors.
  const {
    anchorRef,
    floatingRef,
    style: menuStyle,
  } = useAnchoredPosition<HTMLDivElement, HTMLUListElement>({
    open: menuOpen,
    placement: 'top-start',
    maxHeight: 224,
  });

  function insert(option: MentionOption) {
    if (!mention) return;
    const insertValue = option.value ?? option.label.split(' ')[0];
    const before = value.slice(0, mention.start);
    const after = value.slice(mention.start + 1 + mention.query.length);
    const insertText = `@${insertValue} `;
    setValue(before + insertText + after);
    setMention(null);
    // Restore caret just after the inserted mention.
    const caret = before.length + insertText.length;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    });
  }

  const list = useSuggestionList(suggestions, menuOpen, insert);
  const { setHighlight } = list;

  const sync = React.useCallback(
    (nextValue: string, caret: number) => {
      if (!enabled) return;
      setMention(activeMentionQuery(nextValue, caret));
      setHighlight(0);
    },
    [enabled, setHighlight]
  );

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): boolean => {
    if (!menuOpen) return false;
    if (list.handleKey(event)) return true;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMention(null);
      return true;
    }
    return false;
  };

  const inputProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = enabled
    ? {
        'aria-controls': menuOpen ? list.listId : undefined,
        'aria-activedescendant': list.activeOptionId,
        'aria-autocomplete': 'list' as const,
      }
    : {};

  return {
    enabled,
    menuOpen,
    suggestions,
    highlight: list.highlight,
    listId: list.listId,
    optionId: list.optionId,
    anchorRef,
    floatingRef,
    menuStyle,
    sync,
    insert,
    setHighlight,
    handleKeyDown,
    inputProps,
  };
}

/**
 * What {@link MentionMenu} draws: the open list and how to pick from it.
 * {@link MentionAutocomplete} is one; RichEditor's references list is another.
 */
export interface MentionMenuState<T extends MentionOption = MentionOption> {
  menuOpen: boolean;
  suggestions: T[];
  highlight: number;
  listId: string;
  optionId: (index: number) => string;
  floatingRef: React.RefObject<HTMLUListElement | null>;
  menuStyle: React.CSSProperties;
  insert: (option: T) => void;
  setHighlight: (index: number) => void;
}

export interface MentionMenuProps<T extends MentionOption = MentionOption> {
  /** State returned by {@link useMentionAutocomplete}, or any {@link MentionMenuState}. */
  mention: MentionMenuState<T>;
  /** Accessible label for the listbox. @default 'Mention' */
  label?: string;
  /** `data-slot` for the listbox. @default 'composer-mention-list' */
  dataSlot?: string;
}

/**
 * The floating `@mention` suggestion listbox. Rendered in a portal so it
 * escapes overflow-hidden ancestors; renders nothing while closed.
 */
export function MentionMenu<T extends MentionOption = MentionOption>({
  mention,
  label = 'Mention',
  dataSlot = 'composer-mention-list',
}: MentionMenuProps<T>) {
  // Keep the highlighted option visible as arrows move it, so a pick is
  // never made off screen (ArrowUp from the first wraps to the last). Focus
  // stays in the input; only the list scrolls.
  const { menuOpen, highlight, optionId } = mention;
  React.useEffect(() => {
    if (!menuOpen || highlight < 0) return;
    document
      .getElementById(optionId(highlight))
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [menuOpen, highlight, optionId]);

  if (!menuOpen) return null;
  return createPortal(
    <ul
      ref={mention.floatingRef}
      style={mention.menuStyle}
      id={mention.listId}
      role="listbox"
      aria-label={label}
      data-slot={dataSlot}
      className="w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
    >
      {mention.suggestions.map((option, i) => (
        <li key={option.id}>
          <button
            type="button"
            id={mention.optionId(i)}
            role="option"
            aria-selected={i === mention.highlight}
            // onMouseDown (not onClick) so the textarea keeps focus.
            onMouseDown={(e) => {
              e.preventDefault();
              mention.insert(option);
            }}
            onMouseEnter={() => mention.setHighlight(i)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm',
              i === mention.highlight
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100'
                : 'text-neutral-700 dark:text-neutral-200'
            )}
          >
            {option.icon}
            <span className="min-w-0 flex-1 truncate">
              {/* Own direction, so `@Ann Lee` keeps its `@` in an RTL page. */}
              <span dir="auto" className="font-medium">
                {option.label}
              </span>
              {option.description && (
                <span dir="auto" className="ms-1 text-xs text-neutral-400">
                  {option.description}
                </span>
              )}
            </span>
            {option.meta && (
              <span className="text-[10px] text-neutral-400">
                {option.meta}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>,
    document.body
  );
}

MentionMenu.displayName = 'MentionMenu';
