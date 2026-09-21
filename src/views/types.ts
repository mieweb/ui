/**
 * The contract every component in the `Modules/Views` family reads through.
 *
 * A page describes its collection once — which field is the id, the title, the
 * status, the start date — and every view understands it. That is the whole
 * reason the family exists: without it each view needs its own adapter and you
 * end up re-implementing the same board per entity.
 *
 * Views are headless. Nothing here fetches, subscribes, or navigates.
 * See CONTRIBUTING → "Modules: headless data components".
 */
import type * as React from 'react';

/**
 * Which layout is on screen. `overview` and `table` are rendered by the host
 * through `ViewSet` slots rather than by a component in this family — a tabular
 * collection is `DataVisNitroGrid`, and an overview is domain content.
 */
export type ViewId =
  | 'overview'
  | 'list'
  | 'board'
  | 'calendar'
  | 'gantt'
  | 'roadmap'
  | 'table';

/**
 * A semantic colour name, resolved to `--mieweb-*` tokens by each view.
 *
 * Accessors return one of these rather than a class string so a caller cannot
 * hardcode a palette that breaks under another brand or in dark mode.
 */
export type Accent =
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'neutral';

/** A named stage: a board column, and the segments of a stage bar. */
export interface Stage {
  id: string;
  label: string;
  accent?: Accent;
}

/**
 * How a view reads one item. Only `getId` and `getTitle` are always required;
 * each view documents which of the rest it needs (a board needs `getStatus`, a
 * Gantt needs `getStart`) and renders an explanatory empty state without them.
 */
export interface ViewAccessors<T> {
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  /** Secondary line under the title. */
  getSubtitle?: (item: T) => string | undefined;
  /** Board column and list group; matched against `Stage['id']`. */
  getStatus?: (item: T) => string;
  /** Gantt bar start, calendar placement. */
  getStart?: (item: T) => Date | string | null | undefined;
  /** Gantt bar end, calendar span. Falls back to the start when absent. */
  getEnd?: (item: T) => Date | string | null | undefined;
  /** Swimlane in a roadmap, row group in a Gantt. */
  getGroup?: (item: T) => string | undefined;
  getAccent?: (item: T) => Accent;
}

/** Strings a view renders. Every one is overridable; the defaults are English. */
export interface ViewLabels {
  /** Accessible name of the view switcher group. */
  viewSwitcher: string;
  loading: string;
  empty: string;
  error: string;
  /** Action on the error state. */
  retry: string;
}

export const defaultViewLabels: ViewLabels = {
  viewSwitcher: 'View',
  loading: 'Loading',
  empty: 'Nothing to show',
  error: 'Could not load this view',
  retry: 'Try again',
};

/**
 * Props every view accepts. Views are controlled: selection, the active view and
 * filter state live in the page, and every change is handed back.
 */
export interface ViewBaseProps<T> {
  items: T[];
  accessors: ViewAccessors<T>;
  loading?: boolean;
  error?: Error | null;
  selectedId?: string | null;
  /** Called when the user activates an item. */
  onOpen?: (id: string, item: T) => void;
  /** Return a URL to render each item as a real anchor — middle-clickable and crawlable. */
  getHref?: (id: string, item: T) => string;
  /** Render one item. Receives the active view so one function can serve several. */
  renderItem?: (item: T, context: { view: ViewId }) => React.ReactNode;
  /** Replaces the built-in empty state. */
  emptyState?: React.ReactNode;
  labels?: Partial<ViewLabels>;
  /** Pins "today" so stories, tests and visual snapshots stay deterministic. */
  now?: Date;
  className?: string;
}

/** Normalises the several shapes an accessor may return into a `Date`. */
export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Tailwind classes per accent, so every view tints the same way. */
export const accentClasses: Record<
  Accent,
  { text: string; bg: string; border: string }
> = {
  primary: {
    text: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/40',
  },
  success: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/40',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/40',
  },
  destructive: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/40',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/40',
  },
  neutral: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
  },
};
