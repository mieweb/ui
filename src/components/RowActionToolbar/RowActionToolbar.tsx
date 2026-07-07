'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';

/**
 * Toolbar / group arrow-key navigation (WAI-ARIA toolbar pattern).
 * Attach to a container's onKeyDown: ←/→ move focus between enabled
 * buttons, Home/End jump to first/last.
 */
export function toolbarKeyNav(e: React.KeyboardEvent<HTMLElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const buttons = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>(
      'button:not([disabled])'
    )
  );
  const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (i === -1 || buttons.length === 0) return;
  e.preventDefault();
  e.stopPropagation();
  const next =
    e.key === 'ArrowLeft'
      ? (i - 1 + buttons.length) % buttons.length
      : e.key === 'ArrowRight'
        ? (i + 1) % buttons.length
        : e.key === 'Home'
          ? 0
          : buttons.length - 1;
  buttons[next]?.focus();
}

// Alignment of the floating (fine-pointer) overlay within the row.
const ALIGN = {
  /** Vertically centered on the row's right edge (single-line rows). */
  center:
    'pointer-fine:top-1/2 pointer-fine:right-0 pointer-fine:-translate-y-1/2',
  /** Pinned near the row's top-right corner (multi-line rows). */
  top: 'pointer-fine:top-1.5 pointer-fine:right-1.5',
} as const;

// Which hover scope reveals the toolbar. Rows nested inside another `group`
// (e.g. order rows inside an assessed problem) use a named group so hovering
// the outer block doesn't reveal every nested toolbar. `grid` keys off the
// datavis (NITRO) table row (`.wcdv-tr`) for toolbars rendered into grid
// cells via `formatCell`.
const REVEAL = {
  row: cn(
    'group-hover:pointer-events-auto group-hover:opacity-100',
    'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
    'group-focus:pointer-events-auto group-focus:opacity-100'
  ),
  order: cn(
    'group-hover/order:pointer-events-auto group-hover/order:opacity-100',
    'group-focus-within/order:pointer-events-auto group-focus-within/order:opacity-100',
    'group-focus/order:pointer-events-auto group-focus/order:opacity-100'
  ),
  grid: cn(
    '[.wcdv-tr:hover_&]:pointer-events-auto [.wcdv-tr:hover_&]:opacity-100',
    '[.wcdv-tr:focus-within_&]:pointer-events-auto [.wcdv-tr:focus-within_&]:opacity-100'
  ),
} as const;

export interface RowActionToolbarProps {
  /** Accessible name, e.g. `Actions for penicillin`. */
  label: string;
  /** Overlay alignment on fine-pointer devices. @default 'center' */
  align?: keyof typeof ALIGN;
  /**
   * Hover scope for the reveal. Use `'order'` when the row is a
   * `group/order` nested inside another `group`; use `'grid'` inside a
   * datavis (NITRO) grid cell — the toolbar then stays in flow (the cell
   * reserves its space) and reveals when the `.wcdv-tr` row is hovered.
   * @default 'row'
   */
  group?: keyof typeof REVEAL;
  className?: string;
  children: React.ReactNode;
}

/**
 * Per-row action toolbar for clinical lists.
 *
 * On hover-capable (fine pointer) devices it floats over the row's right
 * edge as a card-styled overlay, hidden until the row is hovered or
 * keyboard-focused. Touch devices can't hover, so the toolbar stays in
 * flow at the end of the row (`ml-auto`) and is always visible.
 *
 * Implements WAI-ARIA toolbar arrow-key navigation. The parent row must be
 * `relative` and carry the matching `group` (or `group/order`) class.
 */
export function RowActionToolbar({
  label,
  align = 'center',
  group = 'row',
  className,
  children,
}: RowActionToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      onKeyDown={toolbarKeyNav}
      className={cn(
        'z-10 ml-auto flex items-center gap-0.5 transition-opacity',
        // Inside a grid cell the column already reserves the space, so the
        // toolbar stays in flow — no absolute overlay. It keeps the card
        // chrome, though: pair with a `sticky right-0` actions column and it
        // floats over scrolled-under content at the grid's right edge.
        group !== 'grid' && [
          'pointer-fine:absolute',
          ALIGN[align],
          'pointer-fine:bg-card pointer-fine:border-border pointer-fine:rounded-md pointer-fine:border pointer-fine:p-0.5 pointer-fine:shadow-sm',
        ],
        group === 'grid' &&
          'bg-card border-border rounded-md border p-0.5 shadow-sm',
        'pointer-fine:pointer-events-none pointer-fine:opacity-0',
        REVEAL[group],
        'focus-within:pointer-events-auto focus-within:opacity-100',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface RowIconButtonProps {
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  onClick: () => void;
  /** Toggle-button state (renders `aria-pressed` + tinted background). */
  active?: boolean;
  /** `md` = 32px button / 16px icon; `sm` = 28px / 14px. @default 'md' */
  size?: 'md' | 'sm';
}

/** Tooltip-labeled ghost icon button for `RowActionToolbar`. */
export function RowIconButton({
  label,
  icon: Icon,
  onClick,
  active,
  size = 'md',
}: RowIconButtonProps) {
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-pressed={active}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
          'shrink-0',
          active &&
            'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
        )}
      >
        <Icon size={size === 'sm' ? 14 : 16} />
      </Button>
    </Tooltip>
  );
}
