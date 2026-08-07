import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const labelVariants = cva(
  [
    'text-foreground font-medium leading-none select-none',
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  ],
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface LabelProps
  extends
    React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /** Marks the associated field as required, rendering an asterisk */
  required?: boolean;
}

/**
 * An accessible form label that associates text with a form control via `htmlFor`.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email" required>Email</Label>
 * <input id="email" type="email" />
 * ```
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, children, ...props }, ref) => (
    <label
      ref={ref}
      data-slot="label"
      className={cn(labelVariants({ size }), className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-destructive ms-0.5">
          *
        </span>
      )}
    </label>
  )
);

Label.displayName = 'Label';

export { Label, labelVariants };
