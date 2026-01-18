import * as React from 'react';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Component that hides content visually while keeping it accessible to screen readers.
 * Essential for providing context to assistive technologies without affecting visual layout.
 *
 * @example
 * ```tsx
 * <button>
 *   <IconTrash />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 * ```
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';

export { VisuallyHidden };
