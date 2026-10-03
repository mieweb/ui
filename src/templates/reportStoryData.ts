// Illustrative fixtures for the Reports stories. Figures are made up.
import type {
  BenchmarkColumn,
  BenchmarkRow,
} from '../components/BenchmarkTableSection';
import type { LinkGroup } from '../components/LinkGroupsSection';
import type { MetricDefinition } from '../components/MetricListSection';
import type { RankedList } from '../components/RankedListSection';
import type { ReportAuthor } from '../components/ReportByline';
import type { ReportLegendEntry } from '../components/ReportLegend';
import type { MethodologySource } from '../components/ReportMethodology';
import type {
  TileLegendEntry,
  TileValue,
} from '../components/TileCartogramSection';
import { quartileBuckets } from '../components/TileCartogramSection/tiles';
import type { StatItem } from '../components/StatsSection';
import type { LandingBlock } from '../components/LandingPage';
import type { LeadFormField } from '../components/LeadFormSection';

export const reportLegend: ReportLegendEntry[] = [
  {
    status: 'live',
    description: 'Computed directly from the current provider directory.',
  },
  {
    status: 'modeled',
    description: 'Estimated from public workforce and requirement data.',
  },
  {
    status: 'maturing',
    description:
      'Defined and being instrumented; values publish when measured.',
  },
];

export const keyFindings: StatItem[] = [
  {
    value: 4200,
    suffix: '+',
    label: 'Provider locations',
    description: 'Across all 50 states',
  },
  {
    value: '$62',
    label: 'Median drug screen',
    description: 'National, sample data',
  },
  {
    value: '3.4\u00d7',
    label: 'Price spread',
    description: 'Highest vs lowest state',
  },
  {
    value: '18',
    label: 'Underserved states',
    description: 'Below 5 per 100k workers',
  },
];

