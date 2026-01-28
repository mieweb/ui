import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info as InfoIcon,
  Bell,
  ShieldAlert,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './Alert';

// Icon registry for Storybook controls
const iconRegistry: Record<string, React.ReactElement> = {
  none: undefined as unknown as React.ReactElement,
  info: <InfoIcon size={16} />,
  alertCircle: <AlertCircle size={16} />,
  alertTriangle: <AlertTriangle size={16} />,
  checkCircle: <CheckCircle size={16} />,
  bell: <Bell size={16} />,
  shieldAlert: <ShieldAlert size={16} />,
  lightbulb: <Lightbulb size={16} />,
  zap: <Zap size={16} />,
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
      options: Object.keys(iconRegistry),
      mapping: iconRegistry,
      description: 'Icon to display in the alert',
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
    icon: <AlertCircle size={16} />,
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
      <Alert variant="info" icon={<InfoIcon size={16} />}>
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Informational alert style.</AlertDescription>
      </Alert>
      <Alert variant="success" icon={<CheckCircle size={16} />}>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Success alert style.</AlertDescription>
      </Alert>
      <Alert variant="warning" icon={<AlertTriangle size={16} />}>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Warning alert style.</AlertDescription>
      </Alert>
      <Alert variant="danger" icon={<AlertCircle size={16} />}>
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
      icon={<InfoIcon size={16} />}
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
