import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { InviteUserModal, Role } from './InviteUserModal';
import { Button } from '../Button/Button';

const meta: Meta<typeof InviteUserModal> = {
  title: 'Components/InviteUserModal',
  component: InviteUserModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof InviteUserModal>;

const sampleRoles: Role[] = [
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

// Interactive wrapper component
function InteractiveDemo({
  entityName,
  entityDisplayName,
  roles = sampleRoles,
  defaultRoleId,
}: {
  entityName?: string;
  entityDisplayName?: string;
  roles?: Role[];
  defaultRoleId?: string;
}) {
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const handleSubmit = async (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    roleId: string;
    message?: string;
  }) => {
    setIsSubmitting(true);
    setError(undefined);
    setSuccess(undefined);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate success or error
    if (data.email.includes('error')) {
      setError('User with this email already exists');
      setIsSubmitting(false);
    } else {
      setSuccess(`Invitation sent to ${data.email}`);
      setIsSubmitting(false);
      // Close after showing success briefly
      setTimeout(() => setOpen(false), 2000);
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Invite User</Button>
      <InviteUserModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        roles={roles}
        defaultRoleId={defaultRoleId}
        entityName={entityName}
        entityDisplayName={entityDisplayName}
        isSubmitting={isSubmitting}
        errorMessage={error}
        successMessage={success}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveDemo />,
};

export const WithProvider: Story = {
  render: () => (
    <InteractiveDemo
      entityName="provider"
      entityDisplayName="MedCare Health Services"
    />
  ),
};

export const WithEmployer: Story = {
  render: () => (
    <InteractiveDemo
      entityName="employer"
      entityDisplayName="Acme Corporation"
    />
  ),
};

export const WithDefaultRole: Story = {
  render: () => (
    <InteractiveDemo
      entityDisplayName="Healthcare Partners"
      defaultRoleId="staff"
    />
  ),
};

export const WithError: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Modal with Error</Button>
        <InviteUserModal
          open={open}
          onOpenChange={setOpen}
          roles={sampleRoles}
          errorMessage="User with this email already has an account"
        />
      </>
    );
  },
};

export const WithSuccess: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Modal with Success</Button>
        <InviteUserModal
          open={open}
          onOpenChange={setOpen}
          roles={sampleRoles}
          successMessage="Invitation sent to john@example.com"
        />
      </>
    );
  },
};

export const Submitting: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show Submitting State</Button>
        <InviteUserModal
          open={open}
          onOpenChange={setOpen}
          roles={sampleRoles}
          isSubmitting={true}
        />
      </>
    );
  },
};

export const MinimalRoles: Story = {
  render: () => (
    <InteractiveDemo
      entityDisplayName="Simple Provider"
      roles={[
        { id: 'admin', name: 'Admin' },
        { id: 'user', name: 'User' },
      ]}
    />
  ),
};
