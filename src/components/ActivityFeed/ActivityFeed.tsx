'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export type ActivityKind =
  | 'order_created'
  | 'order_accepted'
  | 'order_completed'
  | 'order_refused'
  | 'results_ready'
  | 'employee_added'
  | 'invoice_paid'
  | 'message'
  | 'system';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** Primary title (e.g. "Order accepted by Midwest Occ Health"). */
  title: string;
  /** Optional secondary description (e.g. employee name, service). */
  description?: string;
  /** Actor (e.g. user or system that generated the event). */
  actor?: string;
  /** When the event happened. */
  timestamp?: string | Date;
  /** Optional click handler to drill into the related entity. */
  onClick?: () => void;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  /** Loading state. */
  loading?: boolean;
  /** Empty state node. */
  emptyState?: React.ReactNode;
  /** Max items to show before scrolling. */
  maxItems?: number;
  /** Additional CSS classes. */
  className?: string;
}

// =============================================================================
// Icon + color per kind
// =============================================================================

function relativeTime(input?: string | Date): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return '';
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24);
  if (d2 < 30) return `${d2}d ago`;
  return d.toLocaleDateString();
}

const KIND_STYLE: Record<
  ActivityKind,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  order_created: {
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
      </svg>
    ),
  },
  order_accepted: {
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  order_completed: {
    color: 'text-neutral-700 dark:text-neutral-300',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  order_refused: {
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M4.7 4.7a1 1 0 011.4 0L10 8.6l3.9-3.9a1 1 0 111.4 1.4L11.4 10l3.9 3.9a1 1 0 01-1.4 1.4L10 11.4l-3.9 3.9a1 1 0 01-1.4-1.4L8.6 10 4.7 6.1a1 1 0 010-1.4z" />
      </svg>
    ),
  },
  results_ready: {
    color: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M9 2a1 1 0 012 0v2h4a1 1 0 110 2h-1v9a2 2 0 01-2 2H8a2 2 0 01-2-2V6H5a1 1 0 110-2h4V2z" />
      </svg>
    ),
  },
  employee_added: {
    color: 'text-primary-700 dark:text-primary-300',
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M10 9a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 1114 0H3z" />
      </svg>
    ),
  },
  invoice_paid: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.5.87L13 15.5l-1.5 1.4a1 1 0 01-1.4 0L8.5 15.5 7 16.87A1 1 0 015.5 16H4V4z" />
      </svg>
    ),
  },
  message: {
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M18 5.25A3.25 3.25 0 0014.75 2h-9.5A3.25 3.25 0 002 5.25v7.5A3.25 3.25 0 005.25 16H6v2.25a.75.75 0 001.22.58L11.7 16h3.05A3.25 3.25 0 0018 12.75v-7.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  system: {
    color: 'text-neutral-700 dark:text-neutral-300',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 01.9.55l1.6 3.24 3.58.52a1 1 0 01.55 1.7l-2.59 2.52.61 3.56a1 1 0 01-1.45 1.06L10 13.77l-3.2 1.68a1 1 0 01-1.45-1.06l.61-3.56L3.37 8.3a1 1 0 01.55-1.7l3.58-.52L9.1 2.55A1 1 0 0110 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * ActivityFeed — compact vertical event list. Intended for dashboards to
 * surface recent order/result/invoice/message activity.
 */
export function ActivityFeed({
  items,
  loading = false,
  emptyState,
  maxItems,
  className,
}: ActivityFeedProps): React.JSX.Element {
  const visible = maxItems ? items.slice(0, maxItems) : items;

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={className}>
        {emptyState ?? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        )}
      </div>
    );
  }

  return (
    <ol className={cn('relative space-y-3', className)}>
      {visible.map((item, idx) => {
        const style = KIND_STYLE[item.kind] ?? KIND_STYLE.system;
        const isLast = idx === visible.length - 1;
        const interactive = Boolean(item.onClick);
        return (
          <li key={item.id} className="relative flex gap-3">
            {/* Timeline rail */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                style.bg,
                style.color
              )}
              aria-hidden="true"
            >
              {style.icon}
            </span>
            <div
              className={cn(
                'min-w-0 flex-1 rounded-lg px-2 py-1',
                interactive &&
                  'hover:bg-muted/60 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
              )}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={item.onClick}
              onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  item.onClick?.();
                }
              }}
            >
              <p className="truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
              {item.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                {item.actor && <span className="truncate">{item.actor}</span>}
                {item.timestamp && (
                  <span className="ml-auto whitespace-nowrap">
                    {relativeTime(item.timestamp)}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
