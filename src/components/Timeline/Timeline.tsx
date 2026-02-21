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
  /** Whether this step has an error */
  error?: boolean;
}

export type TimelineStepState = 'completed' | 'current' | 'pending' | 'error';

export type TimelineSize = 'sm' | 'md' | 'lg';

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
  /** Size variant */
  size?: TimelineSize;
  /** Whether to show a pulse animation on the current step */
  pulse?: boolean;
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
  size = 'md',
  pulse = true,
  className,
}: TimelineProgressProps) {
  const visibleSteps = steps.filter((step) => !step.hidden);
  const currentIndex = visibleSteps.findIndex((s) => s.key === currentStep);

  // Size configurations
  const sizeConfig = {
    sm: {
      wrapper: 'h-6 w-6',
      completed: 'h-5 w-5',
      current: 'h-6 w-6',
      pending: 'h-5 w-5',
      error: 'h-6 w-6',
      checkIcon: 'h-3 w-3',
      xIcon: 'h-3.5 w-3.5',
      currentDot: 'h-1.5 w-1.5',
      pendingDot: 'h-1.5 w-1.5',
      connector: 'h-px',
      timestamp: 'text-[10px]',
      label: 'text-[10px]',
      padding: 'py-2',
      labelMargin: 'mt-1.5',
      timestampMargin: 'mb-1',
    },
    md: {
      wrapper: 'h-10 w-10',
      completed: 'h-8 w-8',
      current: 'h-10 w-10',
      pending: 'h-8 w-8',
      error: 'h-10 w-10',
      checkIcon: 'h-4 w-4',
      xIcon: 'h-5 w-5',
      currentDot: 'h-2.5 w-2.5',
      pendingDot: 'h-2 w-2',
      connector: 'h-0.5',
      timestamp: 'text-xs',
      label: 'text-xs',
      padding: 'py-4',
      labelMargin: 'mt-2.5',
      timestampMargin: 'mb-2',
    },
    lg: {
      wrapper: 'h-14 w-14',
      completed: 'h-11 w-11',
      current: 'h-14 w-14',
      pending: 'h-11 w-11',
      error: 'h-14 w-14',
      checkIcon: 'h-5 w-5',
      xIcon: 'h-6 w-6',
      currentDot: 'h-3.5 w-3.5',
      pendingDot: 'h-2.5 w-2.5',
      connector: 'h-1',
      timestamp: 'text-sm',
      label: 'text-sm',
      padding: 'py-6',
      labelMargin: 'mt-3',
      timestampMargin: 'mb-3',
    },
  };

  const sizes = sizeConfig[size];

  const getStepState = (
    index: number,
    step: TimelineStep
  ): TimelineStepState => {
    if (step.error) return 'error';
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
      className={cn(sizes.padding, 'overflow-x-auto', className)}
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={visibleSteps.length}
    >
      {/* Progress track with circles overlaid */}
      <div className="relative flex items-start">
        {visibleSteps.map((step, index) => {
          const state = getStepState(index, step);
          const isLast = index === visibleSteps.length - 1;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              {/* Timestamp above */}
              {showTimestamps && (
                <div
                  className={cn(
                    'h-4 text-center text-neutral-500 dark:text-neutral-400',
                    sizes.timestamp,
                    sizes.timestampMargin
                  )}
                >
                  {step.completedAt
                    ? formatTimestamp(step.completedAt)
                    : '\u00A0'}
                </div>
              )}

              {/* Track + circle row */}
              <div className="relative flex w-full items-center">
                {/* Left connector */}
                {index > 0 && (
                  <div
                    className={cn(
                      'flex-1',
                      sizes.connector,
                      state === 'completed' ||
                        state === 'current' ||
                        state === 'error'
                        ? 'bg-primary-600 dark:bg-primary-500'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    )}
                  />
                )}
                {index === 0 && <div className="flex-1" />}

                {/* Circle — fixed outer box so connectors stay level */}
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center',
                    sizes.wrapper
                  )}
                >
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center rounded-full transition-all duration-200',
                      state === 'completed' &&
                        cn(
                          'bg-primary-100 text-primary-800 ring-primary-200 dark:bg-primary-900/40 dark:text-primary-400 dark:ring-primary-800 ring-2',
                          sizes.completed
                        ),
                      state === 'current' &&
                        cn(
                          'bg-primary-500 shadow-primary-500/30 ring-primary-100 dark:bg-primary-500 dark:ring-primary-900/50 text-white shadow-md ring-4',
                          sizes.current,
                          pulse && 'animate-pulse'
                        ),
                      state === 'pending' &&
                        cn(
                          'bg-neutral-100 text-neutral-500 ring-2 ring-neutral-400 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-600',
                          sizes.pending
                        ),
                      state === 'error' &&
                        cn(
                          'bg-red-500 text-white shadow-md ring-4 shadow-red-500/30 ring-red-100 dark:bg-red-500 dark:ring-red-900/50',
                          sizes.error
                        )
                    )}
                  >
                    {state === 'completed' && (
                      <CheckIcon className={sizes.checkIcon} />
                    )}
                    {state === 'current' && (
                      <div
                        className={cn(
                          'rounded-full bg-white',
                          sizes.currentDot
                        )}
                      />
                    )}
                    {state === 'pending' && (
                      <div
                        className={cn(
                          'rounded-full bg-neutral-500 dark:bg-neutral-400',
                          sizes.pendingDot
                        )}
                      />
                    )}
                    {state === 'error' && <XIcon className={sizes.xIcon} />}
                  </div>
                </div>

                {/* Right connector */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1',
                      sizes.connector,
                      state === 'completed'
                        ? 'bg-primary-600 dark:bg-primary-500'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    )}
                  />
                )}
                {isLast && <div className="flex-1" />}
              </div>

              {/* Label below */}
              <div
                className={cn(
                  'text-center font-medium capitalize',
                  sizes.label,
                  sizes.labelMargin,
                  state === 'completed' &&
                    'text-primary-800 dark:text-primary-300',
                  state === 'current' &&
                    'font-semibold text-neutral-900 dark:text-white',
                  state === 'pending' &&
                    'text-neutral-500 dark:text-neutral-400',
                  state === 'error' &&
                    'font-semibold text-red-600 dark:text-red-400'
                )}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
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
        return 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40';
      case 'status':
        return 'bg-green-50 text-green-700 ring-green-100 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800/40';
      case 'attachment':
        return 'bg-purple-50 text-purple-700 ring-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800/40';
      case 'assignment':
        return 'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800/40';
      case 'note':
        return 'bg-neutral-50 text-neutral-500 ring-neutral-100 dark:bg-neutral-800/50 dark:text-neutral-400 dark:ring-neutral-700/40';
      default:
        return 'bg-neutral-50 text-neutral-500 ring-neutral-100 dark:bg-neutral-800/50 dark:text-neutral-400 dark:ring-neutral-700/40';
    }
  };

  if (events.length === 0) {
    return (
      <div className={cn('py-8 text-center text-neutral-500', className)}>
        No activity yet.
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Continuous vertical connector line */}
      {events.length > 1 && (
        <div
          className="absolute top-0 bottom-0 left-5 w-px bg-neutral-200 dark:bg-neutral-700"
          aria-hidden="true"
        />
      )}

      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon circle */}
            <div
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2',
                getEventColor(event.type)
              )}
            >
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {event.title}
                  </h4>
                  {event.author && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      by {event.author}
                    </p>
                  )}
                </div>
                <time className="shrink-0 pt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {formatTime(event.timestamp)}
                </time>
              </div>

              {event.content && (
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                  {event.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
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
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-800">
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
          className="mb-2 text-center text-2xl font-bold text-neutral-900 dark:text-neutral-100"
        >
          Order Submitted!
        </h2>

        {orderNumber && (
          <p className="mb-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Order #{orderNumber}
          </p>
        )}

        {/* Message */}
        <p className="mb-6 text-center text-neutral-600 dark:text-neutral-300">
          {message}
        </p>

        {/* Action */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'w-full rounded-lg px-4 py-3 font-medium',
            'bg-primary-600 hover:bg-primary-700 text-white',
            'dark:bg-primary-600 dark:hover:bg-primary-700',
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

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
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
