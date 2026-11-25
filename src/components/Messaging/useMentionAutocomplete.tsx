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
 * or further `@` — unless `allowEmail` is set, which lets the query hold one
 * more `@` so an email address can be typed (`@someone@example.com`).
 */
export function activeMentionQuery(
  value: string,
  caret: number,
  { allowEmail = false }: { allowEmail?: boolean } = {}
): { query: string; start: number } | null {
  const upToCaret = value.slice(0, caret);
  const match = (
    allowEmail ? /(^|\s)@([^\s@]*(?:@[^\s@]*)?)$/ : /(^|\s)@([^\s@]*)$/
  ).exec(upToCaret);
  if (!match) return null;
  const query = match[2];
  return { query, start: caret - query.length - 1 };
}

/**
 * Called when the user picks a mention, before it is inserted. Return (or
 * resolve) `false` to leave the text as it was, e.g. when a confirmation the
 * host opens is cancelled.
 */
export type MentionSelectHandler = (
  option: MentionOption
) => boolean | void | Promise<boolean | void>;

/** Supplies the candidates for an `@query`, e.g. from a server search. */
export type MentionSearchHandler = (
  query: string
) => MentionOption[] | Promise<MentionOption[]>;

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

/** Letters, digits and combining marks in any script, plus `_`. */
const MENTION_WORD = '\\p{L}\\p{N}\\p{M}_';

/**
 * Ids whose `@token` appears in `text`, in `entries` order: the token a
 * mention inserts is `value`, or the first word of `label`.
 *
 * Only whole tokens count: the `@` must not follow a letter, digit or another
 * `@`, and the token must not run on into a letter or digit, in any script
 * (`@Triage` is not `@TriageAgent`, `@李` is not `@李明`). Where tokens overlap,
 * the longest one at that spot wins, so `@john.doe` is not also `@john`;
 * entries with the same token all match it (two people named Alex).
 */
