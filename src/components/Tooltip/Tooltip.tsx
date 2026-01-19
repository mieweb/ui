import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
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

const DEFAULT_OFFSET = 8;
const VIEWPORT_PADDING = 8;

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
function Tooltip({
  content,
  children,
  placement: preferredPlacement = 'top',
  delay = 200,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className,
  maxWidth = 250,
  offset = DEFAULT_OFFSET,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
    actualPlacement: TooltipPlacement;
    arrowOffset: number;
  } | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const showTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isHoveringRef = React.useRef(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
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

  const clearTimeouts = React.useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Calculate optimal position for tooltip
  const calculatePosition = React.useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Helper to check if placement fits
    const fitsPlacement = (p: TooltipPlacement): boolean => {
      switch (p) {
        case 'top':
          return (
            triggerRect.top - tooltipRect.height - offset >= VIEWPORT_PADDING
          );
        case 'bottom':
          return (
            triggerRect.bottom + tooltipRect.height + offset <=
            viewportHeight - VIEWPORT_PADDING
          );
        case 'left':
          return (
            triggerRect.left - tooltipRect.width - offset >= VIEWPORT_PADDING
          );
        case 'right':
          return (
            triggerRect.right + tooltipRect.width + offset <=
            viewportWidth - VIEWPORT_PADDING
          );
      }
    };

    // Determine actual placement (flip if preferred doesn't fit)
    let actualPlacement = preferredPlacement;
    if (!fitsPlacement(preferredPlacement)) {
      const opposites: Record<TooltipPlacement, TooltipPlacement> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
      };
      const opposite = opposites[preferredPlacement];
      if (fitsPlacement(opposite)) {
        actualPlacement = opposite;
      } else {
        // Try perpendicular placements
        const perpendicular: TooltipPlacement[] =
          preferredPlacement === 'top' || preferredPlacement === 'bottom'
            ? ['right', 'left']
            : ['bottom', 'top'];
        for (const p of perpendicular) {
          if (fitsPlacement(p)) {
            actualPlacement = p;
            break;
          }
        }
      }
    }

    // Calculate base position
    let top = 0;
    let left = 0;
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;

    switch (actualPlacement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerCenterX - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerCenterX - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerCenterY - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = triggerCenterY - tooltipRect.height / 2;
        left = triggerRect.right + offset;
        break;
    }

    // Calculate arrow offset for when tooltip is constrained
    let arrowOffset = 0;
    const idealLeft = left;

    // Constrain to viewport (horizontal)
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    } else if (left + tooltipRect.width > viewportWidth - VIEWPORT_PADDING) {
      left = viewportWidth - tooltipRect.width - VIEWPORT_PADDING;
    }

    // Calculate arrow offset based on how much we shifted
    if (actualPlacement === 'top' || actualPlacement === 'bottom') {
      arrowOffset = idealLeft - left;
    }

    // Constrain to viewport (vertical)
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    } else if (top + tooltipRect.height > viewportHeight - VIEWPORT_PADDING) {
      top = viewportHeight - tooltipRect.height - VIEWPORT_PADDING;
    }

    setPosition({ top, left, actualPlacement, arrowOffset });
  }, [preferredPlacement, offset]);

  // Detect dark mode from document
  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for class changes on document
    const observer = new window.MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Recalculate position when open or on scroll/resize
  React.useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    // Initial calculation after render
    const rafId = window.requestAnimationFrame(() => {
      calculatePosition();
    });

    // Recalculate on scroll/resize
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  const handleMouseEnter = React.useCallback(() => {
    if (disabled) return;
    isHoveringRef.current = true;
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        setOpen(true);
      }
    }, delay);
  }, [disabled, delay, setOpen, clearTimeouts]);

  const handleMouseLeave = React.useCallback(() => {
    isHoveringRef.current = false;
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setOpen(false);
      }
    }, 100);
  }, [setOpen, clearTimeouts]);

  const handleFocus = React.useCallback(() => {
    if (disabled) return;
    clearTimeouts();
    setOpen(true);
  }, [disabled, setOpen, clearTimeouts]);

  const handleBlur = React.useCallback(() => {
    clearTimeouts();
    setOpen(false);
  }, [setOpen, clearTimeouts]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Clone the child to add aria attributes and focus handlers
  const trigger = React.cloneElement(children, {
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-describedby': isOpen ? tooltipId : undefined,
  });

  // Arrow styles based on actual placement - using inline styles for border triangle
  // Arrow color matches tooltip background (neutral-900 in light mode, neutral-100 in dark mode)
  const getArrowStyle = (isDark: boolean): React.CSSProperties => {
    if (!position) return {};
    const { actualPlacement, arrowOffset } = position;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
      // Must use content-box for CSS border triangle to work (Tailwind sets border-box globally)
      boxSizing: 'content-box',
    };

    const arrowSize = 5;
    // Match tooltip background colors: bg-neutral-900 (#171717) / dark:bg-neutral-100 (#f5f5f5)
    const arrowColor = isDark ? '#f5f5f5' : '#171717';

    // Use arrowSize for positioning to create slight overlap with tooltip body
    const arrowOffset2 = arrowSize;

    switch (actualPlacement) {
      case 'top':
        return {
          ...baseStyle,
          bottom: -arrowOffset2,
          left: `calc(50% + ${arrowOffset}px)`,
          transform: 'translateX(-50%)',
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: `${arrowColor} transparent transparent transparent`,
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: -arrowOffset2,
          left: `calc(50% + ${arrowOffset}px)`,
          transform: 'translateX(-50%)',
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent ${arrowColor} transparent`,
        };
      case 'left':
        return {
          ...baseStyle,
          right: -arrowOffset2,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent transparent ${arrowColor}`,
        };
      case 'right':
        return {
          ...baseStyle,
          left: -arrowOffset2,
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
          borderColor: `transparent ${arrowColor} transparent transparent`,
        };
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}
      {isOpen &&
        !disabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            aria-hidden={!isOpen}
            style={{
              position: 'fixed',
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              maxWidth: maxWidth === 'none' ? undefined : maxWidth,
              visibility: position ? 'visible' : 'hidden',
              // Use inline styles to ensure they work in portals (rendered outside React tree)
              backgroundColor: isDarkMode ? '#f5f5f5' : '#171717', // neutral-100 / neutral-900
              color: isDarkMode ? '#171717' : '#ffffff', // neutral-900 / white
              fontFamily:
                'var(--mieweb-font-sans, ui-sans-serif, system-ui, sans-serif)',
            }}
            className={cn(
              'pointer-events-none z-[9999] px-3 py-1.5 text-xs',
              'rounded-md shadow-md',
              'leading-normal font-semibold',
              !prefersReducedMotion && position && 'animate-fade-in',
              className
            )}
          >
            {content}
            {position && (
              <span style={getArrowStyle(isDarkMode)} aria-hidden="true" />
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

Tooltip.displayName = 'Tooltip';

export { Tooltip };
