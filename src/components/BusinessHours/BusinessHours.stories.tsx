import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BusinessHours,
  CompactHours,
  HoursSummary,
  OpenStatusBadge,
  type BusinessHoursSchedule,
} from './BusinessHours';

// Sample data
const standardSchedule: BusinessHoursSchedule = {
  officeHours: [
    { day: 0, hours: [] },
    { day: 1, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 2, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 3, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 4, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 5, hours: [{ start: '08:00', end: '17:00' }] },
    { day: 6, hours: [] },
  ],
};

const splitShiftSchedule: BusinessHoursSchedule = {
  officeHours: [
    { day: 0, hours: [] },
    {
      day: 1,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 2,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 3,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 4,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    {
      day: 5,
      hours: [
        { start: '08:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    },
    { day: 6, hours: [] },
  ],
};

const textOnlySchedule: BusinessHoursSchedule = {
  officeHoursText: `Monday - Friday: 8:00 AM - 5:00 PM
Saturday: 9:00 AM - 1:00 PM
Sunday: Closed`,
};

const meta: Meta<typeof BusinessHours> = {
  id: 'date-time-businesshours',
  title: 'Inputs/Date & time/BusinessHours',
  component: BusinessHours,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Read-only display of weekly opening hours** with an Open/Closed badge. Feed it \`schedule: BusinessHoursSchedule\` — \`officeHours: DayHours[]\` (\`{ day: 0–6 | 'Mon', hours: TimeRange[] }\`, each \`{ start?, end?, description? }\` in 24-hour \`HH:MM\` or an ISO string; several ranges = split shifts; empty = closed), or \`officeHoursText\` for free text, plus an optional \`timezone\` label. Four components: \`BusinessHours\` (full week; \`variant\` \`'default'\` | \`'card'\` | \`'compact'\` | \`'inline'\`, \`size\`, \`showStatus\`, \`highlightToday\`, \`useShortDayNames\`, \`use24Hour\`, \`groupDays\` to collapse identical days into "Mon, Wed, Fri", \`showHeader\`, \`headerText\`), \`CompactHours\` (one line: today's hours + badge, for cards), \`HoursSummary\` (today's hours as an expandable button revealing the week) and \`OpenStatusBadge\` (\`isOpen\` pill). Types \`BusinessHoursSchedule\`, \`DayHours\`, \`TimeRange\` are exported and line up with \`BusinessHoursEditor\`'s \`DaySchedule[]\`.

### Use it when

- A provider, clinic or employer profile shows **when it is open** — full list on a detail page, \`CompactHours\` in a result card, \`HoursSummary\` in a sidebar.
- You want "Open Now / Closed" computed for you from the schedule.

### Don't use it when

- The user needs to **edit** the hours — \`BusinessHoursEditor\` (same data shape, emit \`DaySchedule[]\`).
- You are showing dated appointments rather than a recurring week — \`ScheduleCalendar\`.
- Open/closed must be correct for a location in **another time zone** than the viewer — the status is computed from the browser clock (see Limitations).

### Example

\`\`\`tsx
// schedule comes from the API; BusinessHoursEditor's DaySchedule[] fits officeHours directly
const schedule: BusinessHoursSchedule = {
  officeHours: provider.hours,      // [{ day: 1, hours: [{ start: '08:00', end: '17:00' }] }, …]
  timezone: 'America/Indiana/Indianapolis',
};

<BusinessHours schedule={schedule} variant="card" groupDays use24Hour={false} />

// in a list card
<CompactHours schedule={schedule} />
\`\`\`

### Limitations

- Accessibility: purely presentational — rows are \`<div>\`s (no list/table semantics), \`OpenStatusBadge\` is a \`<span>\` with no \`role="status"\` or live region, colour is backed by the words "Open Now" / "Closed". \`HoursSummary\`'s toggle is a \`<button aria-expanded>\` but has no \`aria-controls\`. No keyboard handling beyond the native button.
- Time zones: **\`isCurrentlyOpen\` and "today" use the viewer's \`new Date()\`**; \`schedule.timezone\` is only printed as "All times are in {timezone}" and never used for conversion. ISO-string times are parsed with \`new Date()\` and compared by local hour/minute. A range without \`end\` is treated as open until midnight; \`00:00–23:59\` or \`00:00–00:00\` displays as "24 Hours".
- i18n: all strings hard-coded English — day names, "Hours", "Open Now", "Closed", "Closed today", "Hours not available", "Hours vary", "Opens …", "Until …", "24 Hours", "(Today)"; times are formatted with \`toLocaleTimeString('en-US', …)\` (\`use24Hour\` switches to 24-hour but still \`en-US\`). Days render in the order given in \`officeHours\`; \`groupDays\` lists closed days last.
- \`variant="compact"\` and \`"inline"\` only change container classes (\`inline\` = \`inline-flex\`); they still render the full week — use \`CompactHours\` for a one-liner. \`officeHoursText\` is shown in a \`<pre>\` with the badge forced to Closed.
- RTL: hours column is \`text-right\` in per-day rows (\`text-end\` in grouped rows), "(Today)" uses \`ml-1\`. Theming: \`neutral-*\` borders/text, badge \`green-*\` / \`red-*\`, today row \`bg-primary-50 dark:bg-primary-900/20\` — mostly not brand-token driven. Depends on \`class-variance-authority\` and shares \`scheduleToRules\` with \`BusinessHoursEditor\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'date-time-businesshourseditor',
          why: 'BusinessHours displays the DaySchedule[] that BusinessHoursEditor edits; they share the same day/hours shape and scheduleToRules grouping.',
        },
        {
          type: 'alternative to',
          target: 'date-time-schedulecalendar',
          why: 'BusinessHours shows the recurring weekly opening hours; ScheduleCalendar shows dated appointments on an hourly timeline.',
        },
      ],
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'card', 'compact', 'inline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showStatus: { control: 'boolean' },
    highlightToday: { control: 'boolean' },
    use24Hour: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof BusinessHours>;

// Default full schedule display
export const Default: Story = {
  args: {
    schedule: standardSchedule,
    showStatus: true,
    highlightToday: true,
    showHeader: true,
  },
};

// Card variant (for sidebars)
export const CardVariant: Story = {
  args: {
    schedule: standardSchedule,
    variant: 'card',
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

// Split shifts (lunch break)
export const SplitShifts: Story = {
  args: {
    schedule: splitShiftSchedule,
  },
};

// Days sharing identical hours collapse into one row
export const GroupedDays: Story = {
  args: {
    schedule: {
      officeHours: [
        { day: 0, hours: [] },
        { day: 1, hours: [{ start: '08:00', end: '11:00' }] },
        { day: 2, hours: [{ start: '15:00', end: '17:00' }] },
        { day: 3, hours: [{ start: '08:00', end: '11:00' }] },
        { day: 4, hours: [{ start: '15:00', end: '17:00' }] },
        { day: 5, hours: [{ start: '08:00', end: '11:00' }] },
        { day: 6, hours: [{ start: '10:00', end: '16:00' }] },
      ],
    },
    groupDays: true,
    useShortDayNames: true,
    showStatus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `groupDays`, days sharing identical hours collapse into one row — e.g. "Mon, Wed, Fri · 8:00 AM - 11:00 AM". Closed days group into a final row.',
      },
    },
  },
};

// Text-only when structured hours unavailable
export const TextOnly: Story = {
  args: {
    schedule: textOnlySchedule,
  },
};

// Compact single-line for cards
export const Compact: StoryObj<typeof CompactHours> = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 dark:border-gray-700">
        <p className="text-muted-foreground mb-2 text-sm">Standard hours</p>
        <CompactHours schedule={standardSchedule} />
      </div>
      <div className="rounded-lg border p-4 dark:border-gray-700">
        <p className="text-muted-foreground mb-2 text-sm">No hours available</p>
        <CompactHours schedule={{}} />
      </div>
    </div>
  ),
};

// Expandable summary widget
export const ExpandableSummary: StoryObj<typeof HoursSummary> = {
  render: () => (
    <div className="max-w-md">
      <HoursSummary schedule={standardSchedule} />
    </div>
  ),
};

// Open/Closed status badges
export const StatusBadges: StoryObj<typeof OpenStatusBadge> = {
  render: () => (
    <div className="flex gap-4">
      <OpenStatusBadge isOpen={true} />
      <OpenStatusBadge isOpen={false} />
    </div>
  ),
};
