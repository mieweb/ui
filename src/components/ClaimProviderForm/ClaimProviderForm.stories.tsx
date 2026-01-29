import type { Meta, StoryObj } from '@storybook/react';
import { ClaimProviderForm } from './ClaimProviderForm';

const meta: Meta<typeof ClaimProviderForm> = {
  component: ClaimProviderForm,
  title: 'Components/ClaimProviderForm',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSubmit: { action: 'onSubmit' },
    onCancel: { action: 'onCancel' },
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
