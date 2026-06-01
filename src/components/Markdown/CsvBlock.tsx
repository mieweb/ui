/** CSV data rendered as a sortable table. Requires `papaparse`. */
import { Download } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '../Button';
import { FenceBlock } from './FenceBlock';

interface CsvBlockProps {
  code: string;
  id: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

type CsvRow = Record<string, unknown>;
type PapaParseFn = (input: string, config: unknown) => {
  meta: { fields?: string[] };
  data: CsvRow[];
  errors: Array<{ message: string }>;
};
type PapaUnparseFn = (data: unknown) => string;
type PapaModule = { default?: { parse: PapaParseFn; unparse: PapaUnparseFn } } & {
  parse?: PapaParseFn;
  unparse?: PapaUnparseFn;
};

let papaPromise: Promise<{ parse: PapaParseFn; unparse: PapaUnparseFn }> | null = null;
function loadPapa() {
  if (!papaPromise) {
    papaPromise = import(/* @vite-ignore */ 'papaparse')
      .then((mod: PapaModule) => {
        const api = (mod.default ?? mod) as { parse: PapaParseFn; unparse: PapaUnparseFn };
        if (!api?.parse) throw new Error('papaparse export not found');
        return api;
      })
      .catch((err) => {
        papaPromise = null;
        throw err;
      });
  }
  return papaPromise;
}

interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  error: string | null;
}

export const CsvBlock: React.FC<CsvBlockProps> = ({ code, id }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [papa, setPapa] = useState<{ parse: PapaParseFn; unparse: PapaUnparseFn } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPapa()
      .then((api) => {
        if (!cancelled) setPapa(api);
      })
      .catch(() => {
        if (!cancelled)
          setLoadError(
            'CSV preview requires the `papaparse` package. Install it with `npm install papaparse`.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parsed = useMemo<ParsedCsv>(() => {
    if (!papa) return { headers: [], rows: [], error: null };
    try {
      const result = papa.parse(code, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
      });
      if (result.errors?.length) {
        return {
          headers: result.meta.fields ?? [],
          rows: result.data,
          error: result.errors.map((e) => e.message).join('; '),
        };
      }
      return { headers: result.meta.fields ?? [], rows: result.data, error: null };
    } catch (err) {
      return { headers: [], rows: [], error: (err as Error).message };
    }
  }, [code, papa]);

  const sortedRows = useMemo(() => {
    if (!sortConfig || parsed.error) return parsed.rows;
    return [...parsed.rows].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [parsed.rows, sortConfig, parsed.error]);

  const handleSort = useCallback((column: string) => {
    setSortConfig((prev) => {
      if (prev?.column === column) {
        return prev.direction === 'asc' ? { column, direction: 'desc' } : null;
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!papa) return;
    const csvContent = papa.unparse(sortedRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-${id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, id, papa]);

  if (loadError) {
    return (
      <FenceBlock code={code} language="csv" error={loadError}>
        <div />
      </FenceBlock>
    );
  }

  if (!papa) {
    return (
      <FenceBlock code={code} language="csv" supportsRawView>
        <div className="flex items-center justify-center p-6 text-sm text-neutral-500">
          Loading CSV parser…
        </div>
      </FenceBlock>
    );
  }

  if (parsed.error) {
    return (
      <FenceBlock code={code} language="csv" error={parsed.error}>
        <div />
      </FenceBlock>
    );
  }

  return (
    <FenceBlock code={code} language="csv" supportsRawView>
      <div className="relative">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 dark:border-neutral-700">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {sortedRows.length} row{sortedRows.length !== 1 ? 's' : ''} × {parsed.headers.length}{' '}
            column{parsed.headers.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCsv}
            aria-label="Export CSV"
            className="h-7 gap-1 px-2 text-xs"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>

        <div className="max-h-96 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
              <tr>
                {parsed.headers.map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    {header}
                    {sortConfig?.column === header && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {sortedRows.map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  {parsed.headers.map((header) => (
                    <td
                      key={header}
                      className="whitespace-nowrap px-3 py-1.5 text-neutral-700 dark:text-neutral-300"
                    >
                      {row[header] != null ? String(row[header]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FenceBlock>
  );
};
