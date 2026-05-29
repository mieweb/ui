import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  Modal,
  ModalBody,
  ModalFooter,
  type ModalProps,
} from '../Modal';
import { Button } from '../Button';

export interface AlertDialogProps
  extends Pick<ModalProps, 'open' | 'onOpenChange'> {
  /** Dialog title */
  title: React.ReactNode;
  /** Optional descriptive body text */
  description?: React.ReactNode;
  /** Custom body content (rendered below the description) */
  children?: React.ReactNode;
  /** Label for the cancel button (default "Cancel") */
  cancelLabel?: React.ReactNode;
  /** Label for the confirm/action button (default "Continue") */
  actionLabel?: React.ReactNode;
  /** Called when the action button is clicked */
  onAction?: () => void;
  /** Called when the cancel button is clicked */
  onCancel?: () => void;
  /** Visual emphasis for the action button */
  variant?: 'default' | 'destructive';
  /** Disables the action button */
  actionDisabled?: boolean;
  /** Hides the cancel button */
  hideCancel?: boolean;
  /** Additional class name for the dialog content */
  className?: string;
}

/**
 * A modal dialog that interrupts the user with important content and expects
 * a response. Built on top of {@link Modal}.
 *
 * Unlike a regular Modal, it does not close on overlay click or Escape by
 * default — the user must explicitly choose an action.
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
 *   onAction={handleDelete}
 * />
 * ```
 */
function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = 'Cancel',
  actionLabel = 'Continue',
  onAction,
  onCancel,
  variant = 'default',
  actionDisabled,
  hideCancel,
  className,
}: AlertDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleAction = () => {
    onAction?.();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      className={className}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <ModalBody className="px-6 py-5">
        <h2
          data-slot="alert-dialog-title"
          className="text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>
        {description && (
          <p
            data-slot="alert-dialog-description"
            className={cn('text-muted-foreground mt-2 text-sm')}
          >
            {description}
          </p>
        )}
        {children}
      </ModalBody>
      <ModalFooter>
        {!hideCancel && (
          <Button variant="secondary" onClick={handleCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button
          variant={variant === 'destructive' ? 'danger' : 'primary'}
          onClick={handleAction}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

AlertDialog.displayName = 'AlertDialog';

export { AlertDialog };
