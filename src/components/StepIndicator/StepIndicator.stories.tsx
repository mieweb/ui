import type { Meta, StoryObj } from '@storybook/react';
import { StepIndicator } from './StepIndicator';

const meta: Meta<typeof StepIndicator> = {
  title: 'Components/StepIndicator',
  component: StepIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

const basicSteps = [
  { id: 1, label: 'Schedule' },
  { id: 2, label: 'Confirm' },
  { id: 3, label: 'Results' },
];

const detailedSteps = [
  { id: 1, label: 'Account', description: 'Create your account' },
  { id: 2, label: 'Profile', description: 'Set up your profile' },
  { id: 3, label: 'Preferences', description: 'Configure settings' },
  { id: 4, label: 'Complete', description: 'Review and finish' },
];

export const Default: Story = {
  args: {
    steps: basicSteps,
    currentStep: 0,
  },
};

export const SecondStep: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
  },
};

export const ThirdStep: Story = {
  args: {
    steps: basicSteps,
    currentStep: 2,
  },
};

export const AllComplete: Story = {
  args: {
    steps: basicSteps,
    currentStep: 3,
  },
};

export const WithDescriptions: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 1,
  },
};

export const Vertical: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 2,
    orientation: 'vertical',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const Small: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    steps: basicSteps,
    currentStep: 1,
    size: 'lg',
  },
};

export const WithError: Story = {
  args: {
    steps: [
      { id: 1, label: 'Details', description: 'Enter order details' },
      { id: 2, label: 'Payment', description: 'Payment failed', hasError: true },
      { id: 3, label: 'Confirm', description: 'Review and confirm' },
    ],
    currentStep: 1,
  },
};

export const WithOptionalStep: Story = {
  args: {
    steps: [
      { id: 1, label: 'Required Step' },
      { id: 2, label: 'Optional Step', optional: true },
      { id: 3, label: 'Final Step' },
    ],
    currentStep: 0,
  },
};

export const Clickable: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 2,
    onStepClick: (index) => console.log('Clicked step:', index),
  },
};

export const ClickableAllSteps: Story = {
  args: {
    steps: detailedSteps,
    currentStep: 2,
    onStepClick: (index) => console.log('Clicked step:', index),
    allowCompletedStepsOnly: false,
  },
};

export const WithCustomIcons: Story = {
  args: {
    steps: [
      {
        id: 1,
        label: 'Cart',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
      {
        id: 2,
        label: 'Shipping',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        ),
      },
      {
        id: 3,
        label: 'Payment',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
    ],
    currentStep: 1,
  },
};

export const OrderConfirmationFlow: Story = {
  args: {
    steps: [
      { id: 'schedule', label: 'Schedule', description: 'Pick appointment time' },
      { id: 'confirm', label: 'Confirm', description: 'Review order details' },
      { id: 'results', label: 'Upload Results', description: 'Enter test results' },
    ],
    currentStep: 1,
    size: 'md',
  },
};
