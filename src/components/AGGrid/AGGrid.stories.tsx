import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AGGrid, type ColDef } from './AGGrid';
import { Badge } from '../Badge';
import { Button } from '../Button';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import './ag-grid-theme.css';

// Helper components for stories that need state
function WithRowSelectionComponent() {
  const [selectedRows, setSelectedRows] = React.useState<User[]>([]);

  const columnDefs: ColDef<User>[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <div className="w-full space-y-4">
      <AGGrid<User>
        variant="bordered"
        columnDefs={columnDefs}
        rowData={userData}
        height={350}
        rowSelection={{
          mode: 'multiRow',
          checkboxes: true,
          headerCheckbox: true,
          enableClickSelection: true,
        }}
        onSelectionChanged={(event) => {
          setSelectedRows(event.api.getSelectedRows());
        }}
      />
      <div className="text-sm text-muted-foreground">
        Selected: {selectedRows.length} row(s)
        {selectedRows.length > 0 && (
          <span className="ml-2">
            ({selectedRows.map(r => r.name).join(', ')})
          </span>
        )}
      </div>
    </div>
  );
}

function WithRowClickComponent() {
  const [clickedRow, setClickedRow] = React.useState<User | null>(null);

  return (
    <div className="w-full space-y-4">
      <AGGrid<User>
        variant="bordered"
        columnDefs={basicColumnDefs}
        rowData={userData}
        height={350}
        onRowClick={(event) => {
          setClickedRow(event.data ?? null);
        }}
      />
      {clickedRow && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">Clicked Row:</p>
          <p className="text-sm text-muted-foreground">
            {clickedRow.name} - {clickedRow.email} ({clickedRow.role})
          </p>
        </div>
      )}
    </div>
  );
}

