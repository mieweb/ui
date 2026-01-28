import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  LoadingDots,
  LoadingBar,
  LoadingPage,
  LoadingOverlay,
  LoadingSkeleton,
  CardSkeleton,
} from './LoadingPage';

const meta: Meta<typeof LoadingPage> = {
  title: 'Components/LoadingPage',
  component: LoadingPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Loading state components: full-page loaders, overlays, progress bars, and skeletons.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingPage>;

/** Default full-page loading state */
export const Default: Story = {
  args: {
    message: 'Loading...',
    subMessage: 'Please wait',
  },
};

/** Loading with progress bar */
export const WithProgress: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);
    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((p) => (p >= 100 ? 0 : p + 10));
      }, 500);
      return () => clearInterval(timer);
    }, []);
    return (
      <LoadingPage
        message="Uploading..."
        subMessage={`${progress}% complete`}
        indicator="bar"
        progress={progress}
      />
    );
  },
};

/** Overlay on content */
export const Overlay: Story = {
  render: () => {
    const [loading, setLoading] = React.useState(false);
    return (
      <div className="p-8">
        <LoadingOverlay isLoading={loading} message="Saving...">
          <div className="max-w-md rounded-lg border bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Edit Profile</h3>
            <input
              placeholder="Name"
              className="mb-4 w-full rounded border px-3 py-2"
            />
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 2000);
              }}
              className="bg-primary-600 w-full rounded px-4 py-2 text-white"
            >
              Save
            </button>
          </div>
        </LoadingOverlay>
      </div>
    );
  },
};

/** Skeleton placeholders */
export const Skeletons: Story = {
  render: () => (
    <div className="max-w-md space-y-6 p-8">
      <div className="flex items-center gap-4">
        <LoadingSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="60%" className="mb-2" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
      <LoadingSkeleton variant="rounded" height={160} />
      <LoadingSkeleton variant="text" count={3} />
    </div>
  ),
};

/** Card skeleton for lists */
export const CardSkeletonExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  ),
};

/** Loading dots indicator */
export const Dots: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-8 p-8">
      <LoadingDots size="sm" />
      <LoadingDots size="md" />
      <LoadingDots size="lg" />
    </div>
  ),
};

/** Progress bar colors */
export const ProgressBarColors: Story = {
  render: () => (
    <div className="max-w-md space-y-4 p-8">
      <LoadingBar progress={60} color="primary" />
      <LoadingBar progress={60} color="success" />
      <LoadingBar progress={60} color="warning" />
      <LoadingBar progress={60} color="error" />
    </div>
  ),
};
