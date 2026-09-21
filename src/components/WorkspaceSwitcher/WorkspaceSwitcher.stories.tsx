import type { Meta, StoryObj } from '@storybook/react-vite';

import { WorkspaceSwitcher } from './WorkspaceSwitcher';

const meta: Meta<typeof WorkspaceSwitcher> = {
  id: 'layout-workspaceswitcher',
  title: 'Components/Navigation/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: { docs: { description: { component: 'Searchable organization selector for switching between accessible workspaces.' } }, layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof WorkspaceSwitcher>;

export const Single: Story = {
  args: {
    workspaces: [{ id: '1', name: 'Acme Logistics', subtitle: 'Admin' }],
    currentId: '1',
  },
};

export const Multiple: Story = {
  args: {
    workspaces: [
      { id: '1', name: 'Acme Logistics', subtitle: 'Admin' },
      { id: '2', name: 'Northwind Trucking', subtitle: 'Manager' },
      { id: '3', name: 'Globex Manufacturing', subtitle: 'Viewer' },
    ],
    currentId: '1',
    onCreate: () => {},
    createLabel: 'Add employer',
  },
};
