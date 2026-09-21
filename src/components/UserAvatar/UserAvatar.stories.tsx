import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserAvatar } from './UserAvatar';

const meta: Meta<typeof UserAvatar> = {
  id: 'components-useravatar',
  title: 'Components/Identity/UserAvatar',
  component: UserAvatar,
  parameters: {
    catalog: {"entry": "@mieweb/ui", "relationships": [{"type": "uses", "target": "data-display-avatar", "why": "Avatar handles the image and fallback."}]}, docs: { description: { component: "### What it's for\n\nAn Avatar with an optional, labeled presence indicator and fallback content.\n\n### Use it when\n\nA compact identity image needs presence context beside a name.\n\n### Don't use it when\n\nUse Avatar for a plain image, or UserBadge when the user should also see a name and profile preview.\n\n### Example\n\nPass name and src from the user record; update status from the page and localize statusLabel.\n\n### Limitations\n\nPresence is supplied by the caller and is not a connectivity measurement. Do not convey identity or permission using the dot alone." } },
    layout: 'centered',
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
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
