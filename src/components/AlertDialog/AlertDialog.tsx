import * as React from 'react';
import { cva } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { isStorybookDocsMode } from '../../utils/environment';
import { Modal, ModalBody, ModalFooter, type ModalProps } from '../Modal';
import { Button } from '../Button';

export type AlertDialogVariant =
  | 'default'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'info';

export interface AlertDialogLabels {
  /** Cancel button */
  cancel: string;
  /** Action button */
  action: string;
  /** Action button while an async `onAction` is pending */
  busy: string;
  /** Action button of `useConfirm().alert()` */
  acknowledge: string;
}

export const defaultAlertDialogLabels: AlertDialogLabels = {
  cancel: 'Cancel',
  action: 'Continue',
  busy: 'Working…',
  acknowledge: 'OK',
};

const iconVariants = cva(
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      variant: {
        destructive: 'bg-destructive/10 text-destructive',
        warning: 'bg-warning/15 text-warning-700 dark:text-warning-400',
        success: 'bg-success/10 text-success-700 dark:text-success-400',
        info: 'bg-info/10 text-info-700 dark:text-info-400',
      },
    },
  }
);

const VARIANT_ICONS = {
  destructive: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

export interface AlertDialogProps extends Pick<
  ModalProps,
  'open' | 'onOpenChange'
> {
  /** Dialog title */
  title: React.ReactNode;
  /** Optional descriptive body text */
  description?: React.ReactNode;
  /** Custom body content (rendered below the description) */
  children?: React.ReactNode;
  /** Label for the cancel button; overrides `labels.cancel` */
  cancelLabel?: React.ReactNode;
  /** Label for the confirm/action button; overrides `labels.action` */
  actionLabel?: React.ReactNode;
  /**
   * Called when the action button is clicked. Return a Promise to show a busy
   * state; the dialog closes when it resolves and stays open if it rejects.
   */
  onAction?: () => void | Promise<unknown>;
  /** Called when the cancel button is clicked */
  onCancel?: () => void;
  /** Tone of the dialog: icon, action button colour and initial focus */
  variant?: AlertDialogVariant;
  /** Disables the action button */
  actionDisabled?: boolean;
  /** Hides the cancel button */
  hideCancel?: boolean;
  /** User-facing strings; English defaults in `defaultAlertDialogLabels` */
  labels?: Partial<AlertDialogLabels>;
  /** Additional class name for the dialog content */
  className?: string;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

/**
 * A modal dialog (`role="alertdialog"`) that interrupts the user with
 * important content and expects a response. Built on top of {@link Modal}.
 *
 * It does not close on overlay click or Escape — the user must explicitly
 * choose an action.
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete case?"
 *   description="This action cannot be undone."
 *   variant="destructive"
 *   actionLabel="Delete"
 *   onAction={() => deleteCase(id)}
 * />
 * ```
 */
function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel,
  actionLabel,
  onAction,
  onCancel,
  variant = 'default',
  actionDisabled,
  hideCancel,
  labels,
  className,
}: AlertDialogProps) {
  const text = { ...defaultAlertDialogLabels, ...labels };
  const id = React.useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const [busy, setBusy] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const actionRef = React.useRef<HTMLButtonElement>(null);
  const cautious = variant === 'destructive' || variant === 'warning';
  const iconVariant = variant === 'default' ? null : variant;
  const Icon = iconVariant && VARIANT_ICONS[iconVariant];

  // Modal has no role prop; upgrade its dialog element. React never resets it
  // because the role Modal renders does not change.
  React.useLayoutEffect(() => {
    if (!open) return;
    bodyRef.current
      ?.closest('[data-slot="modal"]')
      ?.setAttribute('role', 'alertdialog');
  }, [open]);

  // Layout effect so the opener is captured before Modal's trap moves focus.
  React.useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open]);

  // Parent effects run after Modal's, so this overrides its first-element focus.
  React.useEffect(() => {
    if (!open || isStorybookDocsMode()) return;
    (cautious && !hideCancel ? cancelRef : actionRef).current?.focus();
  }, [open, cautious, hideCancel]);

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  // Closing (or reusing) the dialog orphans any in-flight action: its
  // continuation must not clear the busy state or close a newer dialog.
  const actionGen = React.useRef(0);
  React.useEffect(() => {
    if (!open) {
      actionGen.current += 1;
      setBusy(false);
    }
  }, [open]);

  const handleAction = async () => {
    let result: unknown;
    try {
      result = onAction?.();
    } catch {
      requestAnimationFrame(() => actionRef.current?.focus());
      return;
    }
    if (!isPromiseLike(result)) return;
    const gen = ++actionGen.current;
    setBusy(true);
    try {
      await result;
      if (gen !== actionGen.current) return;
      setBusy(false);
      onOpenChange(false);
    } catch {
      if (gen !== actionGen.current) return;
      setBusy(false);
      // Disabling the button dropped focus; return it once re-enabled.
      requestAnimationFrame(() => actionRef.current?.focus());
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      className={className}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <ModalBody
        ref={bodyRef}
        data-variant={variant}
        aria-busy={busy || undefined}
        className="flex items-start gap-4 px-6 py-5"
      >
        {Icon && iconVariant && (
          <span
            data-slot="alert-dialog-icon"
            className={iconVariants({ variant: iconVariant })}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            data-slot="alert-dialog-title"
            className="text-lg font-semibold tracking-tight"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              data-slot="alert-dialog-description"
              className={cn('text-muted-foreground mt-2 text-sm')}
            >
              {description}
            </p>
          )}
          {children}
        </div>
      </ModalBody>
      <ModalFooter>
        {!hideCancel && (
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={handleCancel}
            disabled={busy}
          >
            {cancelLabel ?? text.cancel}
          </Button>
        )}
        <Button
          ref={actionRef}
          variant={variant === 'destructive' ? 'danger' : 'primary'}
          onClick={handleAction}
          disabled={actionDisabled}
          isLoading={busy}
          loadingText={text.busy}
        >
          {actionLabel ?? text.action}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

AlertDialog.displayName = 'AlertDialog';

export { AlertDialog };
