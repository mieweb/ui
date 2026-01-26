import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from './Alert';
import {
  Info as InfoIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Bell,
  type LucideIcon,
} from 'lucide-react';

// Icon registry for Storybook controls
const iconRegistry: Record<string, LucideIcon | undefined> = {
  None: undefined,
  Info: InfoIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Bell,
};

const iconOptions = Object.keys(iconRegistry);

// Helper to render icon from name
const renderIcon = (iconName: string | undefined) => {
  if (!iconName || iconName === 'None') return undefined;
  const IconComponent = iconRegistry[iconName];
  return IconComponent ? <IconComponent size={16} /> : undefined;
};

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'danger'],
    },
    dismissible: {
      control: 'boolean',
    },
    icon: {
      control: 'select',
      options: iconOptions,
      description: 'Icon to display in the alert',
      mapping: Object.fromEntries(
        iconOptions.map((name) => [name, renderIcon(name)])
      ),
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is a default alert message.</AlertDescription>
      </>
    ),
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    icon: <InfoIcon size={16} />,
    children: (
      <>
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>This is an informational message.</AlertDescription>
      </>
    ),
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    icon: <CheckCircle size={16} />,
    children: (
      <>
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </>
    ),
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    icon: <AlertTriangle size={16} />,
    children: (
      <>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your session is about to expire in 5 minutes.
        </AlertDescription>
      </>
    ),
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    icon: <XCircle size={16} />,
    children: (
      <>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'info',
    icon: <InfoIcon size={16} />,
    children: (
      <>
        <AlertTitle>Did you know?</AlertTitle>
        <AlertDescription>
          You can customize the look and feel of alerts with different variants.
        </AlertDescription>
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Default alert style.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Informational alert style.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Success alert style.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Warning alert style.</AlertDescription>
      </Alert>
      <Alert variant="danger">
        <AlertTitle>Danger</AlertTitle>
        <AlertDescription>Danger alert style.</AlertDescription>
      </Alert>
    </div>
  ),
};

function DismissibleExample() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="text-primary-500 text-sm underline"
      >
        Show alert again
      </button>
    );
  }

  return (
    <Alert
      variant="info"
      dismissible
      onDismiss={() => setVisible(false)}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      }
    >
      <AlertTitle>Dismissible Alert</AlertTitle>
      <AlertDescription>
        This alert can be dismissed by clicking the close button.
      </AlertDescription>
    </Alert>
  );
}

export const Dismissible: Story = {
  render: () => <DismissibleExample />,
};
