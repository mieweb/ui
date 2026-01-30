import type { Meta, StoryObj } from '@storybook/react';
import { InvoicePaymentPage } from './InvoicePaymentPage';

const meta: Meta<typeof InvoicePaymentPage> = {
  title: 'Provider/InvoicePaymentPage',
  component: InvoicePaymentPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InvoicePaymentPage>;

const mockInvoice = {
  invoiceNumber: 'INV-2024-0001',
  status: 'unpaid' as const,
  issuedDate: new Date(Date.now() - 7 * 24 * 3600000),
  dueDate: new Date(Date.now() + 23 * 24 * 3600000),
  providerName: 'MedCheck Occupational Health',
  employerName: 'ABC Trucking Company',
  lineItems: [
    {
      id: '1',
      description: 'DOT Physical - John Smith',
      quantity: 1,
      unitPrice: 125,
      total: 125,
    },
    {
      id: '2',
      description: 'DOT Physical - Jane Doe',
      quantity: 1,
      unitPrice: 125,
      total: 125,
    },
    {
      id: '3',
      description: '5-Panel Drug Screen - John Smith',
      quantity: 1,
      unitPrice: 45,
      total: 45,
    },
    {
      id: '4',
      description: '5-Panel Drug Screen - Jane Doe',
      quantity: 1,
      unitPrice: 45,
      total: 45,
    },
  ],
  subtotal: 340,
  tax: 25.5,
  total: 365.5,
};

export const Default: Story = {
  args: {
    invoice: mockInvoice,
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const WithLogo: Story = {
  args: {
    invoice: {
      ...mockInvoice,
      providerLogoUrl: 'https://via.placeholder.com/150x40?text=MedCheck',
    },
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const Overdue: Story = {
  args: {
    invoice: {
      ...mockInvoice,
      status: 'overdue',
      dueDate: new Date(Date.now() - 15 * 24 * 3600000),
    },
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const CardAndACH: Story = {
  args: {
    invoice: mockInvoice,
    acceptedMethods: ['card', 'ach'],
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const ACHOnly: Story = {
  args: {
    invoice: mockInvoice,
    acceptedMethods: ['ach'],
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const Processing: Story = {
  args: {
    invoice: mockInvoice,
    isProcessing: true,
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const WithError: Story = {
  args: {
    invoice: mockInvoice,
    errorMessage:
      'Your card was declined. Please try a different payment method.',
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
};

export const Paid: Story = {
  args: {
    invoice: {
      ...mockInvoice,
      status: 'paid',
    },
  },
};

export const PaymentSuccess: Story = {
  args: {
    invoice: mockInvoice,
    successMessage:
      'Your payment of $365.50 was successful! A receipt has been sent to your email.',
  },
};

export const NotFound: Story = {
  args: {
    invoice: undefined,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Mobile: Story = {
  args: {
    invoice: mockInvoice,
    onSubmitPayment: (data) => console.log('Payment submitted:', data),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
