'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Columns2, Columns3, Square } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

/** A dashboard item: a stable id plus the rendered content. */
export interface PortletItem {
  id: string;
  node: React.ReactNode;
}

/** Number of visible columns. */
export type DashboardLayout = 1 | 2 | 3;

/** Portlet items grouped into three logical columns. */
export type DashboardColumns = [PortletItem[], PortletItem[], PortletItem[]];

/** Portlet ids grouped into three logical columns. */
export type DashboardOrder = [string[], string[], string[]];

export interface CustomizableDashboardProps {
  /**
   * Portlets grouped into three columns. This is the default arrangement;
   * user reordering (persisted or controlled) takes precedence. Items later
   * removed from props disappear from saved layouts automatically, and new
   * items appear in their props column.
   */
  columns: DashboardColumns;
  /** Toolbar heading rendered before the layout toggle. */
  title?: string;
  /**
   * Base localStorage key used to persist column order and layout mode
   * (`{storageKey}-portlet-order` / `{storageKey}-dashboard-layout`).
   * Omit to disable built-in persistence (e.g. when using `order` /
   * `onOrderChange` with a server-side store). Distinct dashboards must
   * pass distinct keys.
   */
  storageKey?: string;
  /** Accessible label for the dashboard grid region. */
  ariaLabel?: string;
  /**
   * Optional DOM element to portal the toolbar (title + layout toggle)
   * into, e.g. a page header actions row. When omitted, the toolbar
   * renders inline above the grid.
   */
  toolbarSlot?: HTMLElement | null;
  /** Initial column order for uncontrolled usage with external persistence. */
  defaultOrder?: DashboardOrder;
  /** Controlled column order. Changes are reported via `onOrderChange`. */
  order?: DashboardOrder;
  /** Called with the full new order after a drop or layout normalization. */
  onOrderChange?: (order: DashboardOrder) => void;
  /** Initial layout mode for uncontrolled usage (default 3). */
  defaultLayout?: DashboardLayout;
  /** Controlled layout mode. Changes are reported via `onLayoutChange`. */
  layout?: DashboardLayout;
  /** Called when the user changes the column layout (or it auto-shrinks). */
  onLayoutChange?: (layout: DashboardLayout) => void;
  /**
   * CSS selector for the header element inside each portlet that receives
   * the drag handle. Defaults to the `DashboardWidget` header slot. When no
   * header matches, the handle floats over the portlet's top end corner.
   */
  dragHandleSelector?: string;
  /** Additional class name for the grid element. */
  className?: string;
}

// =============================================================================
// Internals
// =============================================================================

const COL_IDS = ['column-0', 'column-1', 'column-2'] as const;

const DEFAULT_HANDLE_SELECTOR = '[data-slot="dashboard-widget-header"]';

// Applied to a discovered header so the appended handle lays out correctly:
// an auto start margin on the 2nd child pushes trailing controls (and the
// handle after them) to the end, even inside `justify-between` headers.
const HEADER_LAYOUT_CLASSES = [
  'flex',
  'flex-row',
  'flex-nowrap',
  'items-center',
  '[&>:nth-child(2)]:ms-auto',
];

function orderStorageKey(base: string): string {
  return `${base}-portlet-order`;
}

function layoutStorageKey(base: string): string {
  return `${base}-dashboard-layout`;
}

function loadLayout(base: string | undefined): DashboardLayout | null {
  if (!base) return null;
  try {
    const raw = localStorage.getItem(layoutStorageKey(base));
    const val = raw ? Number(raw) : null;
    return val === 1 || val === 2 || val === 3 ? val : null;
  } catch {
    return null;
  }
}

function saveLayout(base: string | undefined, mode: DashboardLayout) {
  if (!base) return;
  try {
    localStorage.setItem(layoutStorageKey(base), String(mode));
  } catch {
    /* storage unavailable */
  }
}

function loadOrder(base: string | undefined): DashboardOrder | null {
  if (!base) return null;
  try {
    const raw = localStorage.getItem(orderStorageKey(base));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<number, string[]>;
    return [parsed[0] ?? [], parsed[1] ?? [], parsed[2] ?? []];
  } catch {
    return null;
  }
}

