import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Badge } from './Badge';
import {
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
  StarIcon,
  HeartIcon,
  BellIcon,
  TagIcon,
  ZapIcon,
  ShieldIcon,
  ClockIcon,
  UserIcon,
  MailIcon,
  PlusIcon,
  SparklesIcon,
} from '../Icons';
import type { LucideIcon } from 'lucide-react';

// Map of available icons for the dropdown
const iconMap: Record<string, LucideIcon | undefined> = {
  none: undefined,
  check: CheckIcon,
  alert: AlertCircleIcon,
  info: InfoIcon,
  star: StarIcon,
  heart: HeartIcon,
  bell: BellIcon,
  tag: TagIcon,
  zap: ZapIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
  user: UserIcon,
  mail: MailIcon,
  plus: PlusIcon,
  sparkles: SparklesIcon,
};

// Extended args type that includes our custom iconName prop
type BadgeStoryArgs = React.ComponentProps<typeof Badge> & {
  iconName?: keyof typeof iconMap;
};

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'success',
        'warning',
        'danger',
        'outline',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    icon: {
      table: { disable: true }, // Hide the raw icon prop
    },
    iconName: {
      control: 'select',
      options: Object.keys(iconMap),
      description: 'Select an icon from the Lucide icon library',
    },
  } as Meta<BadgeStoryArgs>['argTypes'],
  // Convert iconName to actual icon element in render
  render: ({ iconName, ...args }: BadgeStoryArgs) => {
    const IconComponent = iconName ? iconMap[iconName] : undefined;
    return (
      <Badge {...args} icon={IconComponent ? <IconComponent size={12} /> : undefined} />
    );
  },
};

export default meta;
type Story = StoryObj<BadgeStoryArgs>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: 'New',
    iconName: 'sparkles',
    variant: 'success',
  },
};

export const StatusExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="danger">Expired</Badge>
      <Badge variant="secondary">Draft</Badge>
    </div>
  ),
};
