import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from '../Button';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../Modal';
import { FieldHistory, type FieldHistoryProps } from './FieldHistory';
import { fieldChanges, historyNow, historyZone } from './storyData';

const meta: Meta<typeof FieldHistory> = {
  id: 'records-fieldhistory',
  title: 'Modules/Records/FieldHistory',
  component: FieldHistory,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **change log of a record's fields**: each entry shows the field, the old value struck through, an arrow, and the new value, with who made the change, where it came from, and when — relative time visible, the absolute time in the \`title\`. Entries are grouped by day, and a field filter appears once more than one field has changed.

Headless: entries arrive as \`items\` of \`FieldHistoryEntry\` (\`{ id, field, from, to, changedAt, changedBy?, source? }\`) and nothing is fetched.

### Use it when

- An audit trail must answer "who changed this, from what, and when".
- A record page needs an "Edit history" panel or dialog.

### Don't use it when

- The log is of actions — calls, emails, meetings — rather than value changes: [ActivityFeed](?path=/docs/records-activityfeed--docs).
- You need a diff of long text — render a text diff instead; this shows whole values.

### Example

\`\`\`tsx
<FieldHistory
  items={changes}
  loading={isLoading}
  error={error}
  onRetry={refetch}
  formatValue={(v, e) => (e.field === 'Amount' ? currency.format(Number(v)) : String(v))}
/>;
\`\`\`

For a dialog, wrap it: \`<Modal open={open} onOpenChange={setOpen}><ModalBody><FieldHistory … /></ModalBody></Modal>\`, or a \`Sheet\` for a side panel — see the **In a modal** story.

### Limitations

- Accessibility: each day is a \`<section>\` labelled by its heading, holding a \`<ul>\`. Old and new values are \`<del>\` and \`<ins>\` with visually hidden "Changed from" / "to" prefixes, because most screen readers do not announce those elements. The arrow is decorative and flips under RTL.
- Blank values (\`null\`, \`undefined\`, \`''\`) render as the \`emptyValue\` label and are never passed to \`formatValue\`.
- The field filter is uncontrolled (\`defaultField\` seeds it) and lists fields alphabetically.
- Dates come from \`timeZone\` and \`locale\` through Luxon; strings are English defaults overridable through \`labels\`. Every entry renders — page long histories yourself.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'alternative to',
          target: 'records-activityfeed',
          why: 'The feed logs what people did; FieldHistory logs how values changed.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-select',
          why: 'The field filter.',
        },
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'The actor of each change.',
        },
      ],
    },
  },
  argTypes: {
    items: { description: 'The change entries.', table: { category: 'Data' } },
    loading: { description: 'Loading state.', table: { category: 'Data' } },
    error: {
      description: 'Error state.',
      table: { category: 'Data' },
      control: false,
    },
    defaultField: {
      description: 'Field selected in the filter at first.',
      table: { category: 'Data' },
    },
    locale: { description: 'BCP 47 locale.', table: { category: 'Data' } },
    timeZone: {
      description: 'IANA zone for day boundaries.',
      table: { category: 'Data' },
    },
    now: {
      description: 'Pins "now" for relative times.',
      table: { category: 'Data' },
      control: false,
    },
    onRetry: {
      description: 'Retries a failed load.',
      table: { category: 'Callbacks' },
      control: false,
    },
    formatValue: {
      description: 'Renders a non-empty value.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the empty state.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description: 'Overrides the English strings.',
      table: { category: 'Slots' },
    },
    classNames: {
      description:
        'Class overrides keyed by slot: toolbar, section, dayHeader, entry, value, state.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof FieldHistory>;

const base = {
  items: fieldChanges,
  now: historyNow,
  timeZone: historyZone,
} satisfies Partial<FieldHistoryProps>;

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const Default: Story = { args: { ...base } };

export const FormattedValues: Story = {
  name: 'Formatted values',
  args: {
    ...base,
    formatValue: (value, entry) =>
      entry.field === 'Amount' ? usd.format(Number(value)) : String(value),
  },
};

export const FilteredToOneField: Story = {
  name: 'Filtered to one field',
  args: { ...base, defaultField: 'Stage' },
};

function HistoryModal(args: FieldHistoryProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit history</Button>
      <Modal open={open} onOpenChange={setOpen} size="lg">
        <ModalHeader>
          <ModalTitle>Edit history</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <FieldHistory {...args} />
        </ModalBody>
      </Modal>
    </>
  );
}

export const InModal: Story = {
  name: 'In a modal',
  render: (args) => <HistoryModal {...args} />,
  args: { ...base },
};

export const Empty: Story = { args: { ...base, items: [] } };

export const Loading: Story = { args: { ...base, items: [], loading: true } };

export const Error: Story = {
  args: {
    ...base,
    items: [],
    error: new globalThis.Error('Request failed'),
    onRetry: () => {},
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { ...base },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <FieldHistory {...args} />
    </div>
  ),
  args: { ...base },
};
