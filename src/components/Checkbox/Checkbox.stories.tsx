import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, CheckboxGroup } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  id: 'choice-inputs-checkbox',
  title: 'Inputs/Choice inputs/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A native \`<input type="checkbox">\` (all input attributes pass through, \`forwardRef\` reaches the element) dressed with the field anatomy: \`label\` (wired with \`htmlFor\`), \`description\`, \`error\`, \`size\` \`sm\` | \`md\` | \`lg\`, \`labelPosition\` \`left\` | \`right\` and an \`indeterminate\` flag that sets the DOM property for you. The folder also exports \`CheckboxGroup\` — a \`<fieldset>\` with \`legend\`, shared \`description\` / \`error\`, \`orientation\` and a \`labelVariant="floating"\` frame that lines up with floating inputs — and the \`checkboxVariants\` cva helper.

### Use it when

- The user can turn **zero or more** independent options on, and the choice is submitted with the form (\`name\` / \`value\` post like any checkbox).
- A single yes/no that is *recorded*, not applied instantly: "Accept the terms", "Include archived".
- A "select all" row above a list — \`indeterminate\` shows the mixed state.

### Don't use it when

- The setting takes effect the moment it changes (notifications, dark mode) — \`Switch\` (\`role="switch"\`, no form value).
- Exactly **one** of the options may be chosen — \`Radio\` inside a \`RadioGroup\`; a compact one-of-N picker in a toolbar — \`PillSelect\`.
- The option is a pressed/unpressed toolbar state (Bold, filters) — \`Toggle\`.
- The list of options is long or needs search — \`Select multiple\`.

### Example

\`\`\`tsx
const [consents, setConsents] = useState({ terms: false, marketing: false });
const set = (key: keyof typeof consents) => (e: React.ChangeEvent<HTMLInputElement>) =>
  setConsents((c) => ({ ...c, [key]: e.target.checked }));

<CheckboxGroup label="Consent" error={submitted && !consents.terms ? 'You must accept the terms' : undefined}>
  <Checkbox name="terms" label="I accept the terms" checked={consents.terms} onChange={set('terms')} required />
  <Checkbox name="marketing" label="Marketing emails" description="Product news, at most monthly."
    checked={consents.marketing} onChange={set('marketing')} />
</CheckboxGroup>
\`\`\`

Each \`Checkbox\` owns its own \`checked\` / \`onChange\` (or \`defaultChecked\`); \`CheckboxGroup\` is layout and messaging only — it has no \`value\` or \`onValueChange\`.

### Limitations

- Accessibility: the visible \`<label htmlFor>\` is bound to the input's \`id\` (auto \`useId\` when omitted); \`aria-describedby\` lists the description and error ids; \`aria-invalid\` is set when \`error\` is present; the error is a \`<p role="alert">\`. Keyboard (Space) and focus ring come from the native input. Without a \`label\` you must pass \`aria-label\` yourself.
- \`CheckboxGroup\` renders \`<fieldset>\` + \`<legend>\` and a \`role="group"\` wrapper; its \`aria-describedby\` sits on the fieldset. Group-level \`error\` does not set \`aria-invalid\` on the children.
- \`indeterminate\` is visual + DOM property only; a click still flips \`checked\`, the host must recompute the mixed state.
- RTL: \`labelPosition\` is implemented with \`flex-row-reverse\`, so \`right\` means "after the box" and follows the writing direction. No physical offsets.
- Theming: \`border-input\`, \`bg-background\`, checked \`bg-primary-800 border-primary-500\`; the check glyph is hard-coded \`text-white\`. Error text \`text-destructive-700 dark:text-destructive-400\`; group error uses plain \`text-destructive\`.
- No built-in strings; depends on \`class-variance-authority\` and imports the floating-frame variants from \`Input\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-switch',
          why: 'Checkbox records a choice submitted with the form; Switch applies an on/off setting immediately.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-radio',
          why: 'Checkbox lets several options be on at once; Radio allows exactly one.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    indeterminate: {
      control: 'boolean',
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
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Accept terms and conditions',
    defaultChecked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive emails about new products, features, and promotions.',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all items',
    indeterminate: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Small checkbox',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large checkbox',
    size: 'lg',
  },
};

export const LabelOnLeft: Story = {
  args: {
    label: 'Label on left',
    labelPosition: 'left',
  },
};

export const WithError: Story = {
  args: {
    label: 'Accept terms and conditions',
    error: 'You must accept the terms to continue',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    defaultChecked: true,
  },
};

export const Group: Story = {
  render: () => (
    <CheckboxGroup label="Select your interests" orientation="vertical">
      <Checkbox label="Sports" />
      <Checkbox label="Music" />
      <Checkbox label="Travel" />
      <Checkbox label="Technology" />
    </CheckboxGroup>
  ),
};

export const HorizontalGroup: Story = {
  render: () => (
    <CheckboxGroup label="Notification preferences" orientation="horizontal">
      <Checkbox label="Email" />
      <Checkbox label="SMS" />
      <Checkbox label="Push" />
    </CheckboxGroup>
  ),
};

export const GroupWithDescriptions: Story = {
  render: () => (
    <CheckboxGroup
      label="Privacy settings"
      description="Choose which information to share"
    >
      <Checkbox
        label="Profile visibility"
        description="Make your profile visible to other users"
      />
      <Checkbox
        label="Show email"
        description="Display your email address on your profile"
      />
      <Checkbox label="Activity status" description="Show when you're active" />
    </CheckboxGroup>
  ),
};

export const GroupWithError: Story = {
  render: () => (
    <CheckboxGroup
      label="Required selections"
      error="Please select at least one option"
    >
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" />
      <Checkbox label="Option 3" />
    </CheckboxGroup>
  ),
};

export const GroupFloatingLabel: Story = {
  render: () => (
    <CheckboxGroup
      label="Notification preferences"
      labelVariant="floating"
      orientation="horizontal"
    >
      <Checkbox label="Email" />
      <Checkbox label="SMS" />
      <Checkbox label="Push" />
    </CheckboxGroup>
  ),
};

export const GroupFloatingLabelWithError: Story = {
  render: () => (
    <CheckboxGroup
      label="Required selections"
      labelVariant="floating"
      orientation="horizontal"
      error="Please select at least one option"
    >
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" />
    </CheckboxGroup>
  ),
};

function IndeterminateDemo() {
  const [checked, setChecked] = React.useState([false, false, false]);

  const allChecked = checked.every(Boolean);
  const someChecked = checked.some(Boolean) && !allChecked;

  const handleParentChange = () => {
    const newValue = !allChecked;
    setChecked([newValue, newValue, newValue]);
  };

  return (
    <div className="space-y-4">
      <Checkbox
        label="Select all"
        checked={allChecked}
        indeterminate={someChecked}
        onChange={handleParentChange}
      />
      <div className="ml-6 flex flex-col gap-2">
        <Checkbox
          label="Option 1"
          checked={checked[0]}
          onChange={(e) =>
            setChecked([e.target.checked, checked[1], checked[2]])
          }
        />
        <Checkbox
          label="Option 2"
          checked={checked[1]}
          onChange={(e) =>
            setChecked([checked[0], e.target.checked, checked[2]])
          }
        />
        <Checkbox
          label="Option 3"
          checked={checked[2]}
          onChange={(e) =>
            setChecked([checked[0], checked[1], e.target.checked])
          }
        />
      </div>
    </div>
  );
}

export const IndeterminateExample: Story = {
  render: () => <IndeterminateDemo />,
};
