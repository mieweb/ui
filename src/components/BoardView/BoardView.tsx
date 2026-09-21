'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';
import {
  accentClasses,
  defaultViewLabels,
  type Accent,
  type Stage,
  type ViewBaseProps,
  type ViewLabels,
} from '../../views/types';

// =============================================================================
// Types
// =============================================================================

export type BoardViewSlot =
  | 'column'
  | 'columnHeader'
  | 'card'
  | 'selectedCard'
  | 'state';

export interface BoardLabels extends ViewLabels {
  /** Announced when a card starts moving. `{item}` and `{stage}` are substituted. */
  moved: string;
  /** Announced when `onMove` rejects. */
  moveFailed: string;
  /** Hint on a focusable card describing the keyboard move. */
  moveHint: string;
}

export const defaultBoardLabels: BoardLabels = {
  ...defaultViewLabels,
  empty: 'Nothing in this stage',
  moved: '{item} moved to {stage}',
  moveFailed: 'Could not move {item}',
  moveHint: 'Press Control with the arrow keys to move between stages',
};

export interface BoardViewProps<T>
  extends ViewBaseProps<T>, VariantProps<typeof cardVariants> {
  /** Columns, in order. A board without stages has nothing to draw. */
  stages: readonly Stage[];
  /**
   * Commits a move. The board shows the card in its new column while this is
   * pending and puts it back if the promise rejects, so the caller never has to
   * re-render it home.
   */
  onMove?: (id: string, toStage: string, item: T) => void | Promise<void>;
  labels?: Partial<BoardLabels>;
  classNames?: Partial<Record<BoardViewSlot, string>>;
  /** Heading level for column headers, under the page's own heading. */
  headingLevel?: 'h2' | 'h3' | 'h4';
}

// =============================================================================
// Variants
// =============================================================================

const cardVariants = cva(
  [
    'w-full rounded-md border border-border bg-card p-2 text-start',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ],
  {
    variants: {
      density: {
        comfortable: 'p-3',
        compact: 'p-2',
      },
      interactive: { true: 'hover:border-primary-500/40', false: '' },
      selected: { true: 'ring-2 ring-primary-500/50', false: '' },
      pending: { true: 'opacity-60', false: '' },
    },
    defaultVariants: {
      density: 'comfortable',
      interactive: false,
      selected: false,
      pending: false,
    },
  }
);

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

// =============================================================================
// Card
// =============================================================================

interface CardProps {
  id: string;
  title: string;
  subtitle?: string;
  accent?: Accent;
  selected: boolean;
  pending: boolean;
  draggable: boolean;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
  onOpen?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

function BoardCard({
  id,
  title,
  subtitle,
  accent,
  selected,
  pending,
  draggable,
  hint,
  className,
  children,
  onOpen,
  onKeyDown,
}: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: !draggable,
  });

  return (
    <li>
      <div
        ref={setNodeRef}
        {...(draggable ? attributes : {})}
        {...(draggable ? listeners : {})}
        role={onOpen ? 'button' : undefined}
        tabIndex={draggable || onOpen ? 0 : undefined}
        aria-current={selected ? 'true' : undefined}
        aria-describedby={hint}
        aria-busy={pending || undefined}
        data-slot="board-view-card"
        className={cn(className, isDragging && 'opacity-40')}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (onOpen && (event.key === 'Enter' || event.key === ' ')) {
            // Space is dnd-kit's pick-up key only while dragging; here the card
            // is at rest, so it activates like any other button.
            if (!event.ctrlKey && !event.metaKey) {
              event.preventDefault();
              onOpen();
              return;
            }
          }
          onKeyDown?.(event);
        }}
      >
        {children ?? (
          <>
            <span className="flex items-start gap-2">
              {accent && (
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full ring-1',
                    accentClasses[accent].bg,
                    accentClasses[accent].border
                  )}
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-foreground block text-sm font-medium">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {subtitle}
                  </span>
                )}
              </span>
            </span>
          </>
        )}
      </div>
    </li>
  );
}

