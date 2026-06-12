'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';

// =============================================================================
// Types
// =============================================================================

export type LiveOrderStatus =
  | 'order_sent'
  | 'order_accepted'
  | 'order_in_progress'
  | 'order_results_ready'
  | 'order_completed'
  | 'order_refused';

export interface LiveOrderItem {
  /** Unique order id (used for React key + click callback). */
  id: string;
  /** Short display identifier, e.g. order number. */
  orderNumber?: string;
  /** Current status. */
  status: LiveOrderStatus;
  /** Subject employee name. */
  employeeName?: string;
  /** Service summary (first service or comma-separated list). */
  serviceSummary?: string;
  /** Provider name, displayed secondary. */
  providerName?: string;
  /** ISO timestamp or Date of the last update (drives "elapsed" rendering). */
  updatedAt?: string | Date;
  /** If true, render a pulse indicator to call out recent updates. */
  isFresh?: boolean;
}

export interface LiveOrderTrackerProps {
  /** All orders to render; they will be grouped by status. */
  orders: LiveOrderItem[];
  /** Click handler per order. */
  onOrderClick?: (order: LiveOrderItem) => void;
  /** Loading state — renders skeleton columns. */
  loading?: boolean;
  /** Override the status columns shown (defaults to the standard 5). */
  columns?: LiveOrderStatus[];
  /** Empty state node rendered when there are zero orders and not loading. */
  emptyState?: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

// =============================================================================
// Static configuration
// =============================================================================

const DEFAULT_COLUMNS: LiveOrderStatus[] = [
  'order_sent',
  'order_accepted',
  'order_in_progress',
  'order_results_ready',
  'order_completed',
];

const STATUS_META: Record<
  LiveOrderStatus,
  {
    label: string;
    dot: string;
    tint: string;
    badge:
      | 'default'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'danger'
      | 'outline';
  }
> = {
  order_sent: {
    label: 'Sent',
    dot: 'bg-sky-500',
    tint: 'bg-sky-50 dark:bg-sky-950/40',
    badge: 'secondary',
  },
  order_accepted: {
    label: 'Accepted',
    dot: 'bg-violet-500',
    tint: 'bg-violet-50 dark:bg-violet-950/40',
    badge: 'default',
  },
  order_in_progress: {
    label: 'In Progress',
    dot: 'bg-amber-500',
    tint: 'bg-amber-50 dark:bg-amber-950/40',
    badge: 'warning',
  },
  order_results_ready: {
    label: 'Results Ready',
    dot: 'bg-green-500',
    tint: 'bg-green-50 dark:bg-green-950/40',
    badge: 'success',
  },
  order_completed: {
    label: 'Completed',
    dot: 'bg-neutral-400',
    tint: 'bg-neutral-50 dark:bg-neutral-900',
    badge: 'outline',
  },
  order_refused: {
    label: 'Refused',
    dot: 'bg-red-500',
    tint: 'bg-red-50 dark:bg-red-950/40',
    badge: 'danger',
  },
};

// =============================================================================
// Helpers
// =============================================================================

function relativeTime(input?: string | Date): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs)) return '';
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

function initialsOf(name?: string): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '—';
}

// =============================================================================
// Subcomponents
// =============================================================================

