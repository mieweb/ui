import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';

// ============================================================================
// @mention autocomplete — shared between MessageComposer and ChatComposer.
//
// Extracted verbatim from MessageComposer so both composers expose identical
// mention behavior (query detection, keyboard navigation, insertion, ARIA
// combobox wiring, listbox rendering). Do not change semantics here without
// running both composers' test suites — SuperChat pins this behavior through
// MessageComposer today.
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
  const [highlight, setHighlight] = React.useState(0);
  const listId = React.useId();
  const optionId = React.useCallback(
    (index: number) => `${listId}-option-${index}`,
    [listId]
  );

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

  // Clamp the highlight to the current suggestion range so the active option
  // never points at a stale/out-of-range index (the list can shrink while the
  // menu is open as the query narrows). The same clamped index drives
  // `aria-activedescendant`, `aria-selected`, and the visual highlight so they
  // can never disagree.
  const clampedHighlight = menuOpen
    ? Math.min(highlight, suggestions.length - 1)
    : -1;
  const activeOptionId = menuOpen ? optionId(clampedHighlight) : undefined;

  const sync = React.useCallback(
    (nextValue: string, caret: number) => {
      if (!enabled) return;
      setMention(activeMentionQuery(nextValue, caret));
      setHighlight(0);
    },
    [enabled]
  );

  const insert = (option: MentionOption) => {
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
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): boolean => {
    if (!menuOpen) return false;
    // All keyboard branches index with the clamped highlight so keyboard
    // behavior always agrees with the visible/ARIA selection, even when the
    // list shrank while the menu was open (e.g. the host swapped `options`
    // asynchronously).
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight(
        (h) => (Math.min(h, suggestions.length - 1) + 1) % suggestions.length
      );
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight(
        (h) =>
          (Math.min(h, suggestions.length - 1) - 1 + suggestions.length) %
          suggestions.length
      );
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const chosen = suggestions[clampedHighlight];
      if (chosen) insert(chosen);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMention(null);
      return true;
    }
    return false;
  };

  const inputProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = enabled
    ? {
        'aria-controls': menuOpen ? listId : undefined,
        'aria-activedescendant': activeOptionId,
        'aria-autocomplete': 'list' as const,
      }
    : {};

  return {
    enabled,
    menuOpen,
    suggestions,
    highlight: clampedHighlight,
    listId,
    optionId,
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

export interface MentionMenuProps {
  /** State returned by {@link useMentionAutocomplete}. */
  mention: MentionAutocomplete;
  /** Accessible label for the listbox. @default 'Mention' */
  label?: string;
  /** `data-slot` for the listbox. @default 'composer-mention-list' */
  dataSlot?: string;
}

/**
 * The floating `@mention` suggestion listbox. Rendered in a portal so it
 * escapes overflow-hidden ancestors; renders nothing while closed.
 */
export function MentionMenu({
  mention,
  label = 'Mention',
  dataSlot = 'composer-mention-list',
}: MentionMenuProps) {
  if (!mention.menuOpen) return null;
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
              <span className="font-medium">{option.label}</span>
              {option.description && (
                <span className="ms-1 text-xs text-neutral-400">
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
