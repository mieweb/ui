'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  DEFAULT_DRAG_REORDER_LABELS,
  useDragReorder,
  type DragReorderLabels,
} from '../../hooks/useDragReorder';
import {
  localStorageOrderAdapter,
  useOrderPersistence,
  type OrderPersistenceAdapter,
} from '../../hooks/useOrderPersistence';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon } from '../Icons';

export interface ReorderableListLabels extends DragReorderLabels {
  /** Hover title on the drag handle. */
  handle: string;
}

export const DEFAULT_REORDERABLE_LIST_LABELS: ReorderableListLabels = {
  ...DEFAULT_DRAG_REORDER_LABELS,
  handle: 'Drag to reorder',
};

export type ReorderableListSlot =
  | 'list'
  | 'item'
  | 'handle'
  | 'moveButtons'
  | 'announcement';

/** What `renderItem` gets for each row, ready to place where the row wants. */
export interface ReorderableListItemParts {
  /** The grip; `null` while reordering is off. */
  handle: React.ReactNode;
  /** Up and down buttons when `showMoveButtons` is on, else `null`. */
  moveButtons: React.ReactNode;
  /** Position in `items`, from 0. */
  index: number;
  /** Whether this row is the one being dragged. */
  dragging: boolean;
}

export interface ReorderableListProps<T> extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'children'
> {
  /** The rows, in their current order. The list never keeps an order of its own. */
  items: T[];
  /** A stable id for each row. */
  getId: (item: T) => string;
  /** A row's content. Place `parts.handle` and `parts.moveButtons` where they belong. */
  renderItem: (item: T, parts: ReorderableListItemParts) => React.ReactNode;
  /**
   * Save the order in this browser (localStorage) under this key and restore
   * it on the next visit. Read once on mount. Ids added later go to the end;
   * ids that disappear drop out. Turns reordering on by itself. If the key can
   * change (another list or user), also pass it as the React `key`
   * (`key={storageKey}`), or the old order may be saved under the new key.
   */
  storageKey?: string;
  /**
   * Called with the full new id order. Without `storageKey`, pass `items` back
   * in that order (you own the order); leaving both out turns reordering off.
   */
  onReorder?: (ids: string[]) => void;
  /** Allow or refuse a drop or move, e.g. to keep rows within their group. */
  canDropOn?: (draggedId: string, targetId: string) => boolean;
  /**
   * Whether a row can be picked up. A row that can't (a section header, a
   * divider) stays in place for other rows to move past: it has no grip,
   * focus or move buttons. All rows can by default.
   */
  canDrag?: (item: T) => boolean;
  /** Only the grip starts a drag, so buttons, links and text inside a row keep working. */
  handle?: boolean;
  /** Render up and down buttons for each row (`parts.moveButtons`). */
  showMoveButtons?: boolean;
  /** Alt+↑ / Alt+↓ on a focused row. On by default. */
  keyboard?: boolean;
  /** The list element; rows are `li` in a `ul` or `ol`, `div` in a `div`. */
  as?: 'ul' | 'ol' | 'div';
  /** Every user-facing string, for translation. */
  labels?: Partial<ReorderableListLabels>;
  /** Extra classes, keyed by the `data-slot` each part carries. */
  classNames?: Partial<Record<ReorderableListSlot, string>>;
}

// Pointer drops are visible, and keyboard and button moves announce through
// useDragReorder, so dnd-kit's own (English, id-based) announcements stay quiet.
const silent: Announcements = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

// Without storageKey nothing is loaded or saved; the caller owns the order.
const noStorage: OrderPersistenceAdapter = {
  load: () => null,
  save: () => undefined,
};

interface RowProps {
  id: string;
  tag: 'li' | 'div';
  /** Reordering is on for the list. */
  enabled: boolean;
  /** This row can be picked up and moved. */
  draggable: boolean;
  handle: boolean;
  /** Set while another row is dragged and this one may not take it. */
  locked: boolean;
  animate: boolean;
  keyboard: boolean;
  onMove: (id: string, delta: number) => void;
  handleTitle: string;
  classNames?: Partial<Record<ReorderableListSlot, string>>;
  children: (grip: React.ReactNode, dragging: boolean) => React.ReactNode;
}

function Row({
  id,
  tag: Tag,
  enabled,
  draggable,
  handle,
  locked,
  animate,
  keyboard,
  onMove,
  handleTitle,
  classNames,
  children,
}: RowProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: { draggable: !draggable, droppable: !enabled || locked },
    transition: animate ? undefined : null,
  });

  const grip = draggable ? (
    <span
      ref={handle ? setActivatorNodeRef : undefined}
      {...(handle ? listeners : {})}
      data-slot="reorderable-list-handle"
      title={handleTitle}
      className={cn(
        'text-muted-foreground inline-flex shrink-0 cursor-grab items-center active:cursor-grabbing',
        // Only a drag-only grip blocks panning; as part of a whole row, a swipe
        // that starts on it still scrolls the page.
        handle && 'touch-none',
        classNames?.handle
      )}
    >
      <GripVerticalIcon aria-hidden className="h-4 w-4" />
    </span>
  ) : null;

  const keyProps: React.HTMLAttributes<HTMLElement> =
    draggable && keyboard
      ? {
          tabIndex: 0,
          'aria-keyshortcuts': 'Alt+ArrowUp Alt+ArrowDown',
          onKeyDown: (e) => {
            if (e.target !== e.currentTarget || !e.altKey) return;
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            onMove(id, e.key === 'ArrowUp' ? -1 : 1);
          },
        }
      : {};

  return (
    <Tag
      ref={setNodeRef}
      data-slot="reorderable-list-item"
      data-dragging={isDragging || undefined}
      {...(draggable && !handle ? listeners : {})}
      {...keyProps}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative',
        draggable && !handle && 'cursor-grab touch-manipulation select-none',
        draggable &&
          keyboard &&
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        isDragging && 'bg-background z-10 opacity-80 shadow-lg',
        classNames?.item
      )}
    >
      {children(grip, isDragging)}
    </Tag>
  );
}

