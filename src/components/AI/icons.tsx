/**
 * AI Component Icons
 *
 * Shared icon components for AI features to follow DRY principles.
 */

import * as React from 'react';
import { cn } from '../../utils/cn';

// ============================================================================
// AI Logo Icon (Stack/Layers)
// ============================================================================

export interface AILogoIconProps {
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

/**
 * The AI assistant logo - a stacked layers/prism icon
 */
export function AILogoIcon({ className, size = 'md' }: AILogoIconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// Close Icon
// ============================================================================

export interface CloseIconProps {
  className?: string;
}

export function CloseIcon({ className }: CloseIconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ============================================================================
// Refresh/Clear Icon
// ============================================================================

export interface RefreshIconProps {
  className?: string;
}

export function RefreshIcon({ className }: RefreshIconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

// ============================================================================
// Chevron Icon
// ============================================================================

export interface ChevronIconProps {
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const chevronRotation = {
  up: '-rotate-180',
  down: '',
  left: 'rotate-90',
  right: '-rotate-90',
};

export function ChevronIcon({
  className,
  direction = 'down',
}: ChevronIconProps) {
  return (
    <svg
      className={cn('h-4 w-4', chevronRotation[direction], className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ============================================================================
// Send Icon
// ============================================================================

export interface SendIconProps {
  className?: string;
}

export function SendIcon({ className }: SendIconProps) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

// ============================================================================
// Spinner Icon
// ============================================================================

export interface SpinnerIconProps {
  className?: string;
}

export function SpinnerIcon({ className }: SpinnerIconProps) {
  return (
    <svg
      className={cn('h-5 w-5 animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
