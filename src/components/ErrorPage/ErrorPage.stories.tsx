import type { Meta, StoryObj } from '@storybook/react';
import {
  ErrorPage,
  ServerErrorPage,
  OfflinePage,
  MaintenancePage,
} from './ErrorPage';

const meta: Meta<typeof ErrorPage> = {
  title: 'Feature Modules/ErrorPage',
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
      description: 'The type of error to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the error page',
    },
    code: {
      control: 'text',
      description: 'Custom error code (overrides type default)',
    },
    title: {
      control: 'text',
      description: 'Custom title (overrides type default)',
    },
    description: {
      control: 'text',
      description: 'Custom description (overrides type default)',
    },
    showHomeButton: {
      control: 'boolean',
      description: 'Show the home button',
    },
    showBackButton: {
      control: 'boolean',
      description: 'Show the back button',
    },
    homeHref: {
      control: 'text',
      description: 'Home button href',
    },
  },
  args: {
    type: '404',
    size: 'md',
    showHomeButton: true,
    showBackButton: true,
  },
};

export default meta;
type Story = StoryObj<typeof ErrorPage>;

/** Default error page - use controls to change type and options */
export const Default: Story = {
  args: {
    type: '404',
    showHomeButton: true,
    showBackButton: true,
  },
};

/** Standard 404 Not Found page */
export const NotFound: Story = {
  args: {
    type: '404',
    showHomeButton: true,
    showBackButton: true,
  },
};

/** 500 Server Error */
export const ServerError: Story = {
  args: {
    type: '500',
    showHomeButton: true,
    showBackButton: true,
  },
};

/** 500 Server Error with debug details (using ServerErrorPage component) */
export const ServerErrorWithDetails: Story = {
  render: () => (
    <ServerErrorPage
      error={new Error('Connection timeout')}
      showErrorDetails
      showHomeButton
    />
  ),
};

/** Offline state */
export const Offline: Story = {
  args: {
    type: 'offline',
    showHomeButton: false,
    showBackButton: true,
  },
};

/** Offline state with retry action (using OfflinePage component) */
export const OfflineWithRetry: Story = {
  render: () => <OfflinePage onRetry={() => window.location.reload()} />,
};

/** Maintenance page */
export const Maintenance: Story = {
  args: {
    type: 'maintenance',
    showHomeButton: false,
    showBackButton: false,
  },
};

/** Maintenance page with status info (using MaintenancePage component) */
export const MaintenanceWithStatus: Story = {
  render: () => (
    <MaintenancePage
      estimatedTime="30 minutes"
      statusUrl="https://status.example.com"
    />
  ),
};

/** 403 Access Denied */
export const AccessDenied: Story = {
  args: {
    type: '403',
    showHomeButton: true,
    showBackButton: true,
  },
};

/** 401 Unauthorized */
export const Unauthorized: Story = {
  args: {
    type: '401',
    showHomeButton: true,
    showBackButton: false,
  },
};

/** Custom error with actions */
export const CustomError: Story = {
  args: {
    type: 'generic',
    title: 'Unable to Process Request',
    description: 'Please try again or contact support.',
    primaryAction: { label: 'Try Again', onClick: () => window.alert('Retry') },
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

/** Large fullscreen variant */
export const LargeSize: Story = {
  args: {
    type: '500',
    size: 'lg',
    showHomeButton: true,
    showBackButton: true,
  },
};
