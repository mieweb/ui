import type { Meta, StoryObj } from '@storybook/react';
import { CreateInvoiceModal } from './CreateInvoiceModal';

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

const meta: Meta<typeof CreateInvoiceModal> = {
  title: 'Provider/CreateInvoiceModal',
  component: CreateInvoiceModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Container with transform creates a new containing block for position:fixed
      // This keeps the modal within this container in docs view
      <div
        className="bg-background flex min-h-[900px] items-center justify-center p-4"
        style={{ transform: 'translateZ(0)' }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    open: true,
    employers: mockEmployers,
    orders: mockOrders,
    isLoadingOrders: false,
    isSubmitting: false,
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onOpenChange: { action: 'onOpenChange' },
    onSubmit: { action: 'onSubmit' },
    onEmployerChange: { action: 'onEmployerChange' },
    employers: {
      control: 'object',
      description: 'Available employers',
    },
    orders: {
      control: 'object',
      description: 'Available orders (filtered by selected employer)',
    },
    isLoadingOrders: {
      control: 'boolean',
      description: 'Whether orders are loading',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether submission is in progress',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
    },
    currency: {
      control: 'text',
      description: 'Currency symbol',
    },
    defaultDueDays: {
      control: 'number',
      description: 'Default due date offset in days',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CreateInvoiceModal>;

export const Step1SelectEmployer: Story = {};

export const Step2SelectOrders: Story = {
  args: {
    initialStep: 2,
    initialEmployerId: 'emp-1',
    orders: mockOrders,
  },
};

export const LoadingOrders: Story = {
  args: {
    initialStep: 2,
    initialEmployerId: 'emp-1',
    isLoadingOrders: true,
  },
};

export const NoOrders: Story = {
  args: {
    initialStep: 2,
    initialEmployerId: 'emp-1',
    orders: [],
  },
};

export const WithError: Story = {
  args: {
    initialStep: 2,
    initialEmployerId: 'emp-1',
    orders: mockOrders,
    errorMessage: 'Failed to create invoice. Please try again.',
  },
};

export const Submitting: Story = {
  args: {
    initialStep: 3,
    initialEmployerId: 'emp-1',
    orders: mockOrders,
    isSubmitting: true,
  },
};
