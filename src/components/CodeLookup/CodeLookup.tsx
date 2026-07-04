'use client';

/**
 * CodeLookup — offline medical-code autocomplete combobox.
 *
 * Full pipeline & design docs:
 *   https://github.com/mieweb/ui/blob/main/src/components/CodeLookup/README.md
 *   (local: ./README.md)
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Card, CardContent } from '../Card/Card';
import {
  SearchIcon,
  LoaderIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '../Icons';
import type { CodifyResult } from './engine';
import { familyKey, familyTerm } from './engine';

// =============================================================================
// Types
// =============================================================================

export type CodifyDomain =
  | 'condition'
  | 'med'
  | 'lab'
  | 'procedure'
  | 'vaccine'
  | 'occupational';

export interface CodeLookupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'onSelect'
> {
  /** Base URL where per-locale index directories are served */
  indexUrl: string;
  /**
   * Locale of the shard set to load: shards are fetched from
   * `{indexUrl}/{locale}/manifest.json`. Non-en locales may be sample
   * subsets (see README). Default: 'en'.
   */
  locale?: string;
  /** Domains to load & search (default: all in the manifest) */
  domains?: CodifyDomain[];
  /**
   * Override the program-metadata sidecar URL (defaults to
   * `{indexUrl}/{locale}/programs.json`). Lets a deployment serve
   * employer-specific protocols — required orders, periodicity — without
   * rebuilding shards. See mieweb/codify programs.json for the format.
   */
  programsUrl?: string;
  /**
   * Restrict searches to these domains at query time without reloading
   * shards (e.g. an order-type filter). Default: all loaded domains.
   */
  searchDomains?: CodifyDomain[];
  /** Called when a result is picked */
  onSelect?: (result: CodifyResult) => void;
  /**
   * Allow free-text entry: called when the user presses Enter without a
   * highlighted result, or clicks the "use as free text" footer row.
   */
  onFreeText?: (text: string) => void;
  /** Max results to show */
  limit?: number;
  placeholder?: string;
  /**
   * Render just the search input + dropdown (no card, no status line) for
   * embedding in forms. Loading/error state shows in the placeholder.
   */
  bare?: boolean;
  /**
   * Clear the input after a selection so the next entry can be typed
   * immediately (defaults to true in bare mode, false otherwise).
   */
  clearOnSelect?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

type Status =
  | { state: 'loading'; pct: number }
  | { state: 'ready'; docCount: number }
  | { state: 'error'; message: string };

/** Inverse of the domains-array → key encoding ('' = explicitly none). */
function keyToDomains(key: string | null): string[] | undefined {
  return key === null ? undefined : key === '' ? [] : key.split(',');
}

const DOMAIN_TEXT: Record<string, string> = {
  condition: 'text-primary-600 dark:text-primary-400',
  med: 'text-emerald-700 dark:text-emerald-400',
  lab: 'text-amber-700 dark:text-amber-400',
  procedure: 'text-violet-700 dark:text-violet-400',
  vaccine: 'text-muted-foreground',
  occupational: 'text-sky-700 dark:text-sky-400',
};

/** What the drill-down (→) shows, per domain. */
const DETAIL_NOUN: Record<string, string> = {
  med: 'forms & strengths',
  condition: 'specific codes',
  lab: 'related tests',
  procedure: 'related codes',
  vaccine: 'related codes',
  occupational: 'required orders',
};

// =============================================================================
// CodeLookup
// =============================================================================

/**
 * Offline medical-code autocomplete (proof of concept). Loads pre-built
 * MedicalCodify index shards in a Web Worker and searches them locally:
 * every typed token is a word prefix ("con hea fa" → Congestive heart
 * failure), curated aliases are indexed on the documents (CHF, Lasix ↔
 * furosemide, A1C ↔ HbA1c), and single-token typos fall back to an
 * edit-distance-1 dictionary scan.
 */
