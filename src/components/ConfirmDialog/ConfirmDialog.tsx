'use client';

import * as React from 'react';

import { Button } from '../Button/Button';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal/Modal';
import { Textarea } from '../Textarea/Textarea';

export type ConfirmDialogVariant = 'default' | 'danger' | 'warning' | 'info';

export interface ConfirmDialogMessageFieldOptions {
  /** Label shown above the textarea. Defaults to "Personal Message (optional)". */
  label?: string;
  /** Placeholder inside the textarea. */
  placeholder?: string;
  /** Helper text shown under the textarea. */
  helperText?: string;
  /** Whether a message is required to confirm. Default false. */
  required?: boolean;
  /** Minimum character length if provided (enforced on submit). */
  minLength?: number;
  /** Maximum character length. Defaults to 1500. */
  maxLength?: number;
  /** Number of visible rows. Defaults to 4. */
  rows?: number;
  /** Initial value. */
  defaultValue?: string;
}

export interface ConfirmDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the dialog requests to close (cancel, overlay click, escape). */
  onOpenChange: (open: boolean) => void;
  /** Dialog title. */
  title: React.ReactNode;
  /** Body content — a description of what is about to happen. */
  description?: React.ReactNode;
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Visual intent. `danger` styles the confirm button as destructive,
   * `warning` uses a warning tone, `default` uses the primary action style.
   */
  variant?: ConfirmDialogVariant;
  /**
   * If provided, renders a textarea for an optional (or required) message
   * and passes its value to `onConfirm`. Pass `true` to enable with defaults,
   * or an options object to customize.
   */
  messageField?: boolean | ConfirmDialogMessageFieldOptions;
  /** Whether the confirm action is in-flight. Disables buttons and shows "Sending…". */
  isSubmitting?: boolean;
  /** Optional error text shown inside the dialog (e.g. after a failed submit). */
  errorMessage?: string;
  /**
   * Called when the user confirms. Receives the message string when
   * `messageField` is enabled, otherwise `undefined`.
   */
  onConfirm: (message: string | undefined) => void | Promise<void>;
  /** Called when the user cancels. Defaults to `onOpenChange(false)`. */
  onCancel?: () => void;
  /** Modal size. Defaults to `sm` (or `md` when messageField is enabled). */
  size?: 'sm' | 'md' | 'lg';
  /** Extra content rendered between the description and the message field. */
  children?: React.ReactNode;
}

function resolveMessageFieldOptions(
  field: ConfirmDialogProps['messageField']
): ConfirmDialogMessageFieldOptions | null {
  if (!field) return null;
  if (field === true) return {};
  return field;
}

/**
 * A confirmation dialog built on top of `Modal`. Supports an optional
 * "custom message" textarea — useful for invites / enrollment emails
 * where the sender can include a personal note.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = React.useState(false);
 *
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Send enrollment email?"
 *   description={`An email will be sent to ${employee.email}.`}
 *   confirmLabel="Send Email"
 *   messageField={{
 *     placeholder: 'Add a personal note to include in the invite…',
 *   }}
 *   onConfirm={async (message) => {
 *     await api.sendEnrollmentEmail(id, employerId, { optionalMessage: message });
 *     setOpen(false);
 *   }}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  messageField,
  isSubmitting = false,
  errorMessage,
  onConfirm,
  onCancel,
  size,
  children,
}: ConfirmDialogProps) {
  const fieldOpts = resolveMessageFieldOptions(messageField);
  const [message, setMessage] = React.useState(fieldOpts?.defaultValue ?? '');
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Reset state whenever the dialog is reopened or the default changes.
  React.useEffect(() => {
    if (open) {
      setMessage(fieldOpts?.defaultValue ?? '');
      setValidationError(null);
    }
  }, [open]);

  const handleCancel = React.useCallback(() => {
    if (isSubmitting) return;
    if (onCancel) onCancel();
    else onOpenChange(false);
  }, [isSubmitting, onCancel, onOpenChange]);

  const handleConfirm = React.useCallback(async () => {
    if (isSubmitting) return;

    let messageToSend: string | undefined;
    if (fieldOpts) {
      const trimmed = message.trim();
      if (fieldOpts.required && trimmed.length === 0) {
        setValidationError('A message is required.');
        return;
      }
      if (
        fieldOpts.minLength &&
        trimmed.length > 0 &&
        trimmed.length < fieldOpts.minLength
      ) {
        setValidationError(
          `Message must be at least ${fieldOpts.minLength} characters.`
        );
        return;
      }
      setValidationError(null);
      messageToSend = trimmed.length > 0 ? trimmed : undefined;
    }

    await onConfirm(messageToSend);
  }, [fieldOpts, isSubmitting, message, onConfirm]);

  const confirmVariant: 'danger' | 'primary' =
    variant === 'danger' ? 'danger' : 'primary';

  const resolvedSize = size ?? (fieldOpts ? 'md' : 'sm');
  const maxLength = fieldOpts?.maxLength ?? 1500;
  const rows = fieldOpts?.rows ?? 4;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && isSubmitting) return; // prevent close mid-submit
        onOpenChange(next);
      }}
      size={resolvedSize}
      closeOnEscape={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}

        {children}

        {fieldOpts && (
          <Textarea
            id="confirm-dialog-message"
            label={fieldOpts.label ?? 'Personal Message (optional)'}
            rows={rows}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={fieldOpts.placeholder}
            maxLength={maxLength}
            showCount
            helperText={fieldOpts.helperText}
            disabled={isSubmitting}
            required={fieldOpts.required}
          />
        )}

        {(errorMessage || validationError) && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {validationError ?? errorMessage}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending…' : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default ConfirmDialog;
