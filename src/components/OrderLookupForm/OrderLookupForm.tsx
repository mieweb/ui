'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

export interface OrderLookupFormProps {
  /** Handler for form submission */
  onSubmit?: (data: OrderLookupData) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Whether the order was not found */
  notFound?: boolean;
  /** Provider logo URL */
  providerLogo?: string;
  /** Provider name */
  providerName?: string;
  /** Custom welcome message */
  welcomeMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface OrderLookupData {
  orderNumber: string;
  dateOfBirth: string;
  lastName: string;
}

/**
 * OrderLookupForm provides a public-facing form to look up an order.
 */
export function OrderLookupForm({
  onSubmit,
  isSubmitting = false,
  errorMessage,
  notFound = false,
  providerLogo,
  providerName,
  welcomeMessage = 'Look up your order by entering the information below.',
  className = '',
}: OrderLookupFormProps) {
  const [formData, setFormData] = React.useState<OrderLookupData>({
    orderNumber: '',
    dateOfBirth: '',
    lastName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.dateOfBirth || !formData.lastName) {
      return;
    }
    onSubmit?.(formData);
  };

  const isValid =
    formData.orderNumber.trim() &&
    formData.dateOfBirth.trim() &&
    formData.lastName.trim();

  return (
    <div className={`flex min-h-screen flex-col md:flex-row ${className}`}>
      {/* Left side - Provider branding */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white md:w-1/2 dark:from-blue-800 dark:to-blue-950">
        {providerLogo ? (
          <img
            src={providerLogo}
            alt={providerName || 'Provider'}
            className="mb-6 max-h-[100px] max-w-[200px] object-contain"
          />
        ) : (
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
        )}
        {providerName && (
          <h1 className="mb-2 text-center text-2xl font-bold">
            {providerName}
          </h1>
        )}
        <p className="max-w-xs text-center text-blue-100">{welcomeMessage}</p>
      </div>

      {/* Right side - Lookup form */}
      <div className="flex items-center justify-center bg-white p-8 md:w-1/2 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Order Lookup
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Enter your order details to view your information.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {(errorMessage || notFound) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage ||
                    'Order not found. Please check your information and try again.'}
                </p>
              </div>
            )}

            <Input
              label="Order Number"
              value={formData.orderNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  orderNumber: e.target.value,
                }))
              }
              placeholder="e.g., ORD-2024-001"
              required
              autoComplete="off"
            />

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dateOfBirth: e.target.value,
                }))
              }
              required
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Enter your last name"
              required
              autoComplete="family-name"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
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
                  Looking up order...
                </>
              ) : (
                'Look Up Order'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderLookupForm;
