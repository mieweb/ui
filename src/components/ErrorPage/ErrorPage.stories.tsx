import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  ErrorPage,
  NotFoundPage,
  ServerErrorPage,
  OfflinePage,
  MaintenancePage,
} from './ErrorPage';

const meta: Meta<typeof ErrorPage> = {
  title: 'Components/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Error page components for 404, 500, offline, and maintenance states.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        '404',
        '500',
        '403',
        '401',
        'offline',
        'maintenance',
        'generic',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorPage>;

/** Standard 404 Not Found page */
export const NotFound: Story = {
  render: () => <NotFoundPage showHomeButton showBackButton />,
};

/** 500 Server Error with debug details */
export const ServerError: Story = {
  render: () => (
    <ServerErrorPage
      error={new Error('Connection timeout')}
      showErrorDetails
      showHomeButton
    />
  ),
};

/** Offline state with retry action */
export const Offline: Story = {
  render: () => <OfflinePage onRetry={() => window.location.reload()} />,
};

/** Maintenance page with status info */
export const Maintenance: Story = {
  render: () => (
    <MaintenancePage
      estimatedTime="30 minutes"
      statusUrl="https://status.example.com"
    />
  ),
};

/** Custom error with actions */
export const CustomError: Story = {
  args: {
    type: 'generic',
    title: 'Unable to Process Request',
    description: 'Please try again or contact support.',
    primaryAction: { label: 'Try Again', onClick: () => alert('Retry') },
    secondaryAction: { label: 'Contact Support', href: '/support' },
    showHomeButton: false,
    showBackButton: false,
  },
};

/** Small embedded variant */
export const SmallSize: Story = {
  args: {
    type: '404',
    size: 'sm',
    showHomeButton: true,
    showBackButton: false,
  },
};
