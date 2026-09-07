import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  id: 'choice-inputs-switch',
  title: 'Inputs/Choice inputs/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

An on/off control rendered as a \`<button role="switch" aria-checked>\` with a sliding thumb. Controlled (\`checked\` + \`onCheckedChange\`) or uncontrolled (\`defaultChecked\`), with \`label\`, \`description\`, \`labelPosition\` \`left\` | \`right\` and \`size\` \`sm\` | \`md\` | \`lg\`. Native button attributes pass through and \`forwardRef\` reaches the button. \`switchTrackVariants\` / \`switchThumbVariants\` are exported for custom builds.

### Use it when

- Changing it **takes effect immediately** — notifications, dark mode, "show inactive" — and the label reads as a setting, not a question.
- The control lives in a settings list or a card header rather than a form that is submitted later.

### Don't use it when

- The value is submitted with a form or needs a third (indeterminate) state — \`Checkbox\` (native input, posts \`name\` / \`value\`).
- The pressed state belongs to a toolbar button with an icon or short text (Bold, filters) — \`Toggle\` (\`aria-pressed\`).
- The user picks one of several options — \`Radio\`, \`PillSelect\`.

### Example

\`\`\`tsx
const [enabled, setEnabled] = useState(prefs.notifications);

<Switch
  label="Email notifications"
  description="Sent when an order changes status."
  checked={enabled}
  onCheckedChange={(next) => {
    setEnabled(next);
    savePreference('notifications', next);
  }}
/>
\`\`\`

The host owns persistence — the component only reports the new state.

### Limitations

- Accessibility: \`role="switch"\` with \`aria-checked\`; the \`<label htmlFor>\` targets the button's \`id\` (auto \`useId\`); \`aria-describedby\` points at the description. Enter and Space toggle (handled in \`onKeyDown\`), click toggles; \`disabled\` blocks both. Without a \`label\` pass \`aria-label\`.
- It is a button, **not** a form control: no \`name\`, no \`value\`, nothing is submitted and there is no \`error\` prop. Render a hidden input yourself if a form needs the state.
- RTL: the thumb translation has \`rtl:\` variants, so the "on" side follows the writing direction; \`labelPosition\` uses \`flex-row-reverse\` (logical).
- Theming: track \`bg-neutral-200 dark:bg-neutral-700\`, checked \`bg-primary-800\`; the thumb is hard-coded \`bg-white\`. Focus ring uses \`ring-ring\`.
- No built-in strings; depends on \`class-variance-authority\` only.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'actions-toggle',
          why: 'Toggle is a pressed-state button for toolbars; Switch is the labelled on/off form control.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-checkbox',
          why: 'Switch applies an on/off setting immediately; Checkbox records a choice submitted with the form.',
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
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'Notifications enabled',
    defaultChecked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Dark mode',
    description: 'Toggle between light and dark theme',
  },
};

export const Small: Story = {
  args: {
    label: 'Small switch',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large switch',
    size: 'lg',
  },
};

export const LabelOnLeft: Story = {
  args: {
    label: 'Auto-save',
    labelPosition: 'left',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled switch',
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

export const NoLabel: Story = {
  args: {
    'aria-label': 'Toggle setting',
  },
};

function ControlledSwitchDemo() {
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="space-y-4">
      <Switch
        label="Controlled switch"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <p className="text-muted-foreground text-xs">
        State: <code className="font-mono">{checked ? 'on' : 'off'}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSwitchDemo />,
};

export const SettingsExample: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <h3 className="text-lg font-semibold">Notification Settings</h3>
      <div className="space-y-6">
        <Switch
          label="Push notifications"
          description="Receive push notifications on your device"
          defaultChecked
        />
        <Switch
          label="Email notifications"
          description="Receive email updates about your account"
          defaultChecked
        />
        <Switch
          label="SMS notifications"
          description="Receive text message alerts"
        />
        <Switch
          label="Marketing emails"
          description="Receive promotional content and offers"
        />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch label="Small" size="sm" defaultChecked />
      <Switch label="Medium (default)" size="md" defaultChecked />
      <Switch label="Large" size="lg" defaultChecked />
    </div>
  ),
};
