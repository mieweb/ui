'use client';

import * as React from 'react';

export interface PageHeaderProps {
  /** Main title of the page/section */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional icon to display before the title */
  icon?: React.ReactNode;
  /** Action buttons or controls to display on the right */
  actions?: React.ReactNode;
  /** Additional content below the title (e.g., breadcrumbs, tabs) */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a bottom border */
  bordered?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PageHeader displays a section header with title, subtitle, and action buttons.
 * Used as a consistent header pattern across pages and sections.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
  bordered = true,
  size = 'md',
}: PageHeaderProps) {
  const sizeClasses = {
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-6',
  };

  const titleSizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
  };

  return (
    <div
      className={` ${sizeClasses[size]} ${bordered ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${className} `.trim()}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={`${titleSizeClasses[size]} truncate text-gray-900 dark:text-white`}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default PageHeader;
