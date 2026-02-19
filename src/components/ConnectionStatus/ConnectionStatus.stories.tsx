import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  ConnectionStatusOverlay,
  UpdateAvailableOverlay,
  ConnectionStatusBadge,
  ConnectionStatusBar,
  useConnectionStatus,
  type ConnectionState,
} from './ConnectionStatus';

const meta: Meta<typeof ConnectionStatusOverlay> = {
  title: 'Feature Modules/ConnectionStatus',
  component: ConnectionStatusOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-[500px] bg-gray-100 p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            App Content
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The connection status overlay will appear on top of this content.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectionStatusOverlay>;

// Default disconnected state with controls
export const Default: Story = {
  args: {
    isVisible: true,
    connection: { status: 'disconnected' },
    onReload: () => window.alert('Reloading...'),
  },
};

// Connecting state
export const Connecting: Story = {
  args: {
    isVisible: true,
    connection: { status: 'connecting' },
  },
};

// Waiting to retry with countdown
export const WaitingToRetry: Story = {
  args: {
    isVisible: true,
    connection: {
      status: 'waiting',
      retryCount: 3,
      retryTime: Date.now() + 15000,
    },
    onReload: () => window.alert('Reloading...'),
  },
};

// Update available overlay
export const UpdateAvailable: StoryObj<typeof UpdateAvailableOverlay> = {
  render: () => (
    <UpdateAvailableOverlay
      isVisible={true}
      update={{ available: true, version: '2.5.0' }}
      onUpdateNow={() => window.alert('Updating...')}
      onLater={() => window.alert('Dismissed')}
      appName="BlueHive"
    />
  ),
};

// All badge states comparison
export const AllBadgeStates: StoryObj<typeof ConnectionStatusBadge> = {
  render: () => (
    <div className="space-y-2 rounded-lg bg-white p-8 dark:bg-gray-800">
      {(
        [
          'connected',
          'connecting',
          'disconnected',
          'waiting',
        ] as ConnectionState[]
      ).map((status) => (
        <div key={status} className="flex items-center gap-4">
          <ConnectionStatusBadge status={status} />
          <span className="text-sm text-gray-500">{status}</span>
        </div>
      ))}
    </div>
  ),
  decorators: [(Story) => <Story />],
};

// Status bar (non-blocking)
export const StatusBar: StoryObj<typeof ConnectionStatusBar> = {
  render: () => (
    <ConnectionStatusBar
      isVisible={true}
      connection={{ status: 'disconnected' }}
      position="top"
    />
  ),
};

// Interactive demo with hook
function InteractiveDemo() {
  const { isOnline, connection } = useConnectionStatus();
  const [simulateOffline, setSimulateOffline] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
        <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
          Connection Status Demo
        </h3>
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <ConnectionStatusBadge status={connection.status} />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={simulateOffline}
            onChange={(e) => setSimulateOffline(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Simulate offline
          </span>
        </label>
      </div>

      <ConnectionStatusOverlay
        isVisible={!isOnline || simulateOffline}
        connection={simulateOffline ? { status: 'disconnected' } : connection}
        onReload={() => setSimulateOffline(false)}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
