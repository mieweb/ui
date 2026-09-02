import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Forms & Inputs/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    labelVariant: {
      control: 'select',
      options: ['stacked', 'floating'],
    },
    hasError: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'johndoe',
    helperText: 'This will be your public display name.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address.',
    hasError: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    defaultValue: 'Disabled value',
  },
};

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
};

export const HiddenLabel: Story = {
  args: {
    label: 'Search',
    hideLabel: true,
    placeholder: 'Search...',
  },
};

export const FloatingLabel: Story = {
  args: {
    label: 'Account number',
    labelVariant: 'floating',
  },
};

export const FloatingLabelWithValue: Story = {
  args: {
    label: 'Recipient’s bank country',
    labelVariant: 'floating',
    defaultValue: 'British Pound',
  },
};

export const FloatingLabelRequired: Story = {
  args: {
    label: 'Sort code',
    labelVariant: 'floating',
    required: true,
  },
};

export const FloatingLabelWithError: Story = {
  args: {
    label: 'Account number',
    labelVariant: 'floating',
    defaultValue: '12',
    error: 'Account number must be 8 digits.',
  },
};

export const FloatingLabelSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input label="Small" labelVariant="floating" size="sm" />
      <Input label="Medium" labelVariant="floating" size="md" />
      <Input label="Large" labelVariant="floating" size="lg" />
    </div>
  ),
};

export const FloatingLabelDisabled: Story = {
  args: {
    label: 'Sort code',
    labelVariant: 'floating',
    disabled: true,
    defaultValue: '04-00-04',
  },
};
