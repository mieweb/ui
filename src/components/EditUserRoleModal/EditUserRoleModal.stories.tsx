import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EditUserRoleModal, UserRole } from './EditUserRoleModal';
import { Button } from '../Button/Button';

const meta: Meta<typeof EditUserRoleModal> = {
  title: 'Components/EditUserRoleModal',
  component: EditUserRoleModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof EditUserRoleModal>;

const sampleRoles: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings. Can manage users and system configuration.',
    permissions: ['manage_users', 'manage_settings', 'view_reports', 'manage_billing'],
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage day-to-day operations and view reports.',
    permissions: ['view_reports', 'manage_orders', 'manage_inventory'],
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Standard access for daily operations.',
    permissions: ['view_orders', 'create_orders', 'view_inventory'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to view data.',
    permissions: ['view_orders', 'view_reports'],
  },
];

const sampleUser = {
  id: 'user-123',
  name: 'John Smith',
  email: 'john.smith@example.com',
  currentRoleId: 'staff',
};

// Interactive wrapper
function InteractiveDemo(props: Partial<React.ComponentProps<typeof EditUserRoleModal>>) {
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (data: { userId: string; roleId: string }) => {
    setIsSubmitting(true);
    console.log('Saving role change:', data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Edit User Role</Button>
      <EditUserRoleModal
        open={open}
        onOpenChange={setOpen}
        onSave={handleSave}
        user={sampleUser}
        roles={sampleRoles}
        isSubmitting={isSubmitting}
        {...props}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveDemo />,
};

export const AdminUser: Story = {
  render: () => (
    <InteractiveDemo
      user={{
        id: 'admin-1',
        name: 'Jane Admin',
        email: 'jane@example.com',
        currentRoleId: 'admin',
      }}
    />
  ),
};

export const NewUser: Story = {
  render: () => (
    <InteractiveDemo
      user={{
        id: 'new-user',
        name: 'New User',
        email: 'new@example.com',
        currentRoleId: undefined,
      }}
    />
  ),
};

// Wrapper for WithError story
function WithErrorWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Error State</Button>
      <EditUserRoleModal
        open={open}
        onOpenChange={setOpen}
        user={sampleUser}
        roles={sampleRoles}
        errorMessage="Unable to change role. User has pending tasks that must be reassigned first."
      />
    </>
  );
}

// Wrapper for Submitting story
function SubmittingWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Submitting State</Button>
      <EditUserRoleModal
        open={open}
        onOpenChange={setOpen}
        user={sampleUser}
        roles={sampleRoles}
        isSubmitting={true}
      />
    </>
  );
}

export const WithError: Story = {
  render: () => <WithErrorWrapper />,
};

export const Submitting: Story = {
  render: () => <SubmittingWrapper />,
};

export const SimpleRoles: Story = {
  render: () => (
    <InteractiveDemo
      roles={[
        { id: 'admin', name: 'Admin' },
        { id: 'user', name: 'User' },
        { id: 'guest', name: 'Guest' },
      ]}
      user={{
        id: 'user-1',
        name: 'Simple User',
        email: 'simple@example.com',
        currentRoleId: 'user',
      }}
    />
  ),
};
