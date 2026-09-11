import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  WebChartReportViewer,
  ReportTimeRange,
  type SystemReport,
  type ReportResult,
} from './WebChartReportViewer';
import { Badge } from '../Badge';

const meta: Meta<typeof WebChartReportViewer> = {
  id: 'encounter-orders-webchartreportviewer',
  title: 'Healthcare/Encounter & orders/WebChartReportViewer',
  component: WebChartReportViewer,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 900,
      },
      description: {
        component: `### What it's for

A **report picker and results viewer** for system reports served by a WebChart / Enterprise Health backend — or anything else that can hand you a list and a result. It renders \`reports: SystemReport[]\` (\`{ id, name, description?, category? }\`) as a responsive grid of clickable \`Card\`s, a **Refresh Reports** button (\`onRefreshReports\`), \`Skeleton\` placeholders while \`loading\`, an empty state, and a warning \`Alert\` for a connection-level \`error\` with an optional **Reconnect** button (\`onReconnect\`; the brand name comes from \`webchartBrand\`, default "Enterprise Health"). Picking a report calls \`onReportSelect(report)\` and opens a \`size="4xl"\` \`Modal\` whose toolbar has From / To \`DateInput\`s (\`dateRange\` + \`onDateRangeChange\`, only when both are provided) and a per-report refresh (\`onRefreshReport\`); the body shows a \`Spinner\` while \`loadingReport\`, a danger \`Alert\` for \`reportResult.error\`, and otherwise renders \`reportResult.data\` **by shape**: a string is injected as HTML, an array of objects becomes a \`Table\` (columns from the first row's keys, cells through \`columnRenderers[column]\` when given), a single object becomes a key / value table. \`ReportTimeRange\` (preset \`Select\` — today / week / month / quarter / year / custom — plus custom \`DateInput\`s) and \`ReportDatePicker\` are exported companions for building your own toolbar.

**Backend contract:** none is baked in. The component is purely props-and-callbacks — the host fetches the report list and runs a report (WebChart's system-report API, a proxy, a FHIR \`$report\` operation, static JSON…) and passes \`reports\`, \`currentReport\`, \`reportResult\`, the loading flags and \`error\`. "WebChart" names the workflow it was built for, not a dependency.

### Use it when

- An admin or occupational-health screen needs to **browse canned reports** (DOT physicals due, drug-screen history, injury log…) and view one at a time with a date range.
- The report result is HTML the backend already rendered, or flat tabular rows you are happy to show in a plain \`Table\` with a few custom cell renderers.
- You want the connection-lost / reconnect affordance handled for you.

### Don't use it when

- You need **interactive** analysis of the rows — sorting, filtering, grouping, pivoting, charts — [DataVis NITRO](?path=/docs/grids-datavis-nitro--docs) with your own picker; this viewer's table is static.
- The report is one fixed dataset on the page rather than a pick-from-a-list flow — render a \`Table\` or NITRO grid directly.
- The result HTML is **untrusted** — string results are injected unsanitised (see Limitations); sanitise server-side or render Markdown through \`MarkdownRenderer\` instead.

### Example

\`\`\`tsx
const [reports, setReports] = useState<SystemReport[]>([]);
const [current, setCurrent] = useState<SystemReport | undefined>();
const [result, setResult] = useState<ReportResult | undefined>();
const [range, setRange] = useState({ start: startOfMonth(new Date()), end: new Date() });
const [loading, setLoading] = useState(false);
const [loadingReport, setLoadingReport] = useState(false);
const [error, setError] = useState<string | undefined>();

const loadReports = async () => { setLoading(true); try { setReports(await api.listReports()); setError(undefined); } catch (e) { setError(t('reportsUnavailable')); } finally { setLoading(false); } };
const run = async (report: SystemReport, r = range) => { setCurrent(report); setLoadingReport(true); setResult(await api.runReport(report.id, r).catch((e) => ({ success: false, error: String(e) }))); setLoadingReport(false); };

<WebChartReportViewer
  reports={reports}
  currentReport={current}
  reportResult={result}
  loading={loading}
  loadingReport={loadingReport}
  error={error}
  onRefreshReports={loadReports}
  onReportSelect={run}
  onRefreshReport={() => current && run(current)}
  dateRange={range}
  onDateRangeChange={(start, end) => { const next = { start, end }; setRange(next); if (current) run(current, next); }}
  onReconnect={() => api.reconnect().then(loadReports)}
  columnRenderers={{ Status: (v) => <Badge size="sm">{String(v)}</Badge> }}
  webchartBrand={{ name: 'WebChart' }}
/>
\`\`\`

The component owns only whether the modal is open; every fetch, retry and date-range effect is the host's.

### Limitations

- **Security.** A string \`reportResult.data\` is rendered with \`dangerouslySetInnerHTML\` and **no sanitisation** — only pass HTML from a trusted backend, or sanitise (e.g. DOMPurify) before handing it over. Its \`prose dark:prose-invert\` styling needs \`@tailwindcss/typography\` in the host build.
- **Accessibility as implemented.** Report cards are \`Card role="button" tabIndex={0}\` with Enter / Space handling and an \`aria-label\` of name + description; the modal inherits \`Modal\`'s focus trap and Esc; the refresh icon button has \`aria-label\`; the date \`<label>\`s are **not** associated with their \`DateInput\`s (no \`htmlFor\`). Loading / error / empty states are not announced (no live region); the success / error icons in the modal title are colour-only with no text alternative. The results \`Table\` has no caption or sortable headers.
- **Data handling.** Array results derive columns from the **first row only** — later rows with extra keys lose them; cells are \`String(value)\` unless a renderer is supplied; row keys are built by joining cell strings, so identical rows share a key. \`chartData\` is accepted but never rendered. Date inputs only propagate when the typed value parses (\`isValidDate\`).
- **State coupling.** Selecting a report always opens the modal and \`onClose\` fires on dismiss, but there is no way to open the modal for \`currentReport\` programmatically. \`ReportTimeRange\` keeps its own preset state and defaults to *This Month* regardless of the dates you pass.
- **Responsive / RTL.** Report grid is 1 / 2 / 3 columns at \`md\` / \`lg\`; the modal body scrolls at \`max-h-[60vh]\`; icon margins are physical (\`mr-2\`) — no RTL mirroring.
- **Theming / i18n.** Semantic tokens plus hard-coded \`text-yellow-500\` / \`text-green-500\` status icons. \`labels\` externalises most strings (\`refreshReports\`, \`refreshReport\`, \`reconnect\`, \`noReports\`, \`loadingData\`, \`dateFrom\`, \`dateTo\`), but "Report Results", "No data available", the reconnect sentence and \`ReportTimeRange\`'s preset names are English constants, and \`labels.close\` / \`labels.loadingReports\` are declared but unused. Date display format comes from \`dateToDisplayFormat\` in \`@mieweb/ui/utils\`.
- **Dependencies / entry.** \`Alert\`, \`Button\`, \`Card\`, \`DateInput\`, \`Modal\`, \`Select\`, \`Skeleton\`, \`Spinner\`, \`Table\`, \`lucide-react\` icons (not the library's \`Icons\`); main \`@mieweb/ui\` entry — except the \`DateRange\` type, which clashes with \`DateRangePicker\`'s and is deliberately not re-exported; type \`{ start: Date | string; end: Date | string }\` inline.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'grids-datavis-nitro',
          why: 'WebChartReportViewer picks a backend-run report and shows its rows in a static Table; DataVis NITRO is the interactive grid for sorting, grouping and pivoting a dataset.',
        },
        {
          type: 'uses',
          target: 'grids-table',
          why: 'Array and object results render through Table / TableRow / TableCell with optional columnRenderers.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'The selected report opens in a size="4xl" Modal with the date-range toolbar.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof WebChartReportViewer>;

const sampleReports: SystemReport[] = [
  {
    id: '1',
    name: 'Active Employees',
    description: 'List of all active employees',
  },
  {
    id: '2',
    name: 'DOT Physicals Due',
    description: 'Employees with upcoming DOT physicals',
  },
  {
    id: '3',
    name: 'Drug Screen History',
    description: 'Drug screening results by date range',
  },
  {
    id: '4',
    name: 'Immunization Status',
    description: 'Employee immunization records',
  },
  { id: '5', name: 'Injury Log', description: 'Workplace injury reports' },
  {
    id: '6',
    name: 'Compliance Dashboard',
    description: 'Overall compliance metrics',
  },
  {
    id: '7',
    name: 'Hearing Conservation',
    description: 'Hearing test results and trends',
  },
  {
    id: '8',
    name: 'Respiratory Fit Test',
    description: 'Respiratory fit test records',
  },
  {
    id: '9',
    name: 'Work Restrictions',
    description: 'Active work restrictions',
  },
];

const statusRenderer = (value: unknown) => {
  const status = String(value);
  const variant =
    status === 'Active'
      ? 'success'
      : status === 'On Leave'
        ? 'warning'
        : status === 'Inactive'
          ? 'secondary'
          : 'default';
  return (
    <Badge variant={variant} size="sm">
      {status}
    </Badge>
  );
};

const columnRenderers = {
  Status: statusRenderer,
};

const sampleResult: ReportResult = {
  success: true,
  data: [
    {
      Name: 'John Doe',
      Department: 'Engineering',
      'Hire Date': '2021-03-15',
      Status: 'Active',
    },
    {
      Name: 'Jane Smith',
      Department: 'Operations',
      'Hire Date': '2019-07-22',
      Status: 'Active',
    },
    {
      Name: 'Bob Wilson',
      Department: 'Maintenance',
      'Hire Date': '2020-11-01',
      Status: 'On Leave',
    },
  ],
};

function DefaultWrapper() {
  const [currentReport, setCurrentReport] = useState<
    SystemReport | undefined
  >();
  const [reportResult, setReportResult] = useState<ReportResult | undefined>();
  const [loadingReport, setLoadingReport] = useState(false);

  const handleReportSelect = (report: SystemReport) => {
    setCurrentReport(report);
    setLoadingReport(true);
    // Simulate loading
    setTimeout(() => {
      setReportResult(sampleResult);
      setLoadingReport(false);
    }, 1500);
  };

  return (
    <WebChartReportViewer
      reports={sampleReports}
      currentReport={currentReport}
      reportResult={reportResult}
      loadingReport={loadingReport}
      onReportSelect={handleReportSelect}
      onRefreshReports={() => console.log('Refresh reports')}
      onRefreshReport={() => console.log('Refresh report')}
      columnRenderers={columnRenderers}
      dateRange={{
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(),
      }}
      onDateRangeChange={(start, end) => console.log('Date range:', start, end)}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultWrapper />,
};

export const Loading: Story = {
  args: {
    reports: [],
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    reports: sampleReports,
    error:
      'Unable to connect to Enterprise Health. The server may be unavailable.',
  },
};

export const NoReports: Story = {
  args: {
    reports: [],
    loading: false,
  },
};

export const ReportWithError: Story = {
  args: {
    reports: sampleReports,
    currentReport: sampleReports[0],
    reportResult: {
      success: false,
      error: 'Failed to fetch report data. Please try again.',
    },
  },
};

function TimeRangeWrapper() {
  const [range, setRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });

  return (
    <ReportTimeRange
      startDate={range.start}
      endDate={range.end}
      onChange={(start, end) => {
        setRange({
          start: typeof start === 'string' ? new Date(start) : start,
          end: typeof end === 'string' ? new Date(end) : end,
        });
      }}
    />
  );
}

export const TimeRange: StoryObj<typeof ReportTimeRange> = {
  render: () => <TimeRangeWrapper />,
};

const structuredResult: ReportResult = {
  success: true,
  data: [
    {
      Name: 'John Doe',
      Department: 'Engineering',
      'Hire Date': '2021-03-15',
      Status: 'Active',
    },
    {
      Name: 'Jane Smith',
      Department: 'Operations',
      'Hire Date': '2019-07-22',
      Status: 'Active',
    },
    {
      Name: 'Bob Wilson',
      Department: 'Maintenance',
      'Hire Date': '2020-11-01',
      Status: 'On Leave',
    },
    {
      Name: 'Alice Brown',
      Department: 'HR',
      'Hire Date': '2018-01-10',
      Status: 'Inactive',
    },
    {
      Name: 'Charlie Davis',
      Department: 'Engineering',
      'Hire Date': '2022-06-30',
      Status: 'Active',
    },
  ],
};

function StructuredDataWrapper() {
  const [currentReport, setCurrentReport] = useState<
    SystemReport | undefined
  >();
  const [reportResult, setReportResult] = useState<ReportResult | undefined>();
  const [loadingReport, setLoadingReport] = useState(false);

  const handleReportSelect = (report: SystemReport) => {
    setCurrentReport(report);
    setLoadingReport(true);
    setTimeout(() => {
      setReportResult(structuredResult);
      setLoadingReport(false);
    }, 1500);
  };

  return (
    <WebChartReportViewer
      reports={sampleReports}
      currentReport={currentReport}
      reportResult={reportResult}
      loadingReport={loadingReport}
      onReportSelect={handleReportSelect}
      onRefreshReports={() => console.log('Refresh reports')}
      onRefreshReport={() => console.log('Refresh report')}
      columnRenderers={columnRenderers}
      dateRange={{
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(),
      }}
      onDateRangeChange={(start, end) => console.log('Date range:', start, end)}
    />
  );
}

export const StructuredData: Story = {
  render: () => <StructuredDataWrapper />,
};

export const CustomBranding: Story = {
  args: {
    reports: sampleReports,
    webchartBrand: {
      name: 'WebChart EHR',
      logo: '/images/webchart/logo.svg',
    },
    error: 'Connection timed out',
  },
};

export const Mobile: Story = {
  args: {
    reports: sampleReports.slice(0, 4),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
