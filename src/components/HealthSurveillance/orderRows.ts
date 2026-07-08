/**
 * Order-row builders — flatten the order history and the due-evaluation
 * output into grid-friendly rows (one row per encounter order) for the
 * NITRO-backed ChartOrdersGrid / EncounterOrdersGrid.
 *
 * Pure functions, no I/O. Every field is a flat string so the DataVis engine
 * can group/filter/aggregate on any of them (reason, provider, requisition,
 * status, kind, date).
 */

import {
  evaluateDue,
  normalizeOrders,
  completedKeys,
  type DueItem,
  type ProgramsMap,
} from './evaluate';
import type { PatientHistory } from './history';

// =============================================================================
// Types
// =============================================================================

/** Per-order status — finer grained than the program-level DueStatus. */
export type OrderRowStatus = 'completed' | 'pending' | 'available' | 'blocked';

/** One encounter order as a flat grid row. */
export interface OrderRow {
  /** CODETYPE|FULLCODE of the order */
  orderKey: string;
  /** Order display label */
  order: string;
  /** Reason/concern — the surveillance program or quality measure label */
  reason: string;
  /** Program key (CODETYPE|FULLCODE); '' when no program matches */
  reasonKey: string;
  /** Program kind label ('surveillance', 'quality measure', …) */
  kind: string;
  status: OrderRowStatus;
  /** Completion date (completed) or order date (pending); '' otherwise */
  date: string;
  /** Program due date, when known */
  dueDate: string;
  /** Ordering/performing provider; '' when unknown */
  provider: string;
  /** Requisition the order is bundled into; '' = unprocessed */
  requisitionId: string;
  /** Encounter the order was placed in; '' for not-yet-placed rows */
  encounterId: string;
  /** Unmet prerequisite labels, comma-joined ('' when unblocked) */
  blockedBy: string;
}

export interface OrderRowsOptions {
  /** Occupational enrollments; quality measures apply to everyone in-gate */
  enrolledKeys?: string[];
  /** Evaluation clock (defaults to today; inject for determinism) */
  now?: Date;
  /** Display labels for program keys (falls back to the key) */
  programLabels?: Record<string, string>;
  /** Display labels for order keys (falls back to history labels, then key) */
  orderLabels?: Record<string, string>;
  /** Include not-yet-placed due-list orders as available/blocked rows
   * (default true) */
  includeDue?: boolean;
}

const KIND_LABEL: Record<string, string> = {
  surveillance: 'surveillance',
  fitness: 'fitness for duty',
  credential: 'credential',
  quality: 'quality measure',
};

// =============================================================================
// Internals
// =============================================================================

function labelLookup(
  history: PatientHistory,
  orderLabels?: Record<string, string>
): (key: string) => string {
  const m = new Map<string, string>();
  const scan = (list?: { key?: string; label?: string }[]) => {
    for (const e of list ?? []) {
      if (e.key && e.label && !m.has(e.key)) m.set(e.key, e.label);
    }
  };
  scan(history.orders);
  scan(history.observations);
  scan(history.procedures);
  scan(history.immunizations);
  return (key) => orderLabels?.[key] ?? m.get(key) ?? key;
}

/** Map every order key to the due item whose program's order set contains it
 * (first program wins when several share an order). */
function reasonIndex(items: DueItem[]): Map<string, DueItem> {
  const idx = new Map<string, DueItem>();
  for (const item of items) {
    for (const spec of normalizeOrders(item.program.orders)) {
      for (const k of spec.keys) {
        if (!idx.has(k)) idx.set(k, item);
      }
    }
  }
  return idx;
}

// =============================================================================
// Builders
// =============================================================================

/**
 * Chart-wide rows: every past + in-flight order in the history, plus (by
 * default) the actionable due-list orders that haven't been placed yet
 * (`available`, or `blocked` while prerequisites are incomplete).
 */
export function buildChartOrderRows(
  history: PatientHistory,
  programs: ProgramsMap,
  options: OrderRowsOptions = {}
): OrderRow[] {
  const {
    enrolledKeys,
    now,
    programLabels,
    orderLabels,
    includeDue = true,
  } = options;
  const items = evaluateDue(history, programs, { enrolledKeys, now });
  const byOrderKey = reasonIndex(items);
  const orderLabel = labelLookup(history, orderLabels);
  const programLabel = (key: string) => programLabels?.[key] ?? key;
  const completed = completedKeys(history);

  const rows: OrderRow[] = [];

  const reasonFields = (item?: DueItem) => ({
    reason: item ? programLabel(item.key) : '',
    reasonKey: item?.key ?? '',
    kind: item?.program.kind
      ? (KIND_LABEL[item.program.kind] ?? item.program.kind)
      : '',
    dueDate: item?.dueDate?.slice(0, 10) ?? '',
  });

  // 1) Every order in the history (all encounters)
  for (const o of history.orders) {
    rows.push({
      orderKey: o.key,
      order: orderLabel(o.key),
      ...reasonFields(byOrderKey.get(o.key)),
      status: o.status,
      date: o.date.slice(0, 10),
      provider: o.provider ?? '',
      requisitionId: o.requisitionId ?? '',
      encounterId: o.encounterId ?? '',
      blockedBy: '',
    });
  }

  // 2) Actionable due-list orders not yet placed
  if (includeDue) {
    const placed = new Set(history.orders.map((o) => o.key));
    for (const item of items) {
      if (item.status === 'satisfied' || item.status === 'not-applicable')
        continue;
      for (const spec of normalizeOrders(item.program.orders)) {
        const unmet = spec.after.filter((k) => !completed.has(k));
        for (const k of spec.keys) {
          if (placed.has(k)) continue;
          rows.push({
            orderKey: k,
            order: orderLabel(k),
            ...reasonFields(item),
            status: unmet.length > 0 ? 'blocked' : 'available',
            date: '',
            provider: '',
            requisitionId: '',
            encounterId: '',
            blockedBy: unmet.map(orderLabel).join(', '),
          });
        }
      }
    }
  }

  return rows;
}

/**
 * Current-encounter rows: the encounter's own orders (pending unprocessed
 * ones are the mass-operation targets) plus the actionable due-list orders
 * available to place this visit.
 */
export function buildEncounterOrderRows(
  history: PatientHistory,
  programs: ProgramsMap,
  encounterId: string,
  options: OrderRowsOptions = {}
): OrderRow[] {
  return buildChartOrderRows(history, programs, options).filter(
    (r) =>
      r.encounterId === encounterId ||
      r.status === 'available' ||
      r.status === 'blocked'
  );
}
