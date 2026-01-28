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
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BookingDialog>;

// Dialog wrapper for interactive demos
function BookingDialogWrapper(args: Story['args']) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-white"
      >
        Open Booking Dialog
      </button>
      <BookingDialog
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        provider={args?.provider || mockProvider}
        services={args?.services || mockServices}
        onSubmit={(data) => {
          alert(`Booking requested for ${data.firstName} ${data.lastName}`);
          setIsOpen(false);
        }}
        onCall={(phone) => alert(`Calling ${phone}...`)}
      />
    </div>
  );
}

// Default booking dialog
export const Default: Story = {
  render: (args) => <BookingDialogWrapper {...args} />,
  args: {
    provider: mockProvider,
    services: mockServices,
  },
};

// Loading state
export const Loading: Story = {
  render: (args) => <BookingDialogWrapper {...args} />,
  args: {
    provider: mockProvider,
    services: mockServices,
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

export const ServiceSelectDemo: StoryObj<typeof ServiceSelect> = {
  render: () => {
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
  },
};

export const InlineForm: StoryObj<typeof InlineBookingForm> = {
  render: () => (
    <div className="w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <InlineBookingForm
        provider={mockProvider}
        services={mockServices}
        onSubmit={(data) => alert(`Booking for ${data.firstName}`)}
      />
    </div>
  ),
};

export const QuickBook: StoryObj<typeof QuickBookCard> = {
  render: () => (
    <div className="w-80">
      <QuickBookCard
        provider={mockProvider}
        onBook={() => alert('Opening booking...')}
        onCall={(phone) => alert(`Calling ${phone}`)}
      />
    </div>
  ),
};
