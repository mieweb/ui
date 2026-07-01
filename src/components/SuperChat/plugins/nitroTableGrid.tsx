/**
 * SuperChat NITRO table grid (lazy chunk).
 *
 * Default-exported so it can be pulled in with `React.lazy` only when a GFM
 * table actually renders — this keeps the heavy `datavis` / `datavis-ace`
 * dependencies out of the SuperChat (and Markdown core) bundle.
 *
 * Data is handed to {@link DataVisNitroSource} through a short-lived object-URL
 * `http` source carrying the `{ typeInfo, data }` shape the engine expects.
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
  const url = React.useMemo(() => {
    const payload = {
      typeInfo: headers.map((field) => ({ field, type: 'string' })),
      data: rows,
    };
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    return URL.createObjectURL(blob);
  }, [headers, rows]);

  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div data-slot="superchat-nitro-table" className="my-2">
      <DataVisNitroSource type="http" url={url}>
        <DataVisNitroGrid columns={headers} minimalMode className="max-h-80" />
      </DataVisNitroSource>
    </div>
  );
}
