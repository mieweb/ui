'use client';

/**
 * NITRO-backed orders grids.
 *
 * - {@link ChartOrdersGrid} — chart-wide: every pending and past **encounter
 *   order** across all encounters, plus the actionable due-list orders. Group
 *   and filter by reason (program), provider, requisition, status, kind, and
 *   date — via the one-click presets or the grid's own control panel.
 * - {@link EncounterOrdersGrid} — the current encounter's orders (its pending
 *   unprocessed items are the mass-operation targets) plus the due-list
 *   orders available to place this visit.
 *
 * Encounter orders get bundled into **requisitions** — documents routing a
 * batch of orders to a provider/referral. The grids only emit callbacks
 * (`onOrderRows`, `onRequisition`, `onCancel`); document generation is the
 * host application's job.
 *
 * Rendering is `@mieweb/ui/datavis` (`DataVisNitroSource` + `DataVisNitroGrid`)
 * fed through an object-URL source — see ordersGridShared.tsx.
 */

import * as React from 'react';
import { Button } from '../Button';
import type { PrescriptionReadiness } from '../../prescribing/types';
import { cn } from '../../utils/cn';
import { DataVisNitroGrid, DataVisNitroSource } from '../DataVisNITRO';
import {
  buildChartOrderRows,
  buildEncounterOrderRows,
  type OrderRow,
  type OrderRowsOptions,
} from './orderRows';
import {
  ORDER_COLUMNS,
  ORDER_CONTROL_FIELDS,
  formatOrderCell,
  useOrderRowsUrl,
  OrdersGroupPresets,
} from './ordersGridShared';
import type { PatientHistory } from './history';
import type { ProgramsMap } from './evaluate';

// =============================================================================
// Shared props + inner grid
// =============================================================================

interface OrdersGridBaseProps {
  prescriptionNow?: string;
  readinessByOrderId?: Record<string, PrescriptionReadiness | undefined>;
  /** Opens completion for this exact persisted instance. Never receives code-only rows. */
  onCompletePrescription?: (row: OrderRow) => void;
  /** Display-only screens retain alerts and filtering. */
  readOnly?: boolean;
  history: PatientHistory;
  /** Program metadata — programs.json contents (`programs` field) */
  programs: ProgramsMap;
  /** Occupational enrollments; quality measures apply to everyone in-gate */
  enrolledKeys?: string[];
  /** Display labels for program keys (falls back to the key) */
  programLabels?: Record<string, string>;
  /** Display labels for order keys (falls back to history labels, then key) */
  orderLabels?: Record<string, string>;
  /** Evaluation clock (defaults to today; inject for deterministic stories) */
  now?: Date;
  /** Place the selected available orders */
  onOrderRows?: (rows: OrderRow[]) => void;
  /** Bundle selected pending unprocessed orders into a requisition */
  onRequisition?: (rows: OrderRow[]) => void;
  /** Cancel selected pending unprocessed orders */
  onCancel?: (rows: OrderRow[]) => void;
  /** Grid height (CSS value) */
  height?: string;
  /** Grid title */
  title?: string;
  className?: string;
  'data-testid'?: string;
}

