import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'waiting';

export interface ConnectionInfo {
  /** Current connection state */
  status: ConnectionState;
  /** Number of retry attempts */
  retryCount?: number;
  /** Time until next retry (Date or timestamp) */
  retryTime?: Date | number;
  /** Reason for disconnection */
  reason?: string;
}

export interface UpdateInfo {
  /** Whether an update is available */
  available: boolean;
  /** Version string */
  version?: string;
  /** Release notes or description */
  description?: string;
}

// =============================================================================
// Variants
// =============================================================================

const overlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
  {
    variants: {
      animate: {
        true: 'animate-in fade-in duration-300',
        false: '',
      },
    },
    defaultVariants: {
      animate: true,
    },
  }
);

const cardVariants = cva(
  'mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800',
  {
    variants: {
      animate: {
        true: 'animate-in slide-in-from-bottom-4 duration-300',
        false: '',
      },
    },
    defaultVariants: {
      animate: true,
    },
  }
);

// =============================================================================
// ConnectionStatusOverlay Component
// =============================================================================

export interface ConnectionStatusOverlayProps extends VariantProps<
  typeof overlayVariants
> {
  /** Connection information */
  connection: ConnectionInfo;
  /** Whether to show the overlay */
  isVisible?: boolean;
  /** Callback when reload button is clicked */
  onReload?: () => void;
  /** Custom message to display */
  message?: string;
  /** App logo URL */
  logoUrl?: string;
  /** Additional className */
  className?: string;
}

/**
 * Full-screen overlay shown when connection is lost.
 *
 * @example
 * ```tsx
 * <ConnectionStatusOverlay
 *   isVisible={isOffline}
 *   connection={{ status: 'waiting', retryCount: 3 }}
 *   onReload={() => window.location.reload()}
 * />
 * ```
 */