export const benchmarkColumns: BenchmarkColumn[] = [
  {
    key: 'avg',
    label: 'National avg',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    emphasis: true,
  },
  { key: 'range', label: 'Range' },
  {
    key: 'northeast',
    label: 'Northeast',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
  {
    key: 'south',
    label: 'South',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
  {
    key: 'midwest',
    label: 'Midwest',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
  {
    key: 'west',
    label: 'West',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
];

export const benchmarkRows: BenchmarkRow[] = [
  {
    label: 'DOT physical',
    sublabel: 'Exams',
    href: '#dot',
    values: {
      avg: 98,
      range: '$65\u2013$150',
      northeast: 112,
      south: 88,
      midwest: 92,
      west: 104,
    },
  },
  {
    label: '5-panel drug screen',
    sublabel: 'Testing',
    values: {
      avg: 62,
      range: '$40\u2013$95',
      northeast: 70,
      south: 55,
      midwest: 58,
      west: 66,
    },
  },
  {
    label: 'Respirator fit test',
    sublabel: 'Exams',
    values: {
      avg: 55,
      range: '$35\u2013$90',
      northeast: 61,
      south: 49,
      midwest: 52,
      west: null,
    },
  },
  {
    label: 'Audiogram',
    sublabel: 'Screening',
    values: {
      avg: 45,
      range: '$30\u2013$75',
      northeast: 50,
      south: 41,
      midwest: 43,
      west: 48,
    },
  },
];

export const rankedLists: RankedList[] = [
  {
    title: 'Highest density',
    items: [
      {
        label: 'North Dakota',
        value: 14.2,
        display: '14.2 /100k',
        href: '#nd',
      },
      { label: 'Vermont', value: 12.8, display: '12.8 /100k' },
      { label: 'Wyoming', value: 11.1, display: '11.1 /100k' },
      { label: 'Nebraska', value: 9.6, display: '9.6 /100k' },
    ],
  },
  {
    title: 'Most underserved',
    items: [
      { label: 'Nevada', value: 2.1, display: '2.1 /100k' },
      { label: 'Arizona', value: 2.6, display: '2.6 /100k' },
      { label: 'Florida', value: 3.0, display: '3.0 /100k' },
      { label: 'Georgia', value: 3.3, display: '3.3 /100k' },
    ],
  },
];

export const demandList: RankedList[] = [
  {
    items: [
      { label: 'DOT physical', value: 94, note: '14 industries' },
      { label: 'Drug screen', value: 88, note: '19 industries' },
      { label: 'TB test', value: 61, note: '8 industries' },
      { label: 'Audiogram', value: 47, note: '6 industries' },
    ],
  },
];

const density: Record<string, number | null> = {
  ND: 14.2,
  VT: 12.8,
  WY: 11.1,
  NE: 9.6,
  MT: 9.1,
  SD: 8.8,
  IA: 8.2,
  KS: 7.9,
  ME: 7.5,
  NH: 7.1,
  MN: 6.9,
  WI: 6.6,
  ID: 6.4,
  OK: 6.1,
  AR: 5.9,
  WV: 5.7,
  MO: 5.5,
  IN: 5.3,
  OH: 5.1,
  KY: 4.9,
  MI: 4.8,
  PA: 4.7,
  AL: 4.5,
  MS: 4.4,
  LA: 4.3,
  NM: 4.2,
  UT: 4.1,
  OR: 4.0,
  IL: 3.9,
  TN: 3.8,
  SC: 3.7,
  NC: 3.6,
  VA: 3.5,
  CO: 3.5,
  WA: 3.4,
  NY: 3.4,
  MA: 3.3,
  CT: 3.3,
  NJ: 3.2,
  MD: 3.2,
  DE: 3.1,
  RI: 3.1,
  TX: 3.0,
  CA: 2.9,
  GA: 3.3,
  FL: 3.0,
  AZ: 2.6,
  NV: 2.1,
  HI: null,
  AK: null,
  DC: 5.0,
};
const buckets = quartileBuckets(density);
export const tileValues: Record<string, TileValue> = Object.fromEntries(
  Object.entries(density).map(([code, v]) => [
    code,
    {
      bucket: buckets[code],
      detail: v == null ? 'no workforce data' : `${v} per 100k workers`,
    },
  ])
);

export const tileLegend: TileLegendEntry[] = [
  { bucket: 4, label: 'Highest density' },
  { bucket: 3, label: 'Above median' },
  { bucket: 2, label: 'Below median' },
  { bucket: 1, label: 'Lowest density' },
  { bucket: 0, label: 'No data' },
];

export const maturingMetrics: MetricDefinition[] = [
  {
    label: 'Time to appointment',
    unit: 'days',
    description: 'Median days from order to the first available appointment.',
  },
  {
    label: 'Results turnaround',
    unit: 'hours',
    description: 'Median hours from collection to a released result.',
  },
  {
    label: 'No-show rate',
    unit: '%',
    description: 'Share of scheduled visits the worker did not attend.',
  },
];

export const measuredMetrics: MetricDefinition[] = maturingMetrics.map(
  (m, i) => ({
    ...m,
    value: ['2.4 days', '31 hrs', '6.8%'][i],
  })
);

export const methodologySources: MethodologySource[] = [
  {
    label: 'Provider directory',
    description: 'Active, credentialed locations as of the report date.',
    href: 'https://example.com/directory',
  },
  {
    label: 'BLS OEWS',
    description: 'Metro employment used as the workforce denominator.',
    href: 'https://www.bls.gov/oes/',
  },
  {
    label: 'Marketplace pricing',
    description: 'State-level averages of provider-listed rates.',
  },
];

export const reportAuthors: ReportAuthor[] = [
  {
    name: 'Jordan Rivera',
    role: 'Director of Research',
    href: '#author',
    profiles: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/' }],
  },
];

export const relatedGroups: LinkGroup[] = [
  {
    title: 'Services',
    description: 'The services these prices describe.',
    links: [
      { label: 'DOT physicals', href: '#dot' },
      { label: 'Drug testing', href: '#drug' },
      { label: 'Respirator fit testing', href: '#fit' },
    ],
  },
  {
    title: 'States',
    description: 'Coverage and pricing by state.',
    links: [
      { label: 'Texas', href: '#tx' },
      { label: 'California', href: '#ca' },
      { label: 'Ohio', href: '#oh' },
    ],
  },
  {
    title: 'Tools',
    description: 'Estimate your own program.',
    links: [
      { label: 'Cost calculator', href: '#calc' },
      { label: 'Compliance calendar', href: '#cal' },
    ],
  },
];

export const reportGateFields: LeadFormField[] = [
  {
    name: 'firstName',
    label: 'First name',
    autoComplete: 'given-name',
    width: 'half',
  },
  {
    name: 'lastName',
    label: 'Last name',
    autoComplete: 'family-name',
    width: 'half',
  },
  {
    name: 'email',
    label: 'Work email',
    type: 'email',
    required: true,
    autoComplete: 'email',
    placeholder: 'you@yourfleet.com',
  },
  {
    name: 'organization',
    label: 'Fleet or carrier',
    autoComplete: 'organization',
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    placeholder: 'Select your role\u2026',
    options: ['Fleet manager', 'Safety director', 'HR lead'],
  },
];

/** A sample benchmark report, top to bottom, as `LandingPage` blocks. */
export const benchmarkReportBlocks: LandingBlock[] = [
  {
    type: 'hero',
    tone: 'brand',
    eyebrow: 'Benchmark report',
    title: 'The State of Workforce Health Access',
    description:
      'Provider supply, pricing and access across the country, with every figure labelled by where it comes from.',
    meta: ['2026 edition', 'Sample data'],
    breadcrumbs: [
      { label: 'Home', href: '#' },
      { label: 'Reports', href: '#reports' },
      { label: 'Workforce Health Access', href: '#report' },
    ],
    primaryCta: { label: 'Download the PDF', href: '#pdf' },
  },
  {
    type: 'stats',
    tone: 'brand',
    variant: 'ruled',
    align: 'start',
    eyebrow: 'Key findings at a glance',
    stats: keyFindings,
  },
  { type: 'report-legend', entries: reportLegend },
  {
    type: 'features',
    id: 'summary',
    eyebrow: 'Executive summary',
    title: 'What the market looks like this year',
    description:
      'Supply is deep but uneven, prices vary more than cost of living explains, and the gaps sit where the workforce is growing fastest.',
    columns: 2,
    features: [
      {
        icon: '1',
        title: 'Supply is concentrated',
        description: 'A third of locations sit in five states.',
      },
      {
        icon: '2',
        title: 'Prices spread widely',
        description:
          'The same exam costs over three times as much in some states.',
      },
      {
        icon: '3',
        title: 'Gaps track growth',
        description: 'The least-served states are among the fastest-growing.',
      },
      {
        icon: '4',
        title: 'Demand is regulatory',
        description:
          'DOT and OSHA requirements drive the most-ordered services.',
      },
    ],
  },
  {
    type: 'benchmark-table',
    id: 'pricing',
    eyebrow: 'Pricing benchmarks',
    title: 'What services cost',
    status: 'live',
    rowHeader: 'Service',
    columns: benchmarkColumns,
    rows: benchmarkRows,
    footnote:
      'State-level averages of provider-listed rates; regional columns are the mean of state averages.',
  },
  {
    type: 'tile-cartogram',
    id: 'geography',
    eyebrow: 'Geographic access',
    title: 'Where supply meets, and misses, demand',
    status: 'live',
    mapTitle: 'Provider density by state',
    mapDescription:
      'Each tile is a state, shaded by providers per 100k workers.',
    values: tileValues,
    legend: tileLegend,
  },
  {
    type: 'ranked-list',
    title: 'Best- and least-served states',
    layout: 'inline',
    bar: 'accent',
    lists: rankedLists,
  },
  {
    type: 'ranked-list',
    eyebrow: 'Employer demand',
    title: 'What employers are buying',
    status: 'modeled',
    numbered: true,
    lists: demandList,
  },
  {
    type: 'metric-list',
    id: 'operations',
    eyebrow: 'Operations',
    title: 'Scheduling and turnaround',
    description:
      'We publish the definitions now and the values once they are measured.',
    metrics: maturingMetrics,
  },
  {
    type: 'features',
    id: 'outlook',
    tone: 'brand',
    eyebrow: 'Outlook',
    title: 'Where access is heading',
    columns: 3,
    features: [
      {
        title: 'Rural capacity grows',
        description: 'Mobile and telehealth-assisted exams extend reach.',
      },
      {
        title: 'Prices converge',
        description: 'Published pricing narrows the state-to-state spread.',
      },
      {
        title: 'Results get faster',
        description: 'Electronic ordering cuts turnaround.',
      },
    ],
  },
  {
    type: 'methodology',
    id: 'methodology',
    eyebrow: 'Methodology & sources',
    title: 'How this report was built',
    sources: methodologySources,
    citation:
      'Example Health. The State of Workforce Health Access, 2026 edition. https://example.com/reports/access-2026',
    notes: [
      {
        title: 'Publishing cadence',
        body: 'Refreshed each quarter; this edition covers January to March.',
      },
    ],
    resources: {
      title: 'Use the data',
      links: [
        { label: 'Download CSV', href: '#csv' },
        { label: 'API docs', href: '#api' },
      ],
    },
  },
  { type: 'byline', authors: reportAuthors, published: 'June 13, 2026' },
  {
    type: 'link-groups',
    eyebrow: 'Explore more',
    title: 'The pages behind these numbers',
    groups: relatedGroups,
  },
  {
    type: 'pdf-embed',
    id: 'pdf',
    eyebrow: 'PDF edition',
    title: 'Read or download the full report',
    src: '/templates/sample-report.pdf',
    downloadAs: 'workforce-health-access-2026.pdf',
    aspectRatio: 1.294,
  },
  {
    type: 'cta',
    title: 'See the numbers for your workforce',
    primaryCta: { label: 'Book a demo', href: '#demo' },
  },
];
