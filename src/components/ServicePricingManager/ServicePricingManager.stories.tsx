import type { Meta, StoryObj } from '@storybook/react';
import {
  ServicePricingManager,
  type ServicePrice,
} from './ServicePricingManager';

const meta: Meta<typeof ServicePricingManager> = {
  title: 'Provider/ServicePricingManager',
  component: ServicePricingManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onUpdatePrice: { action: 'update price' },
    onToggleStatus: { action: 'toggle status' },
    onBulkUpdate: { action: 'bulk update' },
  },
};

export default meta;
type Story = StoryObj<typeof ServicePricingManager>;

const mockServices: ServicePrice[] = [
  {
    id: 's1',
    serviceName: 'DOT Physical Examination',
    serviceCode: 'DOT-PHY',
    category: 'Physicals',
    basePrice: 85.0,
    employerPrice: 75.0,
    isActive: true,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 's2',
    serviceName: 'Drug Screen (5 Panel)',
    serviceCode: 'DS-5P',
    category: 'Drug Testing',
    basePrice: 45.0,
    employerPrice: 38.0,
    isActive: true,
    lastUpdated: new Date('2024-01-10'),
  },
  {
    id: 's3',
    serviceName: 'Drug Screen (10 Panel)',
    serviceCode: 'DS-10P',
    category: 'Drug Testing',
    basePrice: 65.0,
    employerPrice: 55.0,
    isActive: true,
    lastUpdated: new Date('2024-01-10'),
  },
  {
    id: 's4',
    serviceName: 'Pre-Employment Physical',
    serviceCode: 'PE-PHY',
    category: 'Physicals',
    basePrice: 95.0,
    isActive: true,
    lastUpdated: new Date('2024-01-08'),
  },
  {
    id: 's5',
    serviceName: 'Audiometry Test',
    serviceCode: 'AUDIO',
    category: 'Testing',
    basePrice: 35.0,
    employerPrice: 30.0,
    isActive: true,
    lastUpdated: new Date('2024-01-05'),
  },
  {
    id: 's6',
    serviceName: 'Vision Screening',
    serviceCode: 'VISION',
    category: 'Testing',
    basePrice: 25.0,
    isActive: true,
    lastUpdated: new Date('2024-01-05'),
  },
  {
    id: 's7',
    serviceName: 'Breath Alcohol Test',
    serviceCode: 'BAT',
    category: 'Drug Testing',
    basePrice: 35.0,
    employerPrice: 30.0,
    isActive: false,
    lastUpdated: new Date('2023-12-20'),
  },
  {
    id: 's8',
    serviceName: 'Respirator Fit Test',
    serviceCode: 'RESP-FIT',
    category: 'Testing',
    basePrice: 55.0,
    isActive: true,
    lastUpdated: new Date('2024-01-12'),
  },
];

export const Default: Story = {
  args: {
    services: mockServices,
  },
};

export const Loading: Story = {
  args: {
    services: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    services: [],
  },
};

export const Saving: Story = {
  args: {
    services: mockServices,
    isSaving: true,
  },
};

export const NoBulkUpdate: Story = {
  args: {
    services: mockServices,
    onBulkUpdate: undefined,
  },
};

export const ReadOnly: Story = {
  args: {
    services: mockServices,
    onUpdatePrice: undefined,
    onToggleStatus: undefined,
    onBulkUpdate: undefined,
  },
};

export const FewServices: Story = {
  args: {
    services: mockServices.slice(0, 3),
  },
};

export const ManyInactive: Story = {
  args: {
    services: mockServices.map((s, i) => ({
      ...s,
      isActive: i < 2,
    })),
  },
};

export const NoEmployerPrices: Story = {
  args: {
    services: mockServices.map(({ employerPrice: _removed, ...rest }) => rest),
  },
};

export const NoCategories: Story = {
  args: {
    services: mockServices.map(({ category: _removed, ...rest }) => rest),
  },
};

export const Mobile: Story = {
  args: {
    services: mockServices,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
