import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { PillSelect } from './PillSelect';

const meta: Meta<typeof PillSelect> = {
  id: 'choice-inputs-pillselect',
  title: 'Inputs/Choice inputs/PillSelect',
  component: PillSelect,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **compact one-of-N picker for toolbars**: a single rounded pill reading \`"Label: Value"\` that opens a small portaled \`role="listbox"\` of \`options: PillSelectOption[]\` (\`{ value, label, disabled? }\`). Controlled (\`value\` + \`onValueChange\`) or uncontrolled (\`defaultValue\`, falling back to the first option). Props are deliberately few: \`label\`, \`disabled\`, \`className\`.

### Use it when

- A view or mode switch sits in a toolbar, card header or filter bar — "Sort: Newest", "Period: 30 days", "Mode: Chart" — and the current choice must stay readable in one short chip.
- Radio buttons would waste space and a full \`Select\` (label, border, helper text) is too heavy.

### Don't use it when

- The choice is a form field with validation — \`Select\` (label, \`error\`, \`helperText\`, \`required\`, \`multiple\`, search).
- Options should all be visible to compare — \`Radio\` / \`RadioGroup\`.
- Several options can be on at once — \`Checkbox\`, or \`Dropdown multiSelect\`.
- Independent pressed/unpressed toolbar buttons — \`Toggle\`; navigating between views with their own content — \`Tabs\`.

### Example

\`\`\`tsx
const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

<div className="flex items-center gap-2">
  <PillSelect
    label="Period"
    options={[
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days', disabled: !hasHistory },
    ]}
    value={range}
    onValueChange={(v) => setRange(v as typeof range)}
  />
</div>
<UsageChart range={range} />
\`\`\`

### Limitations

- Accessibility: trigger is \`<button aria-haspopup="listbox" aria-expanded aria-controls>\`; the popover is \`role="listbox"\` (\`aria-label\` = \`"{label} options"\` or \`"Options"\`) with \`<button role="option" aria-selected>\` rows. On open, focus moves to the selected (or first enabled) option; Escape closes and returns focus to the trigger; outside click closes. **No arrow-key navigation** — move between options with Tab. No \`aria-label\` prop for the trigger; its accessible name is the visible \`"Label: Value"\` text.
- The collapsed text is composed in code as \`\${label}: \${value}\` (colon-space, English convention) and the empty-list fallback is a hard-coded \`"No options"\`.
- Not a form control: no \`name\`, \`error\` or \`required\`.
- Positioning is a bespoke fixed-position calculation from the trigger's \`getBoundingClientRect().left\` (physical) — the popover does not flip or mirror in RTL, though option text uses logical \`text-start\`.
- Theming: \`bg-muted\`, \`border-border\`, \`bg-card\`, \`text-foreground\` / \`text-muted-foreground\` tokens; no dark-specific overrides needed. No dependencies beyond \`useEscapeKey\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-radio',
          why: 'PillSelect collapses a one-of-N choice into a toolbar pill; Radio shows every option at once in a form.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-select',
          why: 'PillSelect is a compact toolbar pill for one-of-N view choices; Select is a form field with label/error.',
        },
      ],
    },
  },
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
