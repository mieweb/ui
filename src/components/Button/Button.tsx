import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { injectButtonCriticalStyles } from './button-critical';
import { buttonVariants } from './button-variants';

/**
 * Label wrapper classes. Icons passed as `children` (rather than
 * leftIcon/rightIcon) land inside this span; preflight makes SVGs
 * display:block which would force line breaks inside the inline span,
 * so restore inline flow for them.
 */
const labelClasses = 'truncate [&_svg]:inline-block [&_svg]:align-middle';

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Optional icon element to render before the button text */
  leftIcon?: React.ReactElement | null;
  /** Optional icon element to render after the button text */
  rightIcon?: React.ReactElement | null;
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
 * <Button effect="sheen">Request a demo</Button>
 * <Button variant="outline" effect="orbit">Watch the film</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      effect,
      leftIcon,
      rightIcon,
      isLoading,
      loadingText,
      disabled,
      children,
      title,
      ...props
    },
    ref
  ) => {
    const resolvedSize = size ?? 'md';
    const labelRef = React.useRef<HTMLSpanElement>(null);
    const innerRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement);

    // Guarantees correct icon/label layout even when the consumer's Tailwind
    // build is missing our utility classes. See button-critical.ts.
    React.useInsertionEffect(() => {
      injectButtonCriticalStyles();
    }, []);

    // When the label truncates, expose the full text as a native tooltip.
    // A consumer-provided `title` always takes precedence.
    React.useLayoutEffect(() => {
      const label = labelRef.current;
      const button = innerRef.current;
      if (!label || !button || title !== undefined) return;

      const update = () => {
        if (label.scrollWidth > label.clientWidth) {
          button.title = label.textContent ?? '';
        } else {
          button.removeAttribute('title');
        }
      };

      update();
      if (typeof globalThis.ResizeObserver === 'undefined') return;
      const observer = new globalThis.ResizeObserver(update);
      observer.observe(label);
      return () => observer.disconnect();
    }, [title, children, isLoading, loadingText]);

    return (
      <button
        data-slot="button"
        data-size={resolvedSize}
        data-variant={variant ?? 'primary'}
        className={cn(
          buttonVariants({ variant, size: resolvedSize, fullWidth, effect }),
          className
        )}
        ref={innerRef}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        title={title}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span
              ref={labelRef}
              data-slot="button-label"
              className={labelClasses}
            >
              {loadingText || children}
            </span>
          </>
        ) : (
          <>
            {React.isValidElement(leftIcon) && (
              <span data-slot="button-icon" className="shrink-0">
                {leftIcon}
              </span>
            )}
            <span
              ref={labelRef}
              data-slot="button-label"
              className={labelClasses}
            >
              {children}
            </span>
            {React.isValidElement(rightIcon) && (
              <span data-slot="button-icon" className="shrink-0">
                {rightIcon}
              </span>
            )}
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
      className="h-4 w-4 shrink-0 animate-spin"
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
