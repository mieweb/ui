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
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Badge } from '../Badge/Badge';
import { Textarea } from '../Textarea/Textarea';

export interface EmployerOption {
  id: string;
  name: string;
}

export interface OrderOption {
  id: string;
  orderNumber: string;
  employeeName: string;
  serviceName: string;
  date: Date | string;
  amount: number;
  selected?: boolean;
}

export interface CreateInvoiceData {
  employerId: string;
  orderIds: string[];
  dueDate: string;
  notes?: string;
}

export interface CreateInvoiceModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for creating the invoice */
  onSubmit?: (data: CreateInvoiceData) => void;
  /** Available employers */
  employers: EmployerOption[];
  /** Available orders (filtered by selected employer) */
  orders?: OrderOption[];
  /** Handler for loading orders when employer changes */
  onEmployerChange?: (employerId: string) => void;
  /** Whether orders are loading */
  isLoadingOrders?: boolean;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Currency symbol */
  currency?: string;
  /** Default due date offset in days */
  defaultDueDays?: number;
}

/**
 * CreateInvoiceModal provides a multi-step wizard for creating invoices.
 */
export function CreateInvoiceModal({
  open,
  onOpenChange,
  onSubmit,
  employers,
  orders = [],
  onEmployerChange,
  isLoadingOrders = false,
  isSubmitting = false,
  errorMessage,
  currency = '$',
  defaultDueDays = 30,
}: CreateInvoiceModalProps) {
  const [step, setStep] = React.useState(1);
  const [employerId, setEmployerId] = React.useState('');
  const [selectedOrders, setSelectedOrders] = React.useState<Set<string>>(
    new Set()
  );
  const [dueDate, setDueDate] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setEmployerId('');
      setSelectedOrders(new Set());
      setDueDate('');
      setNotes('');
    }
  }, [open]);

  // Set default due date
  React.useEffect(() => {
    if (!dueDate && open) {
      const date = new Date();
      date.setDate(date.getDate() + defaultDueDays);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [open, dueDate, defaultDueDays]);

  const handleEmployerChange = (value: string) => {
    setEmployerId(value);
    setSelectedOrders(new Set());
    onEmployerChange?.(value);
  };

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)));
    }
  };

  const totalAmount = orders
    .filter((o) => selectedOrders.has(o.id))
    .reduce((sum, o) => sum + o.amount, 0);

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerId || selectedOrders.size === 0 || !onSubmit) return;
    onSubmit({
      employerId,
      orderIds: Array.from(selectedOrders),
      dueDate,
      notes: notes.trim() || undefined,
    });
  };

  const canProceed = step === 1 ? employerId : selectedOrders.size > 0;
  const canSubmit = employerId && selectedOrders.size > 0 && dueDate;

  const employerOptions = employers.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <ModalTitle>Create Invoice</ModalTitle>
            <Badge variant="secondary">Step {step} of 3</Badge>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
              <p className="text-destructive text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Step 1: Select Employer */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Select the employer you want to create an invoice for.
              </p>
              <Select
                label="Employer"
                options={employerOptions}
                value={employerId}
                onValueChange={handleEmployerChange}
                placeholder="Select an employer"
              />
            </div>
          )}

          {/* Step 2: Select Orders */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Select the completed orders to include in this invoice.
                </p>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllOrders}
                    className="text-primary text-sm hover:underline"
                  >
                    {selectedOrders.size === orders.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                )}
              </div>

              {isLoadingOrders ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-muted h-16 animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="border-border rounded-lg border border-dashed py-8 text-center">
                  <svg
                    className="text-muted-foreground/60 mx-auto mb-2 h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-muted-foreground text-sm">
                    No unbilled orders found for this employer
                  </p>
                </div>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {orders.map((order) => {
                    const isSelected = selectedOrders.has(order.id);
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => toggleOrder(order.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border/80'
                        } `}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-input'
                            } `}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3 text-white"
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-foreground font-medium">
                                {order.orderNumber}
                              </p>
                              <span className="text-foreground font-medium">
                                {formatCurrency(order.amount)}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {order.employeeName} • {order.serviceName} •{' '}
                              {formatDate(order.date)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected summary */}
              {selectedOrders.size > 0 && (
                <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                  <span className="text-muted-foreground text-sm">
                    {selectedOrders.size} order
                    {selectedOrders.size > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-foreground text-lg font-bold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Configure */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Review and configure the invoice details.
              </p>

              {/* Summary */}
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Employer
                  </span>
                  <span className="text-foreground text-sm font-medium">
                    {employers.find((e) => e.id === employerId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Orders</span>
                  <span className="text-foreground text-sm font-medium">
                    {selectedOrders.size} items
                  </span>
                </div>
                <div className="border-border flex justify-between border-t pt-2">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-foreground text-xl font-bold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <Input
                type="date"
                label="Due Date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />

              <Textarea
                label="Notes (Optional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this invoice..."
              />
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="flex w-full justify-between">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
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
                    'Create Invoice'
                  )}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default CreateInvoiceModal;
