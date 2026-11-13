/**
 * SidebarResizeHandle — the draggable divider between the inbox's
 * conversation list and its panel. Internal to the SuperChat module; the
 * inbox owns the width and passes it in.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';
import { isRtl } from '../../hooks/useDirection';

/** Pixels one arrow-key press moves the divider. */
const KEY_STEP = 16;

export interface SidebarResizeHandleProps {
  /** Current sidebar width in px. */
  width: number;
  minWidth: number;
  maxWidth: number;
  /** Requested width in px; the owner clamps it. `final` is false while a drag is in progress. */
  onResize: (width: number, final: boolean) => void;
  /** Double-click: restore the default width. */
  onReset: () => void;
  /** Accessible name of the separator. */
  label: string;
  className?: string;
}

/**
 * A focusable `role="separator"` (WAI-ARIA window splitter): drag it, or use
 * the arrow keys, Home and End. Directions follow the visual layout, so in RTL
 * (where the list sits on the right) dragging or pressing left widens it.
 */
export function SidebarResizeHandle({
  width,
  minWidth,
  maxWidth,
  onResize,
  onReset,
  label,
  className,
}: SidebarResizeHandleProps) {
  const drag = React.useRef<{
    x: number;
    width: number;
    rtl: boolean;
    last?: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Keep the drag from selecting text in the list or thread.
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {
      x: e.clientX,
      width,
      rtl: isRtl(e.currentTarget),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    // rtl-ignore -- pointer-coordinate math, inverted below for RTL
    const dx = e.clientX - start.x;
    start.last = start.width + (start.rtl ? -dx : dx);
    onResize(start.last, false);
  };

  // pointerup, pointercancel and lostpointercapture all land here; only the
  // first one after a move reports.
  const endDrag = () => {
    const start = drag.current;
    drag.current = null;
    if (start?.last !== undefined) onResize(start.last, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const grow = isRtl(e.currentTarget) ? 'ArrowLeft' : 'ArrowRight';
    const shrink = grow === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const next =
      e.key === grow
        ? width + KEY_STEP
        : e.key === shrink
          ? width - KEY_STEP
          : e.key === 'Home'
            ? minWidth
            : e.key === 'End'
              ? maxWidth
              : undefined;
    if (next === undefined) return;
    e.preventDefault();
    onResize(next, true);
  };

  return (
    // A focusable separator is a widget (WAI-ARIA window splitter); the
    // jsx-a11y rules treat every separator as static.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      data-slot="superchat-sidebar-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={cn(
        // Zero net width: it straddles the list's end border.
        'group focus-visible:ring-primary-500 relative z-10 -mx-1 w-2 shrink-0 cursor-col-resize touch-none outline-none focus-visible:ring-2',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="group-hover:bg-primary-500 group-focus-visible:bg-primary-600 absolute inset-y-0 start-[3px] w-0.5 bg-transparent transition-colors"
      />
    </div>
  );
}
