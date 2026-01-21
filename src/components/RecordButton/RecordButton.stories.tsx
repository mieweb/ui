import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { RecordButton } from './RecordButton';
import { Input } from '../Input';
import { Textarea } from '../Textarea';

const meta: Meta<typeof RecordButton> = {
  title: 'Components/RecordButton',
  component: RecordButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A simple microphone recording button that can be placed anywhere.
Perfect for adding voice input to text fields, chat inputs, or forms.

## Features
- Compact, embeddable design
- Recording states: idle, recording, processing
- Optional duration display while recording
- Customizable icons
- Theme-aware styling

## Usage

\`\`\`tsx
import { RecordButton } from '@mieweb/ui';

// Basic usage
<RecordButton
  onRecordingComplete={(blob, duration) => {
    // Handle the recorded audio
  }}
/>

// In an input field
<div className="relative">
  <Input className="pr-12" />
  <div className="absolute right-2 top-1/2 -translate-y-1/2">
    <RecordButton size="sm" />
  </div>
</div>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'primary'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    maxDuration: {
      control: { type: 'number', min: 0, max: 300 },
    },
    showDuration: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecordButton>;

// ============================================================================
// Basic Examples
// ============================================================================

export const Default: Story = {
  args: {},
};

export const WithDuration: Story = {
  args: {
    showDuration: true,
    maxDuration: 30,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows recording duration while recording.',
      },
    },
  },
};

// ============================================================================
// Variants
// ============================================================================

export const DefaultVariant: Story = {
  args: {
    variant: 'default',
  },
};

export const FilledVariant: Story = {
  args: {
    variant: 'filled',
  },
};

export const PrimaryVariant: Story = {
  args: {
    variant: 'primary',
  },
};

// ============================================================================
// Sizes
// ============================================================================

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <RecordButton size="sm" />
        <p className="mt-2 text-xs text-neutral-500">Small</p>
      </div>
      <div className="text-center">
        <RecordButton size="md" />
        <p className="mt-2 text-xs text-neutral-500">Medium</p>
      </div>
      <div className="text-center">
        <RecordButton size="lg" />
        <p className="mt-2 text-xs text-neutral-500">Large</p>
      </div>
    </div>
  ),
};

// ============================================================================
// In Context Examples
// ============================================================================

export const InInputField: Story = {
  render: function InInputFieldStory() {
    const [recordings, setRecordings] = React.useState<
      Array<{ id: string; duration: number }>
    >([]);

    return (
      <div className="w-80 space-y-3">
        <div className="relative">
          <Input placeholder="Type or record a message..." className="pr-12" />
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <RecordButton
              size="sm"
              onRecordingComplete={(blob, duration) => {
                setRecordings((prev) => [
                  ...prev,
                  { id: Date.now().toString(), duration },
                ]);
              }}
            />
          </div>
        </div>
        {recordings.length > 0 && (
          <div className="text-xs text-neutral-500">
            {recordings.length} recording(s) captured
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RecordButton embedded inside an input field.',
      },
    },
  },
};

export const InTextarea: Story = {
  render: function InTextareaStory() {
    return (
      <div className="w-80">
        <div className="relative">
          <Textarea
            placeholder="Write your message or record audio..."
            rows={4}
            className="pb-10"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <RecordButton size="sm" variant="filled" showDuration />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RecordButton at the bottom of a textarea.',
      },
    },
  },
};

export const ChatInputExample: Story = {
  render: function ChatInputExampleStory() {
    const [message, setMessage] = React.useState('');
    const [attachments, setAttachments] = React.useState<
      Array<{ name: string; duration: number }>
    >([]);

    const handleRecording = (blob: Blob, duration: number) => {
      const name = `recording-${new Date().toISOString()}.webm`;
      setAttachments((prev) => [...prev, { name, duration }]);
    };

    return (
      <div className="w-96 space-y-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
                <span>{Math.round(att.duration)}s</span>
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="ml-1 text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="focus:ring-primary-500 flex-1 resize-none rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-neutral-700"
          />
          <RecordButton
            variant="filled"
            onRecordingComplete={handleRecording}
            showDuration
          />
          <button className="bg-primary-600 hover:bg-primary-700 h-9 rounded-lg px-4 text-sm font-medium text-white">
            Send
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Full chat input example with recording attachments.',
      },
    },
  },
};

// ============================================================================
// States
// ============================================================================

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithMaxDuration: Story = {
  args: {
    maxDuration: 10,
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Automatically stops recording after 10 seconds.',
      },
    },
  },
};

// ============================================================================
// Callbacks
// ============================================================================

export const WithCallbacks: Story = {
  args: {
    showDuration: true,
    onRecordingStart: () => console.log('Recording started'),
    onRecordingComplete: (blob, duration) =>
      console.log('Recording complete:', { blob, duration }),
    onError: (error) => console.error('Error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'Check the console for callback events.',
      },
    },
  },
};

// ============================================================================
// Custom Icons
// ============================================================================

export const CustomIcons: Story = {
  args: {
    idleIcon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
          clipRule="evenodd"
        />
      </svg>
    ),
    recordingIcon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Using custom icons for idle and recording states.',
      },
    },
  },
};

// ============================================================================
// Dark Mode
// ============================================================================

export const DarkModePreview: Story = {
  render: () => (
    <div className="dark flex items-center gap-4 rounded-xl bg-neutral-900 p-6">
      <RecordButton variant="default" />
      <RecordButton variant="filled" />
      <RecordButton variant="primary" />
    </div>
  ),
};
