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
  /** Width of the dropdown menu */
  width?: 'auto' | 'trigger' | number;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
}

const placementStyles: Record<DropdownPlacement, string> = {
  'bottom-start': 'top-full left-0 mt-2',
  'bottom-end': 'top-full right-0 mt-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
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
  width = 'auto',
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

  const widthStyle =
    typeof width === 'number'
      ? { width: `${width}px` }
      : width === 'trigger'
        ? { minWidth: '100%' }
        : {};

  return (
    <div ref={containerRef} className="relative inline-flex">
      {triggerElement}
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          style={widthStyle}
          className={cn(
            'absolute z-50 min-w-[12rem]',
            'rounded-xl border border-neutral-200 bg-white shadow-lg',
            'dark:border-neutral-700 dark:bg-neutral-800',
            'animate-in fade-in zoom-in-95 duration-100',
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

// ============================================================================
// Dropdown Header Component
// ============================================================================

export interface DropdownHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** Avatar element or image */
  avatar?: React.ReactNode;
  /** Primary text (e.g., user name) */
  title: React.ReactNode;
  /** Secondary text (e.g., email) */
  subtitle?: React.ReactNode;
}

/**
 * A header section for dropdown menus, typically used for user info.
 *
 * @example
 * ```tsx
 * <DropdownHeader
 *   avatar={<Avatar name="John Doe" />}
 *   title="John Doe"
 *   subtitle="john@example.com"
 * />
 * ```
 */
const DropdownHeader = React.forwardRef<HTMLDivElement, DropdownHeaderProps>(
  ({ className, avatar, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-b border-neutral-200 p-4 dark:border-neutral-700',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
              {title}
            </p>
            {subtitle && (
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }
);

DropdownHeader.displayName = 'DropdownHeader';

// ============================================================================
// Dropdown Content Component
// ============================================================================

export type DropdownContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A container for dropdown menu items with proper padding.
 */
const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-2', className)} {...props} />;
  }
);

DropdownContent.displayName = 'DropdownContent';

// ============================================================================
// Dropdown Item Component
// ============================================================================

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
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
          'transition-colors duration-150',
          'focus:outline-none',
          variant === 'default' && [
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-100 dark:hover:bg-neutral-700',
            'focus:bg-neutral-100 dark:focus:bg-neutral-700',
          ],
          variant === 'danger' && [
            'text-red-600 dark:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-900/20',
            'focus:bg-red-50 dark:focus:bg-red-900/20',
          ],
          className
        )}
        {...props}
      >
        {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
        <span className="font-medium">{children}</span>
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

// ============================================================================
// Dropdown Separator Component
// ============================================================================

/**
 * A separator between dropdown items.
 */
function DropdownSeparator({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        'border-t border-neutral-200 dark:border-neutral-700',
        className
      )}
    />
  );
}

DropdownSeparator.displayName = 'DropdownSeparator';

// ============================================================================
// Dropdown Label Component
// ============================================================================

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
        'px-3 py-1.5 text-xs font-semibold tracking-wider uppercase',
        'text-neutral-500 dark:text-neutral-400',
        className
      )}
    >
      {children}
    </div>
  );
}

DropdownLabel.displayName = 'DropdownLabel';

export {
  Dropdown,
  DropdownHeader,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
};
