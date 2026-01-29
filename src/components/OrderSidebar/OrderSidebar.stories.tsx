import type { Meta, StoryObj } from '@storybook/react';
import { OrderSidebar } from './OrderSidebar';

const meta: Meta<typeof OrderSidebar> = {
  component: OrderSidebar,
  title: 'Components/OrderSidebar',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onClose: { action: 'onClose' },
  },
};

export default meta;
type Story = StoryObj<typeof OrderSidebar>;

export const Default: Story = {
  args: {
    open: true,
    orderId: 'ORD-2024-001',
    status: 'Pending',
    patientName: 'John Smith',
    employerName: 'Acme Corporation',
    serviceName: 'DOT Drug Screen - 5 Panel',
    createdAt: new Date('2024-01-15'),
    scheduledDate: new Date('2024-01-20'),
    priority: 'normal',
    notes: 'Patient requested morning appointment.',
    actions: [
      { id: '1', label: 'Accept', onClick: () => {} },
      { id: '2', label: 'Reject', onClick: () => {}, variant: 'outline' },
    ],
  },
};

export const UrgentOrder: Story = {
  args: {
    open: true,
    orderId: 'ORD-2024-002',
    status: 'In Progress',
    patientName: 'Jane Doe',
    employerName: 'Tech Solutions Inc',
    serviceName: 'Pre-Employment Physical',
    createdAt: new Date('2024-01-16'),
    scheduledDate: new Date('2024-01-17'),
    priority: 'urgent',
    actions: [
      { id: '1', label: 'Complete', onClick: () => {} },
      { id: '2', label: 'View Details', onClick: () => {}, variant: 'outline' },
    ],
  },
};

export const StatOrder: Story = {
  args: {
    open: true,
    orderId: 'ORD-2024-003',
    status: 'Pending',
    patientName: 'Bob Wilson',
    employerName: 'Emergency Services LLC',
    serviceName: 'Post-Accident Drug Screen',
    createdAt: new Date(),
    priority: 'stat',
    notes: 'URGENT: Post-accident screening required immediately.',
    actions: [
      { id: '1', label: 'Process Now', onClick: () => {} },
    ],
  },
};

export const CompletedOrder: Story = {
  args: {
    open: true,
    orderId: 'ORD-2024-004',
    status: 'Completed',
    patientName: 'Alice Johnson',
    employerName: 'Healthcare Partners',
    serviceName: 'Annual Physical',
    createdAt: new Date('2024-01-10'),
    scheduledDate: new Date('2024-01-12'),
    actions: [
      { id: '1', label: 'View Results', onClick: () => {}, variant: 'outline' },
      { id: '2', label: 'Print', onClick: () => {}, variant: 'secondary' },
    ],
  },
};

export const CancelledOrder: Story = {
  args: {
    open: true,
    orderId: 'ORD-2024-005',
    status: 'Cancelled',
    patientName: 'Charlie Brown',
    employerName: 'Peanuts Inc',
    serviceName: 'TB Test',
    createdAt: new Date('2024-01-08'),
    notes: 'Patient did not show up for appointment.',
    actions: [
      { id: '1', label: 'Reschedule', onClick: () => {}, variant: 'outline' },
    ],
  },
};

export const MinimalInfo: Story = {
  args: {
    open: true,
    orderId: 'ORD-2024-006',
    status: 'Pending',
    serviceName: 'Drug Screen',
  },
};
