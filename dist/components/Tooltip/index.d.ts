import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
interface TooltipProps {
    /** The content to display in the tooltip */
    content: React.ReactNode;
    /** The element that triggers the tooltip */
    children: React.ReactElement<{
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
        onFocus?: () => void;
        onBlur?: () => void;
        'aria-describedby'?: string;
    }>;
    /** Placement of the tooltip relative to the trigger */
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
}
/**
 * An accessible tooltip component that displays on hover/focus.
 *
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
declare function Tooltip({ content, children, placement, delay, disabled, open: controlledOpen, onOpenChange, className, }: TooltipProps): react_jsx_runtime.JSX.Element;
declare namespace Tooltip {
    var displayName: string;
}

export { Tooltip, type TooltipPlacement, type TooltipProps };