function OrderCardItem({
  order,
  onClick,
}: {
  order: LiveOrderItem;
  onClick?: (order: LiveOrderItem) => void;
}) {
  const meta = STATUS_META[order.status];
  const interactive = Boolean(onClick);

  const handleClick = () => {
    if (onClick) onClick(order);
  };
  const handleKey: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKey : undefined}
      aria-label={
        order.employeeName
          ? `Order ${order.orderNumber ?? order.id.slice(-6)} for ${order.employeeName}, ${meta.label}`
          : `Order ${order.orderNumber ?? order.id.slice(-6)}, ${meta.label}`
      }
      className={cn(
        'w-full max-w-full border p-3 transition-all',
        interactive &&
          'cursor-pointer hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
      )}
      padding="none"
    >
      <div className="flex min-w-0 items-start gap-3">
        {/* Employee avatar (initials) — doubles as a visual anchor on mobile */}
        <span
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
            meta.dot
          )}
        >
          {initialsOf(order.employeeName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {order.employeeName ??
                order.orderNumber ??
                `#${order.id.slice(-6)}`}
            </p>
            {order.isFresh && (
              <span
                className="relative mt-1 flex h-2 w-2 flex-shrink-0"
                title="Recently updated"
                aria-label="Recently updated"
              >
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                    meta.dot
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex h-2 w-2 rounded-full',
                    meta.dot
                  )}
                />
              </span>
            )}
          </div>
          {/* Order number (secondary when we have a name) */}
          {order.employeeName && (order.orderNumber || order.id) && (
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {order.orderNumber ?? `#${order.id.slice(-6)}`}
            </p>
          )}
          {order.serviceSummary && (
            <p className="text-foreground/80 mt-1 line-clamp-2 text-xs">
              {order.serviceSummary}
            </p>
          )}
          <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
            {order.providerName && (
              <span className="min-w-0 flex-1 truncate">
                {order.providerName}
              </span>
            )}
            {order.updatedAt && (
              <span className="ml-auto flex-shrink-0 whitespace-nowrap">
                {relativeTime(order.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Column({
  status,
  orders,
  onOrderClick,
}: {
  status: LiveOrderStatus;
  orders: LiveOrderItem[];
  onOrderClick?: (order: LiveOrderItem) => void;
}) {
  const meta = STATUS_META[status];
  const isEmpty = orders.length === 0;
  return (
    <div
      className={cn(
        // On mobile we stack vertically and let empty columns collapse to a
        // single row; on lg+ we render the classic Kanban column.
        // `min-w-0` is critical on the grid item so long unbreakable content
        // inside a card doesn't blow out the grid track and push cards past
        // the column boundary. `overflow-hidden` keeps any stray child inside
        // the rounded container.
        'flex min-w-0 flex-col overflow-hidden rounded-xl border border-border p-3 lg:flex-1',
        meta.tint,
        // Empty columns keep a slim footprint on small screens so the user
        // isn't scrolling through 5 "No orders" blocks on a phone.
        isEmpty && 'lg:p-3'
      )}
      aria-label={`${meta.label}: ${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          !isEmpty && 'mb-3',
          isEmpty && 'lg:mb-3'
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn('h-2 w-2 flex-shrink-0 rounded-full', meta.dot)}
            aria-hidden="true"
          />
          <h3 className="truncate text-sm font-semibold text-foreground">
            {meta.label}
          </h3>
          {/* Inline count on mobile next to the label so the badge on the
              right can be hidden for empty columns. */}
          {isEmpty && (
            <span className="text-xs text-muted-foreground lg:hidden">
              — no orders
            </span>
          )}
        </div>
        <Badge
          variant={meta.badge}
          size="sm"
          className={cn('flex-shrink-0', isEmpty && 'hidden lg:inline-flex')}
        >
          {orders.length}
        </Badge>
      </div>
      {!isEmpty && (
        <div className="flex min-w-0 flex-col gap-2">
          {orders.map((o) => (
            <OrderCardItem key={o.id} order={o} onClick={onOrderClick} />
          ))}
        </div>
      )}
      {isEmpty && (
        <p className="hidden py-4 text-center text-xs text-muted-foreground lg:block">
          No orders
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * LiveOrderTracker — Kanban-style order board grouped by status. Pairs with
 * a Meteor publication to give operators a real-time view of order progress.
 */
export function LiveOrderTracker({
  orders,
  onOrderClick,
  loading = false,
  columns = DEFAULT_COLUMNS,
  emptyState,
  className,
}: LiveOrderTrackerProps): React.JSX.Element {
  const grouped = React.useMemo(() => {
    const map: Record<string, LiveOrderItem[]> = {};
    for (const col of columns) map[col] = [];
    for (const o of orders) {
      if (map[o.status]) map[o.status].push(o);
    }
    // sort each column by updatedAt desc
    for (const col of columns) {
      map[col].sort((a, b) => {
        const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bt - at;
      });
    }
    return map;
  }, [orders, columns]);

  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
          className
        )}
      >
        {columns.map((c) => (
          <div
            key={c}
            className="bg-muted/40 h-40 animate-pulse rounded-xl border border-border"
          />
        ))}
      </div>
    );
  }

  if (!orders.length && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      className={cn(
        // Mobile-first: stack columns vertically so there is no horizontal
        // scrolling on phones/tablets. On lg+ switch to a 2-up layout and
        // graduate to the full 5-column Kanban at xl so narrower desktops
        // (laptops + sidebars) don't overflow their container.
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        className
      )}
    >
      {columns.map((status) => (
        <Column
          key={status}
          status={status}
          orders={grouped[status] ?? []}
          onOrderClick={onOrderClick}
        />
      ))}
    </div>
  );
}
