'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Variants
// =============================================================================

const accordionVariants = cva('', {
  variants: {
    variant: {
      // Each item is its own card with spacing between
      separated: 'flex flex-col gap-3',
      // One bordered list with dividers
      joined: 'border-border divide-border divide-y rounded-lg border',
    },
  },
  defaultVariants: {
    variant: 'separated',
  },
});

const itemVariants = cva('overflow-hidden', {
  variants: {
    variant: {
      separated: 'border-border bg-card rounded-lg border',
      joined: 'bg-card first:rounded-t-lg last:rounded-b-lg',
    },
  },
  defaultVariants: {
    variant: 'separated',
  },
});

// =============================================================================
// Types
// =============================================================================

export interface AccordionItem {
  /** Stable id used for open state and aria wiring. */
  id: string;
  /** Header label (e.g. an FAQ question). */
  title: React.ReactNode;
  /** Panel content (e.g. the answer). */
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof accordionVariants> {
  items: AccordionItem[];
  /** `single` keeps at most one panel open; `multiple` allows any number. */
  type?: 'single' | 'multiple';
  /** Ids open initially (uncontrolled). */
  defaultOpenIds?: string[];
  /** Controlled open ids. Changes reported via `onOpenChange`. */
  openIds?: string[];
  onOpenChange?: (openIds: string[]) => void;
  /** In `single` mode, allow closing the open panel (default true). */
  collapsible?: boolean;
  /** Heading level wrapping each trigger for document outline (default h3). */
  headingLevel?: 'h2' | 'h3' | 'h4';
}

// =============================================================================
// Accordion
// =============================================================================

/**
 * A vertically stacked set of expandable panels — FAQ lists, settings
 * groups, progressive disclosure. Panels animate open to their natural
 * height (CSS grid rows, no max-height clipping), and headers are real
 * buttons inside headings with full `aria-expanded`/`aria-controls` wiring.
 *
 * @example
 * ```tsx
 * <Accordion
 *   type="single"
 *   items={[
 *     { id: 'pricing', title: 'How is pricing calculated?', content: <p>…</p> },
 *     { id: 'billing', title: 'When am I billed?', content: <p>…</p> },
 *   ]}
 * />
 * ```
 */
export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      items,
      type = 'single',
      defaultOpenIds,
      openIds: controlledOpen,
      onOpenChange,
      collapsible = true,
      headingLevel: Heading = 'h3',
      variant,
      className,
      ...props
    },
    ref
  ) {
    const baseId = React.useId();
    const [internalOpen, setInternalOpen] = React.useState<string[]>(
      () => defaultOpenIds ?? []
    );
    const open = controlledOpen ?? internalOpen;
    const openSet = React.useMemo(() => new Set(open), [open]);

    const toggle = (id: string) => {
      let next: string[];
      if (openSet.has(id)) {
        if (type === 'single' && !collapsible) return;
        next = open.filter((o) => o !== id);
      } else {
        next = type === 'single' ? [id] : [...open, id];
      }
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    };

    return (
      <div
        ref={ref}
        className={cn(accordionVariants({ variant }), className)}
        {...props}
      >
        {items.map((item) => {
          const isOpen = openSet.has(item.id);
          const triggerId = `${baseId}-${item.id}-trigger`;
          const panelId = `${baseId}-${item.id}-panel`;
          return (
            <div key={item.id} className={cn(itemVariants({ variant }))}>
              <Heading className="m-0">
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  disabled={item.disabled}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    'hover:bg-muted/60 flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                    'disabled:pointer-events-none disabled:opacity-50'
                  )}
                >
                  <span className="text-foreground min-w-0 text-sm font-semibold">
                    {item.title}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'text-muted-foreground h-5 w-5 shrink-0 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
              </Heading>
              {/* grid-rows 0fr→1fr animates to natural height without a max-height clip */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <div className="text-muted-foreground px-5 pb-4 text-sm leading-relaxed">
                    {item.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
