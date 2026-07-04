'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Card, CardContent } from '../Card/Card';
import { SearchIcon, LoaderIcon, AlertCircleIcon } from '../Icons';
import type { CodifyResult } from './engine';

// =============================================================================
// Types
// =============================================================================

export type CodifyDomain = 'condition' | 'med' | 'lab' | 'procedure' | 'vaccine';

export interface CodeLookupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'onSelect'> {
  /** Base URL where manifest.json and the .mcdx shards are served */
  indexUrl: string;
  /** Domains to load & search (default: all in the manifest) */
  domains?: CodifyDomain[];
  /** Called when a result is picked */
  onSelect?: (result: CodifyResult) => void;
  /** Max results to show */
  limit?: number;
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

type Status =
  | { state: 'loading'; pct: number }
  | { state: 'ready'; docCount: number }
  | { state: 'error'; message: string };

const DOMAIN_BADGE: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  condition: 'default',
  med: 'success',
  lab: 'warning',
  procedure: 'secondary',
  vaccine: 'outline',
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
      domains,
      onSelect,
      limit = 15,
      placeholder = 'Search conditions, meds, labs… (try "con hea fa", "chf", "lasix")',
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [status, setStatus] = React.useState<Status>({ state: 'loading', pct: 0 });
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<CodifyResult[]>([]);
    const [tookMs, setTookMs] = React.useState<number | null>(null);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const workerRef = React.useRef<Worker | null>(null);
    const searchIdRef = React.useRef(0);

    // domains is spread into a stable key so the effect doesn't need the array identity
    const domainsKey = domains?.join(',') ?? '';

    React.useEffect(() => {
      const worker = new Worker(new URL('./codify.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          setStatus({ state: 'loading', pct: Math.round((msg.loadedBytes / msg.totalBytes) * 100) });
        } else if (msg.type === 'ready') {
          setStatus({ state: 'ready', docCount: msg.docCount });
        } else if (msg.type === 'error') {
          setStatus({ state: 'error', message: msg.message });
        } else if (msg.type === 'results') {
          if (msg.id === searchIdRef.current) {
            setResults(msg.results);
            setTookMs(msg.tookMs);
            setActiveIndex(-1);
          }
        }
      };
      worker.postMessage({
        type: 'load',
        baseUrl: indexUrl,
        domains: domainsKey ? domainsKey.split(',') : undefined,
      });
      return () => worker.terminate();
    }, [indexUrl, domainsKey]);

    // debounced search-as-you-type
    React.useEffect(() => {
      if (status.state !== 'ready') return;
      const q = query.trim();
      if (!q) {
        setResults([]);
        setTookMs(null);
        return;
      }
      const t = setTimeout(() => {
        const id = ++searchIdRef.current;
        workerRef.current?.postMessage({ type: 'search', id, query: q, limit });
      }, 40);
      return () => clearTimeout(t);
    }, [query, status.state, limit]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(-1, i - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        onSelect?.(results[activeIndex]);
      } else if (e.key === 'Escape') {
        setQuery('');
      }
    };

    return (
      <Card
        ref={ref}
        padding="none"
        className={cn('w-full', className)}
        data-testid={dataTestId}
        {...props}
      >
        <CardContent className="space-y-2 px-4 py-4">
          <div className="relative">
            <SearchIcon
              size={16}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="code-lookup-results"
              aria-activedescendant={
                activeIndex >= 0 ? `code-lookup-option-${activeIndex}` : undefined
              }
              aria-label="Search medical codes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={status.state === 'error'}
              className={cn(
                'border-border bg-background text-foreground placeholder:text-muted-foreground',
                'h-10 w-full rounded-md border pr-3 pl-9 text-sm',
                'focus:ring-ring focus:ring-2 focus:outline-none'
              )}
            />
          </div>

          {/* status line */}
          <div className="text-muted-foreground flex items-center gap-2 text-xs" aria-live="polite">
            {status.state === 'loading' && (
              <>
                <LoaderIcon size={12} className="animate-spin" />
                Loading offline index… {status.pct}%
              </>
            )}
            {status.state === 'ready' && tookMs === null && (
              <>Offline index ready — {status.docCount.toLocaleString()} entries.</>
            )}
            {status.state === 'ready' && tookMs !== null && (
              <>
                {results.length} results in {tookMs.toFixed(1)} ms (local)
              </>
            )}
            {status.state === 'error' && (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertCircleIcon size={12} />
                Index unavailable: {status.message}. Run{' '}
                <code className="font-mono">
                  node scripts/codify/extract.mjs && node scripts/codify/build-index.mjs
                </code>
              </span>
            )}
          </div>

          {/* results */}
          {results.length > 0 && (
            <ul
              id="code-lookup-results"
              role="listbox"
              aria-label="Code search results"
              className="border-border divide-border max-h-96 divide-y overflow-y-auto rounded-md border"
            >
              {results.map((r, i) => (
                <li key={r.fullid} role="presentation">
                  <button
                    type="button"
                    id={`code-lookup-option-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => onSelect?.(r)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                      'hover:bg-muted/60 focus:bg-muted/60 focus:outline-none',
                      i === activeIndex && 'bg-muted/60'
                    )}
                  >
                    <Badge
                      variant={DOMAIN_BADGE[r.domain] ?? 'outline'}
                      size="sm"
                      className="w-20 shrink-0 justify-center"
                    >
                      {r.codetype}
                    </Badge>
                    <span className="text-foreground flex-1">{r.label}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {r.fullcode}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }
);

CodeLookup.displayName = 'CodeLookup';

export default CodeLookup;
