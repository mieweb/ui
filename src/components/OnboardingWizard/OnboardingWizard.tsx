'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface OnboardingStep {
  /** Unique step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Optional step description */
  description?: string;
  /** Optional icon class (FontAwesome) */
  icon?: string;
  /** Whether this step can be skipped */
  skippable?: boolean;
  /** Whether this step is complete */
  complete?: boolean;
  /** Step content render function */
  content: React.ReactNode;
}

export interface OnboardingWizardProps {
  /** Array of onboarding steps */
  steps: OnboardingStep[];
  /** Current step index (0-based) */
  currentStep?: number;
  /** Callback when step changes */
  onStepChange?: (stepIndex: number) => void;
  /** Callback when wizard completes */
  onComplete?: () => void;
  /** Callback when user skips a step */
  onSkip?: (stepIndex: number) => void;
  /** Brand logo URL */
  logoUrl?: string;
  /** Brand name */
  brandName?: string;
  /** Brand subname */
  brandSubname?: string;
  /** Whether the wizard is in loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Error message to display */
  error?: string;
  /** Custom class name */
  className?: string;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Labels for buttons */
  labels?: {
    back?: string;
    next?: string;
    skip?: string;
    finish?: string;
  };
  /** Whether back button is enabled */
  backEnabled?: boolean;
  /** Whether next button is enabled */
  nextEnabled?: boolean;
}

