import type { Meta, StoryObj } from '@storybook/react';
import { InvoiceList } from './InvoiceList';

const meta: Meta<typeof InvoiceList> = {
  title: 'Provider/InvoiceList',
  component: InvoiceList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InvoiceList>;

const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-0001',
    employerName: 'ABC Trucking Company',
    employerId: 'emp-1',
    amount: 1250.0,
    status: 'paid' as const,
    issuedDate: new Date(Date.now() - 30 * 24 * 3600000),
    dueDate: new Date(Date.now() - 15 * 24 * 3600000),
    paidDate: new Date(Date.now() - 10 * 24 * 3600000),
    lineItemCount: 5,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-0002',
    employerName: 'Metro Transit Authority',
    employerId: 'emp-2',
    amount: 3450.0,
    status: 'overdue' as const,
    issuedDate: new Date(Date.now() - 45 * 24 * 3600000),
    dueDate: new Date(Date.now() - 15 * 24 * 3600000),
    lineItemCount: 12,
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-0003',
    employerName: 'City Construction LLC',
    employerId: 'emp-3',
    amount: 875.5,
    status: 'sent' as const,
    issuedDate: new Date(Date.now() - 7 * 24 * 3600000),
    dueDate: new Date(Date.now() + 23 * 24 * 3600000),
    lineItemCount: 3,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-0004',
    employerName: 'Regional Logistics',
    employerId: 'emp-4',
    amount: 560.0,
    status: 'viewed' as const,
    issuedDate: new Date(Date.now() - 5 * 24 * 3600000),
    dueDate: new Date(Date.now() + 25 * 24 * 3600000),
    lineItemCount: 2,
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-0005',
    employerName: 'ABC Trucking Company',
    employerId: 'emp-1',
    amount: 225.0,
    status: 'draft' as const,
    issuedDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 3600000),
    lineItemCount: 1,
  },
];

export const Default: Story = {
  args: {
    invoices: mockInvoices,
    onInvoiceClick: (invoice) => console.log('Clicked:', invoice),
    onCreateInvoice: () => console.log('Create invoice'),
    onSearch: (query) => console.log('Search:', query),
    onFilterStatus: (status) => console.log('Filter:', status),
  },
};

export const Empty: Story = {
  args: {
    invoices: [],
    onCreateInvoice: () => console.log('Create invoice'),
  },
};

export const PaidOnly: Story = {
  args: {
    invoices: mockInvoices.filter((inv) => inv.status === 'paid'),
    statusFilter: 'paid',
    onFilterStatus: (status) => console.log('Filter:', status),
  },
};

export const OverdueHighlighted: Story = {
  args: {
    invoices: mockInvoices,
    statusFilter: 'overdue',
    onFilterStatus: (status) => console.log('Filter:', status),
    onInvoiceClick: (invoice) => console.log('Clicked:', invoice),
  },
};

export const Loading: Story = {
  args: {
    invoices: [],
    isLoading: true,
  },
};

export const ManyInvoices: Story = {
  args: {
    invoices: [
      ...mockInvoices,
      ...mockInvoices.map((inv) => ({
        ...inv,
        id: `${inv.id}-copy`,
        invoiceNumber: inv.invoiceNumber.replace('2024', '2023'),
      })),
    ],
    onInvoiceClick: (invoice) => console.log('Clicked:', invoice),
    onSearch: (query) => console.log('Search:', query),
  },
};

export const Mobile: Story = {
  args: {
    invoices: mockInvoices,
    onInvoiceClick: (invoice) => console.log('Clicked:', invoice),
    onCreateInvoice: () => console.log('Create invoice'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
