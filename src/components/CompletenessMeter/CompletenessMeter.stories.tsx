import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { CompletenessMeter } from './CompletenessMeter';

const clinicFields = [
  { key: 'name', label: 'Clinic name', complete: true, weight: 2 },
  { key: 'address', label: 'Address', complete: true, weight: 2 },
  { key: 'phone', label: 'Phone', complete: true },
  { key: 'hours', label: 'Hours of operation', complete: false },
  { key: 'services', label: 'Services offered', complete: true },
  { key: 'contacts', label: 'Primary contact', complete: false },
  { key: 'providers', label: 'Providers', complete: false },
];

const meta: Meta<typeof CompletenessMeter> = {
  id: 'record-details-completenessmeter',
  title: 'Components/Record details/CompletenessMeter',
  component: CompletenessMeter,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'loading-progress',
          why: 'The bar is the Progress component; the meter tones its fill by completion band and supplies srLabel/valueText.',
        },
      ],
    },
    docs: {
      description: {
        component: `
### What it's for

Tells a user how complete a record is and what's left to fill in: a weighted
percentage, a progress bar coloured by band (≥80% success, ≥50% warning, below
destructive) and the list of missing fields. \`getCompleteness(fields)\` exposes the
same calculation for sorting or filtering records.

### Use it when

- A record (clinic, provider, contact, company) has optional fields worth nudging people to complete.
- Missing fields should link straight to their inputs — pass \`onFieldClick\`.

### Don't use it when

- You're showing task or upload progress — use \`Progress\`.
- Completion is a sequence of steps — use a stepper.

### Example

\`\`\`tsx
<CompletenessMeter
  fields={[
    { key: 'name', label: 'Name', complete: !!clinic.name, weight: 2 },
    { key: 'phone', label: 'Phone', complete: !!clinic.phone },
  ]}
  onFieldClick={(key) => document.getElementById(key)?.focus()}
/>
\`\`\`

### Limitations

- The bar composes \`Progress\`: \`role="progressbar"\` with \`aria-valuenow\` / \`aria-valuetext\`, named by \`labels.progress\`; the full variant is a \`role="group"\` labelled by its heading.
- Missing fields are buttons only when \`onFieldClick\` is set. \`compact\` drops the heading and list — pair it with a popover if users need the details.
- An empty \`fields\` array reads as 100%. The width transition respects \`prefers-reduced-motion\`.
- Strings default to English; override through \`labels\`.
`,
      },
    },
  },
  argTypes: {
    fields: {
      description:
        '`{ key, label, complete, weight? }` for every field on the record.',
    },
    variant: {
      description: '`compact` shows only the bar and percentage.',
      control: 'radio',
      options: ['default', 'compact'],
    },
    onFieldClick: {
      description: 'Makes missing fields buttons that report their `key`.',
    },
    labels: {
      description: 'Overrides for the heading, percentage and list strings.',
    },
  },
  args: { fields: clinicFields },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CompletenessMeter>;

export const Default: Story = {};

export const ClickableFields: Story = {
  args: { onFieldClick: fn() },
};

export const Compact: Story = {
  args: { variant: 'compact' },
};

export const Complete: Story = {
  args: { fields: clinicFields.map((f) => ({ ...f, complete: true })) },
};

export const Low: Story = {
  args: { fields: clinicFields.map((f, i) => ({ ...f, complete: i === 0 })) },
};
