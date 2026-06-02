import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './ScrollArea';

const meta: Meta<typeof ScrollArea> = {
  title: 'Components/Layout/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: (args) => (
    <ScrollArea
      {...args}
      className="border-border h-48 w-64 rounded-md border p-4"
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <p key={i} className="text-sm leading-7">
          Item {i + 1}
        </p>
      ))}
    </ScrollArea>
  ),
  args: {
    orientation: 'vertical',
  },
};

export const Horizontal: Story = {
  render: (args) => (
    <ScrollArea {...args} className="border-border w-64 rounded-md border p-4">
      <div className="flex gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-md text-sm"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
  args: {
    orientation: 'horizontal',
  },
};
