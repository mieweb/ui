'use client';

import * as React from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FilterSummaryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rows currently visible after filtering. */
  filteredCount: number;
  /** Total records before filtering. Omit (or pass 0) when unknown. */
  totalCount?: number;
  /** Number of active filter conditions. */
  activeFilterCount: number;
  /** Whether a search query is also active. */
  hasSearchText?: boolean;
  /** Keep the summary visible even when no filters/search are active. */
  showWhenIdle?: boolean;
  /** Called when the clear action is clicked. */
  onClearAll: () => void;
  /** Visible strings, overridable for i18n. */
  recordsLabel?: string;
  filterLabel?: string;
  filtersLabel?: string;
  activeLabel?: string;
  searchActiveLabel?: string;
  allVisibleLabel?: string;
  clearLabel?: string;
  /** Joiner between filtered and total counts (default "of"). */
  ofLabel?: string;
  /** Suffix appended when search narrows on top of filters (default "+ search"). */
  plusSearchLabel?: string;
}

/**
 * The bar that anchors a filtered grid: "1,204 of 8,911 records — 3
 * filters active · Clear all". Hidden while idle unless `showWhenIdle`,
 * and tinted with the primary accent whenever filters or search narrow
 * the view. Pair with any data grid or list whose filter state lives in
 * the host.
 *
 * @example
 * ```tsx
 * <FilterSummaryBar
 *   filteredCount={rows.length}
 *   totalCount={total}
 *   activeFilterCount={filters.length}
 *   hasSearchText={query.length > 0}
 *   onClearAll={resetFilters}
 * />
 * ```
 */
export const FilterSummaryBar = React.forwardRef<
  HTMLDivElement,
  FilterSummaryBarProps
>(function FilterSummaryBar(
  {
    filteredCount,
    totalCount,
    activeFilterCount,
    hasSearchText = false,
    showWhenIdle = false,
    onClearAll,
    recordsLabel = 'records',
    filterLabel = 'filter',
    filtersLabel = 'filters',
    activeLabel = 'active',
    searchActiveLabel = 'search active',
    allVisibleLabel = 'all records visible',
    clearLabel = 'Clear all',
    ofLabel = 'of',
    plusSearchLabel = '+ search',
    className,
    ...props
  },
  ref
) {
  const isFiltering = activeFilterCount > 0 || hasSearchText;
  if (!isFiltering && !showWhenIdle) return null;

  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-2 text-xs transition-colors',
        isFiltering
          ? 'border-primary-300 bg-primary-500/10 dark:border-primary-700'
          : 'border-border bg-muted/60',
        className
      )}
      {...props}
    >
      <Filter
        aria-hidden="true"
        className={cn(
          'h-3 w-3 shrink-0',
          isFiltering ? 'text-primary-500' : 'text-muted-foreground'
        )}
      />
      <span
        className={cn(
          isFiltering
            ? 'text-primary-800 dark:text-primary-200'
            : 'text-muted-foreground'
        )}
      >
        <span className="font-semibold">{filteredCount.toLocaleString()}</span>
        {totalCount ? (
          <>
            {' '}
            {ofLabel}{' '}
            <span className="font-semibold">{totalCount.toLocaleString()}</span>
          </>
        ) : null}{' '}
        {recordsLabel}
        {activeFilterCount > 0 && (
          <>
            {' '}
            &mdash;{' '}
            <span className="font-semibold">
              {activeFilterCount}{' '}
              {activeFilterCount === 1 ? filterLabel : filtersLabel}
            </span>{' '}
            {activeLabel}
          </>
        )}
        {hasSearchText && activeFilterCount === 0 && (
          <> &mdash; {searchActiveLabel}</>
        )}
        {hasSearchText && activeFilterCount > 0 && <> {plusSearchLabel}</>}
        {!isFiltering && showWhenIdle && <> &mdash; {allVisibleLabel}</>}
      </span>
      {isFiltering && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'ms-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            'text-primary-700 hover:bg-primary-500/15 dark:text-primary-300'
          )}
        >
          <X aria-hidden="true" className="h-2.5 w-2.5" />
          {clearLabel}
        </button>
      )}
    </div>
  );
});
