import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

declare const paginationButtonVariants: (props?: ({
    variant?: "ghost" | "outline" | "default" | null | undefined;
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

export { Pagination, type PaginationProps, SimplePagination, type SimplePaginationProps, paginationButtonVariants };
