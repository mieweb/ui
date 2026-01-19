import React, { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// AppHeader Component
// =============================================================================

export interface AppHeaderProps {
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

export function AppHeader({
  children,
  className,
  sticky = true,
  bordered = true,
  height = 'h-16',
  'data-testid': testId = 'app-header',
}: AppHeaderProps): React.JSX.Element {
  return (
    <header
      data-testid={testId}
      className={cn(
        'flex items-center justify-between px-4 lg:px-6',
        'bg-white dark:bg-gray-900',
        height,
        sticky && 'sticky top-0 z-30',
        bordered && 'border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {children}
    </header>
  );
}

// =============================================================================
// AppHeaderSection Component
// =============================================================================

export interface AppHeaderSectionProps {
  children: ReactNode;
  /** Section alignment */
  align?: 'left' | 'center' | 'right';
  /** Additional CSS classes */
  className?: string;
}

export function AppHeaderSection({
  children,
  align = 'left',
  className,
}: AppHeaderSectionProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        align === 'left' && 'mr-auto',
        align === 'center' && 'mx-auto',
        align === 'right' && 'ml-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// AppHeaderTitle Component
// =============================================================================

export interface AppHeaderTitleProps {
  children: ReactNode;
  /** Optional subtitle */
  subtitle?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function AppHeaderTitle({
  children,
  subtitle,
  className,
}: AppHeaderTitleProps): React.JSX.Element {
  return (
    <div className={cn('min-w-0', className)}>
      <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
        {children}
      </h1>
      {subtitle && (
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// AppHeaderActions Component
// =============================================================================

export interface AppHeaderActionsProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function AppHeaderActions({
  children,
  className,
}: AppHeaderActionsProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2', className)}>{children}</div>
  );
}

// =============================================================================
// AppHeaderDivider Component
// =============================================================================

export interface AppHeaderDividerProps {
  /** Additional CSS classes */
  className?: string;
}

export function AppHeaderDivider({
  className,
}: AppHeaderDividerProps): React.JSX.Element {
  return (
    <div
      className={cn('mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700', className)}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// AppHeaderIconButton Component
// =============================================================================

export interface AppHeaderIconButtonProps {
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

export function AppHeaderIconButton({
  icon,
  label,
  onClick,
  badge,
  isActive = false,
  className,
  'data-testid': testId,
}: AppHeaderIconButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'relative rounded-lg p-2 transition-colors',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        isActive &&
          'text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-800',
        className
      )}
      aria-label={label}
      title={label}
    >
      <span className="h-5 w-5">{icon}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center',
            'h-[18px] min-w-[18px] px-1 text-[10px] font-bold',
            'rounded-full bg-red-500 text-white'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// AppHeaderSearch Component (placeholder trigger for CommandPalette)
// =============================================================================

export interface AppHeaderSearchProps {
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

const SearchIcon = () => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

/** Check if running on Mac */
const isMac =
  typeof window !== 'undefined' &&
  typeof window.navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

export function AppHeaderSearch({
  onClick,
  placeholder = 'Search...',
  showOnMobile = false,
  className,
  'data-testid': testId = 'app-header-search',
}: AppHeaderSearchProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600',
        'bg-white px-4 py-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        'hover:border-gray-400 dark:hover:border-gray-500',
        'transition-colors hover:bg-gray-50 dark:hover:bg-gray-600',
        !showOnMobile && 'hidden sm:flex',
        'min-w-[200px] lg:min-w-[300px]',
        className
      )}
    >
      <SearchIcon />
      <span className="flex-1 text-left whitespace-nowrap">{placeholder}</span>
      <kbd
        className={cn(
          'hidden items-center gap-0.5 px-2 py-0.5 sm:inline-flex',
          'rounded border border-gray-200 bg-gray-100 dark:border-gray-500 dark:bg-gray-600',
          'flex-shrink-0 text-xs text-gray-500 dark:text-gray-300'
        )}
      >
        {isMac ? '⌘' : 'Ctrl'}+K
      </kbd>
    </button>
  );
}

// =============================================================================
// AppHeaderUserMenu Component
// =============================================================================

export interface AppHeaderUserMenuProps {
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

export function AppHeaderUserMenu({
  name,
  email,
  avatarUrl,
  initials,
  isOpen = false,
  onClick,
  className,
  'data-testid': testId = 'app-header-user-menu',
}: AppHeaderUserMenuProps): React.JSX.Element {
  const displayInitials =
    initials ??
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:ring-primary-500 focus:ring-2 focus:outline-none',
        isOpen && 'bg-gray-100 dark:bg-gray-800',
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center overflow-hidden rounded-full',
          'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium'
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          displayInitials
        )}
      </div>

      {/* Name (hidden on small screens) */}
      <div className="hidden min-w-0 text-left lg:block">
        <div className="max-w-[150px] truncate text-sm font-medium text-gray-900 dark:text-white">
          {name}
        </div>
        {email && (
          <div className="max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400">
            {email}
          </div>
        )}
      </div>

      {/* Chevron */}
      <svg
        className={cn(
          'hidden h-4 w-4 text-gray-400 transition-transform lg:block',
          isOpen && 'rotate-180'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
