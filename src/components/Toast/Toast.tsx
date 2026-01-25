import React from 'react';
import { cn } from '../../utils/cn';
import type { ToastData, ToastVariant, ToastPosition } from './ToastProvider';

// =============================================================================
// Icons
// =============================================================================

const CheckIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XCircleIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// =============================================================================
// Variant Styles
// =============================================================================

const variantStyles: Record<ToastVariant, { container: string; icon: string }> =
  {
    success: {
      container:
        'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
      icon: 'text-green-500 dark:text-green-400',
    },
    error: {
      container:
        'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      icon: 'text-red-500 dark:text-red-400',
    },
    warning: {
      container:
        'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    info: {
      container:
        'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200',
      icon: 'text-primary-500 dark:text-primary-400',
    },
  };

const defaultIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckIcon />,
  error: <XCircleIcon />,
  warning: <ExclamationIcon />,
  info: <InfoIcon />,
};

// =============================================================================
// Toast Component
// =============================================================================

export interface ToastProps extends ToastData {
  /** Called when the toast is dismissed */
  onClose: () => void;
}

export function Toast({
  title,
  message,
  variant = 'info',
  dismissible = true,
  action,
  icon,
  onClose,
}: ToastProps): React.JSX.Element {
  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg',
        'max-w-[420px] min-w-[300px]',
        'animate-slide-in-right',
        styles.container
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0', styles.icon)}>{displayIcon}</div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
        <div className="text-sm opacity-90">{message}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 rounded text-sm font-medium underline hover:no-underline focus:ring-2 focus:ring-current focus:ring-offset-2 focus:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10 focus:ring-2 focus:ring-current focus:outline-none dark:hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Position Styles
// =============================================================================

const positionStyles: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

// =============================================================================
// Toast Container
// =============================================================================

export interface ToastContainerProps {
  /** Toasts to display */
  toasts: ToastData[];
  /** Position of the toast container (default: 'bottom-right') */
  position?: ToastPosition;
  /** Called when a toast should be dismissed */
  onDismiss: (id: string) => void;
}

export function ToastContainer({
  toasts,
  position = 'bottom-right',
  onDismiss,
}: ToastContainerProps): React.JSX.Element | null {
  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50 flex flex-col gap-2',
        positionStyles[position]
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={() => onDismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}
