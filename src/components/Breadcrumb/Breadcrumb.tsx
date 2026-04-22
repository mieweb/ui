import * as React from 'react';

import { cn } from '../../utils/cn';

// ============================================================================
// Breadcrumb Types
// ============================================================================

export interface BreadcrumbItem {
  /** Label for the breadcrumb item */
  label: string;
  /** URL to navigate to (optional for the last item) */
  href?: string;
  /** Icon to display before the label */
  icon?: React.ReactNode;
}

// ============================================================================
// Breadcrumb Component
// ============================================================================

export interface BreadcrumbProps {
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
function Breadcrumb({
  items,
  separator,
  maxItems,
  renderLink,
  className,
}: BreadcrumbProps) {
  // Collapse items if maxItems is specified
  const displayedItems = React.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    // Show first item, ellipsis, and last (maxItems - 2) items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));

    return [
      firstItem,
      { label: '...', isEllipsis: true } as BreadcrumbItem & {
        isEllipsis?: boolean;
      },
      ...lastItems,
    ];
  }, [items, maxItems]);

  const defaultSeparator = (
    <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
  );

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {displayedItems.map((item, index) => {
          const isLast = index === displayedItems.length - 1;
          const isEllipsis = (item as BreadcrumbItem & { isEllipsis?: boolean })
            .isEllipsis;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true">{separator || defaultSeparator}</span>
              )}
              {isEllipsis ? (
                <span className="text-sm text-muted-foreground">...</span>
              ) : isLast || !item.href ? (
                <BreadcrumbPage item={item} />
              ) : renderLink ? (
                renderLink(item, index)
              ) : (
                <BreadcrumbLink item={item} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumb.displayName = 'Breadcrumb';

// ============================================================================
// Breadcrumb Link (Internal)
// ============================================================================

interface BreadcrumbLinkProps {
  item: BreadcrumbItem;
}

function BreadcrumbLink({ item }: BreadcrumbLinkProps) {
  return (
    <a
      href={item.href}
      className={cn(
        'inline-flex items-center gap-1.5',
        'text-sm text-muted-foreground',
        'transition-colors hover:text-foreground',
        'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {item.icon}
      {item.label}
    </a>
  );
}

// ============================================================================
// Breadcrumb Page (Current Page - Internal)
// ============================================================================

interface BreadcrumbPageProps {
  item: BreadcrumbItem;
}

function BreadcrumbPage({ item }: BreadcrumbPageProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
      aria-current="page"
    >
      {item.icon}
      {item.label}
    </span>
  );
}

// ============================================================================
// Chevron Icon
// ============================================================================

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ============================================================================
// Slash Separator Component
// ============================================================================

function BreadcrumbSlash({ className }: { className?: string }) {
  return (
    <span
      className={cn('mx-1 text-muted-foreground', className)}
      aria-hidden="true"
    >
      /
    </span>
  );
}

export { Breadcrumb, BreadcrumbSlash };
