'use client';

import * as React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '../Modal/Modal';
import { Button } from '../Button/Button';

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

        <div className="space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Employee info */}
          {employee && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Employee
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </p>
              {employee.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employee.email}
                </p>
              )}
              {employerName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employerName}
                </p>
              )}
            </div>
          )}

          {/* Services selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Services
            </p>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No services available
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {services.map((service) => {
                  const isSelected = selectedServices.has(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`
                        w-full p-3 rounded-lg border text-left transition-colors
                        ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                            ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }
                          `}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
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
                            <p className="font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </p>
                            {service.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </p>
            <div className="flex gap-2">
              {(['normal', 'urgent', 'stat'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${
                      priority === p
                        ? p === 'stat'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : p === 'urgent'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions..."
            />
          </div>

          {/* Cost summary */}
          {selectedServices.size > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedServices.size} service
                    {selectedServices.size > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Estimated Total
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {currency}
                    {totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
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
