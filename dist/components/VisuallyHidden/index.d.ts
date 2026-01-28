import * as React from 'react';

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
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
declare const VisuallyHidden: React.ForwardRefExoticComponent<VisuallyHiddenProps & React.RefAttributes<HTMLSpanElement>>;

export { VisuallyHidden, type VisuallyHiddenProps };
