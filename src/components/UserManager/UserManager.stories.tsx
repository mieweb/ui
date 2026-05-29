import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserManager, type ManagedUser } from './UserManager';

const meta: Meta<typeof UserManager> = {
  title: 'Components/Case Management/UserManager',
  component: UserManager,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Example() {
  const [users, setUsers] = useState<ManagedUser[]>([
    {
      id: '1',
      name: 'Jane Smith',
      number: 'EMP-1001',
      email: 'jane@company.com',
      location: 'Toledo, OH',
      role: 'admin',
      active: true,
    },
    {
      id: '2',
      name: 'John Doe',
      number: 'EMP-1002',
      location: 'Toronto, ON',
      active: true,
    },
  ]);
  let nextId = users.length + 1;
  return (
    <UserManager
      users={users}
      onAdd={(u) => setUsers((prev) => [...prev, { ...u, id: String(nextId++) }])}
      onUpdate={(id, changes) =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...changes } : u))
        )
      }
      onDelete={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
    />
  );
}

export const Default: Story = { render: () => <Example /> };
