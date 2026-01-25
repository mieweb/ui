import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AGGrid, type ColDef } from './AGGrid';
import { Badge } from '../Badge';
import { Button } from '../Button';

// Import cell renderers
import {
  MemoizedAvatarNameRenderer,
  MemoizedStatusBadgeRenderer,
  MemoizedEngagementScoreRenderer,
  MemoizedEmailRenderer,
  MemoizedPhoneRenderer,
  MemoizedLinkedInRenderer,
  MemoizedDomainRenderer,
  MemoizedCurrencyRenderer,
  MemoizedNumberRenderer,
  MemoizedDateRenderer,
  MemoizedBooleanRenderer,
  MemoizedCompanyRenderer,
  MemoizedProgressRenderer,
  MemoizedTagsRenderer,
  statusColors,
} from './CellRenderers';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/agGridQuartzFont.css';
import './ag-grid-theme.css';

// ============================================================================
// Sample Data Types and Data
// ============================================================================

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
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    department: 'Engineering',
    status: 'Active',
    salary: 95000,
    startDate: '2020-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Developer',
    department: 'Engineering',
    status: 'Active',
    salary: 85000,
    startDate: '2021-03-22',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Designer',
    department: 'Design',
    status: 'Inactive',
    salary: 75000,
    startDate: '2019-06-10',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Manager',
    department: 'Product',
    status: 'Active',
    salary: 110000,
    startDate: '2018-11-05',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'Developer',
    department: 'Engineering',
    status: 'Pending',
    salary: 80000,
    startDate: '2024-01-08',
  },
  {
    id: 6,
    name: 'Diana Lee',
    email: 'diana@example.com',
    role: 'QA Engineer',
    department: 'Quality',
    status: 'Active',
    salary: 78000,
    startDate: '2022-07-19',
  },
  {
    id: 7,
    name: 'Edward Chen',
    email: 'edward@example.com',
    role: 'DevOps',
    department: 'Engineering',
    status: 'Active',
    salary: 92000,
    startDate: '2021-09-14',
  },
  {
    id: 8,
    name: 'Fiona Garcia',
    email: 'fiona@example.com',
    role: 'Designer',
    department: 'Design',
    status: 'Pending',
    salary: 72000,
    startDate: '2024-02-01',
  },
];

// Basic column definitions
const basicColumnDefs: ColDef<User>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'email', headerName: 'Email', flex: 1 },
  { field: 'role', headerName: 'Role', flex: 1 },
  { field: 'status', headerName: 'Status', flex: 1 },
];

// ============================================================================
// Helper components for stories that need state
// ============================================================================

function WithRowSelectionComponent() {
  const [selectedRows, setSelectedRows] = React.useState<User[]>([]);

  return (
    <div className="w-full space-y-4">
      <AGGrid<User>
        variant="bordered"
        columnDefs={basicColumnDefs}
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
      <div className="text-muted-foreground text-sm">
        Selected: {selectedRows.length} row(s)
        {selectedRows.length > 0 && (
          <span className="ml-2">
            ({selectedRows.map((r) => r.name).join(', ')})
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
        <div className="bg-muted rounded-lg p-4">
          <p className="font-medium">Clicked Row:</p>
          <p className="text-muted-foreground text-sm">
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
        values: [
          'Admin',
          'Developer',
          'Designer',
          'Manager',
          'QA Engineer',
          'DevOps',
        ],
      },
    },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <div className="w-full space-y-4">
      <p className="text-muted-foreground text-sm">
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

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    height: 400,
    columnDefs: basicColumnDefs as ColDef[],
    rowData: userData,
  },
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
    size: 'md',
    height: 400,
    columnDefs: basicColumnDefs as ColDef[],
    rowData: userData,
  },
};

export const Striped: Story = {
  args: {
    variant: 'striped',
    size: 'md',
    height: 400,
    columnDefs: basicColumnDefs as ColDef[],
    rowData: userData,
  },
};

export const SmallSize: Story = {
  args: {
    variant: 'bordered',
    size: 'sm',
    height: 350,
    columnDefs: basicColumnDefs as ColDef[],
    rowData: userData,
  },
};

export const LargeSize: Story = {
  args: {
    variant: 'bordered',
    size: 'lg',
    height: 450,
    columnDefs: basicColumnDefs as ColDef[],
    rowData: userData,
  },
};

