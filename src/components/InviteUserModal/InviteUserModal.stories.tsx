import type { Meta, StoryObj } from '@storybook/react';
import { InviteUserModal } from './InviteUserModal';

const sampleRoles = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage users and view all data',
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Standard access for day-to-day operations',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to view data',
  },
];

const meta: Meta<typeof InviteUserModal> = {
  title: 'Components/InviteUserModal',
  component: InviteUserModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Container with transform creates a new containing block for position:fixed
      // This keeps the modal within this container in docs view
      <div
        className="flex min-h-[700px] items-center justify-center"
        style={{ transform: 'translateZ(0)' }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    open: true,
    roles: sampleRoles,
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onOpenChange: { action: 'onOpenChange' },
    onSubmit: { action: 'onSubmit' },
    roles: {
      control: 'object',
      description: 'Available roles to assign',
    },
    defaultRoleId: {
      control: 'text',
      description: 'Default role ID',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether submission is in progress',
    },
    entityName: {
      control: 'text',
      description: 'Entity name (e.g., "provider" or "organization")',
    },
    entityDisplayName: {
      control: 'text',
      description: 'Entity display name',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
    },
    successMessage: {
      control: 'text',
      description: 'Success message to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InviteUserModal>;

export const Default: Story = {};

export const WithProvider: Story = {
  args: {
    entityName: 'provider',
    entityDisplayName: 'MedCare Health Services',
  },
};

export const WithEmployer: Story = {
  args: {
    entityName: 'employer',
    entityDisplayName: 'Acme Corporation',
  },
};

export const WithDefaultRole: Story = {
  args: {
    entityDisplayName: 'Healthcare Partners',
    defaultRoleId: 'staff',
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'User with this email already has an account',
  },
};

export const WithSuccess: Story = {
  args: {
    successMessage: 'Invitation sent to john@example.com',
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const MinimalRoles: Story = {
  args: {
    entityDisplayName: 'Simple Provider',
    roles: [
      { id: 'admin', name: 'Admin' },
      { id: 'user', name: 'User' },
    ],
  },
};