function OrdersGridInner({
  rows,
  title,
  height = '480px',
  onOrderRows,
  onRequisition,
  onCancel,
  onCompletePrescription,
  readOnly = false,
  className,
  'data-testid': dataTestId,
}: {
  rows: OrderRow[];
  title: string;
  height?: string;
  onOrderRows?: (rows: OrderRow[]) => void;
  onRequisition?: (rows: OrderRow[]) => void;
  onCancel?: (rows: OrderRow[]) => void;
  onCompletePrescription?: (row: OrderRow) => void;
  readOnly?: boolean;
  className?: string;
  'data-testid'?: string;
}) {
  const [readinessFilter, setReadinessFilter] = React.useState('all');
  const filterId = React.useId();
  const filteredRows = React.useMemo(
    () =>
      rows.filter(
        (row) =>
          readinessFilter === 'all' ||
          (readinessFilter === 'attention'
            ? row.prescriptionNeedsCompletion === 'true'
            : row.prescriptionReadiness === readinessFilter)
      ),
    [rows, readinessFilter]
  );
  const url = useOrderRowsUrl(filteredRows);
  const attentionCount = rows.filter(
    (row) => row.prescriptionNeedsCompletion === 'true'
  ).length;

  // Mass operations over the native checkbox selection. The palette hands
  // each callback the selected rows' data (OrderRow-shaped after the
  // object-URL round trip); each operation applies only to eligible rows:
  // 'available' can be ordered, pending unprocessed (no requisition yet)
  // can be bundled into a requisition or cancelled.
  const operations = React.useMemo(() => {
    const asOrderRows = (sel: unknown[]) => sel as OrderRow[];
    const ops: {
      label: string;
      callback: (ctx: { rows: unknown[] }) => void;
    }[] = [];
    if (!readOnly && onOrderRows) {
      ops.push({
        label: 'Order',
        callback: ({ rows: sel }) => {
          const eligible = asOrderRows(sel).filter(
            (r) => r.status === 'available'
          );
          if (eligible.length > 0) onOrderRows(eligible);
        },
      });
    }
    if (!readOnly && onRequisition) {
      ops.push({
        label: 'Create requisition',
        callback: ({ rows: sel }) => {
          const eligible = asOrderRows(sel).filter(
            (r) => r.status === 'pending' && !r.requisitionId
          );
          if (eligible.length > 0) onRequisition(eligible);
        },
      });
    }
    if (!readOnly && onCancel) {
      ops.push({
        label: 'Cancel',
        callback: ({ rows: sel }) => {
          const eligible = asOrderRows(sel).filter(
            (r) => r.status === 'pending' && !r.requisitionId
          );
          if (eligible.length > 0) onCancel(eligible);
        },
      });
    }
    if (!readOnly && onCompletePrescription)
      ops.push({
        label: 'Complete prescription',
        callback: ({ rows: selection }) => {
          const row = asOrderRows(selection).find(
            (candidate) =>
              candidate.orderId &&
              candidate.prescriptionNeedsCompletion === 'true'
          );
          if (row) onCompletePrescription(row);
        },
      });
    return ops;
  }, [onOrderRows, onRequisition, onCancel, onCompletePrescription, readOnly]);

  const columns = React.useMemo(
    () =>
      ORDER_COLUMNS.map(({ field, header }) => ({
        field: field as string,
        header,
      })),
    []
  );

  return (
    <div
      data-slot="orders-grid"
      data-testid={dataTestId}
      className={cn('flex flex-col gap-2', className)}
    >
      {rows.some((row) => row.prescriptionReadiness) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span role="status" aria-live="polite">
            {attentionCount} prescription{attentionCount === 1 ? '' : 's'} need
            attention
          </span>
          <label htmlFor={filterId}>Prescription readiness</label>
          <select
            id={filterId}
            value={readinessFilter}
            onChange={(event) => setReadinessFilter(event.target.value)}
            className="border-border bg-background rounded border px-2 py-1"
          >
            <option value="all">All orders</option>
            <option value="attention">Needs attention</option>
            <option value="incomplete">Needs details</option>
            <option value="invalid">Needs correction</option>
            <option value="unknown">Not checked</option>
            <option value="blocked">Blocked</option>
            <option value="complete">Details complete</option>
            <option value="review">Ready for review</option>
            <option value="send">Ready to send</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Send failed</option>
          </select>
          {!readOnly &&
            onCompletePrescription &&
            filteredRows
              .filter(
                (row) =>
                  row.orderId && row.prescriptionNeedsCompletion === 'true'
              )
              .map((row) => (
                <Button
                  key={row.orderId}
                  size="sm"
                  variant="outline"
                  aria-label={`Complete prescription: ${row.order} (${row.orderId})`}
                  onClick={() => onCompletePrescription(row)}
                >
                  Complete {row.order}
                </Button>
              ))}
        </div>
      )}
      <DataVisNitroSource type="http" url={url}>
        <OrdersGroupPresets />
        <DataVisNitroGrid
          title={title}
          height={height}
          columns={columns}
          controlFields={ORDER_CONTROL_FIELDS}
          operations={operations}
          // 'checkbox' selection ships in @mieweb/datavis > 1.1.0 (native
          // leading checkbox column + tri-state select-all header); the
          // published typings still say `boolean`, hence the cast.
          features={
            {
              rowSelection: 'checkbox',
              stickyHeaders: true,
            } as unknown as React.ComponentProps<
              typeof DataVisNitroGrid
            >['features']
          }
          formatCell={formatOrderCell}
        />
      </DataVisNitroSource>
    </div>
  );
}

// =============================================================================
// ChartOrdersGrid
// =============================================================================

export interface ChartOrdersGridProps extends OrdersGridBaseProps {
  /** Include not-yet-placed due-list orders as available/blocked rows */
  includeDue?: boolean;
}

/** Chart-wide order history across all encounters. */
export function ChartOrdersGrid({
  history,
  programs,
  enrolledKeys,
  programLabels,
  orderLabels,
  now,
  includeDue,
  readinessByOrderId,
  prescriptionNow,
  title = 'Orders — chart',
  ...rest
}: ChartOrdersGridProps) {
  const rows = React.useMemo(() => {
    const opts: OrderRowsOptions = {
      enrolledKeys,
      readinessByOrderId,
      prescriptionNow,
      now,
      programLabels,
      orderLabels,
      includeDue,
    };
    return buildChartOrderRows(history, programs, opts);
  }, [
    history,
    programs,
    enrolledKeys,
    readinessByOrderId,
    prescriptionNow,
    now,
    programLabels,
    orderLabels,
    includeDue,
  ]);

  return <OrdersGridInner rows={rows} title={title} {...rest} />;
}

ChartOrdersGrid.displayName = 'ChartOrdersGrid';

// =============================================================================
// EncounterOrdersGrid
// =============================================================================

export interface EncounterOrdersGridProps extends OrdersGridBaseProps {
  /** The current encounter (visit) ID */
  encounterId: string;
}

/** The current encounter's orders + due-list orders placeable this visit. */
export function EncounterOrdersGrid({
  history,
  programs,
  encounterId,
  enrolledKeys,
  programLabels,
  orderLabels,
  now,
  readinessByOrderId,
  prescriptionNow,
  title = 'Encounter orders',
  ...rest
}: EncounterOrdersGridProps) {
  const rows = React.useMemo(() => {
    const opts: OrderRowsOptions = {
      enrolledKeys,
      readinessByOrderId,
      prescriptionNow,
      now,
      programLabels,
      orderLabels,
    };
    return buildEncounterOrderRows(history, programs, encounterId, opts);
  }, [
    history,
    programs,
    encounterId,
    enrolledKeys,
    readinessByOrderId,
    prescriptionNow,
    now,
    programLabels,
    orderLabels,
  ]);

  return <OrdersGridInner rows={rows} title={title} {...rest} />;
}

EncounterOrdersGrid.displayName = 'EncounterOrdersGrid';
