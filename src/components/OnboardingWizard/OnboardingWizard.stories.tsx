import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  OnboardingWizard,
  OnboardingStepQuestion,
  OnboardingCompletion,
} from './OnboardingWizard';

const meta: Meta<typeof OnboardingWizard> = {
  title: 'Components/OnboardingWizard',
  component: OnboardingWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingWizard>;

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
          { id: 'construction', label: 'Construction', icon: 'fas fa-hard-hat' },
          { id: 'transportation', label: 'Transportation', icon: 'fas fa-truck' },
          { id: 'manufacturing', label: 'Manufacturing', icon: 'fas fa-industry' },
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
        description="Import your employees from your existing HR / HCM / HRIS / payroll system or upload a CSV file."
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-full border-2 border-primary bg-white px-4 py-2 text-primary">
            <i className="fas fa-file-import mr-2" />
            Import from HR Platform
          </button>
          <button className="rounded-full border-2 border-gray-300 px-4 py-2 text-gray-700">
            <i className="fas fa-file-upload mr-2" />
            Upload CSV
          </button>
          <button className="rounded-full border-2 border-gray-300 px-4 py-2 text-gray-700">
            <i className="fas fa-user-plus mr-2" />
            Manually add employees
          </button>
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
        <div className="mt-4 rounded-lg border border-gray-200 p-4">
          <p className="text-muted-foreground">Payment form would go here...</p>
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
        onStartOrder={() => alert('Start order!')}
        onGoToDashboard={() => alert('Go to dashboard!')}
        onGoToEmployees={() => alert('Go to employees!')}
      />
    ),
  },
];

export const Default: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);
    return (
      <OnboardingWizard
        steps={sampleSteps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={() => alert('Onboarding complete!')}
        onSkip={(step) => console.log('Skipped step:', step)}
      />
    );
  },
};

export const Loading: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 0,
    loading: true,
    loadingMessage: 'Setting up your account...',
  },
};

export const WithError: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 0,
    error: 'Something went wrong. Please try again.',
  },
};

export const CustomBranding: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 0,
    brandName: 'Enterprise Health',
    brandSubname: 'Occupational Health',
    logoUrl: '/images/eh/logo-white.svg',
  },
};

export const MiddleStep: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 2,
  },
};

export const LastStep: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 4,
  },
};

export const NextDisabled: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 1,
    nextEnabled: false,
  },
};

export const IncompleteSteps: Story = {
  render: () => {
    const incompleteSteps = [
      ...sampleSteps.slice(0, 4),
      {
        id: 'step5',
        title: 'Complete',
        content: (
          <OnboardingCompletion
            completed={false}
            incompleteSteps={[
              { step: 2, label: 'Import Employees' },
              { step: 4, label: 'Payment' },
            ]}
            onGoToStep={(step) => alert(`Go to step ${step}`)}
          />
        ),
      },
    ];
    return (
      <OnboardingWizard
        steps={incompleteSteps}
        currentStep={4}
      />
    );
  },
};

export const NoHeader: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 0,
    showHeader: false,
  },
};

export const CustomLabels: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 1,
    labels: {
      back: 'Previous',
      next: 'Continue',
      skip: 'Skip for now',
      finish: 'Complete Setup',
    },
  },
};

export const Mobile: Story = {
  args: {
    steps: sampleSteps,
    currentStep: 2,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
