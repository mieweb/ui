import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { ViewSet } from './ViewSet';
import { Card } from '../Card';
import { Input } from '../Input';
import {
  TODAY,
  workItemAccessors,
  workItems,
  workItemStages,
  type WorkItem,
} from '../ListView/storyData';

const meta: Meta<typeof ViewSet<WorkItem>> = {
  id: 'views-viewset',
  title: 'Modules/Views/ViewSet',
  component: ViewSet,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:alpha'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **page-level composition**: a [ViewSwitcher](?path=/docs/views-viewswitcher--docs), whichever of the family's views you enable, and the slots a page needs around them — \`toolbar\`, \`filters\`, \`detail\`, plus \`overview\` and \`table\` for the two "views" the library deliberately does not own.

It replaces the \`{view === 'x' && …}\` ladder that every such page grows. One \`items\` array, one \`accessors\` object, one set of load states, and the layouts stay consistent with each other.

**It owns exactly one thing: which view is showing.** Items, selection, filter state and every mutation stay with the caller.

### Use it when

- A page shows one collection several ways and you want the switcher, the shared states and the slots wired for you.
- You want consistency across pages — the same switcher, the same empty and error states, the same keyboard behaviour in every board.

### Don't use it when

- The page renders exactly one layout forever — import that view directly and skip the shell.
- The "views" are unrelated screens rather than layouts of one collection — [Tabs](?path=/docs/navigation-tabs--docs).

### Example

\`\`\`tsx
<ViewSet
  items={workItems}
  accessors={accessors}
  views={['overview', 'list', 'board', 'calendar', 'gantt', 'table']}
  stages={WORK_ITEM_STAGES}
  storageKey="work-items-view"
  onMove={(id, toStage) => updateStatus({ id, status: toStage })}
  onOpen={(id) => navigate(\`/work/\${id}\`)}
  getHref={(id) => \`/work/\${id}\`}
  toolbar={<Button onClick={create}>New work item</Button>}
  filters={<WorkItemFilters value={filters} onChange={setFilters} />}
  overview={<WorkItemsDashboard items={workItems} />}
  table={<DataVisNitroGrid source={source} />}
/>;
\`\`\`

### Limitations

- Accessibility: the shell adds a toolbar row and an optional \`<aside>\` for \`detail\`; the a11y of each layout is the view's own, documented on its page.
- **\`overview\` and \`table\` are only offered when their slot is given.** Listing them without content would put a dead option in the switcher that renders a blank page, so they are filtered out — and an active view that stops being offered falls back to the first one that is.
- \`storageKey\` is ignored while \`view\` is controlled: a page with URL state should own the value there rather than have two sources disagree.
- The stored view is read in an effect after mount, so a server render and the first client render agree. A page that must paint the remembered view immediately should control \`view\` from its own router state.
- Every view receives the same \`items\`, \`loading\`, \`error\`, \`selectedId\`, \`onOpen\`, \`getHref\` and \`renderItem\`. Anything a single layout needs beyond that goes through \`listProps\` / \`boardProps\` / \`calendarProps\` / \`ganttProps\`.
- \`renderItem\` receives the active view, so one function can return a dense row in the list and a card on the board.
- The \`roadmap\` id renders \`GanttView\` at quarter cadence with swimlanes — see the family [Overview](?path=/docs/modules-views-overview--docs).
- Motion: the shell does not use the [motion](?path=/docs/foundations-motion--docs) layer; swapping views replaces the subtree.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'contains',
          target: 'views-viewswitcher',
          why: 'Renders the switcher itself; do not add a second one.',
        },
        {
          type: 'contains',
          target: 'views-listview',
          why: 'Renders the list layout.',
        },
        {
          type: 'contains',
          target: 'views-boardview',
          why: 'Renders the board layout and passes it `onMove`.',
        },
        {
          type: 'contains',
          target: 'views-calendarview',
          why: 'Renders the calendar layout.',
        },
        {
          type: 'contains',
          target: 'views-ganttview',
          why: 'Renders the Gantt layout, and the roadmap id as a coarse Gantt.',
        },
        {
          type: 'composes with',
          target: 'dashboards-customizabledashboard',
          why: 'The overview slot is domain content; a dashboard of widgets is the usual filling.',
        },
      ],
    },
  },
  argTypes: {
    items: {
      description: 'The collection every view renders.',
      table: { category: 'Data' },
    },
    accessors: {
      description: '`ViewAccessors<T>` — read once, understood by every view.',
      table: { category: 'Data' },
      control: false,
    },
    views: {
      description: 'Views to offer, in order. The first is the default.',
      table: { category: 'Data' },
    },
    view: {
      description: 'Controlled active view.',
      table: { category: 'Data' },
      control: false,
    },
    defaultView: {
      description: 'Starting view when uncontrolled.',
      table: { category: 'Data' },
      control: false,
    },
    storageKey: {
      description:
        'Remembers the chosen view. Ignored while `view` is controlled.',
      table: { category: 'Data' },
    },
    stages: {
      description: 'Stages for the board columns and for list grouping.',
      table: { category: 'Data' },
    },
    loading: {
      description: 'Shared loading state.',
      table: { category: 'Data' },
    },
    error: {
      description: 'Shared error state.',
      table: { category: 'Data' },
      control: false,
    },
    timeZone: {
      description:
        'IANA zone the calendar and Gantt read day boundaries in — shared so both place an item on the same days.',
      table: { category: 'Data' },
    },
    locale: {
      description: 'Locale for date formatting in the calendar and Gantt.',
      table: { category: 'Data' },
    },
    onViewChange: {
      description: 'Called with the view the user asked for.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onMove: {
      description: 'Passed to the board. Omit to make it read-only.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onOpen: {
      description: 'Passed to every view.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description:
        'Passed to every view so items render as real links. Pass alongside `onOpen`.',
      table: { category: 'Callbacks' },
      control: false,
    },
    toolbar: {
      description: 'Rendered before the switcher.',
      table: { category: 'Slots' },
      control: false,
    },
    filters: {
      description: 'Rendered under the switcher row.',
      table: { category: 'Slots' },
      control: false,
    },
    overview: {
      description:
        'The overview view. Offered only when given — it is domain content.',
      table: { category: 'Slots' },
      control: false,
    },
    table: {
      description:
        'The table view. Offered only when given — a tabular collection is a grid.',
      table: { category: 'Slots' },
      control: false,
    },
    detail: {
      description: 'Rendered beside the view, for a list-plus-detail layout.',
      table: { category: 'Slots' },
      control: false,
    },
    renderItem: {
      description:
        'Replaces the built-in item body in every view. Receives the active view, so one function can serve several.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the built-in empty state in every view.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description:
        'Overrides the English strings — every string any offered view can render.',
      table: { category: 'Slots' },
    },
    listProps: {
      description: 'List-only overrides the shell does not surface.',
      table: { category: 'Slots' },
      control: false,
    },
    boardProps: {
      description: 'Board-only overrides the shell does not surface.',
      table: { category: 'Slots' },
      control: false,
    },
    calendarProps: {
      description: 'Calendar-only overrides the shell does not surface.',
      table: { category: 'Slots' },
      control: false,
    },
    ganttProps: {
      description: 'Gantt-only overrides the shell does not surface.',
      table: { category: 'Slots' },
      control: false,
    },
    classNames: {
      description:
        'Class overrides for `toolbar`, `switcher`, `body` and `detail`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof ViewSet<WorkItem>>;

const base = {
  items: workItems,
  accessors: workItemAccessors,
  stages: workItemStages,
  now: TODAY,
  timeZone: 'UTC',
  views: ['list', 'board', 'calendar', 'gantt'] as const,
} satisfies Partial<React.ComponentProps<typeof ViewSet<WorkItem>>>;

function Overview({ items }: { items: WorkItem[] }) {
  const open = items.filter((w) => w.status !== 'done').length;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ['Open', open],
        ['Done', items.length - open],
        ['Total', items.length],
      ].map(([label, value]) => (
        <Card key={String(label)} className="p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </Card>
      ))}
    </div>
  );
}

function WorkItemsPage(args: React.ComponentProps<typeof ViewSet<WorkItem>>) {
  const [items, setItems] = React.useState(workItems);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const visible = items.filter((w) =>
    w.title.toLowerCase().includes(query.toLowerCase())
  );
  const selected = items.find((w) => w.id === selectedId);
  return (
    <ViewSet
      {...args}
      items={visible}
      selectedId={selectedId}
      onOpen={(id) => setSelectedId(id)}
      onMove={(id, toStage) =>
        setItems((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: toStage } : w))
        )
      }
      overview={<Overview items={visible} />}
      filters={
        <Input
          value={query}
          placeholder="Filter by title"
          onChange={(event) => setQuery(event.target.value)}
        />
      }
      detail={
        selected ? (
          <Card className="p-4">
            <p className="text-sm font-medium">{selected.title}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {selected.id} · {selected.owner} · {selected.team}
            </p>
          </Card>
        ) : undefined
      }
    />
  );
}

export const Default: Story = {
  render: (args) => <WorkItemsPage {...args} />,
  args: {
    ...base,
    views: ['overview', 'list', 'board', 'calendar', 'gantt'],
    storageKey: 'sb-viewset-default',
  },
};

export const ListAndBoardOnly: Story = {
  name: 'List and board only',
  args: { ...base, views: ['list', 'board'] },
};

export const WithDetailPane: Story = {
  name: 'With a detail pane',
  render: (args) => <WorkItemsPage {...args} />,
  args: { ...base, views: ['list', 'board'] },
};

export const Empty: Story = {
  args: { ...base, items: [] },
};

export const Loading: Story = {
  args: { ...base, items: [], loading: true },
};

export const Error: Story = {
  args: { ...base, items: [], error: new globalThis.Error('Request failed') },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => <WorkItemsPage {...args} />,
  args: { ...base, views: ['list', 'board'] },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <WorkItemsPage {...args} />
    </div>
  ),
  args: { ...base, views: ['list', 'board'] },
};
