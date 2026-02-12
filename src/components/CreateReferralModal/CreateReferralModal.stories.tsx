import type { Meta, StoryObj } from '@storybook/react';
import { CreateReferralModal } from './CreateReferralModal';

const mockEmployee = {
  id: 'emp-1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@company.com',
  dateOfBirth: '1985-03-15',
  employeeId: 'EMP-001',
};

const mockServices = [
  {
    id: 'svc-1',
    name: 'DOT Physical',
    price: 125.0,
    description: 'Complete DOT physical examination',
  },
  {
    id: 'svc-2',
    name: 'Drug Screen - 5 Panel',
    price: 45.0,
    description: 'Standard 5-panel urine drug test',
  },
  {
    id: 'svc-3',
    name: 'Drug Screen - 10 Panel',
    price: 65.0,
    description: 'Extended 10-panel urine drug test',
  },
  {
    id: 'svc-4',
    name: 'Breath Alcohol Test',
    price: 35.0,
    description: 'DOT-compliant breath alcohol testing',
  },
  {
    id: 'svc-5',
    name: 'Physical Agility Test',
    price: 85.0,
    description: 'Job-specific physical capability assessment',
  },
];

const meta: Meta<typeof CreateReferralModal> = {
  title: 'Provider/CreateReferralModal',
  component: CreateReferralModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { autoplay: false },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
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
    employee: mockEmployee,
    services: mockServices,
    employerName: 'ABC Trucking Company',
    isSubmitting: false,
  },
  argTypes: {
    open: { control: 'boolean', description: 'Whether the modal is open' },
    onOpenChange: { action: 'onOpenChange' },
    onSubmit: { action: 'onSubmit' },
    employee: { control: 'object', description: 'Employee for the referral' },
    services: {
      control: 'object',
      description: 'Available services to select',
    },
    employerName: { control: 'text', description: 'Employer name' },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether submission is in progress',
    },
    errorMessage: { control: 'text', description: 'Error message to display' },
    currency: { control: 'text', description: 'Currency symbol' },
  },
};

export default meta;
type Story = StoryObj<typeof CreateReferralModal>;

export const Default: Story = {};

export const NoEmployee: Story = {
  args: {
    employee: undefined,
  },
};

export const NoServices: Story = {
  args: {
    services: [],
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const WithError: Story = {
  args: {
    errorMessage: 'Failed to create referral. Please try again.',
  },
};

export const ManyServices: Story = {
  args: {
    services: [
      ...mockServices,
      { id: 'svc-6', name: 'Hearing Test', price: 55.0 },
      { id: 'svc-7', name: 'Vision Test', price: 40.0 },
      { id: 'svc-8', name: 'Pulmonary Function Test', price: 95.0 },
      { id: 'svc-9', name: 'Back Assessment', price: 75.0 },
      { id: 'svc-10', name: 'TB Skin Test', price: 30.0 },
    ],
  },
};
