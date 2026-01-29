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
    <div
      className={`min-h-screen flex flex-col md:flex-row ${className}`}
    >
      {/* Left side - Provider branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 p-8 flex flex-col items-center justify-center text-white">
        {providerLogo ? (
          <img
            src={providerLogo}
            alt={providerName || 'Provider'}
            className="max-w-[200px] max-h-[100px] object-contain mb-6"
          />
        ) : (
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
        )}
        {providerName && (
          <h1 className="text-2xl font-bold text-center mb-2">
            {providerName}
          </h1>
        )}
        <p className="text-blue-100 text-center max-w-xs">
          {welcomeMessage}
        </p>
      </div>

      {/* Right side - Lookup form */}
      <div className="md:w-1/2 p-8 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Order Lookup
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your order details to view your information.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {(errorMessage || notFound) && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
                  Looking up order...
                </>
              ) : (
                'Look Up Order'
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            Need help?{' '}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderLookupForm;
