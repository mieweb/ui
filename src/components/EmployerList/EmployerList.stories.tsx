import type { Meta, StoryObj } from '@storybook/react';
import { EmployerList } from './EmployerList';

const meta: Meta<typeof EmployerList> = {
  title: 'Provider/EmployerList',
  component: EmployerList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmployerList>;

const mockEmployers = [
  {
    id: '1',
    name: 'ABC Trucking Company',
    email: 'hr@abctrucking.com',
    phone: '(555) 123-4567',
    activeEmployees: 45,
    pendingOrders: 3,
    status: 'active' as const,
    linkedDate: new Date(Date.now() - 90 * 24 * 3600000),
  },
  {
    id: '2',
    name: 'Metro Transit Authority',
    email: 'safety@metrotransit.gov',
    phone: '(555) 234-5678',
    activeEmployees: 128,
    pendingOrders: 0,
    status: 'active' as const,
    linkedDate: new Date(Date.now() - 45 * 24 * 3600000),
  },
  {
    id: '3',
    name: 'City Construction LLC',
    email: 'admin@cityconstruction.com',
    phone: '(555) 345-6789',
    activeEmployees: 22,
    pendingOrders: 5,
    status: 'active' as const,
    linkedDate: new Date(Date.now() - 30 * 24 * 3600000),
  },
  {
    id: '4',
    name: 'Pending Partner Inc',
    email: 'info@pendingpartner.com',
    status: 'pending' as const,
    linkedDate: new Date(Date.now() - 2 * 24 * 3600000),
  },
  {
    id: '5',
    name: 'Old Logistics Corp',
    email: 'contact@oldlogistics.com',
    activeEmployees: 0,
    pendingOrders: 0,
    status: 'inactive' as const,
    linkedDate: new Date(Date.now() - 365 * 24 * 3600000),
  },
];

export const Default: Story = {
  args: {
    employers: mockEmployers,
    onEmployerClick: (employer) => console.log('Clicked:', employer),
    onAddEmployer: () => console.log('Add employer'),
    onSearch: (query) => console.log('Search:', query),
  },
};

export const Empty: Story = {
  args: {
    employers: [],
    onAddEmployer: () => console.log('Add employer'),
  },
};

export const SingleEmployer: Story = {
  args: {
    employers: [mockEmployers[0]],
    onEmployerClick: (employer) => console.log('Clicked:', employer),
  },
};

export const NoSearch: Story = {
  args: {
    employers: mockEmployers,
    showSearch: false,
    onEmployerClick: (employer) => console.log('Clicked:', employer),
  },
};

export const Loading: Story = {
  args: {
    employers: [],
    isLoading: true,
  },
};

export const WithLogos: Story = {
  args: {
    employers: mockEmployers.map((emp, i) => ({
      ...emp,
      logoUrl: i % 2 === 0 ? `https://via.placeholder.com/40x40?text=${emp.name.charAt(0)}` : undefined,
    })),
    onEmployerClick: (employer) => console.log('Clicked:', employer),
  },
};

export const ManyEmployers: Story = {
  args: {
    employers: [
      ...mockEmployers,
      ...mockEmployers.map((emp) => ({
        ...emp,
        id: `${emp.id}-copy`,
        name: `${emp.name} (Branch 2)`,
      })),
    ],
    onEmployerClick: (employer) => console.log('Clicked:', employer),
    onSearch: (query) => console.log('Search:', query),
  },
};

export const Mobile: Story = {
  args: {
    employers: mockEmployers.slice(0, 3),
    onEmployerClick: (employer) => console.log('Clicked:', employer),
    onAddEmployer: () => console.log('Add employer'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