function saveOrder(base: string | undefined, order: DashboardOrder) {
  if (!base) return;
  try {
    const record: Record<number, string[]> = {};
    order.forEach((ids, i) => {
      record[i] = ids;
    });
    localStorage.setItem(orderStorageKey(base), JSON.stringify(record));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Merge a saved/provided order with the current props columns: saved
 * positions win, unknown saved ids are dropped, and new items are appended
 * to their original props column.
 */
export function mergeColumnOrder(
  columns: DashboardColumns,
  saved: DashboardOrder | null
): DashboardOrder {
  const allIds = new Set(
    [...columns[0], ...columns[1], ...columns[2]].map((p) => p.id)
  );
  const result: DashboardOrder = [[], [], []];
  const placed = new Set<string>();

  for (let i = 0; i < 3; i++) {
    for (const id of saved?.[i] ?? []) {
      if (allIds.has(id) && !placed.has(id)) {
        result[i].push(id);
        placed.add(id);
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    for (const item of columns[i]) {
      if (!placed.has(item.id)) {
        result[i].push(item.id);
        placed.add(item.id);
      }
    }
  }
  return result;
}

function buildItemMap(columns: DashboardColumns): Map<string, PortletItem> {
  const map = new Map<string, PortletItem>();
  for (const col of columns) {
    for (const item of col) map.set(item.id, item);
  }
  return map;
}

function findColumn(colOrder: string[][], itemId: string): number {
  return colOrder.findIndex((ids) => ids.includes(itemId));
}

/**
 * pointerWithin first (drops into empty columns), then closestCenter for
 * items, then rectIntersection for columns.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pw = pointerWithin(args);
  if (pw.length > 0) return pw;
  const cc = closestCenter(args);
  if (cc.length > 0) return cc;
  return rectIntersection(args);
};

// =============================================================================
// SortablePortlet
// =============================================================================

function SortablePortlet({
  id,
  handleSelector,
  children,
}: {
  id: string;
  handleSelector: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [headerEl, setHeaderEl] = React.useState<HTMLElement | null>(null);
  const [searched, setSearched] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Portlet content can render asynchronously, so watch for the header with
  // a MutationObserver (rAF-coalesced) and disconnect once found.
  React.useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;

    let rafId = 0;

    const findHeader = () => {
      const header = container.querySelector(handleSelector);
      if (header instanceof HTMLElement) {
        header.classList.add(...HEADER_LAYOUT_CLASSES);
        setHeaderEl(header);
        observer.disconnect();
      } else {
        setHeaderEl(null);
      }
      setSearched(true);
    };

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(findHeader);
    });

    findHeader();
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [handleSelector]);

  const handle = (
    <button
      type="button"
      className={cn(
        'inline-flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded border-none bg-transparent',
        'text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing',
        'opacity-40 transition-opacity group-hover/portlet:opacity-100 focus-visible:opacity-100',
        '[@media(hover:none)]:opacity-100',
        !headerEl && 'bg-card/80 absolute end-2 top-2 z-10 shadow-sm'
      )}
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden="true" className="h-4 w-4" />
    </button>
  );

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        wrapperRef.current = node;
      }}
      style={style}
      className="group/portlet relative min-w-0"
    >
      <div className="w-full min-w-0">{children}</div>
      {headerEl ? createPortal(handle, headerEl) : searched ? handle : null}
    </div>
  );
}

// =============================================================================
// DroppableColumn
// =============================================================================

function DroppableColumn({
  id,
  items,
  columnIndex,
  handleSelector,
  flatten,
  dragActive,
}: {
  id: string;
  items: PortletItem[];
  columnIndex: number;
  handleSelector: string;
  flatten: boolean;
  dragActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const ids = items.map((p) => p.id);

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-16 min-w-0 flex-col gap-3',
          flatten && 'max-lg:contents'
        )}
        role="group"
        aria-label={`Dashboard column ${columnIndex + 1}`}
      >
        {items.map((item) => (
          <SortablePortlet
            key={item.id}
            id={item.id}
            handleSelector={handleSelector}
          >
            {item.node}
          </SortablePortlet>
        ))}
        {items.length === 0 && dragActive && (
          <div
            aria-hidden="true"
            className={cn(
              'border-border text-muted-foreground flex min-h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm font-medium transition-colors',
              isOver && 'border-primary-500 bg-primary-500/10 text-primary-600'
            )}
          >
            Drop here
          </div>
        )}
      </div>
    </SortableContext>
  );
}

// =============================================================================
// CustomizableDashboard
// =============================================================================

/**
 * A user-customizable portlet dashboard: a responsive 1–3 column grid whose
 * items can be dragged between and within columns, with a column-layout
 * toggle and optional persistence.
 *
 * Each portlet's drag handle is appended to the header element matched by
 * `dragHandleSelector` inside its content — `DashboardWidget` headers are
 * matched by default. Portlets without a matching header get a floating
 * handle in their top end corner.
 *
 * Order and layout are persisted to localStorage when `storageKey` is set,
 * or can be controlled via `order`/`onOrderChange` and
 * `layout`/`onLayoutChange` for server-side persistence.
 *
 * @example
 * ```tsx
 * <CustomizableDashboard
 *   storageKey="home"
 *   columns={[
 *     [{ id: 'stats', node: <StatsWidget /> }],
 *     [{ id: 'tasks', node: <TasksWidget /> }],
 *     [{ id: 'orders', node: <OrdersWidget /> }],
 *   ]}
 * />
 * ```
 */
export const CustomizableDashboard = React.forwardRef<
  HTMLDivElement,
  CustomizableDashboardProps
>(function CustomizableDashboard(
  {
    columns,
    title,
    storageKey,
    ariaLabel,
    toolbarSlot,
    defaultOrder,
    order: controlledOrder,
    onOrderChange,
    defaultLayout = 3,
    layout: controlledLayout,
    onLayoutChange,
    dragHandleSelector = DEFAULT_HANDLE_SELECTOR,
    className,
  },
  ref
) {
  const itemMap = React.useMemo(() => buildItemMap(columns), [columns]);

  const [internalLayout, setInternalLayout] = React.useState<DashboardLayout>(
    () => loadLayout(storageKey) ?? defaultLayout
  );
  const layoutMode = controlledLayout ?? internalLayout;

  const [colOrder, setColOrder] = React.useState<DashboardOrder>(() =>
    mergeColumnOrder(
      columns,
      controlledOrder ?? loadOrder(storageKey) ?? defaultOrder ?? null
    )
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const prevColOrder = React.useRef(colOrder);
  const layoutModeRef = React.useRef(layoutMode);
  layoutModeRef.current = layoutMode;
  const draggingRef = React.useRef(false);

  // Sync controlled order and newly added/removed items while not dragging.
  React.useEffect(() => {
    if (draggingRef.current) return;
    setColOrder((prev) => {
      const next = mergeColumnOrder(columns, controlledOrder ?? prev);
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [columns, controlledOrder]);

  const setLayout = React.useCallback(
    (mode: DashboardLayout) => {
      if (controlledLayout === undefined) setInternalLayout(mode);
      saveLayout(storageKey, mode);
      onLayoutChange?.(mode);
    },
    [controlledLayout, storageKey, onLayoutChange]
  );

  const commitOrder = React.useCallback(
    (next: DashboardOrder) => {
      saveOrder(storageKey, next);
      onOrderChange?.(next);

      // Auto-shrink layout when trailing columns become empty
      const occupied = Math.max(
        1,
        next.filter((ids) => ids.length > 0).length
      ) as DashboardLayout;
      if (occupied < layoutModeRef.current) {
        setLayout(occupied);
      }
    },
    [storageKey, onOrderChange, setLayout]
  );

  const handleLayoutChange = React.useCallback(
    (mode: DashboardLayout) => {
      setLayout(mode);
      // Consolidate trailing columns so droppable ids match visible columns.
      if (mode >= 3) return;
      setColOrder((prev) => {
        const next: DashboardOrder = [[], [], []];
        if (mode === 1) {
          next[0] = [...prev[0], ...prev[1], ...prev[2]];
        } else {
          next[0] = [...prev[0]];
          next[1] = [...prev[1], ...prev[2]];
        }
        saveOrder(storageKey, next);
        onOrderChange?.(next);
        return next;
      });
    },
    [setLayout, storageKey, onOrderChange]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resolve = (ids: string[]): PortletItem[] =>
    ids.map((id) => itemMap.get(id)).filter(Boolean) as PortletItem[];

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      prevColOrder.current = colOrder;
      draggingRef.current = true;
      setActiveId(String(event.active.id));
    },
    [colOrder]
  );

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);
    const colIdx = COL_IDS.indexOf(overId as (typeof COL_IDS)[number]);

    setColOrder((prev) => {
      const sourceCol = findColumn(prev, activeItemId);
      if (sourceCol === -1) return prev;

      let targetCol: number;
      if (colIdx !== -1) {
        targetCol = colIdx;
      } else {
        targetCol = findColumn(prev, overId);
        if (targetCol === -1) return prev;
      }

      // Same column — SortableContext handles in-column reordering
      if (sourceCol === targetCol) return prev;

      const next = prev.map((col) => [...col]) as DashboardOrder;
      next[sourceCol] = next[sourceCol].filter((id) => id !== activeItemId);
      if (colIdx !== -1) {
        next[targetCol].push(activeItemId);
      } else {
        const overIdx = next[targetCol].indexOf(overId);
        if (overIdx === -1) {
          next[targetCol].push(activeItemId);
        } else {
          next[targetCol].splice(overIdx, 0, activeItemId);
        }
      }
      return next;
    });
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      draggingRef.current = false;
      setActiveId(null);

      if (!over) {
        setColOrder(prevColOrder.current);
        return;
      }

      const activeItemId = String(active.id);
      const overId = String(over.id);

      setColOrder((prev) => {
        const next = prev.map((col) => [...col]) as DashboardOrder;
        const col = findColumn(next, activeItemId);
        if (col === -1) return prev;

        const isColumnTarget =
          COL_IDS.indexOf(overId as (typeof COL_IDS)[number]) !== -1;

        if (!isColumnTarget && overId !== activeItemId) {
          const overCol = findColumn(next, overId);
          if (overCol === col) {
            const oldIdx = next[col].indexOf(activeItemId);
            const newIdx = next[col].indexOf(overId);
            if (oldIdx !== -1 && newIdx !== -1) {
              next[col] = arrayMove(next[col], oldIdx, newIdx);
            }
          }
        }

        commitOrder(next);
        return next;
      });
    },
    [commitOrder]
  );

  const handleDragCancel = React.useCallback(() => {
    draggingRef.current = false;
    setActiveId(null);
    setColOrder(prevColOrder.current);
  }, []);

  const cols: DashboardColumns = [
    resolve(colOrder[0]),
    resolve(colOrder[1]),
    resolve(colOrder[2]),
  ];

  const visibleCols =
    layoutMode === 1 ? [cols[0]] : layoutMode === 2 ? [cols[0], cols[1]] : cols;

  const toolbar = (
    <div className="flex items-center justify-end gap-3 pb-2">
      {title && (
        <h2 className="text-foreground me-auto text-lg font-semibold">
          {title}
        </h2>
      )}
      <div
        className="border-border bg-muted flex gap-0.5 rounded-md border p-0.5 max-md:hidden"
        role="radiogroup"
        aria-label="Column layout"
      >
        {([3, 2, 1] as const).map((mode) => {
          const Icon = mode === 3 ? Columns3 : mode === 2 ? Columns2 : Square;
          return (
            <button
              key={mode}
              type="button"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded transition-colors',
                layoutMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              )}
              onClick={() => handleLayoutChange(mode)}
              role="radio"
              aria-checked={layoutMode === mode}
              aria-label={`${mode} column layout`}
              title={`${mode} column${mode > 1 ? 's' : ''}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {toolbarSlot ? createPortal(toolbar, toolbarSlot) : toolbar}
      <div
        ref={ref}
        className={cn(
          'grid items-start gap-3',
          layoutMode === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          layoutMode === 2 && 'grid-cols-1 md:grid-cols-2',
          layoutMode === 1 && 'grid-cols-1',
          className
        )}
        role="region"
        aria-label={ariaLabel ?? 'Dashboard'}
      >
        {visibleCols.map((col, i) => (
          <DroppableColumn
            key={COL_IDS[i]}
            id={COL_IDS[i]}
            items={col}
            columnIndex={i}
            handleSelector={dragHandleSelector}
            flatten={layoutMode === 3}
            dragActive={activeId !== null}
          />
        ))}
      </div>
    </DndContext>
  );
});
