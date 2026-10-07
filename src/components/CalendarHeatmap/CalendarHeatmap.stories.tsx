import type { Meta, StoryObj } from '@storybook/react';
import { DateTime } from 'luxon';
import { fn } from 'storybook/test';
import { CalendarHeatmap } from './CalendarHeatmap';

// Deterministic pseudo-random activity for the last 26 weeks.
const today = DateTime.now().startOf('day');
const activity = Array.from({ length: 26 * 7 }, (_, i) => ({
  date: today.minus({ days: i }).toISODate()!,
  value: (i * 37) % 11 < 5 ? 0 : ((i * 13) % 7) + 1,
}));

const meta: Meta<typeof CalendarHeatmap> = {
  id: 'data-display-calendarheatmap',
  title: 'Components/Data display/CalendarHeatmap',
  component: CalendarHeatmap,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    catalog: { entry: '@mieweb/ui' },
    docs: {
      description: {
        component: `
### What it's for

A contribution-style calendar: one column per week, one row per weekday, each day
tinted on a five-step \`primary\` scale relative to the busiest day in range. Use it
to show engagement, activity or volume patterns over the last few weeks or months.

### Use it when

- Rhythm matters more than exact counts — streaks, quiet weeks, weekday habits.
- A contact, account or clinic profile needs an at-a-glance activity history.

### Don't use it when

- People need to read exact values or compare series — use a bar/line chart.
- You're scheduling events on dates — use \`CalendarView\` or \`ScheduleCalendar\`.

### Example

\`\`\`tsx
<CalendarHeatmap
  data={events.map((e) => ({ date: e.at, value: 1 }))}
  start="2026-04-01"
  end="2026-09-30"
  weekStartsOn={1}
  onDayClick={(date) => setFilter({ day: date })}
/>
\`\`\`

### Limitations

- Renders a \`<table>\` named by \`labels.title\` with a visually hidden \`<caption>\` summary; every day has an accessible name and tooltip from \`labels.cellLabel\`. Months and weekdays are column/row headers (alternate weekdays are visually hidden).
- With \`onDayClick\` the table becomes \`role="grid"\` with one tab stop: Arrow Up/Down move by day, Left/Right by week (flipped in RTL).
- Same-day values are summed; dates outside \`start\`–\`end\` are ignored. ISO date-times are bucketed in the runtime time zone.
- Default range is the 12 weeks ending today. Month and weekday names follow \`locale\` (Luxon); other strings default to English via \`labels\`.
- Scrolls horizontally inside its container on narrow screens.
`,
      },
    },
  },
  argTypes: {
    data: {
      description: '`{ date, value }` per day; same-day values are summed.',
    },
    start: {
      description: 'First day shown (ISO). Defaults to 12 weeks before `end`.',
      control: 'text',
    },
    end: {
      description: 'Last day shown (ISO). Defaults to today.',
      control: 'text',
    },
    weekStartsOn: {
      description: 'First weekday of each column: 0 = Sunday … 6 = Saturday.',
      control: { type: 'number', min: 0, max: 6 },
    },
    locale: {
      description: 'BCP 47 locale for month, weekday and date names.',
      control: 'text',
    },
    onDayClick: {
      description:
        'Makes days keyboard-navigable buttons reporting their ISO date.',
    },
    labels: {
      description:
        'Overrides for the table name, cell label, summary and legend.',
    },
  },
  args: { data: activity },
};

export default meta;
type Story = StoryObj<typeof CalendarHeatmap>;

export const Default: Story = {};

export const Interactive: Story = {
  args: { onDayClick: fn() },
};

export const HalfYearMondayStart: Story = {
  args: {
    start: today.minus({ weeks: 26 }).toISODate()!,
    weekStartsOn: 1,
  },
};

export const Localized: Story = {
  args: { locale: 'de-DE', weekStartsOn: 1 },
};

export const Empty: Story = {
  args: { data: [] },
};
