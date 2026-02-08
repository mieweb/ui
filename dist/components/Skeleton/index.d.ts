import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const skeletonVariants: (props?: ({
    variant?: "default" | "title" | "button" | "text" | "image" | "card" | "avatar" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
    /** Width of the skeleton */
    width?: string | number;
    /** Height of the skeleton */
    height?: string | number;
    /** Whether to render as a circle */
    circle?: boolean;
}
/**
 * A skeleton loading placeholder component.
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="60%" />
 * <Skeleton variant="avatar" width={40} height={40} />
 * <Skeleton variant="card" />
 * ```
 */
declare function Skeleton({ className, variant, width, height, circle, style, ...props }: SkeletonProps): react_jsx_runtime.JSX.Element;
declare namespace Skeleton {
    var displayName: string;
}
interface SkeletonTextProps {
    /** Number of lines to display */
    lines?: number;
    /** Width of the last line (for varying line lengths) */
    lastLineWidth?: string;
    /** Gap between lines */
    gap?: 'sm' | 'md' | 'lg';
    /** Additional class name */
    className?: string;
}
/**
 * A skeleton for text content with multiple lines.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} lastLineWidth="60%" />
 * ```
 */
declare function SkeletonText({ lines, lastLineWidth, gap, className, }: SkeletonTextProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonText {
    var displayName: string;
}
interface SkeletonCardProps {
    /** Show image placeholder */
    showImage?: boolean;
    /** Show avatar placeholder */
    showAvatar?: boolean;
    /** Number of text lines */
    textLines?: number;
    /** Additional class name */
    className?: string;
}
/**
 * A skeleton for card-like content.
 *
 * @example
 * ```tsx
 * <SkeletonCard showImage showAvatar textLines={2} />
 * ```
 */
declare function SkeletonCard({ showImage, showAvatar, textLines, className, }: SkeletonCardProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonCard {
    var displayName: string;
}
interface SkeletonTableProps {
    /** Number of rows */
    rows?: number;
    /** Number of columns */
    columns?: number;
    /** Additional class name */
    className?: string;
}
/**
 * A skeleton for table content.
 *
 * @example
 * ```tsx
 * <SkeletonTable rows={5} columns={4} />
 * ```
 */
declare function SkeletonTable({ rows, columns, className, }: SkeletonTableProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonTable {
    var displayName: string;
}

export { Skeleton, SkeletonCard, type SkeletonCardProps, type SkeletonProps, SkeletonTable, type SkeletonTableProps, SkeletonText, type SkeletonTextProps, skeletonVariants };
