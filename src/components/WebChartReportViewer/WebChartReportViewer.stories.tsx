import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  WebChartReportViewer,
  ReportDatePicker,
  type SystemReport,
  type ReportResult,
} from './WebChartReportViewer';
import { Badge } from '../Badge';

const meta: Meta<typeof WebChartReportViewer> = {
  title: 'Components/WebChartReportViewer',
  component: WebChartReportViewer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 900,
      },
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

function DatePickerWrapper() {
  const [range, setRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });

  return (
    <ReportDatePicker
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

export const DatePicker: StoryObj<typeof ReportDatePicker> = {
  render: () => <DatePickerWrapper />,
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
