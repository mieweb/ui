'use client';

import * as React from 'react';

export type AnchoredPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom'
  | 'top-start'
  | 'top-end'
  | 'top'
  | 'right-start'
  | 'right-end'
  | 'right'
  | 'left-start'
  | 'left-end'
  | 'left';

export type AnchoredSide = 'top' | 'bottom' | 'left' | 'right';

export interface UseAnchoredPositionOptions {
  /** Whether the floating element is currently shown */
  open: boolean;
  /** Preferred placement relative to the anchor (flips when out of space) */
  placement?: AnchoredPlacement;
  /** Gap between the anchor and the floating element, in px */
  offset?: number;
  /** Force the floating element to the anchor's width */
  matchWidth?: boolean;
  /** Use the anchor's width as the floating element's minimum width */
  matchMinWidth?: boolean;
  /** Minimum distance from the viewport edges, in px */
  viewportPadding?: number;
  /** Flip to the opposite vertical side when the preferred side is cramped */
  allowFlip?: boolean;
  /** Optional element whose visible rectangle also constrains the popup */
  boundaryRef?: React.RefObject<HTMLElement | null>;
  /**
   * Additional cap on the floating element's height, in px. The height is
   * always clamped to the available viewport space; this only lowers that
   * limit further (omitting it does not remove the viewport constraint).
   */
  maxHeight?: number;
}

export interface UseAnchoredPositionReturn<
  TAnchor extends HTMLElement,
  TFloating extends HTMLElement,
> {
  /** Attach to the element the popup is anchored to (trigger/input) */
  anchorRef: React.RefObject<TAnchor | null>;
  /** Attach to the floating element (menu/listbox/panel) */
  floatingRef: React.RefObject<TFloating | null>;
  /** Fixed-position style for the floating element — spread onto it */
  style: React.CSSProperties;
  /** Side of the anchor in use after flipping */
  actualSide: AnchoredSide;
  /** Recompute the position (e.g. after async content loads) */
  update: () => void;
}

const HIDDEN_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  visibility: 'hidden',
  zIndex: 9999,
  // Never let `transition-*` utilities animate top/left from the hidden
  // (0,0) mount position to the computed one (keyframe animations like
  // `animate-in` are unaffected).
  transition: 'none',
};

/**
 * Positions a floating element (dropdown menu, autocomplete listbox,
 * date-picker calendar, …) relative to an anchor using `position: fixed`,
 * so it is never clipped by `overflow: hidden` ancestors.
 *
 * Render the floating element through `createPortal(..., document.body)`
 * and spread the returned `style` onto it. The hook:
 * - flips vertically when there is not enough space on the preferred side
 * - clamps horizontally to the viewport or optional boundary element
 * - constrains `maxHeight` to the available space (add `overflow-auto`)
 * - tracks scroll, resize, and anchor/content size changes while open
 *
 * @example
 * ```tsx
 * const { anchorRef, floatingRef, style } = useAnchoredPosition<
 *   HTMLButtonElement,
 *   HTMLDivElement
 * >({ open, placement: 'bottom-start' });
 *
 * <button ref={anchorRef} onClick={() => setOpen(!open)}>Open</button>
 * {open &&
 *   createPortal(
 *     <div ref={floatingRef} style={style} className="overflow-auto …">…</div>,
 *     document.body
 *   )}
 * ```
 */
export function useAnchoredPosition<
  TAnchor extends HTMLElement = HTMLElement,
  TFloating extends HTMLElement = HTMLElement,
