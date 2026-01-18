import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Pagination Button Variants
// ============================================================================

const paginationButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-medium transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'data-[active=true]:bg-primary-500 data-[active=true]:text-white',
        ],
        outline: [
          'border border-border text-muted-foreground',
          'hover:bg-muted hover:text-foreground',
          'data-[active=true]:border-primary-500 data-[active=true]:bg-primary-50 data-[active=true]:text-primary-500',
          'dark:data-[active=true]:bg-primary-950',
        ],
        ghost: [
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'data-[active=true]:text-primary-500 data-[active=true]:font-semibold',
        ],
      },
      size: {
        sm: 'h-8 min-w-8 px-2.5 text-xs rounded-md gap-1',
        md: 'h-10 min-w-10 px-3 text-sm rounded-lg gap-1.5',
        lg: 'h-12 min-w-12 px-4 text-base rounded-xl gap-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// ============================================================================
// Pagination Component
// ============================================================================

export interface PaginationProps extends VariantProps<
  typeof paginationButtonVariants
> {
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
function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  variant,
  size,
  labels,
  className,
}: PaginationProps) {
  // Calculate page range to display
  const pageRange = React.useMemo(() => {
    const range: (number | 'ellipsis')[] = [];

    // Always show first page
    range.push(1);

    // Calculate start and end of sibling range
    const leftSiblingIndex = Math.max(page - siblingCount, 2);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages - 1);

    // Show left ellipsis if needed
    const showLeftEllipsis = leftSiblingIndex > 2;
    // Show right ellipsis if needed
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (showLeftEllipsis) {
      range.push('ellipsis');
    }

    // Add sibling pages
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }

    if (showRightEllipsis) {
      range.push('ellipsis');
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [page, totalPages, siblingCount]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      {/* First Page Button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          aria-label={labels?.first || 'Go to first page'}
          className={cn(paginationButtonVariants({ variant, size }))}
        >
          <ChevronsLeftIcon className="h-4 w-4" />
          <span className="sr-only">{labels?.first || 'First'}</span>
        </button>
      )}

      {/* Previous Button */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          aria-label={labels?.previous || 'Go to previous page'}
          className={cn(paginationButtonVariants({ variant, size }))}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">
            {labels?.previous || 'Previous'}
          </span>
        </button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageRange.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className={cn(
                  paginationButtonVariants({ variant, size }),
                  'cursor-default hover:bg-transparent'
                )}
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Go to page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              data-active={item === page}
              className={cn(paginationButtonVariants({ variant, size }))}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label={labels?.next || 'Go to next page'}
          className={cn(paginationButtonVariants({ variant, size }))}
        >
          <span className="sr-only sm:not-sr-only">
            {labels?.next || 'Next'}
          </span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}

      {/* Last Page Button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          aria-label={labels?.last || 'Go to last page'}
          className={cn(paginationButtonVariants({ variant, size }))}
        >
          <span className="sr-only">{labels?.last || 'Last'}</span>
          <ChevronsRightIcon className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
}

Pagination.displayName = 'Pagination';

// ============================================================================
// Simple Pagination Component
// ============================================================================

export interface SimplePaginationProps extends VariantProps<
  typeof paginationButtonVariants
> {
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
function SimplePagination({
  page,
  totalPages,
  onPageChange,
  showPageInfo = true,
  variant,
  size,
  className,
}: SimplePaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center gap-2', className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrev}
        aria-label="Go to previous page"
        className={cn(paginationButtonVariants({ variant, size }))}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span>Previous</span>
      </button>

      {showPageInfo && (
        <span className="text-muted-foreground px-2 text-sm">
          Page {page} of {totalPages}
        </span>
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
        aria-label="Go to next page"
        className={cn(paginationButtonVariants({ variant, size }))}
      >
        <span>Next</span>
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}

SimplePagination.displayName = 'SimplePagination';

// ============================================================================
// Icons
// ============================================================================

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

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

function ChevronsLeftIcon({ className }: { className?: string }) {
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
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

function ChevronsRightIcon({ className }: { className?: string }) {
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
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </svg>
  );
}

export { Pagination, SimplePagination, paginationButtonVariants };
