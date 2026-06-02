import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const scrollAreaVariants = cva(
  [
    'relative overflow-auto',
    // Thin, theme-aware scrollbars
    '[scrollbar-width:thin]',
    '[scrollbar-color:hsl(var(--border))_transparent]',
    '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2',
    '[&::-webkit-scrollbar-track]:bg-transparent',
    '[&::-webkit-scrollbar-thumb]:rounded-full',
    '[&::-webkit-scrollbar-thumb]:bg-border',
    'hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40',
  ],
  {
    variants: {
      orientation: {
        vertical: 'overflow-x-hidden overflow-y-auto',
        horizontal: 'overflow-x-auto overflow-y-hidden',
        both: 'overflow-auto',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  }
);

export interface ScrollAreaProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollAreaVariants> {}

/**
 * A scrollable container with consistent, theme-aware scrollbar styling.
 *
 * @example
 * ```tsx
 * <ScrollArea className="h-64">
 *   <LongContent />
 * </ScrollArea>
 * ```
 */
const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="scroll-area"
      tabIndex={0}
      className={cn(scrollAreaVariants({ orientation }), className)}
      {...props}
    >
      {children}
    </div>
  )
);

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea, scrollAreaVariants };
