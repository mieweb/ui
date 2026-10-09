'use client';

import * as React from 'react';

import { useLiveAnnouncement } from './useLiveAnnouncement';

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

/** Move `id` by `delta` positions (clamped). Returns `ids` unchanged when it can't move. */
export function moveIdBy(ids: string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return ids;
  const to = Math.max(0, Math.min(ids.length - 1, from + delta));
  if (to === from) return ids;
  const next = ids.filter((i) => i !== id);
  next.splice(to, 0, id);
  return next;
}

export interface DragReorderLabels {
  moveUp: string;
  moveDown: string;
  /** Announced after a keyboard/button move */
  moved: (position: number, total: number, id: string) => string;
}

export const DEFAULT_DRAG_REORDER_LABELS: DragReorderLabels = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  moved: (position, total) => `Moved to position ${position} of ${total}`,
};

export interface UseDragReorderOptions {
  /** Current flat order of item ids (props order) */
  ids: string[];
  /** Called with the full new id order after a drop or move. Omit to disable reordering. */
  onReorder?: (ids: string[]) => void;
  /** Restrict drops, e.g. to the same status group */
  canDropOn?: (draggedId: string, targetId: string) => boolean;
  /** Add Alt+ArrowUp / Alt+ArrowDown handling (and `tabIndex={0}`) to `rowProps`. Off by default so rows with their own `onKeyDown` keep working. */
  keyboard?: boolean;
  /** Receives move announcements instead of the returned `announcement` string. */
  announce?: (message: string) => void;
  /** Element rendered as the drag image (`dataTransfer.setDragImage`). */
  getDragPreview?: (id: string) => Element | null;
  labels?: Partial<DragReorderLabels>;
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
  /** Move an item by `delta` positions; no-op at the ends or across `canDropOn` boundaries. */
  moveBy: (id: string, delta: number) => void;
  /** Props for a visible move button */
  moveButtonProps: (
    id: string,
    direction: 'up' | 'down',
    label?: string
  ) => {
    type: 'button';
    onClick: (e: React.MouseEvent) => void;
    disabled: boolean;
    'aria-label': string;
  };
  /** Latest move message; render in an `aria-live="polite"` region (empty when `announce` is given). */
  announcement: string;
}

/**
 * HTML5 drag-and-drop list reordering. Rows spread `rowProps(id)`; on drop the
 * hook computes the full new id order and reports it via `onReorder` — the
 * consumer persists it (e.g. on the encounter/patient object) and feeds the
 * list back in props order.
 *
 * Drag-and-drop is pointer-only, so pair it with `moveButtonProps` buttons
 * and/or `keyboard: true` (Alt+↑/↓ on focused rows), and render
 * `announcement` in a polite live region.
 *
 * @example
 * ```tsx
 * const drag = useDragReorder({ ids: items.map((i) => i.id), onReorder, keyboard: true });
 * // <li {...drag.rowProps(item.id)} className={cn(dragIndicatorClasses(drag, item.id))}>
 * //   <button {...drag.moveButtonProps(item.id, 'up')}><ChevronUp /></button>
 * // <div aria-live="polite" className="sr-only">{drag.announcement}</div>
 * ```
 */
export function useDragReorder({
  ids,
  onReorder,
  canDropOn,
  keyboard = false,
  announce,
  getDragPreview,
  labels: labelsProp,
}: UseDragReorderOptions): UseDragReorderReturn {
  const labels = { ...DEFAULT_DRAG_REORDER_LABELS, ...labelsProp };
  const [announcement, announceLive] = useLiveAnnouncement();
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

  /** How far `id` can move toward `delta`: stops at the ends or the first slot canDropOn rejects. */
  const reachable = (id: string, delta: number): number => {
    const from = ids.indexOf(id);
    if (!enabled || from === -1) return 0;
    const step = Math.sign(delta);
    let reach = 0;
    while (reach !== delta) {
      const t = from + reach + step;
      if (t < 0 || t >= ids.length || (canDropOn && !canDropOn(id, ids[t])))
        break;
      reach += step;
    }
    return reach;
  };

  const moveBy = (id: string, delta: number) => {
    const next = moveIdBy(ids, id, reachable(id, delta));
    if (next === ids) return;
    onReorder?.(next);
    const message = labels.moved(next.indexOf(id) + 1, next.length, id);
    if (announce) announce(message);
    else announceLive(message);
  };

  const moveButtonProps: UseDragReorderReturn['moveButtonProps'] = (
    id,
    direction,
    label
  ) => {
    const delta = direction === 'up' ? -1 : 1;
    return {
      type: 'button',
      onClick: (e) => {
        e.stopPropagation();
        moveBy(id, delta);
      },
      disabled: reachable(id, delta) === 0,
      'aria-label':
        label ?? (direction === 'up' ? labels.moveUp : labels.moveDown),
    };
  };

  const moveByRef = React.useRef(moveBy);
  moveByRef.current = moveBy;

  const rowProps = React.useCallback(
    (id: string): React.HTMLAttributes<HTMLElement> => {
      if (!enabled) return {};
      const keyProps: React.HTMLAttributes<HTMLElement> = keyboard
        ? {
            tabIndex: 0,
            'aria-keyshortcuts': 'Alt+ArrowUp Alt+ArrowDown',
            onKeyDown: (e) => {
              if (e.target !== e.currentTarget || !e.altKey) return;
              if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
              e.preventDefault();
              moveByRef.current(id, e.key === 'ArrowUp' ? -1 : 1);
            },
          }
        : {};
      return {
        ...keyProps,
        draggable: true,
        // WebKit (iPadOS Safari, incl. remote-pointer sessions) starts a text
        // selection instead of a drag when the drag source contains selectable
        // text — suppress selection and explicitly mark the row as the drag
        // element so press-drag reliably initiates drag-and-drop.
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitUserDrag: 'element',
        } as React.CSSProperties,
        onDragStart: (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', id);
          const preview = getDragPreview?.(id);
          if (preview) e.dataTransfer.setDragImage(preview, 0, 0);
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
    [enabled, keyboard, ids, onReorder, canDropOn, getDragPreview, reset]
  );

  return {
    enabled,
    draggingId,
    over,
    rowProps,
    moveBy,
    moveButtonProps,
    announcement: announce ? '' : announcement,
  };
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
