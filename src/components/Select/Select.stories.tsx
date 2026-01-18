import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, type SelectOption, type SelectGroup } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    searchable: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const simpleOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
];

export const Default: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
      />
    </div>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        defaultValue="banana"
      />
    </div>
  ),
};

export const Searchable: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Country"
        placeholder="Select a country"
        searchable
        options={[
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'au', label: 'Australia' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France' },
          { value: 'jp', label: 'Japan' },
          { value: 'kr', label: 'South Korea' },
          { value: 'br', label: 'Brazil' },
          { value: 'mx', label: 'Mexico' },
        ]}
      />
    </div>
  ),
};

const groupedOptions: (SelectOption | SelectGroup)[] = [
  {
    label: 'Fruits',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'spinach', label: 'Spinach' },
    ],
  },
  {
    label: 'Grains',
    options: [
      { value: 'rice', label: 'Rice' },
      { value: 'wheat', label: 'Wheat' },
      { value: 'oats', label: 'Oats' },
    ],
  },
];

export const Grouped: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Food"
        placeholder="Select a food"
        options={groupedOptions}
      />
    </div>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana', disabled: true },
          { value: 'cherry', label: 'Cherry' },
          { value: 'date', label: 'Date', disabled: true },
          { value: 'elderberry', label: 'Elderberry' },
        ]}
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        error="Please select a fruit"
        hasError
      />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        helperText="Choose your favorite fruit"
      />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        size="sm"
      />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        size="lg"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        disabled
      />
    </div>
  ),
};

function ControlledSelectDemo() {
  const [value, setValue] = React.useState('');

  return (
    <div className="w-[280px] space-y-4">
      <Select
        label="Fruit"
        placeholder="Select a fruit"
        options={simpleOptions}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-muted-foreground text-xs">
        Selected: <code className="font-mono">{value || 'none'}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSelectDemo />,
};
