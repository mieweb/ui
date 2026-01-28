import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';

type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'bottom';
interface DropdownProps {
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
declare function Dropdown({ trigger, children, open: controlledOpen, onOpenChange, placement, className, width, disabled, }: DropdownProps): react_jsx_runtime.JSX.Element;
declare namespace Dropdown {
    var displayName: string;
}
interface DropdownHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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
declare const DropdownHeader: React.ForwardRefExoticComponent<DropdownHeaderProps & React.RefAttributes<HTMLDivElement>>;
type DropdownContentProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * A container for dropdown menu items with proper padding.
 */
declare const DropdownContent: React.ForwardRefExoticComponent<DropdownContentProps & React.RefAttributes<HTMLDivElement>>;
interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Icon to display before the label */
    icon?: React.ReactNode;
    /** Danger variant for destructive actions */
    variant?: 'default' | 'danger';
}
/**
 * An item within a Dropdown menu.
 */
declare const DropdownItem: React.ForwardRefExoticComponent<DropdownItemProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * A separator between dropdown items.
 */
declare function DropdownSeparator({ className }: {
    className?: string;
}): react_jsx_runtime.JSX.Element;
declare namespace DropdownSeparator {
    var displayName: string;
}
/**
 * A label/header for a group of dropdown items.
 */
declare function DropdownLabel({ className, children, }: {
    className?: string;
    children: React.ReactNode;
}): react_jsx_runtime.JSX.Element;
declare namespace DropdownLabel {
    var displayName: string;
}

export { Dropdown, DropdownContent, type DropdownContentProps, DropdownHeader, type DropdownHeaderProps, DropdownItem, type DropdownItemProps, DropdownLabel, type DropdownPlacement, type DropdownProps, DropdownSeparator };
