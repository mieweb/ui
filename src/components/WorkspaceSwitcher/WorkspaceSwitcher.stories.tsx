import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { WorkspaceSwitcher } from './WorkspaceSwitcher';

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: 'Layout/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
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
