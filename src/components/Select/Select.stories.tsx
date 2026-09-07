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
  labelVariant?: 'stacked' | 'floating';
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
  labelVariant = 'stacked',
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
        labelVariant={labelVariant}
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
  id: 'choice-inputs-select',
  title: 'Inputs/Choice inputs/Select',
  component: SelectWithState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A custom **value picker for forms**: a \`<button role="combobox">\` trigger that opens a portaled \`role="listbox"\`. It is not a native \`<select>\`. Options come in as data — \`options: (SelectOption | SelectGroup)[]\` (\`{ value, label, disabled? }\` or \`{ label, options }\`) — and the value flows through \`value\` / \`defaultValue\` / \`onValueChange\`. \`multiple\` switches the props to \`string[]\` and keeps the list open while toggling. Field anatomy matches \`Input\`: \`label\` (\`labelVariant\` \`stacked\` | \`floating\`, \`hideLabel\`), \`helperText\`, \`error\` / \`hasError\`, \`required\` + \`requiredVariant\`, \`size\`. \`searchable\` adds a filter box; without it, typing does native-style typeahead. \`selectTriggerVariants\` is exported.

### Use it when

- The user picks **a value** (one, or several with \`multiple\`) from a known list of ~8+ options, and the choice is part of a form.
- Options need grouping (\`SelectGroup\`), disabling, or quick filtering of a list you already have in memory (\`searchable\`).

### Don't use it when

- The items are **actions** (Edit, Delete, Export) or a user menu — \`Dropdown\` (\`role="menu"\`, \`DropdownItem\` runs \`onClick\`).
- The list is large or remote and the user types to search it — \`Autocomplete\` (text input, async \`items\`, "create new" row).
- Up to ~7 options that benefit from being visible at once — \`Radio\`; several independent yes/no — \`Checkbox\`.
- A toolbar view switch — \`PillSelect\`.
- The value is a country — \`CountryDropdown\` / \`CountryCodeDropdown\` (list is built for you).

### Example

\`\`\`tsx
const [specialty, setSpecialty] = useState('');

<Select
  label="Specialty"
  required
  placeholder="Choose…"
  options={[
    { label: 'Primary care', options: [{ value: 'fm', label: 'Family medicine' }, { value: 'im', label: 'Internal medicine' }] },
    { label: 'Surgical', options: [{ value: 'gs', label: 'General surgery' }, { value: 'ortho', label: 'Orthopedics', disabled: true }] },
  ]}
  value={specialty}
  onValueChange={setSpecialty}
  error={submitted && !specialty ? 'Specialty is required' : undefined}
/>

// multiple: value and onValueChange become string[]
<Select multiple label="Symptoms" options={symptoms} value={selected} onValueChange={setSelected} searchable />
\`\`\`

### Limitations

- Accessibility: trigger is \`<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls>\` with \`aria-invalid\`, \`aria-required\` and \`aria-describedby\` → error or helper text; the \`<label htmlFor>\` targets the trigger's \`id\`. Options are \`<li role="option" aria-selected>\`, groups \`<li role="presentation">\` + \`<ul role="group" aria-label>\`, \`aria-multiselectable\` in \`multiple\` mode. Keyboard: ArrowUp/Down, Home/End, Enter/Space, Escape (returns focus to the trigger), typeahead when not \`searchable\`. **No \`aria-activedescendant\`** — the highlighted option is marked with \`data-highlighted\`, so screen readers are not told which option the arrow keys reached until it is selected.
- Not a form control: there is no \`name\` and nothing is submitted. Keep the value in state and post it yourself.
- Filtering is a case-insensitive \`includes\` on \`label\` only; \`multiple\` shows selected labels joined with \`", "\` and truncates.
- The listbox is portaled to \`<body>\` with fixed positioning (\`useAnchoredPosition\`, width matches trigger, max height 300px) so it escapes \`overflow: hidden\` ancestors.
- Strings default to English but are props: \`placeholder\` ("Select an option"), \`searchPlaceholder\` ("Search..."), \`noResultsText\` ("No results found"). The search box's \`aria-label="Search options"\` and the listbox fallback \`aria-label="Options"\` are hard-coded.
- RTL: floating label uses logical \`start-3\`; the chevron sits at the flex end. Theming: \`border-input\`, \`bg-background\`, popover \`bg-card border-border\`, selected option \`bg-primary-50 dark:bg-primary-950\`. Depends on \`class-variance-authority\` and \`Input\`'s \`RequiredMark\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-dropdown',
          why: 'Select picks a value into a form (role="combobox"/listbox); Dropdown runs actions from a menu (role="menu").',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-autocomplete',
          why: 'Select filters a list it already has; Autocomplete is a text field for large or remote lists with a create-new row.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-radio',
          why: 'Select when the list is long, grouped or searchable; Radio for up to ~7 visible options.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-pillselect',
          why: 'Select is a form field with label/error; PillSelect is a compact toolbar pill for one-of-N view choices.',
        },
        {
          type: 'alternative to',
          target: 'composite-forms-languageselector',
          why: 'Select is a labelled, validated form field for arbitrary values; LanguageSelector is a header/settings switcher with a built-in language list.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
    labelVariant: {
      control: 'select',
      options: ['stacked', 'floating'],
      description: 'Visual style of the label',
      table: {
        defaultValue: { summary: 'stacked' },
      },
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

export const FloatingLabel: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    labelVariant: 'floating',
  },
};

export const FloatingLabelWithValue: Story = {
  args: {
    optionsKey: 'countries',
    label: 'Country',
    labelVariant: 'floating',
    defaultValue: 'uk',
  },
};

export const FloatingLabelSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-[280px] flex-col gap-4">
      <Select
        options={simpleOptions}
        label="Small"
        labelVariant="floating"
        size="sm"
      />
      <Select
        options={simpleOptions}
        label="Medium"
        labelVariant="floating"
        size="md"
      />
      <Select
        options={simpleOptions}
        label="Large"
        labelVariant="floating"
        size="lg"
      />
    </div>
  ),
};

export const FloatingLabelWithError: Story = {
  args: {
    optionsKey: 'simple',
    label: 'Fruit',
    labelVariant: 'floating',
    error: 'Please select a fruit',
  },
};

export const Required: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-[280px] flex-col gap-4">
      <Select options={simpleOptions} label="Required (stacked)" required />
      <Select
        options={simpleOptions}
        label="Soft required (stacked)"
        required
        requiredVariant="warning"
      />
      <Select
        options={simpleOptions}
        label="Required (floating)"
        labelVariant="floating"
        required
      />
      <Select
        options={simpleOptions}
        label="Soft required (floating)"
        labelVariant="floating"
        required
        requiredVariant="warning"
      />
    </div>
  ),
};

export const Multiple: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex w-[280px] flex-col gap-4">
      <Select
        multiple
        options={simpleOptions}
        label="Fruits"
        placeholder="Select fruits"
      />
      <Select
        multiple
        options={simpleOptions}
        label="Fruits (floating)"
        labelVariant="floating"
        defaultValue={['apple', 'banana']}
      />
    </div>
  ),
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
        <code className="bg-muted text-foreground rounded px-1 font-mono">
          {value || 'none'}
        </code>
      </p>
      <button
        type="button"
        onClick={() => setValue('')}
        className="bg-primary-800 hover:bg-primary-900 rounded px-3 py-1.5 text-sm text-white"
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
