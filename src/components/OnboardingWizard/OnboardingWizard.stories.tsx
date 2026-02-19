import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  OnboardingWizard,
  OnboardingStepQuestion,
  OnboardingCompletion,
} from './OnboardingWizard';
import { Button } from '../Button';
import { Input } from '../Input';

// =============================================================================
// Sample Steps Data
// =============================================================================

const sampleSteps = [
  {
    id: 'step1',
    title: 'Company Info',
    description: 'Tell us about your company',
    icon: 'fas fa-building',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-building"
        title="What industry is your company in?"
        description="This helps us customize your experience."
        options={[
          { id: 'healthcare', label: 'Healthcare', icon: 'fas fa-heartbeat' },
          {
            id: 'construction',
            label: 'Construction',
            icon: 'fas fa-hard-hat',
          },
          {
            id: 'transportation',
            label: 'Transportation',
            icon: 'fas fa-truck',
          },
          {
            id: 'manufacturing',
            label: 'Manufacturing',
            icon: 'fas fa-industry',
          },
          { id: 'other', label: 'Other', icon: 'fas fa-ellipsis-h' },
        ]}
      />
    ),
  },
  {
    id: 'step2',
    title: 'Company Size',
    description: 'How many employees?',
    icon: 'fas fa-users',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-users"
        title="How many employees does your company have?"
        description="We'll recommend the best plan for your needs."
        options={[
          { id: '1-10', label: '1-10' },
          { id: '11-50', label: '11-50' },
          { id: '51-200', label: '51-200' },
          { id: '201-500', label: '201-500' },
          { id: '500+', label: '500+' },
        ]}
      />
    ),
  },
  {
    id: 'step3',
    title: 'Import Employees',
    description: 'Add your team',
    icon: 'fas fa-file-import',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-file-import"
        title="Import your employees"
        description="Import from your HR / HCM / HRIS / payroll system or upload a CSV."
      >
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" className="rounded-full">
            <i className="fas fa-file-import mr-2" />
            Import from HR Platform
          </Button>
          <Button variant="secondary" className="rounded-full">
            <i className="fas fa-file-upload mr-2" />
            Upload CSV
          </Button>
          <Button variant="secondary" className="rounded-full">
            <i className="fas fa-user-plus mr-2" />
            Add Manually
          </Button>
        </div>
      </OnboardingStepQuestion>
    ),
  },
  {
    id: 'step4',
    title: 'Payment',
    description: 'Set up billing',
    icon: 'fas fa-credit-card',
    content: (
      <OnboardingStepQuestion
        icon="fas fa-credit-card"
        title="Set up payment"
        description="Add your payment method to start ordering services."
      >
        <div className="border-border bg-muted/30 mx-auto mt-6 max-w-md rounded-lg border p-6">
          <div className="space-y-4">
            <Input
              id="card-number"
              label="Card Number"
              placeholder="4242 4242 4242 4242"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input id="card-expiry" label="Expiry" placeholder="MM/YY" />
              <Input id="card-cvc" label="CVC" placeholder="123" />
            </div>
          </div>
        </div>
      </OnboardingStepQuestion>
    ),
  },
  {
    id: 'step5',
    title: 'Complete',
    description: 'All done!',
    icon: 'fas fa-check',
    content: (
      <OnboardingCompletion
        completed={true}
        onStartOrder={() => window.alert('Start order!')}
        onGoToDashboard={() => window.alert('Go to dashboard!')}
        onGoToEmployees={() => window.alert('Go to employees!')}
      />
    ),
  },
];

// =============================================================================
// Demo Mode Types
// =============================================================================

type DemoMode =
  | 'interactive'
  | 'loading'
  | 'error'
  | 'customBranding'
  | 'noHeader'
  | 'incomplete';

// =============================================================================
// Interactive Demo Wrapper
// =============================================================================

interface OnboardingWizardDemoProps {
  demoMode?: DemoMode;
  currentStep?: number;
  showHeader?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
  brandName?: string;
  brandSubname?: string;
  nextEnabled?: boolean;
  backEnabled?: boolean;
}