export const Loading: Story = {
  args: {
    variant: 'bordered',
    size: 'md',
    height: 400,
    loading: true,
    columnDefs: basicColumnDefs as ColDef[],
    rowData: [],
  },
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
          const variant =
            params.value === 'Active'
              ? 'success'
              : params.value === 'Inactive'
                ? 'danger'
                : 'warning';
          return <Badge variant={variant}>{params.value}</Badge>;
        },
      },
    ];

    return (
      <div className="w-full">
        <AGGrid
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
          }).format(params.value as number);
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
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'department',
        headerName: 'Department',
        flex: 1,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        filter: 'agTextColumnFilter',
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
          }).format(params.value as number);
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
          <div className="flex h-full items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(params.data)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
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
        story:
          'A comprehensive example showing multiple AG Grid features combined.',
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
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'role',
        headerName: 'Role',
        flex: 1,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'department',
        headerName: 'Department',
        flex: 1,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: { value: string }) => {
          const variant =
            params.value === 'Active'
              ? 'success'
              : params.value === 'Inactive'
                ? 'danger'
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
          }).format(params.value as number);
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

// ============================================================================
// Cell Renderer Showcase Stories
// ============================================================================

// Extended data with more fields for cell renderer demos
interface Contact {
  id: number;
  name: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  company: string;
  domain: string;
  linkedIn?: string;
  status: 'active' | 'inactive' | 'pending' | 'closed_won' | 'closed_lost';
  engagementScore: number;
  dealValue: number;
  lastContact: string;
  isVerified: boolean;
  completionPercent: number;
  tags: string[];
}

const contactData: Contact[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    email: 'sarah.chen@acmecorp.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    domain: 'acmecorp.com',
    linkedIn: 'https://linkedin.com/in/sarahchen',
    status: 'active',
    engagementScore: 87,
    dealValue: 125000,
    lastContact: '2024-12-15T10:30:00Z',
    isVerified: true,
    completionPercent: 75,
    tags: ['Enterprise', 'Decision Maker', 'Hot Lead'],
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    email: 'marcus@globetech.io',
    phone: '5559876543',
    company: 'GlobeTech Industries',
    domain: 'globetech.io',
    linkedIn: 'https://linkedin.com/in/marcusj',
    status: 'pending',
    engagementScore: 62,
    dealValue: 75000,
    lastContact: '2024-12-10T14:22:00Z',
    isVerified: true,
    completionPercent: 45,
    tags: ['Mid-Market', 'Technical'],
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    avatarUrl: 'https://i.pravatar.cc/150?u=emily',
    email: 'e.rodriguez@startup.co',
    phone: '555-234-5678',
    company: 'Innovative Startup',
    domain: 'startup.co',
    status: 'closed_won',
    engagementScore: 95,
    dealValue: 250000,
    lastContact: '2024-12-01T09:15:00Z',
    isVerified: true,
    completionPercent: 100,
    tags: ['Enterprise', 'Champion', 'Expansion'],
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'dkim@enterprise.com',
    phone: '(555) 345-6789',
    company: 'Enterprise Solutions Ltd',
    domain: 'enterprise.com',
    linkedIn: 'https://linkedin.com/in/davidkim',
    status: 'inactive',
    engagementScore: 23,
    dealValue: 50000,
    lastContact: '2024-09-20T16:45:00Z',
    isVerified: false,
    completionPercent: 15,
    tags: ['SMB'],
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    avatarUrl: 'https://i.pravatar.cc/150?u=lisa',
    email: 'lisa.t@techgiant.com',
    phone: '+1-555-456-7890',
    company: 'Tech Giant Inc',
    domain: 'techgiant.com',
    linkedIn: 'https://linkedin.com/in/lisat',
    status: 'closed_lost',
    engagementScore: 41,
    dealValue: 180000,
    lastContact: '2024-11-15T11:30:00Z',
    isVerified: true,
    completionPercent: 60,
    tags: ['Enterprise', 'Lost to Competitor'],
  },
  {
    id: 6,
    name: 'James Wilson',
    email: 'jwilson@newclient.org',
    phone: '5557891234',
    company: 'New Client Organization',
    domain: 'newclient.org',
    status: 'active',
    engagementScore: 78,
    dealValue: 95000,
    lastContact: '2024-12-18T08:00:00Z',
    isVerified: true,
    completionPercent: 55,
    tags: ['Mid-Market', 'New Business'],
  },
];

export const CellRenderersShowcase: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Showcases all the built-in cell renderers available for AG Grid columns.

