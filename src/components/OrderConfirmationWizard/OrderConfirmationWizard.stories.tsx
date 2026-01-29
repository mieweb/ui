import type { Meta, StoryObj } from '@storybook/react';
import { OrderConfirmationWizard } from './OrderConfirmationWizard';

const meta: Meta<typeof OrderConfirmationWizard> = {
  title: 'Provider/OrderConfirmationWizard',
  component: OrderConfirmationWizard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrderConfirmationWizard>;

const mockOrder = {
  id: 'ord-1',
  orderNumber: 'ORD-2024-0001',
  employeeName: 'John Smith',
  dateOfBirth: '1985-03-15',
  serviceName: 'DOT Physical Examination',
  employerName: 'ABC Trucking Company',
  scheduledDate: new Date(),
  notes: 'Annual renewal exam',
};

export const Step1VerifyEmployee: Story = {
  args: {
    order: mockOrder,
    initialStep: 1,
    onComplete: (result) => console.log('Complete:', result),
    onCancel: () => console.log('Cancel'),
    onStepChange: (step) => console.log('Step:', step),
  },
};

export const Step2ConsentAndID: Story = {
  args: {
    order: mockOrder,
    initialStep: 2,
    onComplete: (result) => console.log('Complete:', result),
    onCancel: () => console.log('Cancel'),
  },
};

export const Step3Confirmation: Story = {
  args: {
    order: mockOrder,
    initialStep: 3,
    onComplete: (result) => console.log('Complete:', result),
    onCancel: () => console.log('Cancel'),
  },
};

export const NoDOB: Story = {
  args: {
    order: { ...mockOrder, dateOfBirth: undefined },
    initialStep: 1,
    onComplete: (result) => console.log('Complete:', result),
  },
};

export const NoScheduledDate: Story = {
  args: {
    order: { ...mockOrder, scheduledDate: undefined },
    initialStep: 1,
    onComplete: (result) => console.log('Complete:', result),
  },
};

export const CustomStepTitles: Story = {
  args: {
    order: mockOrder,
    stepTitles: ['Check Identity', 'Get Consent', 'Complete'],
    onComplete: (result) => console.log('Complete:', result),
  },
};

export const Submitting: Story = {
  args: {
    order: mockOrder,
    initialStep: 3,
    isSubmitting: true,
    onComplete: (result) => console.log('Complete:', result),
  },
};

export const Mobile: Story = {
  args: {
    order: mockOrder,
    initialStep: 1,
    onComplete: (result) => console.log('Complete:', result),
    onCancel: () => console.log('Cancel'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
