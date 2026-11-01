import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { InlineEdit, type InlineEditProps } from './InlineEdit';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Stateful(props: Omit<InlineEditProps, 'onSave'> & { fail?: boolean }) {
  const { fail, ...rest } = props;
  const [value, setValue] = React.useState(rest.value);
  return (
    <div className="w-80">
      <InlineEdit
        {...rest}
        value={value}
        onSave={async (next) => {
          await wait(800);
          if (fail) throw new Error('The server rejected the change.');
          setValue(next);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof InlineEdit> = {
  id: 'text-inputs-inlineedit',
  title: 'Inputs/Text inputs/InlineEdit',
  component: InlineEdit,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A click-to-edit value for detail views. Display mode is a button showing the formatted value (or a placeholder); edit mode swaps in the control for \`type\` — \`text\`, \`textarea\`, \`number\`, \`date\`, \`select\`, \`email\`, \`url\` or \`tel\` — with save and cancel buttons.

### Use it when

- A record's sidebar or header shows many fields and editing one should not open a form.
- Each field saves on its own (\`onSave\` per field), so partial edits are fine.

### Don't use it when

- Several fields must be saved together or validated as a set — use a form of \`Input\`s with one submit.
- The value is always editable — a plain \`Input\` is clearer than a hidden affordance.
- You are laying out many label/value rows — reach for \`PropertyList\`, which renders \`InlineEdit\` for editable items.

### Example

\`\`\`tsx
<InlineEdit
  label="Phone"
  type="tel"
  value={contact.phone}
  validate={(v) => (v && !/^[\\d\\s()+-]+$/.test(v) ? 'Digits only' : undefined)}
  onSave={(phone) => updateContact({ phone })}
/>
\`\`\`

The caller owns \`value\`; \`onSave\` may return a promise. While it is pending the new value shows with a spinner; if it rejects the previous value comes back and the error is announced.

### Limitations

- Enter saves; in a textarea use Cmd/Ctrl+Enter. Escape cancels. Blur saves unless \`saveOnBlur={false}\`, in which case it cancels.
- Focus returns to the display button after a save or cancel triggered from inside the editor; blur-saves leave focus where the user moved it.
- Errors render in a \`role="alert"\` paragraph wired to the control with \`aria-describedby\`; the pending spinner is \`role="status"\`.
- Values are strings. Dates are ISO \`yyyy-MM-dd\` and display with Luxon's \`DATE_MED\` in the browser locale. \`select\` uses a native \`<select>\`.
- English defaults ("Edit {label}", "Save", "Cancel", "Saving…", "Click to add") are overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'The edit control is styled with the shared input variants.',
        },
        {
          type: 'composes with',
          target: 'record-details-propertylist',
          why: 'PropertyList renders an InlineEdit for each editable item.',
        },
      ],
    },
  },
  argTypes: {
    value: { description: 'Current persisted value.', control: 'text' },
    label: {
      description: 'Field name used for accessible names.',
      control: 'text',
    },
    type: {
      description: 'Control rendered in edit mode.',
      control: 'select',
      options: [
        'text',
        'textarea',
        'number',
        'date',
        'select',
        'email',
        'url',
        'tel',
      ],
    },
    options: { description: 'Choices for `type="select"`.' },
    placeholder: { description: 'Shown when the value is empty.' },
    validate: {
      description: 'Return a message to block the save.',
      control: false,
    },
    formatDisplay: {
      description: 'Custom rendering of the value in display mode.',
      control: false,
    },
    onSave: {
      description:
        'Persist the value. May return a promise; rejection restores.',
      control: false,
    },
    readOnly: { description: 'Plain text, no edit affordance.' },
    disabled: { description: 'Disable editing.' },
    saveOnBlur: { description: 'Save (default) or cancel when focus leaves.' },
    size: {
      description: 'Display and control size.',
      control: 'radio',
      options: ['sm', 'md'],
    },
    labels: { description: 'Translatable strings.', control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Stateful label="Company name" value="Acme Health" />,
};

export const Types: Story = {
  render: () => (
    <dl className="grid w-[28rem] grid-cols-[8rem_1fr] items-center gap-2 text-sm">
      <dt className="text-muted-foreground">Email</dt>
      <dd>
        <Stateful
          size="sm"
          label="Email"
          type="email"
          value="ada@example.com"
          validate={(v) =>
            v && !v.includes('@') ? 'Enter a valid email' : undefined
          }
        />
      </dd>
      <dt className="text-muted-foreground">Seats</dt>
      <dd>
        <Stateful size="sm" label="Seats" type="number" value="120" />
      </dd>
      <dt className="text-muted-foreground">Go-live</dt>
      <dd>
        <Stateful
          size="sm"
          label="Go-live date"
          type="date"
          value="2026-11-02"
        />
      </dd>
      <dt className="text-muted-foreground">Stage</dt>
      <dd>
        <Stateful
          size="sm"
          label="Stage"
          type="select"
          value="scoping"
          options={[
            { value: 'demo', label: 'Demo' },
            { value: 'scoping', label: 'Scoping' },
            { value: 'sow', label: 'SOW' },
          ]}
        />
      </dd>
      <dt className="text-muted-foreground">Notes</dt>
      <dd>
        <Stateful size="sm" label="Notes" type="textarea" value="" />
      </dd>
    </dl>
  ),
};

export const SaveFails: Story = {
  render: () => (
    <Stateful label="Website" type="url" value="https://acme.test" fail />
  ),
};

export const ReadOnly: Story = {
  args: {
    label: 'Account ID',
    value: 'ACC-20931',
    readOnly: true,
    onSave: () => undefined,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Owner',
    value: 'Ada Lovelace',
    disabled: true,
    onSave: () => undefined,
  },
};
