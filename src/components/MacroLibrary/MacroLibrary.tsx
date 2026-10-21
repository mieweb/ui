import * as React from 'react';
import {
  SearchIcon,
  HistoryIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  PlusIcon,
} from '../Icons';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';

export interface Macro {
  /** Stable identifier. */
  id: string;
  /** Human-readable name shown in the list. */
  label: string;
  /** Plain text inserted into the editor. `\n` is preserved. */
  content: string;
  /** Optional shortcut identifier shown as a badge (e.g. `.b`). */
  shortcut?: string;
  /** Extra search terms that are not displayed. */
  keywords?: string[];
}

export interface MacroGroup {
  /** Stable identifier. */
  id: string;
  /** Group heading (e.g. "Default library"). */
  label: string;
  /**
   * `previous` renders the group visually distinct from library macros
   * (history icon, muted header) so prior values are never mistaken for
   * predefined content. Defaults to `library`.
   */
  kind?: 'library' | 'previous';
  /** Macros belonging to the group. */
  macros: Macro[];
}

export interface MacroLibraryProps {
  /** Grouped macros supplied by the application. */
  groups: MacroGroup[];
  /** Called with the chosen macro. The caller performs the insertion. */
  onSelect: (macro: Macro) => void;
  /** Id for the panel root (e.g. the target of a toggle's aria-controls). */
  id?: string;
  /**
   * Name of the insertion target shown in the header (e.g. the editor's
   * label), rendered as "Insert into <target>".
   */
  targetLabel?: string;
  /** When provided, renders a close button and enables Escape-to-close. */
  onClose?: () => void;
  /** When provided, renders a "Save as macro" action in the footer. */
  onCreateMacro?: () => void;
  /** Autofocus the search input on mount. Defaults to false. */
  autoFocusSearch?: boolean;
  /** Additional class for the panel root. */
  className?: string;
  /** Overridable labels for i18n. */
  labels?: Partial<typeof DEFAULT_LABELS>;
}

const DEFAULT_LABELS = {
  insertInto: 'Insert into',
  macros: 'Macros',
  searchPlaceholder: 'Search macros…',
  searchLabel: 'Search macros',
  close: 'Close macros',
  createMacro: 'Save as macro',
  empty: 'No macros available',
  emptyHint: 'The application has not provided a macro list.',
  noResults: 'No macros match',
  clearSearch: 'Clear search',
  showFullContent: 'Show full content',
  hideFullContent: 'Hide full content',
  more: 'more',
  less: 'less',
};

