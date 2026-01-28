'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

/**
 * Timeline step/milestone
 */
export interface TimelineStep {
  /** Unique identifier */
  key: string;
  /** Step label text */
  label: string;
  /** Step description (optional) */
  description?: string;
  /** Completion timestamp */
  completedAt?: Date | string;
  /** Whether this step is hidden */
  hidden?: boolean;
}

export type TimelineStepState = 'completed' | 'current' | 'pending';

/**
 * Timeline event/message
 */
export interface TimelineEvent {
  /** Unique identifier */
  id: string;
  /** Event type/category */
  type: 'message' | 'status' | 'attachment' | 'assignment' | 'note';
  /** Event title */
  title: string;
  /** Event description/content */
  content?: string;
  /** Author/actor name */
  author?: string;
  /** Author avatar URL */
  authorAvatar?: string;
  /** Event timestamp */
  timestamp: Date | string;
  /** Associated metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TimelineProgress Component
// ============================================================================

export interface TimelineProgressProps {
  /** Array of timeline steps */
  steps: TimelineStep[];
  /** Current step key (determines state of all steps) */
  currentStep: string;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * A horizontal timeline progress indicator showing order/workflow steps.
 *
 * @example
 * ```tsx
 * <TimelineProgress
 *   steps={[
 *     { key: 'submitted', label: 'Submitted', completedAt: new Date() },
 *     { key: 'processing', label: 'Processing' },
 *     { key: 'completed', label: 'Completed' },
 *   ]}
 *   currentStep="processing"
 * />
 * ```
 */
export function TimelineProgress({
  steps,
  currentStep,
  showTimestamps = true,
  className,
}: TimelineProgressProps) {
  const visibleSteps = steps.filter((step) => !step.hidden);
  const currentIndex = visibleSteps.findIndex((s) => s.key === currentStep);

  const getStepState = (index: number): TimelineStepState => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={cn('flex items-start overflow-x-auto py-4', className)}
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={visibleSteps.length}
    >
      {visibleSteps.map((step, index) => {
        const state = getStepState(index);
        const isLast = index === visibleSteps.length - 1;

        return (
          <div
            key={step.key}
            className={cn(
              'flex flex-1 flex-col items-center',
              !isLast && 'mr-2'
            )}
          >
            {/* Timestamp above */}
            {showTimestamps && (
              <div className="mb-1 h-5 text-center text-xs text-gray-500">
                {step.completedAt
                  ? formatTimestamp(step.completedAt)
                  : '\u00A0'}
              </div>
            )}

            {/* Progress bar and point */}
            <div className="flex w-full items-center">
              {/* Left bar */}
              <div
                className={cn(
                  'h-1 flex-1',
                  index === 0 ? 'bg-transparent' : '',
                  state === 'completed' || (state === 'current' && index > 0)
                    ? 'bg-brand-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />

              {/* Point */}
              <div
                className={cn(
                  'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  state === 'completed' &&
                    'border-brand-500 bg-brand-500 text-white',
                  state === 'current' &&
                    'border-brand-500 bg-white dark:bg-gray-900',
                  state === 'pending' &&
                    'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'
                )}
              >
                {state === 'completed' && <CheckIcon className="h-3 w-3" />}
                {state === 'current' && (
                  <div className="bg-brand-500 h-2 w-2 rounded-full" />
                )}
              </div>

              {/* Right bar */}
              <div
                className={cn(
                  'h-1 flex-1',
                  isLast ? 'bg-transparent' : '',
                  state === 'completed'
                    ? 'bg-brand-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            </div>

            {/* Label below */}
            <div
              className={cn(
                'mt-2 text-center text-xs font-medium capitalize',
                state === 'completed' && 'text-brand-600 dark:text-brand-400',
                state === 'current' && 'text-gray-900 dark:text-gray-100',
                state === 'pending' && 'text-gray-400 dark:text-gray-500'
              )}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

TimelineProgress.displayName = 'TimelineProgress';

// ============================================================================
// TimelineEventList Component
// ============================================================================

export interface TimelineEventListProps {
  /** Array of timeline events */
  events: TimelineEvent[];
  /** Whether to show relative timestamps */
  relativeTime?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * A vertical list of timeline events/messages.
 *
 * @example
 * ```tsx
 * <TimelineEventList
 *   events={[
 *     { id: '1', type: 'status', title: 'Order submitted', timestamp: new Date() },
 *     { id: '2', type: 'message', title: 'Note from provider', content: '...', timestamp: new Date() },
 *   ]}
 * />
 * ```
 */
export function TimelineEventList({
  events,
  relativeTime = false,
  className,
}: TimelineEventListProps) {
  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (relativeTime) {
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
    }

    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'message':
        return <MessageIcon className="h-4 w-4" />;
      case 'status':
        return <StatusIcon className="h-4 w-4" />;
      case 'attachment':
        return <AttachmentIcon className="h-4 w-4" />;
      case 'assignment':
        return <UserIcon className="h-4 w-4" />;
      case 'note':
        return <NoteIcon className="h-4 w-4" />;
      default:
        return <StatusIcon className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'status':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'attachment':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'assignment':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'note':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (events.length === 0) {
    return (
      <div className={cn('py-8 text-center text-gray-500', className)}>
        No activity yet.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {/* Vertical line */}
          {index < events.length - 1 && (
            <div className="absolute top-10 left-5 h-full w-px bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Icon */}
          <div
            className={cn(
              'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              getEventColor(event.type)
            )}
          >
            {getEventIcon(event.type)}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {event.title}
                </h4>
                {event.author && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    by {event.author}
                  </p>
                )}
              </div>
              <time className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {formatTime(event.timestamp)}
              </time>
            </div>

            {event.content && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {event.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

TimelineEventList.displayName = 'TimelineEventList';

// ============================================================================
// OrderConfirmation Component
// ============================================================================

export interface OrderConfirmationProps {
  /** Whether the modal/overlay is open */
  open: boolean;
  /** Callback when closed */
  onClose: () => void;
  /** Order number or ID */
  orderNumber?: string;
  /** Custom message */
  message?: string;
  /** Custom className */
  className?: string;
}

/**
 * An order confirmation overlay/modal with animated success state.
 *
 * @example
 * ```tsx
 * <OrderConfirmation
 *   open={showConfirmation}
 *   onClose={() => setShowConfirmation(false)}
 *   orderNumber="ORD-12345"
 * />
 * ```
 */
export function OrderConfirmation({
  open,
  onClose,
  orderNumber,
  message = "We've received your order! Our team is handling the logistics, ensuring your requested services are matched with qualified provider(s). Confirmation details will arrive in your inbox soon.",
  className,
}: OrderConfirmationProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-confirmation-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Success animation */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <div className="animate-bounce">
              <PlaneIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          id="order-confirmation-title"
          className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-100"
        >
          Order Submitted!
        </h2>

        {orderNumber && (
          <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Order #{orderNumber}
          </p>
        )}

        {/* Message */}
        <p className="mb-6 text-center text-gray-600 dark:text-gray-300">
          {message}
        </p>

        {/* Action */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'w-full rounded-lg px-4 py-3 font-medium',
            'bg-brand-600 hover:bg-brand-700 text-white',
            'dark:bg-brand-500 dark:hover:bg-brand-600',
            'transition-colors'
          )}
        >
          Got It
        </button>
      </div>
    </div>
  );
}

OrderConfirmation.displayName = 'OrderConfirmation';

// ============================================================================
// Icons
// ============================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

function StatusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AttachmentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}
