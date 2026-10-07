import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Badge } from '../Badge';
import { AssociationList, type AssociationListProps } from './AssociationList';
import { contacts } from './storyData';

const meta: Meta<typeof AssociationList> = {
  id: 'records-associationlist',
  title: 'Modules/Records/AssociationList',
  component: AssociationList,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

A **card of records related to the current one** — the contacts on a company, the deals on a contact, the clinics on an employer. It shows a heading with a count, an avatar row per item with an optional subtitle, and collapses past \`maxVisible\` behind a "Show all (N)" toggle. Adding and removing leave as callbacks.

Headless: items arrive as \`AssociationListItem\` (\`{ id, name, subtitle?, avatarUrl? }\`); the card never fetches or confirms.

### Use it when

- A record page's sidebar lists related records with a quick way to open, link or unlink one.
- The list is short enough to read at a glance and usually has fewer than a few dozen entries.

### Don't use it when

- The relation is long, needs search, sort or paging — use a [ListView](?path=/docs/views-listview--docs) or a data grid.
- The rows are actions over time, not records — [ActivityFeed](?path=/docs/records-activityfeed--docs).

### Example

\`\`\`tsx
<AssociationList
  title="Contacts"
  items={contacts.map((c) => ({ id: c._id, name: c.fullName, subtitle: c.title }))}
  getHref={(id) => \`/contacts/\${id}\`}
  onOpen={(id) => navigate(\`/contacts/\${id}\`)}
  onAdd={() => setPickerOpen(true)}
  onRemove={async (id, item) => {
    if (!(await confirm(\`Unlink \${item.name}?\`))) return;
    await unlink(id);
  }}
/>;
\`\`\`

### Limitations

- Accessibility: the card is a \`<section>\` labelled by its heading (\`h3\` by default). Names are links with \`getHref\`, buttons with only \`onOpen\`. Each remove button is named "Remove <name>"; while its promise is pending the row is \`aria-busy\` and the button disabled, and it re-enables if the promise rejects. The "Show all" toggle carries \`aria-expanded\` and \`aria-controls\`.
- Removal is not optimistic — the row stays until the caller drops it from \`items\`, so a rejection needs no rollback. Confirmation is the caller's.
- Expansion is uncontrolled. Strings are English defaults overridable through \`labels\`; name truncation is RTL-safe.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'One avatar per related record.',
        },
        {
          type: 'uses',
          target: 'data-display-badge',
          why: 'The count beside the heading.',
        },
      ],
    },
  },
  argTypes: {
    title: { description: 'Card heading.', table: { category: 'Data' } },
    items: { description: 'The related records.', table: { category: 'Data' } },
    maxVisible: {
      description: 'Rows shown before "Show all".',
      table: { category: 'Data' },
    },
    loading: { description: 'Loading state.', table: { category: 'Data' } },
    error: {
      description: 'Error state.',
      table: { category: 'Data' },
      control: false,
    },
    onOpen: {
      description: 'A name was activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description: 'Renders names as real anchors.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onAdd: {
      description: 'Shows the Add button.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onRemove: {
      description:
        '`(id, item) => void | Promise<void>`; the row is pending until it settles.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onRetry: {
      description: 'Retries a failed load.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItemMeta: {
      description: 'Trailing content per row.',
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
      control: false,
    },
    classNames: {
      description:
        'Class overrides keyed by slot: header, list, item, toggle, state.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof AssociationList>;

const base = {
  title: 'Contacts',
  items: contacts,
  getHref: (id: string) => `#contact-${id}`,
} satisfies Partial<AssociationListProps>;

export const Default: Story = { args: { ...base } };

function EditableList(args: AssociationListProps) {
  const [items, setItems] = React.useState(args.items);
  return (
    <AssociationList
      {...args}
      items={items}
      onAdd={() =>
        setItems((list) => [
          ...list,
          { id: `n${list.length}`, name: `New contact ${list.length + 1}` },
        ])
      }
      onRemove={async (id) => {
        await new Promise((r) => setTimeout(r, 500));
        setItems((list) => list.filter((c) => c.id !== id));
      }}
    />
  );
}

export const AddAndRemove: Story = {
  name: 'Add and remove',
  render: (args) => <EditableList {...args} />,
  args: { ...base, maxVisible: 3 },
};

export const WithMeta: Story = {
  name: 'Item meta slot',
  args: {
    ...base,
    renderItemMeta: (item) =>
      item.id === 'c1' ? (
        <Badge size="sm" variant="success">
          Champion
        </Badge>
      ) : null,
  },
};

export const Empty: Story = { args: { ...base, items: [], onAdd: () => {} } };

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
  args: { ...base, onAdd: () => {}, onRemove: () => {} },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <AssociationList {...args} />
    </div>
  ),
  args: { ...base, onRemove: () => {} },
};
