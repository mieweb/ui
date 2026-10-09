import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { AvatarGroup } from './AvatarGroup';

const team = [
  { id: '1', name: 'Ann Lee', presence: 'editing' as const },
  {
    id: '2',
    name: 'Bo Diaz',
    src: 'https://i.pravatar.cc/80?img=12',
    presence: 'viewing' as const,
  },
  { id: '3', name: 'Cy Park', presence: 'viewing' as const },
  { id: '4', name: 'Di Moss' },
  { id: '5', name: 'Eve Ng' },
  { id: '6', name: 'Fay Ruiz' },
];

const meta: Meta<typeof AvatarGroup> = {
  id: 'record-details-avatargroup',
  title: 'Components/Record details/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Each person is an Avatar; AvatarGroup adds overlap, presence and the overflow chip.',
        },
      ],
    },
    docs: {
      description: {
        component: `
### What it's for

Shows who is on a record as an overlapping stack of avatars. Each person can carry
a **presence** state — \`viewing\` (primary ring, eye badge) or \`editing\` (warning
ring, pencil badge) — and people past \`max\` collapse into a "+N" chip whose
tooltip and accessible name list everyone it hides.

### Use it when

- A record header needs "who else is here right now" at a glance.
- A row or card lists a small set of owners, watchers or participants.

### Don't use it when

- Names must be readable without hovering — render a list of \`Avatar\` + name rows.
- You show one person — use \`Avatar\` directly.

### Example

\`\`\`tsx
<AvatarGroup
  max={4}
  size="sm"
  items={viewers.map((v) => ({ id: v.id, name: v.name, src: v.photo, presence: v.mode }))}
  onItemClick={(id) => openProfile(id)}
/>
\`\`\`

### Limitations

- Renders a \`<ul>\` named by \`labels.list\`; each avatar is \`role="img"\` (or a \`<button>\` with \`onItemClick\`) named "Ann is editing" via \`labels.presence\`. Editors are moved to the front so they never collapse into the chip.
- Overlap uses logical margins, so it stacks correctly in RTL; the presence badge sits at the inline-end corner.
- Ring and badge colours are \`primary\` / \`warning\` tokens; \`item.color\` (a CSS colour, e.g. a cursor tint) fills the initials disc and is the only non-token colour.
- Still accepts the original \`<Avatar>\` children API (\`max\`, \`size\`), so it can replace the \`AvatarGroup\` exported from \`Avatar\`.
- Strings default to English; override through \`labels\`.
`,
      },
    },
  },
  argTypes: {
    items: {
      description:
        'People to show: `{ id, name, src?, presence?, label?, color? }`.',
    },
    max: {
      description: 'Avatars shown before the rest collapse into "+N".',
      control: 'number',
    },
    size: {
      description: 'Size applied to every avatar.',
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    onItemClick: {
      description: 'Makes each avatar a button reporting its `id`.',
    },
    labels: {
      description:
        'Overrides for the list name, presence and overflow strings.',
    },
  },
  args: { items: team, max: 4, size: 'md' },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {};

export const Presence: Story = {
  args: { items: team.slice(0, 3), max: undefined },
};

export const Clickable: Story = {
  args: { onItemClick: fn() },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <AvatarGroup key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <AvatarGroup {...args} />
    </div>
  ),
};
