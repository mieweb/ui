import type { Meta, StoryObj } from '@storybook/react';

import {
  type ChartDataPoint,
  type MetricData,
  ReportDashboard,
  type TopItem,
} from './ReportDashboard';

const meta: Meta<typeof ReportDashboard> = {
  id: 'dashboards-reportdashboard',
  title: 'Modules/Dashboards/ReportDashboard',
  component: ReportDashboard,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A fixed analytics page in one component**: header (\`title\`, \`dateRangeLabel\`, a \`Select\` of \`dateRangeOptions\` bound to \`selectedDateRange\` / \`onDateRangeChange\`, an Export \`Button\` when \`onExport\` is set), a 2 → 4 column grid of \`metrics: MetricData[]\` (\`{ label, value, change?, changeLabel?, trend? }\`) in \`Card\`s, an "Order Volume" bar chart from \`chartData: ChartDataPoint[]\` (\`{ label, value, previousValue? }\`, CSS-height bars, no chart library), and two ranked lists \`topServices\` / \`topEmployers: TopItem[]\` (\`{ id, name, value, percentage? }\`) with \`Badge\` ranks and percentage bars. \`isLoading\` swaps in a pulse skeleton. Numbers are formatted with \`Intl.NumberFormat('en-US')\`; a metric whose label contains "revenue" or "amount", and every employer value, is formatted as USD.

### Use it when

- The provider / employer reporting page needs exactly this shape — KPIs, one period-over-period volume chart, two leaderboards — with minimal wiring.
- Data arrives already aggregated per period and the user only switches the date range.

### Don't use it when

- The user should choose and arrange their own widgets — \`CustomizableDashboard\`.
- You need real charts (axes, tooltips, series, zoom) — \`DataVisNitroGraph\` or \`YChart\` inside \`Card\`s; sparklines in metric tiles — \`Sparkline\` + \`CardStat\`.
- The sections differ ("Top Providers", a table, filters) — headings and slots are fixed; build from \`PageHeader\`, \`Card\`, \`CardStat\` and \`DashboardWidget\` instead.
- Currency or locale is not US dollars.

### Example

\`\`\`tsx
const [range, setRange] = useState('30d');
const { data, isLoading } = useProviderReport(range);

<ReportDashboard
  title="Reports & Analytics"
  dateRangeLabel={RANGE_LABELS[range]}
  selectedDateRange={range}
  onDateRangeChange={setRange}
  isLoading={isLoading}
  metrics={data?.metrics ?? []}
  chartData={data?.volumeByWeek}
  topServices={data?.topServices}
  topEmployers={data?.topEmployers}
  onExport={() => downloadCsv(range)}
/>
\`\`\`

The date range is controlled by the host and drives the query; \`dateRangeLabel\` is separate text you keep in sync.

### Limitations

- Accessibility: renders an \`<h1>\` for \`title\` (clashes with \`PageHeader\` / \`AppHeaderTitle\` on the same page) and \`CardTitle as="h2"\` for sections. The bar chart is **purely visual** — bars are \`div\`s with \`title\` tooltips (\`"Current: N"\`), no \`role="img"\`, no text alternative, no table fallback; percentage bars likewise carry no \`role="progressbar"\` or value. Trend arrows are \`aria-hidden\`; direction is conveyed by colour plus the signed \`change\` text. The \`Select\` gets \`aria-label="Date range"\`. Skeleton has no \`aria-busy\` / status text.
- i18n: \`en-US\` / \`USD\` hard-coded; English \`"Reports & Analytics"\`, \`"Last 30 Days"\`, default range options, \`"Export"\`, \`"Order Volume"\`, \`"Current Period"\`, \`"Previous Period"\`, \`"Top Services"\`, \`"Top Employers"\`. Currency detection by label substring ("revenue" / "amount") is implicit.
- Layout: metrics \`grid-cols-2 md:grid-cols-4\`, top lists \`md:grid-cols-2\`; chart labels \`truncate\`; \`chartData\` beyond ~12 points gets very thin bars.
- RTL: Export icon uses \`mr-2\`; otherwise symmetric flex/grid. Theming: hard-coded \`gray-*\`, \`blue-500\`, \`green-*\`, \`red-*\` for text, bars and skeleton — not brand tokens. Uses \`Card\`, \`Badge\`, \`Button\`, \`Select\`; no chart dependency.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'dashboards-customizabledashboard',
          why: 'CustomizableDashboard is an empty grid the user arranges; ReportDashboard is a fixed analytics page (metrics, bar chart, top lists) driven by data props.',
        },
        {
          type: 'uses',
          target: 'layout-card',
          why: 'Metric tiles, the chart and both leaderboards are Cards with CardHeader / CardTitle / CardContent.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-select',
          why: 'The date-range picker in the header is a Select bound to selectedDateRange / onDateRangeChange.',
        },
      ],
    },
  },
  argTypes: {
    onDateRangeChange: { action: 'date range changed' },
    onExport: { action: 'export' },
    dateRangeOptions: {
      control: 'object',
      description: 'Date range options',
    },
    selectedDateRange: {
      control: 'text',
      description: 'Current selected date range',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether data is loading',
    },
    title: {
      control: 'text',
      description: 'Title for the dashboard',
    },
    dateRangeLabel: {
      control: 'text',
      description: 'Date range label',
    },
  },
  args: {
    dateRangeOptions: [
      { value: '7d', label: 'Last 7 Days' },
      { value: '30d', label: 'Last 30 Days' },
      { value: '90d', label: 'Last 90 Days' },
      { value: 'ytd', label: 'Year to Date' },
      { value: '12m', label: 'Last 12 Months' },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof ReportDashboard>;

const mockMetrics: MetricData[] = [
  {
    label: 'Total Orders',
    value: 847,
    change: 12,
    changeLabel: 'vs last period',
    trend: 'up',
  },
  {
    label: 'Completed',
    value: 723,
    change: 8,
    changeLabel: 'vs last period',
    trend: 'up',
  },
  {
    label: 'Total Revenue',
    value: 52450,
    change: 15,
    changeLabel: 'vs last period',
    trend: 'up',
  },
  {
    label: 'Avg Order Value',
    value: '$62',
    change: -3,
    changeLabel: 'vs last period',
    trend: 'down',
  },
];

const mockChartData: ChartDataPoint[] = [
  { label: 'Jan', value: 65, previousValue: 58 },
  { label: 'Feb', value: 72, previousValue: 62 },
  { label: 'Mar', value: 58, previousValue: 70 },
  { label: 'Apr', value: 85, previousValue: 68 },
  { label: 'May', value: 92, previousValue: 75 },
  { label: 'Jun', value: 78, previousValue: 82 },
  { label: 'Jul', value: 88, previousValue: 78 },
  { label: 'Aug', value: 95, previousValue: 85 },
  { label: 'Sep', value: 82, previousValue: 90 },
  { label: 'Oct', value: 90, previousValue: 88 },
  { label: 'Nov', value: 75, previousValue: 72 },
  { label: 'Dec', value: 67, previousValue: 65 },
];

const mockTopServices: TopItem[] = [
  { id: 's1', name: 'DOT Physical', value: 285, percentage: 100 },
  { id: 's2', name: 'Drug Screen (5 Panel)', value: 198, percentage: 69 },
  { id: 's3', name: 'Pre-Employment Physical', value: 156, percentage: 55 },
  { id: 's4', name: 'Audiometry', value: 98, percentage: 34 },
  { id: 's5', name: 'Vision Screening', value: 87, percentage: 31 },
];

const mockTopEmployers: TopItem[] = [
  { id: 'e1', name: 'Acme Corporation', value: 12500, percentage: 100 },
  { id: 'e2', name: 'TransCo Logistics', value: 9800, percentage: 78 },
  { id: 'e3', name: 'SafeHaul Trucking', value: 7200, percentage: 58 },
  { id: 'e4', name: 'Metro Manufacturing', value: 5400, percentage: 43 },
  { id: 'e5', name: 'City Construction', value: 4200, percentage: 34 },
];

export const Default: Story = {
  args: {
    metrics: mockMetrics,
    chartData: mockChartData,
    topServices: mockTopServices,
    topEmployers: mockTopEmployers,
    selectedDateRange: '30d',
  },
};

export const Loading: Story = {
  args: {
    metrics: [],
    isLoading: true,
  },
};

export const MetricsOnly: Story = {
  args: {
    metrics: mockMetrics,
    selectedDateRange: '30d',
  },
};

export const WithChart: Story = {
  args: {
    metrics: mockMetrics,
    chartData: mockChartData,
    selectedDateRange: '30d',
  },
};

export const NoComparison: Story = {
  args: {
    metrics: mockMetrics,
    chartData: mockChartData.map(({ label, value }) => ({ label, value })),
    topServices: mockTopServices,
    topEmployers: mockTopEmployers,
    selectedDateRange: '30d',
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Monthly Performance Report',
    dateRangeLabel: 'November 2024',
    metrics: mockMetrics,
    chartData: mockChartData,
    topServices: mockTopServices,
    topEmployers: mockTopEmployers,
    selectedDateRange: '30d',
  },
};

export const YearToDate: Story = {
  args: {
    title: 'Year to Date Summary',
    dateRangeLabel: 'January 1 - December 15, 2024',
    metrics: [
      {
        label: 'Total Orders',
        value: 4523,
        change: 22,
        changeLabel: 'vs last year',
        trend: 'up',
      },
      {
        label: 'Completed',
        value: 4281,
        change: 19,
        changeLabel: 'vs last year',
        trend: 'up',
      },
      {
        label: 'Total Revenue',
        value: 285000,
        change: 28,
        changeLabel: 'vs last year',
        trend: 'up',
      },
      {
        label: 'Active Employers',
        value: 42,
        change: 5,
        changeLabel: 'new this year',
        trend: 'up',
      },
    ],
    chartData: mockChartData,
    topServices: mockTopServices,
    topEmployers: mockTopEmployers,
    selectedDateRange: 'ytd',
  },
};

export const DeclineMetrics: Story = {
  args: {
    metrics: [
      {
        label: 'Total Orders',
        value: 523,
        change: -8,
        changeLabel: 'vs last period',
        trend: 'down',
      },
      {
        label: 'Completed',
        value: 412,
        change: -12,
        changeLabel: 'vs last period',
        trend: 'down',
      },
      {
        label: 'Total Revenue',
        value: 28500,
        change: -5,
        changeLabel: 'vs last period',
        trend: 'down',
      },
      {
        label: 'Cancellation Rate',
        value: '8%',
        change: 3,
        changeLabel: 'increase',
        trend: 'down',
      },
    ],
    chartData: mockChartData,
    topServices: mockTopServices,
    selectedDateRange: '30d',
  },
};

export const NoTopLists: Story = {
  args: {
    metrics: mockMetrics,
    chartData: mockChartData,
    selectedDateRange: '30d',
  },
};

export const NoExport: Story = {
  args: {
    metrics: mockMetrics,
    chartData: mockChartData,
    topServices: mockTopServices,
    topEmployers: mockTopEmployers,
    onExport: undefined,
    selectedDateRange: '30d',
  },
};

export const Mobile: Story = {
  args: {
    metrics: mockMetrics,
    chartData: mockChartData,
    topServices: mockTopServices.slice(0, 3),
    topEmployers: mockTopEmployers.slice(0, 3),
    selectedDateRange: '30d',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
