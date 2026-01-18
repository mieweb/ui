import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const skeletonVariants = cva(
  ['animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700'],
  {
    variants: {
      variant: {
        default: '',
        text: 'h-4',
        title: 'h-6',
        avatar: 'rounded-full',
        button: 'h-10 w-24',
        card: 'h-40',
        image: 'aspect-video',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
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
function Skeleton({
  className,
  variant,
  width,
  height,
  circle,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        skeletonVariants({ variant }),
        circle && 'rounded-full',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = 'Skeleton';

// ============================================================================
// Skeleton Text
// ============================================================================

export interface SkeletonTextProps {
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
function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = 'sm',
  className,
}: SkeletonTextProps) {
  const gapClasses = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div className={cn(gapClasses[gap], className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          style={{
            width: index === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
}

SkeletonText.displayName = 'SkeletonText';

// ============================================================================
// Skeleton Card
// ============================================================================

export interface SkeletonCardProps {
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
function SkeletonCard({
  showImage = true,
  showAvatar = false,
  textLines = 2,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'border-border bg-card space-y-4 rounded-xl border p-4',
        className
      )}
      aria-hidden="true"
    >
      {showImage && <Skeleton variant="image" className="rounded-lg" />}
      <div className="space-y-3">
        {showAvatar && (
          <div className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="30%" />
            </div>
          </div>
        )}
        <Skeleton variant="title" width="80%" />
        <SkeletonText lines={textLines} />
      </div>
    </div>
  );
}

SkeletonCard.displayName = 'SkeletonCard';

// ============================================================================
// Skeleton Table Row
// ============================================================================

export interface SkeletonTableProps {
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
function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

SkeletonTable.displayName = 'SkeletonTable';

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  skeletonVariants,
};
