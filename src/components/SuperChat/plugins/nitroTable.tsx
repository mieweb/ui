/**
 * SuperChat NITRO table plugin (opt-in).
 *
 * Renders GFM tables through **NITRO DataVis** (sortable / filterable /
 * resizable) instead of a static `<table>`. The heavy grid is `React.lazy`-loaded
 * only when a table appears, and if the `datavis` engine can't load (e.g. the
 * submodule isn't installed) it **degrades gracefully** to the themed HTML table.
 *
 * @example
 * import { createNitroTablePlugin } from '@mieweb/ui/components/SuperChat/plugins';
 * const render = createMarkdownRenderer({ plugins: [createNitroTablePlugin()] });
 */

import * as React from 'react';
import { cn } from '../../../utils/cn';
import type { SuperChatRenderPlugin } from '../types';

const NitroTableGrid = React.lazy(() => import('./nitroTableGrid'));

// ---------------------------------------------------------------------------
// GFM table extraction from the hast node
// ---------------------------------------------------------------------------

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

function rowsOf(parent: HastNode | undefined): HastNode[] {
  return (parent?.children ?? []).filter((c) => c.tagName === 'tr');
}

function cellsOf(row: HastNode, tag: 'th' | 'td'): HastNode[] {
  return (row.children ?? []).filter((c) => c.tagName === tag);
}

interface ParsedTable {
  headers: string[];
  rows: Array<Record<string, string>>;
}

function parseTable(node: HastNode | undefined): ParsedTable | null {
  if (!node || node.tagName !== 'table') return null;

  const thead = node.children?.find((c) => c.tagName === 'thead');
  const tbody = node.children?.find((c) => c.tagName === 'tbody');

  const headerRow = rowsOf(thead)[0];
  if (!headerRow) return null;

  const headers = cellsOf(headerRow, 'th').map((c) => textOf(c).trim());
  if (headers.length === 0) return null;

  // De-duplicate header keys so row objects don't collide.
  const seen = new Map<string, number>();
  const keys = headers.map((h) => {
    const base = h || 'column';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });

  const rows = rowsOf(tbody).map((tr) => {
    const cells = cellsOf(tr, 'td');
    const row: Record<string, string> = {};
    keys.forEach((key, i) => {
      row[key] = cells[i] ? textOf(cells[i]).trim() : '';
    });
    return row;
  });

  return { headers: keys, rows };
}

// ---------------------------------------------------------------------------
// Fallback HTML table (also the graceful-degradation target)
// ---------------------------------------------------------------------------

function HtmlTable({
  node: _node,
  ...props
}: React.ComponentProps<'table'> & { node?: unknown }) {
  return (
    <div className="my-2 overflow-x-auto">
      <table
        {...props}
        className={cn(
          'w-full border-collapse text-sm [&_td]:border [&_td]:border-neutral-200 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-neutral-700 [&_th]:border [&_th]:border-neutral-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left dark:[&_th]:border-neutral-700',
          props.className
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error boundary → degrade to HTML table if the grid fails to load/render
// ---------------------------------------------------------------------------

class GridErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

/** Create the NITRO DataVis table render plugin. */
export function createNitroTablePlugin(): SuperChatRenderPlugin {
  const NitroTable = (props: Record<string, unknown>) => {
    const node = props.node as HastNode | undefined;
    const fallback = (
      <HtmlTable
        {...(props as React.ComponentProps<'table'> & { node?: unknown })}
      />
    );

    const parsed = React.useMemo(() => parseTable(node), [node]);
    if (!parsed) return fallback;

    return (
      <GridErrorBoundary fallback={fallback}>
        <React.Suspense fallback={fallback}>
          <NitroTableGrid headers={parsed.headers} rows={parsed.rows} />
        </React.Suspense>
      </GridErrorBoundary>
    );
  };

  return {
    name: 'nitro-table',
    components: {
      table: NitroTable,
    },
  };
}
