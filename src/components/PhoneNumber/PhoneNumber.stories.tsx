import type { Meta, StoryObj } from '@storybook/react';

import { PhoneNumber } from './PhoneNumber';

const meta: Meta<typeof PhoneNumber> = {
  title: 'Components/PhoneNumber',
  component: PhoneNumber,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Display a phone number that is automatically formatted and hyperlinked via `tel:` so it opens the device dialer on tap. Accepts raw strings or structured `{ number, type, extension }` entries.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    tone: { control: 'select', options: ['muted', 'link', 'plain'] },
    showIcon: { control: 'boolean' },
    clickable: { control: 'boolean' },
    stopPropagation: { control: 'boolean' },
    icon: { control: false },
    value: { control: false },
    fallback: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof PhoneNumber>;

export const Default: Story = {
  args: { value: '3175550123' },
};

export const WithIcon: Story = {
  args: { value: '3175550123', showIcon: true },
};

export const LinkTone: Story = {
  args: { value: '3175550123', tone: 'link', size: 'md' },
};

export const StructuredEntry: Story = {
  args: {
    value: { number: '3175550123', type: 'Cell' },
    showIcon: true,
  },
};

export const WithExtension: Story = {
  args: {
    value: { number: '3175550123', type: 'Work', extension: '4567' },
    showIcon: true,
  },
};

export const International: Story = {
  args: { value: '+442071838750', tone: 'link' },
};

export const NANPWithCountryCode: Story = {
  args: { value: '+13175550123', tone: 'link' },
};

export const NotClickable: Story = {
  args: { value: '3175550123', clickable: false, tone: 'plain' },
};

export const Empty: Story = {
  args: { value: '' },
};

export const Invalid: Story = {
  args: { value: 'not-a-number' },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <PhoneNumber value="3175550123" size="xs" showIcon />
      <PhoneNumber value="3175550123" size="sm" showIcon />
      <PhoneNumber value="3175550123" size="md" showIcon />
      <PhoneNumber value="3175550123" size="lg" showIcon />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <PhoneNumber value="3175550123" tone="muted" />
      <PhoneNumber value="3175550123" tone="link" />
      <PhoneNumber value="3175550123" tone="plain" />
    </div>
  ),
};

export const InRow: Story = {
  render: () => (
    <button
      type="button"
      className="hover:bg-muted/50 flex w-96 items-center justify-between rounded-lg border bg-card p-3 text-left"
      onClick={() => alert('Row clicked')}
    >
      <span className="text-sm font-medium">Jake Pollard</span>
      <PhoneNumber value={{ number: '3175550123', type: 'Cell' }} showIcon />
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The component stops click propagation by default, so tapping the phone in a clickable row triggers the dialer without also triggering the row action.',
      },
    },
  },
};

export const Mobile: Story = {
  args: { value: '3175550123', showIcon: true, tone: 'link' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
