import type { Meta, StoryObj } from '@storybook/react';
import { EmployerServiceModal } from './EmployerServiceModal';

const meta: Meta<typeof EmployerServiceModal> = {
  component: EmployerServiceModal,
  title: 'Components/EmployerServiceModal',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Container with transform creates a new containing block for position:fixed
      // This keeps the modal within this container in docs view
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: 'translateZ(0)',
          minHeight: '900px',
          padding: '100px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether submission is in progress',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
    },
    employer: {
      control: false,
      description: 'Employer information',
    },
    service: {
      control: false,
      description: 'Service being configured',
    },
    existingConfig: {
      control: false,
      description: 'Existing configuration (for editing)',
    },
    onOpenChange: { action: 'onOpenChange' },
    onSave: { action: 'onSave' },
  },
  args: {
    open: true,
    isSubmitting: false,
    errorMessage: '',
  },
};

export default meta;
type Story = StoryObj<typeof EmployerServiceModal>;

const mockEmployer = {
  id: 'emp-1',
  name: 'Acme Corporation',
};

const mockService = {
  id: 'svc-1',
  name: 'DOT Drug Screen - 5 Panel',
  basePrice: 45.0,
};

export const Default: Story = {
  args: {
    open: true,
    employer: mockEmployer,
    service: mockService,
  },
};

export const WithExistingConfig: Story = {
  args: {
    open: true,
    employer: mockEmployer,
    service: mockService,
    existingConfig: {
      useBasePrice: false,
      customPrice: 38.0,
      autoAccept: true,
      requiresApproval: false,
      notifyOnOrder: true,
      notificationEmail: 'orders@acme.com',
      billingCode: 'ACME-DOT-5',
      notes: 'Preferred customer - volume discount applied.',
    },
  },
};

export const WithError: Story = {
  args: {
    open: true,
    employer: mockEmployer,
    service: mockService,
    errorMessage: 'Failed to save configuration. Please try again.',
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    employer: mockEmployer,
    service: mockService,
    isSubmitting: true,
  },
};

export const MinimalInfo: Story = {
  args: {
    open: true,
    employer: { id: 'emp-2', name: 'New Employer' },
  },
};