function WithEditableCellsComponent() {
  const [rowData, setRowData] = React.useState(userData);

  const columnDefs: ColDef<User>[] = [
    { field: 'name', headerName: 'Name', flex: 1, editable: true },
    { field: 'email', headerName: 'Email', flex: 1, editable: true },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 1, 
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Admin', 'Developer', 'Designer', 'Manager', 'QA Engineer', 'DevOps'],
      },
    },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-muted-foreground">
        Double-click a cell in the Name, Email, or Role columns to edit.
      </p>
      <AGGrid<User>
        variant="bordered"
        columnDefs={columnDefs}
        rowData={rowData}
        height={400}
        onCellValueChanged={(event) => {
          const updatedData = rowData.map((row) =>
            row.id === event.data?.id ? event.data : row
          );
          setRowData(updatedData);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof AGGrid> = {
  title: 'Components/AGGrid',
  component: AGGrid,
  parameters: {
    layout: 'padded',
    // Disable Storybook's animation waiting which conflicts with AG Grid
    chromatic: { disableSnapshot: true },
    docs: {
      story: {
        autoplay: false,
      },
      description: {
        component: `
A themed AG Grid wrapper component that integrates with the MIE Web UI design system.

## Features
- **Theming**: Automatically inherits colors and styles from the MIE Web UI theme
- **Size variants**: Small, medium, and large row densities
- **Visual variants**: Default, bordered, and striped styles
- **Loading states**: Built-in loading overlay support
- **Full AG Grid API**: Access all AG Grid features through the wrapper

## Installation
AG Grid must be installed separately:
\`\`\`bash
npm install ag-grid-community ag-grid-react
\`\`\`

## Basic Usage
\`\`\`tsx
import { AGGrid } from '@mieweb/ui';
import 'ag-grid-community/styles/ag-grid.css';

const columnDefs = [
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
];

const rowData = [
  { name: 'John Doe', email: 'john@example.com' },
];

<AGGrid columnDefs={columnDefs} rowData={rowData} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'striped'],
      description: 'Visual variant of the grid',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size/density of the grid rows',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    height: {
      control: 'text',
      description: 'Height of the grid container',
      table: {
        defaultValue: { summary: '400' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data types
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending';
  salary: number;
  startDate: string;
}

// Sample data
const userData: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', department: 'Engineering', status: 'Active', salary: 95000, startDate: '2020-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Developer', department: 'Engineering', status: 'Active', salary: 85000, startDate: '2021-03-22' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Designer', department: 'Design', status: 'Inactive', salary: 75000, startDate: '2019-06-10' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Manager', department: 'Product', status: 'Active', salary: 110000, startDate: '2018-11-05' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Developer', department: 'Engineering', status: 'Pending', salary: 80000, startDate: '2024-01-08' },
  { id: 6, name: 'Diana Lee', email: 'diana@example.com', role: 'QA Engineer', department: 'Quality', status: 'Active', salary: 78000, startDate: '2022-07-19' },
  { id: 7, name: 'Edward Chen', email: 'edward@example.com', role: 'DevOps', department: 'Engineering', status: 'Active', salary: 92000, startDate: '2021-09-14' },
  { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', role: 'Designer', department: 'Design', status: 'Pending', salary: 72000, startDate: '2024-02-01' },
];

// Basic column definitions
const basicColumnDefs: ColDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1 },
  { field: 'role', headerName: 'Role', flex: 1 },
  { field: 'status', headerName: 'Status', flex: 1 },
];

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    height: 400,
  },
  render: (args) => (
    <div className="w-full">
      <AGGrid<User>
        {...args}
        columnDefs={basicColumnDefs}
        rowData={userData}
      />
    </div>
  ),
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
    size: 'md',
    height: 400,
  },
  render: (args) => (
    <div className="w-full">
      <AGGrid<User>
        {...args}
        columnDefs={basicColumnDefs}
        rowData={userData}
      />
    </div>
  ),
};

export const Striped: Story = {
  args: {
    variant: 'striped',
    size: 'md',
    height: 400,
  },
  render: (args) => (
    <div className="w-full">
      <AGGrid<User>
        {...args}
        columnDefs={basicColumnDefs}
        rowData={userData}
      />
    </div>
  ),
};

export const SmallSize: Story = {
  args: {
    variant: 'bordered',
    size: 'sm',
    height: 350,
  },
  render: (args) => (
    <div className="w-full">
      <AGGrid<User>
        {...args}
        columnDefs={basicColumnDefs}
        rowData={userData}
      />
    </div>
  ),
};

export const LargeSize: Story = {
  args: {
    variant: 'bordered',
    size: 'lg',
    height: 450,
  },
  render: (args) => (
    <div className="w-full">
      <AGGrid<User>
        {...args}
        columnDefs={basicColumnDefs}
        rowData={userData}
      />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    variant: 'bordered',
    size: 'md',
    height: 400,
    loading: true,
  },
  render: (args) => (
    <div className="w-full">
      <AGGrid<User>
        {...args}
        columnDefs={basicColumnDefs}
        rowData={[]}
      />
    </div>
  ),
};

export const WithCustomCellRenderers: Story = {
  render: () => {
    const columnDefs: ColDef<User>[] = [
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1 },
      { field: 'role', headerName: 'Role', flex: 1 },
      { field: 'department', headerName: 'Department', flex: 1 },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        cellRenderer: (params: { value: string }) => {
          const variant = params.value === 'Active' 
            ? 'success' 
            : params.value === 'Inactive' 
              ? 'destructive' 
              : 'warning';
          return <Badge variant={variant}>{params.value}</Badge>;
        },
      },
    ];

    return (
      <div className="w-full">
        <AGGrid<User>
          variant="bordered"
          columnDefs={columnDefs}
          rowData={userData}
          height={400}
        />
      </div>
    );
  },
};

export const WithPagination: Story = {
  render: () => (
    <div className="w-full">
      <AGGrid<User>
        variant="bordered"
        columnDefs={basicColumnDefs}
        rowData={userData}
        height={350}
        pagination={true}
        paginationPageSize={5}
        paginationPageSizeSelector={[5, 10, 20]}
      />
    </div>
  ),
};

export const WithSorting: Story = {
  render: () => {
    const columnDefs: ColDef<User>[] = [
      { field: 'name', headerName: 'Name', flex: 1, sort: 'asc' },
      { field: 'email', headerName: 'Email', flex: 1 },
      { 
        field: 'salary', 
        headerName: 'Salary', 
        flex: 1,
        valueFormatter: (params) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(params.value);
        },
      },
      { field: 'startDate', headerName: 'Start Date', flex: 1 },
    ];

    return (
      <div className="w-full">
        <AGGrid<User>
          variant="bordered"
          columnDefs={columnDefs}
          rowData={userData}
          height={400}
        />
      </div>
    );
  },
};

export const WithFiltering: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Click on a column header menu to access filtering options.',
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<User>[] = [
      { field: 'name', headerName: 'Name', flex: 1, filter: 'agTextColumnFilter' },
      { field: 'email', headerName: 'Email', flex: 1, filter: 'agTextColumnFilter' },
      { field: 'department', headerName: 'Department', flex: 1, filter: 'agTextColumnFilter' },
      { field: 'status', headerName: 'Status', flex: 1, filter: 'agTextColumnFilter' },
      { 
        field: 'salary', 
        headerName: 'Salary', 
        flex: 1, 
        filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(params.value);
        },
      },
    ];

    return (
      <div className="w-full">
        <AGGrid<User>
          variant="bordered"
          columnDefs={columnDefs}
          rowData={userData}
          height={400}
        />
      </div>
    );
  },
};

export const WithRowSelection: Story = {
  render: () => <WithRowSelectionComponent />,
};

export const WithRowClick: Story = {
  render: () => <WithRowClickComponent />,
};

export const WithEditableCells: Story = {
  render: () => <WithEditableCellsComponent />,
};

export const WithActionColumn: Story = {
  render: () => {
    const handleEdit = (user: User) => {
      window.alert(`Edit user: ${user.name}`);
    };

    const handleDelete = (user: User) => {
      window.alert(`Delete user: ${user.name}`);
    };

    const columnDefs: ColDef<User>[] = [
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1 },
      { field: 'role', headerName: 'Role', flex: 1 },
      {
        headerName: 'Actions',
        width: 200,
        cellRenderer: (params: { data: User }) => (
          <div className="flex items-center gap-2 h-full">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(params.data)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(params.data)}
            >
              Delete
            </Button>
          </div>
        ),
        sortable: false,
        filter: false,
      },
    ];

    return (
      <div className="w-full">
        <AGGrid<User>
          variant="bordered"
          columnDefs={columnDefs}
          rowData={userData}
          height={400}
        />
      </div>
    );
  },
};

export const EmptyState: Story = {
  render: () => (
    <div className="w-full">
      <AGGrid<User>
        variant="bordered"
        columnDefs={basicColumnDefs}
        rowData={[]}
        height={300}
        overlayNoRowsTemplate="<span class='text-muted-foreground'>No data available</span>"
      />
    </div>
  ),
};

export const FullFeatured: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A comprehensive example showing multiple AG Grid features combined.',
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<User>[] = [
      { 
        field: 'name', 
        headerName: 'Name', 
        flex: 1, 
        filter: 'agTextColumnFilter',
        pinned: 'left',
      },
      { field: 'email', headerName: 'Email', flex: 1, filter: 'agTextColumnFilter' },
      { field: 'role', headerName: 'Role', flex: 1, filter: 'agTextColumnFilter' },
      { field: 'department', headerName: 'Department', flex: 1, filter: 'agTextColumnFilter' },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: { value: string }) => {
          const variant = params.value === 'Active' 
            ? 'success' 
            : params.value === 'Inactive' 
              ? 'destructive' 
              : 'warning';
          return <Badge variant={variant}>{params.value}</Badge>;
        },
      },
      { 
        field: 'salary', 
        headerName: 'Salary', 
        flex: 1, 
        filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(params.value);
        },
      },
      { 
        field: 'startDate', 
        headerName: 'Start Date', 
        flex: 1,
        filter: 'agDateColumnFilter',
      },
    ];

    return (
      <div className="w-full">
        <AGGrid<User>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={userData}
          height={450}
          pagination={true}
          paginationPageSize={5}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true,
            enableClickSelection: true,
          }}
        />
      </div>
    );
  },
};
