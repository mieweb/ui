import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BookingDialog,
  FloatingInput,
  ServiceSelect,
  InlineBookingForm,
  QuickBookCard,
  type BookingProvider,
  type BookingService,
} from './BookingDialog';

const mockProvider: BookingProvider = {
  id: '1',
  name: 'BlueHive Medical Center',
  address: {
    street1: '123 Healthcare Way',
    city: 'Indianapolis',
    state: 'IN',
    postalCode: '46220',
  },
  phoneNumber: '(317) 555-0123',
};

const mockServices: BookingService[] = [
  { id: '1', slug: 'drug-testing', name: 'Drug Testing' },
  { id: '2', slug: 'dot-physical', name: 'DOT Physical' },
  { id: '3', slug: 'breath-alcohol', name: 'Breath Alcohol Testing' },
];

const meta: Meta<typeof BookingDialog> = {
  title: 'Provider/BookingDialog',
  component: BookingDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Container with transform creates a new containing block for position:fixed
      // This keeps the dialog within this container in docs view
      <div
        className="flex min-h-[900px] items-center justify-center bg-background p-4"
        style={{ transform: 'translateZ(0)' }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    isOpen: true,
    provider: mockProvider,
    services: mockServices,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    onClose: { action: 'onClose' },
    onSubmit: { action: 'onSubmit' },
    onCall: { action: 'onCall' },
    provider: {
      control: 'object',
      description: 'Provider information',
    },
    services: {
      control: 'object',
      description: 'Available services for booking',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the form is in a loading/submitting state',
    },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof BookingDialog>;

// Default booking dialog
export const Default: Story = {};

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

// Sub-components
export const FloatingInputDemo: StoryObj<typeof FloatingInput> = {
  render: () => (
    <div className="w-80 space-y-4">
      <FloatingInput label="First Name" placeholder=" " />
      <FloatingInput
        label="Email"
        type="email"
        defaultValue="john@example.com"
      />
      <FloatingInput
        label="Phone"
        type="tel"
        error="Phone number is required"
      />
    </div>
  ),
};

// Wrapper for ServiceSelectDemo
function ServiceSelectDemoWrapper() {
  const [selected, setSelected] = React.useState<string[]>([]);
  return (
    <div className="w-80">
      <ServiceSelect
        services={mockServices}
        selectedServices={selected}
        onChange={setSelected}
        placeholder="Select services..."
      />
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Selected: {selected.join(', ') || 'None'}
      </p>
    </div>
  );
}

export const ServiceSelectDemo: StoryObj<typeof ServiceSelect> = {
  render: () => <ServiceSelectDemoWrapper />,
};

export const InlineForm: StoryObj<typeof InlineBookingForm> = {
  render: () => (
    <div className="w-96 rounded-lg bg-card p-6 shadow-lg">
      <InlineBookingForm
        provider={mockProvider}
        services={mockServices}
        onSubmit={(data) => window.alert(`Booking for ${data.firstName}`)}
      />
    </div>
  ),
};

export const QuickBook: StoryObj<typeof QuickBookCard> = {
  render: () => (
    <div className="w-80">
      <QuickBookCard
        provider={mockProvider}
        onBook={() => window.alert('Opening booking...')}
        onCall={(phone) => window.alert(`Calling ${phone}`)}
      />
    </div>
  ),
};
