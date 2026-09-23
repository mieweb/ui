import type { Meta, StoryObj } from '@storybook/react-vite';
import { Snowflake, Sprout, Sun, Leaf, Activity, Siren } from 'lucide-react';
import {
  YearTimeline,
  MONTH_NAMES,
  type YearTimelineItem,
} from './YearTimeline';
import { skillUrl, type ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/industry/aviation/',
      note: 'The "Compliance calendar" section on every industry hub, fed by each vertical\'s `complianceCalendar`.',
    },
  ],
  skills: [
    {
      name: 'industry-page',
      repo: 'mieweb/enterprise-health-frontdoor',
      url: skillUrl('mieweb/enterprise-health-frontdoor', 'industry-page'),
      summary:
        'Scaffolds a vertical hub, including its compliance-calendar items and month windows.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/verticals/ComplianceCalendar.tsx + lib/compliance-calendar.ts and the `.cctl-*` CSS.',
  },
};

const compliance: YearTimelineItem[] = [
  {
    id: '300a',
    label: 'OSHA 300A posting & annual close',
    detail:
      'Post US 300A summaries, close prior-year logs and reconcile global incident reporting.',
    months: [1, 2],
    icon: <Snowflake />,
    tone: 'info',
  },
  {
    id: 'surveillance',
    label: 'Surveillance & screening cycle',
    detail:
      'Periodic medical surveillance, respirator evaluations and biometric screening come due.',
    months: [3, 4, 5],
    icon: <Sprout />,
    tone: 'success',
  },
  {
    id: 'iso',
    label: 'ISO 45001 audit & heat readiness',
    detail:
      'Internal audit evidence, heat-illness prevention plans and hydration programs go live.',
    months: [6, 7, 8],
    icon: <Sun />,
    tone: 'accent',
  },
  {
    id: 'flu',
    label: 'Flu & respiratory season',
    detail:
      'Vaccination clinics, consent capture and lot tracking across every site.',
    months: [9, 10, 11],
    icon: <Leaf />,
    tone: 'warning',
  },
  {
    id: 'exposure',
    label: 'Exposure & injury case management',
    detail:
      'Recordability determinations, restricted-duty tracking and return-to-work clearance.',
    period: 'Year-round',
    cadence: 'continuous',
    icon: <Activity />,
    tone: 'primary',
  },
  {
    id: 'incident',
    label: 'Serious incident reporting',
    detail:
      'Fatalities within 8 hours; in-patient hospitalisations, amputations and eye loss within 24.',
    period: 'As it happens',
    cadence: 'event',
    icon: <Siren />,
    tone: 'neutral',
  },
];

const meta: Meta<typeof YearTimeline> = {
  id: 'data-display-yeartimeline',
  title: 'Components/Data display/YearTimeline',
  component: YearTimeline,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'padded',
    meta: componentMeta,
    docs: {
      description: {
        component: `### What it's for

A year on one Gantt-style timeline. Twelve month columns; rows grouped by cadence — \`scheduled\` windows render as gradient pill bars spanning their \`months\`, while \`continuous\` and \`event\`-driven items run full-width in their own lanes. A live playhead + "Today" pill mark the current month, and the item happening now (or up next) is highlighted with a badge. Colours come from \`tone\` (brand tokens) or any two \`colors\`.

### Use it when

- An annual programme — compliance obligations, surveillance schedules, campaign calendars — must be read **as a year**: what happens when, what runs continuously, what's next.
- A marketing or overview page needs the year-at-a-glance visual rather than an interactive planner.

### Don't use it when

- You're tracking **one process's** milestones or activity feed — \`Timeline\` (\`TimelineProgress\` / \`TimelineEventList\`).
- Users edit or schedule the items — this is read-only display.
- The data is values over time — the DataVis components chart it; this shows presence, not magnitude.

### Example

\`\`\`tsx
<YearTimeline
  labelHeading="Obligation"
  items={[
    { id: 'osha', label: 'OSHA 300A posting', months: [2, 3, 4], tone: 'warning',
      detail: 'Post Feb 1 – Apr 30', icon: <ClipboardList /> },
    { id: 'flu', label: 'Flu campaign', months: [9, 10, 11], tone: 'info' },
    { id: 'surveillance', label: 'Medical surveillance', cadence: 'continuous' },
  ]}
/>
\`\`\`

### Limitations

- Accessibility: rows are plain text in a CSS grid — no table semantics; the playhead and badges are visual with text equivalents (\`period\` eyebrow, badge copy). Row titles become links when \`href\` is set.
- The default playhead resolves the viewer's current month **after mount** (SSR renders without it); pin it with \`today\` (month number or Date) or hide it with \`today={null}\`.
- Collapses to stacked label-over-bar rows below \`md\`; the twelve columns are equal-width regardless of month length.
- i18n: default month letters/names, \`labelHeading\` ("Obligation") and the \`labels\` ("Today" / "Now" / "Up next") are English — all overridable via props.
- Theming: \`tone\` maps to brand token families (primary, accent, success, warning, info, neutral); \`colors\` accepts any two CSS colours for a custom gradient.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'data-display-timeline',
          why: 'YearTimeline lays a whole year of scheduled/continuous items on one Gantt grid; Timeline tracks a single process\u2019s milestones and events.',
        },
        {
          type: 'alternative to',
          target: 'views-ganttview',
          why: 'YearTimeline is authored a year at a time for editorial use; GanttView drives bars from your own records through accessors over any range, and is switchable with the other Views layouts.',
        },
      ],
    },
  },
  argTypes: {
    items: {
      control: false,
      description:
        'Rows: label, months (1–12), cadence, tone/colors, detail, icon, href.',
    },
    today: {
      control: { type: 'number', min: 1, max: 12 },
      description:
        'Playhead month (or Date); null hides the marker. Default: the viewer\u2019s current month.',
    },
    labelHeading: {
      control: 'text',
      description: 'Column heading over the row labels.',
    },
    highlightCurrent: {
      control: 'boolean',
      description: 'Badge the item happening now (or up next).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Marker follows the viewer's clock. */
export const Default: Story = {
  args: { items: compliance },
};

/** Pin the playhead to a month to see the "Now" / "Up next" badges move. */
export const PinnedToSeptember: Story = {
  args: { items: compliance, today: 9 },
};

/** Hide the marker for a reference schedule. */
export const NoMarker: Story = {
  args: { items: compliance, today: null, labelHeading: 'Program' },
};

/** Any annual schedule works — here a marketing calendar with custom lane labels and full month names. */
export const MarketingCalendar: Story = {
  args: {
    today: 4,
    labelHeading: 'Campaign',
    monthLabels: MONTH_NAMES,
    groupLabels: {
      scheduled: 'Campaigns',
      continuous: 'Always-on',
      event: 'Reactive',
    },
    items: [
      {
        id: 'q1',
        label: 'Q1 compliance webinar series',
        months: [1, 2, 3],
        colors: ['#7c3aed', '#c4b5fd'],
      },
      {
        id: 'safety',
        label: 'National Safety Month push',
        months: [6],
        colors: ['#0f766e', '#5eead4'],
      },
      {
        id: 'conf',
        label: 'Conference season',
        detail: 'NSC, AOHC, SHRM.',
        months: [9, 10],
        tone: 'accent',
      },
      {
        id: 'seo',
        label: 'Evergreen SEO content',
        period: 'Weekly',
        cadence: 'continuous',
        tone: 'primary',
      },
      {
        id: 'reg',
        label: 'Regulatory-change explainers',
        period: 'As rules land',
        cadence: 'event',
        tone: 'neutral',
      },
    ],
  },
};
