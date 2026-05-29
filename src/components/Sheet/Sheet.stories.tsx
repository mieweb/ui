import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
} from './Sheet';
import { Button } from '../Button';

const meta: Meta<typeof Sheet> = {
  title: 'Components/Overlays/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <SheetExample {...args} />,
  args: {
    side: 'right',
  },
};

function SheetExample(args: React.ComponentProps<typeof Sheet>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet {...args} open={open} onOpenChange={setOpen}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetClose />
        </SheetHeader>
        <SheetBody>
          <SheetDescription>
            Refine the list using the options below.
          </SheetDescription>
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Apply</Button>
        </SheetFooter>
      </Sheet>
    </>
  );
}

export const LeftSide: Story = {
  ...Default,
  args: {
    side: 'left',
  },
};

export const Bottom: Story = {
  ...Default,
  args: {
    side: 'bottom',
  },
};
