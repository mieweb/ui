import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import {
  TimelineProgress,
  TimelineEventList,
  OrderConfirmation,
  type TimelineStep,
  type TimelineEvent,
  type TimelineSize,
} from './Timeline';

// =============================================================================
// TimelineProgress Stories
// =============================================================================

const sampleSteps: TimelineStep[] = [
  { key: 'submitted', label: 'Submitted', completedAt: '2024-01-15T10:00:00Z' },
  {
    key: 'processing',
    label: 'Processing',
    completedAt: '2024-01-15T11:30:00Z',
  },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'results', label: 'Results' },
];

// Wrapper to support hasError boolean in Storybook
interface TimelineProgressWrapperProps {
  steps: TimelineStep[];
  currentStep: string;
  showTimestamps?: boolean;
  size?: TimelineSize;
  pulse?: boolean;
  hasError?: boolean;
}

function TimelineProgressWrapper({
  steps,
  currentStep,
  showTimestamps,
  size = 'md',
  pulse = true,
  hasError = false,
}: TimelineProgressWrapperProps) {
  const modifiedSteps = hasError
    ? steps.map((step) =>
        step.key === currentStep ? { ...step, error: true } : step
      )
    : steps;

  return (
    <TimelineProgress
      steps={modifiedSteps}
      currentStep={currentStep}
      showTimestamps={showTimestamps}
      size={size}
      pulse={pulse}
    />
  );
}

const progressMeta: Meta<typeof TimelineProgressWrapper> = {
  title: 'Data Display/Timeline/Progress',
  component: TimelineProgressWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A horizontal timeline progress indicator showing order/workflow steps.',
      },
    },
  },
  argTypes: {
    currentStep: {
      control: 'select',
      options: ['submitted', 'processing', 'scheduled', 'completed', 'results'],
      description: 'The current step key in the timeline',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the timeline',
    },
    showTimestamps: {
      control: 'boolean',
      description: 'Whether to show timestamps above each step',
    },
    pulse: {
      control: 'boolean',
      description: 'Show a pulse animation on the current step',
    },
    hasError: {
      control: 'boolean',
      description: 'Set the current step to an error state',
    },
  },
};

export default progressMeta;
type ProgressStory = StoryObj<typeof TimelineProgressWrapper>;

export const Default: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'scheduled',
    hasError: false,
  },
};

export const AllCompleted: ProgressStory = {
  args: {
    steps: sampleSteps.map((step) => ({ ...step, completedAt: '2024-01-15' })),
    currentStep: 'results',
  },
  parameters: {
    docs: {
      description: { story: 'Timeline with all steps completed.' },
    },
  },
};

export const JustStarted: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'submitted',
  },
  parameters: {
    docs: {
      description: { story: 'Timeline at the beginning.' },
    },
  },
};

export const WithoutTimestamps: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'processing',
    showTimestamps: false,
  },
  parameters: {
    docs: {
      description: { story: 'Timeline without timestamp labels.' },
    },
  },
};

export const WithError: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'scheduled',
    hasError: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Timeline with an error step. Toggle the hasError control to see the error state.',
      },
    },
  },
};

export const Small: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'scheduled',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: { story: 'Small size variant for compact layouts.' },
    },
  },
};

export const Medium: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'scheduled',
    size: 'md',
  },
  parameters: {
    docs: {
      description: { story: 'Medium size variant (default).' },
    },
  },
};

export const Large: ProgressStory = {
  args: {
    steps: sampleSteps,
    currentStep: 'scheduled',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: { story: 'Large size variant for prominent displays.' },
    },
  },
};

// =============================================================================
// TimelineEventList Stories
// =============================================================================

export const EventList: StoryObj<typeof TimelineEventList> = {
  render: () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        type: 'status',
        title: 'Order submitted',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        type: 'assignment',
        title: 'Provider assigned',
        content: 'Dr. Smith has been assigned to this order.',
        author: 'BlueHive Concierge',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        id: '3',
        type: 'message',
        title: 'Message from provider',
        content:
          'Please bring your insurance card and photo ID to the appointment.',
        author: 'Dr. Smith',
        timestamp: '2024-01-15T11:00:00Z',
      },
      {
        id: '4',
        type: 'attachment',
        title: 'Document uploaded',
        content: 'Lab_results_2024.pdf',
        timestamp: '2024-01-15T14:00:00Z',
      },
      {
        id: '5',
        type: 'note',
        title: 'Internal note',
        content: 'Patient confirmed appointment via phone.',
        author: 'Sarah (Support)',
        timestamp: '2024-01-15T15:00:00Z',
      },
    ];

    return (
      <div className="max-w-lg p-4">
        <TimelineEventList events={events} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A vertical list of timeline events with different types.',
      },
    },
  },
};

export const EventListRelativeTime: StoryObj<typeof TimelineEventList> = {
  render: () => {
    const now = new Date();
    const events: TimelineEvent[] = [
      {
        id: '1',
        type: 'status',
        title: 'Order completed',
        timestamp: new Date(now.getTime() - 30000), // 30 seconds ago
      },
      {
        id: '2',
        type: 'message',
        title: 'Results uploaded',
        timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
      },
      {
        id: '3',
        type: 'status',
        title: 'Order submitted',
        timestamp: new Date(now.getTime() - 86400000), // 1 day ago
      },
    ];

    return (
      <div className="max-w-lg p-4">
        <TimelineEventList events={events} relativeTime />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Timeline events with relative timestamps.' },
    },
  },
};

export const EmptyEventList: StoryObj<typeof TimelineEventList> = {
  render: () => (
    <div className="max-w-lg p-4">
      <TimelineEventList events={[]} />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Empty timeline event list.' },
    },
  },
};

// =============================================================================
// OrderConfirmation Stories
// =============================================================================

export const Confirmation: StoryObj<typeof OrderConfirmation> = {
  render: function ConfirmationStory() {
    const [open, setOpen] = useState(true);
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="bg-primary-600 rounded px-4 py-2 text-white"
        >
          Show Confirmation
        </button>
        <OrderConfirmation
          open={open}
          onClose={() => setOpen(false)}
          orderNumber="ORD-12345"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Order confirmation modal with animation.' },
    },
  },
};

// Mobile viewport
export const Mobile: ProgressStory = {
  args: {
    steps: sampleSteps.slice(0, 4),
    currentStep: 'processing',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: { story: 'Timeline progress on mobile viewport.' },
    },
  },
};
