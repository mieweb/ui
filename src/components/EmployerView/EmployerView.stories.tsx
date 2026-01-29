import type { Meta, StoryObj } from '@storybook/react';
import {
  EmployerView,
  type EmployerDetails,
} from './EmployerView';

const meta: Meta<typeof EmployerView> = {
  title: 'Provider/EmployerView',
  component: EmployerView,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onEdit: { action: 'edit' },
    onContact: { action: 'contact' },
    onViewOrder: { action: 'view order' },
    onViewInvoice: { action: 'view invoice' },
    onCreateOrder: { action: 'create order' },
    onCreateInvoice: { action: 'create invoice' },
  },
};

export default meta;
type Story = StoryObj<typeof EmployerView>;

const mockEmployer: EmployerDetails = {
  id: 'emp-1',
  name: 'Acme Corporation',
  logoUrl: 'https://placehold.co/200x200/0066CC/FFFFFF?text=A',
  status: 'active',
  linkedDate: new Date('2023-06-15'),
  address: {
    street: '123 Business Park Drive',
    street2: 'Suite 400',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46250',
  },
  contacts: [
    {
      id: 'c1',
      name: 'Jane Smith',
      email: 'jane.smith@acme.com',
      phone: '(317) 555-0123',
      role: 'HR Director',
      isPrimary: true,
    },
    {
      id: 'c2',
      name: 'Bob Johnson',
      email: 'bob.johnson@acme.com',
      phone: '(317) 555-0124',
      role: 'Benefits Coordinator',
    },
    {
      id: 'c3',
      name: 'Sarah Williams',
      email: 'sarah.williams@acme.com',
      role: 'Accounts Payable',
    },
  ],
  recentOrders: [
    {
      id: 'o1',
      orderNumber: 'ORD-2024-001',
      patientName: 'John Doe',
      services: ['DOT Physical', 'Drug Screen'],
      status: 'completed',
      createdDate: new Date('2024-01-10'),
    },
    {
      id: 'o2',
      orderNumber: 'ORD-2024-002',
      patientName: 'Emily Davis',
      services: ['Audiometry'],
      status: 'scheduled',
      createdDate: new Date('2024-01-12'),
      scheduledDate: new Date('2024-01-20'),
    },
    {
      id: 'o3',
      orderNumber: 'ORD-2024-003',
      patientName: 'Michael Brown',
      services: ['Vision Test', 'DOT Physical'],
      status: 'pending',
      createdDate: new Date('2024-01-15'),
    },
  ],
  recentInvoices: [
    {
      id: 'i1',
      invoiceNumber: 'INV-2024-001',
      amount: 2500.0,
      status: 'paid',
      dueDate: new Date('2024-01-15'),
      paidDate: new Date('2024-01-12'),
    },
    {
      id: 'i2',
      invoiceNumber: 'INV-2024-002',
      amount: 1875.5,
      status: 'sent',
      dueDate: new Date('2024-02-01'),
    },
    {
      id: 'i3',
      invoiceNumber: 'INV-2024-003',
      amount: 950.0,
      status: 'overdue',
      dueDate: new Date('2024-01-01'),
    },
  ],
  stats: {
    totalOrders: 47,
    completedOrders: 42,
    pendingOrders: 5,
    totalRevenue: 28500.0,
    outstandingBalance: 2825.5,
  },
};

export const Default: Story = {
  args: {
    employer: mockEmployer,
  },
};

export const WithoutLogo: Story = {
  args: {
    employer: {
      ...mockEmployer,
      logoUrl: undefined,
    },
  },
};

export const InactiveEmployer: Story = {
  args: {
    employer: {
      ...mockEmployer,
      status: 'inactive',
    },
  },
};

export const PendingEmployer: Story = {
  args: {
    employer: {
      ...mockEmployer,
      status: 'pending',
    },
  },
};

export const NoOrders: Story = {
  args: {
    employer: {
      ...mockEmployer,
      recentOrders: [],
      stats: {
        ...mockEmployer.stats!,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
      },
    },
  },
};

export const NoInvoices: Story = {
  args: {
    employer: {
      ...mockEmployer,
      recentInvoices: [],
      stats: {
        ...mockEmployer.stats!,
        totalRevenue: 0,
        outstandingBalance: 0,
      },
    },
  },
};

export const SingleContact: Story = {
  args: {
    employer: {
      ...mockEmployer,
      contacts: [mockEmployer.contacts[0]],
    },
  },
};

export const NoAddress: Story = {
  args: {
    employer: {
      ...mockEmployer,
      address: undefined,
    },
  },
};

export const NoStats: Story = {
  args: {
    employer: {
      ...mockEmployer,
      stats: undefined,
    },
  },
};

export const OrdersTab: Story = {
  args: {
    employer: mockEmployer,
    defaultTab: 'orders',
  },
};

export const InvoicesTab: Story = {
  args: {
    employer: mockEmployer,
    defaultTab: 'invoices',
  },
};

export const ContactsTab: Story = {
  args: {
    employer: mockEmployer,
    defaultTab: 'contacts',
  },
};

export const Loading: Story = {
  args: {
    employer: mockEmployer,
    isLoading: true,
  },
};

export const Mobile: Story = {
  args: {
    employer: mockEmployer,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
