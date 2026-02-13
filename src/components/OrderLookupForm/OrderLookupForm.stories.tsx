import type { Meta, StoryObj } from '@storybook/react';
import { OrderLookupForm } from './OrderLookupForm';

const meta: Meta<typeof OrderLookupForm> = {
  component: OrderLookupForm,
  title: 'Feature Modules/OrderLookupForm',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onSubmit: { action: 'onSubmit' },
  },
};

export default meta;
type Story = StoryObj<typeof OrderLookupForm>;

export const Default: Story = {
  args: {
    providerName: 'ABC Medical Center',
    welcomeMessage:
      'Welcome! Look up your order by entering your information below.',
  },
};

export const WithLogo: Story = {
  args: {
    providerName: 'HealthFirst Clinic',
    providerLogo: 'https://via.placeholder.com/200x80?text=Logo',
    welcomeMessage: 'Access your health screening results securely.',
  },
};

export const NotFound: Story = {
  args: {
    providerName: 'ABC Medical Center',
    notFound: true,
  },
};

export const WithError: Story = {
  args: {
    providerName: 'ABC Medical Center',
    errorMessage: 'Unable to connect to server. Please try again later.',
  },
};

export const Submitting: Story = {
  args: {
    providerName: 'ABC Medical Center',
    isSubmitting: true,
  },
};

export const NoProvider: Story = {
  args: {},
};
