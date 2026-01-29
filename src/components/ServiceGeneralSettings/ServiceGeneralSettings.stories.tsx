import type { Meta, StoryObj } from '@storybook/react';
import { ServiceGeneralSettings } from './ServiceGeneralSettings';

const meta: Meta<typeof ServiceGeneralSettings> = {
  component: ServiceGeneralSettings,
  title: 'Components/ServiceGeneralSettings',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onNameChange: { action: 'onNameChange' },
    onDescriptionChange: { action: 'onDescriptionChange' },
    onServiceCodeChange: { action: 'onServiceCodeChange' },
    onCategoryChange: { action: 'onCategoryChange' },
    onBasePriceChange: { action: 'onBasePriceChange' },
    onIsActiveChange: { action: 'onIsActiveChange' },
    onIsFeaturedChange: { action: 'onIsFeaturedChange' },
    onTurnaroundDaysChange: { action: 'onTurnaroundDaysChange' },
    onCptCodeChange: { action: 'onCptCodeChange' },
    onSave: { action: 'onSave' },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServiceGeneralSettings>;

const mockCategories = [
  { id: 'cat-1', name: 'Drug Testing' },
  { id: 'cat-2', name: 'Physical Exams' },
  { id: 'cat-3', name: 'Lab Work' },
  { id: 'cat-4', name: 'Immunizations' },
  { id: 'cat-5', name: 'Screening' },
];

export const Default: Story = {
  args: {
    name: '',
    description: '',
    isActive: true,
    isFeatured: false,
    categories: mockCategories,
  },
};

export const WithData: Story = {
  args: {
    name: 'DOT Drug Screen - 5 Panel',
    description:
      'Standard DOT-compliant 5-panel drug screen including marijuana, cocaine, opiates, amphetamines, and PCP.',
    serviceCode: 'DOT-5P',
    categoryId: 'cat-1',
    categories: mockCategories,
    basePrice: 45.0,
    turnaroundDays: 3,
    cptCode: '80305',
    isActive: true,
    isFeatured: true,
  },
};

export const Inactive: Story = {
  args: {
    name: 'Deprecated Service',
    description: 'This service is no longer offered.',
    isActive: false,
    isFeatured: false,
    categories: mockCategories,
    basePrice: 0,
  },
};

export const WithError: Story = {
  args: {
    name: 'Test Service',
    categories: mockCategories,
    errorMessage: 'A service with this name already exists.',
  },
};

export const Saving: Story = {
  args: {
    name: 'Pre-Employment Physical',
    description: 'Comprehensive physical examination for new hires.',
    serviceCode: 'PHYS-PRE',
    categoryId: 'cat-2',
    categories: mockCategories,
    basePrice: 75.0,
    turnaroundDays: 1,
    isActive: true,
    isSaving: true,
  },
};

export const MinimalCategories: Story = {
  args: {
    name: 'Basic Service',
    isActive: true,
  },
};
