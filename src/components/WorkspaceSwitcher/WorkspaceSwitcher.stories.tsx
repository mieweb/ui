import type { Meta, StoryObj } from '@storybook/react-vite';

import { WorkspaceSwitcher } from './WorkspaceSwitcher';

const meta: Meta<typeof WorkspaceSwitcher> = {
  id: 'layout-workspaceswitcher',
  title: 'Components/Navigation/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: {
    catalog: {"entry": "@mieweb/ui", "relationships": [{"type": "uses", "target": "choice-inputs-dropdown", "why": "Dropdown provides menu positioning and keyboard interaction."}]}, docs: { description: { component: "### What it's for\n\nA compact organization selector using Dropdown, with an optional workspace-creation action.\n\n### Use it when\n\nThe authenticated user can move between employer or provider workspaces.\n\n### Don't use it when\n\nUse Dropdown for arbitrary commands or a full selection page for first-time onboarding.\n\n### Example\n\nThe parent supplies authorized workspaces and currentId; onSelect updates the application context and route.\n\n### Limitations\n\nIt closes after selection or creation. It does not authorize access or persist the current workspace. A single workspace is static unless alwaysRender or onCreate is supplied." } }, layout: 'padded' },
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
