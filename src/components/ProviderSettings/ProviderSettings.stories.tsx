import type { Meta, StoryObj } from '@storybook/react';
import {
  ProviderSettings,
  type ProviderSettingsData,
} from './ProviderSettings';

const meta: Meta<typeof ProviderSettings> = {
  title: 'Provider/ProviderSettings',
  component: ProviderSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSave: { action: 'save' },
  },
};

export default meta;
type Story = StoryObj<typeof ProviderSettings>;

const mockSettings: ProviderSettingsData = {
  general: {
    name: 'Indianapolis Family Medicine',
    description:
      'A full-service family medicine clinic providing comprehensive healthcare services including DOT physicals, drug testing, and occupational health services.',
    phone: '(317) 555-0100',
    email: 'contact@indyfamilymed.com',
    website: 'https://indyfamilymed.com',
    npi: '1234567890',
    taxId: '12-3456789',
  },
  address: {
    street: '123 Medical Center Drive',
    street2: 'Suite 200',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46250',
    country: 'USA',
  },
  notifications: {
    emailNewOrders: true,
    emailOrderUpdates: true,
    emailInvoices: true,
    smsNewOrders: false,
    smsOrderUpdates: false,
  },
  scheduling: {
    acceptingNewPatients: true,
    requireAppointment: true,
    appointmentBuffer: 15,
    maxDailyAppointments: 50,
  },
  payments: {
    acceptsCreditCard: true,
    acceptsACH: true,
    acceptsCash: true,
    acceptsCheck: true,
    paymentTerms: 30,
  },
};

export const Default: Story = {
  args: {
    settings: mockSettings,
  },
};

export const NotificationsTab: Story = {
  args: {
    settings: mockSettings,
    defaultTab: 'notifications',
  },
};

export const SchedulingTab: Story = {
  args: {
    settings: mockSettings,
    defaultTab: 'scheduling',
  },
};

export const PaymentsTab: Story = {
  args: {
    settings: mockSettings,
    defaultTab: 'payments',
  },
};

export const Saving: Story = {
  args: {
    settings: mockSettings,
    isSaving: true,
  },
};

export const Loading: Story = {
  args: {
    settings: mockSettings,
    isLoading: true,
  },
};

export const MinimalInfo: Story = {
  args: {
    settings: {
      general: {
        name: 'New Provider',
      },
      address: {
        street: '123 Main St',
        city: 'Indianapolis',
        state: 'IN',
        zip: '46000',
      },
      notifications: {
        emailNewOrders: false,
        emailOrderUpdates: false,
        emailInvoices: false,
        smsNewOrders: false,
        smsOrderUpdates: false,
      },
      scheduling: {
        acceptingNewPatients: true,
        requireAppointment: false,
        appointmentBuffer: 0,
        maxDailyAppointments: 100,
      },
      payments: {
        acceptsCreditCard: true,
        acceptsACH: false,
        acceptsCash: false,
        acceptsCheck: false,
        paymentTerms: 0,
      },
    },
  },
};

export const AllNotificationsEnabled: Story = {
  args: {
    settings: {
      ...mockSettings,
      notifications: {
        emailNewOrders: true,
        emailOrderUpdates: true,
        emailInvoices: true,
        smsNewOrders: true,
        smsOrderUpdates: true,
      },
    },
    defaultTab: 'notifications',
  },
};

export const NoPaymentMethods: Story = {
  args: {
    settings: {
      ...mockSettings,
      payments: {
        acceptsCreditCard: false,
        acceptsACH: false,
        acceptsCash: false,
        acceptsCheck: false,
        paymentTerms: 30,
      },
    },
    defaultTab: 'payments',
  },
};

export const NotAcceptingPatients: Story = {
  args: {
    settings: {
      ...mockSettings,
      scheduling: {
        ...mockSettings.scheduling,
        acceptingNewPatients: false,
      },
    },
    defaultTab: 'scheduling',
  },
};

export const Mobile: Story = {
  args: {
    settings: mockSettings,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
