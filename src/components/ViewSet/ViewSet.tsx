'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { ViewSwitcher, type ViewOption } from '../ViewSwitcher';
import { ListView, type ListViewProps } from '../ListView';
import { BoardView, type BoardViewProps } from '../BoardView';
import { CalendarView, type CalendarViewProps } from '../CalendarView';
import { GanttView, type GanttViewProps } from '../GanttView';
import type { Stage, ViewBaseProps, ViewId } from '../../views/types';

// =============================================================================
// Types
// =============================================================================

export interface ViewSetProps<T> extends ViewBaseProps<T> {
  /** Views to offer, in order. The first is the default when uncontrolled. */
  views: readonly (ViewId | ViewOption)[];
  view?: ViewId;
  defaultView?: ViewId;
  onViewChange?: (view: ViewId) => void;
  /**
   * Remembers the chosen view under this key. Ignored when `view` is
   * controlled — a page with its own URL state should own it there instead.
   */
  storageKey?: string;
  /** Stages for the board and for list grouping. */
  stages?: readonly Stage[];
  onMove?: BoardViewProps<T>['onMove'];
  /**
   * IANA zone the date views read day boundaries in. Shared, because a page
   * showing one collection as a calendar and as a Gantt must place it on the
   * same days in both.
   */
  timeZone?: string;
  /** Locale for date formatting in the calendar and Gantt. */
  locale?: string;

  /** Rendered above the switcher row. */
  toolbar?: React.ReactNode;
  /** Rendered under the switcher row, above the view. */
  filters?: React.ReactNode;
  /** The `overview` view. Domain content — the library has no opinion on it. */
  overview?: React.ReactNode;
  /** The `table` view. A tabular collection is a grid, not a view component. */
  table?: React.ReactNode;
  /** Rendered beside the view, for a list-plus-detail layout. */
  detail?: React.ReactNode;

  /**
   * Per-view escape hatches for props this shell does not surface. Shared props
   * are excluded: one collection rendered several ways means switching view can
   * never change the records, the selection or the load state.
   */
  listProps?: Omit<Partial<ListViewProps<T>>, keyof ViewBaseProps<T>>;
  boardProps?: Omit<Partial<BoardViewProps<T>>, keyof ViewBaseProps<T>>;
  calendarProps?: Omit<Partial<CalendarViewProps<T>>, keyof ViewBaseProps<T>>;
  ganttProps?: Omit<Partial<GanttViewProps<T>>, keyof ViewBaseProps<T>>;

  classNames?: Partial<
    Record<'toolbar' | 'switcher' | 'body' | 'detail', string>
  >;
}

const FIRST_ID = (views: ViewSetProps<unknown>['views']) => {
  const first = views[0];
  return (typeof first === 'string' ? first : first?.id) ?? 'list';
};

// =============================================================================
// Component
// =============================================================================

/**
 * The page-level composition: switcher, the enabled views, and the slots a page
 * needs around them. It owns which view is showing and nothing else — items,
 * selection and every mutation stay with the caller.
 */
export function ViewSet<T>({
  views,
  view,
  defaultView,
  onViewChange,
  storageKey,
  stages,
  onMove,
  toolbar,
  filters,
  overview,
  table,
  detail,
  listProps,
  boardProps,
  calendarProps,
  ganttProps,
  className,
  classNames,
  ...shared
}: ViewSetProps<T>) {
  const [internalView, setInternalView] = React.useState<ViewId>(
    () => defaultView ?? FIRST_ID(views)
  );

  // `overview` and `table` are the caller's content. Offering either without
  // its slot would put a dead option in the switcher that renders a blank page.
  const offered = React.useMemo(
    () =>
      views.filter((v) => {
        const id = typeof v === 'string' ? v : v.id;
        if (id === 'overview') return overview != null;
        if (id === 'table') return table != null;
        return true;
      }),
    [views, overview, table]
  );

  // Read storage after mount: a server render and the first client render must
  // agree, and localStorage is not available to the former.
  React.useEffect(() => {
    if (!storageKey || view) return;
    const stored = globalThis.localStorage?.getItem(
      storageKey
    ) as ViewId | null;
    if (
      stored &&
      offered.some((v) => (typeof v === 'string' ? v : v.id) === stored)
    )
      setInternalView(stored);
  }, [storageKey, view, offered]);

  const requested = view ?? internalView;
  const active = offered.some(
    (v) => (typeof v === 'string' ? v : v.id) === requested
  )
    ? requested
    : FIRST_ID(offered);

  const changeView = (next: ViewId) => {
    if (!view) setInternalView(next);
    if (storageKey && !view) globalThis.localStorage?.setItem(storageKey, next);
    onViewChange?.(next);
  };

  const body = (() => {
    switch (active) {
      case 'overview':
        return overview ?? null;
      case 'table':
        return table ?? null;
      case 'board':
        return (
          <BoardView
            {...shared}
            stages={stages ?? []}
            onMove={onMove}
            {...boardProps}
          />
        );
      case 'calendar':
        return <CalendarView {...shared} {...calendarProps} />;
      case 'gantt':
        return <GanttView {...shared} {...ganttProps} />;
      case 'roadmap':
        // A roadmap is the Gantt at a coarse cadence; see Views.mdx.
        return (
          <GanttView
            {...shared}
            cadence="quarter"
            groupByLane
            {...ganttProps}
          />
        );
      case 'list':
      default:
        return <ListView {...shared} stages={stages} {...listProps} />;
    }
  })();

  return (
    <div data-slot="view-set" className={cn('flex flex-col gap-3', className)}>
      <div
        data-slot="view-set-toolbar"
        className={cn('flex flex-wrap items-center gap-2', classNames?.toolbar)}
      >
        {toolbar}
        <div className={cn('ms-auto', classNames?.switcher)}>
          <ViewSwitcher
            views={offered}
            value={active}
            onValueChange={changeView}
          />
        </div>
      </div>
      {filters}
      <div
        data-slot="view-set-body"
        className={cn(
          // Plain column spans rather than an arbitrary grid template, so a
          // Tailwind 3 consumer needs no extra safelist entry.
          detail && 'gap-3 lg:grid lg:grid-cols-3',
          classNames?.body
        )}
      >
        <div className={cn('min-w-0', detail && 'lg:col-span-2')}>{body}</div>
        {detail && (
          <aside
            data-slot="view-set-detail"
            className={cn('min-w-0', classNames?.detail)}
          >
            {detail}
          </aside>
        )}
      </div>
    </div>
  );
}
