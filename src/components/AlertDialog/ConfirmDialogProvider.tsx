import * as React from 'react';
import {
  AlertDialog,
  defaultAlertDialogLabels,
  type AlertDialogLabels,
  type AlertDialogVariant,
} from './AlertDialog';

export interface ConfirmOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  variant?: AlertDialogVariant;
}

export type AlertOptions = Omit<ConfirmOptions, 'cancelLabel'>;

export interface ConfirmApi {
  /** Resolves `true` when the user confirms, `false` when they cancel. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Shows a dialog with only an acknowledge button; resolves when dismissed. */
  alert: (options: AlertOptions) => Promise<void>;
}

export interface ConfirmDialogProviderProps {
  children: React.ReactNode;
  /** Default strings for every dialog the provider opens */
  labels?: Partial<AlertDialogLabels>;
}

interface PendingDialog extends ConfirmOptions {
  mode: 'confirm' | 'alert';
}

const ConfirmContext = React.createContext<ConfirmApi | null>(null);

/**
 * Renders one {@link AlertDialog} and exposes it imperatively through
 * {@link useConfirm}. Mount once near the app root.
 */
export function ConfirmDialogProvider({
  children,
  labels,
}: ConfirmDialogProviderProps) {
  const [request, setRequest] = React.useState<PendingDialog | null>(null);
  const [open, setOpen] = React.useState(false);
  const resolveRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  const settle = React.useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  // If the provider unmounts with a dialog open, settle the promise as
  // cancelled so callers awaiting confirm() aren't suspended forever.
  React.useEffect(
    () => () => {
      resolveRef.current?.(false);
      resolveRef.current = null;
    },
    []
  );

  const api = React.useMemo<ConfirmApi>(() => {
    const show = (next: PendingDialog) =>
      new Promise<boolean>((resolve) => {
        // A newer request replaces an unanswered one, which counts as cancelled.
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setRequest(next);
        setOpen(true);
      });
    return {
      confirm: (options) => show({ ...options, mode: 'confirm' }),
      alert: async (options) => {
        await show({ variant: 'info', ...options, mode: 'alert' });
      },
    };
  }, []);

  const text = { ...defaultAlertDialogLabels, ...labels };
  const isAlert = request?.mode === 'alert';

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {request && (
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            if (!next) settle(false);
          }}
          title={request.title}
          description={request.description}
          variant={request.variant}
          labels={labels}
          hideCancel={isAlert}
          cancelLabel={request.cancelLabel}
          actionLabel={
            request.actionLabel ?? (isAlert ? text.acknowledge : undefined)
          }
          onAction={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Promise-based confirm/alert dialogs. Requires a {@link ConfirmDialogProvider}
 * ancestor.
 *
 * @example
 * ```tsx
 * const { confirm } = useConfirm();
 * if (await confirm({ title: 'Delete case?', variant: 'destructive' })) remove();
 * ```
 */
export function useConfirm(): ConfirmApi {
  const api = React.useContext(ConfirmContext);
  if (!api) {
    throw new Error('useConfirm must be used within a <ConfirmDialogProvider>');
  }
  return api;
}
