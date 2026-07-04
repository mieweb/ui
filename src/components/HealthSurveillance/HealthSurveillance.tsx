'use client';

/**
 * HealthSurveillance — the patient's health-surveillance due list.
 *
 * Renders the output of the due-evaluation engine (see ./evaluate.ts) over a
 * PatientHistory and program metadata (programs.json from mieweb/codify or a
 * deployment's own): occupational surveillance programs (OSHA, DOT, …) and
 * quality measures (CMS eCQMs) grouped into what's **due/overdue/pending**
 * and what's **done**. Each due item expands into a multi-select picklist of
 * its satisfying orders so several can be placed at once (`onOrderMany`) —
 * designed to sit next to the Assessment component, which receives the picks
 * as orders linked to the program's concern.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardContent } from '../Card/Card';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
} from '../Icons';
import { evaluateDue, normalizeOrders, completedKeys } from './evaluate';
import type { DueItem, OrderSpec, ProgramsMap } from './evaluate';
import type { PatientHistory } from './history';

// =============================================================================
// Types
// =============================================================================

export interface SurveillanceOrderPick {
  /** CODETYPE|FULLCODE of the picked order */
  key: string;
  label: string;
  /** Program the order satisfies (CODETYPE|FULLCODE) */
  programKey: string;
  /** Program display label */
  programLabel: string;
}

