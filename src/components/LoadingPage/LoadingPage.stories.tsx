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

// =============================================================================
// Demo Mode Types
// =============================================================================

type DemoMode =
  | 'default'
  | 'withProgress'
  | 'overlay'
  | 'skeletons'
  | 'cardSkeletons'
  | 'dots'
  | 'progressBarColors';

// =============================================================================
// Interactive Demo Wrapper
// =============================================================================

interface LoadingPageDemoProps {
  demoMode?: DemoMode;
  message?: string;
  subMessage?: string;
  indicator?: 'spinner' | 'dots' | 'bar' | 'pulse';
  spinnerSize?: 'sm' | 'md' | 'lg';
  size?: 'sm' | 'md' | 'lg';
  progress?: number;
}

function LoadingPageDemo({
  demoMode = 'default',
  message = 'Loading...',
  subMessage = 'Please wait',
  indicator = 'spinner',
  spinnerSize = 'lg',
  size = 'md',
  progress,
}: LoadingPageDemoProps) {
  // State for animated progress demo
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  React.useEffect(() => {
    if (demoMode === 'withProgress') {
      // Always start progress from 0 when entering the withProgress demo
      setAnimatedProgress(0);
      const timer = setInterval(() => {
        setAnimatedProgress((p) => (p >= 100 ? 0 : p + 10));
      }, 500);
      return () => clearInterval(timer);
    } else {
      // Ensure progress is reset when leaving the withProgress demo
      setAnimatedProgress(0);
    }
  }, [demoMode]);

  // State for overlay demo
  const [overlayLoading, setOverlayLoading] = React.useState(false);

  switch (demoMode) {
    case 'withProgress':
      return (
        <LoadingPage
          message="Uploading..."
          subMessage={`${animatedProgress}% complete`}
          indicator="bar"
          progress={animatedProgress}
          size={size}
        />
      );

    case 'overlay':
      return (
        <div className="p-8">
          <LoadingOverlay isLoading={overlayLoading} message="Saving...">
            <div className="bg-card border-border max-w-md rounded-lg border p-6">
              <h3 className="text-foreground mb-4 text-lg font-semibold">
                Edit Profile
              </h3>
              <input
                placeholder="Name"
                className="border-border bg-background mb-4 w-full rounded border px-3 py-2"
              />
              <button
                onClick={() => {
                  setOverlayLoading(true);
                  setTimeout(() => setOverlayLoading(false), 2000);
                }}
                className="bg-primary text-primary-foreground w-full rounded px-4 py-2"
              >
                Save
              </button>
            </div>
          </LoadingOverlay>
        </div>
      );

    case 'skeletons':
      return (
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
      );

    case 'cardSkeletons':
      return (
        <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );

    case 'dots':
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-8 p-8">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <LoadingDots size="sm" />
              <p className="text-muted-foreground mt-2 text-xs">Small</p>
            </div>
            <div className="text-center">
              <LoadingDots size="md" />
              <p className="text-muted-foreground mt-2 text-xs">Medium</p>
            </div>
            <div className="text-center">
              <LoadingDots size="lg" />
              <p className="text-muted-foreground mt-2 text-xs">Large</p>
            </div>
          </div>
        </div>
      );

    case 'progressBarColors':
      return (
        <div className="max-w-md space-y-4 p-8">
          <div>
            <p className="text-muted-foreground mb-1 text-sm">Primary</p>
            <LoadingBar progress={60} color="primary" />
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-sm">Success</p>
            <LoadingBar progress={60} color="success" />
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-sm">Warning</p>
            <LoadingBar progress={60} color="warning" />
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-sm">Error</p>
            <LoadingBar progress={60} color="error" />
          </div>
        </div>
      );

    case 'default':
    default:
      return (
        <LoadingPage
          message={message}
          subMessage={subMessage}
          indicator={indicator}
          spinnerSize={spinnerSize}
          size={size}
          progress={progress}
        />
      );
  }
}

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof LoadingPageDemo> = {
  title: 'Components/LoadingPage',
  component: LoadingPageDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Loading state components: full-page loaders, overlays, progress bars, and skeletons. Use the "Demo Mode" control to explore different loading patterns.',
      },
    },
  },
  args: {
    demoMode: 'default',
    message: 'Loading...',
    subMessage: 'Please wait',
    indicator: 'spinner',
    spinnerSize: 'lg',
    size: 'md',
    progress: undefined,
  },
  argTypes: {
    demoMode: {
      control: 'select',
      options: [
        'default',
        'withProgress',
        'overlay',
        'skeletons',
        'cardSkeletons',
        'dots',
        'progressBarColors',
      ],
      description: 'Switch between different loading pattern demos',
      table: {
        category: 'Demo',
      },
    },
    message: {
      control: 'text',
      description: 'Loading message (default mode only)',
      if: { arg: 'demoMode', eq: 'default' },
    },
    subMessage: {
      control: 'text',
      description: 'Sub-message or additional info (default mode only)',
      if: { arg: 'demoMode', eq: 'default' },
    },
    indicator: {
      control: 'select',
      options: ['spinner', 'dots', 'bar', 'pulse'],
      description: 'Loading indicator type (default mode only)',
      if: { arg: 'demoMode', eq: 'default' },
    },
    spinnerSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Spinner size (default mode only)',
      if: { arg: 'demoMode', eq: 'default' },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Page container size (default and withProgress modes only)',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value for bar indicator (default mode only)',
      if: { arg: 'demoMode', eq: 'default' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingPageDemo>;

/** Interactive demo - use Demo Mode control to explore all loading patterns */
export const Default: Story = {};

/** Loading with animated progress bar */
export const WithProgress: Story = {
  args: {
    demoMode: 'withProgress',
  },
};

/** Overlay on content - click Save to trigger */
export const Overlay: Story = {
  args: {
    demoMode: 'overlay',
  },
};

/** Skeleton placeholders for content loading */
export const Skeletons: Story = {
  args: {
    demoMode: 'skeletons',
  },
};

/** Card skeleton grid for lists */
export const CardSkeletonExample: Story = {
  args: {
    demoMode: 'cardSkeletons',
  },
};

/** Loading dots indicator sizes */
export const Dots: Story = {
  args: {
    demoMode: 'dots',
  },
};

/** Progress bar color variants */
export const ProgressBarColors: Story = {
  args: {
    demoMode: 'progressBarColors',
  },
};