### Available Renderers:
- **AvatarNameRenderer** - Displays avatar with name
- **StatusBadgeRenderer** - Status pills with configurable colors
- **EngagementScoreRenderer** - Score with progress bar
- **EmailRenderer** - Clickable email links
- **PhoneRenderer** - Formatted phone with click-to-call
- **LinkedInRenderer** - LinkedIn profile links
- **DomainRenderer** - Company website links
- **CurrencyRenderer** - Formatted currency values
- **DateRenderer** - Multiple date formats
- **BooleanRenderer** - Yes/No badges
- **CompanyRenderer** - Company name with favicon
- **ProgressRenderer** - Visual progress bar
- **TagsRenderer** - Array of tag badges
        `,
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<Contact>[] = [
      {
        field: 'name',
        headerName: 'Contact',
        flex: 1.5,
        minWidth: 180,
        cellRenderer: MemoizedAvatarNameRenderer,
        cellRendererParams: {
          avatarField: 'avatarUrl',
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        cellRenderer: MemoizedStatusBadgeRenderer,
        cellRendererParams: {
          statusColors: statusColors,
        },
      },
      {
        field: 'engagementScore',
        headerName: 'Engagement',
        width: 150,
        cellRenderer: MemoizedEngagementScoreRenderer,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.2,
        minWidth: 200,
        cellRenderer: MemoizedEmailRenderer,
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 150,
        cellRenderer: MemoizedPhoneRenderer,
      },
      {
        field: 'dealValue',
        headerName: 'Deal Value',
        width: 130,
        cellRenderer: MemoizedCurrencyRenderer,
      },
    ];

    return (
      <div className="w-full space-y-4">
        <p className="text-muted-foreground text-sm">
          This grid demonstrates Avatar, Status, Engagement, Email, Phone, and
          Currency renderers.
        </p>
        <AGGrid<Contact>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={contactData}
          height={400}
        />
      </div>
    );
  },
};

export const CompanyAndLinksRenderers: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates Company, Domain, LinkedIn, and Tags renderers.',
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<Contact>[] = [
      {
        field: 'name',
        headerName: 'Contact',
        flex: 1,
        minWidth: 150,
        cellRenderer: MemoizedAvatarNameRenderer,
        cellRendererParams: {
          avatarField: 'avatarUrl',
        },
      },
      {
        field: 'company',
        headerName: 'Company',
        flex: 1,
        minWidth: 180,
        cellRenderer: MemoizedCompanyRenderer,
        cellRendererParams: {
          domainField: 'domain',
        },
      },
      {
        field: 'domain',
        headerName: 'Website',
        width: 150,
        cellRenderer: MemoizedDomainRenderer,
      },
      {
        field: 'linkedIn',
        headerName: 'LinkedIn',
        width: 120,
        cellRenderer: MemoizedLinkedInRenderer,
      },
      {
        field: 'tags',
        headerName: 'Tags',
        flex: 1.5,
        minWidth: 200,
        cellRenderer: MemoizedTagsRenderer,
        cellRendererParams: {
          maxVisible: 2,
        },
      },
    ];

    return (
      <div className="w-full space-y-4">
        <p className="text-muted-foreground text-sm">
          Click on domains or LinkedIn icons to open links. Tags overflow is
          handled gracefully.
        </p>
        <AGGrid<Contact>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={contactData}
          height={400}
        />
      </div>
    );
  },
};

export const DateFormatsShowcase: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows different date formatting options: short, medium, long, relative, and datetime.',
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<Contact>[] = [
      {
        field: 'name',
        headerName: 'Contact',
        flex: 1,
        cellRenderer: MemoizedAvatarNameRenderer,
      },
      {
        field: 'lastContact',
        headerName: 'Short',
        width: 110,
        cellRenderer: MemoizedDateRenderer,
        cellRendererParams: { format: 'short' },
      },
      {
        field: 'lastContact',
        headerName: 'Medium',
        width: 130,
        cellRenderer: MemoizedDateRenderer,
        cellRendererParams: { format: 'medium' },
      },
      {
        field: 'lastContact',
        headerName: 'Long',
        width: 170,
        cellRenderer: MemoizedDateRenderer,
        cellRendererParams: { format: 'long' },
      },
      {
        field: 'lastContact',
        headerName: 'Relative',
        width: 120,
        cellRenderer: MemoizedDateRenderer,
        cellRendererParams: { format: 'relative' },
      },
      {
        field: 'lastContact',
        headerName: 'DateTime',
        width: 170,
        cellRenderer: MemoizedDateRenderer,
        cellRendererParams: { format: 'datetime' },
      },
    ];

    return (
      <div className="w-full space-y-4">
        <p className="text-muted-foreground text-sm">
          The DateRenderer supports multiple format options for displaying
          dates.
        </p>
        <AGGrid<Contact>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={contactData}
          height={400}
        />
      </div>
    );
  },
};

export const ProgressAndBooleansShowcase: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates Progress bar and Boolean (Yes/No) renderers.',
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<Contact>[] = [
      {
        field: 'name',
        headerName: 'Contact',
        flex: 1,
        cellRenderer: MemoizedAvatarNameRenderer,
      },
      {
        field: 'company',
        headerName: 'Company',
        flex: 1,
      },
      {
        field: 'completionPercent',
        headerName: 'Progress',
        width: 160,
        cellRenderer: MemoizedProgressRenderer,
        cellRendererParams: {
          showLabel: true,
        },
      },
      {
        field: 'isVerified',
        headerName: 'Verified',
        width: 100,
        cellRenderer: MemoizedBooleanRenderer,
      },
      {
        field: 'engagementScore',
        headerName: 'Engagement Score',
        width: 140,
        cellRenderer: MemoizedNumberRenderer,
        cellRendererParams: {
          suffix: ' pts',
        },
      },
    ];

    return (
      <div className="w-full space-y-4">
        <p className="text-muted-foreground text-sm">
          Progress bars show completion percentage. Boolean values display as
          colored Yes/No badges.
        </p>
        <AGGrid<Contact>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={contactData}
          height={400}
        />
      </div>
    );
  },
};

export const StatusColorsVariations: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows how StatusBadgeRenderer handles different status values with configurable colors.',
      },
    },
  },
  render: () => {
    // Extended status data
    interface StatusDemo {
      id: number;
      name: string;
      status: string;
      priority: string;
      stage: string;
    }

    const statusDemoData: StatusDemo[] = [
      {
        id: 1,
        name: 'Project Alpha',
        status: 'active',
        priority: 'high',
        stage: 'discovery',
      },
      {
        id: 2,
        name: 'Project Beta',
        status: 'pending',
        priority: 'medium',
        stage: 'proposal',
      },
      {
        id: 3,
        name: 'Project Gamma',
        status: 'closed_won',
        priority: 'low',
        stage: 'negotiation',
      },
      {
        id: 4,
        name: 'Project Delta',
        status: 'inactive',
        priority: 'urgent',
        stage: 'closed_won',
      },
      {
        id: 5,
        name: 'Project Epsilon',
        status: 'closed_lost',
        priority: 'high',
        stage: 'closed_lost',
      },
    ];

    // Custom status colors for priority
    const priorityColors = {
      urgent: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        label: 'Urgent',
      },
      high: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        label: 'High',
      },
      medium: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        label: 'Medium',
      },
      low: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        label: 'Low',
      },
    };

    // Stage colors
    const stageColors = {
      discovery: {
        bg: 'bg-secondary-100 dark:bg-secondary-900/30',
        text: 'text-secondary-700 dark:text-secondary-300',
        label: 'Discovery',
      },
      proposal: {
        bg: 'bg-primary-100 dark:bg-primary-900/30',
        text: 'text-primary-700 dark:text-primary-300',
        label: 'Proposal',
      },
      negotiation: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Negotiation',
      },
      closed_won: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Won',
      },
      closed_lost: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        label: 'Lost',
      },
    };

    const columnDefs: ColDef<StatusDemo>[] = [
      { field: 'name', headerName: 'Project', flex: 1 },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        cellRenderer: MemoizedStatusBadgeRenderer,
        cellRendererParams: { statusColors },
      },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 120,
        cellRenderer: MemoizedStatusBadgeRenderer,
        cellRendererParams: { statusColors: priorityColors },
      },
      {
        field: 'stage',
        headerName: 'Stage',
        width: 130,
        cellRenderer: MemoizedStatusBadgeRenderer,
        cellRendererParams: { statusColors: stageColors },
      },
    ];

    return (
      <div className="w-full space-y-4">
        <p className="text-muted-foreground text-sm">
          StatusBadgeRenderer can use different color configurations for
          different columns.
        </p>
        <AGGrid<StatusDemo>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={statusDemoData}
          height={350}
        />
      </div>
    );
  },
};

export const WithFloatingFilters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates floating filters with the themed cell renderers.',
      },
    },
  },
  render: () => {
    const columnDefs: ColDef<Contact>[] = [
      {
        field: 'name',
        headerName: 'Contact',
        flex: 1,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        cellRenderer: MemoizedAvatarNameRenderer,
      },
      {
        field: 'company',
        headerName: 'Company',
        flex: 1,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        cellRenderer: MemoizedCompanyRenderer,
        cellRendererParams: { domainField: 'domain' },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        cellRenderer: MemoizedStatusBadgeRenderer,
        cellRendererParams: { statusColors },
      },
      {
        field: 'engagementScore',
        headerName: 'Engagement',
        width: 150,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        cellRenderer: MemoizedEngagementScoreRenderer,
      },
      {
        field: 'dealValue',
        headerName: 'Deal Value',
        width: 140,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        cellRenderer: MemoizedCurrencyRenderer,
      },
    ];

    return (
      <div className="w-full space-y-4">
        <p className="text-muted-foreground text-sm">
          Type in the filter inputs below each column header to filter the data.
        </p>
        <AGGrid<Contact>
          variant="bordered"
          size="md"
          columnDefs={columnDefs}
          rowData={contactData}
          height={450}
        />
      </div>
    );
  },
};