function ReorderableListInner<T>(
  {
    items,
    getId,
    renderItem,
    storageKey,
    onReorder,
    canDropOn,
    canDrag,
    handle = false,
    showMoveButtons = false,
    keyboard = true,
    as: ListTag = 'ul',
    labels: labelsProp,
    classNames,
    className,
    ...rest
  }: ReorderableListProps<T>,
  ref: React.ForwardedRef<HTMLElement>
) {
  const labels = { ...DEFAULT_REORDERABLE_LIST_LABELS, ...labelsProp };
  const itemIds = React.useMemo(() => items.map(getId), [items, getId]);
  // With storageKey the list keeps the saved order; without it, `items` is the order.
  const adapter = React.useMemo(
    () => (storageKey ? localStorageOrderAdapter(storageKey) : noStorage),
    [storageKey]
  );
  const saved = useOrderPersistence(itemIds, adapter);
  const ids = storageKey ? saved.order : itemIds;
  const rows = React.useMemo(() => {
    if (!storageKey) return items;
    const byId = new Map(items.map((item) => [getId(item), item]));
    return ids.map((id) => byId.get(id) as T);
  }, [storageKey, items, ids, getId]);
  const commit =
    storageKey || onReorder
      ? (next: string[]) => {
          if (storageKey) saved.setOrder(next);
          onReorder?.(next);
        }
      : undefined;
  // Keyboard and button moves, and their announcements.
  const moves = useDragReorder({ ids, onReorder: commit, canDropOn, labels });
  const animate = !usePrefersReducedMotion();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    // A short move before a drag starts, so clicks inside a row still click.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // On touch, the grip drags at once; a whole row needs a press-and-hold so the page still scrolls.
    useSensor(TouchSensor, {
      activationConstraint: handle
        ? { distance: 5 }
        : { delay: 250, tolerance: 5 },
    })
  );
  const ItemTag = ListTag === 'div' ? 'div' : 'li';

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    // Like keyboard and button moves, a drop may not cross a row canDropOn
    // refuses — not just land on one.
    if (canDropOn) {
      const dragged = String(active.id);
      const [lo, hi] = from < to ? [from + 1, to] : [to, from - 1];
      for (let i = lo; i <= hi; i++) {
        if (!canDropOn(dragged, ids[i])) return;
      }
    }
    // Through moveBy, so a pointer drop is announced like a keyboard move.
    moves.moveBy(String(active.id), to - from);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements: silent }}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ListTag
          ref={ref as React.Ref<never>}
          data-slot="reorderable-list"
          className={cn(className, classNames?.list)}
          {...rest}
        >
          {rows.map((item, index) => {
            const id = ids[index];
            const draggable = moves.enabled && (canDrag?.(item) ?? true);
            return (
              <Row
                key={id}
                id={id}
                tag={ItemTag}
                enabled={moves.enabled}
                draggable={draggable}
                handle={handle}
                locked={Boolean(
                  activeId &&
                  activeId !== id &&
                  canDropOn &&
                  !canDropOn(activeId, id)
                )}
                animate={animate}
                keyboard={keyboard}
                onMove={moves.moveBy}
                handleTitle={labels.handle}
                classNames={classNames}
              >
                {(grip, dragging) =>
                  renderItem(item, {
                    handle: grip,
                    moveButtons:
                      draggable && showMoveButtons ? (
                        <ButtonGroup
                          data-slot="reorderable-list-move-buttons"
                          orientation="horizontal"
                          className={classNames?.moveButtons}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            {...moves.moveButtonProps(id, 'up')}
                          >
                            <ChevronUpIcon aria-hidden className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            {...moves.moveButtonProps(id, 'down')}
                          >
                            <ChevronDownIcon aria-hidden className="h-4 w-4" />
                          </Button>
                        </ButtonGroup>
                      ) : null,
                    index,
                    dragging,
                  })
                }
              </Row>
            );
          })}
        </ListTag>
      </SortableContext>
      <div
        data-slot="reorderable-list-announcement"
        aria-live="polite"
        className={cn('sr-only', classNames?.announcement)}
      >
        {moves.announcement}
      </div>
    </DndContext>
  );
}

/**
 * A list the user can put in order: drag a row (other rows slide aside), use
 * Alt+↑/↓ on a focused row, or press its move buttons. Dragging uses
 * `@dnd-kit/sortable`; keyboard and button moves use `useDragReorder`. Give it
 * a `storageKey` to keep the order in this browser, or own the order yourself
 * through `onReorder` (e.g. to save it on a server).
 */
export const ReorderableList = React.forwardRef(ReorderableListInner) as <T>(
  props: ReorderableListProps<T> & React.RefAttributes<HTMLElement>
) => React.ReactElement;

(ReorderableList as React.NamedExoticComponent).displayName = 'ReorderableList';
