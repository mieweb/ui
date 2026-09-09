import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  id: 'actions-toggle',
  title: 'Inputs/Actions/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A two-state **button** (\`aria-pressed\`): pressed or not, controlled (\`pressed\` + \`onPressedChange\`) or uncontrolled (\`defaultPressed\`). Two variants (\`default\`, \`outline\`) and three sizes. Think "Bold" in a toolbar or "Show archived" above a list.

### Use it when

- An option toggles immediately and stays visibly pressed: formatting, view filters, mute/unmute.
- Several independent toggles sit in a toolbar; each carries its own state.

### Don't use it when

- The setting lives in a form and is saved later — use \`Switch\` (on/off with a label) or \`Checkbox\`.
- Exactly one of several options is chosen — use \`PillSelect\`, \`Radio\` or \`Tabs\`.
- It just triggers an action — \`Button\`.

### Example

\`\`\`tsx
const [showArchived, setShowArchived] = useState(false);

<Toggle pressed={showArchived} onPressedChange={setShowArchived} size="sm">
  Show archived
</Toggle>
<OrderList includeArchived={showArchived} />
\`\`\`

### Limitations

- An icon-only toggle needs \`aria-label\`; the pressed state is announced through \`aria-pressed\`, not through a label change.
- No indeterminate state.
- The pressed background uses the primary token, so it follows brand and dark mode; \`outline\` relies on the border token.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'actions-button',
          why: 'Use Toggle when the control stays pressed; Button when it just fires an action.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-switch',
          why: 'Switch is a labelled form control saved with the form; Toggle applies immediately in toolbars.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
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
    children: 'Bold',
    'aria-label': 'Toggle bold',
  },
};

export const Pressed: Story = {
  args: {
    children: 'Italic',
    defaultPressed: true,
    'aria-label': 'Toggle italic',
  },
};

export const Outline: Story = {
  args: {
    children: 'Underline',
    variant: 'outline',
    'aria-label': 'Toggle underline',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    'aria-label': 'Disabled toggle',
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledToggle {...args} />,
};

function ControlledToggle(args: React.ComponentProps<typeof Toggle>) {
  const [pressed, setPressed] = useState(false);
  return (
    <Toggle
      {...args}
      pressed={pressed}
      onPressedChange={setPressed}
      aria-label="Toggle favorite"
    >
      {pressed ? 'On' : 'Off'}
    </Toggle>
  );
}
