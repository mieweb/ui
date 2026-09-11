import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeartPulse, Mail, Send, ShieldCheck } from 'lucide-react';

import { IconBadge } from './IconBadge';

const meta: Meta<typeof IconBadge> = {
  title: 'Components/Data Display/IconBadge',
  component: IconBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['gradient', 'solid', 'tonal', 'soft'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'rounded'] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {
  args: {
    variant: 'gradient',
    shape: 'circle',
    size: 'lg',
    children: <Send />,
  },
};

export const Tonal: Story = {
  args: {
    variant: 'tonal',
    children: <HeartPulse />,
  },
};

export const Soft: Story = {
  args: {
    variant: 'soft',
    children: <ShieldCheck />,
  },
};

export const Solid: Story = {
  args: {
    variant: 'solid',
    children: <Mail />,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconBadge variant="gradient" shape="circle" size="lg">
        <Send />
      </IconBadge>
      <IconBadge variant="solid" size="lg">
        <Mail />
      </IconBadge>
      <IconBadge variant="tonal" size="lg">
        <HeartPulse />
      </IconBadge>
      <IconBadge variant="soft" size="lg">
        <ShieldCheck />
      </IconBadge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconBadge variant="gradient" size="sm">
        <Send />
      </IconBadge>
      <IconBadge variant="gradient" size="md">
        <Send />
      </IconBadge>
      <IconBadge variant="gradient" size="lg">
        <Send />
      </IconBadge>
      <IconBadge variant="gradient" size="xl">
        <Send />
      </IconBadge>
    </div>
  ),
};
