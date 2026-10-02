import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { PropertyList, type PropertyListItem } from './PropertyList';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const contactItems: PropertyListItem[] = [
  {
    key: 'email',
    label: 'Email',
    value: 'ada@example.com',
    type: 'email',
    editable: true,
    copyable: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    value: '(555) 010-0100',
    type: 'tel',
    editable: true,
    copyable: true,
  },
  {
    key: 'title',
    label: 'Job title',
    value: 'Director of Occupational Health',
    editable: true,
  },
  {
    key: 'stage',
    label: 'Lifecycle stage',
    value: 'opportunity',
    type: 'select',
    editable: true,
    options: [
      { value: 'lead', label: 'Lead' },
      { value: 'opportunity', label: 'Opportunity' },
      { value: 'customer', label: 'Customer' },
    ],
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    value: '',
    type: 'url',
    editable: true,
    placeholder: 'Add profile URL',
  },
  { key: 'notes', label: 'Notes', value: '', type: 'textarea', editable: true },
  {
    key: 'id',
    label: 'Record ID',
    value: 'CT-20931',
    copyable: true,
    hint: 'Assigned by the CRM',
  },
];

function useEditable(initial: PropertyListItem[]) {
  const [items, setItems] = React.useState(initial);
  const onSave = async (key: string, value: string) => {
    await wait(600);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, value } : i)));
  };
  return { items, onSave };
}

const meta: Meta<typeof PropertyList> = {
  id: 'record-details-propertylist',
  title: 'Components/Record details/PropertyList',
  component: PropertyList,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The field list in a record's sidebar or detail panel: label/value pairs rendered as a \`<dl>\`. Items can be edited in place (\`editable\`, via \`InlineEdit\`), copied (\`copyable\`, via \`CopyButton\`) or rendered with \`render\`. \`groups\` turns the list into collapsible sections, and \`hideEmpty\` tucks empty fields behind a "Show N empty fields" toggle.

### Use it when

- A contact, company, deal or patient page shows a column of attributes, some of them editable one at a time.
- Long attribute lists need sections the user can collapse.

### Don't use it when

- The values are a grid of records — use a data grid.
- Several fields must be validated and saved together — use a form.
- You only need one editable value — use \`InlineEdit\` directly.

### Example

\`\`\`tsx
<PropertyList
  layout="inline"
  hideEmpty
  groups={[
    { id: 'contact', title: 'Contact', items: contactItems },
    { id: 'system', title: 'System', items: systemItems, defaultOpen: false },
  ]}
  onSave={(key, value) => updateContact({ [key]: value })}
/>
\`\`\`

The caller owns the values; \`onSave(key, value)\` may return a promise, and a rejection restores the field and shows the error under it.

### Limitations

- Semantics: one \`<dl>\` per list or group, each row a \`<div>\` holding \`<dt>\` and \`<dd>\`. Group titles are headings (\`headingLevel\`, default 3) wrapping a \`CollapsibleTrigger\` with \`aria-expanded\`. \`hint\` is linked to the value with \`aria-describedby\`.
- \`layout="inline"\` puts the label beside the value from the \`sm\` breakpoint and stacks below it. The group chevron mirrors in RTL.
- Values are shown as strings (numbers are stringified); editing follows \`InlineEdit\`'s keyboard model. Items marked \`editable\` stay read-only when \`onSave\` is missing.
- Group open state and the empty-field toggle are not persisted yet.
- English defaults ("—", "Copy {label}", "Show N empty fields") are overridable through \`labels\`; \`inlineEditLabels\` is forwarded to every \`InlineEdit\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'text-inputs-inlineedit',
          why: 'Editable items render an InlineEdit.',
        },
        {
          type: 'uses',
          target: 'actions-copybutton',
          why: 'Copyable items get a CopyButton.',
        },
        {
          type: 'uses',
          target: 'layout-collapsible',
          why: 'Groups are Collapsible sections.',
        },
      ],
    },
  },
  argTypes: {
    items: { description: 'Flat list of properties.' },
    groups: { description: 'Collapsible sections; replaces `items`.' },
    onSave: {
      description: 'Persist an edit as `(key, value)`. May return a promise.',
      control: false,
    },
    layout: {
      description: 'Label above (`stacked`) or beside (`inline`) the value.',
      control: 'radio',
      options: ['stacked', 'inline'],
    },
    density: {
      description: 'Row spacing.',
      control: 'radio',
      options: ['comfortable', 'compact'],
    },
    hideEmpty: { description: 'Hide empty values behind a toggle.' },
    headingLevel: {
      description: 'Heading level of group titles.',
      control: 'select',
      options: [2, 3, 4, 5, 6],
    },
    labels: { description: 'Translatable strings.', control: false },
    inlineEditLabels: {
      description: 'Strings forwarded to each InlineEdit.',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const { items, onSave } = useEditable(contactItems);
    return (
      <div className="w-80">
        <PropertyList {...args} items={items} onSave={onSave} />
      </div>
    );
  },
};

export const InlineLayout: Story = {
  args: { layout: 'inline', density: 'compact' },
  render: Default.render,
};

export const HideEmpty: Story = {
  args: { hideEmpty: true },
  render: Default.render,
};

export const Groups: Story = {
  render: function Render() {
    const { items, onSave } = useEditable(contactItems);
    return (
      <div className="w-96">
        <PropertyList
          layout="inline"
          hideEmpty
          onSave={onSave}
          groups={[
            { id: 'contact', title: 'Contact', items: items.slice(0, 4) },
            { id: 'profile', title: 'Profile', items: items.slice(4, 6) },
            {
              id: 'system',
              title: 'System',
              items: items.slice(6),
              defaultOpen: false,
            },
          ]}
        />
      </div>
    );
  },
};

export const ReadOnly: Story = {
  args: { items: contactItems },
  render: (args) => (
    <div className="w-80">
      <PropertyList {...args} />
    </div>
  ),
};