// =============================================================================
// Column
// =============================================================================

function BoardColumn({
  stage,
  count,
  headingLevel: Heading,
  classNames,
  children,
}: {
  stage: Stage;
  count: number;
  headingLevel: 'h2' | 'h3' | 'h4';
  classNames?: BoardViewProps<unknown>['classNames'];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const accent = stage.accent ?? 'neutral';
  return (
    <section
      ref={setNodeRef}
      data-slot="board-view-column"
      data-over={isOver || undefined}
      className={cn(
        'bg-muted/40 flex min-w-0 flex-col rounded-lg border',
        isOver ? accentClasses[accent].border : 'border-border',
        'sm:w-72 sm:shrink-0',
        classNames?.column
      )}
    >
      <Heading>
        <span
          id={`board-view-column-${stage.id}`}
          data-slot="board-view-column-header"
          className={cn(
            'border-border flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase',
            accentClasses[accent].text,
            classNames?.columnHeader
          )}
        >
          <span>{stage.label}</span>
          <span className="ms-auto font-normal tabular-nums">{count}</span>
        </span>
      </Heading>
      {children}
    </section>
  );
}

// =============================================================================
// Component
// =============================================================================

export function BoardView<T>({
  items,
  accessors,
  stages,
  loading = false,
  error = null,
  selectedId = null,
  onOpen,
  onMove,
  renderItem,
  emptyState,
  labels,
  density,
  className,
  classNames,
  headingLevel = 'h3',
}: BoardViewProps<T>) {
  const text = { ...defaultBoardLabels, ...labels };
  const hintId = React.useId();
  const [announcement, setAnnouncement] = React.useState('');
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  // Where a card is shown while its move is in flight, so the column it landed
  // in is the one the user sees before the caller's data catches up.
  const [pending, setPending] = React.useState<Record<string, string>>({});

  const byId = React.useMemo(() => {
    const map = new Map<string, T>();
    for (const item of items) map.set(accessors.getId(item), item);
    return map;
  }, [items, accessors]);

  const stageOf = React.useCallback(
    (item: T) => pending[accessors.getId(item)] ?? accessors.getStatus?.(item),
    [pending, accessors]
  );

  const columns = React.useMemo(() => {
    const buckets = new Map<string, T[]>(stages.map((s) => [s.id, []]));
    const extra = new Map<string, T[]>();
    for (const item of items) {
      const key = stageOf(item) ?? '';
      const bucket = buckets.get(key);
      if (bucket) bucket.push(item);
      else extra.set(key, [...(extra.get(key) ?? []), item]);
    }
    return [
      ...stages.map((stage) => ({ stage, items: buckets.get(stage.id) ?? [] })),
      // Never silently drop a record whose status matches no stage.
      ...[...extra].map(([key, bucket]) => ({
        stage: { id: key, label: key || 'Ungrouped' } as Stage,
        items: bucket,
      })),
    ];
  }, [items, stages, stageOf]);

  const commit = React.useCallback(
    async (id: string, toStage: string) => {
      const item = byId.get(id);
      if (!item || !onMove) return;
      const from = accessors.getStatus?.(item);
      if (from === toStage) return;
      const stage = stages.find((s) => s.id === toStage);
      const title = accessors.getTitle(item);

      setPending((prev) => ({ ...prev, [id]: toStage }));
      setAnnouncement(
        fill(text.moved, { item: title, stage: stage?.label ?? toStage })
      );
      try {
        await onMove(id, toStage, item);
      } catch {
        setAnnouncement(fill(text.moveFailed, { item: title }));
      } finally {
        setPending((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [byId, onMove, accessors, stages, text.moved, text.moveFailed]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragStart = (event: DragStartEvent) =>
    setDraggingId(String(event.active.id));

  const onDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    if (event.over) void commit(String(event.active.id), String(event.over.id));
  };

  // Pointer drag has no keyboard equivalent that is pleasant to use, so moving
  // by keyboard is its own command on the focused card rather than a simulated
  // drag: Ctrl/Cmd with the arrow keys steps it between adjacent stages.
  const onCardKeyDown = (
    event: React.KeyboardEvent,
    id: string,
    columnIndex: number
  ) => {
    if (!onMove || !(event.ctrlKey || event.metaKey)) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let delta = 0;
    if (event.key === 'ArrowRight') delta = rtl ? -1 : 1;
    else if (event.key === 'ArrowLeft') delta = rtl ? 1 : -1;
    else return;
    const target = columns[columnIndex + delta];
    if (!target) return;
    event.preventDefault();
    void commit(id, target.stage.id);
  };

  const state = (content: React.ReactNode) => (
    <div
      data-slot="board-view-state"
      className={cn(
        'border-border bg-card text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-10 text-center text-sm',
        classNames?.state
      )}
    >
      {content}
    </div>
  );

  if (error) {
    return state(
      <p role="alert" className="text-destructive">
        {text.error}
      </p>
    );
  }
  if (loading) {
    return state(
      <span className="flex items-center gap-2">
        <Spinner size="sm" label={text.loading} />
        <span aria-hidden>{text.loading}</span>
      </span>
    );
  }
  if (items.length === 0 && emptyState) return <>{emptyState}</>;

  const draggingItem = draggingId ? byId.get(draggingId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div
        data-slot="board-view"
        className={cn(
          // Columns on one scrolling row once there is room; stacked below it,
          // because five 288px columns on a phone is a horizontal maze.
          'flex flex-col gap-3 sm:flex-row sm:overflow-x-auto sm:pb-2',
          className
        )}
      >
        {columns.map((column, columnIndex) => (
          <BoardColumn
            key={column.stage.id}
            stage={column.stage}
            count={column.items.length}
            headingLevel={headingLevel}
            classNames={classNames}
          >
            <ul
              aria-labelledby={`board-view-column-${column.stage.id}`}
              className="flex flex-1 flex-col gap-2 p-2"
            >
              {column.items.map((item) => {
                const id = accessors.getId(item);
                return (
                  <BoardCard
                    key={id}
                    id={id}
                    title={accessors.getTitle(item)}
                    subtitle={accessors.getSubtitle?.(item)}
                    accent={accessors.getAccent?.(item)}
                    selected={id === selectedId}
                    pending={id in pending}
                    draggable={Boolean(onMove)}
                    hint={onMove ? hintId : undefined}
                    className={cn(
                      cardVariants({
                        density,
                        interactive: Boolean(onOpen),
                        selected: id === selectedId,
                        pending: id in pending,
                      }),
                      classNames?.card,
                      id === selectedId && classNames?.selectedCard
                    )}
                    onOpen={onOpen ? () => onOpen(id, item) : undefined}
                    onKeyDown={(event) => onCardKeyDown(event, id, columnIndex)}
                  >
                    {renderItem?.(item, { view: 'board' })}
                  </BoardCard>
                );
              })}
              {column.items.length === 0 && (
                <li className="text-muted-foreground px-1 py-2 text-xs">
                  {text.empty}
                </li>
              )}
            </ul>
          </BoardColumn>
        ))}
      </div>

      {onMove && (
        <span id={hintId} className="sr-only">
          {text.moveHint}
        </span>
      )}
      {/* Separate from dnd-kit's own drag live region: this announces moves
          made by keyboard command, which are not drags. */}
      <span
        data-slot="board-view-announcer"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {announcement}
      </span>

      <DragOverlay>
        {draggingItem && (
          <div className={cn(cardVariants({ density }), 'shadow-lg')}>
            <span className="text-foreground block text-sm font-medium">
              {accessors.getTitle(draggingItem)}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export { cardVariants as boardViewCardVariants };
