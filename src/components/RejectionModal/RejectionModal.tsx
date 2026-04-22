'use client';

import * as React from 'react';

import { cn } from '../../utils';
import { Button } from '../Button/Button';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal/Modal';

export interface RejectionReason {
  id: string;
  label: string;
  requiresDetails?: boolean;
}

export interface RejectionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for submitting the rejection */
  onSubmit?: (data: { reasonId: string; details?: string }) => void;
  /** Title for the modal */
  title?: string;
  /** Description text */
  description?: string;
  /** Item being rejected (for display) */
  itemDescription?: string;
  /** Available rejection reasons */
  reasons?: RejectionReason[];
  /** Whether to show a free-form details field */
  showDetails?: boolean;
  /** Details field label */
  detailsLabel?: string;
  /** Details field placeholder */
  detailsPlaceholder?: string;
  /** Whether details are required */
  requireDetails?: boolean;
  /** Submit button text */
  submitLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Variant for styling */
  variant?: 'default' | 'danger';
}

const defaultReasons: RejectionReason[] = [
  { id: 'incomplete', label: 'Incomplete information' },
  { id: 'invalid', label: 'Invalid request' },
  { id: 'duplicate', label: 'Duplicate entry' },
  { id: 'policy', label: 'Does not meet policy requirements' },
  { id: 'other', label: 'Other', requiresDetails: true },
];

/**
 * RejectionModal provides a form for rejecting items with reason and details.
 */
export function RejectionModal({
  open,
  onOpenChange,
  onSubmit,
  title = 'Reject Item',
  description,
  itemDescription,
  reasons = defaultReasons,
  showDetails = true,
  detailsLabel = 'Additional Details',
  detailsPlaceholder = 'Provide additional context for this rejection...',
  requireDetails = false,
  submitLabel = 'Reject',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  variant = 'danger',
}: RejectionModalProps) {
  const [selectedReasonId, setSelectedReasonId] = React.useState('');
  const [details, setDetails] = React.useState('');

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedReasonId('');
      setDetails('');
    }
  }, [open]);

  const selectedReason = reasons.find((r) => r.id === selectedReasonId);
  const needsDetails = requireDetails || selectedReason?.requiresDetails;
  const isValid =
    selectedReasonId && (!needsDetails || details.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !onSubmit) return;

    onSubmit({
      reasonId: selectedReasonId,
      details: details.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Description or item info */}
          {(description || itemDescription) && (
            <div className="rounded-lg bg-muted p-3">
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {itemDescription && (
                <p className="mt-1 text-sm font-medium text-foreground">
                  {itemDescription}
                </p>
              )}
            </div>
          )}

          {/* Warning message */}
          {variant === 'danger' && (
            <div className="border-destructive/30 bg-destructive/10 flex items-start gap-3 rounded-lg border p-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-destructive">
                This action cannot be undone. The affected party will be
                notified of this rejection.
              </p>
            </div>
          )}

          {/* Reason selection */}
          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Reason for rejection
            </span>
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label
                  key={reason.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                    selectedReasonId === reason.id
                      ? 'border-primary bg-primary/10'
                      : 'hover:border-muted-foreground/50 border-border'
                  )}
                >
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason.id}
                    checked={selectedReasonId === reason.id}
                    onChange={(e) => setSelectedReasonId(e.target.value)}
                    className="text-primary focus:ring-primary h-4 w-4 border-border"
                  />
                  <span className="text-sm text-foreground">
                    {reason.label}
                  </span>
                  {reason.requiresDetails && (
                    <span className="text-xs text-muted-foreground">
                      (requires details)
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Details textarea */}
          {showDetails && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {detailsLabel}
                {needsDetails && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={detailsPlaceholder}
                required={needsDetails}
              />
              {needsDetails && !details.trim() && selectedReasonId && (
                <p className="mt-1 text-xs text-destructive">
                  Please provide additional details for this rejection reason.
                </p>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default RejectionModal;
