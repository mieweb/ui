import React, {
  type ReactNode,
  useRef,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { cn } from '../../utils/cn';
import { useSidebar } from './SidebarProvider';

// =============================================================================
// Icons
// =============================================================================

const ChevronLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="h-3 w-3"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

// =============================================================================
// Sidebar Component
// =============================================================================

export interface SidebarProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Width when expanded (default: '280px') */
  expandedWidth?: string;
  /** Width when collapsed (default: '80px') */
  collapsedWidth?: string;
  /** Custom styles object */
  style?: React.CSSProperties;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Sidebar({
  children,
  className,
  expandedWidth = '280px',
  collapsedWidth = '80px',
  style,
  'data-testid': testId = 'sidebar',
}: SidebarProps): React.JSX.Element {
  const { isCollapsed, isMobileOpen, closeMobile, isMobileViewport } =
    useSidebar();

  // Determine effective width
  const width = isMobileViewport
    ? expandedWidth
    : isCollapsed
      ? collapsedWidth
      : expandedWidth;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileViewport && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid={testId}
        className={cn(
          'flex h-screen flex-col',
          'border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
          'transition-all duration-300 ease-in-out',
          // Mobile positioning
          isMobileViewport && 'fixed top-0 left-0 z-50',
          isMobileViewport &&
            (isMobileOpen ? 'translate-x-0' : '-translate-x-full'),
          // Desktop positioning
          !isMobileViewport && 'relative',
          className
        )}
        style={{
          width,
          minWidth: width,
          ...style,
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {children}
      </aside>
    </>
  );
}

// =============================================================================
// SidebarHeader Component
// =============================================================================

export interface SidebarHeaderProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show mobile close button (default: true) */
  showMobileClose?: boolean;
}

export function SidebarHeader({
  children,
  className,
  showMobileClose = true,
}: SidebarHeaderProps): React.JSX.Element {
  const { closeMobile, isMobileViewport, isCollapsed } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  return (
    <div
      className={cn(
        'flex items-center border-b border-neutral-200 py-4 dark:border-neutral-700',
        showCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        className
      )}
    >
      <div
        className={cn(
          'min-w-0',
          showCollapsed ? 'flex justify-center' : 'flex-1'
        )}
      >
        {children}
      </div>
      {showMobileClose && isMobileViewport && (
        <button
          onClick={closeMobile}
          className="-mr-2 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800"
          aria-label="Close navigation"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// SidebarFooter Component
// =============================================================================

export interface SidebarFooterProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SidebarFooter({
  children,
  className,
}: SidebarFooterProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  return (
    <div
      className={cn(
        'mt-auto border-t border-neutral-200 py-4 dark:border-neutral-700',
        showCollapsed ? 'flex justify-center px-2' : 'px-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SidebarContent Component (scrollable area)
// =============================================================================

export interface SidebarContentProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SidebarContent({
  children,
  className,
}: SidebarContentProps): React.JSX.Element {
  return (
    <div className={cn('flex-1 overflow-y-auto py-4', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// SidebarNav Component
// =============================================================================

export interface SidebarNavProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function SidebarNav({
  children,
  className,
}: SidebarNavProps): React.JSX.Element {
  return <nav className={cn('space-y-1 px-2', className)}>{children}</nav>;
}

// =============================================================================
// SidebarNavGroup Component
// =============================================================================

export interface SidebarNavGroupProps {
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

export function SidebarNavGroup({
  label,
  icon,
  children,
  defaultExpanded = false,
  groupId,
  className,
}: SidebarNavGroupProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport, expandedGroup, toggleGroup } =
    useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  // Determine if this group is expanded
  const isExpanded = groupId ? expandedGroup === groupId : defaultExpanded;

  // Local state for uncontrolled behavior
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const effectiveExpanded = groupId ? isExpanded : localExpanded;

  const handleToggle = useCallback(() => {
    if (groupId) {
      toggleGroup(groupId);
    } else {
      setLocalExpanded((prev) => !prev);
    }
  }, [groupId, toggleGroup]);

  return (
    <div className={cn('mb-2', className)}>
      {/* Group Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold',
          'text-neutral-700 dark:text-neutral-300',
          'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
          showCollapsed && 'justify-center'
        )}
        title={showCollapsed ? label : undefined}
      >
        {icon && (
          <span
            className={cn(
              'h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400',
              !showCollapsed && 'mr-3'
            )}
          >
            {icon}
          </span>
        )}
        {!showCollapsed && (
          <>
            <span className="flex-1 truncate text-left">{label}</span>
            <span
              className={cn(
                'ml-2 flex-shrink-0 transition-transform duration-200',
                effectiveExpanded && 'rotate-180'
              )}
            >
              <ChevronDownIcon />
            </span>
          </>
        )}
      </button>

      {/* Group Items */}
      {!showCollapsed && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            effectiveExpanded
              ? 'mt-1 max-h-[1000px] opacity-100'
              : 'max-h-0 opacity-0'
          )}
        >
          <div className="pl-2">{children}</div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SidebarNavItem Component
// =============================================================================

export interface SidebarNavItemProps {
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

export function SidebarNavItem({
  label,
  icon,
  isActive = false,
  onClick,
  href,
  badge,
  disabled = false,
  className,
  'data-testid': testId,
}: SidebarNavItemProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport, closeMobile } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
    // Close mobile sidebar on navigation
    if (isMobileViewport) {
      closeMobile();
    }
  }, [disabled, onClick, isMobileViewport, closeMobile]);

  const content = (
    <>
      {icon && (
        <span
          className={cn(
            'h-5 w-5 flex-shrink-0',
            isActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-neutral-500 dark:text-neutral-400',
            !showCollapsed && 'mr-3'
          )}
        >
          {icon}
        </span>
      )}
      {!showCollapsed && (
        <>
          <span className="flex-1 truncate text-left">{label}</span>
          {badge && (
            <span
              className={cn(
                'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </>
  );

  const baseClasses = cn(
    'flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors',
    isActive
      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
    disabled && 'opacity-50 cursor-not-allowed',
    showCollapsed && 'justify-center',
    className
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        onClick={handleClick}
        data-testid={testId}
        className={baseClasses}
        title={showCollapsed ? label : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      data-testid={testId}
      className={baseClasses}
      title={showCollapsed ? label : undefined}
    >
      {content}
    </button>
  );
}

// =============================================================================
// SidebarToggle Component
// =============================================================================

export interface SidebarToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Position of the toggle (default: 'inline') */
  position?: 'inline' | 'floating';
}

export function SidebarToggle({
  className,
  position = 'inline',
}: SidebarToggleProps): React.JSX.Element {
  const { isCollapsed, toggleCollapsed, isMobileViewport } = useSidebar();

  // Don't render on mobile
  if (isMobileViewport) return <></>;

  const button = (
    <button
      onClick={toggleCollapsed}
      className={cn(
        'rounded-lg p-2 text-neutral-500 dark:text-neutral-400',
        'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        className
      )}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </button>
  );

  if (position === 'floating') {
    return (
      <div className="absolute top-6 -right-3 z-10 rounded-full border border-neutral-200 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-900">
        {button}
      </div>
    );
  }

  return button;
}

// =============================================================================
// SidebarMobileToggle Component
// =============================================================================

export interface SidebarMobileToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Custom icon */
  icon?: ReactNode;
}

export function SidebarMobileToggle({
  className,
  icon,
}: SidebarMobileToggleProps): React.JSX.Element {
  const { openMobile, isMobileViewport } = useSidebar();

  // Don't render on desktop
  if (!isMobileViewport) return <></>;

  return (
    <button
      onClick={openMobile}
      className={cn(
        'rounded-lg p-2 text-neutral-500 dark:text-neutral-400',
        'transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        className
      )}
      aria-label="Open navigation"
    >
      {icon ?? <MenuIcon />}
    </button>
  );
}

// =============================================================================
// SidebarSearch Component
// =============================================================================

export interface SidebarSearchProps {
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

export function SidebarSearch({
  value,
  onChange,
  placeholder = 'Search...',
  shortcutHint = '/',
  className,
  'data-testid': testId = 'sidebar-search',
}: SidebarSearchProps): React.JSX.Element {
  const { isCollapsed, isMobileViewport, setCollapsed } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);
  const showCollapsed = !isMobileViewport && isCollapsed;

  // Global keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        // Expand sidebar if collapsed
        if (showCollapsed) {
          setCollapsed(false);
          setTimeout(() => inputRef.current?.focus(), 350);
        } else {
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCollapsed, setCollapsed]);

  // Don't render when collapsed
  if (showCollapsed) return <></>;

  return (
    <div className={cn('px-3 py-2', className)}>
      <div className="relative">
        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${placeholder} (${shortcutHint})`}
          data-testid={testId}
          className={cn(
            'w-full rounded-lg py-2 pr-4 pl-10 text-sm',
            'border-transparent bg-neutral-100 dark:bg-neutral-800',
            'text-neutral-900 placeholder-neutral-400 dark:text-white dark:placeholder-neutral-500',
            'focus:ring-primary-500 focus:bg-white focus:ring-2 focus:outline-none dark:focus:bg-neutral-700',
            'transition-colors'
          )}
        />
      </div>
    </div>
  );
}
