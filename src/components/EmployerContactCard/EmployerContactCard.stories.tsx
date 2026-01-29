import type { Meta, StoryObj } from '@storybook/react';
import { EmployerContactCard } from './EmployerContactCard';

const meta: Meta<typeof EmployerContactCard> = {
  title: 'Provider/EmployerContactCard',
  component: EmployerContactCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmployerContactCard>;

const mockContacts = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@acmetrucking.com',
    phone: '(555) 123-4567',
    role: 'HR Manager',
    isPrimary: true,
  },
  {
    id: '2',
    name: 'Mike Williams',
    email: 'mike.williams@acmetrucking.com',
    phone: '(555) 234-5678',
    role: 'Safety Director',
  },
  {
    id: '3',
    name: 'Jennifer Davis',
    email: 'jennifer.davis@acmetrucking.com',
    role: 'Office Manager',
  },
];

export const Default: Story = {
  args: {
    contacts: mockContacts,
    onContactClick: (contact) => console.log('Contact clicked:', contact),
    onAddContact: () => console.log('Add contact'),
    onEmail: (contact) => console.log('Email:', contact.email),
    onCall: (contact) => console.log('Call:', contact.phone),
  },
};

export const Empty: Story = {
  args: {
    contacts: [],
    onAddContact: () => console.log('Add contact'),
  },
};

export const SingleContact: Story = {
  args: {
    contacts: [mockContacts[0]],
    onEmail: (contact) => console.log('Email:', contact.email),
    onCall: (contact) => console.log('Call:', contact.phone),
  },
};

export const WithoutActions: Story = {
  args: {
    contacts: mockContacts,
    showActions: false,
  },
};

export const Loading: Story = {
  args: {
    contacts: [],
    isLoading: true,
  },
};

export const NoPhones: Story = {
  args: {
    contacts: [
      { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'HR Manager', isPrimary: true },
      { id: '2', name: 'Mike Williams', email: 'mike@company.com', role: 'Safety Director' },
    ],
    onEmail: (contact) => console.log('Email:', contact.email),
  },
};
