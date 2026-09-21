import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { GanttView } from './GanttView';
import {
  TODAY,
  workItemAccessors,
  workItems,
  type WorkItem,
} from '../ListView/storyData';

const meta: Meta<typeof GanttView<WorkItem>> = {
  id: 'views-ganttview',
  title: 'Modules/Views/GanttView',
  component: GanttView,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:alpha'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **time-axis layout** of a collection: one row per record, a bar spanning from \`getStart\` to \`getEnd\`, columns at the \`cadence\` you ask for. It reads records through the same \`ViewAccessors<T>\` as the rest of the family, so the list, board, calendar and Gantt share one adapter.

**A roadmap is this component at \`cadence="month"\` or \`"quarter"\`.** The family deliberately has no separate \`RoadmapView\`: it would be this with wider columns, and shipping two near-identical timeline components is the duplication this family exists to remove. Label the switcher option "Roadmap" (the \`roadmap\` view id does exactly that) and render a coarse Gantt.

Headless: it never fetches, and this release never writes — there is no drag-to-reschedule yet.

### Use it when

- Records have a **start and an end** and the overlap between them across a date range is the point.
- You want a quarter-level roadmap: same component, \`cadence="quarter"\`, \`groupByLane\` for swimlanes.

### Don't use it when

- Records land on days rather than spanning them, and the month shape matters — [CalendarView](?path=/docs/views-calendarview--docs).
- You are showing one record's progress through named steps — [Timeline](?path=/docs/data-display-timeline--docs) is a step/event component, not a time axis.
- Items move between stages rather than along time — [BoardView](?path=/docs/views-boardview--docs).

### Example

\`\`\`tsx
<GanttView
  items={items}
  accessors={accessors}
  cadence="week"
  groupByLane
  timeZone="America/New_York"
  onOpen={(id) => navigate(\`/work/\${id}\`)}
/>;

// The same records as a roadmap:
<GanttView items={items} accessors={accessors} cadence="quarter" groupByLane />;
\`\`\`

### Limitations

- Accessibility: bars are a \`<ul>\` per lane, each bar an \`<a>\` when \`getHref\` is given, a \`<button>\` when only \`onOpen\` is, and inert markup when neither — so a read-only chart has no phantom tab stops. The selected bar carries \`aria-current\`. **The bar's position is not conveyed to a screen reader**: a bar reads as its title, and the range is not yet in its accessible name the way it is in \`CalendarView\`. Treat the chart as a visual summary with an accessible list underneath it, not as the only route to the dates.
- Read-only: no drag to move or resize. \`onOpen\` is the only interaction, so there is no pending or failure state to render.
- The column count is capped at 200. A decade at \`cadence="day"\` is 3,650 columns, which hangs a page rather than drawing a chart; pass \`rangeStart\` / \`rangeEnd\`, or a coarser cadence, when the span is long.
- Undated records cannot be placed, so they are counted in a footnote rather than dropped silently.
- A range that ends before it starts is clamped to a single column.
- Time zone is a business fact — pass \`timeZone\` when the collection belongs somewhere other than the viewer. Column labels follow \`locale\`.
- Responsive: the chart scrolls horizontally with a minimum column width; it does not reflow to a list on small screens.
- Motion: the Gantt does not use the [motion](?path=/docs/foundations-motion--docs) layer.
- Dependencies: \`luxon\` (a regular dependency of \`@mieweb/ui\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'composes with',
          target: 'views-viewswitcher',
          why: 'The switcher chooses this layout among the others, including as the "Roadmap" option at a coarse cadence.',
        },
        {
          type: 'alternative to',
          target: 'views-calendarview',
          why: 'The calendar answers "what falls in March"; the Gantt answers "what overlaps what, and for how long".',
        },
        {
          type: 'alternative to',
          target: 'data-display-timeline',
          why: 'Timeline walks one record through named steps or events; GanttView places many records on a shared time axis.',
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
        '`ViewAccessors<T>`. `getStart` and `getEnd` size the bar; `getGroup` forms swimlanes; `getAccent` tints it.',
      table: { category: 'Data' },
      control: false,
    },
    cadence: {
      description:
        'Column width in time. `month` and `quarter` are what a roadmap is.',
      control: 'radio',
      options: ['day', 'week', 'month', 'quarter'],
      table: { category: 'Data' },
    },
    rangeStart: {
      description: 'First column. Defaults to the earliest start in `items`.',
      table: { category: 'Data' },
      control: false,
    },
    rangeEnd: {
      description: 'Last column. Defaults to the latest end in `items`.',
      table: { category: 'Data' },
      control: false,
    },
    groupByLane: {
      description: 'Group rows into swimlanes by `getGroup`.',
      table: { category: 'Data' },
    },
    timeZone: {
      description: 'IANA zone the day boundaries are read in.',
      table: { category: 'Data' },
    },
    locale: {
      description: 'Locale for column labels.',
      table: { category: 'Data' },
    },
    now: {
      description: 'Pins the today marker. Set it in tests and snapshots.',
      table: { category: 'Data' },
      control: false,
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
      description: 'Marks a bar as current.',
      table: { category: 'Data' },
    },
    onOpen: {
      description: 'Called when a bar is activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description: 'Returns a URL per bar so it renders as a real anchor.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItem: {
      description: 'Replaces the built-in bar body.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description:
        'Replaces the chart when nothing in the collection is dated.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description: 'Overrides the English strings.',
      table: { category: 'Slots' },
    },
    classNames: {
      description:
        'Class overrides for `header`, `groupLabel`, `row`, `bar`, `selectedBar` and `state`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof GanttView<WorkItem>>;

const base = {
  items: workItems,
  accessors: workItemAccessors,
  now: TODAY,
  timeZone: 'UTC',
} satisfies Partial<React.ComponentProps<typeof GanttView<WorkItem>>>;

const programme: WorkItem[] = [
  {
    ...workItems[0],
    id: 'P-1',
    title: 'Discovery',
    team: 'Implementation',
    startDate: '2026-01-06T00:00:00Z',
    dueDate: '2026-02-13T00:00:00Z',
    priority: 'medium',
  },
  {
    ...workItems[0],
    id: 'P-2',
    title: 'Clinic network build-out',
    team: 'Operations',
    startDate: '2026-02-02T00:00:00Z',
    dueDate: '2026-04-24T00:00:00Z',
    priority: 'high',
  },
  {
    ...workItems[0],
    id: 'P-3',
    title: 'Surveillance programme launch',
    team: 'Implementation',
    startDate: '2026-03-02T00:00:00Z',
    dueDate: '2026-06-30T00:00:00Z',
    priority: 'urgent',
  },
  {
    ...workItems[0],
    id: 'P-4',
    title: 'Reporting handover',
    team: 'Reporting',
    startDate: '2026-05-04T00:00:00Z',
    dueDate: '2026-07-31T00:00:00Z',
    priority: 'low',
  },
];

export const Default: Story = { args: { ...base } };

export const Swimlanes: Story = {
  args: { ...base, items: programme, groupByLane: true, cadence: 'month' },
};

export const AsARoadmap: Story = {
  name: 'As a roadmap (quarter cadence)',
  args: { ...base, items: programme, groupByLane: true, cadence: 'quarter' },
};

export const DailyCadence: Story = {
  name: 'Daily cadence',
  args: {
    ...base,
    cadence: 'day',
    rangeStart: new Date('2026-03-09T00:00:00Z'),
    rangeEnd: new Date('2026-03-27T00:00:00Z'),
  },
};

export const Interactive: Story = {
  args: {
    ...base,
    items: programme,
    groupByLane: true,
    cadence: 'month',
    selectedId: 'P-2',
    getHref: (id) => `#/work/${id}`,
  },
};

export const Localized: Story = {
  args: { ...base, items: programme, cadence: 'month', locale: 'es' },
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
  args: { ...base, items: programme, cadence: 'month' },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <GanttView {...args} />
    </div>
  ),
  args: { ...base, items: programme, cadence: 'month' },
};
