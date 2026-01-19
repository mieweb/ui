import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

// =============================================================================
// Types
// =============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastData {
  /** Unique identifier for the toast */
  id: string;
  /** Toast message content */
  message: ReactNode;
  /** Optional title for the toast */
  title?: string;
  /** Toast variant/type (default: 'info') */
  variant?: ToastVariant;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss, default: 5000) */
  duration?: number;
  /** Whether the toast can be dismissed by clicking (default: true) */
  dismissible?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon to display */
  icon?: ReactNode;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

export type ToastOptions = Omit<ToastData, 'id'>;

export interface ToastContextValue {
  /** Currently visible toasts */
  toasts: ToastData[];
  /** Add a new toast and return its ID */
  toast: (options: ToastOptions) => string;
  /** Shorthand for success toast */
  success: (message: ReactNode, options?: Partial<ToastOptions>) => string;
  /** Shorthand for error toast */
  error: (message: ReactNode, options?: Partial<ToastOptions>) => string;
  /** Shorthand for warning toast */
  warning: (message: ReactNode, options?: Partial<ToastOptions>) => string;
  /** Shorthand for info toast */
  info: (message: ReactNode, options?: Partial<ToastOptions>) => string;
  /** Dismiss a specific toast by ID */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

// =============================================================================
// Context
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export interface ToastProviderProps {
  children: ReactNode;
  /** Maximum number of toasts to show at once (default: 5) */
  maxToasts?: number;
  /** Position of toasts on screen (default: 'bottom-right') */
  position?: ToastPosition;
  /** Default duration for toasts in ms (default: 5000) */
  defaultDuration?: number;
}

let toastIdCounter = 0;
function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((t) => t.onDismiss?.());
      return [];
    });
  }, []);

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = generateToastId();
      const duration = options.duration ?? defaultDuration;

      const newToast: ToastData = {
        ...options,
        id,
        variant: options.variant ?? 'info',
        dismissible: options.dismissible ?? true,
        duration,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Remove oldest toasts if we exceed maxToasts
        if (updated.length > maxToasts) {
          const removed = updated.slice(0, updated.length - maxToasts);
          removed.forEach((t) => t.onDismiss?.());
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [maxToasts, defaultDuration, dismiss]
  );

  const success = useCallback(
    (message: ReactNode, options?: Partial<ToastOptions>): string => {
      return toast({ ...options, message, variant: 'success' });
    },
    [toast]
  );

  const error = useCallback(
    (message: ReactNode, options?: Partial<ToastOptions>): string => {
      return toast({
        ...options,
        message,
        variant: 'error',
        duration: options?.duration ?? 7000, // Errors stay longer by default
      });
    },
    [toast]
  );

  const warning = useCallback(
    (message: ReactNode, options?: Partial<ToastOptions>): string => {
      return toast({ ...options, message, variant: 'warning' });
    },
    [toast]
  );

  const info = useCallback(
    (message: ReactNode, options?: Partial<ToastOptions>): string => {
      return toast({ ...options, message, variant: 'info' });
    },
    [toast]
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toasts,
      toast,
      success,
      error,
      warning,
      info,
      dismiss,
      dismissAll,
    }),
    [toasts, toast, success, error, warning, info, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, error } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Data saved successfully!');
 *     } catch (e) {
 *       error('Failed to save data');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
