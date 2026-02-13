import type { Meta, StoryObj } from '@storybook/react';
import { ClaimProviderForm } from './ClaimProviderForm';

const meta: Meta<typeof ClaimProviderForm> = {
  component: ClaimProviderForm,
  title: 'Inputs & Controls/ClaimProviderForm',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    providerName: {
      control: 'text',
      description: 'Provider name being claimed',
    },
    providerAddress: {
      control: 'text',
      description: 'Provider address being claimed',
    },
    roleOptions: {
      control: false,
      description: 'Available role options',
    },
    languageOptions: {
      control: false,
      description: 'Available language options',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether submission is in progress',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
    },
    termsUrl: {
      control: 'text',
      description: 'Terms and conditions link URL',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    onSubmit: { action: 'onSubmit' },
    onCancel: { action: 'onCancel' },
  },
  args: {
    providerName: '',
    providerAddress: '',
    isSubmitting: false,
    errorMessage: '',
    termsUrl: '/terms',
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClaimProviderForm>;

/**
 * Interactive playground with all controls available.
 * Use the Controls panel to adjust props dynamically.
 */
export const Playground: Story = {
  args: {
    providerName: 'ABC Medical Center',
    providerAddress: '123 Healthcare Blvd, Fort Wayne, IN 46802',
    isSubmitting: false,
    errorMessage: '',
    termsUrl: '/terms',
  },
};

export const Default: Story = {
  args: {
    providerName: 'ABC Medical Center',
    providerAddress: '123 Healthcare Blvd, Fort Wayne, IN 46802',
  },
};

export const WithoutProvider: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    providerName: 'ABC Medical Center',
    providerAddress: '123 Healthcare Blvd, Fort Wayne, IN 46802',
    errorMessage:
      'A claim request for this provider is already pending. Please contact support.',
  },
};

export const Submitting: Story = {
  args: {
    providerName: 'ABC Medical Center',
    providerAddress: '123 Healthcare Blvd, Fort Wayne, IN 46802',
    isSubmitting: true,
  },
};

export const CustomRoles: Story = {
  args: {
    providerName: 'XYZ Clinic',
    roleOptions: [
      { value: 'physician', label: 'Physician' },
      { value: 'nurse', label: 'Nurse Practitioner' },
      { value: 'pa', label: 'Physician Assistant' },
      { value: 'admin', label: 'Administrator' },
    ],
  },
};

export const WithCancel: Story = {
  args: {
    providerName: 'ABC Medical Center',
    providerAddress: '123 Healthcare Blvd, Fort Wayne, IN 46802',
  },
};
