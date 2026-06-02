import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertDialog } from './AlertDialog';
import { Button } from '../Button';

const meta: Meta<typeof AlertDialog> = {
  title: 'Components/Overlays/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <AlertDialogExample {...args} />,
  args: {
    title: 'Are you sure?',
    description: 'This will save your changes and continue.',
    actionLabel: 'Continue',
  },
};

function AlertDialogExample(args: React.ComponentProps<typeof AlertDialog>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <AlertDialog
        {...args}
        open={open}
        onOpenChange={setOpen}
        onAction={() => setOpen(false)}
      />
    </>
  );
}

export const Destructive: Story = {
  render: (args) => <AlertDialogExample {...args} />,
  args: {
    title: 'Delete case?',
    description: 'This action cannot be undone.',
    actionLabel: 'Delete',
    variant: 'destructive',
  },
};