export function OnboardingWizard({
  steps,
  currentStep = 0,
  onStepChange,
  onComplete,
  onSkip,
  logoUrl = 'https://mieweb.org/wp-content/uploads/2024/03/MIE-NEW-1.png',
  brandName = 'BlueHive',
  brandSubname = 'for employers',
  loading = false,
  loadingMessage = 'Getting ready, one moment please...',
  error,
  className,
  showHeader = true,
  headerContent,
  labels = {},
  backEnabled = true,
  nextEnabled = true,
}: OnboardingWizardProps) {
  const {
    back = 'Back',
    next = 'Next',
    skip = 'Skip this step',
    finish = 'Finish',
  } = labels;

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepData = steps[currentStep];
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange?.(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange?.(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onSkip?.(currentStep);
    if (!isLastStep) {
      onStepChange?.(currentStep + 1);
    }
  };

  return (
    <div
      className={cn(
        'onboarding-wizard fixed inset-0 z-50 flex flex-col bg-white',
        className
      )}
    >
      {/* Header */}
      {showHeader && (
        <nav className="bg-primary flex items-center px-4 py-3">
          <div className="flex items-center">
            <span className="flex items-center text-white">
              {logoUrl && (
                <img src={logoUrl} alt={`${brandName} Logo`} className="h-8" />
              )}
              <div className="ml-3 hidden flex-col lg:flex">
                <span className="text-lg font-semibold">{brandName}</span>
                {brandSubname && (
                  <span className="text-sm opacity-90">{brandSubname}</span>
                )}
              </div>
            </span>
          </div>
          {headerContent}
        </nav>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground mt-4 text-center text-lg">
            {loadingMessage}
          </p>
        </div>
      ) : (
        <div className="container mx-auto flex flex-1 flex-col p-4">
          {/* Error Alert */}
          {error && (
            <div className="border-destructive bg-destructive/10 text-destructive mb-4 rounded-lg border p-4">
              {error}
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {currentStepData?.content}
          </div>

          {/* Footer Buttons */}
          <div className="mt-auto border-t pt-4">
            {/* Skip Button (top right of footer) */}
            {!isLastStep && currentStepData?.skippable !== false && (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-full bg-gray-800 px-4 py-1.5 text-sm text-white shadow hover:bg-gray-700"
                >
                  {skip}
                </button>
              </div>
            )}

            {/* Navigation Row */}
            <div className="flex w-full items-center gap-4 bg-white">
              {/* Back Button */}
              {backEnabled && !isFirstStep ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">{back}</span>
                  <i className="fas fa-chevron-left sm:hidden" />
                </button>
              ) : (
                <div /> /* Spacer */
              )}

              {/* Progress Bar */}
              <div
                className="flex-1"
                role="progressbar"
                aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="flex h-full items-center justify-center bg-green-500 text-xs font-medium text-white transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  >
                    {currentStep + 1} of {totalSteps}
                  </div>
                </div>
              </div>

              {/* Next/Finish Button */}
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-3 text-white"
                >
                  {finish}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!nextEnabled}
                  className={cn(
                    'rounded-lg px-6 py-3 text-white',
                    nextEnabled
                      ? 'bg-primary hover:bg-primary/90'
                      : 'cursor-not-allowed bg-gray-300'
                  )}
                >
                  <span className="hidden sm:inline">{next}</span>
                  <i className="fas fa-chevron-right sm:hidden" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Step Content Components */

export interface OnboardingStepQuestionProps {
  /** Question icon */
  icon?: string;
  /** Question title */
  title: string;
  /** Question description */
  description?: string;
  /** Answer options */
  options?: Array<{
    id: string;
    label: string;
    icon?: string;
    selected?: boolean;
  }>;
  /** Callback when option is selected */
  onSelect?: (optionId: string) => void;
  /** Whether multiple selections are allowed */
  multiple?: boolean;
  /** Additional content below options */
  children?: React.ReactNode;
}

export function OnboardingStepQuestion({
  icon,
  title,
  description,
  options = [],
  onSelect,
  multiple: _multiple = false,
  children,
}: OnboardingStepQuestionProps) {
  return (
    <div className="py-4">
      <div className="mb-4 flex items-start gap-3">
        {icon && (
          <div className="hidden rounded-full bg-gray-800 p-3 text-white">
            <i className={cn(icon, 'text-lg')} />
          </div>
        )}
        <div>
          <h3 className="mb-2 text-2xl font-bold">{title}</h3>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect?.(option.id)}
              className={cn(
                'rounded-full border-2 px-4 py-2 transition-colors',
                option.selected
                  ? 'border-primary bg-primary text-white'
                  : 'hover:border-primary border-gray-300 bg-white text-gray-700'
              )}
            >
              {option.icon && <i className={cn(option.icon, 'mr-2')} />}
              {option.label}
            </button>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

export interface OnboardingCompletionProps {
  /** Whether setup is complete */
  completed: boolean;
  /** Incomplete steps */
  incompleteSteps?: Array<{ step: number; label: string }>;
  /** Callback to go to a specific step */
  onGoToStep?: (step: number) => void;
  /** Callback to start first order */
  onStartOrder?: () => void;
  /** Callback to go to dashboard */
  onGoToDashboard?: () => void;
  /** Callback to go to employees */
  onGoToEmployees?: () => void;
}

export function OnboardingCompletion({
  completed,
  incompleteSteps = [],
  onGoToStep,
  onStartOrder,
  onGoToDashboard,
  onGoToEmployees,
}: OnboardingCompletionProps) {
  if (completed) {
    return (
      <div className="py-4">
        <div className="mb-4">
          <p className="mb-0 text-2xl">
            <i className="fas fa-check-circle mr-2 text-green-500" />
            Setup complete!
          </p>
          <p className="text-muted-foreground">
            You&apos;re all set up! You can now start using BlueHive to manage
            your employees.
          </p>
        </div>

        <div className="my-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStartOrder}
            className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-white"
          >
            <i className="fas fa-shopping-cart mr-2" />
            Start your first order
          </button>
          <button
            type="button"
            onClick={onGoToDashboard}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <i className="fas fa-tachometer-alt mr-2" />
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={onGoToEmployees}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <i className="fas fa-users mr-2" />
            Go to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <h3 className="mb-2 text-2xl font-bold">Some steps not completed</h3>
        <p className="text-muted-foreground">
          You still need to complete some steps to finish the full guided
          onboarding. If you&apos;re in a hurry, you can skip them for now and
          come back later.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {incompleteSteps.map(({ step, label }) => (
          <button
            key={step}
            type="button"
            onClick={() => onGoToStep?.(step)}
            className="border-primary text-primary hover:bg-primary/10 rounded-full border px-4 py-2"
          >
            Step {step}
            {label && `: ${label}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default OnboardingWizard;
