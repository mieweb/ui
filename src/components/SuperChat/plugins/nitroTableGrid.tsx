/**
 * SuperChat NITRO table grid (lazy chunk).
 *
 * Default-exported so it can be pulled in with `React.lazy` only when a GFM
 * table actually renders — this keeps the heavy `datavis` / `datavis-ace`
 * dependencies out of the SuperChat (and Markdown core) bundle.
 *
 * Data is handed to {@link DataVisNitroSource} through a short-lived local
 * source so Storybook never pauses in the intermediate "Waiting…" state.
 */

import * as React from 'react';
import { DataVisNitroGrid, DataVisNitroSource } from '../../DataVisNITRO';

export interface NitroTableGridProps {
  /** Column headers, in order. */
  headers: string[];
  /** Row objects keyed by header. */
  rows: Array<Record<string, string>>;
}

export default function NitroTableGrid({ headers, rows }: NitroTableGridProps) {
  const varName = React.useMemo(() => {
    const nextVarName = `__superchat_nitro_table_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, unknown>)[nextVarName] = {
      typeInfo: headers.map((field) => ({ field, type: 'string' })),
      data: rows,
    };
    return nextVarName;
  }, [headers, rows]);

  React.useEffect(
    () => () => {
      delete (window as unknown as Record<string, unknown>)[varName];
    },
    [varName]
  );

  return (
    <div data-slot="superchat-nitro-table" className="my-2">
      <DataVisNitroSource type="local" varName={varName}>
        <DataVisNitroGrid columns={headers} className="max-h-80" />
      </DataVisNitroSource>
    </div>
  );
}
