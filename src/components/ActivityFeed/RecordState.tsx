'use client';

import * as React from 'react';
import { TriangleAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';

export interface RecordStateProps {
  kind: 'loading' | 'error' | 'empty';
  /** `data-slot` value, so each module keeps its own slot name. */
  slot: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  /** Skeleton rows while loading. */
  rows?: number;
  className?: string;
  /** Extra actions under an empty or error message. */
  children?: React.ReactNode;
}

/** The loading, error and empty states shared by the Records modules. */
export function RecordState({
  kind,
  slot,
  message,
  retryLabel,
  onRetry,
  rows = 3,
  className,
  children,
}: RecordStateProps) {
  if (kind === 'loading') {
    return (
      <div
        role="status"
        data-slot={slot}
        className={cn('space-y-4 p-4', className)}
      >
        <span className="sr-only">{message}</span>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton circle width={28} height={28} className="shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="35%" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      data-slot={slot}
      className={cn(
        'text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm',
        className
      )}
    >
      {kind === 'error' ? (
        <p role="alert" className="text-foreground flex items-center gap-2">
          <TriangleAlert className="text-destructive size-4" aria-hidden />
          {message}
        </p>
      ) : (
        <p>{message}</p>
      )}
      {onRetry && retryLabel && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
