import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarGroup } from './Avatar';

function avatarDataUri(label: string, background = '#dbeafe', foreground = '#1d4ed8'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${background}"/><text x="50" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="${foreground}">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const meta: Meta<typeof Avatar> = {
  title: 'Components/Text & Data Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    ring: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the avatar',
    },
    ring: {
      control: 'boolean',
      description: 'Whether to show a ring around the avatar',
    },
    src: {
      control: 'text',
      description: 'Image URL for the avatar',
    },
    name: {
      control: 'text',
      description: 'Name to generate initials from',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// Basic Stories
export const Default: Story = {
  args: {
    name: 'John Doe',
  },
};

export const WithImage: Story = {
  args: {
    src: avatarDataUri('SO', '#bae6fd', '#0c4a6e'),
    alt: 'Sea Otter',
    name: 'Sea Otter',
  },
};

export const BrokenImage: Story = {
  args: {
    src: 'data:image/svg+xml;base64,broken',
    alt: 'John Doe',
    name: 'John Doe',
  },
};

export const NoNameOrImage: Story = {
  args: {},
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="xs" name="XS" />
      <Avatar size="sm" name="SM" />
      <Avatar size="md" name="MD" />
      <Avatar size="lg" name="LG" />
      <Avatar size="xl" name="XL" />
    </div>
  ),
};

// With Ring
export const WithRing: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="No Ring" />
      <Avatar name="With Ring" ring />
    </div>
  ),
};

// Initials
export const Initials: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob" />
      <Avatar name="Alice Williams Brown" />
    </div>
  ),
};

// Custom Fallback
export const CustomFallback: Story = {
  args: {
    fallback: <span>👤</span>,
    size: 'lg',
  },
};

// Avatar Group
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob Wilson" />
    </AvatarGroup>
  ),
};

export const GroupWithMax: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar name="John Doe" />
      <Avatar name="Jane Smith" />
      <Avatar name="Bob Wilson" />
      <Avatar name="Alice Brown" />
      <Avatar name="Charlie Davis" />
    </AvatarGroup>
  ),
};

export const GroupSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <AvatarGroup size="sm" max={3}>
        <Avatar name="JD" />
        <Avatar name="JS" />
        <Avatar name="BW" />
        <Avatar name="AB" />
      </AvatarGroup>
      <AvatarGroup size="md" max={3}>
        <Avatar name="JD" />
        <Avatar name="JS" />
        <Avatar name="BW" />
        <Avatar name="AB" />
      </AvatarGroup>
      <AvatarGroup size="lg" max={3}>
        <Avatar name="JD" />
        <Avatar name="JS" />
        <Avatar name="BW" />
        <Avatar name="AB" />
      </AvatarGroup>
    </div>
  ),
};

// With Images Group
export const GroupWithImages: Story = {
  render: () => (
    <AvatarGroup max={4}>
      <Avatar src={avatarDataUri('JD')} name="John Doe" />
      <Avatar src={avatarDataUri('JS', '#fde68a', '#92400e')} name="Jane Smith" />
      <Avatar src={avatarDataUri('BW', '#dcfce7', '#166534')} name="Bob Wilson" />
      <Avatar name="Alice Brown" />
      <Avatar name="Charlie Davis" />
    </AvatarGroup>
  ),
};
