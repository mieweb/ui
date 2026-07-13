'use client';

/**
 * Shared internals for the NITRO-backed orders grids
 * (ChartOrdersGrid / EncounterOrdersGrid).
 *
 * - {@link useOrderRowsUrl} — feeds in-memory {@link OrderRow}s to
 *   `DataVisNitroSource` through a short-lived object-URL carrying the
 *   `{ typeInfo, data }` payload the engine expects (its `local` source type
 *   is not implemented yet; same pattern as SuperChat's NITRO table plugin).
 * - {@link OrderStatusBadge} / {@link formatOrderCell} — status chips in grid
 *   cells.
 * - {@link OrdersGroupPresets} — one-click "group by" chips driving
 *   `view.setGroup()` through {@link DataVisNitroContext}.
 *
 * Row selection and mass operations are native NITRO features:
 * `features.rowSelection: 'checkbox'` + the `operations` palette.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { DataVisNitroContext } from '../DataVisNITRO';
import type { OrderRow, OrderRowStatus } from './orderRows';

// =============================================================================
// Column + typeInfo metadata
// =============================================================================

/** Grid columns, in display order, with control-panel display names. */
export const ORDER_COLUMNS: {
  field: keyof OrderRow;
  header: string;
  type: 'string' | 'date';
}[] = [
  { field: 'status', header: 'Status', type: 'string' },
  { field: 'order', header: 'Order', type: 'string' },
  { field: 'reason', header: 'Reason', type: 'string' },
  { field: 'kind', header: 'Kind', type: 'string' },
  { field: 'date', header: 'Date', type: 'date' },
  { field: 'dueDate', header: 'Due', type: 'date' },
  { field: 'provider', header: 'Provider', type: 'string' },
  { field: 'requisitionId', header: 'Requisition', type: 'string' },
  { field: 'encounterId', header: 'Encounter', type: 'string' },
  { field: 'blockedBy', header: 'Blocked by', type: 'string' },
];

/** Fields offered in the grid's Group/Filter control panel. */
export const ORDER_CONTROL_FIELDS = ORDER_COLUMNS.filter(
  (c) => c.field !== 'blockedBy'
).map((c) => ({ field: c.field, displayName: c.header, type: c.type }));

// =============================================================================
// useOrderRowsUrl
// =============================================================================

/** Serialize rows into an object-URL `{ typeInfo, data }` source. */
export function useOrderRowsUrl(rows: OrderRow[]): string {
  const url = React.useMemo(() => {
    const payload = {
      typeInfo: ORDER_COLUMNS.map(({ field, type }) => ({ field, type })),
      data: rows,
    };
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    return URL.createObjectURL(blob);
  }, [rows]);

  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return url;
}

// =============================================================================
// Status badge
// =============================================================================

const STATUS_VARIANT: Record<
  OrderRowStatus,
  { label: string; variant: 'success' | 'secondary' | 'warning' | 'default' }
> = {
  completed: { label: 'Completed', variant: 'success' },
  pending: { label: 'Pending', variant: 'secondary' },
  available: { label: 'Available', variant: 'warning' },
  blocked: { label: 'Blocked', variant: 'default' },
};

export function OrderStatusBadge({ status }: { status: OrderRowStatus }) {
  const meta = STATUS_VARIANT[status];
  if (!meta) return <>{status}</>;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/** `formatCell` for DataVisNitroGrid — renders the status column as a badge. */
export function formatOrderCell(
  value: unknown,
  _row: unknown,
  column: { field: string }
): React.ReactNode {
  if (column.field === 'status' && typeof value === 'string') {
    return <OrderStatusBadge status={value as OrderRowStatus} />;
  }
  return value as React.ReactNode;
}

// =============================================================================
// Group presets
// =============================================================================

export interface GroupPreset {
  key: string;
  label: string;
  /** Field to group by; undefined = clear grouping */
  field?: keyof OrderRow;
}

export const DEFAULT_GROUP_PRESETS: GroupPreset[] = [
  { key: 'none', label: 'Flat' },
  { key: 'reason', label: 'By reason', field: 'reason' },
  { key: 'provider', label: 'By provider', field: 'provider' },
  { key: 'requisition', label: 'By requisition', field: 'requisitionId' },
  { key: 'status', label: 'By status', field: 'status' },
  { key: 'date', label: 'By date', field: 'date' },
];

/**
 * One-click group-by chips. Must render inside `DataVisNitroSource` — drives
 * the shared view via `setGroup({ fieldNames: [{ field }] })`.
 */
export function OrdersGroupPresets({
  presets = DEFAULT_GROUP_PRESETS,
  className,
}: {
  presets?: GroupPreset[];
  className?: string;
}) {
  const view = React.useContext(DataVisNitroContext);
  const [active, setActive] = React.useState('none');

  const apply = (preset: GroupPreset) => {
    if (!view) return;
    setActive(preset.key);
    if (preset.field) {
      view.setGroup({ fieldNames: [{ field: preset.field }] });
    } else {
      view.clearGroup();
    }
  };

  return (
    <div
      data-slot="orders-group-presets"
      role="group"
      aria-label="Group orders by"
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      <span className="text-muted-foreground text-xs font-medium">Group:</span>
      {presets.map((p) => (
        <Button
          key={p.key}
          type="button"
          size="sm"
          variant={active === p.key ? 'primary' : 'outline'}
          aria-pressed={active === p.key}
          onClick={() => apply(p)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
