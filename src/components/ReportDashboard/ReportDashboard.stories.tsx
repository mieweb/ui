import type { Meta, StoryObj } from '@storybook/react';
import {
  ReportDashboard,
  type MetricData,
  type ChartDataPoint,
  type TopItem,
} from './ReportDashboard';

const meta: Meta<typeof ReportDashboard> = {
  title: 'Provider/ReportDashboard',
  component: ReportDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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