export const CodeLookup = React.forwardRef<HTMLDivElement, CodeLookupProps>(
  (
    {
      indexUrl,
      locale = 'en',
      domains,
      searchDomains,
      programsUrl,
      onSelect,
      onFreeText,
      limit = 15,
      placeholder = 'Search conditions, meds, labs… (try "con hea fa", "chf", "lasix")',
      bare = false,
      clearOnSelect,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [status, setStatus] = React.useState<Status>({
      state: 'loading',
      pct: 0,
    });
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<CodifyResult[]>([]);
    const [tookMs, setTookMs] = React.useState<number | null>(null);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [open, setOpen] = React.useState(false);
    /** Drill-down into a medication's forms & strengths (→ on a med row) */
    const [drill, setDrill] = React.useState<{
      parent: CodifyResult;
      results: CodifyResult[] | null; // null = loading
    } | null>(null);
    const workerRef = React.useRef<Worker | null>(null);
    const searchIdRef = React.useRef(0);
    const drillIdRef = React.useRef(0);
    /** Parent of the in-flight drill-down search (for family filtering) */
    const drillParentRef = React.useRef<CodifyResult | null>(null);
    /** Set when a pick writes the query — suppresses the follow-up auto-search */
    const skipSearchRef = React.useRef(false);
    // Per-instance element ids so multiple CodeLookups on a page don't break
    // aria-controls / aria-activedescendant relationships.
    const baseId = React.useId();
    const resultsId = `${baseId}-results`;
    const optionId = (i: number) => `${baseId}-option-${i}`;

    // domain keys keep effects stable without array identity; null means the
    // prop wasn't provided (search/load everything) — distinct from an
    // explicitly empty array, which means "none"
    const domainsKey = domains ? domains.join(',') : null;
    const searchDomainsKey = searchDomains ? searchDomains.join(',') : null;

    React.useEffect(() => {
      const worker = new Worker(
        new URL('./codify.worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );
      workerRef.current = worker;
      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          setStatus({
            state: 'loading',
            pct: Math.round((msg.loadedBytes / msg.totalBytes) * 100),
          });
        } else if (msg.type === 'ready') {
          setStatus({ state: 'ready', docCount: msg.docCount });
        } else if (msg.type === 'error') {
          setStatus({ state: 'error', message: msg.message });
        } else if (msg.type === 'results') {
          if (msg.id === searchIdRef.current) {
            setResults(msg.results);
            setTookMs(msg.tookMs);
            setActiveIndex(-1);
            setOpen(true);
          } else if (msg.id === drillIdRef.current) {
            // family members: the parent's forms & strengths / specific
            // codes / test variants, excluding the parent row itself.
            // Occupational drills resolve a curated order set instead — the
            // results already are the members, in curated order.
            const parent = drillParentRef.current;
            let members: CodifyResult[];
            if (parent?.domain === 'occupational') {
              members = msg.results as CodifyResult[];
            } else {
              const pKey = parent
                ? familyKey(parent.domain, parent.label, parent.fullcode)
                : '';
              members = (msg.results as CodifyResult[])
                .filter(
                  (r) =>
                    parent !== null &&
                    r.domain === parent.domain &&
                    r.fullid !== parent.fullid &&
                    familyKey(r.domain, r.label, r.fullcode) === pKey
                )
                .sort((a, b) => a.label.localeCompare(b.label));
            }
            setDrill((prev) => (prev ? { ...prev, results: members } : prev));
            setActiveIndex(members.length > 0 ? 0 : -1);
          }
        }
      };
      worker.postMessage({
        type: 'load',
        baseUrl: `${indexUrl.replace(/\/+$/, '')}/${locale}`,
        domains: keyToDomains(domainsKey),
        programsUrl,
      });
      return () => worker.terminate();
    }, [indexUrl, locale, domainsKey, programsUrl]);

    // debounced search-as-you-type
    React.useEffect(() => {
      if (status.state !== 'ready') return;
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }
      const q = query.trim();
      if (!q) {
        setResults([]);
        setTookMs(null);
        setOpen(false);
        setDrill(null);
        return;
      }
      const t = setTimeout(() => {
        const id = ++searchIdRef.current;
        workerRef.current?.postMessage({
          type: 'search',
          id,
          query: q,
          limit,
          domains: keyToDomains(searchDomainsKey),
          // one row per med family; variants live in the → drill-down
          collapse: true,
        });
      }, 40);
      return () => clearTimeout(t);
    }, [query, status.state, limit, searchDomainsKey]);

    /** A row that can be drilled into (→) to list its family members */
    const isDrillable = (r: CodifyResult) => r.domain in DETAIL_NOUN;

    const openDrill = React.useCallback((parent: CodifyResult) => {
      drillParentRef.current = parent;
      setDrill({ parent, results: null });
      const id = --drillIdRef.current; // negative ids: never collide with searches
      if (parent.domain === 'occupational') {
        // Occupational programs drill into their curated order set (the
        // orders that satisfy the surveillance requirement), resolved from
        // whichever shards are loaded — load lab/procedure/vaccine alongside.
        workerRef.current?.postMessage({
          type: 'orders',
          id,
          key: `${parent.codetype}|${parent.fullcode}`,
        });
        return;
      }
      // Search the family term uncollapsed and filter to the parent's family.
      // Aliases make Lasix → furosemide forms work because the parent row
      // already carries the canonical label. (Planned: condition drill-down
      // will also surface suggested orders for the condition via order-sets.)
      workerRef.current?.postMessage({
        type: 'search',
        id,
        query: familyTerm(parent.domain, parent.label) || parent.label,
        limit: 300,
        domains: [parent.domain],
      });
    }, []);

    const closeDrill = () => {
      setDrill(null);
      setActiveIndex(-1);
    };

    const list: CodifyResult[] = drill ? (drill.results ?? []) : results;

    const pick = (r: CodifyResult) => {
      onSelect?.(r);
      setOpen(false);
      setDrill(null);
      setResults([]);
      setActiveIndex(-1);
      if (clearOnSelect ?? bare) {
        // ready for the next entry
        setQuery('');
      } else {
        skipSearchRef.current = true;
        setQuery(r.label);
      }
    };

    const submitFreeText = () => {
      const text = query.trim();
      if (!text || !onFreeText) return;
      onFreeText(text);
      setOpen(false);
      setDrill(null);
      setResults([]);
      setActiveIndex(-1);
      if (clearOnSelect ?? bare) setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.min(list.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(-1, i - 1));
      } else if (
        e.key === 'ArrowRight' &&
        !drill &&
        activeIndex >= 0 &&
        list[activeIndex] &&
        isDrillable(list[activeIndex])
      ) {
        e.preventDefault();
        openDrill(list[activeIndex]);
      } else if (e.key === 'ArrowLeft' && drill) {
        e.preventDefault();
        closeDrill();
      } else if (e.key === 'Enter' && activeIndex >= 0 && list[activeIndex]) {
        e.preventDefault();
        pick(list[activeIndex]);
      } else if (e.key === 'Enter' && onFreeText && query.trim()) {
        e.preventDefault();
        submitFreeText();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (drill) closeDrill();
        else if (open) setOpen(false);
        else setQuery('');
      }
    };

    const effectivePlaceholder =
      status.state === 'loading'
        ? `Loading offline index… ${status.pct}%`
        : status.state === 'error'
          ? 'Code index unavailable'
          : placeholder;

    // Single source of truth for dropdown visibility — also drives aria-expanded
    const dropdownOpen =
      open &&
      (Boolean(drill) ||
        list.length > 0 ||
        Boolean(onFreeText && query.trim() !== ''));

    const searchBox = (
      <div className="relative">
        <SearchIcon
          size={16}
          className="text-muted-foreground absolute top-5 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-controls={resultsId}
          aria-activedescendant={
            activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-label="Search medical codes"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDrill(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => list.length > 0 && setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={effectivePlaceholder}
          disabled={status.state === 'error'}
          className={cn(
            'border-border bg-background text-foreground placeholder:text-muted-foreground',
            'h-10 w-full rounded-md border pr-3 pl-9 text-sm',
            'focus:ring-ring focus:ring-2 focus:outline-none'
          )}
        />

        {/* floating dropdown */}
        {dropdownOpen && (
          <div
            role="presentation"
            className={cn(
              'bg-card border-border absolute top-11 right-0 left-0 z-20',
              'overflow-hidden rounded-md border shadow-lg'
            )}
            // keep input focus when clicking inside the dropdown
            onMouseDown={(e) => e.preventDefault()}
          >
            {drill && (
              <div className="border-border bg-muted/50 flex items-center gap-1.5 border-b px-2 py-1.5">
                <button
                  type="button"
                  onClick={closeDrill}
                  aria-label="Back to search results"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                >
                  <ChevronLeftIcon size={14} />
                  Back
                </button>
                <span className="text-foreground text-xs font-semibold">
                  {drill.parent.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  — {DETAIL_NOUN[drill.parent.domain] ?? 'related codes'}
                  {drill.results === null ? '…' : ` (${drill.results.length})`}
                </span>
              </div>
            )}

            <ul
              id={resultsId}
              role="listbox"
              aria-label={
                drill
                  ? `${DETAIL_NOUN[drill.parent.domain] ?? 'related codes'} of ${drill.parent.label}`
                  : 'Code search results'
              }
              className="divide-border max-h-80 divide-y overflow-y-auto"
            >
              {list.map((r, i) => (
                <li
                  key={r.fullid}
                  role="presentation"
                  className="flex items-stretch"
                >
                  <button
                    type="button"
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => pick(r)}
                    onMouseMove={() => activeIndex !== i && setActiveIndex(i)}
                    className={cn(
                      'flex min-w-0 flex-1 items-baseline gap-2 px-3 py-1.5 text-left text-sm',
                      'hover:bg-muted/60 focus:bg-muted/60 focus:outline-none',
                      i === activeIndex && 'bg-muted/60'
                    )}
                  >
                    <span className="text-foreground min-w-0 flex-1 truncate">
                      {r.label}
                    </span>
                    <span
                      className={cn(
                        'text-muted-foreground shrink-0 text-[11px] whitespace-nowrap',
                        DOMAIN_TEXT[r.domain]
                      )}
                    >
                      {r.codetype}{' '}
                      <span className="font-mono">{r.fullcode}</span>
                    </span>
                  </button>
                  {!drill && isDrillable(r) && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Show ${DETAIL_NOUN[r.domain] ?? 'related codes'} of ${r.label}`}
                      title={`${DETAIL_NOUN[r.domain] ?? 'Related codes'} (→)`}
                      onClick={() => openDrill(r)}
                      onMouseMove={() => activeIndex !== i && setActiveIndex(i)}
                      className={cn(
                        'text-muted-foreground hover:text-foreground shrink-0 px-1.5',
                        'hover:bg-muted/60 focus:outline-none',
                        i === activeIndex
                          ? 'bg-muted/60 opacity-100'
                          : 'opacity-40'
                      )}
                    >
                      <ChevronRightIcon size={14} />
                    </button>
                  )}
                </li>
              ))}
              {drill &&
                drill.results !== null &&
                drill.results.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-sm">
                    No related entries found — press ← to go back.
                  </li>
                )}
              {!drill && onFreeText && query.trim() !== '' && (
                <li role="presentation" className="border-border border-t">
                  <button
                    type="button"
                    onClick={submitFreeText}
                    className={cn(
                      'text-muted-foreground hover:text-foreground hover:bg-muted/60 w-full px-3 py-1.5 text-left text-sm italic',
                      'focus:bg-muted/60 focus:outline-none'
                    )}
                  >
                    Use “{query.trim()}” as free text…
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );

    if (bare) {
      return (
        <div
          ref={ref}
          className={cn('w-full', className)}
          data-testid={dataTestId}
          {...props}
        >
          {searchBox}
        </div>
      );
    }

    return (
      <Card
        ref={ref}
        padding="none"
        // Card clips overflow by default — the dropdown must escape it
        className={cn('w-full overflow-visible', className)}
        data-testid={dataTestId}
        {...props}
      >
        <CardContent className="space-y-2 px-4 py-4">
          {searchBox}

          {/* status line */}
          <div
            className="text-muted-foreground flex items-center gap-2 text-xs"
            aria-live="polite"
          >
            {status.state === 'loading' && (
              <>
                <LoaderIcon size={12} className="animate-spin" />
                Loading offline index… {status.pct}%
              </>
            )}
            {status.state === 'ready' && tookMs === null && (
              <>
                Offline index ready — {status.docCount.toLocaleString()}{' '}
                entries.
              </>
            )}
            {status.state === 'ready' && tookMs !== null && (
              <>
                {results.length} results in {tookMs.toFixed(1)} ms (local) · ↑↓
                navigate · → drill into a row · Enter selects
              </>
            )}
            {status.state === 'error' && (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertCircleIcon size={12} />
                Index unavailable: {status.message}. Run{' '}
                <code className="font-mono">
                  node scripts/codify/extract.mjs && node
                  scripts/codify/build-index.mjs
                </code>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

CodeLookup.displayName = 'CodeLookup';

export default CodeLookup;
