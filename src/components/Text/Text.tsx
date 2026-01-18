import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textVariants = cva('', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary-600 dark:text-primary-400',
      destructive: 'text-destructive',
      success: 'text-success',
      warning: 'text-warning',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'base',
    weight: 'normal',
    align: 'left',
  },
});

type TextElement =
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  /** HTML element to render as */
  as?: TextElement;
  /** Truncate text with ellipsis */
  truncate?: boolean;
}

/**
 * A flexible text component for consistent typography.
 *
 * @example
 * ```tsx
 * <Text variant="muted" size="sm">Helper text</Text>
 * <Text as="h1" size="3xl" weight="bold">Page Title</Text>
 * <Text variant="destructive">Error message</Text>
 * ```
 */
const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      variant,
      size,
      weight,
      align,
      as: Component = 'p',
      truncate,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        // @ts-expect-error - ref type is complex due to polymorphic component
        ref={ref}
        className={cn(
          textVariants({ variant, size, weight, align }),
          truncate && 'truncate',
          className
        )}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

/**
 * Small muted text, useful for helper text and descriptions.
 * This is a convenience component equivalent to <Text variant="muted" size="sm">
 */
const SmallMuted = React.forwardRef<
  HTMLElement,
  Omit<TextProps, 'variant' | 'size'>
>(({ className, ...props }, ref) => (
  <Text ref={ref} variant="muted" size="sm" className={className} {...props} />
));

SmallMuted.displayName = 'SmallMuted';

export { Text, SmallMuted, textVariants };
