import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import {
  Toast,
  ToastContainer,
  ToastProvider,
  useToast,
  type ToastPosition,
} from './index';

// =============================================================================
// Demo Components
// =============================================================================

function ToastDemo() {
  const { success, error, warning, info, toasts, dismiss } = useToast();

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => success('Changes saved successfully!')}
          className="rounded-lg bg-green-700 px-4 py-2 text-white transition-colors hover:bg-green-800"
        >
          Success
        </button>
        <button
          onClick={() => error('Something went wrong. Please try again.')}
          className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Error
        </button>
        <button
          onClick={() => warning('Your session will expire in 5 minutes.')}
          className="rounded-lg bg-amber-700 px-4 py-2 text-white transition-colors hover:bg-amber-800"
        >
          Warning
        </button>
        <button
          onClick={() => info('New features are available!')}
          className="bg-primary-700 hover:bg-primary-800 rounded-lg px-4 py-2 text-white transition-colors"
        >
          Info
        </button>
      </div>

      <ToastContainer
        toasts={toasts}
        onDismiss={dismiss}
        position="bottom-right"
      />
    </div>
  );
}

function ToastWithTitleDemo() {
  const { toast, toasts, dismiss } = useToast();

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() =>
          toast({
            title: 'Update Available',
            message: 'A new version of the app is ready to install.',
            variant: 'info',
            action: {
              label: 'Update Now',
              onClick: () => console.log('Update clicked'),
            },
          })
        }
        className="bg-primary-700 hover:bg-primary-800 rounded-lg px-4 py-2 text-white transition-colors"
      >
        Show Toast with Title & Action
      </button>

      <ToastContainer
        toasts={toasts}
        onDismiss={dismiss}
        position="bottom-right"
      />
    </div>
  );
}

function ToastPositionsDemo() {
  const [position, setPosition] = useState<ToastPosition>('bottom-right');
  const { success, toasts, dismiss, dismissAll } = useToast();

  const positions: ToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {positions.map((pos) => (
          <button
            key={pos}
            onClick={() => {
              setPosition(pos);
              dismissAll();
              setTimeout(() => success(`Toast at ${pos}`), 100);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              position === pos
                ? 'bg-primary-800 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} position={position} />
    </div>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof Toast> = {
  title: 'Feedback & Overlays/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toast notifications for displaying brief messages to users. Supports multiple variants, auto-dismiss, and action buttons.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="flex min-h-[300px] items-center justify-center p-8">
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: () => <ToastDemo />,
};

export const WithTitleAndAction: Story = {
  render: () => <ToastWithTitleDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Toasts can include a title and an action button.',
      },
    },
  },
};

export const Positions: Story = {
  render: () => <ToastPositionsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Toasts can be positioned in 6 different locations on the screen.',
      },
    },
  },
};

export const Success: Story = {
  args: {
    id: 'success-toast',
    message: 'Your changes have been saved successfully.',
    variant: 'success',
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    id: 'error-toast',
    title: 'Error',
    message: 'Failed to save changes. Please try again.',
    variant: 'error',
    onClose: () => {},
  },
};

export const Warning: Story = {
  args: {
    id: 'warning-toast',
    message: 'Your session will expire in 5 minutes.',
    variant: 'warning',
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    id: 'info-toast',
    title: 'New Features',
    message: 'Check out the latest updates in your dashboard.',
    variant: 'info',
    onClose: () => {},
  },
};

export const WithAction: Story = {
  args: {
    id: 'action-toast',
    message: 'Item moved to trash.',
    variant: 'info',
    action: {
      label: 'Undo',
      onClick: () => console.log('Undo clicked'),
    },
    onClose: () => {},
  },
};

export const NonDismissible: Story = {
  args: {
    id: 'persistent-toast',
    title: 'System Update',
    message: 'An important update is being installed...',
    variant: 'warning',
    dismissible: false,
    onClose: () => {},
  },
};
