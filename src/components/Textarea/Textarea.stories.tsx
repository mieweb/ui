import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Inputs & Controls/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
    showCount: {
      control: 'boolean',
    },
    autoResize: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    hasError: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
    maxLength: {
      control: 'number',
    },
    rows: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description...',
    size: 'md',
    resize: 'vertical',
    showCount: false,
    autoResize: false,
    disabled: false,
    hasError: false,
    helperText: '',
    error: '',
    maxLength: undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithHelperText: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Bio"
        placeholder="Tell us about yourself..."
        helperText="Write a brief description of yourself"
      />
    </div>
  ),
};

export const WithCharacterCount: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Tweet"
        placeholder="What's happening?"
        maxLength={280}
        showCount
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Message"
        placeholder="Enter your message..."
        error="Message is required"
        hasError
      />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="w-80">
      <Textarea label="Comment" placeholder="Add a comment..." size="sm" />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="w-80">
      <Textarea label="Article" placeholder="Write your article..." size="lg" />
    </div>
  ),
};

export const NoResize: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Fixed size"
        placeholder="This textarea cannot be resized"
        resize="none"
      />
    </div>
  ),
};

export const AutoResize: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Auto-resize"
        placeholder="This textarea grows as you type..."
        autoResize
        helperText="The textarea will automatically grow to fit the content"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Disabled"
        placeholder="This textarea is disabled"
        disabled
        defaultValue="You cannot edit this content"
      />
    </div>
  ),
};

export const MaxLengthReached: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Limited input"
        maxLength={50}
        showCount
        defaultValue="This text is at the maximum character limit!"
      />
    </div>
  ),
};

function ControlledTextareaDemo() {
  const [value, setValue] = React.useState('');

  return (
    <div className="w-80 space-y-4">
      <Textarea
        label="Controlled textarea"
        placeholder="Type something..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        showCount
        maxLength={200}
      />
      <p className="text-muted-foreground text-xs">
        Characters: <code className="font-mono">{value.length}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTextareaDemo />,
};

export const ContactForm: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <h3 className="text-lg font-semibold">Contact Us</h3>
      <Textarea
        label="Your message"
        placeholder="How can we help you?"
        rows={5}
        maxLength={1000}
        showCount
        helperText="Please provide as much detail as possible"
      />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <Textarea label="Small" placeholder="Small textarea" size="sm" />
      <Textarea
        label="Medium"
        placeholder="Medium textarea (default)"
        size="md"
      />
      <Textarea label="Large" placeholder="Large textarea" size="lg" />
    </div>
  ),
};
