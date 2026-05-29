import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

export interface SeparatorProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {
  /**
   * Whether the separator is purely decorative. When `true` (default) the
   * separator is hidden from assistive technologies. Set to `false` when the
   * separator conveys meaningful structure.
   */
  decorative?: boolean;
}

/**
 * A visual or semantic divider between content.
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" />
 * ```
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => (
    <div
      ref={ref}
      data-slot="separator"
      role={decorative ? 'none' : 'separator'}
      aria-orientation={
        decorative ? undefined : orientation ?? 'horizontal'
      }
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';

export { Separator, separatorVariants };
