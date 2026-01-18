import * as React from 'react';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'bottom';

export interface DropdownProps {
  /** The trigger element (usually a button) */
  trigger: React.ReactElement<{
    onClick?: () => void;
    disabled?: boolean;
    'aria-haspopup'?: string;
    'aria-expanded'?: boolean;
    'aria-controls'?: string;
  }>;
  /** Dropdown content */
  children: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Placement of the dropdown */
  placement?: DropdownPlacement;
  /** Additional class name for the dropdown menu */
  className?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
}

const placementStyles: Record<DropdownPlacement, string> = {
  'bottom-start': 'top-full left-0 mt-1',
  'bottom-end': 'top-full right-0 mt-1',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
};

/**
 * An accessible dropdown menu component.
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>Options</Button>}
 * >
 *   <DropdownItem onClick={() => console.log('Edit')}>Edit</DropdownItem>
 *   <DropdownItem onClick={() => console.log('Delete')} variant="danger">Delete</DropdownItem>
 * </Dropdown>
 * ```
 */
function Dropdown({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom-start',
  className,
  disabled = false,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

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

  const handleToggle = React.useCallback(() => {
    if (!disabled) {
      setOpen(!isOpen);
    }
  }, [disabled, isOpen, setOpen]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useClickOutside(containerRef, handleClose);
  useEscapeKey(handleClose, isOpen);

  // Clone trigger to add event handlers
  const triggerElement = React.cloneElement(trigger, {
    onClick: handleToggle,
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
    disabled: disabled || trigger.props.disabled,
  });

  return (
    <div ref={containerRef} className="relative inline-flex">
      {triggerElement}
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute z-50 min-w-[8rem] py-1',
            'bg-card border-border rounded-lg border shadow-lg',
            'animate-scale-in',
            placementStyles[placement],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

Dropdown.displayName = 'Dropdown';

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Danger variant for destructive actions */
  variant?: 'default' | 'danger';
}

/**
 * An item within a Dropdown menu.
 */
const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, variant = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="menuitem"
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
          'transition-colors duration-150',
          'focus:bg-muted focus:outline-none',
          variant === 'default' && ['text-foreground', 'hover:bg-muted'],
          variant === 'danger' && [
            'text-destructive',
            'hover:bg-destructive/10',
          ],
          className
        )}
        {...props}
      >
        {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

/**
 * A separator between dropdown items.
 */
function DropdownSeparator({ className }: { className?: string }) {
  return <hr className={cn('border-border my-1 border-t', className)} />;
}

DropdownSeparator.displayName = 'DropdownSeparator';

/**
 * A label/header for a group of dropdown items.
 */
function DropdownLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase',
        className
      )}
    >
      {children}
    </div>
  );
}

DropdownLabel.displayName = 'DropdownLabel';

export { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel };
