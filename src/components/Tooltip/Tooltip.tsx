import * as React from 'react';
import { cn } from '../../utils/cn';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
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

const placementStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles: Record<TooltipPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900 dark:border-t-neutral-100 border-x-transparent border-b-transparent',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900 dark:border-b-neutral-100 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-900 dark:border-l-neutral-100 border-y-transparent border-r-transparent',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-neutral-900 dark:border-r-neutral-100 border-y-transparent border-l-transparent',
};

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
function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = React.useId();
  const prefersReducedMotion = usePrefersReducedMotion();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const handleShow = React.useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  }, [disabled, delay, setOpen]);

  const handleHide = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
  }, [setOpen]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clone the child to add event handlers and aria attributes
  const trigger = React.cloneElement(children, {
    onMouseEnter: handleShow,
    onMouseLeave: handleHide,
    onFocus: handleShow,
    onBlur: handleHide,
    'aria-describedby': isOpen ? tooltipId : undefined,
  });

  return (
    <div className="relative inline-flex">
      {trigger}
      {isOpen && !disabled && (
        <div
          id={tooltipId}
          role="tooltip"
          aria-hidden={!isOpen}
          className={cn(
            'absolute z-50 px-2 py-1 text-sm',
            'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
            'rounded-md shadow-lg',
            'whitespace-nowrap',
            !prefersReducedMotion && 'animate-fade-in',
            placementStyles[placement],
            className
          )}
        >
          {content}
          <span
            className={cn('absolute h-0 w-0 border-4', arrowStyles[placement])}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

Tooltip.displayName = 'Tooltip';

export { Tooltip };