export interface HealthSurveillanceProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className'
> {
  history: PatientHistory;
  /** Program metadata — programs.json contents (`programs` field) */
  programs: ProgramsMap;
  /** Occupational enrollments; quality measures apply to everyone in-gate */
  enrolledKeys?: string[];
  /** Display labels for program keys (falls back to the key) */
  programLabels?: Record<string, string>;
  /** Display labels for order keys (falls back to history labels, then key) */
  orderLabels?: Record<string, string>;
  /** Single order requested from a due item's picklist */
  onOrder?: (pick: SurveillanceOrderPick) => void;
  /** Batch of orders requested from a due item's picklist */
  onOrderMany?: (picks: SurveillanceOrderPick[]) => void;
  /** Evaluation clock (defaults to today; inject for deterministic stories) */
  now?: Date;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Internals
// =============================================================================

const STATUS_BADGE: Record<
  DueItem['status'],
  {
    label: string;
    variant: 'danger' | 'warning' | 'secondary' | 'success' | 'default';
  }
> = {
  overdue: { label: 'Overdue', variant: 'danger' },
  due: { label: 'Due', variant: 'warning' },
  pending: { label: 'Pending', variant: 'secondary' },
  satisfied: { label: 'Done', variant: 'success' },
  'not-applicable': { label: 'N/A', variant: 'default' },
};

const KIND_LABEL: Record<string, string> = {
  surveillance: 'surveillance',
  fitness: 'fitness for duty',
  credential: 'credential',
  quality: 'quality measure',
};

function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

// =============================================================================
// HealthSurveillance
// =============================================================================

export const HealthSurveillance = React.forwardRef<
  HTMLDivElement,
  HealthSurveillanceProps
>(
  (
    {
      history,
      programs,
      enrolledKeys,
      programLabels,
      orderLabels,
      onOrder,
      onOrderMany,
      now,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const items = React.useMemo(
      () => evaluateDue(history, programs, { enrolledKeys, now }),
      [history, programs, enrolledKeys, now]
    );
    const actionable = items.filter((i) => i.status !== 'satisfied');
    const done = items.filter((i) => i.status === 'satisfied');

    // label lookup: explicit props, then history entries, then the raw key
    const historyLabels = React.useMemo(() => {
      const m = new Map<string, string>();
      const scan = (
        list?: { key?: string; label?: string }[]
      ) => {
        for (const e of list ?? []) {
          if (e.key && e.label && !m.has(e.key)) m.set(e.key, e.label);
        }
      };
      scan(history.orders);
      scan(history.observations);
      scan(history.procedures);
      scan(history.immunizations);
      return m;
    }, [history]);
    const orderLabel = (key: string) =>
      orderLabels?.[key] ?? historyLabels.get(key) ?? key;
    const programLabel = (key: string) => programLabels?.[key] ?? key;

    const [expanded, setExpanded] = React.useState<string | null>(null);
    const [checked, setChecked] = React.useState<Set<string>>(new Set());

    /** Everything already completed — unlocks dependent orders. */
    const completedSet = React.useMemo(() => completedKeys(history), [history]);

    /** Dependency level per spec (0 = no prerequisites — crude Gantt lane). */
    const specLevel = (spec: OrderSpec, specs: OrderSpec[]): number => {
      let level = 0;
      let cur = spec.after;
      const guard = new Set<OrderSpec>();
      while (cur.length > 0 && level < 8) {
        level++;
        const parents = specs.filter(
          (p) => !guard.has(p) && p.keys.some((k) => cur.includes(k))
        );
        parents.forEach((p) => guard.add(p));
        cur = parents.flatMap((p) => p.after);
      }
      return level;
    };

    /** Prerequisites not yet completed in the history. */
    const unmetAfter = (spec: OrderSpec) =>
      spec.after.filter((k) => !completedSet.has(k));

    const toggleExpand = (item: DueItem) => {
      if (expanded === item.key) {
        setExpanded(null);
        return;
      }
      setExpanded(item.key);
      // preselect: first alternative of every actionable entry — skip
      // already-pending orders and entries blocked by unmet prerequisites
      const specs = normalizeOrders(item.program.orders);
      const pre = new Set<string>();
      for (const spec of specs) {
        if (unmetAfter(spec).length > 0) continue; // blocked (Gantt: later lane)
        const first = spec.keys.find((k) => !item.pendingKeys.includes(k));
        if (first && !spec.keys.some((k) => item.pendingKeys.includes(k)))
          pre.add(first);
      }
      setChecked(pre);
    };

    const picksFor = (item: DueItem): SurveillanceOrderPick[] =>
      normalizeOrders(item.program.orders)
        .flatMap((s) => s.keys)
        .filter((o) => checked.has(o))
        .map((o) => ({
          key: o,
          label: orderLabel(o),
          programKey: item.key,
          programLabel: programLabel(item.key),
        }));

    const renderItem = (item: DueItem) => {
      const badge = STATUS_BADGE[item.status];
      const isOpen = expanded === item.key;
      const specs = normalizeOrders(item.program.orders);
      const canOrder = Boolean(onOrder || onOrderMany) && specs.length > 0;
      const due = fmtDate(item.dueDate);
      const last = fmtDate(item.lastCompleted);
      return (
        <li key={item.key} className="border-border border-b last:border-b-0">
          <div className="flex items-center gap-2 px-3 py-2">
            {canOrder && item.status !== 'satisfied' ? (
              <button
                type="button"
                onClick={() => toggleExpand(item)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Hide' : 'Show'} orders for ${programLabel(item.key)}`}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {isOpen ? (
                  <ChevronDownIcon size={14} />
                ) : (
                  <ChevronRightIcon size={14} />
                )}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <Badge variant={badge.variant} size="sm">
              {badge.label}
            </Badge>
            <span className="text-foreground min-w-0 flex-1 truncate text-sm">
              {programLabel(item.key)}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
              {item.program.kind ? KIND_LABEL[item.program.kind] : null}
              {item.status === 'satisfied' && last ? ` · done ${last}` : null}
              {item.status === 'satisfied' && due ? ` · next ${due}` : null}
              {item.status === 'overdue' && due ? ` · was due ${due}` : null}
              {item.status === 'pending'
                ? ` · ${item.pendingKeys.length} in flight`
                : null}
            </span>
            <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
              {item.key}
            </span>
          </div>
          {isOpen && (
            <div className="bg-muted/40 space-y-1.5 px-9 py-2">
              {specs.map((spec, si) => {
                const level = specLevel(spec, specs);
                const blocked = unmetAfter(spec);
                const isAlt = spec.keys.length > 1;
                return (
                  <div
                    key={si}
                    className={cn(level > 0 && 'border-border border-l-2')}
                    style={
                      level > 0 ? { marginLeft: (level - 1) * 16 + 2 } : undefined
                    }
                  >
                    {isAlt && (
                      <div className="text-muted-foreground pl-1 text-[11px] font-medium tracking-wide uppercase">
                        one of
                      </div>
                    )}
                    <div className={cn('space-y-1', level > 0 && 'pl-3')}>
                      {spec.keys.map((o) => (
                        <Checkbox
                          key={o}
                          size="sm"
                          label={orderLabel(o)}
                          description={
                            blocked.length > 0
                              ? `after ${blocked.map(orderLabel).join(', ')}`
                              : item.pendingKeys.includes(o)
                                ? 'already pending'
                                : undefined
                          }
                          disabled={blocked.length > 0}
                          checked={checked.has(o)}
                          onChange={(e) => {
                            const next = new Set(checked);
                            if (e.target.checked) {
                              // alternatives are mutually exclusive: checking
                              // one unchecks its siblings
                              for (const sib of spec.keys) next.delete(sib);
                              next.add(o);
                            } else {
                              next.delete(o);
                            }
                            setChecked(next);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={checked.size === 0}
                  onClick={() => {
                    const picks = picksFor(item);
                    if (picks.length === 1 && onOrder && !onOrderMany) {
                      onOrder(picks[0]);
                    } else if (onOrderMany) {
                      onOrderMany(picks);
                    } else if (onOrder) {
                      picks.forEach(onOrder);
                    }
                    setExpanded(null);
                  }}
                >
                  Add {checked.size} order{checked.size === 1 ? '' : 's'}
                </Button>
                <span className="text-muted-foreground text-xs">
                  linked to {programLabel(item.key)}
                </span>
              </div>
            </div>
          )}
        </li>
      );
    };

    return (
      <Card
        ref={ref}
        padding="none"
        className={cn('w-full', className)}
        data-testid={dataTestId}
        {...props}
      >
        <CardHeader className="flex flex-row items-center gap-2 px-4 py-3">
          <ClipboardListIcon size={16} className="text-muted-foreground" />
          <span className="text-foreground text-sm font-semibold">
            Health surveillance
          </span>
          <span className="text-muted-foreground text-xs">
            {actionable.length} actionable · {done.length} done
          </span>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {actionable.length > 0 && (
            <ul aria-label="Due surveillance items">
              {actionable.map(renderItem)}
            </ul>
          )}
          {actionable.length === 0 && (
            <div className="text-muted-foreground px-4 py-3 text-sm">
              Nothing due — all surveillance requirements are satisfied.
            </div>
          )}
          {done.length > 0 && (
            <>
              <div className="border-border bg-muted/50 text-muted-foreground border-y px-3 py-1 text-xs font-medium">
                Done
              </div>
              <ul aria-label="Satisfied surveillance items">
                {done.map(renderItem)}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);

HealthSurveillance.displayName = 'HealthSurveillance';

export default HealthSurveillance;
