'use client';

import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Textarea } from '../Textarea/Textarea';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string;
  employeeId?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  selected?: boolean;
}

export interface CreateReferralModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for creating the referral */
  onSubmit?: (data: ReferralData) => void;
  /** Employee for the referral */
  employee?: Employee;
  /** Available services to select */
  services?: ServiceOption[];
  /** Employer name */
  employerName?: string;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Currency symbol */
  currency?: string;
}

export interface ReferralData {
  employeeId: string;
  serviceIds: string[];
  notes?: string;
  priority?: 'normal' | 'urgent' | 'stat';
}

/**
 * CreateReferralModal allows selecting services and creating a referral for an employee.
 */
export function CreateReferralModal({
  open,
  onOpenChange,
  onSubmit,
  employee,
  services = [],
  employerName,
  isSubmitting = false,
  errorMessage,
  currency = '$',
}: CreateReferralModalProps) {
  const [selectedServices, setSelectedServices] = React.useState<Set<string>>(
    new Set()
  );
  const [notes, setNotes] = React.useState('');
  const [priority, setPriority] = React.useState<'normal' | 'urgent' | 'stat'>(
    'normal'
  );

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedServices(new Set());
      setNotes('');
      setPriority('normal');
    }
  }, [open]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const totalPrice = services
    .filter((s) => selectedServices.has(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || selectedServices.size === 0 || !onSubmit) return;
    onSubmit({
      employeeId: employee.id,
      serviceIds: Array.from(selectedServices),
      notes: notes.trim() || undefined,
      priority,
    });
  };

  const isValid = employee && selectedServices.size > 0;

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Create Referral</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
              <p className="text-destructive text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Employee info */}
          {employee && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
                Employee
              </p>
              <p className="text-foreground font-medium">
                {employee.firstName} {employee.lastName}
              </p>
              {employee.email && (
                <p className="text-muted-foreground text-sm">
                  {employee.email}
                </p>
              )}
              {employerName && (
                <p className="text-muted-foreground text-sm">{employerName}</p>
              )}
            </div>
          )}

          {/* Services selection */}
          <div>
            <p className="text-foreground mb-2 text-sm font-medium">
              Select Services
            </p>
            {services.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No services available
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {services.map((service) => {
                  const isSelected = selectedServices.has(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border/80'
                      } `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-input'
                            } `}
                          >
                            {isSelected && (
                              <svg
                                className="text-primary-foreground h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-foreground font-medium">
                              {service.name}
                            </p>
                            {service.description && (
                              <p className="text-muted-foreground text-xs">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-foreground font-medium">
                          {currency}
                          {service.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <p className="text-foreground mb-2 text-sm font-medium">Priority</p>
            <div className="flex gap-2">
              {(['normal', 'urgent', 'stat'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    priority === p
                      ? p === 'stat'
                        ? 'bg-destructive/10 text-destructive'
                        : p === 'urgent'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  } `}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Textarea
              id="referral-notes"
              label="Notes (Optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions..."
            />
          </div>

          {/* Cost summary */}
          {selectedServices.size > 0 && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {selectedServices.size} service
                    {selectedServices.size > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">
                    Estimated Total
                  </p>
                  <p className="text-foreground text-xl font-bold">
                    {currency}
                    {totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
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
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 -ml-1 h-4 w-4 animate-spin"
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
                Creating...
              </>
            ) : (
              'Create Referral'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default CreateReferralModal;
