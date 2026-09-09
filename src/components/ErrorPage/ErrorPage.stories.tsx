import type { Meta, StoryObj } from '@storybook/react';
import {
  ErrorPage,
  ServerErrorPage,
  OfflinePage,
  MaintenancePage,
} from './ErrorPage';

const meta: Meta<typeof ErrorPage> = {
  id: 'feedback-errorpage',
  title: 'Components/Feedback/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A whole-view error state: \`type\` picks a preset (\`404\`, \`500\`, \`403\`, \`401\`, \`offline\`, \`maintenance\`, \`generic\`) with code, illustration, \`<h1>\` title and description; \`config\` overrides any of them. \`actionButtons\` (label + \`href\` or \`onClick\`) and \`backButton\` give the user a way out. Three \`size\`s.

### Use it when

- A route cannot render its content at all: unknown URL, server failure, no permission, offline, planned maintenance.
- As the fallback of an error boundary around a page region.

### Don't use it when

- Part of the page failed but the rest works — use \`Alert\` in that region.
- The page is still loading — \`LoadingPage\`.
- An empty result set ("no orders yet") — that is an empty state, not an error; a plain message with a primary action reads better.

### Example

\`\`\`tsx
<ErrorBoundary fallback={<ErrorPage type="500" actionButtons={[{ label: 'Reload', onClick: () => location.reload() }]} />}>
  <CaseView />
</ErrorBoundary>

// Router catch-all
<Route path="*" element={<ErrorPage type="404" backButton />} />
\`\`\`

### Limitations

- Renders an \`<h1>\`; place it where it is the page's main heading. Illustrations are \`aria-hidden\`.
- Preset titles and descriptions are English — pass \`config\` with translated strings.
- \`backButton\` uses \`history.back()\`; in a fresh tab there may be nowhere to go, so pair it with an explicit home action.
- Fills its container; it does not lock scrolling or cover fixed chrome such as a header.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'feedback-alert',
          why: 'Alert for a failed part of a working page; ErrorPage when the view cannot render.',
        },
        {
          type: 'alternative to',
          target: 'loading-loadingpage',
          why: 'The two page-level states: LoadingPage while pending, ErrorPage when it failed.',
        },
        {
          type: 'alternative to',
          target: 'feedback-connectionstatus',
          why: 'ConnectionStatus overlays a working app until it reconnects; ErrorPage replaces a route that failed.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'actionButtons render as Buttons.',
        },
      ],
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
