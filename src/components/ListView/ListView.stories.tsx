import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { ListView } from './ListView';
import {
  workItemAccessors,
  workItems,
  workItemStages,
  type WorkItem,
} from './storyData';

const meta: Meta<typeof ListView<WorkItem>> = {
  id: 'views-listview',
  title: 'Modules/Views/ListView',
  component: ListView,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:alpha'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **list layout** of a collection: a scannable column of rows, optionally grouped by status or by group, with the three load states built in. It reads every record through \`accessors\` (\`ViewAccessors<T>\`), so the same adapter drives this and every other view in the family — nothing here knows what a work item, an order or a referral is.

Headless: it never fetches. \`items\`, \`loading\` and \`error\` come in as props; opening a row leaves through \`onOpen(id, item)\` and/or \`getHref(id, item)\`.

### Use it when

- The collection should read top-to-bottom, and grouping by stage is useful but movement between stages is not the point.
- You want a list and a board over the same data — pass the same \`stages\` and \`accessors\` to both.

### Don't use it when

- Rows need sorting, filtering, paging, column choice or export — that is a data grid, and grids start with \`DataVisNitroGrid\` (see [Grids](?path=/docs/components-grids-overview--docs)).
- Items move between stages by dragging — \`BoardView\`.
- The collection is orders in BlueHive and the tab model already fits — [OrderList](?path=/docs/orders-orderlist--docs) predates this family and fixes its own tabs and row renderer.

### Example

\`\`\`tsx
const accessors: ViewAccessors<WorkItem> = {
  getId: (w) => w.id,
  getTitle: (w) => w.title,
  getSubtitle: (w) => \`\${w.id} · \${w.owner}\`,
  getStatus: (w) => w.status,
  getAccent: (w) => PRIORITY_ACCENT[w.priority],
};

<ListView
  items={items}
  accessors={accessors}
  stages={WORK_ITEM_STAGES}
  loading={isLoading}
  error={error}
  onRetry={refetch}
  selectedId={openId}
  getHref={(id) => \`/work/\${id}\`}
  onOpen={(id) => navigate(\`/work/\${id}\`)}
/>;
\`\`\`

The page owns \`items\`, \`selectedId\` and the fetch; the view owns how they look.

### Limitations

- Accessibility: rows are a \`<ul>\` of \`<li>\`, each labelled by its group header through \`aria-labelledby\`. A row is an \`<a>\` when \`getHref\` is given (preserving middle-click and modifier-click, with \`onOpen\` intercepting plain clicks), a \`<button>\` when only \`onOpen\` is, and a plain \`<div>\` when neither — so a non-interactive list has no phantom tab stops. The selected row carries \`aria-current\`. Group headers are collapse buttons with \`aria-expanded\`; the error state is \`role="alert"\` and the loading state \`role="status"\`.
- Group collapse is uncontrolled (\`defaultCollapsedGroups\` seeds it). There is no controlled \`collapsedGroups\` prop yet.
- Every row renders; there is no virtualization in this release, so very long lists should be paged by the caller.
- An empty stage still renders its header with a zero count — a stage that vanishes when it empties hides that the stage exists.
- Responsive: rows wrap rather than scrolling horizontally; long titles truncate. Condensed density is covered through the \`list-view-*\` slots.
- Theming: \`bg-card\` / \`border-border\` with accent tints resolved from \`getAccent\`'s token name. Default strings ("Loading", "Nothing to show", "Could not load this view", "Try again") are English and overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'composes with',
          target: 'views-viewswitcher',
          why: 'The switcher chooses this layout among the others.',
        },
        {
          type: 'alternative to',
          target: 'views-boardview',
          why: 'The board exists for moving items between stages; the list is the denser read when they do not move.',
        },
        {
          type: 'alternative to',
          target: 'grids-datavis-nitro',
          why: 'Reach for the grid when rows need sorting, filtering, paging or export; ListView is a read-down layout.',
        },
      ],
    },
  },
  argTypes: {
    items: {
      description: 'The collection to render. The caller owns fetching it.',
      table: { category: 'Data' },
    },
    accessors: {
      description:
        '`ViewAccessors<T>` — how to read an id, title, subtitle, status, group and accent from one item.',
      table: { category: 'Data' },
      control: false,
    },
    stages: {
      description:
        'Ordered stages for grouping and labels. Empty stages still render.',
      table: { category: 'Data' },
    },
    groupBy: {
      description:
        'Group by `getStatus`, by `getGroup`, or not at all. Defaults to `status` when `stages` are given.',
      control: 'radio',
      options: ['status', 'group', 'none'],
      table: { category: 'Data' },
    },
    loading: {
      description: 'Show the loading state.',
      table: { category: 'Data' },
    },
    error: {
      description: 'Show the error state.',
      table: { category: 'Data' },
      control: false,
    },
    selectedId: {
      description: 'Marks a row as current.',
      table: { category: 'Data' },
    },
    density: {
      description: 'Row padding.',
      control: 'radio',
      options: ['comfortable', 'compact'],
      table: { category: 'Data' },
    },
    onOpen: {
      description: 'Called when a row is activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onRetry: {
      description:
        'Retries a failed load. The retry action renders only when this is given.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description:
        'Returns a URL per row so it renders as a real anchor. Pass alongside `onOpen`.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItem: {
      description: 'Replaces the built-in row body.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the built-in empty state.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description: 'Overrides the English state strings.',
      table: { category: 'Slots' },
    },
    classNames: {
      description:
        'Class overrides for `group`, `groupHeader`, `item`, `selectedItem` and `state`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof ListView<WorkItem>>;

const base = {
  items: workItems,
  accessors: workItemAccessors,
} satisfies Partial<React.ComponentProps<typeof ListView<WorkItem>>>;

export const Default: Story = {
  args: { ...base },
};

export const GroupedByStage: Story = {
  name: 'Grouped by stage',
  args: { ...base, stages: workItemStages },
};

export const GroupedByTeam: Story = {
  name: 'Grouped by team',
  args: { ...base, groupBy: 'group' },
};

function SelectableList(args: React.ComponentProps<typeof ListView<WorkItem>>) {
  const [selectedId, setSelectedId] = React.useState<string | null>('WGL-102');
  return (
    <ListView
      {...args}
      selectedId={selectedId}
      getHref={(id) => `#/work/${id}`}
      onOpen={(id) => setSelectedId(id)}
    />
  );
}

export const Interactive: Story = {
  render: (args) => <SelectableList {...args} />,
  args: { ...base, stages: workItemStages },
};

export const Compact: Story = {
  args: { ...base, stages: workItemStages, density: 'compact' },
};

export const CustomRow: Story = {
  name: 'Custom row',
  args: {
    ...base,
    renderItem: (item) => (
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className="text-foreground truncate font-medium">
          {item.title}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs tracking-wide uppercase">
          {item.team}
        </span>
      </div>
    ),
  },
};

export const Empty: Story = {
  args: { ...base, items: [] },
};

export const Loading: Story = {
  args: { ...base, items: [], loading: true },
};

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
  args: { ...base, stages: workItemStages },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <ListView {...args} />
    </div>
  ),
  args: { ...base, stages: workItemStages },
};
