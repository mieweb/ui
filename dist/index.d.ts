export { Alert, AlertDescription, AlertProps, AlertTitle, alertVariants } from './components/Alert/index.js';
export { Avatar, AvatarGroup, AvatarGroupProps, AvatarProps, avatarVariants, getInitials } from './components/Avatar/index.js';
export { Badge, BadgeProps, badgeVariants } from './components/Badge/index.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
export { Button, ButtonProps, buttonVariants } from './components/Button/index.js';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardProps, CardTitle, cardVariants } from './components/Card/index.js';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
export { DateInput, DateInputMode, DateInputProps } from './components/DateInput/index.js';
export { Dropdown, DropdownItem, DropdownItemProps, DropdownLabel, DropdownPlacement, DropdownProps, DropdownSeparator } from './components/Dropdown/index.js';
export { Input, InputProps, inputVariants } from './components/Input/index.js';
export { PhoneInput, PhoneInputProps } from './components/PhoneInput/index.js';
export { QuickAction, QuickActionColor, QuickActionGroup, QuickActionGroupProps, QuickActionIcons, QuickActionProps, quickActionIconVariants, quickActionVariants } from './components/QuickAction/index.js';
export { DateButton, DateButtonProps, DatePicker, DatePickerProps, RadioOption, RadioOptionProps, SchedulePicker, SchedulePickerProps, TimeButton, TimeButtonProps, TimePicker, TimePickerProps, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './components/SchedulePicker/index.js';
export { SmallMuted, Text, TextProps, textVariants } from './components/Text/index.js';
export { ThemeProvider, ThemeProviderContext, ThemeProviderContextValue, ThemeProviderProps, useThemeContext } from './components/ThemeProvider/index.js';
export { Tooltip, TooltipPlacement, TooltipProps } from './components/Tooltip/index.js';
export { VisuallyHidden, VisuallyHiddenProps } from './components/VisuallyHidden/index.js';
export { R as ResolvedTheme, T as Theme, u as useTheme } from './useTheme-B9SWu6ui.js';
export { useClickOutside, useEscapeKey, useFocusTrap, usePrefersReducedMotion } from './hooks/index.js';
export { calculateAge, cn, formatDateValue, formatPhoneNumber, isDateEmpty, isDateInFuture, isDateInPast, isPhoneNumberEmpty, isValidDate, isValidDrivingAge, isValidPhoneNumber, parseDateValue, unformatPhoneNumber } from './utils/index.js';
export { default as miewebUIPreset } from './tailwind-preset.js';
export { brands, defaultBrand, enterpriseHealthBrand, miewebBrand, webchartBrand } from './brands/index.js';
export { BrandBorderRadius, BrandBoxShadow, BrandColors, BrandConfig, BrandTypography, ColorScale, SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme } from './brands/types.js';
export { default as bluehiveBrand } from './brands/bluehive.js';
import 'clsx';

interface BreadcrumbItem {
    /** Label for the breadcrumb item */
    label: string;
    /** URL to navigate to (optional for the last item) */
    href?: string;
    /** Icon to display before the label */
    icon?: React.ReactNode;
}
interface BreadcrumbProps {
    /** Array of breadcrumb items */
    items: BreadcrumbItem[];
    /** Custom separator between items */
    separator?: React.ReactNode;
    /** Maximum items to display (collapses middle items) */
    maxItems?: number;
    /** Custom renderer for links */
    renderLink?: (item: BreadcrumbItem, index: number) => React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * A navigation breadcrumb component.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Category', href: '/products/category' },
 *     { label: 'Current Item' },
 *   ]}
 * />
 * ```
 */
declare function Breadcrumb({ items, separator, maxItems, renderLink, className, }: BreadcrumbProps): react_jsx_runtime.JSX.Element;
declare namespace Breadcrumb {
    var displayName: string;
}
declare function BreadcrumbSlash({ className }: {
    className?: string;
}): react_jsx_runtime.JSX.Element;

declare const checkboxVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, VariantProps<typeof checkboxVariants> {
    /** Label for the checkbox */
    label?: string;
    /** Description text below the label */
    description?: string;
    /** Indeterminate state (neither checked nor unchecked) */
    indeterminate?: boolean;
    /** Error message */
    error?: string;
    /** Position of the label */
    labelPosition?: 'left' | 'right';
}
/**
 * An accessible checkbox component with support for indeterminate state.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms and conditions" />
 * <Checkbox label="Newsletter" description="Receive updates about new features" />
 * <Checkbox indeterminate label="Select all" />
 * ```
 */
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
interface CheckboxGroupProps {
    /** Group label */
    label?: string;
    /** Description for the group */
    description?: string;
    /** Error message for the group */
    error?: string;
    /** Orientation of checkboxes */
    orientation?: 'horizontal' | 'vertical';
    /** Children checkboxes */
    children: React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * A container for grouping related checkboxes.
 *
 * @example
 * ```tsx
 * <CheckboxGroup label="Interests" orientation="vertical">
 *   <Checkbox label="Sports" />
 *   <Checkbox label="Music" />
 *   <Checkbox label="Travel" />
 * </CheckboxGroup>
 * ```
 */
declare function CheckboxGroup({ label, description, error, orientation, children, className, }: CheckboxGroupProps): react_jsx_runtime.JSX.Element;
declare namespace CheckboxGroup {
    var displayName: string;
}

declare const modalOverlayVariants: (props?: ({} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const modalContentVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ModalProps extends VariantProps<typeof modalContentVariants> {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onOpenChange: (open: boolean) => void;
    /** Modal content */
    children: React.ReactNode;
    /** Whether to close when clicking the overlay */
    closeOnOverlayClick?: boolean;
    /** Whether to close when pressing Escape */
    closeOnEscape?: boolean;
    /** Additional class name for the modal content */
    className?: string;
    /** ID for the modal, used for accessibility */
    id?: string;
    /** Accessible label for the modal */
    'aria-label'?: string;
    /** ID of the element that labels the modal */
    'aria-labelledby'?: string;
    /** ID of the element that describes the modal */
    'aria-describedby'?: string;
}
/**
 * An accessible modal/dialog component.
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onOpenChange={setIsOpen} size="lg">
 *   <ModalHeader>
 *     <ModalTitle>Confirm Action</ModalTitle>
 *     <ModalClose />
 *   </ModalHeader>
 *   <ModalBody>
 *     Are you sure you want to continue?
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
declare function Modal({ open, onOpenChange, children, size, closeOnOverlayClick, closeOnEscape, className, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, }: ModalProps): react_jsx_runtime.JSX.Element | null;
declare namespace Modal {
    var displayName: string;
}
type ModalHeaderProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Header section of a Modal.
 */
declare const ModalHeader: React.ForwardRefExoticComponent<ModalHeaderProps & React.RefAttributes<HTMLDivElement>>;
type ModalTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
/**
 * Title for a Modal.
 */
declare const ModalTitle: React.ForwardRefExoticComponent<ModalTitleProps & React.RefAttributes<HTMLHeadingElement>>;
type ModalCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
/**
 * Close button for a Modal.
 */
declare const ModalClose: React.ForwardRefExoticComponent<ModalCloseProps & React.RefAttributes<HTMLButtonElement>>;
type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Main content area of a Modal.
 */
declare const ModalBody: React.ForwardRefExoticComponent<ModalBodyProps & React.RefAttributes<HTMLDivElement>>;
type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Footer section of a Modal, typically for action buttons.
 */
declare const ModalFooter: React.ForwardRefExoticComponent<ModalFooterProps & React.RefAttributes<HTMLDivElement>>;

declare const paginationButtonVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface PaginationProps extends VariantProps<typeof paginationButtonVariants> {
    /** Current page (1-indexed) */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Number of sibling pages to show on each side of current page */
    siblingCount?: number;
    /** Show first/last page buttons */
    showFirstLast?: boolean;
    /** Show prev/next buttons */
    showPrevNext?: boolean;
    /** Labels for navigation buttons */
    labels?: {
        first?: string;
        previous?: string;
        next?: string;
        last?: string;
    };
    /** Additional class name */
    className?: string;
}
/**
 * A pagination component for navigating through pages.
 *
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={10}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 */
declare function Pagination({ page, totalPages, onPageChange, siblingCount, showFirstLast, showPrevNext, variant, size, labels, className, }: PaginationProps): react_jsx_runtime.JSX.Element;
declare namespace Pagination {
    var displayName: string;
}
interface SimplePaginationProps extends VariantProps<typeof paginationButtonVariants> {
    /** Current page */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Show page info */
    showPageInfo?: boolean;
    /** Additional class name */
    className?: string;
}
/**
 * A simple pagination with just prev/next buttons.
 *
 * @example
 * ```tsx
 * <SimplePagination
 *   page={1}
 *   totalPages={10}
 *   onPageChange={setPage}
 *   showPageInfo
 * />
 * ```
 */
declare function SimplePagination({ page, totalPages, onPageChange, showPageInfo, variant, size, className, }: SimplePaginationProps): react_jsx_runtime.JSX.Element;
declare namespace SimplePagination {
    var displayName: string;
}

declare const progressBarTrackVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const progressBarFillVariants: (props?: ({
    variant?: "default" | "success" | "warning" | "danger" | null | undefined;
    animated?: boolean | null | undefined;
    striped?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ProgressProps extends VariantProps<typeof progressBarTrackVariants>, VariantProps<typeof progressBarFillVariants> {
    /** Current progress value (0-100) */
    value: number;
    /** Maximum value (default: 100) */
    max?: number;
    /** Label for the progress bar */
    label?: string;
    /** Show the percentage value */
    showValue?: boolean;
    /** Format the displayed value */
    formatValue?: (value: number, max: number) => string;
    /** Additional class name */
    className?: string;
    /** Whether the progress is indeterminate */
    indeterminate?: boolean;
}
/**
 * A progress bar component for showing completion status.
 *
 * @example
 * ```tsx
 * <Progress value={60} />
 * <Progress value={75} showValue label="Upload progress" />
 * <Progress value={30} variant="success" striped />
 * ```
 */
declare function Progress({ value, max, label, showValue, formatValue, size, variant, animated, striped, className, indeterminate, }: ProgressProps): react_jsx_runtime.JSX.Element;
declare namespace Progress {
    var displayName: string;
}
declare const circularProgressVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CircularProgressProps extends VariantProps<typeof circularProgressVariants> {
    /** Current progress value (0-100) */
    value: number;
    /** Maximum value (default: 100) */
    max?: number;
    /** Color variant */
    variant?: 'default' | 'success' | 'warning' | 'danger';
    /** Stroke width */
    strokeWidth?: number;
    /** Show the percentage value in the center */
    showValue?: boolean;
    /** Whether the progress is indeterminate */
    indeterminate?: boolean;
    /** Additional class name */
    className?: string;
}
/**
 * A circular progress indicator component.
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} showValue />
 * <CircularProgress value={50} variant="success" size="lg" />
 * ```
 */
declare function CircularProgress({ value, max, variant, size, strokeWidth, showValue, indeterminate, className, }: CircularProgressProps): react_jsx_runtime.JSX.Element;
declare namespace CircularProgress {
    var displayName: string;
}

declare const radioVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface RadioGroupProps {
    /** Group name (required for native form behavior) */
    name?: string;
    /** Controlled value */
    value?: string;
    /** Default value (uncontrolled) */
    defaultValue?: string;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Group label */
    label?: string;
    /** Description for the group */
    description?: string;
    /** Error message */
    error?: string;
    /** Whether all radios are disabled */
    disabled?: boolean;
    /** Size of all radios */
    size?: 'sm' | 'md' | 'lg';
    /** Orientation of radio items */
    orientation?: 'horizontal' | 'vertical';
    /** Children radio items */
    children: React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * A radio group component for selecting one option from a set.
 *
 * @example
 * ```tsx
 * <RadioGroup name="plan" label="Select a plan" onValueChange={setPlan}>
 *   <Radio value="free" label="Free" />
 *   <Radio value="pro" label="Pro" />
 *   <Radio value="enterprise" label="Enterprise" />
 * </RadioGroup>
 * ```
 */
declare function RadioGroup({ name, value: controlledValue, defaultValue, onValueChange, label, description, error, disabled, size, orientation, children, className, }: RadioGroupProps): react_jsx_runtime.JSX.Element;
declare namespace RadioGroup {
    var displayName: string;
}
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, VariantProps<typeof radioVariants> {
    /** Value for this radio option */
    value: string;
    /** Label for the radio */
    label?: string;
    /** Description text below the label */
    description?: string;
    /** Position of the label */
    labelPosition?: 'left' | 'right';
}
/**
 * An individual radio item within a RadioGroup.
 *
 * @example
 * ```tsx
 * <Radio value="option1" label="Option 1" />
 * <Radio value="option2" label="Option 2" description="Additional details" />
 * ```
 */
declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;

interface SelectOption {
    /** Unique value for the option */
    value: string;
    /** Display label for the option */
    label: string;
    /** Whether the option is disabled */
    disabled?: boolean;
    /** Optional group this option belongs to */
    group?: string;
}
interface SelectGroup {
    /** Group label */
    label: string;
    /** Options in this group */
    options: SelectOption[];
}
declare const selectTriggerVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    hasError?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
    /** Array of options or groups */
    options: (SelectOption | SelectGroup)[];
    /** Controlled value */
    value?: string;
    /** Default value (uncontrolled) */
    defaultValue?: string;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Label for the select */
    label?: string;
    /** Hide the label visually */
    hideLabel?: boolean;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Enable search/filter */
    searchable?: boolean;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** No results text */
    noResultsText?: string;
    /** Additional class name */
    className?: string;
    /** ID for the select */
    id?: string;
}
/**
 * An accessible select/dropdown component with search support.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 *   onValueChange={(value) => console.log(value)}
 * />
 * ```
 */
declare function Select({ options, value: controlledValue, defaultValue, onValueChange, placeholder, disabled, label, hideLabel, error, helperText, size, hasError, searchable, searchPlaceholder, noResultsText, className, id, }: SelectProps): react_jsx_runtime.JSX.Element;
declare namespace Select {
    var displayName: string;
}

declare const skeletonVariants: (props?: ({
    variant?: "default" | "title" | "button" | "text" | "image" | "avatar" | "card" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
    /** Width of the skeleton */
    width?: string | number;
    /** Height of the skeleton */
    height?: string | number;
    /** Whether to render as a circle */
    circle?: boolean;
}
/**
 * A skeleton loading placeholder component.
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="60%" />
 * <Skeleton variant="avatar" width={40} height={40} />
 * <Skeleton variant="card" />
 * ```
 */
declare function Skeleton({ className, variant, width, height, circle, style, ...props }: SkeletonProps): react_jsx_runtime.JSX.Element;
declare namespace Skeleton {
    var displayName: string;
}
interface SkeletonTextProps {
    /** Number of lines to display */
    lines?: number;
    /** Width of the last line (for varying line lengths) */
    lastLineWidth?: string;
    /** Gap between lines */
    gap?: 'sm' | 'md' | 'lg';
    /** Additional class name */
    className?: string;
}
/**
 * A skeleton for text content with multiple lines.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} lastLineWidth="60%" />
 * ```
 */
declare function SkeletonText({ lines, lastLineWidth, gap, className, }: SkeletonTextProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonText {
    var displayName: string;
}
interface SkeletonCardProps {
    /** Show image placeholder */
    showImage?: boolean;
    /** Show avatar placeholder */
    showAvatar?: boolean;
    /** Number of text lines */
    textLines?: number;
    /** Additional class name */
    className?: string;
}
/**
 * A skeleton for card-like content.
 *
 * @example
 * ```tsx
 * <SkeletonCard showImage showAvatar textLines={2} />
 * ```
 */
declare function SkeletonCard({ showImage, showAvatar, textLines, className, }: SkeletonCardProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonCard {
    var displayName: string;
}
interface SkeletonTableProps {
    /** Number of rows */
    rows?: number;
    /** Number of columns */
    columns?: number;
    /** Additional class name */
    className?: string;
}
/**
 * A skeleton for table content.
 *
 * @example
 * ```tsx
 * <SkeletonTable rows={5} columns={4} />
 * ```
 */
declare function SkeletonTable({ rows, columns, className, }: SkeletonTableProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonTable {
    var displayName: string;
}

declare const spinnerVariants: (props?: ({
    size?: "xs" | "sm" | "md" | "lg" | "xl" | null | undefined;
    variant?: "default" | "white" | "muted" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
    /** Accessible label for the spinner */
    label?: string;
}
/**
 * A loading spinner component.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="Loading data..." />
 * <Spinner variant="white" /> // For use on dark backgrounds
 * ```
 */
declare function Spinner({ className, size, variant, label, ...props }: SpinnerProps): react_jsx_runtime.JSX.Element;
declare namespace Spinner {
    var displayName: string;
}
interface SpinnerWithLabelProps extends SpinnerProps {
    /** Label text to display */
    label: string;
    /** Position of the label */
    labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}
/**
 * A spinner with a visible label.
 *
 * @example
 * ```tsx
 * <SpinnerWithLabel label="Loading..." />
 * <SpinnerWithLabel label="Processing" labelPosition="right" />
 * ```
 */
declare function SpinnerWithLabel({ label, labelPosition, size, variant, className, ...props }: SpinnerWithLabelProps): react_jsx_runtime.JSX.Element;
declare namespace SpinnerWithLabel {
    var displayName: string;
}
interface FullPageSpinnerProps extends SpinnerProps {
    /** Whether to show a backdrop */
    backdrop?: boolean;
    /** Text to display below the spinner */
    text?: string;
}
/**
 * A full-page loading spinner with optional backdrop.
 *
 * @example
 * ```tsx
 * <FullPageSpinner />
 * <FullPageSpinner backdrop text="Loading your data..." />
 * ```
 */
declare function FullPageSpinner({ backdrop, text, size, ...props }: FullPageSpinnerProps): react_jsx_runtime.JSX.Element;
declare namespace FullPageSpinner {
    var displayName: string;
}

declare const switchTrackVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const switchThumbVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>, VariantProps<typeof switchTrackVariants> {
    /** Controlled checked state */
    checked?: boolean;
    /** Default checked state (uncontrolled) */
    defaultChecked?: boolean;
    /** Callback when checked state changes */
    onCheckedChange?: (checked: boolean) => void;
    /** Label for the switch */
    label?: string;
    /** Description text */
    description?: string;
    /** Position of the label */
    labelPosition?: 'left' | 'right';
    /** ID for the switch */
    id?: string;
}
/**
 * An accessible toggle switch component.
 *
 * @example
 * ```tsx
 * <Switch label="Enable notifications" />
 * <Switch
 *   label="Dark mode"
 *   description="Toggle between light and dark theme"
 * />
 * ```
 */
declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>;

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    /** Whether to make the table responsive with horizontal scroll */
    responsive?: boolean;
}
/**
 * An accessible table component.
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Email</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>John Doe</TableCell>
 *       <TableCell>john@example.com</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
declare const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableHeader: React.ForwardRefExoticComponent<TableHeaderProps & React.RefAttributes<HTMLTableSectionElement>>;
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableBody: React.ForwardRefExoticComponent<TableBodyProps & React.RefAttributes<HTMLTableSectionElement>>;
type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;
declare const TableFooter: React.ForwardRefExoticComponent<TableFooterProps & React.RefAttributes<HTMLTableSectionElement>>;
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    /** Whether the row is selected */
    selected?: boolean;
}
declare const TableRow: React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>;
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    /** Sortable column configuration */
    sortable?: boolean;
    /** Current sort direction */
    sortDirection?: 'asc' | 'desc' | null;
    /** Callback when sort is triggered */
    onSort?: () => void;
}
declare const TableHead: React.ForwardRefExoticComponent<TableHeadProps & React.RefAttributes<HTMLTableCellElement>>;
type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
declare const TableCell: React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>;
type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;
declare const TableCaption: React.ForwardRefExoticComponent<TableCaptionProps & React.RefAttributes<HTMLTableCaptionElement>>;

interface TabsProps {
    /** The controlled value of the selected tab */
    value?: string;
    /** The default value of the selected tab (uncontrolled) */
    defaultValue?: string;
    /** Callback when the selected tab changes */
    onValueChange?: (value: string) => void;
    /** Visual variant of the tabs */
    variant?: 'underline' | 'pills' | 'enclosed';
    /** Tab content */
    children: React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * Accessible tabs component with keyboard navigation.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 */
declare function Tabs({ value: controlledValue, defaultValue, onValueChange, variant, children, className, }: TabsProps): react_jsx_runtime.JSX.Element;
declare namespace Tabs {
    var displayName: string;
}
declare const tabsListVariants: (props?: ({
    variant?: "underline" | "pills" | "enclosed" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
type TabsListProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Container for tab triggers.
 */
declare const TabsList: React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>>;
declare const tabsTriggerVariants: (props?: ({
    variant?: "underline" | "pills" | "enclosed" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** The value that identifies this tab */
    value: string;
    /** Icon to show before the label */
    icon?: React.ReactNode;
}
/**
 * A tab trigger button.
 */
declare const TabsTrigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>;
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The value that identifies this content panel */
    value: string;
    /** Force mount the content (useful for animations) */
    forceMount?: boolean;
}
/**
 * Content panel for a tab.
 */
declare const TabsContent: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>;

declare const textareaVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    hasError?: boolean | null | undefined;
    resize?: "none" | "both" | "horizontal" | "vertical" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>, VariantProps<typeof textareaVariants> {
    /** Label for the textarea */
    label?: string;
    /** Whether the label should be visually hidden */
    hideLabel?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display */
    helperText?: string;
    /** Maximum character count */
    maxLength?: number;
    /** Show character count */
    showCount?: boolean;
    /** Auto-resize based on content */
    autoResize?: boolean;
}
/**
 * A multi-line text input component with character count and auto-resize.
 *
 * @example
 * ```tsx
 * <Textarea label="Description" placeholder="Enter a description..." />
 * <Textarea
 *   label="Bio"
 *   maxLength={280}
 *   showCount
 *   helperText="Tell us about yourself"
 * />
 * ```
 */
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps, BreadcrumbSlash, Checkbox, CheckboxGroup, type CheckboxGroupProps, type CheckboxProps, CircularProgress, type CircularProgressProps, FullPageSpinner, type FullPageSpinnerProps, Modal, ModalBody, type ModalBodyProps, ModalClose, type ModalCloseProps, ModalFooter, type ModalFooterProps, ModalHeader, type ModalHeaderProps, type ModalProps, ModalTitle, type ModalTitleProps, Pagination, type PaginationProps, Progress, type ProgressProps, Radio, RadioGroup, type RadioGroupProps, type RadioProps, Select, type SelectGroup, type SelectOption, type SelectProps, SimplePagination, type SimplePaginationProps, Skeleton, SkeletonCard, type SkeletonCardProps, type SkeletonProps, SkeletonTable, type SkeletonTableProps, SkeletonText, type SkeletonTextProps, Spinner, type SpinnerProps, SpinnerWithLabel, type SpinnerWithLabelProps, Switch, type SwitchProps, Table, TableBody, type TableBodyProps, TableCaption, type TableCaptionProps, TableCell, type TableCellProps, TableFooter, type TableFooterProps, TableHead, type TableHeadProps, TableHeader, type TableHeaderProps, type TableProps, TableRow, type TableRowProps, Tabs, TabsContent, type TabsContentProps, TabsList, type TabsListProps, type TabsProps, TabsTrigger, type TabsTriggerProps, Textarea, type TextareaProps, checkboxVariants, circularProgressVariants, modalContentVariants, modalOverlayVariants, paginationButtonVariants, progressBarFillVariants, progressBarTrackVariants, radioVariants, selectTriggerVariants, skeletonVariants, spinnerVariants, switchThumbVariants, switchTrackVariants, tabsListVariants, tabsTriggerVariants, textareaVariants };
