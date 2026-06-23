import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta: Meta<typeof Separator> = {
  title: 'Components/Layout/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    decorative: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64">
      <p className="text-sm">Above</p>
      <Separator {...args} className="my-3" />
      <p className="text-sm">Below</p>
    </div>
  ),
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm">Left</span>
      <Separator {...args} />
      <span className="text-sm">Right</span>
    </div>
  ),
  args: {
    orientation: 'vertical',
  },
};

export const Semantic: Story = {
  render: (args) => (
    <div className="w-64">
      <p className="text-sm">Section one</p>
      <Separator {...args} className="my-3" />
      <p className="text-sm">Section two</p>
    </div>
  ),
  args: {
    decorative: false,
  },
};
