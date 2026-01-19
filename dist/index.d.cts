export { Alert, AlertDescription, AlertProps, AlertTitle, alertVariants } from './components/Alert/index.cjs';
import React__default, { ReactNode } from 'react';
export { Avatar, AvatarGroup, AvatarGroupProps, AvatarProps, avatarVariants, getInitials } from './components/Avatar/index.cjs';
export { Badge, BadgeProps, badgeVariants } from './components/Badge/index.cjs';
export { Breadcrumb, BreadcrumbItem, BreadcrumbProps, BreadcrumbSlash } from './components/Breadcrumb/index.cjs';
export { Button, ButtonProps, buttonVariants } from './components/Button/index.cjs';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardProps, CardTitle, cardVariants } from './components/Card/index.cjs';
export { Checkbox, CheckboxGroup, CheckboxGroupProps, CheckboxProps, checkboxVariants } from './components/Checkbox/index.cjs';
export { DateInput, DateInputMode, DateInputProps } from './components/DateInput/index.cjs';
export { Dropdown, DropdownContent, DropdownContentProps, DropdownHeader, DropdownHeaderProps, DropdownItem, DropdownItemProps, DropdownLabel, DropdownPlacement, DropdownProps, DropdownSeparator } from './components/Dropdown/index.cjs';
export { Input, InputProps, inputVariants } from './components/Input/index.cjs';
export { Modal, ModalBody, ModalBodyProps, ModalClose, ModalCloseProps, ModalFooter, ModalFooterProps, ModalHeader, ModalHeaderProps, ModalProps, ModalTitle, ModalTitleProps, modalContentVariants, modalOverlayVariants } from './components/Modal/index.cjs';
export { Pagination, PaginationProps, SimplePagination, SimplePaginationProps, paginationButtonVariants } from './components/Pagination/index.cjs';
export { PhoneInput, PhoneInputProps } from './components/PhoneInput/index.cjs';
export { CircularProgress, CircularProgressProps, Progress, ProgressProps, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants } from './components/Progress/index.cjs';
export { QuickAction, QuickActionColor, QuickActionGroup, QuickActionGroupProps, QuickActionIcons, QuickActionProps, quickActionIconVariants, quickActionVariants } from './components/QuickAction/index.cjs';
export { Radio, RadioGroup, RadioGroupProps, RadioProps, radioVariants } from './components/Radio/index.cjs';
export { DateButton, DateButtonProps, DatePicker, DatePickerProps, RadioOption, RadioOptionProps, SchedulePicker, SchedulePickerProps, TimeButton, TimeButtonProps, TimePicker, TimePickerProps, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './components/SchedulePicker/index.cjs';
export { Select, SelectGroup, SelectOption, SelectProps, selectTriggerVariants } from './components/Select/index.cjs';
export { Skeleton, SkeletonCard, SkeletonCardProps, SkeletonProps, SkeletonTable, SkeletonTableProps, SkeletonText, SkeletonTextProps, skeletonVariants } from './components/Skeleton/index.cjs';
export { FullPageSpinner, FullPageSpinnerProps, Spinner, SpinnerProps, SpinnerWithLabel, SpinnerWithLabelProps, spinnerVariants } from './components/Spinner/index.cjs';
export { Switch, SwitchProps, switchThumbVariants, switchTrackVariants } from './components/Switch/index.cjs';
export { Table, TableBody, TableBodyProps, TableCaption, TableCaptionProps, TableCell, TableCellProps, TableFooter, TableFooterProps, TableHead, TableHeadProps, TableHeader, TableHeaderProps, TableProps, TableRow, TableRowProps } from './components/Table/index.cjs';
export { Tabs, TabsContent, TabsContentProps, TabsList, TabsListProps, TabsProps, TabsTrigger, TabsTriggerProps, tabsListVariants, tabsTriggerVariants } from './components/Tabs/index.cjs';
export { SmallMuted, Text, TextProps, textVariants } from './components/Text/index.cjs';
export { Textarea, TextareaProps, textareaVariants } from './components/Textarea/index.cjs';
export { ThemeProvider, ThemeProviderContext, ThemeProviderContextValue, ThemeProviderProps, ThemeToggle, ThemeToggleProps, themeToggleIconVariants, themeToggleVariants, useThemeContext } from './components/ThemeProvider/index.cjs';
export { Tooltip, TooltipPlacement, TooltipProps } from './components/Tooltip/index.cjs';
export { VisuallyHidden, VisuallyHiddenProps } from './components/VisuallyHidden/index.cjs';
export { R as ResolvedTheme, T as Theme, u as useTheme } from './useTheme-B9SWu6ui.cjs';
export { KeyboardShortcutOptions, useClickOutside, useCommandK, useEscapeKey, useFocusTrap, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery, usePrefersReducedMotion } from './hooks/index.cjs';
export { calculateAge, cn, formatDateValue, formatPhoneNumber, isDateEmpty, isDateInFuture, isDateInPast, isPhoneNumberEmpty, isValidDate, isValidDrivingAge, isValidPhoneNumber, parseDateValue, unformatPhoneNumber } from './utils/index.cjs';
export { default as miewebUIPreset, miewebUISafelist } from './tailwind-preset.cjs';
export { brands, defaultBrand, enterpriseHealthBrand, miewebBrand, wagglelineBrand, webchartBrand } from './brands/index.cjs';
export { BrandBorderRadius, BrandBoxShadow, BrandColors, BrandConfig, BrandTypography, ColorScale, SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme } from './brands/types.cjs';
export { default as bluehiveBrand } from './brands/bluehive.cjs';
import 'class-variance-authority/types';
import 'class-variance-authority';
import 'react/jsx-runtime';
import 'clsx';

interface AppHeaderProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether the header is sticky (default: true) */
    sticky?: boolean;
    /** Whether to show border (default: true) */
    bordered?: boolean;
    /** Custom height class (default: 'h-16') */
    height?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeader({ children, className, sticky, bordered, height, 'data-testid': testId, }: AppHeaderProps): React__default.JSX.Element;
interface AppHeaderSectionProps {
    children: ReactNode;
    /** Section alignment */
    align?: 'left' | 'center' | 'right';
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderSection({ children, align, className, }: AppHeaderSectionProps): React__default.JSX.Element;
interface AppHeaderTitleProps {
    children: ReactNode;
    /** Optional subtitle */
    subtitle?: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderTitle({ children, subtitle, className, }: AppHeaderTitleProps): React__default.JSX.Element;
interface AppHeaderActionsProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderActions({ children, className }: AppHeaderActionsProps): React__default.JSX.Element;
interface AppHeaderDividerProps {
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderDivider({ className }: AppHeaderDividerProps): React__default.JSX.Element;
interface AppHeaderIconButtonProps {
    /** Button icon */
    icon: ReactNode;
    /** Accessible label */
    label: string;
    /** Click handler */
    onClick?: () => void;
    /** Badge count */
    badge?: number;
    /** Whether the button is active */
    isActive?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderIconButton({ icon, label, onClick, badge, isActive, className, 'data-testid': testId, }: AppHeaderIconButtonProps): React__default.JSX.Element;
interface AppHeaderSearchProps {
    /** Click handler to open search */
    onClick?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether to show on mobile (default: false) */
    showOnMobile?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderSearch({ onClick, placeholder, showOnMobile, className, 'data-testid': testId, }: AppHeaderSearchProps): React__default.JSX.Element;
interface AppHeaderUserMenuProps {
    /** User's name */
    name: string;
    /** User's email or subtitle */
    email?: string;
    /** User's avatar URL */
    avatarUrl?: string;
    /** Fallback initials when no avatar */
    initials?: string;
    /** Whether the menu is open */
    isOpen?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderUserMenu({ name, email, avatarUrl, initials, isOpen, onClick, className, 'data-testid': testId, }: AppHeaderUserMenuProps): React__default.JSX.Element;

interface CommandPaletteItem {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Optional description text */
    description?: string;
    /** Category/group for grouping items */
    category?: string;
    /** Custom icon element */
    icon?: ReactNode;
    /** Keyboard shortcut hint */
    shortcut?: string;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Additional metadata for filtering/display */
    metadata?: Record<string, unknown>;
}
interface CommandPaletteCategory {
    /** Unique identifier for the category */
    id: string;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: ReactNode;
    /** Optional color class for styling */
    colorClass?: string;
}
interface CommandPaletteContextValue {
    /** Whether the palette is currently open */
    isOpen: boolean;
    /** Open the command palette */
    open: () => void;
    /** Close the command palette */
    close: () => void;
    /** Toggle the command palette */
    toggle: () => void;
    /** Current search query */
    query: string;
    /** Set the search query */
    setQuery: (query: string) => void;
    /** Currently selected item index */
    selectedIndex: number;
    /** Set the selected item index */
    setSelectedIndex: (index: number) => void;
    /** Active category filter */
    activeCategory: string | null;
    /** Set the active category filter */
    setActiveCategory: (category: string | null) => void;
    /** Register items (used by consumers) */
    items: CommandPaletteItem[];
    /** Register categories (used by consumers) */
    categories: CommandPaletteCategory[];
    /** Set items */
    setItems: (items: CommandPaletteItem[]) => void;
    /** Set categories */
    setCategories: (categories: CommandPaletteCategory[]) => void;
}
interface CommandPaletteProviderProps {
    children: ReactNode;
    /** Whether to enable the Cmd/Ctrl+K shortcut (default: true) */
    enableShortcut?: boolean;
    /** Custom event name for opening (for integration with other systems) */
    customEventName?: string;
}
declare function CommandPaletteProvider({ children, enableShortcut, customEventName, }: CommandPaletteProviderProps): React__default.JSX.Element;
/**
 * Hook to access the command palette context.
 * Must be used within a CommandPaletteProvider.
 *
 * @example
 * ```tsx
 * function SearchButton() {
 *   const { open } = useCommandPalette();
 *   return <button onClick={open}>Search (⌘K)</button>;
 * }
 * ```
 */
declare function useCommandPalette(): CommandPaletteContextValue;

interface CommandPaletteProps {
    /** Placeholder text for search input */
    placeholder?: string;
    /** Whether search is loading */
    isLoading?: boolean;
    /** Called when an item is selected */
    onSelect?: (item: CommandPaletteItem) => void;
    /** Custom empty state content */
    emptyState?: React__default.ReactNode;
    /** Custom render function for items */
    renderItem?: (item: CommandPaletteItem, options: {
        isSelected: boolean;
        index: number;
    }) => React__default.ReactNode;
    /** Custom footer content */
    footer?: React__default.ReactNode;
    /** Additional CSS classes for the modal */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function CommandPalette({ placeholder, isLoading, onSelect, emptyState, renderItem, footer, className, 'data-testid': testId, }: CommandPaletteProps): React__default.JSX.Element | null;
interface CommandPaletteTriggerProps {
    /** Button content (default shows search icon and keyboard hint) */
    children?: React__default.ReactNode;
    /** Placeholder text to show in the trigger */
    placeholder?: string;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function CommandPaletteTrigger({ children, placeholder, className, 'data-testid': testId, }: CommandPaletteTriggerProps): React__default.JSX.Element;

interface SidebarProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Width when expanded (default: '280px') */
    expandedWidth?: string;
    /** Width when collapsed (default: '80px') */
    collapsedWidth?: string;
    /** Custom styles object */
    style?: React__default.CSSProperties;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function Sidebar({ children, className, expandedWidth, collapsedWidth, style, 'data-testid': testId, }: SidebarProps): React__default.JSX.Element;
interface SidebarHeaderProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show mobile close button (default: true) */
    showMobileClose?: boolean;
}
declare function SidebarHeader({ children, className, showMobileClose, }: SidebarHeaderProps): React__default.JSX.Element;
interface SidebarFooterProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarFooter({ children, className }: SidebarFooterProps): React__default.JSX.Element;
interface SidebarContentProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarContent({ children, className }: SidebarContentProps): React__default.JSX.Element;
interface SidebarNavProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarNav({ children, className }: SidebarNavProps): React__default.JSX.Element;
interface SidebarNavGroupProps {
    /** Group label */
    label: string;
    /** Group icon */
    icon?: ReactNode;
    /** Group items */
    children: ReactNode;
    /** Whether the group starts expanded (for controlled accordion) */
    defaultExpanded?: boolean;
    /** Group identifier for accordion behavior */
    groupId?: string;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarNavGroup({ label, icon, children, defaultExpanded, groupId, className, }: SidebarNavGroupProps): React__default.JSX.Element;
interface SidebarNavItemProps {
    /** Item label */
    label: string;
    /** Item icon */
    icon?: ReactNode;
    /** Whether this item is currently active */
    isActive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Optional href for link items */
    href?: string;
    /** Badge content (number or text) */
    badge?: ReactNode;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function SidebarNavItem({ label, icon, isActive, onClick, href, badge, disabled, className, 'data-testid': testId, }: SidebarNavItemProps): React__default.JSX.Element;
interface SidebarToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Position of the toggle (default: 'inline') */
    position?: 'inline' | 'floating';
}
declare function SidebarToggle({ className, position, }: SidebarToggleProps): React__default.JSX.Element;
interface SidebarMobileToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Custom icon */
    icon?: ReactNode;
}
declare function SidebarMobileToggle({ className, icon, }: SidebarMobileToggleProps): React__default.JSX.Element;
interface SidebarSearchProps {
    /** Search query value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Keyboard shortcut hint */
    shortcutHint?: string;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function SidebarSearch({ value, onChange, placeholder, shortcutHint, className, 'data-testid': testId, }: SidebarSearchProps): React__default.JSX.Element;

interface SidebarContextValue {
    /** Whether the sidebar is collapsed (desktop) */
    isCollapsed: boolean;
    /** Toggle collapsed state */
    toggleCollapsed: () => void;
    /** Set collapsed state */
    setCollapsed: (collapsed: boolean) => void;
    /** Whether the mobile sidebar is open */
    isMobileOpen: boolean;
    /** Open mobile sidebar */
    openMobile: () => void;
    /** Close mobile sidebar */
    closeMobile: () => void;
    /** Toggle mobile sidebar */
    toggleMobile: () => void;
    /** Whether we're on a mobile/tablet viewport */
    isMobileViewport: boolean;
    /** Currently expanded group (for accordion behavior) */
    expandedGroup: string | null;
    /** Set the expanded group */
    setExpandedGroup: (group: string | null) => void;
    /** Toggle a group's expanded state */
    toggleGroup: (group: string) => void;
}
interface SidebarProviderProps {
    children: ReactNode;
    /** Default collapsed state (default: false) */
    defaultCollapsed?: boolean;
    /** Storage key for persisting collapsed state (default: 'sidebar-collapsed') */
    storageKey?: string;
    /** Whether to persist collapsed state to localStorage (default: true) */
    persistCollapsed?: boolean;
    /** Default expanded group */
    defaultExpandedGroup?: string | null;
    /** Breakpoint for mobile detection (default: 1024px) */
    mobileBreakpoint?: string;
}
declare function SidebarProvider({ children, defaultCollapsed, storageKey, persistCollapsed, defaultExpandedGroup, mobileBreakpoint, }: SidebarProviderProps): React__default.JSX.Element;
/**
 * Hook to access the sidebar context.
 * Must be used within a SidebarProvider.
 *
 * @example
 * ```tsx
 * function MenuButton() {
 *   const { isMobileViewport, openMobile, toggleCollapsed } = useSidebar();
 *
 *   return (
 *     <button onClick={isMobileViewport ? openMobile : toggleCollapsed}>
 *       Menu
 *     </button>
 *   );
 * }
 * ```
 */
declare function useSidebar(): SidebarContextValue;

type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
interface ToastData {
    /** Unique identifier for the toast */
    id: string;
    /** Toast message content */
    message: ReactNode;
    /** Optional title for the toast */
    title?: string;
    /** Toast variant/type (default: 'info') */
    variant?: ToastVariant;
    /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss, default: 5000) */
    duration?: number;
    /** Whether the toast can be dismissed by clicking (default: true) */
    dismissible?: boolean;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Custom icon to display */
    icon?: ReactNode;
    /** Callback when toast is dismissed */
    onDismiss?: () => void;
}
type ToastOptions = Omit<ToastData, 'id'>;
interface ToastContextValue {
    /** Currently visible toasts */
    toasts: ToastData[];
    /** Add a new toast and return its ID */
    toast: (options: ToastOptions) => string;
    /** Shorthand for success toast */
    success: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for error toast */
    error: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for warning toast */
    warning: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for info toast */
    info: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Dismiss a specific toast by ID */
    dismiss: (id: string) => void;
    /** Dismiss all toasts */
    dismissAll: () => void;
}
interface ToastProviderProps {
    children: ReactNode;
    /** Maximum number of toasts to show at once (default: 5) */
    maxToasts?: number;
    /** Position of toasts on screen (default: 'bottom-right') */
    position?: ToastPosition;
    /** Default duration for toasts in ms (default: 5000) */
    defaultDuration?: number;
}
declare function ToastProvider({ children, maxToasts, defaultDuration, }: ToastProviderProps): React__default.JSX.Element;
/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, error } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Data saved successfully!');
 *     } catch (e) {
 *       error('Failed to save data');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
declare function useToast(): ToastContextValue;

interface ToastProps extends ToastData {
    /** Called when the toast is dismissed */
    onClose: () => void;
}
declare function Toast({ title, message, variant, dismissible, action, icon, onClose, }: ToastProps): React__default.JSX.Element;
interface ToastContainerProps {
    /** Toasts to display */
    toasts: ToastData[];
    /** Position of the toast container (default: 'bottom-right') */
    position?: ToastPosition;
    /** Called when a toast should be dismissed */
    onDismiss: (id: string) => void;
}
declare function ToastContainer({ toasts, position, onDismiss, }: ToastContainerProps): React__default.JSX.Element | null;

export { AppHeader, AppHeaderActions, type AppHeaderActionsProps, AppHeaderDivider, type AppHeaderDividerProps, AppHeaderIconButton, type AppHeaderIconButtonProps, type AppHeaderProps, AppHeaderSearch, type AppHeaderSearchProps, AppHeaderSection, type AppHeaderSectionProps, AppHeaderTitle, type AppHeaderTitleProps, AppHeaderUserMenu, type AppHeaderUserMenuProps, CommandPalette, type CommandPaletteCategory, type CommandPaletteContextValue, type CommandPaletteItem, type CommandPaletteProps, CommandPaletteProvider, type CommandPaletteProviderProps, CommandPaletteTrigger, type CommandPaletteTriggerProps, Sidebar, SidebarContent, type SidebarContentProps, type SidebarContextValue, SidebarFooter, type SidebarFooterProps, SidebarHeader, type SidebarHeaderProps, SidebarMobileToggle, type SidebarMobileToggleProps, SidebarNav, SidebarNavGroup, type SidebarNavGroupProps, SidebarNavItem, type SidebarNavItemProps, type SidebarNavProps, type SidebarProps, SidebarProvider, type SidebarProviderProps, SidebarSearch, type SidebarSearchProps, SidebarToggle, type SidebarToggleProps, Toast, ToastContainer, type ToastContainerProps, type ToastContextValue, type ToastData, type ToastOptions, type ToastPosition, type ToastProps, ToastProvider, type ToastProviderProps, type ToastVariant, useCommandPalette, useSidebar, useToast };
