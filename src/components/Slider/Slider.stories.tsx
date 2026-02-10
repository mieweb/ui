import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'neutral'],
    },
    disabled: {
      control: 'boolean',
    },
    showValue: {
      control: 'boolean',
    },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Volume',
    defaultValue: 50,
  },
};

export const WithValue: Story = {
  args: {
    label: 'Brightness',
    defaultValue: 75,
    showValue: true,
    formatValue: (v: number) => `${v}%`,
  },
};

export const WithMinMaxLabels: Story = {
  args: {
    label: 'Border Radius',
    defaultValue: 16,
    min: 0,
    max: 32,
    showValue: true,
    formatValue: (v: number) => `${v}px`,
    minLabel: 'Square',
    maxLabel: 'Rounded',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Widget Width',
    description: 'Set the width of the embedded widget.',
    defaultValue: 320,
    min: 260,
    max: 480,
    step: 10,
    showValue: true,
    formatValue: (v: number) => `${v}px`,
    minLabel: 'Compact',
    maxLabel: 'Wide',
  },
};

export const Small: Story = {
  args: {
    label: 'Small slider',
    size: 'sm',
    defaultValue: 30,
  },
};

export const Large: Story = {
  args: {
    label: 'Large slider',
    size: 'lg',
    defaultValue: 60,
    showValue: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled slider',
    defaultValue: 40,
    disabled: true,
  },
};

export const SuccessVariant: Story = {
  args: {
    label: 'Progress',
    variant: 'success',
    defaultValue: 80,
    showValue: true,
    formatValue: (v: number) => `${v}%`,
  },
};

export const WarningVariant: Story = {
  args: {
    label: 'Threshold',
    variant: 'warning',
    defaultValue: 65,
    showValue: true,
  },
};

export const DangerVariant: Story = {
  args: {
    label: 'Risk Level',
    variant: 'danger',
    defaultValue: 90,
    showValue: true,
  },
};

export const NeutralVariant: Story = {
  args: {
    label: 'Opacity',
    variant: 'neutral',
    defaultValue: 50,
    showValue: true,
    formatValue: (v: number) => `${v}%`,
  },
};

export const Controlled: Story = {
  render: function ControlledSlider() {
    const [value, setValue] = React.useState(25);
    return (
      <div className="space-y-4">
        <Slider
          label="Controlled"
          value={value}
          onValueChange={setValue}
          showValue
        />
        <div className="flex gap-2">
          <button
            onClick={() => setValue(0)}
            className="rounded bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            Reset
          </button>
          <button
            onClick={() => setValue(50)}
            className="rounded bg-primary-500 px-3 py-1 text-sm text-white hover:bg-primary-600"
          >
            Set 50
          </button>
          <button
            onClick={() => setValue(100)}
            className="rounded bg-primary-500 px-3 py-1 text-sm text-white hover:bg-primary-600"
          >
            Max
          </button>
        </div>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <Slider label="Small" size="sm" defaultValue={30} />
      <Slider label="Medium (default)" size="md" defaultValue={50} />
      <Slider label="Large" size="lg" defaultValue={70} />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <Slider label="Default" variant="default" defaultValue={50} />
      <Slider label="Success" variant="success" defaultValue={50} />
      <Slider label="Warning" variant="warning" defaultValue={50} />
      <Slider label="Danger" variant="danger" defaultValue={50} />
      <Slider label="Neutral" variant="neutral" defaultValue={50} />
    </div>
  ),
};
