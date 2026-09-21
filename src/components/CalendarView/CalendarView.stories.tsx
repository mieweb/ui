import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { CalendarView } from './CalendarView';
import {
  TODAY,
  workItemAccessors,
  workItems,
  type WorkItem,
} from '../ListView/storyData';

const meta: Meta<typeof CalendarView<WorkItem>> = {
  id: 'views-calendarview',
  title: 'Modules/Views/CalendarView',
  component: CalendarView,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:alpha'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **month layout** of a collection: a six-week grid with each record placed on the day it starts, repeated across every day it covers when \`getEnd\` gives it a range. It reads records through the same \`ViewAccessors<T>\` as the rest of the family, so the list, the board and the calendar share one adapter.

Headless: it never fetches. Days are computed with Luxon in an explicit \`timeZone\`, and \`now\` pins "today" so stories and snapshots do not drift.

### Use it when

- Records **land on calendar days** — due dates, shipment windows, surveillance campaigns — and the question is "what falls in March".
- Items span several days and the overlap between them matters more than the time of day.

### Don't use it when

- The records are timed appointments in day or week slots — [ScheduleCalendar](?path=/docs/date-time-schedulecalendar--docs) draws an hour axis and books into it; this one has no hours at all.
- The user is picking a date rather than reading a collection — that is a date input, not a view.
- The range matters more than the calendar — [ListView](?path=/docs/views-listview--docs) grouped by status, or a Gantt once that ships.

### Example

\`\`\`tsx
<CalendarView
  items={items}
  accessors={accessors}
  timeZone="America/New_York"
  onOpen={(id) => navigate(\`/work/\${id}\`)}
  getHref={(id) => \`/work/\${id}\`}
  onMonthChange={(month) => setRange(monthRange(month))}
/>;
\`\`\`

\`onMonthChange\` is where a host refetches: the calendar tells you which month the user asked for and renders whatever \`items\` come back.

### Limitations

- Accessibility: the grid is \`role="grid"\` named by the visible month, weekday headers are \`role="columnheader"\`, and each day is a \`role="gridcell"\` containing a \`<time dateTime>\`. **There is no roving focus between cells yet** — entries are reached by Tab, so a dense month is a long tab sequence. A multi-day entry repeats on each day it covers and carries the full range in its accessible name, because the repetition is otherwise indistinguishable from several separate records. Today is announced by a visually hidden label, not by colour alone. The month heading is a polite live region, so paging announces where you landed.
- The grid is always six weeks, so paging does not change its height.
- A day shows \`maxPerDay\` entries (3 by default) and then "{count} more"; the overflow is a count, not a popover.
- Items with no \`getStart\` are skipped — a calendar cannot place an undated record. A range that ends before it starts is clamped to a single day rather than disappearing.
- Time zone is a business fact: pass \`timeZone\` whenever the collection belongs somewhere other than the viewer, or the day boundary is the runtime's and an item at 23:30 lands on the wrong square. Month, weekday and day-number formatting follow \`locale\`.
- Motion: the calendar does not use the [motion](?path=/docs/foundations-motion--docs) layer. Paging swaps the grid's contents rather than transitioning between open and closed states.
- Theming: entry tint resolves from \`getAccent\`'s token name, today's marker from \`bg-primary-500\`. Default strings are English and overridable through \`labels\`, including the "{count} more" template.
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
          why: 'The switcher chooses this layout among the others.',
        },
        {
          type: 'alternative to',
          target: 'date-time-schedulecalendar',
          why: 'ScheduleCalendar books timed appointments into an hour axis; CalendarView places dated records, including ones spanning days, on a month grid.',
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
        '`ViewAccessors<T>`. `getStart` places the entry; `getEnd` spans it; `getAccent` tints it.',
      table: { category: 'Data' },
      control: false,
    },
    month: {
      description: 'Controlled month. Any date inside it works.',
      table: { category: 'Data' },
      control: false,
    },
    defaultMonth: {
      description: 'Starting month when uncontrolled.',
      table: { category: 'Data' },
      control: false,
    },
    timeZone: {
      description:
        'IANA zone the day boundaries are drawn in. Defaults to the runtime\u2019s.',
      table: { category: 'Data' },
    },
    weekStartsOn: {
      description: '1 = Monday … 7 = Sunday.',
      control: { type: 'number', min: 1, max: 7 },
      table: { category: 'Data' },
    },
    locale: {
      description: 'Locale for month, weekday and day-number formatting.',
      table: { category: 'Data' },
    },
    maxPerDay: {
      description: 'Entries per day before collapsing into an overflow count.',
      control: { type: 'number', min: 1, max: 8 },
      table: { category: 'Data' },
    },
    now: {
      description: 'Pins "today". Set it in tests and visual snapshots.',
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
      description: 'Marks an entry as current.',
      table: { category: 'Data' },
    },
    hideToolbar: {
      description: 'Hide the month toolbar when the host renders its own.',
      table: { category: 'Data' },
    },
    onMonthChange: {
      description: 'Called with the first day of the month the user moved to.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onOpen: {
      description: 'Called when an entry is activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description: 'Returns a URL per entry so it renders as a real anchor.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItem: {
      description: 'Replaces the built-in entry body.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the grid when nothing in the collection is dated.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description: 'Overrides the English strings.',
      table: { category: 'Slots' },
    },
    classNames: {
      description:
        'Class overrides for `toolbar`, `weekday`, `day`, `outsideDay`, `today`, `entry`, `selectedEntry` and `state`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof CalendarView<WorkItem>>;

const base = {
  items: workItems,
  accessors: workItemAccessors,
  now: TODAY,
  timeZone: 'UTC',
} satisfies Partial<React.ComponentProps<typeof CalendarView<WorkItem>>>;

const spanning: WorkItem[] = [
  ...workItems,
  {
    ...workItems[0],
    id: 'WGL-201',
    title: 'Respirator fit-test week',
    startDate: '2026-03-09T00:00:00Z',
    dueDate: '2026-03-13T00:00:00Z',
    priority: 'high',
  },
  {
    ...workItems[0],
    id: 'WGL-202',
    title: 'Annual surveillance window',
    startDate: '2026-03-02T00:00:00Z',
    dueDate: '2026-03-27T00:00:00Z',
    priority: 'low',
  },
];

export const Default: Story = { args: { ...base } };

export const MultiDaySpans: Story = {
  name: 'Multi-day spans',
  args: { ...base, items: spanning },
};

function SelectableCalendar(
  args: React.ComponentProps<typeof CalendarView<WorkItem>>
) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  return (
    <CalendarView
      {...args}
      selectedId={selectedId}
      getHref={(id) => `#/work/${id}`}
      onOpen={(id) => setSelectedId(id)}
    />
  );
}

export const Interactive: Story = {
  render: (args) => <SelectableCalendar {...args} />,
  args: { ...base, items: spanning },
};

export const Overflow: Story = {
  args: {
    ...base,
    maxPerDay: 2,
    items: Array.from({ length: 6 }, (_, i) => ({
      ...workItems[0],
      id: `WGL-3${i}`,
      title: `Clearance batch ${i + 1}`,
      startDate: '2026-03-11T00:00:00Z',
      dueDate: '2026-03-11T00:00:00Z',
    })),
  },
};

export const WeekStartsSunday: Story = {
  name: 'Week starts Sunday',
  args: { ...base, weekStartsOn: 7 },
};

export const Localized: Story = {
  args: { ...base, locale: 'es', weekStartsOn: 1 },
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
  args: { ...base, items: spanning },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <CalendarView {...args} />
    </div>
  ),
  args: { ...base, items: spanning, locale: 'ar' },
};
