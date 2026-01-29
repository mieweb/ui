'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Button } from '../Button/Button';

export interface QuickLink {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  description?: string;
  disabled?: boolean;
}

export interface QuickLinksCardProps {
  /** Title of the card */
  title?: string;
  /** Quick links to display */
  links: QuickLink[];
  /** Layout direction */
  layout?: 'vertical' | 'grid';
  /** Number of columns in grid layout */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

/**
 * QuickLinksCard displays a set of quick action links.
 */
export function QuickLinksCard({
  title = 'Quick Links',
  links,
  layout = 'vertical',
  columns = 2,
  className = '',
}: QuickLinksCardProps) {
  const handleClick = (link: QuickLink) => {
    if (link.disabled) return;
    if (link.onClick) {
      link.onClick();
    } else if (link.href) {
      window.location.href = link.href;
    }
  };

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={
            layout === 'grid'
              ? `grid ${gridColsClass} gap-2`
              : 'flex flex-col gap-1'
          }
        >
          {links.map((link) => (
            <Button
              key={link.id}
              variant="ghost"
              className={`h-auto justify-start px-3 py-2 ${link.disabled ? 'cursor-not-allowed opacity-50' : ''} ${layout === 'grid' ? 'h-20 flex-col items-center text-center' : ''} `}
              onClick={() => handleClick(link)}
              disabled={link.disabled}
            >
              {link.icon && (
                <span
                  className={`text-gray-500 dark:text-gray-400 ${layout === 'grid' ? 'mb-1' : 'mr-3'} `}
                >
                  {link.icon}
                </span>
              )}
              <span className="flex-1 text-left">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {link.label}
                </span>
                {link.description && layout !== 'grid' && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {link.description}
                  </span>
                )}
              </span>
              {link.badge !== undefined && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  {link.badge}
                </span>
              )}
              {!link.badge && layout !== 'grid' && (
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickLinksCard;