function OnboardingWizardDemo({
  demoMode = 'interactive',
  currentStep: initialStep = 0,
  showHeader = true,
  loading = false,
  loadingMessage = 'Getting ready, one moment please...',
  error,
  brandName = 'BlueHive',
  brandSubname = 'for employers',
  nextEnabled = true,
  backEnabled = true,
}: OnboardingWizardDemoProps) {
  // For incomplete mode, start at the completion step (4) if no initialStep specified
  const effectiveInitialStep =
    demoMode === 'incomplete' && initialStep === 0 ? 4 : initialStep;
  const [currentStep, setCurrentStep] = React.useState(effectiveInitialStep);

  // Sync with Storybook controls
  React.useEffect(() => {
    // For incomplete mode, default to completion step if control is at 0
    const step =
      demoMode === 'incomplete' && initialStep === 0 ? 4 : initialStep;
    setCurrentStep(step);
  }, [initialStep, demoMode]);

  // Get steps based on demo mode
  const getSteps = () => {
    if (demoMode === 'incomplete') {
      return [
        ...sampleSteps.slice(0, 4),
        {
          id: 'step5',
          title: 'Complete',
          description: 'Review',
          icon: 'fas fa-check',
          content: (
            <OnboardingCompletion
              completed={false}
              incompleteSteps={[
                { step: 3, label: 'Import Employees' },
                { step: 4, label: 'Payment' },
              ]}
              onGoToStep={(step) => setCurrentStep(step - 1)}
            />
          ),
        },
      ];
    }
    return sampleSteps;
  };

  // Demo-specific overrides
  const getProps = () => {
    const baseProps = {
      steps: getSteps(),
      currentStep,
      onStepChange: setCurrentStep,
      onComplete: () => window.alert('Onboarding complete!'),
      onSkip: (step: number) => console.log('Skipped step:', step),
      showHeader,
      nextEnabled,
      backEnabled,
    };

    switch (demoMode) {
      case 'loading':
        return { ...baseProps, loading: true, loadingMessage };
      case 'error':
        return {
          ...baseProps,
          error: error || 'Something went wrong. Please try again.',
        };
      case 'customBranding':
        return {
          ...baseProps,
          brandName: 'Enterprise Health',
          brandSubname: 'Occupational Health',
          logoUrl:
            'https://www.enterprisehealth.com/hs-fs/hubfs/CMS%20Site-24/EH-Logo-Refresh.png',
        };
      case 'noHeader':
        return { ...baseProps, showHeader: false };
      case 'incomplete':
        return baseProps;
      case 'interactive':
      default:
        return { ...baseProps, brandName, brandSubname, loading, error };
    }
  };

  return (
    <div className="border-border relative h-[700px] overflow-hidden rounded-lg border shadow-lg">
      <OnboardingWizard
        {...getProps()}
        className="!absolute !inset-0 !h-full"
      />
    </div>
  );
}

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof OnboardingWizardDemo> = {
  title: 'Feature Modules/OnboardingWizard',
  component: OnboardingWizardDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A multi-step onboarding wizard for guiding users through setup flows. Features include progress tracking, step navigation, loading states, error handling, and customizable branding. **Use the Demo Mode control** to explore different states.',
      },
    },
  },
  args: {
    demoMode: 'interactive',
    currentStep: 0,
    showHeader: true,
    loading: false,
    loadingMessage: 'Getting ready, one moment please...',
    error: '',
    brandName: 'BlueHive',
    brandSubname: 'for employers',
    nextEnabled: true,
    backEnabled: true,
  },
  argTypes: {
    demoMode: {
      control: 'select',
      options: [
        'interactive',
        'loading',
        'error',
        'customBranding',
        'noHeader',
        'incomplete',
      ],
      description: 'Switch between different demo scenarios',
      table: { category: 'Demo' },
    },
    currentStep: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: 'Current step index (0-4)',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    showHeader: {
      control: 'boolean',
      description: 'Show the header with branding',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    loadingMessage: {
      control: 'text',
      description: 'Message shown during loading',
      if: { arg: 'demoMode', eq: 'loading' },
    },
    error: {
      control: 'text',
      description: 'Error message to display',
      if: { arg: 'demoMode', eq: 'error' },
    },
    brandName: {
      control: 'text',
      description: 'Brand name in header',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    brandSubname: {
      control: 'text',
      description: 'Brand subname in header',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    nextEnabled: {
      control: 'boolean',
      description: 'Enable/disable Next button',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
    backEnabled: {
      control: 'boolean',
      description: 'Enable/disable Back button',
      if: { arg: 'demoMode', eq: 'interactive' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingWizardDemo>;

// =============================================================================
// Stories
// =============================================================================

/** Interactive demo - use controls to navigate and customize */
export const Default: Story = {};

/** Loading state with customizable message */
export const Loading: Story = {
  args: { demoMode: 'loading', loadingMessage: 'Setting up your account...' },
};

/** Error state with alert banner */
export const WithError: Story = {
  args: {
    demoMode: 'error',
    error: 'Unable to save your progress. Please check your connection.',
  },
};

/** Custom branding example (Enterprise Health) */
export const CustomBranding: Story = {
  args: { demoMode: 'customBranding' },
};

/** Wizard without header */
export const NoHeader: Story = {
  args: { demoMode: 'noHeader', currentStep: 1 },
};

/** Completion step with incomplete items */
export const IncompleteSteps: Story = {
  args: { demoMode: 'incomplete' },
};

/** Import Employees step */
export const ImportStep: Story = {
  args: { demoMode: 'interactive', currentStep: 2 },
};

/** Payment step */
export const PaymentStep: Story = {
  args: { demoMode: 'interactive', currentStep: 3 },
};

/** Completion step (all complete) */
export const CompletionStep: Story = {
  args: { demoMode: 'interactive', currentStep: 4 },
};

/** Mobile viewport */
export const Mobile: Story = {
  args: { demoMode: 'interactive', currentStep: 2 },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
