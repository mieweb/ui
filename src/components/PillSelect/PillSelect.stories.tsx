import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { PillSelect } from './PillSelect';

const meta: Meta<typeof PillSelect> = {
  title: 'Components/Navigation/PillSelect',
  component: PillSelect,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof PillSelect>;

const defaultOptions = [
  { value: 'option-1', label: 'Option 1' },
  { value: 'option-2', label: 'Option 2' },
  { value: 'option-3', label: 'Option 3' },
  { value: 'option-4', label: 'Option 4' },
];

/** Default collapsed state — click to expand and pick an option. */
export const Default: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'option-2',
    label: 'Mode',
  },
};

/** No label — shows only the selected option value in collapsed state. */
export const NoLabel: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'option-1',
  },
};

/** Two options. */
export const TwoOptions: Story = {
  args: {
    options: [
      { value: 'off', label: 'Off' },
      { value: 'on', label: 'On' },
    ],
    defaultValue: 'on',
    label: 'Feature',
  },
};

/** Many options. */
export const ManyOptions: Story = {
  args: {
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
      { value: '4', label: 'Option 4' },
      { value: '5', label: 'Option 5' },
      { value: '6', label: 'Option 6' },
    ],
    defaultValue: '3',
    label: 'Size',
  },
};

/** One option disabled. */
export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'option-1', label: 'Option 1' },
      { value: 'option-2', label: 'Option 2', disabled: true },
      { value: 'option-3', label: 'Option 3' },
    ],
    defaultValue: 'option-1',
    label: 'Mode',
  },
};

function ControlledDemo() {
  const [value, setValue] = React.useState('option-2');
  return (
    <div className="flex flex-col items-center gap-4">
      <PillSelect
        options={defaultOptions}
        value={value}
        onValueChange={setValue}
        label="Mode"
      />
      <p className="text-muted-foreground text-sm">Selected: {value}</p>
    </div>
  );
}

/** Controlled — parent owns the value. */
export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

/** Disabled — collapsed pill is not clickable. */
export const Disabled: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'option-2',
    label: 'Mode',
    disabled: true,
  },
};
