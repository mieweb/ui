import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-800 text-white',
          'hover:bg-primary-700',
          'active:bg-primary-900',
        ],
        secondary: [
          'bg-neutral-200 text-neutral-900',
          'hover:bg-neutral-300',
          'active:bg-neutral-400',
          'dark:bg-neutral-700 dark:text-neutral-100',
          'dark:hover:bg-neutral-600',
          'dark:active:bg-neutral-500',
        ],
        ghost: [
          'bg-transparent text-neutral-600',
          'hover:bg-neutral-100',
          'active:bg-neutral-200',
          'dark:text-neutral-400',
          'dark:hover:bg-neutral-800',
          'dark:active:bg-neutral-700',
        ],
        outline: [
          'border-2 border-primary-800 text-primary-800 bg-transparent',
          'hover:bg-primary-50 hover:text-primary-900',
          'active:bg-primary-100',
          'dark:border-primary-400 dark:text-primary-400',
          'dark:hover:bg-primary-950',
          'dark:active:bg-primary-900',
        ],
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'active:bg-red-800',
        ],
        link: [
          'text-primary-800 underline-offset-4',
          'hover:underline hover:text-primary-900',
          'active:text-primary-950',
          'dark:text-primary-400',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-lg',
        lg: 'h-12 px-6 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Optional icon to render before the button text */
  leftIcon?: React.ReactNode;
  /** Optional icon to render after the button text */
  rightIcon?: React.ReactNode;
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
  /** Accessible label for the loading state */
  loadingText?: string;
}

/**
 * A versatile button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="danger" leftIcon={<TrashIcon />}>Delete</Button>
 * <Button variant="ghost" isLoading loadingText="Saving...">Save</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      isLoading,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Simple loading spinner for the button
 */
function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { Button, buttonVariants };
