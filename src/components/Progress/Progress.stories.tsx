import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress, CircularProgress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
    },
    showValue: {
      control: 'boolean',
    },
    striped: {
      control: 'boolean',
    },
    animated: {
      control: 'boolean',
    },
    indeterminate: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={60} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={45} label="Upload progress" showValue />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} size="sm" label="Small" showValue />
      <Progress value={60} size="md" label="Medium" showValue />
      <Progress value={60} size="lg" label="Large" showValue />
      <Progress value={60} size="xl" label="Extra Large" showValue />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} variant="default" label="Default" showValue />
      <Progress value={80} variant="success" label="Success" showValue />
      <Progress value={50} variant="warning" label="Warning" showValue />
      <Progress value={30} variant="danger" label="Danger" showValue />
    </div>
  ),
};

export const Striped: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={70} striped label="Striped progress" showValue />
    </div>
  ),
};

export const Animated: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={50} animated label="Animated progress" showValue />
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={0} indeterminate label="Loading..." />
    </div>
  ),
};

export const CustomFormat: Story = {
  render: () => (
    <div className="w-80">
      <Progress
        value={750}
        max={1000}
        label="Storage used"
        showValue
        formatValue={(value, max) => `${value}MB / ${max}MB`}
      />
    </div>
  ),
};

// Circular Progress Stories
export const CircularDefault: Story = {
  render: () => <CircularProgress value={75} showValue />,
};

export const CircularSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={60} size="sm" showValue />
      <CircularProgress value={60} size="md" showValue />
      <CircularProgress value={60} size="lg" showValue />
      <CircularProgress value={60} size="xl" showValue />
    </div>
  ),
};

export const CircularVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={75} variant="default" showValue />
      <CircularProgress value={100} variant="success" showValue />
      <CircularProgress value={50} variant="warning" showValue />
      <CircularProgress value={25} variant="danger" showValue />
    </div>
  ),
};

export const CircularIndeterminate: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={0} size="sm" indeterminate />
      <CircularProgress value={0} size="md" indeterminate />
      <CircularProgress value={0} size="lg" indeterminate />
    </div>
  ),
};

function AnimatedProgressDemo() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-80 space-y-4">
      <Progress value={progress} label="Downloading..." showValue />
      <CircularProgress value={progress} size="lg" showValue />
    </div>
  );
}

export const AnimatedDemo: Story = {
  render: () => <AnimatedProgressDemo />,
};

export const UseCaseFileUpload: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">document.pdf</span>
        <span className="text-muted-foreground text-xs">2.5 MB</span>
      </div>
      <Progress value={65} size="sm" variant="default" />
      <p className="text-muted-foreground text-xs">Uploading... 65%</p>
    </div>
  ),
};

export const UseCaseSkillLevel: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress
        value={90}
        size="sm"
        variant="success"
        label="JavaScript"
        showValue
      />
      <Progress
        value={75}
        size="sm"
        variant="success"
        label="TypeScript"
        showValue
      />
      <Progress
        value={60}
        size="sm"
        variant="default"
        label="React"
        showValue
      />
      <Progress value={45} size="sm" variant="warning" label="Vue" showValue />
    </div>
  ),
};
