import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import type {
  ReferenceOption,
  ReferenceTrigger,
} from '../ReferenceChip/references';

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

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

/**
 * Like {@link activeMentionQuery}, for any of `chars`: the trigger character
 * typed, the text after it, and where it starts.
 */
export function activeTriggerQuery(
  value: string,
  caret: number,
  chars: readonly string[]
): { char: string; query: string; start: number } | null {
  if (!chars.length) return null;
  const set = chars.map(escapeRegExp).join('');
  const match = new RegExp(`(^|\\s)([${set}])([^\\s${set}]*)$`).exec(
    value.slice(0, caret)
  );
  if (!match) return null;
  const query = match[3];
  return { char: match[2], query, start: caret - query.length - 1 };
}

/**
 * `[label](href)` that reads back as exactly `label` and `href`. The label
 * escapes what Markdown would format (`*beta*`, `` `code` ``, `$x$`, `&amp;`);
 * the destination escapes what would end it early or decode (`issue)`), and
 * takes angle brackets when it holds whitespace.
 */
function referenceLink(label: string, href: string): string {
  const text = label.replace(/[\\[\]*_`~<>&$]/g, '\\$&');
  const destination = href.replace(/[\\()<>&]/g, '\\$&');
  return `[${text}](${/\s/.test(href) ? `<${destination}>` : destination})`;
}

const NO_RESULTS: ReferenceOption[] = [];

export interface UseMentionAutocompleteOptions {
  /** Mention candidates. Mentions are disabled when undefined or empty. */
  options?: MentionOption[];
  /**
   * Reference triggers (e.g. `#` tickets): typing one's character searches
   * it, and a pick is inserted as a Markdown link (`[label](href)`). A
   * trigger on `@` adds its results after `options`.
   */
  triggers?: ReferenceTrigger[];
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
  /** The open list's trigger, when a reference trigger opened it — for its accessible name. */
  activeTrigger: ReferenceTrigger | null;
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
  triggers,
  value,
  setValue,
  textareaRef,
}: UseMentionAutocompleteOptions): MentionAutocomplete {
  const hasOptions = !!options && options.length > 0;
  const enabled = hasOptions || !!triggers?.length;
  const chars = React.useMemo(
    () => [
      ...new Set([
        ...(hasOptions ? ['@'] : []),
        ...(triggers ?? []).map((t) => t.char),
      ]),
    ],
    [hasOptions, triggers]
  );
  const [mention, setMention] = React.useState<{
    char: string;
    query: string;
    start: number;
  } | null>(null);
  const activeTrigger =
    (mention && triggers?.find((t) => t.char === mention.char)) || null;

  // A reference trigger's search, newest answer only. Keyed by character and
  // query, with the trigger read through a ref, so a host that rebuilds its
  // `triggers` each render doesn't search again.
  // Each answer carries the character and query it was for: while a new
  // search runs, an older one's results (another trigger's records) must
  // not be shown or picked.
  const [found, setFound] = React.useState<{
    char: string;
    query: string;
    results: ReferenceOption[];
  } | null>(null);
  const searchSeq = React.useRef(0);
  const activeTriggerRef = React.useRef(activeTrigger);
  activeTriggerRef.current = activeTrigger;
  const searchChar = activeTrigger?.char;
  const searchQuery = mention?.query;
  React.useEffect(() => {
    const seq = ++searchSeq.current;
    const trigger = activeTriggerRef.current;
    if (!trigger || searchQuery === undefined) {
      setFound(null);
      return;
    }
    const answer = (results: ReferenceOption[]) => {
      if (seq === searchSeq.current)
        setFound({ char: trigger.char, query: searchQuery, results });
    };
    Promise.resolve()
      .then(() => trigger.search(searchQuery))
      .then(answer, () => answer([]));
  }, [searchChar, searchQuery]);
  const results =
    found &&
    activeTrigger &&
    found.char === activeTrigger.char &&
    found.query === mention?.query
      ? found.results
      : NO_RESULTS;
  const [highlight, setHighlight] = React.useState(0);
  const listId = React.useId();
  const optionId = React.useCallback(
    (index: number) => `${listId}-option-${index}`,
    [listId]
  );

  const suggestions = React.useMemo<MentionOption[]>(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    const listed =
      mention.char === '@' && options
        ? options.filter((o) => o.label.toLowerCase().includes(q))
        : [];
    return [...listed, ...results];
  }, [mention, options, results]);

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
      setMention(activeTriggerQuery(nextValue, caret, chars));
      setHighlight(0);
    },
    [enabled, chars]
  );

  const insert = (option: MentionOption) => {
    if (!mention) return;
    const before = value.slice(0, mention.start);
    const after = value.slice(mention.start + 1 + mention.query.length);
    // A trigger's pick is a link to its record; a listed option is `@value`.
    const insertText =
      activeTrigger && results.includes(option as ReferenceOption)
        ? `${referenceLink(option.label, activeTrigger.toHref(option.id))} `
        : `@${option.value ?? option.label.split(' ')[0]} `;
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
    activeTrigger,
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
