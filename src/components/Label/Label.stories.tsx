import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  id: 'text-inputs-label',
  title: 'Inputs/Text inputs/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The standalone form label: a styled native \`<label>\` (\`forwardRef\`, all label attributes pass through) with \`size\` \`sm\` | \`md\` | \`lg\` and a \`required\` asterisk. It exists so that controls which do **not** render their own label — a raw \`<select>\`, a custom widget, a group of fields — get the same typography as the \`label\` prop on \`Input\` / \`Textarea\`. The folder exports \`Label\` and \`labelVariants\`.

### Use it when

- You are labelling a control that has no \`label\` prop, and you can point \`htmlFor\` at its \`id\`.
- You are composing a custom field layout (label beside the control, label above a group) and want it to match the rest of the form.

### Don't use it when

- The control already takes a \`label\` prop (\`Input\`, \`Textarea\`, \`Select\`, \`PhoneInput\`, \`WebsiteInput\`) — use that; it wires \`htmlFor\`, \`aria-describedby\` and the floating variant for you.
- You are naming a non-labelable element such as a \`div\` editor host — use a plain element with an \`id\` and \`aria-labelledby\` on the host instead (see the \`RichEditor\` composer story).
- You need a group caption — use \`<fieldset>\` + \`<legend>\`.

### Example

\`\`\`tsx
const id = React.useId();

<div className="flex flex-col gap-1.5">
  <Label htmlFor={id} required>Preferred pharmacy</Label>
  <select id={id} value={pharmacy} onChange={(e) => setPharmacy(e.target.value)}>
    …
  </select>
</div>
\`\`\`

The label owns nothing — association is entirely through \`htmlFor\` / \`id\`, which you supply.

### Limitations

- Purely presentational: it does not generate ids, validate that \`htmlFor\` matches anything, or add \`aria-*\`. The asterisk is \`aria-hidden\`; set \`required\` on the control itself for the semantics.
- Disabled styling relies on Tailwind \`peer-disabled:\` — it only dims when the control has the \`peer\` class and precedes the label in the DOM.
- RTL-safe (asterisk uses \`ms-0.5\`). Colour from \`text-foreground\`; no dark-mode overrides needed.
- No strings, no dependencies beyond \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'text-inputs-input',
          why: 'Label gives the same label styling to controls that do not render their own; Input already includes it via the label prop.',
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
    required: {
      control: 'boolean',
      description:
        'Appends an aria-hidden asterisk; does not set required on the control.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Email address',
    htmlFor: 'email',
  },
};

export const Required: Story = {
  args: {
    children: 'Full name',
    htmlFor: 'name',
    required: true,
  },
};

export const Small: Story = {
  args: {
    children: 'Small label',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large label',
    size: 'lg',
  },
};

export const WithInput: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5">
      <Label {...args} htmlFor="story-input" />
      <input
        id="story-input"
        className="border-border rounded-md border px-3 py-2 text-sm"
        placeholder="Type here..."
      />
    </div>
  ),
  args: {
    children: 'Username',
    required: true,
  },
};
