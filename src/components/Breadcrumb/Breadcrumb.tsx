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
    <ChevronRightIcon className="text-muted-foreground h-4 w-4 shrink-0" />
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
                <span className="text-muted-foreground text-sm">...</span>
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
        'text-muted-foreground text-sm',
        'hover:text-foreground transition-colors',
        'focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none'
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
      className="text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
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
      className={cn('text-muted-foreground mx-1', className)}
      aria-hidden="true"
    >
      /
    </span>
  );
}

export { Breadcrumb, BreadcrumbSlash };