export function matchMentionTokens(
  text: string,
  entries: { id: string; token: string }[]
): string[] {
  const found = new Set<string>();
  // Indexed, so each match is checked against its own span only, not every
  // earlier match: exact spans already taken, and every position they cover.
  const takenSpans = new Set<string>();
  const occupied = new Uint8Array(text.length);
  const longestFirst = [...entries].sort(
    (a, b) => b.token.length - a.token.length
  );
  for (const { id, token } of longestFirst) {
    const pattern = new RegExp(
      `(?<![${MENTION_WORD}@])${escapeRegExp('@' + token)}(?![${MENTION_WORD}])`,
      'giu'
    );
    for (const match of text.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      // A shorter token inside a longer one's match is rejected, but the same
      // span counts for every entry that inserts that token (two "Alex"es).
      const span = `${start}:${end}`;
      if (!takenSpans.has(span)) {
        if (occupied.subarray(start, end).includes(1)) continue;
        takenSpans.add(span);
        occupied.fill(1, start, end);
      }
      found.add(id);
    }
  }
  return entries
    .map((e) => e.id)
    .filter((id, i, all) => found.has(id) && all.indexOf(id) === i);
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
const NO_MENTIONS: MentionOption[] = [];

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
  /**
   * Candidates for each `@query`, used instead of filtering `options`. Only
   * the latest query's result is shown, so a slow earlier response never
   * replaces a newer one. The query may hold one more `@`, so a search can
   * match an email address (`@someone@example.com`).
   */
  search?: MentionSearchHandler;
  /**
   * Runs before a picked mention (from `options` or `search`) is inserted;
   * `false` cancels the insert. Reference triggers' picks don't go through it.
   */
  onSelect?: MentionSelectHandler;
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
  /** Whether mention support is active (non-empty `options`, a `search`, or triggers). */
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
  search,
  onSelect,
  triggers,
  value,
  setValue,
  textareaRef,
}: UseMentionAutocompleteOptions): MentionAutocomplete {
  const hasOptions = !!options && options.length > 0;
  const hasSearch = !!search;
  const enabled = hasOptions || hasSearch || !!triggers?.length;
  const chars = React.useMemo(
    () => [
      ...new Set([
        ...(hasOptions || hasSearch ? ['@'] : []),
        ...(triggers ?? []).map((t) => t.char),
      ]),
    ],
    [hasOptions, hasSearch, triggers]
  );
  const [trackedMention, setMention] = React.useState<{
    char: string;
    query: string;
    start: number;
  } | null>(null);
  // Only while the draft still holds the query: a send that clears it, or a
  // host that replaces it, ends the query, so a late search answer can't open
  // the menu over a draft it no longer belongs to.
  const mention =
    trackedMention &&
    value.startsWith(
      trackedMention.char + trackedMention.query,
      trackedMention.start
    )
      ? trackedMention
      : null;
  const activeTrigger =
    (mention && triggers?.find((t) => t.char === mention.char)) || null;

  // A reference trigger's search, newest answer only. Keyed by character and
  // query, with the trigger read through a ref, so a host that rebuilds its
  // `triggers` each render doesn't search again. Each answer carries the
  // character and query it was for: while a new search runs, an older one's
  // results (another trigger's records) must not be shown or picked.
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

  // The host's `@` search (`search`), in place of filtering `options`:
  // newest answer only, read through a ref as hosts usually pass it inline.
  // Each answer carries its query, so an older one is never shown.
  const searchRef = React.useRef(search);
  searchRef.current = search;
  const mentionQuery =
    hasSearch && mention?.char === '@' ? mention.query : undefined;
  const [searched, setSearched] = React.useState<{
    query: string;
    results: MentionOption[];
  } | null>(null);
  const mentionSearchSeq = React.useRef(0);
  React.useEffect(() => {
    const seq = ++mentionSearchSeq.current;
    const run = searchRef.current;
    if (!run || mentionQuery === undefined) {
      setSearched(null);
      return;
    }
    const answer = (next: MentionOption[]) => {
      if (seq === mentionSearchSeq.current)
        setSearched({ query: mentionQuery, results: next });
    };
    Promise.resolve()
      .then(() => run(mentionQuery))
      .then(answer, () => answer([]));
  }, [mentionQuery]);
  const searchResults =
    searched && searched.query === mentionQuery
      ? searched.results
      : NO_MENTIONS;

  // A trigger's results as entries of their own (copies), so a pick is a
  // reference only when it came from them — a host may share one array
  // between `mentionOptions` and a trigger's search.
  const referenceEntries = React.useMemo(
    () => results.map((result) => ({ ...result })),
    [results]
  );
  const suggestions = React.useMemo<MentionOption[]>(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    const listed =
      mention.char !== '@'
        ? []
        : hasSearch
          ? searchResults
          : options
            ? options.filter((o) => o.label.toLowerCase().includes(q))
            : [];
    return [...listed, ...referenceEntries];
  }, [mention, options, hasSearch, searchResults, referenceEntries]);

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

  // Read at insert time: a confirmation can resolve after later renders.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  /**
   * Replace `token` with `insertText`, if the text still holds the token as
   * it was when picked: the same word (with anything already after the caret
   * in it), still ending there.
   */
  const insertAt = (
    token: { char: string; query: string; start: number; rest: string },
    insertText: string
  ) => {
    const current = valueRef.current;
    const typed = token.char + token.query;
    const word = typed + token.rest;
    // The text changed while a confirmation was open: the token is gone, or
    // was edited (`@sam` → `@samuel`), so a pick for it no longer applies.
    if (
      !current.startsWith(word, token.start) ||
      /\S/.test(current.charAt(token.start + word.length))
    ) {
      return;
    }
    const before = current.slice(0, token.start);
    const after = current.slice(token.start + typed.length);
    setValue(before + insertText + after);
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

  function insert(option: MentionOption) {
    if (!mention) return;
    // The rest of the word after the caret, so a confirmation can tell
    // whether the word was edited meanwhile.
    const rest =
      /^\S*/.exec(
        value.slice(mention.start + mention.char.length + mention.query.length)
      )?.[0] ?? '';
    const token = { ...mention, rest };
    setMention(null);
    // A trigger's pick is a link to its record; a listed option is `@value`,
    // inserted once the host's `onSelect` (if any) agrees.
    if (activeTrigger && referenceEntries.includes(option as ReferenceOption)) {
      insertAt(
        token,
        `${referenceLink(option.label, activeTrigger.toHref(option.id))} `
      );
      return;
    }
    const insertText = `@${option.value ?? option.label.split(' ')[0]} `;
    const decision = onSelect?.(option);
    if (decision === false) return;
    if (decision instanceof Promise) {
      decision.then(
        (confirmed) => {
          if (confirmed !== false) insertAt(token, insertText);
        },
        () => {}
      );
      return;
    }
    insertAt(token, insertText);
  }

  const list = useSuggestionList(suggestions, menuOpen, insert);
  const { setHighlight } = list;

  const sync = React.useCallback(
    (nextValue: string, caret: number) => {
      if (!enabled) return;
      // A host search can look people up by email, so its `@` query may hold
      // one more `@`. Both start where the caret's word does, so the email
      // form, when it matches, is the same token read further.
      const email = hasSearch
        ? activeMentionQuery(nextValue, caret, { allowEmail: true })
        : null;
      setMention(
        email
          ? { char: '@', ...email }
          : activeTriggerQuery(nextValue, caret, chars)
      );
      setHighlight(0);
    },
    [enabled, hasSearch, chars, setHighlight]
  );

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): boolean => {
    // An IME composing (CJK input) owns Enter and the arrows: they pick and
    // confirm its candidates, not the list's options.
    if (event.nativeEvent.isComposing) return false;
    // Escape also dismisses a query still searching (a reference trigger's or
    // the host's `@` search), so its late answer doesn't open the menu after
    // the user closed it.
    const searching = !!activeTrigger || mentionQuery !== undefined;
    if (!menuOpen && !(event.key === 'Escape' && searching)) return false;
    if (list.handleKey(event)) return true;
    if (event.key === 'Escape') {
      event.preventDefault();
      // Handled here only: a surrounding Modal's document-level Escape would
      // otherwise close it too. The next Escape reaches the host.
      event.stopPropagation();
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
    activeTrigger,
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
        // By position as well as id: one person can be both a listed mention
        // and a trigger's result, with the same id.
        <li key={`${i}:${option.id}`}>
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
