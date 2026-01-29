import type { Meta, StoryObj } from '@storybook/react';
import { EmployerPricingCard } from './EmployerPricingCard';

const meta: Meta<typeof EmployerPricingCard> = {
  component: EmployerPricingCard,
  title: 'Components/EmployerPricingCard',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onEdit: { action: 'onEdit' },
    onRemove: { action: 'onRemove' },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmployerPricingCard>;

export const Default: Story = {
  args: {
    serviceName: 'DOT Drug Screen - 5 Panel',
    basePrice: 45.0,
  },
};

export const WithTiers: Story = {
  args: {
    serviceName: 'Pre-Employment Physical',
    basePrice: 75.0,
    tiers: [
      {
        id: '1',
        name: 'Standard',
        price: 75.0,
        minQuantity: 1,
        maxQuantity: 10,
        isDefault: true,
      },
      {
        id: '2',
        name: 'Volume',
        price: 65.0,
        minQuantity: 11,
        maxQuantity: 50,
      },
      {
        id: '3',
        name: 'Enterprise',
        price: 55.0,
        minQuantity: 51,
      },
    ],
  },
};

export const WithNotes: Story = {
  args: {
    serviceName: 'Annual Physical',
    basePrice: 85.0,
    notes:
      'Special pricing negotiated for 2024. Review before renewal in December.',
  },
};

export const Inactive: Story = {
  args: {
    serviceName: 'TB Test',
    basePrice: 25.0,
    isActive: false,
  },
};

export const ReadOnly: Story = {
  args: {
    serviceName: 'DOT Drug Screen - 5 Panel',
    basePrice: 45.0,
    editable: false,
    tiers: [
      {
        id: '1',
        name: 'Standard',
        price: 45.0,
        isDefault: true,
      },
    ],
  },
};

export const FullFeatured: Story = {
  args: {
    serviceName: 'Comprehensive Health Screening',
    basePrice: 150.0,
    tiers: [
      {
        id: '1',
        name: 'Individual',
        price: 150.0,
        minQuantity: 1,
        maxQuantity: 5,
        isDefault: true,
      },
      {
        id: '2',
        name: 'Small Group',
        price: 125.0,
        minQuantity: 6,
        maxQuantity: 25,
      },
      {
        id: '3',
        name: 'Large Group',
        price: 100.0,
        minQuantity: 26,
      },
    ],
    notes: 'Includes blood work, vision, and hearing tests.',
  },
};
