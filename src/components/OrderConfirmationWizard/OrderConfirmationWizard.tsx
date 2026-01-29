'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';
import { Input } from '../Input/Input';
import { Card, CardContent } from '../Card/Card';

export interface OrderDetails {
  id: string;
  orderNumber: string;
  employeeName: string;
  dateOfBirth?: string;
  serviceName: string;
  employerName: string;
  scheduledDate?: Date | string;
  notes?: string;
}

export interface ConfirmationResult {
  orderId: string;
  employeeVerified: boolean;
  consentObtained: boolean;
  idVerified: boolean;
  notes?: string;
}

export interface OrderConfirmationWizardProps {
  /** Order details to confirm */
  order: OrderDetails;
  /** Handler for completing the confirmation */
  onComplete?: (result: ConfirmationResult) => void;
  /** Handler for canceling */
  onCancel?: () => void;
  /** Handler for step changes */
  onStepChange?: (step: number) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Initial step (1-based) */
  initialStep?: number;
  /** Custom step titles */
  stepTitles?: [string, string, string];
  /** Additional CSS classes */
  className?: string;
}

/**
 * OrderConfirmationWizard provides a 3-step process for confirming orders.
 */
export function OrderConfirmationWizard({
  order,
  onComplete,
  onCancel,
  onStepChange,
  isSubmitting = false,
  initialStep = 1,
  stepTitles = ['Verify Employee', 'Consent & ID', 'Confirmation'],
  className = '',
}: OrderConfirmationWizardProps) {
  const [step, setStep] = React.useState(initialStep);
  const [employeeVerified, setEmployeeVerified] = React.useState(false);
  const [verificationNotes, setVerificationNotes] = React.useState('');
  const [consentObtained, setConsentObtained] = React.useState(false);
  const [idVerified, setIdVerified] = React.useState(false);
  const [idType, setIdType] = React.useState('');
  const [confirmationNotes, setConfirmationNotes] = React.useState('');

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const handleComplete = () => {
    if (!onComplete) return;
    onComplete({
      orderId: order.id,
      employeeVerified,
      consentObtained,
      idVerified,
      notes: [verificationNotes, confirmationNotes].filter(Boolean).join('\n'),
    });
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const canProceedStep1 = employeeVerified;
  const canProceedStep2 = consentObtained && idVerified;
  const canComplete = canProceedStep1 && canProceedStep2;

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {stepTitles.map((title, index) => {
            const stepNum = index + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;

            return (
              <React.Fragment key={stepNum}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium
                      ${
                        isComplete
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {isComplete ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium text-center
                      ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                    `}
                  >
                    {title}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-4
                      ${step > stepNum ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                    `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Order summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {order.orderNumber}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {order.serviceName}
              </p>
            </div>
            <Badge variant="warning">In Progress</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Step 1: Verify Employee */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Verify Employee Identity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please verify the following information matches the employee
                present.
              </p>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Employee Name
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.employeeName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.dateOfBirth || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Employer
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.employerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Scheduled
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(order.scheduledDate)}
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={employeeVerified}
                  onChange={(e) => setEmployeeVerified(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I confirm the employee&apos;s identity matches the information
                  above
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  rows={2}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Any verification notes..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Consent & ID */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Consent & ID Verification
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Obtain consent and verify government-issued identification.
              </p>

              <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={consentObtained}
                  onChange={(e) => setConsentObtained(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Consent Obtained
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Employee has provided written or verbal consent for the
                    requested services
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Photo ID Verified
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Government-issued photo ID matches employee information
                  </p>
                  {idVerified && (
                    <Input
                      placeholder="ID Type (e.g., Driver's License)"
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review & Confirm
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review the verification steps before proceeding.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Employee Identity Verified
                    </span>
                  </div>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Consent Obtained
                    </span>
                  </div>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Photo ID Verified {idType && `(${idType})`}
                    </span>
                  </div>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="Any additional notes for this order..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={() => handleStepChange(step - 1)}
              disabled={isSubmitting}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => handleStepChange(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Continue
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={!canComplete || isSubmitting}>
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
                  Processing...
                </>
              ) : (
                <>
                  Start Service
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationWizard;
