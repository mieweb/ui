import type { Meta, StoryObj } from '@storybook/react';
import { InvoiceView } from './InvoiceView';

const meta: Meta<typeof InvoiceView> = {
  title: 'Provider/InvoiceView',
  component: InvoiceView,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InvoiceView>;

const mockInvoice = {
  id: '1',
  invoiceNumber: 'INV-2024-0001',
  status: 'sent' as const,
  issuedDate: new Date(Date.now() - 7 * 24 * 3600000),
  dueDate: new Date(Date.now() + 23 * 24 * 3600000),
  providerName: 'MedCheck Occupational Health',
  providerAddress: '123 Medical Center Dr\nSuite 100\nSpringfield, IL 62701',
  providerPhone: '(555) 123-4567',
  providerEmail: 'billing@medcheck.com',
  employerName: 'ABC Trucking Company',
  employerAddress:
    '456 Industrial Blvd\nWarehouse District\nSpringfield, IL 62702',
  employerEmail: 'accounts@abctrucking.com',
  lineItems: [
    {
      id: '1',
      description: 'DOT Physical Examination',
      employeeName: 'John Smith',
      serviceName: 'DOT Physical',
      date: new Date(Date.now() - 10 * 24 * 3600000),
      quantity: 1,
      unitPrice: 125.0,
      total: 125.0,
    },
    {
      id: '2',
      description: 'DOT Physical Examination',
      employeeName: 'Jane Doe',
      date: new Date(Date.now() - 10 * 24 * 3600000),
      quantity: 1,
      unitPrice: 125.0,
      total: 125.0,
    },
    {
      id: '3',
      description: '5-Panel Drug Screen',
      employeeName: 'John Smith',
      date: new Date(Date.now() - 10 * 24 * 3600000),
      quantity: 1,
      unitPrice: 45.0,
      total: 45.0,
    },
    {
      id: '4',
      description: '5-Panel Drug Screen',
      employeeName: 'Jane Doe',
      date: new Date(Date.now() - 10 * 24 * 3600000),
      quantity: 1,
      unitPrice: 45.0,
      total: 45.0,
    },
    {
      id: '5',
      description: 'Breath Alcohol Test',
      employeeName: 'Mike Johnson',
      date: new Date(Date.now() - 8 * 24 * 3600000),
      quantity: 1,
      unitPrice: 35.0,
      total: 35.0,
    },
  ],
  subtotal: 375.0,
  tax: 0,
  total: 375.0,
  paymentTerms: 'Net 30 - Payment due within 30 days of invoice date.',
  notes: 'Thank you for your business!',
};

export const Default: Story = {
  args: {
    invoice: mockInvoice,
    onBack: () => console.log('Back'),
    onEdit: () => console.log('Edit'),
    onSend: () => console.log('Send'),
    onMarkPaid: () => console.log('Mark Paid'),
    onDownload: () => console.log('Download'),
    onVoid: () => console.log('Void'),
  },
};

export const Draft: Story = {
  args: {
    invoice: { ...mockInvoice, status: 'draft' },
    onBack: () => console.log('Back'),
    onEdit: () => console.log('Edit'),
    onSend: () => console.log('Send'),
    onDownload: () => console.log('Download'),
  },
};

export const Paid: Story = {
  args: {
    invoice: {
      ...mockInvoice,
      status: 'paid',
      paidDate: new Date(Date.now() - 5 * 24 * 3600000),
    },
    onBack: () => console.log('Back'),
    onDownload: () => console.log('Download'),
  },
};

export const Overdue: Story = {
  args: {
    invoice: {
      ...mockInvoice,
      status: 'overdue',
      dueDate: new Date(Date.now() - 15 * 24 * 3600000),
    },
    onBack: () => console.log('Back'),
    onMarkPaid: () => console.log('Mark Paid'),
    onDownload: () => console.log('Download'),
    onVoid: () => console.log('Void'),
  },
};

export const WithTax: Story = {
  args: {
    invoice: {
      ...mockInvoice,
      tax: 28.13,
      taxRate: 7.5,
      total: 403.13,
    },
    onBack: () => console.log('Back'),
    onDownload: () => console.log('Download'),
  },
};

export const WithLogo: Story = {
  args: {
    invoice: mockInvoice,
    providerLogoUrl: 'https://via.placeholder.com/200x48?text=MedCheck',
    onBack: () => console.log('Back'),
    onDownload: () => console.log('Download'),
  },
};

export const Mobile: Story = {
  args: {
    invoice: mockInvoice,
    onBack: () => console.log('Back'),
    onDownload: () => console.log('Download'),
    onMarkPaid: () => console.log('Mark Paid'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
