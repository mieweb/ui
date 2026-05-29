import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Components/Forms & Inputs/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    required: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Email address',
    htmlFor: 'email',
  },
};

export const Required: Story = {
  args: {
    children: 'Full name',
    htmlFor: 'name',
    required: true,
  },
};

export const Small: Story = {
  args: {
    children: 'Small label',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large label',
    size: 'lg',
  },
};

export const WithInput: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5">
      <Label {...args} htmlFor="story-input" />
      <input
        id="story-input"
        className="border-border rounded-md border px-3 py-2 text-sm"
        placeholder="Type here..."
      />
    </div>
  ),
  args: {
    children: 'Username',
    required: true,
  },
};
