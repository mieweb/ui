import type { Meta, StoryObj } from '@storybook/react';
import {
  Address,
  AddressCard,
  AddressInline,
  AddressCompact,
  type AddressData,
} from './Address';

const meta: Meta<typeof Address> = {
  title: 'Components/Address',
  component: Address,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    format: {
      control: 'select',
      options: ['block', 'inline', 'compact'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    linkToMaps: {
      control: 'select',
      options: [false, true, 'directions', 'search'],
    },
    showIcon: { control: 'boolean' },
    hideStreet: { control: 'boolean' },
    hidePostalCode: { control: 'boolean' },
    icon: { control: false }, // ReactNode can't be controlled via Storybook
  },
};

export default meta;
type Story = StoryObj<typeof Address>;

const sampleAddress: AddressData = {
  street1: '123 Healthcare Way',
  street2: 'Suite 500',
  city: 'Indianapolis',
  state: 'Indiana',
  postalCode: '46220',
};

// Default story with controls for all props
export const Default: Story = {
  args: {
    address: sampleAddress,
    showIcon: true,
    linkToMaps: true,
  },
};

// All three formats side by side
export const AllFormats: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Block format
        </p>
        <Address address={sampleAddress} format="block" showIcon linkToMaps />
      </div>
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Inline format
        </p>
        <Address address={sampleAddress} format="inline" showIcon />
      </div>
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Compact format
        </p>
        <Address address={sampleAddress} format="compact" showIcon />
      </div>
    </div>
  ),
};

// Convenience components
export const ConvenienceComponents: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          AddressInline
        </p>
        <AddressInline address={sampleAddress} showIcon />
      </div>
      <div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          AddressCompact
        </p>
        <AddressCompact address={sampleAddress} showIcon />
      </div>
    </div>
  ),
};

// AddressCard with phone
export const Card: StoryObj<typeof AddressCard> = {
  render: () => (
    <AddressCard
      title="Main Office"
      address={sampleAddress}
      phoneNumber="(317) 555-1234"
      linkToMaps
    />
  ),
};

// Multiple cards grid
export const MultipleCards: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AddressCard
        title="Main Office"
        address={sampleAddress}
        phoneNumber="(317) 555-1234"
        linkToMaps
      />
      <AddressCard
        title="Billing Address"
        address={{
          street1: '456 Main Street',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
        }}
        phoneNumber="(312) 555-5678"
        linkToMaps
      />
    </div>
  ),
};
