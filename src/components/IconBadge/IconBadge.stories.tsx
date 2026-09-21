import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeartPulse, Mail, Send, ShieldCheck } from 'lucide-react';

import { IconBadge } from './IconBadge';

const meta: Meta<typeof IconBadge> = {
  id: 'components-data-display-iconbadge',
  title: 'Components/Data display/IconBadge',
  component: IconBadge,
  parameters: {
    catalog: {"entry": "@mieweb/ui", "relationships": []}, docs: { description: { component: "### What it's for\n\nA decorative or labeled icon container with size, shape and brand-tone variants.\n\n### Use it when\n\nAn icon needs a consistent background in a hero, feature list or status summary.\n\n### Don't use it when\n\nUse Badge for a text status or Button for an actionable icon.\n\n### Example\n\nPlace a decorative lucide icon inside IconBadge next to a visible heading; put the action on a separate Button.\n\n### Limitations\n\nIt is a span, not an interactive control. Mark decorative icons aria-hidden or give meaningful icons an accessible name. SVG child sizing is supplied by each size variant." } },
    layout: 'centered',
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
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
