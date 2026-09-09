import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  DataVisNitroGraph,
  DataVisNitroGrid,
  DataVisNitroSource,
  type DataVisNitroAggregate,
  type DataVisNitroColumn,
  type DataVisNitroGraphProps,
  type DataVisNitroGroupField,
} from '../../datavis';

type DataRow = Record<string, unknown>;

interface LocalFieldInfo {
  field: string;
  type: string;
}

interface LocalDatasetProps {
  data: DataRow[];
  typeInfo: LocalFieldInfo[];
  children: ReactNode;
  groupBy?: Array<string | DataVisNitroGroupField>;
  aggregates?: DataVisNitroAggregate[];
}

function LocalDataset({
  data,
  typeInfo,
  children,
  groupBy,
  aggregates,
}: LocalDatasetProps) {
  const varName = useMemo(() => {
    const nextVarName = `__datavis_story_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, unknown>)[nextVarName] = {
      typeInfo,
      data,
    };
    return nextVarName;
  }, [data, typeInfo]);

  useEffect(
    () => () => {
      delete (window as unknown as Record<string, unknown>)[varName];
    },
    [varName]
  );

  return (
    <DataVisNitroSource
      type="local"
      varName={varName}
      groupBy={groupBy}
      aggregates={aggregates}
    >
      {children}
    </DataVisNitroSource>
  );
}

const INTERACTIVE_FEATURES = {
  columnResize: true,
  columnReorder: true,
  stickyHeaders: true,
  zebraStripe: true,
  keyboardNav: true,
  headerContextMenu: true,
} as const;

const WIDE_FIELDS = Array.from({ length: 50 }, (_, index) =>
  index === 0 ? 'recordId' : `field${String(index).padStart(2, '0')}`
);

const WIDE_COLUMNS: DataVisNitroColumn[] = WIDE_FIELDS.map((field, index) => ({
  field,
  header: index === 0 ? 'Record ID' : `Field ${String(index).padStart(2, '0')}`,
  width: index === 0 ? 90 : 140,
  sortable: true,
  resizable: true,
  reorderable: true,
  typeInfo: { type: index === 0 ? 'number' : 'string' },
}));

const WIDE_TYPE_INFO: LocalFieldInfo[] = WIDE_FIELDS.map((field, index) => ({
  field,
  type: index === 0 ? 'number' : 'string',
}));

const WIDE_ROWS: DataRow[] = Array.from({ length: 20 }, (_, rowIndex) =>
  Object.fromEntries(
    WIDE_FIELDS.map((field, columnIndex) => [
      field,
      columnIndex === 0
        ? rowIndex + 1
        : `R${String(rowIndex + 1).padStart(2, '0')} · C${String(columnIndex).padStart(2, '0')}`,
    ])
  )
);

const LEDGER_COLUMNS: DataVisNitroColumn[] = [
  { field: 'transactionId', header: 'Transaction ID', width: 120 },
  { field: 'date', header: 'Date', width: 110 },
  { field: 'account', header: 'Account', width: 150 },
  { field: 'department', header: 'Department', width: 130 },
  { field: 'status', header: 'Status', width: 100 },
  {
    field: 'debit',
    header: 'Debit',
    width: 110,
    align: 'right',
    typeInfo: { type: 'currency' },
  },
  {
    field: 'credit',
    header: 'Credit',
    width: 110,
    align: 'right',
    typeInfo: { type: 'currency' },
  },
  {
    field: 'balance',
    header: 'Balance',
    width: 120,
    align: 'right',
    typeInfo: { type: 'currency' },
  },
  { field: 'reference', header: 'Reference', width: 140 },
];

const LEDGER_TYPE_INFO: LocalFieldInfo[] = [
  { field: 'transactionId', type: 'number' },
  { field: 'date', type: 'date' },
  { field: 'account', type: 'string' },
  { field: 'department', type: 'string' },
  { field: 'status', type: 'string' },
  { field: 'debit', type: 'currency' },
  { field: 'credit', type: 'currency' },
  { field: 'balance', type: 'currency' },
  { field: 'reference', type: 'string' },
];

const ACCOUNTS = ['Cash', 'Receivables', 'Revenue', 'Payroll', 'Inventory'];
const DEPARTMENTS = ['Engineering', 'Finance', 'Operations', 'Sales'];
const STATUSES = ['Posted', 'Pending', 'Reconciled'];

const LEDGER_ROWS: DataRow[] = Array.from({ length: 5000 }, (_, index) => {
  const debit = index % 2 === 0 ? (index % 250) * 17.25 : 0;
  const credit = index % 2 === 1 ? (index % 200) * 13.5 : 0;

  return {
    transactionId: 100000 + index,
    date: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    account: ACCOUNTS[index % ACCOUNTS.length],
    department: DEPARTMENTS[index % DEPARTMENTS.length],
    status: STATUSES[index % STATUSES.length],
    debit,
    credit,
    balance: 250000 + debit - credit,
    reference: `REF-${String(index + 1).padStart(6, '0')}`,
  };
});

const EXPLORER_COLUMNS: DataVisNitroColumn[] = [
  { field: 'month', header: 'Month', width: 100 },
  { field: 'region', header: 'Region', width: 100 },
  { field: 'product', header: 'Product', width: 120 },
  {
    field: 'revenue',
    header: 'Revenue',
    width: 110,
    typeInfo: { type: 'currency' },
  },
  {
    field: 'expenses',
    header: 'Expenses',
    width: 110,
    typeInfo: { type: 'currency' },
  },
  {
    field: 'profit',
    header: 'Profit',
    width: 110,
    typeInfo: { type: 'currency' },
  },
];

const EXPLORER_TYPE_INFO: LocalFieldInfo[] = [
  { field: 'month', type: 'string' },
  { field: 'region', type: 'string' },
  { field: 'product', type: 'string' },
  { field: 'revenue', type: 'currency' },
  { field: 'expenses', type: 'currency' },
  { field: 'profit', type: 'currency' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const REGIONS = ['North', 'South', 'East', 'West'];
const PRODUCTS = ['Clinical', 'Portal', 'Analytics'];

const EXPLORER_ROWS: DataRow[] = Array.from({ length: 48 }, (_, index) => {
  const revenue = 24000 + (index % 8) * 4200;
  const expenses = 14000 + (index % 5) * 2600;
  return {
    month: MONTHS[index % MONTHS.length],
    region: REGIONS[index % REGIONS.length],
    product: PRODUCTS[index % PRODUCTS.length],
    revenue,
    expenses,
    profit: revenue - expenses,
  };
});

const EMPLOYEE_TYPE_INFO: LocalFieldInfo[] = [
  { field: 'name', type: 'string' },
  { field: 'department', type: 'string' },
  { field: 'salary', type: 'currency' },
];

const EMPLOYEE_ROWS: DataRow[] = [
  { name: 'Alice', department: 'Engineering', salary: 125000 },
  { name: 'Bob', department: 'Marketing', salary: 95000 },
  { name: 'Charlie', department: 'Engineering', salary: 140000 },
  { name: 'Diana', department: 'Design', salary: 110000 },
  { name: 'Eve', department: 'Marketing', salary: 88000 },
  { name: 'Frank', department: 'Finance', salary: 132000 },
  { name: 'Grace', department: 'Engineering', salary: 105000 },
  { name: 'Hank', department: 'Finance', salary: 115000 },
];

const GROUP_BY_DEPARTMENT: DataVisNitroGroupField[] = [{ field: 'department' }];

const AVERAGE_SALARY: DataVisNitroAggregate[] = [
  { functionName: 'average', fields: ['salary'] },
];

const meta: Meta<typeof DataVisNitroGrid> = {
  id: 'grids-datavis-nitro-demo-coverage',
  title: 'Components/Grids/DataVis NITRO Demo Coverage',
  component: DataVisNitroGrid,
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: true },
    docs: {
      description: {
        component: `### What it's for

Stress and integration scenarios for DataVis NITRO using deterministic local datasets. These stories cover wide tables, large row counts, shared grid/graph views, sticky containers and other layouts that need more data than the primary component examples.

### Use it when

Validating DataVis NITRO behavior, performance or layout against the standalone demo scenarios.

### Don't use it when

Choosing a production API or learning basic grid setup; start with the primary DataVis NITRO stories instead.

### Example

Open a scenario in Storybook and exercise its controls, scrolling and responsive layout directly.

### Limitations

The scenarios use generated local data and do not model application networking or authorization.

### Related components

See DataVis NITRO for the grid API and DataVis NITRO Graph for chart configuration.`,
      },
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Wide50Columns: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Matches the standalone Wide demo: 20 rows across 50 resizable and reorderable columns. Scroll horizontally, drag headers, or open a header context menu.',
      },
    },
  },
  render: () => (
    <LocalDataset data={WIDE_ROWS} typeInfo={WIDE_TYPE_INFO}>
      <DataVisNitroGrid
        title="Contact Database — 50 Columns"
        columns={WIDE_COLUMNS}
        height="500px"
        features={INTERACTIVE_FEATURES}
      />
    </LocalDataset>
  ),
};

export const Large5000Rows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Matches the standalone Large demo with 5,000 deterministic ledger rows. Use this story to exercise rendering, sorting, filtering, keyboard navigation, and scrolling at production-like volume.',
      },
    },
  },
  render: () => (
    <LocalDataset data={LEDGER_ROWS} typeInfo={LEDGER_TYPE_INFO}>
      <DataVisNitroGrid
        title="Financial Ledger — 5,000 Transactions"
        columns={LEDGER_COLUMNS}
        height="640px"
        features={INTERACTIVE_FEATURES}
      />
    </LocalDataset>
  ),
};

export const ConstrainedStickyContainer: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Matches the standalone Constrained demo: the 5,000-row ledger is held to a 500px table viewport so sticky headers and internal scrolling can be verified.',
      },
    },
  },
  render: () => (
    <LocalDataset data={LEDGER_ROWS} typeInfo={LEDGER_TYPE_INFO}>
      <DataVisNitroGrid
        title="Constrained Container — 500px"
        columns={LEDGER_COLUMNS}
        height="500px"
        features={INTERACTIVE_FEATURES}
      />
    </LocalDataset>
  ),
};

export const GroupedAverageGraph: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Matches the standalone Graph Only demo. Declarative `groupBy` and `aggregates` props configure the shared source to group employees by department and graph average salary without exposing the internal view.',
      },
    },
  },
  render: () => (
    <LocalDataset
      data={EMPLOYEE_ROWS}
      typeInfo={EMPLOYEE_TYPE_INFO}
      groupBy={GROUP_BY_DEPARTMENT}
      aggregates={AVERAGE_SALARY}
    >
      <DataVisNitroGraph
        config={{ chartType: 'bar', xField: 'department' }}
        height="520px"
      />
    </LocalDataset>
  ),
};

function CombinedExplorerDemo() {
  const [graphConfig, setGraphConfig] = useState<
    NonNullable<DataVisNitroGraphProps['config']>
  >({
    chartType: 'bar',
    xField: 'region',
    yFields: ['revenue'],
  });

  return (
    <LocalDataset data={EXPLORER_ROWS} typeInfo={EXPLORER_TYPE_INFO}>
      <div className="space-y-4">
        <DataVisNitroGraph
          config={graphConfig}
          onConfigChange={setGraphConfig}
          height="420px"
        />
        <DataVisNitroGrid
          title="Revenue Explorer"
          columns={EXPLORER_COLUMNS}
          mode="full"
          showControls
          debug
          height="420px"
          features={INTERACTIVE_FEATURES}
        />
      </div>
    </LocalDataset>
  );
}

export const CombinedGraphAndGrid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Matches the primary standalone demo layout: graph controls and a full-featured grid share one source/view, so filters, grouping, pivoting, aggregates, perspectives, and chart exploration can be exercised together.',
      },
    },
  },
  render: () => <CombinedExplorerDemo />,
};
