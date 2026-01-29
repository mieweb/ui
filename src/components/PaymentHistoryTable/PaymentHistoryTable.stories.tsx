import type { Meta, StoryObj } from '@storybook/react';
import { PaymentHistoryTable } from './PaymentHistoryTable';

const meta: Meta<typeof PaymentHistoryTable> = {
  title: 'Provider/PaymentHistoryTable',
  component: PaymentHistoryTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PaymentHistoryTable>;

const mockPayments = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-0001',
    invoiceId: 'inv-1',
    employerName: 'ABC Trucking Company',
    amount: 1250.0,
    method: 'credit_card' as const,
    status: 'completed' as const,
    date: new Date(Date.now() - 5 * 24 * 3600000),
    cardLast4: '4242',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-0002',
    invoiceId: 'inv-2',
    employerName: 'Metro Transit Authority',
    amount: 3450.0,
    method: 'ach' as const,
    status: 'pending' as const,
    date: new Date(Date.now() - 2 * 24 * 3600000),
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-0003',
    invoiceId: 'inv-3',
    employerName: 'City Construction LLC',
    amount: 875.5,
    method: 'credit_card' as const,
    status: 'failed' as const,
    date: new Date(Date.now() - 1 * 24 * 3600000),
    cardLast4: '1234',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2023-0089',
    invoiceId: 'inv-89',
    employerName: 'ABC Trucking Company',
    amount: 560.0,
    method: 'check' as const,
    status: 'completed' as const,
    date: new Date(Date.now() - 30 * 24 * 3600000),
    reference: 'CHK-5678',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2023-0085',
    invoiceId: 'inv-85',
    employerName: 'Regional Logistics',
    amount: 225.0,
    method: 'credit_card' as const,
    status: 'refunded' as const,
    date: new Date(Date.now() - 45 * 24 * 3600000),
    cardLast4: '9999',
  },
];

export const Default: Story = {
  args: {
    payments: mockPayments,
    onPaymentClick: (payment) => console.log('Clicked:', payment),
    onInvoiceClick: (invoiceId) => console.log('Invoice:', invoiceId),
    onRefund: (payment) => console.log('Refund:', payment),
  },
};

export const Empty: Story = {
  args: {
    payments: [],
  },
};

export const WithoutActions: Story = {
  args: {
    payments: mockPayments,
    onPaymentClick: (payment) => console.log('Clicked:', payment),
    onInvoiceClick: (invoiceId) => console.log('Invoice:', invoiceId),
  },
};

export const Loading: Story = {
  args: {
    payments: [],
    isLoading: true,
  },
};

export const AllCompleted: Story = {
  args: {
    payments: mockPayments.map((p) => ({ ...p, status: 'completed' as const })),
    onRefund: (payment) => console.log('Refund:', payment),
  },
};

export const Mobile: Story = {
  args: {
    payments: mockPayments,
    onPaymentClick: (payment) => console.log('Clicked:', payment),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
