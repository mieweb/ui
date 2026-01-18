import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    delay: {
      control: 'number',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Placements: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-8 p-16">
      <Tooltip content="Tooltip on top" placement="top">
        <Button>Top</Button>
      </Tooltip>
      <div className="flex gap-16">
        <Tooltip content="Tooltip on left" placement="left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Tooltip on right" placement="right">
          <Button>Right</Button>
        </Tooltip>
      </div>
      <Tooltip content="Tooltip on bottom" placement="bottom">
        <Button>Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const WithDelay: Story = {
  args: {
    content: 'I appear after 500ms',
    delay: 500,
    children: <Button>Hover me (with delay)</Button>,
  },
};

export const Disabled: Story = {
  args: {
    content: 'You should not see this',
    disabled: true,
    children: <Button>Tooltip disabled</Button>,
  },
};

export const LongContent: Story = {
  args: {
    content:
      'This is a longer tooltip with more content that wraps to multiple lines. It can contain helpful descriptions or instructions.',
    children: <Button>Hover for more info</Button>,
    className: 'max-w-xs whitespace-normal',
  },
};

export const OnIconButton: Story = {
  render: () => (
    <Tooltip content="Delete item">
      <Button variant="ghost" size="icon" aria-label="Delete">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </Button>
    </Tooltip>
  ),
};
