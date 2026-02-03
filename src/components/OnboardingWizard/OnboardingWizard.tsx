'use client';

import * as React from 'react';
import { cn } from '../../utils';
import { Button } from '../Button';
import { Alert } from '../Alert';
import { Spinner } from '../Spinner';
import { Progress } from '../Progress';

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
        'onboarding-wizard bg-background text-foreground fixed inset-0 z-50 flex flex-col',
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
          <Spinner size="xl" />
          <p className="text-muted-foreground mt-4 text-center text-lg">
            {loadingMessage}
          </p>
        </div>
      ) : (
        <div className="container mx-auto flex flex-1 flex-col p-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {currentStepData?.content}
          </div>

          {/* Footer Buttons */}
          <div className="border-border mt-auto border-t pt-4">
            {/* Skip Button (top right of footer) */}
            {!isLastStep && currentStepData?.skippable !== false && (
              <div className="mb-3 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSkip}
                  className="rounded-full"
                >
                  {skip}
                </Button>
              </div>
            )}

            {/* Navigation Row */}
            <div className="bg-background flex w-full items-center gap-4">
              {/* Back Button - always visible, disabled on first step */}
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!backEnabled || isFirstStep}
              >
                <span className="hidden sm:inline">{back}</span>
                <i className="fas fa-chevron-left sm:hidden" />
              </Button>

              {/* Progress Bar */}
              <div className="flex-1">
                <Progress
                  value={progressPercent}
                  size="lg"
                  variant="success"
                  showValue
                  formatValue={() => `${currentStep + 1} of ${totalSteps}`}
                  label={`Step ${currentStep + 1} of ${totalSteps}`}
                />
              </div>

              {/* Next/Finish Button */}
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!nextEnabled && !isLastStep}
              >
                <span className="hidden sm:inline">
                  {isLastStep ? finish : next}
                </span>
                {!isLastStep && (
                  <i className="fas fa-chevron-right sm:hidden" />
                )}
              </Button>
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
          <div className="bg-muted text-muted-foreground hidden rounded-full p-3">
            <i className={cn(icon, 'text-lg')} />
          </div>
        )}
        <div>
          <h3 className="text-foreground mb-2 text-2xl font-bold">{title}</h3>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.id}
              variant={option.selected ? 'primary' : 'outline'}
              onClick={() => onSelect?.(option.id)}
              className="rounded-full"
            >
              {option.icon && <i className={cn(option.icon, 'mr-2')} />}
              {option.label}
            </Button>
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
          <p className="text-foreground mb-0 text-2xl">
            <i className="fas fa-check-circle mr-2 text-green-500" />
            Setup complete!
          </p>
          <p className="text-muted-foreground">
            You&apos;re all set up! You can now start using BlueHive to manage
            your employees.
          </p>
        </div>

        <div className="my-6 flex flex-wrap gap-3">
          <Button variant="primary" onClick={onStartOrder}>
            <i className="fas fa-shopping-cart mr-2" />
            Start your first order
          </Button>
          <Button variant="outline" onClick={onGoToDashboard}>
            <i className="fas fa-tachometer-alt mr-2" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={onGoToEmployees}>
            <i className="fas fa-users mr-2" />
            Go to Employees
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-4">
        <h3 className="text-foreground mb-2 text-2xl font-bold">
          Some steps not completed
        </h3>
        <p className="text-muted-foreground">
          You still need to complete some steps to finish the full guided
          onboarding. If you&apos;re in a hurry, you can skip them for now and
          come back later.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {incompleteSteps.map(({ step, label }) => (
          <Button
            key={step}
            variant="outline"
            onClick={() => onGoToStep?.(step)}
            className="rounded-full"
          >
            Step {step}
            {label && `: ${label}`}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default OnboardingWizard;
