import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, type SelectOption, type SelectGroup } from './Select';

// =============================================================================
// Sample Data
// =============================================================================

const simpleOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
];

const countryOptions: SelectOption[] = [
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
];

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

const disabledOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

// =============================================================================
// Options Map for Controls
// =============================================================================

type OptionsKey = 'simple' | 'countries' | 'grouped' | 'withDisabled';

const optionsMap: Record<OptionsKey, (SelectOption | SelectGroup)[]> = {
  simple: simpleOptions,
  countries: countryOptions,
  grouped: groupedOptions,
  withDisabled: disabledOptions,
};

// =============================================================================
// Wrapper Component for State Management
// =============================================================================

interface SelectWithStateProps {
  optionsKey?: OptionsKey;
  label?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  hasError?: boolean;
  helperText?: string;
  hideLabel?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  defaultValue?: string;
}

function SelectWithState({
  optionsKey = 'simple',
  label = 'Select',
  placeholder = 'Select an option',
  size = 'md',
  searchable = false,
  disabled = false,
  error,
  hasError = false,
  helperText,
  hideLabel = false,
  searchPlaceholder,
  noResultsText,
  defaultValue,
}: SelectWithStateProps) {
  const [value, setValue] = React.useState(defaultValue || '');
  const options = optionsMap[optionsKey];

  return (
    <div className="w-[280px]">
      <Select
        options={options}
        value={value}
        onValueChange={setValue}
        label={label}
        placeholder={placeholder}
        size={size}
        searchable={searchable}
        disabled={disabled}
        error={error}
        hasError={hasError}
        helperText={helperText}
        hideLabel={hideLabel}
        searchPlaceholder={searchPlaceholder}
        noResultsText={noResultsText}
      />
    </div>
  );
}

// =============================================================================
// Meta Configuration
// =============================================================================

const meta = {
  title: 'Inputs & Controls/Select',
  component: SelectWithState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    optionsKey: {
      control: 'select',
      options: ['simple', 'countries', 'grouped', 'withDisabled'],
      description: 'Which set of options to display',
      table: {
        defaultValue: { summary: 'simple' },
      },
    },
    label: {
      control: 'text',
      description: 'Label for the select',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the select',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    searchable: {
      control: 'boolean',
      description: 'Enable search/filter functionality',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the select',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    hasError: {
      control: 'boolean',
      description: 'Show error styling',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below the select',
    },
    hideLabel: {
      control: 'boolean',
      description: 'Visually hide the label',
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder for search input',
    },
    noResultsText: {
      control: 'text',
      description: 'Text shown when no search results',
    },
    defaultValue: {
      control: 'text',
      description: 'Default selected value',
    },
  },
} satisfies Meta<typeof SelectWithState>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories with Args (Controls Work)
// =============================================================================

export const Default: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    size: 'md',
    searchable: false,
    disabled: false,
    hasError: false,
    hideLabel: false,
  },
};

export const Searchable: Story = {
  args: {
    optionsKey: 'countries',
    label: 'Country',
    placeholder: 'Select a country',
    searchable: true,
    searchPlaceholder: 'Search countries...',
    noResultsText: 'No countries found',
  },
};

export const Grouped: Story = {
  args: {
    optionsKey: 'grouped',
    label: 'Food',
    placeholder: 'Select a food',
  },
};

export const WithDisabledOptions: Story = {
  args: {
    optionsKey: 'withDisabled',
    label: 'Fruit',
    placeholder: 'Select a fruit',
  },
};

export const WithError: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    error: 'Please select a fruit',
    hasError: true,
  },
};

export const WithHelperText: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    helperText: 'Choose your favorite fruit',
  },
};

export const Small: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    disabled: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    placeholder: 'Select a fruit',
    defaultValue: 'banana',
  },
};

// =============================================================================
// Showcase Stories (Controls Disabled)
// =============================================================================

export const AllSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="Small"
          placeholder="Select a fruit"
          size="sm"
        />
      </div>
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="Medium"
          placeholder="Select a fruit"
          size="md"
        />
      </div>
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="Large"
          placeholder="Select a fruit"
          size="lg"
        />
      </div>
    </div>
  ),
};

export const States: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="Default"
          placeholder="Select a fruit"
        />
      </div>
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="With Helper"
          placeholder="Select a fruit"
          helperText="Choose your favorite"
        />
      </div>
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="With Error"
          placeholder="Select a fruit"
          error="This field is required"
          hasError
        />
      </div>
      <div className="w-[280px]">
        <Select
          options={simpleOptions}
          label="Disabled"
          placeholder="Select a fruit"
          disabled
        />
      </div>
    </div>
  ),
};

function ControlledDemo() {
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
      <p className="text-muted-foreground text-sm">
        Selected:{' '}
        <code className="bg-muted rounded px-1 font-mono">
          {value || 'none'}
        </code>
      </p>
      <button
        type="button"
        onClick={() => setValue('')}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1.5 text-sm"
      >
        Reset
      </button>
    </div>
  );
}

export const Controlled: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <ControlledDemo />,
};
