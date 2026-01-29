import type { Meta, StoryObj } from '@storybook/react';
import { CreateInvoiceModal } from './CreateInvoiceModal';

const meta: Meta<typeof CreateInvoiceModal> = {
  title: 'Provider/CreateInvoiceModal',
  component: CreateInvoiceModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CreateInvoiceModal>;

const mockEmployers = [
  { id: 'emp-1', name: 'ABC Trucking Company' },
  { id: 'emp-2', name: 'Metro Transit Authority' },
  { id: 'emp-3', name: 'City Construction LLC' },
  { id: 'emp-4', name: 'Regional Logistics' },
];

const mockOrders = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-2024-0001',
    employeeName: 'John Smith',
    serviceName: 'DOT Physical',
    date: new Date(Date.now() - 10 * 24 * 3600000),
    amount: 125.0,
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-2024-0002',
    employeeName: 'Jane Doe',
    serviceName: 'DOT Physical',
    date: new Date(Date.now() - 10 * 24 * 3600000),
    amount: 125.0,
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-2024-0003',
    employeeName: 'John Smith',
    serviceName: '5-Panel Drug Screen',
    date: new Date(Date.now() - 10 * 24 * 3600000),
    amount: 45.0,
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-2024-0004',
    employeeName: 'Jane Doe',
    serviceName: '5-Panel Drug Screen',
    date: new Date(Date.now() - 10 * 24 * 3600000),
    amount: 45.0,
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-2024-0005',
    employeeName: 'Mike Johnson',
    serviceName: 'Breath Alcohol Test',
    date: new Date(Date.now() - 8 * 24 * 3600000),
    amount: 35.0,
  },
];

export const Step1SelectEmployer: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employers: mockEmployers,
    onEmployerChange: (id) => console.log('Employer selected:', id),
    onSubmit: (data) => console.log('Submit:', data),
  },
};

export const Step2SelectOrders: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employers: mockEmployers,
    orders: mockOrders,
    onEmployerChange: (id) => console.log('Employer selected:', id),
    onSubmit: (data) => console.log('Submit:', data),
  },
};

export const LoadingOrders: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employers: mockEmployers,
    isLoadingOrders: true,
    onEmployerChange: (id) => console.log('Employer selected:', id),
  },
};

export const NoOrders: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employers: mockEmployers,
    orders: [],
  },
};

export const WithError: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employers: mockEmployers,
    orders: mockOrders,
    errorMessage: 'Failed to create invoice. Please try again.',
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employers: mockEmployers,
    orders: mockOrders,
    isSubmitting: true,
  },
};