/** Case-insensitive match across label, shortcut, keywords and content. */
function matchesQuery(macro: Macro, query: string): boolean {
  const q = query.toLowerCase();
  return (
    macro.label.toLowerCase().includes(q) ||
    (macro.shortcut ?? '').toLowerCase().includes(q) ||
    (macro.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
    macro.content.toLowerCase().includes(q)
  );
}

/** Query is a prefix of the macro's shortcut identifier. */
function isShortcutHit(macro: Macro, query: string): boolean {
  return (
    query.length > 0 &&
    (macro.shortcut ?? '').toLowerCase().startsWith(query.toLowerCase())
  );
}

/** Shortcut-prefix matches rank before everything else. */
function rankMacros(macros: Macro[], query: string): Macro[] {
  return [...macros].sort(
    (a, b) => Number(isShortcutHit(b, query)) - Number(isShortcutHit(a, query))
  );
}

interface MacroRowProps {
  macro: Macro;
  isPrevious: boolean;
  isPeeked: boolean;
  peekId: string;
  labels: typeof DEFAULT_LABELS;
  onSelect: (macro: Macro) => void;
  onTogglePeek: () => void;
  onRowKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * One macro row. The two-line preview measures its own clamping so the
 * "more" toggle only appears when content is actually truncated.
 */
function MacroRow({
  macro,
  isPrevious,
  isPeeked,
  peekId,
  labels,
  onSelect,
  onTogglePeek,
  onRowKeyDown,
}: MacroRowProps) {
  const [truncated, setTruncated] = React.useState(false);
  const rowRef = React.useRef<HTMLButtonElement>(null);
  const lessRef = React.useRef<HTMLButtonElement>(null);
  // Toggling unmounts the activated control; move focus to its replacement
  // ("less" on expand, the row on collapse — the "more" chip is hidden until
  // hover/focus) so keyboard focus never drops to <body> and Escape keeps
  // closing the panel.
  const focusAfterToggle = React.useRef(false);
  React.useEffect(() => {
    if (!focusAfterToggle.current) return;
    focusAfterToggle.current = false;
    (isPeeked ? lessRef.current : rowRef.current)?.focus();
  }, [isPeeked]);
  const handleToggle = () => {
    focusAfterToggle.current = true;
    onTogglePeek();
  };
  // Remeasure on resize: docking/undocking or narrowing the panel can clamp
  // content without a React render.
  const previewObserver = React.useRef<ResizeObserver | null>(null);
  const measurePreview = (el: HTMLSpanElement | null) => {
    previewObserver.current?.disconnect();
    previewObserver.current = null;
    if (!el) return;
    const measure = () => setTruncated(el.scrollHeight > el.clientHeight);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      previewObserver.current = new ResizeObserver(measure);
      previewObserver.current.observe(el);
    }
  };
  return (
    <div
      data-slot="macro-library-item"
      className="group/macro hover:bg-muted/60 relative rounded-md"
    >
      <button
        type="button"
        data-macro-row
        ref={rowRef}
        className="focus-visible:ring-ring text-foreground hover:text-primary flex w-full cursor-pointer flex-col items-stretch gap-0.5 rounded-md px-2 py-1.5 text-start focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => onSelect(macro)}
        onKeyDown={onRowKeyDown}
      >
        <span className="flex items-center gap-2">
          {macro.shortcut && (
            <span
              className={cn(
                'border-border bg-background text-muted-foreground rounded border px-1 font-mono text-[11px]',
                isPrevious &&
                  'border-warning-300 bg-warning-50 text-warning-800 dark:border-warning-700 dark:bg-warning-950 dark:text-warning-300'
              )}
            >
              {macro.shortcut}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {macro.label}
          </span>
        </span>
        {!isPeeked && (
          <span
            ref={measurePreview}
            className="text-muted-foreground line-clamp-2 text-xs break-words"
          >
            {macro.content}
          </span>
        )}
      </button>
      {isPeeked && (
        <div
          id={peekId}
          data-slot="macro-library-peek"
          className="text-muted-foreground px-2 pb-1 text-xs break-words whitespace-pre-line"
        >
          {macro.content}
        </div>
      )}
      {truncated && !isPeeked && (
        // Overlays the end of the clamped second line; revealed on row
        // hover or keyboard focus so short rows stay entirely clean. Always
        // visible on devices without hover (touch).
        <button
          type="button"
          className="bg-muted text-muted-foreground hover:text-primary focus-visible:ring-ring invisible absolute end-1.5 bottom-1.5 flex cursor-pointer items-center rounded-sm px-1 text-[11px] leading-4 group-focus-within/macro:visible group-hover/macro:visible hover:underline focus-visible:ring-2 focus-visible:outline-none [@media(hover:none)]:visible"
          aria-expanded={false}
          aria-label={`${labels.showFullContent}: ${macro.label}`}
          onClick={handleToggle}
        >
          {labels.more}
          <ChevronRightIcon
            aria-hidden="true"
            className="h-3 w-3 rtl:-scale-x-100"
          />
        </button>
      )}
      {isPeeked && (
        <span className="-mt-1 flex justify-end px-2 pb-1">
          <button
            type="button"
            ref={lessRef}
            className="text-muted-foreground hover:text-primary focus-visible:ring-ring cursor-pointer rounded text-[11px] hover:underline focus-visible:ring-2 focus-visible:outline-none"
            aria-expanded
            aria-controls={peekId}
            aria-label={`${labels.hideFullContent}: ${macro.label}`}
            onClick={handleToggle}
          >
            {labels.less}
          </button>
        </span>
      )}
    </div>
  );
}

/**
 * A searchable, grouped macro browser designed to dock inside an editor's
 * chrome. Editor-agnostic: selecting a macro calls `onSelect` and the host
 * performs the insertion. Previous-value groups (`kind: 'previous'`) are
 * rendered distinctly from library macros. All rows and controls are real
 * buttons with roving arrow-key focus from the search input.
 */
export const MacroLibrary = React.forwardRef<HTMLDivElement, MacroLibraryProps>(
  function MacroLibrary(
    {
      groups,
      onSelect,
      id,
      targetLabel,
      onClose,
      onCreateMacro,
      autoFocusSearch = false,
      className,
      labels: labelOverrides,
    },
    ref
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    const [query, setQuery] = React.useState('');
    const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(
      {}
    );
    const [peeked, setPeeked] = React.useState<string | null>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const panelId = React.useId();

    React.useEffect(() => {
      if (autoFocusSearch) searchRef.current?.focus();
    }, [autoFocusSearch]);

    const trimmed = query.trim();
    const searching = trimmed.length > 0;

    const visibleGroups = groups
      .map((group) => ({
        ...group,
        macros: searching
          ? rankMacros(
              group.macros.filter((m) => matchesQuery(m, trimmed)),
              trimmed
            )
          : group.macros,
      }))
      .filter((group) => group.macros.length > 0)
      // Groups containing shortcut-prefix hits rank first so ".c" reaches
      // the macro with that shortcut before incidental content matches in
      // earlier groups; the stable sort keeps group context otherwise.
      .sort(
        (a, b) =>
          Number(b.macros.some((m) => isShortcutHit(m, trimmed))) -
          Number(a.macros.some((m) => isShortcutHit(m, trimmed)))
      );

    const hasMacros = groups.some((g) => g.macros.length > 0);
    const noResults = hasMacros && searching && visibleGroups.length === 0;

    /** Roving focus across visible macro-row buttons. */
    const moveFocus = (delta: 1 | -1) => {
      const rows = Array.from(
        listRef.current?.querySelectorAll<HTMLButtonElement>(
          '[data-macro-row]'
        ) ?? []
      );
      if (rows.length === 0) return;
      const index = rows.findIndex((row) => row === document.activeElement);
      if (index === -1) {
        rows[delta === 1 ? 0 : rows.length - 1].focus();
        return;
      }
      const next = index + delta;
      if (next < 0) {
        searchRef.current?.focus();
        return;
      }
      rows[Math.min(next, rows.length - 1)].focus();
    };

    const handlePanelKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.stopPropagation();
        onClose();
      }
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(1);
      }
    };

    const handleRowKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(-1);
      }
    };

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown only delegates Escape-to-close from focusable children
      <div
        ref={ref}
        id={id}
        data-slot="macro-library"
        className={cn('bg-muted/20 flex min-h-0 flex-col', className)}
        onKeyDown={handlePanelKeyDown}
      >
        <div
          data-slot="macro-library-header"
          className="border-border flex items-center justify-between gap-2 border-b px-3 py-2"
        >
          <span className="text-muted-foreground min-w-0 truncate text-xs">
            {targetLabel ? (
              <>
                {labels.insertInto}{' '}
                <span className="text-foreground font-semibold">
                  {targetLabel}
                </span>
              </>
            ) : (
              labels.macros
            )}
          </span>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 shrink-0 p-0"
              onClick={onClose}
              aria-label={labels.close}
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {hasMacros ? (
          <>
            <div className="px-3 pt-2">
              <div className="relative">
                <SearchIcon
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2"
                />
                <Input
                  ref={searchRef}
                  label={labels.searchLabel}
                  hideLabel
                  size="sm"
                  type="search"
                  placeholder={labels.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="ps-8"
                  aria-controls={`${panelId}-list`}
                />
              </div>
            </div>

            <div
              ref={listRef}
              id={`${panelId}-list`}
              data-slot="macro-library-list"
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
            >
              {noResults && (
                <div className="text-muted-foreground px-2 py-8 text-center text-sm">
                  <p>
                    {labels.noResults} “{trimmed}”
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setQuery('');
                      searchRef.current?.focus();
                    }}
                  >
                    {labels.clearSearch}
                  </Button>
                </div>
              )}

              {visibleGroups.map((group) => {
                const isPrevious = group.kind === 'previous';
                const isCollapsed = !searching && collapsed[group.id];
                const GroupIcon = isPrevious ? HistoryIcon : BookOpenIcon;
                return (
                  <div
                    key={group.id}
                    data-slot="macro-library-group"
                    data-kind={group.kind ?? 'library'}
                  >
                    <button
                      type="button"
                      className={cn(
                        'text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 rounded px-2 pt-2.5 pb-1 text-start text-[11px] font-semibold tracking-wide uppercase',
                        isPrevious && 'text-warning-700 dark:text-warning-400'
                      )}
                      aria-expanded={!isCollapsed}
                      disabled={searching}
                      onClick={() =>
                        setCollapsed((prev) => ({
                          ...prev,
                          [group.id]: !prev[group.id],
                        }))
                      }
                    >
                      <GroupIcon aria-hidden="true" className="h-3 w-3" />
                      <span className="min-w-0 flex-1 truncate">
                        {group.label}
                      </span>
                      {!searching &&
                        (isCollapsed ? (
                          <ChevronRightIcon
                            aria-hidden="true"
                            className="h-3 w-3"
                          />
                        ) : (
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="h-3 w-3"
                          />
                        ))}
                    </button>

                    {!isCollapsed &&
                      group.macros.map((macro) => {
                        const isPeeked = peeked === macro.id;
                        return (
                          <MacroRow
                            key={macro.id}
                            macro={macro}
                            isPrevious={isPrevious}
                            isPeeked={isPeeked}
                            peekId={`${panelId}-peek-${macro.id}`}
                            labels={labels}
                            onSelect={onSelect}
                            onTogglePeek={() =>
                              setPeeked(isPeeked ? null : macro.id)
                            }
                            onRowKeyDown={handleRowKeyDown}
                          />
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 px-4 py-10 text-center text-sm">
            <BookOpenIcon aria-hidden="true" className="mb-1 h-5 w-5" />
            <p className="text-foreground font-medium">{labels.empty}</p>
            <p className="text-xs">{labels.emptyHint}</p>
          </div>
        )}

        {onCreateMacro && (
          <div
            data-slot="macro-library-footer"
            className="border-border border-t px-2 py-1.5"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-1.5"
              onClick={onCreateMacro}
            >
              <PlusIcon aria-hidden="true" className="h-3.5 w-3.5" />
              {labels.createMacro}
            </Button>
          </div>
        )}
      </div>
    );
  }
);
