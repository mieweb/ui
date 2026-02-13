import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AGGrid,
  EnhancedAvatarNameRenderer,
  EnhancedStatusBadgeRenderer,
  EnhancedActionsRenderer,
  EnhancedBooleanRenderer,
  EnhancedCurrencyRenderer,
  EnhancedDateRenderer,
  EnhancedProgressRenderer,
  EnhancedTagsRenderer,
} from './index-enhanced';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/agGridQuartzFont.css';
import './ag-grid-theme.css';

// ============================================================================
// Sample Data
// ============================================================================

interface Employee {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  salary: number;
  startDate: string;
  isManager: boolean;
  progress: number;
  skills: string[];
}

const sampleEmployees: Employee[] = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@company.com',
    department: 'Engineering',
    role: 'Senior Developer',
    status: 'Active',
    salary: 95000,
    startDate: '2022-01-15',
    isManager: true,
    progress: 87,
    skills: ['React', 'TypeScript', 'Node.js'],
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    department: 'Design',
    role: 'UX Designer',
    status: 'Active',
    salary: 78000,
    startDate: '2021-06-10',
    isManager: false,
    progress: 92,
    skills: ['Figma', 'User Research', 'Prototyping'],
  },
  {
    id: 3,
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    department: 'Engineering',
    role: 'Junior Developer',
    status: 'Pending',
    salary: 65000,
    startDate: '2023-03-20',
    isManager: false,
    progress: 45,
    skills: ['JavaScript', 'CSS', 'HTML'],
  },
];

// ============================================================================
// Column Definitions
// ============================================================================

const enhancedColumnDefs: Record<string, unknown>[] = [
  {
    headerName: 'Employee',
    field: 'name',
    cellRenderer: EnhancedAvatarNameRenderer,
    minWidth: 200,
    flex: 1,
  },
  {
    headerName: 'Department',
    field: 'department',
    minWidth: 120,
  },
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: EnhancedStatusBadgeRenderer,
    minWidth: 100,
    width: 100,
  },
  {
    headerName: 'Salary',
    field: 'salary',
    cellRenderer: EnhancedCurrencyRenderer,
    cellRendererParams: { currency: 'USD' },
    minWidth: 120,
    width: 120,
  },
  {
    headerName: 'Start Date',
    field: 'startDate',
    cellRenderer: EnhancedDateRenderer,
    cellRendererParams: { format: 'medium' },
    minWidth: 120,
    width: 120,
  },
  {
    headerName: 'Manager',
    field: 'isManager',
    cellRenderer: EnhancedBooleanRenderer,
    minWidth: 100,
    width: 100,
  },
  {
    headerName: 'Progress',
    field: 'progress',
    cellRenderer: EnhancedProgressRenderer,
    minWidth: 150,
  },
  {
    headerName: 'Skills',
    field: 'skills',
    cellRenderer: EnhancedTagsRenderer,
    minWidth: 200,
    flex: 1,
  },
  {
    headerName: 'Actions',
    colId: 'actions',
    cellRenderer: EnhancedActionsRenderer,
    cellRendererParams: {
      showEdit: true,
      showDelete: true,
      showView: true,
      onEdit: (data: Employee) => console.log('Edit:', data),
      onDelete: (data: Employee) => console.log('Delete:', data),
      onView: (data: Employee) => console.log('View:', data),
    },
    minWidth: 120,
    width: 120,
    sortable: false,
    filter: false,
    pinned: 'right',
  },
];

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof AGGrid> = {
  title: 'Data Display/AGGrid/Enhanced',
  component: AGGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Enhanced AG Grid with Full Design System Integration

This enhanced version provides multi-brand support, design system integration, and advanced features.

## Features
- Multi-brand theming support
- Enhanced cell renderers using design system components
- Responsive design with mobile optimizations
- Accessibility improvements
- Brand-aware styling utilities
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    brand: {
      control: { type: 'select' },
      options: [
        'default',
        'mieweb',
        'bluehive',
        'waggleline',
        'webchart',
        'enterprise-health',
      ],
      description: 'Brand theme to apply',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'bordered', 'striped', 'card'],
      description: 'Visual variant of the grid',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size/density of the grid rows',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AGGrid>;

// ============================================================================
// Stories
// ============================================================================

export const Enhanced: Story = {
  args: {
    columnDefs: enhancedColumnDefs,
    rowData: sampleEmployees,
    height: 500,
    variant: 'bordered',
    size: 'md',
    brand: 'mieweb',
    pagination: false,
    loading: false,
  },
};

export const WithPagination: Story = {
  args: {
    ...Enhanced.args,
    pagination: true,
  },
};

export const CompactSize: Story = {
  args: {
    ...Enhanced.args,
    size: 'sm',
    variant: 'striped',
  },
};

export const CardVariant: Story = {
  args: {
    ...Enhanced.args,
    variant: 'card',
    size: 'lg',
  },
};

export const LoadingState: Story = {
  args: {
    ...Enhanced.args,
    loading: true,
    rowData: [],
  },
};