export function ConnectionStatusOverlay({
  connection,
  isVisible = true,
  animate = true,
  onReload,
  message,
  logoUrl,
  className,
}: ConnectionStatusOverlayProps) {
  if (!isVisible || connection.status === 'connected') return null;

  const defaultMessage = 'Unable to communicate with the server.';
  const displayMessage = message || defaultMessage;

  // Format retry time
  const retryTimeFormatted = connection.retryTime
    ? formatRetryTime(connection.retryTime)
    : null;

  return (
    <div
      role="alertdialog"
      aria-label="Connection status"
      aria-live="assertive"
      className={cn(overlayVariants({ animate }), className)}
    >
      <div className={cn(cardVariants({ animate }))}>
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          {/* Icon */}
          <div className="shrink-0">
            <ConnectionIcon status={connection.status} className="h-12 w-12" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300">{displayMessage}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please check your internet connection.
            </p>
            {connection.retryCount !== undefined &&
              connection.retryCount > 0 && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Retry attempt #{connection.retryCount}
                  {retryTimeFormatted && ` • Retrying ${retryTimeFormatted}`}
                </p>
              )}
          </div>

          {/* Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onReload || (() => window.location.reload())}
              className="bg-primary-600 hover:bg-primary-700 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              <ReloadIcon className="h-4 w-4" />
              Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// UpdateAvailableOverlay Component
// =============================================================================

export interface UpdateAvailableOverlayProps {
  /** Update information */
  update: UpdateInfo;
  /** Whether to show the overlay */
  isVisible?: boolean;
  /** Callback when update now button is clicked */
  onUpdateNow?: () => void;
  /** Callback when later button is clicked */
  onLater?: () => void;
  /** App logo URL */
  logoUrl?: string;
  /** App name */
  appName?: string;
  /** Additional className */
  className?: string;
}

/**
 * Full-screen overlay shown when an app update is available.
 *
 * @example
 * ```tsx
 * <UpdateAvailableOverlay
 *   isVisible={updateAvailable}
 *   update={{ available: true, version: '2.0.0' }}
 *   onUpdateNow={() => installUpdate()}
 *   onLater={() => dismissUpdate()}
 * />
 * ```
 */
export function UpdateAvailableOverlay({
  update,
  isVisible = true,
  onUpdateNow,
  onLater,
  logoUrl = '/images/logos/bluehive-icon-blue.svg',
  appName = 'BlueHive',
  className,
}: UpdateAvailableOverlayProps) {
  if (!isVisible || !update.available) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Update available"
      aria-live="polite"
      className={cn(overlayVariants({ animate: true }), className)}
    >
      <div className={cn(cardVariants({ animate: true }))}>
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          {/* Logo */}
          <div className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                className="h-12 w-12 animate-pulse"
              />
            ) : (
              <UpdateIcon className="text-primary-600 h-12 w-12 animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              Update Available
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              There is an update available for {appName}.
              {update.version && ` Version ${update.version}`}
            </p>
            {update.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {update.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            {onLater && (
              <button
                type="button"
                onClick={onLater}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Later
              </button>
            )}
            <button
              type="button"
              onClick={onUpdateNow}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ConnectionStatusBadge Component
// =============================================================================

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      status: {
        connected:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        connecting:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        disconnected:
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        waiting: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      },
    },
    defaultVariants: {
      status: 'connected',
    },
  }
);

export interface ConnectionStatusBadgeProps {
  /** Current connection status */
  status: ConnectionState;
  /** Whether to show text label */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Small badge showing current connection status.
 *
 * @example
 * ```tsx
 * <ConnectionStatusBadge status="connected" showLabel />
 * ```
 */
export function ConnectionStatusBadge({
  status,
  showLabel = true,
  className,
}: ConnectionStatusBadgeProps) {
  const labels: Record<ConnectionState, string> = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Offline',
    waiting: 'Reconnecting...',
  };

  return (
    <span className={cn(badgeVariants({ status }), className)}>
      <ConnectionDot status={status} />
      {showLabel && labels[status]}
    </span>
  );
}

// =============================================================================
// ConnectionStatusBar Component
// =============================================================================

export interface ConnectionStatusBarProps {
  /** Connection information */
  connection: ConnectionInfo;
  /** Whether to show the bar */
  isVisible?: boolean;
  /** Position of the bar */
  position?: 'top' | 'bottom';
  /** Additional className */
  className?: string;
}

/**
 * Non-blocking status bar for connection issues.
 *
 * @example
 * ```tsx
 * <ConnectionStatusBar
 *   isVisible={!isConnected}
 *   connection={{ status: 'connecting', retryCount: 1 }}
 * />
 * ```
 */
export function ConnectionStatusBar({
  connection,
  isVisible = true,
  position = 'top',
  className,
}: ConnectionStatusBarProps) {
  if (!isVisible || connection.status === 'connected') return null;

  const isConnecting =
    connection.status === 'connecting' || connection.status === 'waiting';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed right-0 left-0 z-40 px-4 py-2',
        position === 'top' ? 'top-0' : 'bottom-0',
        isConnecting
          ? 'bg-yellow-500 text-yellow-900'
          : 'bg-red-500 text-white',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <ConnectionDot status={connection.status} />
        <span>
          {connection.status === 'disconnected' && 'You are offline'}
          {connection.status === 'connecting' && 'Connecting...'}
          {connection.status === 'waiting' && (
            <>
              Reconnecting
              {connection.retryCount !== undefined &&
                connection.retryCount > 0 && (
                  <span className="opacity-75">
                    {' '}
                    (attempt {connection.retryCount})
                  </span>
                )}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function ConnectionDot({ status }: { status: ConnectionState }) {
  const colors: Record<ConnectionState, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
    waiting: 'bg-red-500 animate-pulse',
  };

  return <span className={cn('h-2 w-2 rounded-full', colors[status])} />;
}

function ConnectionIcon({
  status,
  className,
}: {
  status: ConnectionState;
  className?: string;
}) {
  if (status === 'connected') {
    return (
      <svg
        className={cn('text-green-500', className)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    );
  }

  const colorClass =
    status === 'connecting' || status === 'waiting'
      ? 'text-yellow-500'
      : 'text-red-500';

  const animateClass =
    status === 'connecting' || status === 'waiting' ? 'animate-pulse' : '';

  return (
    <svg
      className={cn(colorClass, animateClass, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function ReloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function UpdateIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatRetryTime(time: Date | number): string {
  const date = typeof time === 'number' ? new Date(time) : time;
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return 'now';
  if (diff < 60000) return `in ${Math.ceil(diff / 1000)}s`;
  return `in ${Math.ceil(diff / 60000)}m`;
}

// =============================================================================
// Hook for Connection Status
// =============================================================================

export interface UseConnectionStatusOptions {
  /** Callback when connection is lost */
  onDisconnect?: () => void;
  /** Callback when connection is restored */
  onReconnect?: () => void;
}

export interface UseConnectionStatusReturn {
  /** Whether currently online */
  isOnline: boolean;
  /** Connection state info */
  connection: ConnectionInfo;
}

/**
 * Hook for monitoring browser online/offline status.
 *
 * @example
 * ```tsx
 * const { isOnline, connection } = useConnectionStatus();
 *
 * return (
 *   <ConnectionStatusOverlay
 *     isVisible={!isOnline}
 *     connection={connection}
 *   />
 * );
 * ```
 */
export function useConnectionStatus(
  options: UseConnectionStatusOptions = {}
): UseConnectionStatusReturn {
  const { onDisconnect, onReconnect } = options;

  const [isOnline, setIsOnline] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onReconnect?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onDisconnect?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onDisconnect, onReconnect]);

  const connection: ConnectionInfo = {
    status: isOnline ? 'connected' : 'disconnected',
  };

  return { isOnline, connection };
}
