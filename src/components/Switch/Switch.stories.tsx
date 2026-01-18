import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'Notifications enabled',
    defaultChecked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Dark mode',
    description: 'Toggle between light and dark theme',
  },
};

export const Small: Story = {
  args: {
    label: 'Small switch',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large switch',
    size: 'lg',
  },
};

export const LabelOnLeft: Story = {
  args: {
    label: 'Auto-save',
    labelPosition: 'left',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled switch',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    defaultChecked: true,
  },
};

export const NoLabel: Story = {
  args: {},
};

function ControlledSwitchDemo() {
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="space-y-4">
      <Switch
        label="Controlled switch"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <p className="text-muted-foreground text-xs">
        State: <code className="font-mono">{checked ? 'on' : 'off'}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSwitchDemo />,
};

export const SettingsExample: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <h3 className="text-lg font-semibold">Notification Settings</h3>
      <div className="space-y-6">
        <Switch
          label="Push notifications"
          description="Receive push notifications on your device"
          defaultChecked
        />
        <Switch
          label="Email notifications"
          description="Receive email updates about your account"
          defaultChecked
        />
        <Switch
          label="SMS notifications"
          description="Receive text message alerts"
        />
        <Switch
          label="Marketing emails"
          description="Receive promotional content and offers"
        />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch label="Small" size="sm" defaultChecked />
      <Switch label="Medium (default)" size="md" defaultChecked />
      <Switch label="Large" size="lg" defaultChecked />
    </div>
  ),
};
