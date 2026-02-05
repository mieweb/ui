'use client';

import * as React from 'react';

export interface Step {
  /** Unique step identifier */
  id: string | number;
  /** Step label/title */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Whether this step has an error */
  hasError?: boolean;
  /** Whether this step is optional */
  optional?: boolean;
}

export interface StepIndicatorProps {
  /** Array of steps */
  steps: Step[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Orientation of the step indicator */
  orientation?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler for steps (for navigation) */
  onStepClick?: (stepIndex: number) => void;
  /** Whether to allow clicking on completed steps only */
  allowCompletedStepsOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * StepIndicator displays a multi-step progress indicator for wizards and forms.
 */
export function StepIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  size = 'md',
  onStepClick,
  allowCompletedStepsOnly = true,
  className = '',
}: StepIndicatorProps) {
  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6 text-xs',
      line: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
      gap: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
      text: 'text-xs',
    },
    md: {
      circle: 'w-8 h-8 text-sm',
      line: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
      gap: orientation === 'horizontal' ? 'gap-3' : 'gap-3',
      text: 'text-sm',
    },
    lg: {
      circle: 'w-10 h-10 text-base',
      line: orientation === 'horizontal' ? 'h-1' : 'w-1',
      gap: orientation === 'horizontal' ? 'gap-4' : 'gap-4',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  const handleStepClick = (index: number) => {
    if (!onStepClick) return;
    if (allowCompletedStepsOnly && index > currentStep) return;
    onStepClick(index);
  };

  const isClickable = (index: number) => {
    if (!onStepClick) return false;
    if (allowCompletedStepsOnly) return index <= currentStep;
    return true;
  };

  return (
    <nav
      className={` ${orientation === 'horizontal' ? 'flex items-center' : 'flex flex-col'} ${sizes.gap} ${className} `.trim()}
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;
        const clickable = isClickable(index);

        return (
          <React.Fragment key={step.id}>
            <div
              className={`flex items-center ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} ${sizes.gap} `.trim()}
            >
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!clickable}
                className={` ${sizes.circle} flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-neutral-900 ${clickable ? 'cursor-pointer' : 'cursor-default'} ${
                  step.hasError
                    ? 'bg-red-100 text-red-600 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-400'
                    : status === 'completed'
                      ? 'bg-primary-600 focus:ring-primary-500 dark:bg-primary-500 text-white dark:text-white'
                      : status === 'current'
                        ? 'bg-primary-600 ring-primary-600 focus:ring-primary-500 dark:bg-primary-500 dark:ring-primary-500 text-white ring-2 ring-offset-2 dark:text-white dark:ring-offset-neutral-900'
                        : 'bg-neutral-200 text-neutral-500 focus:ring-neutral-400 dark:bg-neutral-700 dark:text-neutral-300'
                } `.trim()}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {step.hasError ? (
                  <ErrorIcon className="h-4 w-4" />
                ) : status === 'completed' ? (
                  step.icon || <CheckIcon className="h-4 w-4" />
                ) : (
                  step.icon || <span>{index + 1}</span>
                )}
              </button>

              {/* Step Label */}
              <div
                className={` ${orientation === 'horizontal' ? 'text-center' : 'flex-1'} ${sizes.text} `.trim()}
              >
                <p
                  className={`font-medium ${
                    step.hasError
                      ? 'text-red-600 dark:text-red-400'
                      : status === 'completed' || status === 'current'
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-500 dark:text-neutral-400'
                  } `.trim()}
                >
                  {step.label}
                  {step.optional && (
                    <span className="font-normal text-neutral-500 dark:text-neutral-400">
                      {' '}
                      (optional)
                    </span>
                  )}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={` ${orientation === 'horizontal' ? 'flex min-w-8 flex-1 items-center justify-center' : `flex min-h-4 justify-center ${size === 'sm' ? 'w-6' : size === 'lg' ? 'w-10' : 'w-8'}`}`.trim()}
                aria-hidden="true"
              >
                <div
                  className={` ${orientation === 'horizontal' ? 'w-full' : 'h-full min-h-4'} ${sizes.line} ${
                    index < currentStep
                      ? 'bg-primary-600 dark:bg-primary-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  } `.trim()}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default StepIndicator;
