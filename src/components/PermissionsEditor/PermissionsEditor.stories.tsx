import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  PermissionsEditor,
  PermissionGroup,
  EmployerAccess,
} from './PermissionsEditor';
import { Card } from '../Card';
import { Button } from '../Button';

const meta: Meta<typeof PermissionsEditor> = {
  title: 'Authentication & Permissions/PermissionsEditor',
  component: PermissionsEditor,
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: 'text',
      description: 'User name being edited',
    },
    showEmployerAccess: {
      control: 'boolean',
      description: 'Whether to show employer access section',
    },
    className: {
      control: 'text',
      description: 'Custom className',
    },
    groups: { control: false },
    assignedPermissions: { control: false },
    onPermissionsChange: { control: false },
    employers: { control: false },
    selectedEmployers: { control: false },
    onEmployersChange: { control: false },
    labels: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A hierarchical permission editor for managing user roles with support for nested permissions, employer access control, and summary display.',
      },
      story: { inline: true },
    },
  },
  args: {
    userName: 'John Doe',
    showEmployerAccess: false,
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof PermissionsEditor>;

// Sample permission groups
const sampleGroups: PermissionGroup[] = [
  {
    id: 'admin',
    name: 'Administrator',
    defaultExpanded: true,
    permissions: [
      {
        id: 'admin-full',
        name: 'Full Administrator Access',
        children: [
          {
            id: 'admin-users',
            name: 'Manage Users',
            children: [
              { id: 'admin-users-create', name: 'Create Users' },
              { id: 'admin-users-edit', name: 'Edit Users' },
              { id: 'admin-users-delete', name: 'Delete Users' },
            ],
          },
          {
            id: 'admin-settings',
            name: 'Manage Settings',
            children: [
              { id: 'admin-settings-general', name: 'General Settings' },
              { id: 'admin-settings-security', name: 'Security Settings' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'provider',
    name: 'Provider',
    defaultExpanded: true,
    permissions: [
      {
        id: 'provider-orders',
        name: 'Order Management',
        children: [
          { id: 'provider-orders-view', name: 'View Orders' },
          { id: 'provider-orders-edit', name: 'Edit Orders' },
          { id: 'provider-orders-results', name: 'Enter Results' },
        ],
      },
      {
        id: 'provider-reports',
        name: 'Reports Access',
        children: [
          { id: 'provider-reports-view', name: 'View Reports' },
          { id: 'provider-reports-export', name: 'Export Reports' },
        ],
      },
    ],
  },
  {
    id: 'employer',
    name: 'Employer',
    permissions: [
      {
        id: 'employer-employees',
        name: 'Employee Management',
        children: [
          { id: 'employer-employees-view', name: 'View Employees' },
          { id: 'employer-employees-edit', name: 'Edit Employees' },
          {
            id: 'employer-employees-orders',
            name: 'Create Orders for Employees',
          },
        ],
      },
    ],
  },
];

// Sample employers
const sampleEmployers: EmployerAccess[] = [
  {
    id: 'emp-1',
    name: 'Acme Corporation',
    address: { street1: '123 Main St', city: 'Fort Wayne', state: 'IN' },
  },
  {
    id: 'emp-2',
    name: 'TechStart Inc',
    address: { street1: '456 Tech Blvd', city: 'Indianapolis', state: 'IN' },
  },
  {
    id: 'emp-3',
    name: 'HealthFirst Medical',
    address: { street1: '789 Health Way', city: 'Chicago', state: 'IL' },
  },
];

export const Default: Story = {
  args: {
    userName: 'John Doe',
    showEmployerAccess: false,
    className: '',
  },
  render: function Render(args) {
    const [permissions, setPermissions] = React.useState<string[]>([]);
    const [employers, setEmployers] = React.useState<string[]>([]);

    return (
      <Card className="max-w-2xl p-6">
        <PermissionsEditor
          userName={args.userName}
          groups={sampleGroups}
          assignedPermissions={permissions}
          onPermissionsChange={setPermissions}
          showEmployerAccess={args.showEmployerAccess}
          employers={args.showEmployerAccess ? sampleEmployers : undefined}
          selectedEmployers={employers}
          onEmployersChange={setEmployers}
          className={args.className}
        />
      </Card>
    );
  },
};

// Interactive demo
function InteractiveDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([
    'provider-orders-view',
    'provider-reports-view',
  ]);
  const [employers, setEmployers] = React.useState<string[]>([]);

  return (
    <Card className="max-w-2xl p-6">
      <PermissionsEditor
        userName="John Doe"
        groups={sampleGroups}
        assignedPermissions={permissions}
        onPermissionsChange={setPermissions}
        showEmployerAccess
        employers={sampleEmployers}
        selectedEmployers={employers}
        onEmployersChange={setEmployers}
      />

      <div className="mt-6 flex justify-end gap-3 border-t pt-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Permissions</Button>
      </div>
    </Card>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

// With pre-assigned permissions
function WithPreAssignedDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([
    'admin-full',
    'admin-users',
    'admin-users-create',
    'admin-users-edit',
  ]);

  return (
    <Card className="max-w-2xl p-6">
      <PermissionsEditor
        userName="Admin User"
        groups={sampleGroups}
        assignedPermissions={permissions}
        onPermissionsChange={setPermissions}
      />
    </Card>
  );
}

export const WithPreAssigned: Story = {
  render: () => <WithPreAssignedDemo />,
};

// With employer access
function WithEmployerAccessDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([
    'provider-orders-view',
  ]);
  const [employers, setEmployers] = React.useState<string[]>(['emp-1']);

  return (
    <Card className="max-w-2xl p-6">
      <PermissionsEditor
        userName="Provider User"
        groups={[sampleGroups[1]]} // Provider group only
        assignedPermissions={permissions}
        onPermissionsChange={setPermissions}
        showEmployerAccess
        employers={sampleEmployers}
        selectedEmployers={employers}
        onEmployersChange={setEmployers}
      />
    </Card>
  );
}

export const WithEmployerAccess: Story = {
  render: () => <WithEmployerAccessDemo />,
};

// Single group
function SingleGroupDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([]);

  return (
    <Card className="max-w-lg p-6">
      <PermissionsEditor
        groups={[sampleGroups[2]]} // Employer group only
        assignedPermissions={permissions}
        onPermissionsChange={setPermissions}
      />
    </Card>
  );
}

export const SingleGroup: Story = {
  render: () => <SingleGroupDemo />,
};

// In a modal context
function InModalContextDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([]);

  return (
    <div className="bg-background mx-auto max-w-2xl rounded-lg border shadow-lg">
      <div className="bg-primary text-primary-foreground rounded-t-lg p-4">
        <h4 className="text-lg font-semibold">User Permissions</h4>
      </div>
      <div className="p-6">
        <PermissionsEditor
          userName="Jane Smith"
          groups={sampleGroups}
          assignedPermissions={permissions}
          onPermissionsChange={setPermissions}
        />
      </div>
      <div className="flex justify-end gap-3 border-t p-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}

export const InModalContext: Story = {
  render: () => <InModalContextDemo />,
};

// Custom labels (i18n)
function CustomLabelsDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [employers, setEmployers] = React.useState<string[]>([]);

  return (
    <Card className="max-w-2xl p-6">
      <PermissionsEditor
        userName="Usuario"
        groups={sampleGroups}
        assignedPermissions={permissions}
        onPermissionsChange={setPermissions}
        showEmployerAccess
        employers={sampleEmployers}
        selectedEmployers={employers}
        onEmployersChange={setEmployers}
        labels={{
          userRole: 'Rol de Usuario',
          employerAccess: 'Acceso de Empleador',
          selectEmployer: 'Seleccionar empleador...',
          summary: 'Resumen',
          all: 'Todos',
          save: 'Guardar',
          cancel: 'Cancelar',
        }}
      />
    </Card>
  );
}

export const CustomLabels: Story = {
  render: () => <CustomLabelsDemo />,
};

// Mobile viewport
function MobileDemo() {
  const [permissions, setPermissions] = React.useState<string[]>([
    'provider-orders-view',
  ]);

  return (
    <Card className="p-4">
      <PermissionsEditor
        groups={[sampleGroups[1]]}
        assignedPermissions={permissions}
        onPermissionsChange={setPermissions}
      />
    </Card>
  );
}

export const Mobile: Story = {
  render: () => <MobileDemo />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
