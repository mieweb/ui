import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './Collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Components/Layout/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        Advanced settings
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        These settings are hidden until expanded.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        Details
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        Visible from the start.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Controlled: Story = {
  render: () => <ControlledCollapsible />,
};

function ControlledCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        {open ? 'Hide' : 'Show'} content
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        Controlled externally.
      </CollapsibleContent>
    </Collapsible>
  );
}