>({
  open,
  placement = 'bottom-start',
  offset = 4,
  matchWidth = false,
  matchMinWidth = false,
  viewportPadding = 8,
  allowFlip = true,
  boundaryRef,
  maxHeight,
}: UseAnchoredPositionOptions): UseAnchoredPositionReturn<TAnchor, TFloating> {
  const anchorRef = React.useRef<TAnchor | null>(null);
  const floatingRef = React.useRef<TFloating | null>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>(HIDDEN_STYLE);
  const [actualSide, setActualSide] = React.useState<AnchoredSide>(
    placement.startsWith('top')
      ? 'top'
      : placement.startsWith('left')
        ? 'left'
        : placement.startsWith('right')
          ? 'right'
          : 'bottom'
  );

  const update = React.useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const boundaryRect = boundaryRef?.current?.getBoundingClientRect();
    const bounds = boundaryRect ?? {
      top: 0,
      right: viewportWidth,
      bottom: viewportHeight,
      left: 0,
    };
    const leftLimit = Math.max(bounds.left + viewportPadding, viewportPadding);
    const rightLimit = Math.min(
      bounds.right - viewportPadding,
      viewportWidth - viewportPadding
    );
    const topLimit = Math.max(bounds.top + viewportPadding, viewportPadding);
    const bottomLimit = Math.min(
      bounds.bottom - viewportPadding,
      viewportHeight - viewportPadding
    );

    // Natural content size (scrollHeight so a previously applied maxHeight
    // doesn't skew the flip decision).
    const contentHeight = Math.min(
      floating.scrollHeight,
      maxHeight ?? Infinity
    );
    // With matchMinWidth the rendered width is at least the anchor's width,
    // even if offsetWidth was measured before minWidth applied.
    const floatingWidth = matchWidth
      ? rect.width
      : Math.max(floating.offsetWidth, matchMinWidth ? rect.width : 0);
    const availableWidth = Math.max(rightLimit - leftLimit, 0);
    const positionedWidth = Math.min(floatingWidth, availableWidth);

    // --- Horizontal-axis placements (left/right flyouts, e.g. submenus) -----
    // The floating element sits beside the anchor: flip horizontally when the
    // preferred side is cramped, align vertically (-start = top edges,
    // -end = bottom edges, bare = centered), and clamp to the boundary.
    if (placement.startsWith('left') || placement.startsWith('right')) {
      const contentWidth = floating.offsetWidth;
      const spaceRight = rightLimit - rect.right - offset;
      const spaceLeft = rect.left - leftLimit - offset;
      const preferLeft = placement.startsWith('left');
      let hSide: 'left' | 'right' = preferLeft ? 'left' : 'right';
      if (allowFlip && preferLeft) {
        hSide =
          spaceLeft < contentWidth && spaceRight > spaceLeft ? 'right' : 'left';
      } else if (allowFlip) {
        hSide =
          spaceRight < contentWidth && spaceLeft > spaceRight
            ? 'left'
            : 'right';
      }
      const sideWidth = Math.max(hSide === 'left' ? spaceLeft : spaceRight, 0);

      const boundaryHeight = Math.max(bottomLimit - topLimit, 0);
      const positionedHeight = Math.min(contentHeight, boundaryHeight);
      const alignV = placement.endsWith('-start')
        ? 'top'
        : placement.endsWith('-end')
          ? 'bottom'
          : 'center';
      let top =
        alignV === 'top'
          ? rect.top
          : alignV === 'bottom'
            ? rect.bottom - positionedHeight
            : rect.top + rect.height / 2 - positionedHeight / 2;
      top = Math.min(
        Math.max(top, topLimit),
        Math.max(bottomLimit - positionedHeight, topLimit)
      );

      setActualSide(hSide);
      setStyle({
        position: 'fixed',
        top,
        // Anchor the edge nearest the trigger so the flyout grows away from it.
        ...(hSide === 'left'
          ? { right: viewportWidth - rect.left + offset }
          : { left: rect.right + offset }),
        maxWidth: sideWidth,
        maxHeight: Math.min(boundaryHeight, maxHeight ?? Infinity),
        zIndex: 9999,
        transition: 'none',
      });
      return;
    }

    // --- Vertical: preferred side, flip when out of space -------------------
    const spaceBelow = bottomLimit - rect.bottom - offset;
    const spaceAbove = rect.top - topLimit - offset;
    const preferTop = placement.startsWith('top');
    let side: 'top' | 'bottom' = preferTop ? 'top' : 'bottom';
    if (allowFlip && preferTop) {
      side =
        spaceAbove < contentHeight && spaceBelow > spaceAbove
          ? 'bottom'
          : 'top';
    } else if (allowFlip) {
      side =
        spaceBelow < contentHeight && spaceAbove > spaceBelow
          ? 'top'
          : 'bottom';
    }
    const availableHeight = Math.max(
      side === 'top' ? spaceAbove : spaceBelow,
      0
    );

    // --- Horizontal: -start aligns left edges, -end aligns right edges ------
    const align = placement.endsWith('-start')
      ? 'left'
      : placement.endsWith('-end')
        ? 'right'
        : 'center';
    let left =
      align === 'left'
        ? rect.left
        : align === 'right'
          ? rect.right - positionedWidth
          : rect.left + rect.width / 2 - positionedWidth / 2;
    left = Math.min(
      Math.max(left, leftLimit),
      Math.max(rightLimit - positionedWidth, leftLimit)
    );

    setActualSide(side);
    setStyle({
      position: 'fixed',
      left,
      ...(side === 'top'
        ? { bottom: viewportHeight - rect.top + offset }
        : { top: rect.bottom + offset }),
      ...(matchWidth ? { width: rect.width } : {}),
      ...(matchMinWidth ? { minWidth: rect.width } : {}),
      maxWidth: availableWidth,
      maxHeight: Math.min(availableHeight, maxHeight ?? Infinity),
      zIndex: 9999,
      transition: 'none',
    });
  }, [
    matchMinWidth,
    matchWidth,
    maxHeight,
    offset,
    placement,
    viewportPadding,
    allowFlip,
    boundaryRef,
  ]);

  // Position synchronously before paint when opening / re-rendering open.
  React.useLayoutEffect(() => {
    if (open) {
      update();
    } else {
      setStyle(HIDDEN_STYLE);
    }
  }, [open, update]);

  // Track scroll/resize and anchor/content size changes while open.
  React.useEffect(() => {
    if (!open) return;

    // Coalesce bursts (scroll/resize fire per event) into one layout
    // read + state update per frame.
    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    window.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);

    let resizeObserver: globalThis.ResizeObserver | undefined;
    if (typeof globalThis.ResizeObserver !== 'undefined') {
      resizeObserver = new globalThis.ResizeObserver(scheduleUpdate);
      if (anchorRef.current) resizeObserver.observe(anchorRef.current);
      if (floatingRef.current) resizeObserver.observe(floatingRef.current);
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [open, update]);

  return { anchorRef, floatingRef, style, actualSide, update };
}
