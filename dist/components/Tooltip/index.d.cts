import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
interface TooltipProps {
    /** The content to display in the tooltip */
    content: React.ReactNode;
    /** The element that triggers the tooltip */
    children: React.ReactElement<{
        onFocus?: () => void;
        onBlur?: () => void;
        'aria-describedby'?: string;
    }>;
    /** Preferred placement of the tooltip relative to the trigger. Will flip if not enough space. */
    placement?: TooltipPlacement;
    /** Delay in ms before showing the tooltip */
    delay?: number;
    /** Whether the tooltip is disabled */
    disabled?: boolean;
    /** Controlled open state */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Additional class name for the tooltip content */
    className?: string;
    /** Maximum width of the tooltip in pixels. Set to 'none' for no limit. Default: 250 */
    maxWidth?: number | 'none';
    /** Offset from the trigger element in pixels. Default: 8 */
    offset?: number;
}
/**
 * An accessible tooltip component that displays on hover/focus.
 * Features smart positioning that automatically flips to avoid going off-screen.
 *
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 *
 * @example
 * ```tsx
 * // With multi-line content
 * <Tooltip content="This is a longer description that will wrap nicely" maxWidth={200}>
 *   <Button>Info</Button>
 * </Tooltip>
 * ```
 */
declare function Tooltip({ content, children, placement: preferredPlacement, delay, disabled, open: controlledOpen, onOpenChange, className, maxWidth, offset, }: TooltipProps): react_jsx_runtime.JSX.Element;
declare namespace Tooltip {
    var displayName: string;
}

export { Tooltip, type TooltipPlacement, type TooltipProps };
