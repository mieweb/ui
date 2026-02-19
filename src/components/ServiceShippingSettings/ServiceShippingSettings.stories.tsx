import type { Meta, StoryObj } from '@storybook/react';
import { ServiceShippingSettings } from './ServiceShippingSettings';

const meta: Meta<typeof ServiceShippingSettings> = {
  component: ServiceShippingSettings,
  title: 'Feature Modules/ServiceShippingSettings',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onShippingEnabledChange: { action: 'onShippingEnabledChange' },
    onAddressChange: { action: 'onAddressChange' },
    onMethodChange: { action: 'onMethodChange' },
    onCarrierAccountChange: { action: 'onCarrierAccountChange' },
    onInstructionsChange: { action: 'onInstructionsChange' },
    onUseKitShippingChange: { action: 'onUseKitShippingChange' },
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
type Story = StoryObj<typeof ServiceShippingSettings>;

const mockShippingMethods = [
  { id: 'ground', name: 'Ground Shipping', price: 5.99 },
  { id: 'express', name: 'Express (2-Day)', price: 12.99 },
  { id: 'overnight', name: 'Overnight', price: 24.99 },
  { id: 'free', name: 'Free Shipping', price: 0 },
];

export const Disabled: Story = {
  args: {
    shippingEnabled: false,
  },
};

export const Enabled: Story = {
  args: {
    shippingEnabled: true,
    shippingMethods: mockShippingMethods,
    selectedMethodId: 'ground',
    useKitShipping: true,
  },
};

export const WithAddress: Story = {
  args: {
    shippingEnabled: true,
    shippingMethods: mockShippingMethods,
    selectedMethodId: 'express',
    useKitShipping: true,
    defaultAddress: {
      name: 'BlueHive Lab',
      street1: '123 Healthcare Way',
      street2: 'Suite 400',
      city: 'Fort Wayne',
      state: 'IN',
      zipCode: '46802',
      country: 'US',
    },
    carrierAccountNumber: 'ACCT-123456',
    instructions: 'Leave at loading dock. Call upon arrival.',
  },
};

export const WithSaveButton: Story = {
  args: {
    shippingEnabled: true,
    shippingMethods: mockShippingMethods,
    selectedMethodId: 'ground',
    useKitShipping: false,
    defaultAddress: {
      name: '',
      street1: '',
      city: '',
      state: '',
      zipCode: '',
    },
  },
};

export const Saving: Story = {
  args: {
    shippingEnabled: true,
    shippingMethods: mockShippingMethods,
    selectedMethodId: 'overnight',
    isSaving: true,
  },
};
