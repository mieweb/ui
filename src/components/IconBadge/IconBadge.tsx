import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../utils/cn';

const iconBadgeVariants = cva(
  ['inline-flex shrink-0 items-center justify-center'],
  {
    variants: {
      variant: {
        /** Brand gradient fill with a soft glow — for hero / auth moments */
        gradient: 'bg-gradient-brand text-white shadow-glow',
        /** Solid brand fill */
        solid: 'bg-primary-600 text-white',
        /** Translucent brand tint that adapts to light & dark */
        tonal: 'bg-primary-500/10 text-primary-600',
        /** Neutral muted surface with a brand-colored icon */
        soft: 'bg-muted text-primary-600',
      },
      size: {
        sm: 'h-9 w-9 [&>svg]:h-4 [&>svg]:w-4',
        md: 'h-12 w-12 [&>svg]:h-6 [&>svg]:w-6',
        lg: 'h-14 w-14 [&>svg]:h-7 [&>svg]:w-7',
        xl: 'h-16 w-16 [&>svg]:h-8 [&>svg]:w-8',
      },
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'tonal',
      size: 'md',
      shape: 'rounded',
    },
  }
);

export interface IconBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconBadgeVariants> {
  /** The icon (or other small visual) to display inside the badge */
  children: React.ReactNode;
}

/**
 * A circular / rounded container that frames an icon — the BlueHive "feature
 * icon" treatment used in auth flows, empty states, and dashboard tiles.
 *
 * The icon is sized automatically per `size`; pass a bare SVG icon as the child.
 *
 * @example
 * ```tsx
 * <IconBadge variant="gradient" shape="circle" size="lg">
 *   <Send />
 * </IconBadge>
 * ```
 */
const IconBadge = React.forwardRef<HTMLSpanElement, IconBadgeProps>(
  function IconBadge(
    { className, variant, size, shape, children, ...props },
    ref
  ) {
    return (
      <span
        ref={ref}
        data-slot="icon-badge"
        className={cn(iconBadgeVariants({ variant, size, shape }), className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

IconBadge.displayName = 'IconBadge';

export { IconBadge, iconBadgeVariants };
