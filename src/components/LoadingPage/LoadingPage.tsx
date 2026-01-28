import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Spinner, type SpinnerProps } from '../Spinner';

// =============================================================================
// Variant Definitions
// =============================================================================

const pageVariants = cva('flex flex-col items-center justify-center', {
  variants: {
    size: {
      sm: 'min-h-[200px] py-8',
      md: 'min-h-[400px] py-12',
      lg: 'min-h-screen py-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// =============================================================================
// LoadingDots Component
// =============================================================================

export interface LoadingDotsProps {
  /** Dot size */
  size?: 'sm' | 'md' | 'lg';
  /** Dot color */
  color?: 'primary' | 'secondary' | 'white' | 'current';
  /** Additional className */
  className?: string;
}

/**
 * Animated loading dots indicator.
 *
 * @example
 * ```tsx
 * <LoadingDots size="md" />
 * ```
 */
export function LoadingDots({
  size = 'md',
  color = 'primary',
  className,
}: LoadingDotsProps) {
  const dotSize = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  }[size];

  const dotColor = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-400',
    white: 'bg-white',
    current: 'bg-current',
  }[color];

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn('animate-pulse rounded-full', dotSize, dotColor)}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// LoadingBar Component
// =============================================================================

export interface LoadingBarProps {
  /** Progress value (0-100). If undefined, shows indeterminate animation */
  progress?: number;
  /** Bar color */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Show percentage text */
  showPercentage?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * A horizontal loading/progress bar.
 *
 * @example
 * ```tsx
 * <LoadingBar progress={45} showPercentage />
 * ```
 */
export function LoadingBar({
  progress,
  color = 'primary',
  showPercentage = false,
  className,
}: LoadingBarProps) {
  const isIndeterminate = progress === undefined;
  const barColor = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600',
  }[color];

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        {isIndeterminate ? (
          <div
            className={cn(
              'animate-loading-bar h-full w-1/3 rounded-full',
              barColor
            )}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              barColor
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
      </div>
      {showPercentage && !isIndeterminate && (
        <p className="mt-1 text-right text-sm text-gray-600 dark:text-gray-400">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
}

// =============================================================================
// LoadingPage Component
// =============================================================================

export interface LoadingPageProps extends VariantProps<typeof pageVariants> {
  /** Loading message */
  message?: string;
  /** Sub-message or additional info */
  subMessage?: string;
  /** Loading indicator type */
  indicator?: 'spinner' | 'dots' | 'bar' | 'pulse';
  /** Spinner size (when indicator is 'spinner') */
  spinnerSize?: SpinnerProps['size'];
  /** Progress value for bar indicator */
  progress?: number;
  /** Custom loading content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * A full-page loading state component.
 *
 * @example
 * ```tsx
 * <LoadingPage message="Loading your data..." />
 * ```
 */
export function LoadingPage({
  message = 'Loading...',
  subMessage,
  indicator = 'spinner',
  spinnerSize = 'lg',
  progress,
  size,
  children,
  className,
}: LoadingPageProps) {
  return (
    <div className={cn(pageVariants({ size }), className)}>
      {children || (
        <>
          <div className="mb-6">
            {indicator === 'spinner' && <Spinner size={spinnerSize} />}
            {indicator === 'dots' && <LoadingDots size="lg" />}
            {indicator === 'bar' && (
              <div className="w-48">
                <LoadingBar progress={progress} />
              </div>
            )}
            {indicator === 'pulse' && <PulseIndicator />}
          </div>
          {message && (
            <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
              {message}
            </p>
          )}
          {subMessage && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// LoadingOverlay Component
// =============================================================================

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Overlay backdrop style */
  backdrop?: 'blur' | 'solid' | 'transparent';
  /** Spinner size */
  spinnerSize?: SpinnerProps['size'];
  /** Additional className */
  className?: string;
  /** Content to overlay */
  children?: React.ReactNode;
}

/**
 * An overlay that displays a loading state over content.
 *
 * @example
 * ```tsx
 * <LoadingOverlay isLoading={isSubmitting} message="Saving...">
 *   <YourContent />
 * </LoadingOverlay>
 * ```
 */
export function LoadingOverlay({
  isLoading,
  message,
  backdrop = 'blur',
  spinnerSize = 'lg',
  className,
  children,
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 z-50 flex flex-col items-center justify-center',
            backdrop === 'blur' &&
              'bg-white/80 backdrop-blur-sm dark:bg-gray-900/80',
            backdrop === 'solid' && 'bg-white dark:bg-gray-900',
            backdrop === 'transparent' && 'bg-transparent'
          )}
        >
          <Spinner size={spinnerSize} />
          {message && (
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LoadingSkeleton Component
// =============================================================================

export interface LoadingSkeletonProps {
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Width (accepts any CSS value) */
  width?: string | number;
  /** Height (accepts any CSS value) */
  height?: string | number;
  /** Number of repeated skeletons */
  count?: number;
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
  /** Additional className */
  className?: string;
}

/**
 * A skeleton loader placeholder for content.
 *
 * @example
 * ```tsx
 * <LoadingSkeleton variant="text" count={3} />
 * ```
 */
export function LoadingSkeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse',
  className,
}: LoadingSkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' &&
      'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]'
  );

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  }[variant];

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? 40 : '100%'),
    height:
      height ?? (variant === 'circular' ? 40 : variant === 'text' ? 16 : 100),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            baseClasses,
            variantClasses,
            i > 0 && 'mt-2',
            className
          )}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

// =============================================================================
// CardSkeleton Component
// =============================================================================

export interface CardSkeletonProps {
  /** Show image placeholder */
  hasImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Additional className */
  className?: string;
}

/**
 * A card-shaped skeleton loader.
 *
 * @example
 * ```tsx
 * <CardSkeleton hasImage lines={3} />
 * ```
 */
export function CardSkeleton({
  hasImage = true,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {hasImage && (
        <LoadingSkeleton variant="rounded" height={160} className="mb-4" />
      )}
      <LoadingSkeleton
        variant="text"
        width="60%"
        height={24}
        className="mb-2"
      />
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
          className="mb-2"
        />
      ))}
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function PulseIndicator() {
  return (
    <div className="relative h-16 w-16">
      <div className="bg-primary-200 dark:bg-primary-800 absolute inset-0 animate-ping rounded-full opacity-75" />
      <div className="bg-primary-400 dark:bg-primary-600 absolute inset-2 animate-pulse rounded-full" />
      <div className="bg-primary-600 dark:bg-primary-400 absolute inset-4 rounded-full" />
    </div>
  );
}

// Add this to your global CSS for the loading bar animation:
// @keyframes loading-bar {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(300%); }
// }
// .animate-loading-bar {
//   animation: loading-bar 1.5s infinite;
// }
//
// @keyframes shimmer {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite linear;
// }
