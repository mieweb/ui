import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserAvatar } from './UserAvatar';

const meta: Meta<typeof UserAvatar> = {
  title: 'Components/UserAvatar',
  component: UserAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    status: {
      control: 'select',
      options: [undefined, 'active', 'inactive'],
    },
    src: { control: 'text' },
    name: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

export const Default: Story = {
  args: {
    name: 'John Doe',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://i.imgur.com/8Km9tLL.jpg',
    name: 'Jane Smith',
    size: 'lg',
  },
};

export const ActiveStatus: Story = {
  args: {
    name: 'Alex Rivera',
    status: 'active',
    size: 'lg',
  },
};

export const InactiveStatus: Story = {
  args: {
    name: 'Pat Kim',
    status: 'inactive',
    size: 'lg',
  },
};

export const InitialsFallback: Story = {
  args: {
    src: 'https://broken-image-url.example/404.jpg',
    name: 'Morgan Lee',
    status: 'active',
    size: 'lg',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <UserAvatar size="xs" name="XS User" status="active" />
      <UserAvatar size="sm" name="SM User" status="active" />
      <UserAvatar size="md" name="MD User" status="active" />
      <UserAvatar size="lg" name="LG User" status="active" />
      <UserAvatar size="xl" name="XL User" status="active" />
    </div>
  ),
};

export const StatusVariants: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <UserAvatar size="lg" name="No Status" />
      <UserAvatar size="lg" name="Active User" status="active" />
      <UserAvatar size="lg" name="Inactive User" status="inactive" />
    </div>
  ),
};
