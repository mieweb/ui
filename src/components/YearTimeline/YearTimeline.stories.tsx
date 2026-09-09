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
  title: 'Components/Text & Data Display/YearTimeline',
  component: YearTimeline,
  parameters: {
    layout: 'padded',
    meta: componentMeta,
    docs: {
      description: {
        component:
          'A year on one Gantt-style timeline. Twelve month columns; rows grouped by cadence — ' +
          'scheduled windows render as gradient pill bars spanning their `months`, while continuous ' +
          'and event-driven items run full-width in their own lanes. A live playhead + "Today" pill ' +
          'mark the current month and the item happening now (or up next) is highlighted. Collapses ' +
          'to stacked rows below `md`. Colours come from `tone` (brand tokens) or any two `colors`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: { control: false },
    today: { control: { type: 'number', min: 1, max: 12 } },
    labelHeading: { control: 'text' },
    highlightCurrent: { control: 'boolean' },
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
