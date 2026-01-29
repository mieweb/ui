import type { Meta, StoryObj } from '@storybook/react';
import { OrderCard } from './OrderCard';

const meta: Meta<typeof OrderCard> = {
  title: 'Components/OrderCard',
  component: OrderCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OrderCard>;

const mockEmployee = {
  id: 'emp-1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
};

const mockEmployer = {
  id: 'employer-1',
  name: 'Acme Corporation',
};

const mockServices = [
  { id: 'svc-1', name: 'Drug Screen', price: 45 },
  { id: 'svc-2', name: 'Physical Exam', price: 125 },
];

export const Default: Story = {
  args: {
    id: 'order-1',
    orderNumber: '12345',
    status: 'pending',
    employee: mockEmployee,
    employer: mockEmployer,
    services: mockServices,
    createdAt: new Date(),
    totalAmount: 170,
  },
};

export const PendingWithActions: Story = {
  args: {
    ...Default.args,
    onView: (id) => console.log('View', id),
    onAccept: (id) => console.log('Accept', id),
    onReject: (id) => console.log('Reject', id),
  },
};

export const Active: Story = {
  args: {
    ...Default.args,
    status: 'active',
    onView: (id) => console.log('View', id),
  },
};

export const Scheduled: Story = {
  args: {
    ...Default.args,
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    onView: (id) => console.log('View', id),
  },
};

export const InProgress: Story = {
  args: {
    ...Default.args,
    status: 'in-progress',
    scheduledDate: new Date(),
    onView: (id) => console.log('View', id),
  },
};

export const Completed: Story = {
  args: {
    ...Default.args,
    status: 'completed',
    completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    onView: (id) => console.log('View', id),
  },
};

export const Rejected: Story = {
  args: {
    ...Default.args,
    status: 'rejected',
    rejectionReason: 'Employee no longer with company',
    onView: (id) => console.log('View', id),
  },
};

export const Invoiced: Story = {
  args: {
    ...Default.args,
    status: 'invoiced',
    onView: (id) => console.log('View', id),
  },
};

export const ManyServices: Story = {
  args: {
    ...Default.args,
    services: [
      { id: 'svc-1', name: 'Drug Screen (5 Panel)', price: 45 },
      { id: 'svc-2', name: 'Physical Exam', price: 125 },
      { id: 'svc-3', name: 'Vision Test', price: 35 },
      { id: 'svc-4', name: 'Hearing Test', price: 40 },
      { id: 'svc-5', name: 'TB Test', price: 30 },
    ],
    totalAmount: 275,
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    selected: true,
    onClick: (id) => console.log('Clicked', id),
    onView: (id) => console.log('View', id),
  },
};

export const Clickable: Story = {
  args: {
    ...Default.args,
    onClick: (id) => console.log('Clicked', id),
  },
};

export const OldOrder: Story = {
  args: {
    ...Default.args,
    status: 'completed',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    onView: (id) => console.log('View', id),
  },
};

export const NoEmployer: Story = {
  args: {
    ...Default.args,
    employer: undefined,
  },
};

export const NoPrice: Story = {
  args: {
    id: 'order-1',
    orderNumber: '12345',
    status: 'pending',
    employee: mockEmployee,
    employer: mockEmployer,
    services: [
      { id: 'svc-1', name: 'Drug Screen' },
      { id: 'svc-2', name: 'Physical Exam' },
    ],
    createdAt: new Date(),
    onView: (id) => console.log('View', id),
  },
};
