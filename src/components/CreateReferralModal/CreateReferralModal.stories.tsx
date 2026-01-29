import type { Meta, StoryObj } from '@storybook/react';
import { CreateReferralModal } from './CreateReferralModal';

const meta: Meta<typeof CreateReferralModal> = {
  title: 'Provider/CreateReferralModal',
  component: CreateReferralModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CreateReferralModal>;

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

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: (data) => console.log('Submit:', data),
    employee: mockEmployee,
    services: mockServices,
    employerName: 'ABC Trucking Company',
  },
};

export const NoEmployee: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    services: mockServices,
  },
};

export const NoServices: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employee: mockEmployee,
    services: [],
    employerName: 'ABC Trucking Company',
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employee: mockEmployee,
    services: mockServices,
    employerName: 'ABC Trucking Company',
    isSubmitting: true,
  },
};

export const WithError: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employee: mockEmployee,
    services: mockServices,
    employerName: 'ABC Trucking Company',
    errorMessage: 'Failed to create referral. Please try again.',
  },
};

export const ManyServices: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    employee: mockEmployee,
    services: [
      ...mockServices,
      { id: 'svc-6', name: 'Hearing Test', price: 55.0 },
      { id: 'svc-7', name: 'Vision Test', price: 40.0 },
      { id: 'svc-8', name: 'Pulmonary Function Test', price: 95.0 },
      { id: 'svc-9', name: 'Back Assessment', price: 75.0 },
      { id: 'svc-10', name: 'TB Skin Test', price: 30.0 },
    ],
    employerName: 'ABC Trucking Company',
  },
};
