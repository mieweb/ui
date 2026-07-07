'use client';

import * as React from 'react';

/** Insert `draggedId` before/after `targetId` in `ids`. */
export function reorderIds(
  ids: string[],
  draggedId: string,
  targetId: string,
  after: boolean
): string[] {
  if (draggedId === targetId) return ids;
  // Ignore drags that originate outside this list (stale payloads would
  // otherwise be inserted as unknown ids).
  if (!ids.includes(draggedId)) return ids;
  const without = ids.filter((i) => i !== draggedId);
  const idx = without.indexOf(targetId);
  if (idx === -1) return ids;
  without.splice(after ? idx + 1 : idx, 0, draggedId);
  return without;
}

export interface UseDragReorderOptions {
  /** Current flat order of item ids (props order) */
  ids: string[];
  /** Called with the full new id order after a drop. Omit to disable dragging. */
  onReorder?: (ids: string[]) => void;
  /** Restrict drops, e.g. to the same status group */
  canDropOn?: (draggedId: string, targetId: string) => boolean;
}

export interface DragOverState {
  id: string;
  /** Drop indicator position relative to the hovered row */
  after: boolean;
}

export interface UseDragReorderReturn {
  /** Whether drag reordering is active (onReorder provided) */
  enabled: boolean;
  /** Id currently being dragged, if any */
  draggingId: string | null;
  /** Row currently hovered as a drop target */
  over: DragOverState | null;
  /** Spread onto each row element (must be keyed by a stable id) */
  rowProps: (id: string) => React.HTMLAttributes<HTMLElement>;
}

/**
 * HTML5 drag-and-drop list reordering. Rows spread `rowProps(id)`; on drop the
 * hook computes the full new id order and reports it via `onReorder` — the
 * consumer persists it (e.g. on the encounter/patient object) and feeds the
 * list back in props order.
 *
 * Drag-and-drop is a pointer-only affordance: pair it with a keyboard
 * alternative (e.g. move buttons / Alt+Arrow keys) for accessibility.
 *
 * @example
 * ```tsx
 * const drag = useDragReorder({ ids: items.map((i) => i.id), onReorder });
 * // <li {...drag.rowProps(item.id)} className={cn(dragIndicatorClasses(drag, item.id))}>
 * ```
 */
export function useDragReorder({
  ids,
  onReorder,
  canDropOn,
}: UseDragReorderOptions): UseDragReorderReturn {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  // dragover can fire before the dragstart state update is visible, so the
  // authoritative dragged id lives in a ref (set synchronously)
  const draggingRef = React.useRef<string | null>(null);
  const [over, setOver] = React.useState<DragOverState | null>(null);
  const enabled = Boolean(onReorder);

  const reset = React.useCallback(() => {
    draggingRef.current = null;
    setDraggingId(null);
    setOver(null);
  }, []);

  const rowProps = React.useCallback(
    (id: string): React.HTMLAttributes<HTMLElement> => {
      if (!enabled) return {};
      return {
        draggable: true,
        onDragStart: (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', id);
          draggingRef.current = id;
          setDraggingId(id);
        },
        onDragEnd: reset,
        onDragOver: (e) => {
          const dragged = draggingRef.current;
          if (
            !dragged ||
            dragged === id ||
            (canDropOn && !canDropOn(dragged, id))
          ) {
            // hovering an invalid target: clear any stale indicator
            setOver(null);
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const r = e.currentTarget.getBoundingClientRect();
          const after = e.clientY > r.top + r.height / 2;
          setOver((prev) =>
            prev?.id === id && prev.after === after ? prev : { id, after }
          );
        },
        onDragLeave: () => {
          setOver((prev) => (prev?.id === id ? null : prev));
        },
        onDrop: (e) => {
          e.preventDefault();
          const dragged =
            draggingRef.current ?? e.dataTransfer.getData('text/plain');
          reset();
          if (!dragged || dragged === id) return;
          if (canDropOn && !canDropOn(dragged, id)) return;
          const r = e.currentTarget.getBoundingClientRect();
          const after = e.clientY > r.top + r.height / 2;
          onReorder?.(reorderIds(ids, dragged, id, after));
        },
      };
    },
    [enabled, ids, onReorder, canDropOn, reset]
  );

  return { enabled, draggingId, over, rowProps };
}

/** Tailwind classes for the drag state of a row: drop indicator + dragging dim. */
export function dragIndicatorClasses(
  drag: Pick<UseDragReorderReturn, 'draggingId' | 'over'>,
  id: string
): string {
  return [
    drag.draggingId === id ? 'opacity-40' : '',
    drag.over?.id === id && !drag.over.after
      ? 'shadow-[inset_0_2px_0_0_var(--color-primary-500,#3b82f6)]'
      : '',
    drag.over?.id === id && drag.over.after
      ? 'shadow-[inset_0_-2px_0_0_var(--color-primary-500,#3b82f6)]'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}
