'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import {
  CalendarIcon,
  ChartIcon,
  ColumnsIcon,
  GridIcon,
  ListIcon,
  TableIcon,
} from '../Icons';
import { defaultViewLabels, type ViewId } from '../../views/types';

// =============================================================================
// Types
// =============================================================================

export interface ViewOption {
  id: ViewId;
  /** Overrides the built-in English label. */
  label?: string;
  /** Overrides the built-in icon. */
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  disabled?: boolean;
}

export interface ViewSwitcherProps extends VariantProps<
  typeof viewSwitcherVariants
> {
  /** Views to offer, in order. Accepts bare ids or `ViewOption`s. */
  views: readonly (ViewId | ViewOption)[];
  value: ViewId;
  onValueChange: (view: ViewId) => void;
  /** Accessible name of the group. */
  label?: string;
  /** Show labels beside the icons. `responsive` hides them below `sm`. */
  showLabels?: boolean | 'responsive';
  className?: string;
  classNames?: Partial<Record<'option' | 'activeOption', string>>;
}

// =============================================================================
// Defaults
// =============================================================================

const VIEW_META: Record<
  ViewId,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  }
> = {
  overview: { label: 'Overview', icon: GridIcon },
  list: { label: 'List', icon: ListIcon },
  board: { label: 'Board', icon: ColumnsIcon },
  calendar: { label: 'Calendar', icon: CalendarIcon },
  gantt: { label: 'Gantt', icon: ChartIcon },
  roadmap: { label: 'Roadmap', icon: ChartIcon },
  table: { label: 'Table', icon: TableIcon },
};

// =============================================================================
// Variants
// =============================================================================

const viewSwitcherVariants = cva(
  [
    'inline-flex items-center gap-0.5',
    'rounded-lg border border-border bg-muted p-0.5',
    'overflow-x-auto',
  ],
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const optionVariants = cva(
  [
    'inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        // 40px tall on touch, tighter once a pointer is likely.
        sm: 'min-h-10 px-2 py-2 sm:min-h-0 sm:px-2 sm:py-1',
        md: 'min-h-10 px-2.5 py-2 sm:min-h-0 sm:px-3 sm:py-1.5',
      },
      active: {
        // A raised surface rather than tinted ink: an accent colour as text on
        // its own wash fails AA contrast. Same treatment as Tabs' pills.
        true: 'bg-background text-foreground shadow-sm',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: { size: 'md', active: false },
  }
);

// =============================================================================
// Component
// =============================================================================

/**
 * Keyboard model is a radio group: one tab stop, arrows move *and* select.
 * Every option is visible, so moving the selection is the whole interaction —
 * there is nothing to "commit" afterwards.
 */
export const ViewSwitcher = React.forwardRef<HTMLDivElement, ViewSwitcherProps>(
  function ViewSwitcher(
    {
      views,
      value,
      onValueChange,
      label = defaultViewLabels.viewSwitcher,
      showLabels = 'responsive',
      size,
      className,
      classNames,
      ...rest
    },
    ref
  ) {
    const options = React.useMemo<ViewOption[]>(
      () => views.map((v) => (typeof v === 'string' ? { id: v } : v)),
      [views]
    );
    const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

    const select = (next: ViewOption | undefined) => {
      if (!next || next.id === value) return;
      onValueChange(next.id);
      // The selection owns the tab stop, so focus has to follow it.
      requestAnimationFrame(() =>
        refs.current[next.id]?.focus({ preventScroll: true })
      );
    };

    // Stepping is relative to the selected view, not to whichever button received
    // the key: focus moves asynchronously, and the two would drift apart.
    const step = (delta: number) => {
      const enabled = options.filter((o) => !o.disabled);
      if (enabled.length === 0) return;
      const current = enabled.findIndex((o) => o.id === value);
      const from = current === -1 ? (delta > 0 ? -1 : 0) : current;
      select(enabled[(from + delta + enabled.length) % enabled.length]);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const enabled = options.filter((o) => !o.disabled);
      // Logical, not physical: ArrowRight moves to the visually next option,
      // which is the previous one under RTL.
      const forward =
        getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          step(forward);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          step(-forward);
          break;
        case 'ArrowDown':
          event.preventDefault();
          step(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          step(-1);
          break;
        case 'Home':
          event.preventDefault();
          select(enabled[0]);
          break;
        case 'End':
          event.preventDefault();
          select(enabled[enabled.length - 1]);
          break;
        default:
          break;
      }
    };

    // The roving tab stop has to land on an option the browser will actually
    // focus. A disabled `<button>` is unfocusable, so if the active option is
    // also disabled — a controlled caller, or a `defaultView` that later got
    // disabled — putting the only `tabIndex={0}` on it leaves the radiogroup
    // with no keyboard entry point at all. Fall back to the first enabled
    // option; arrows then move from there.
    const tabStopId =
      options.find((o) => o.id === value && !o.disabled)?.id ??
      options.find((o) => !o.disabled)?.id;

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        data-slot="view-switcher"
        className={cn(viewSwitcherVariants({ size }), className)}
        {...rest}
      >
        {options.map((option) => {
          const meta = VIEW_META[option.id];
          const Icon = option.icon ?? meta.icon;
          const text = option.label ?? meta.label;
          const active = option.id === value;
          return (
            <button
              key={option.id}
              ref={(node) => {
                refs.current[option.id] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={showLabels === true ? undefined : text}
              title={text}
              disabled={option.disabled}
              tabIndex={option.id === tabStopId ? 0 : -1}
              data-slot="view-switcher-option"
              data-view={option.id}
              className={cn(
                optionVariants({ size, active }),
                classNames?.option,
                active && classNames?.activeOption
              )}
              onClick={() => onValueChange(option.id)}
              onKeyDown={onKeyDown}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {showLabels !== false && (
                <span
                  data-slot="view-switcher-label"
                  className={cn(
                    showLabels === 'responsive' && 'hidden sm:inline'
                  )}
                >
                  {text}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

export { viewSwitcherVariants };
