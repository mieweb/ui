import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, CheckboxGroup } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs & Controls/Checkbox',
  component: Checkbox,
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
    indeterminate: {
      control: 'boolean',
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
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Accept terms and conditions',
    defaultChecked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive emails about new products, features, and promotions.',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all items',
    indeterminate: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Small checkbox',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large checkbox',
    size: 'lg',
  },
};

export const LabelOnLeft: Story = {
  args: {
    label: 'Label on left',
    labelPosition: 'left',
  },
};

export const WithError: Story = {
  args: {
    label: 'Accept terms and conditions',
    error: 'You must accept the terms to continue',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
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

export const Group: Story = {
  render: () => (
    <CheckboxGroup label="Select your interests" orientation="vertical">
      <Checkbox label="Sports" />
      <Checkbox label="Music" />
      <Checkbox label="Travel" />
      <Checkbox label="Technology" />
    </CheckboxGroup>
  ),
};

export const HorizontalGroup: Story = {
  render: () => (
    <CheckboxGroup label="Notification preferences" orientation="horizontal">
      <Checkbox label="Email" />
      <Checkbox label="SMS" />
      <Checkbox label="Push" />
    </CheckboxGroup>
  ),
};

export const GroupWithDescriptions: Story = {
  render: () => (
    <CheckboxGroup
      label="Privacy settings"
      description="Choose which information to share"
    >
      <Checkbox
        label="Profile visibility"
        description="Make your profile visible to other users"
      />
      <Checkbox
        label="Show email"
        description="Display your email address on your profile"
      />
      <Checkbox label="Activity status" description="Show when you're active" />
    </CheckboxGroup>
  ),
};

export const GroupWithError: Story = {
  render: () => (
    <CheckboxGroup
      label="Required selections"
      error="Please select at least one option"
    >
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" />
      <Checkbox label="Option 3" />
    </CheckboxGroup>
  ),
};

function IndeterminateDemo() {
  const [checked, setChecked] = React.useState([false, false, false]);

  const allChecked = checked.every(Boolean);
  const someChecked = checked.some(Boolean) && !allChecked;

  const handleParentChange = () => {
    const newValue = !allChecked;
    setChecked([newValue, newValue, newValue]);
  };

  return (
    <div className="space-y-4">
      <Checkbox
        label="Select all"
        checked={allChecked}
        indeterminate={someChecked}
        onChange={handleParentChange}
      />
      <div className="ml-6 flex flex-col gap-2">
        <Checkbox
          label="Option 1"
          checked={checked[0]}
          onChange={(e) =>
            setChecked([e.target.checked, checked[1], checked[2]])
          }
        />
        <Checkbox
          label="Option 2"
          checked={checked[1]}
          onChange={(e) =>
            setChecked([checked[0], e.target.checked, checked[2]])
          }
        />
        <Checkbox
          label="Option 3"
          checked={checked[2]}
          onChange={(e) =>
            setChecked([checked[0], checked[1], e.target.checked])
          }
        />
      </div>
    </div>
  );
}

export const IndeterminateExample: Story = {
  render: () => <IndeterminateDemo />,
};
