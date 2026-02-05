import type { Meta, StoryObj } from '@storybook/react';
import { SetupServiceModal } from './SetupServiceModal';

const meta: Meta<typeof SetupServiceModal> = {
  component: SetupServiceModal,
  title: 'Components/SetupServiceModal',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: true,
        iframeHeight: 700,
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="flex min-h-[700px] items-center justify-center p-8"
        style={{ transform: 'translateZ(0)' }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onOpenChange: { action: 'onOpenChange' },
    onSave: { action: 'onSave' },
  },
};

export default meta;
type Story = StoryObj<typeof SetupServiceModal>;

const mockCategories = [
  { id: 'cat-1', name: 'Drug Testing' },
  { id: 'cat-2', name: 'Physical Exams' },
  { id: 'cat-3', name: 'Lab Work' },
  { id: 'cat-4', name: 'Immunizations' },
];

const mockServices = [
  { id: 'svc-1', name: 'DOT Drug Screen - 5 Panel', defaultPrice: 45.0 },
  { id: 'svc-2', name: 'Non-DOT Drug Screen - 10 Panel', defaultPrice: 55.0 },
  { id: 'svc-3', name: 'Pre-Employment Physical', defaultPrice: 75.0 },
  { id: 'svc-4', name: 'Annual Physical', defaultPrice: 65.0 },
  { id: 'svc-5', name: 'TB Test', defaultPrice: 25.0 },
];

export const Default: Story = {
  args: {
    open: true,
    title: 'Add New Service',
    categories: mockCategories,
    availableServices: mockServices,
    showServicePicker: false,
  },
};

export const WithServicePicker: Story = {
  args: {
    open: true,
    title: 'Add Service from Catalog',
    categories: mockCategories,
    availableServices: mockServices,
    showServicePicker: true,
  },
};

export const WithError: Story = {
  args: {
    open: true,
    title: 'Add New Service',
    categories: mockCategories,
    errorMessage: 'A service with this name already exists.',
  },
};

export const Submitting: Story = {
  args: {
    open: true,
    title: 'Add New Service',
    categories: mockCategories,
    isSubmitting: true,
  },
};

export const MinimalForm: Story = {
  args: {
    open: true,
    title: 'Quick Add Service',
  },
};

export const EditMode: Story = {
  args: {
    open: true,
    title: 'Edit Service',
    categories: mockCategories,
  },
};
