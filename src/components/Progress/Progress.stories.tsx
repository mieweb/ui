import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress, CircularProgress } from './Progress';

const meta: Meta<typeof Progress> = {
  id: 'loading-progress',
  title: 'Components/Loading/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

Determinate progress. \`Progress\` is a linear bar (\`value\`/\`max\`, \`label\`, \`showValue\`, \`formatValue\`, four \`size\`s, \`striped\`/\`animated\` fills) and \`CircularProgress\` is the ring form for tight spaces. Both expose \`role="progressbar"\` with \`aria-valuenow/min/max\`, and share the \`default\` / \`success\` / \`warning\` / \`danger\` variants.

### Use it when

- You can report how far along something is: uploads, imports, multi-step processing, storage quotas, completion of a checklist.
- Showing a static ratio ("7 of 10 documents received") — progress bars read well as compact gauges.

### Don't use it when

- You cannot measure progress — an indeterminate \`Spinner\` is more honest than a bar that crawls.
- Indicating position in a multi-step form — \`StepIndicator\` names the steps.
- Reading position in a long article — \`ReadingProgressBar\` binds to scroll.

### Example

\`\`\`tsx
<Progress
  value={uploaded}
  max={total}
  label="Uploading records"
  showValue
  formatValue={(v, m) => \`\${v} of \${m}\`}
  variant={failed ? 'danger' : 'default'}
/>
\`\`\`

### Limitations

- Value changes are not announced; for long operations add a polite live region with milestone messages.
- \`animated\`/\`striped\` motion does not pause for \`prefers-reduced-motion\`.
- Colours are semantic tokens; the track uses the neutral token in both themes.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'loading-spinner',
          why: 'Progress needs a real value; fall back to Spinner when there is none.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Current progress value (0-100)',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum value (default: 100)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the progress bar',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Visual style variant',
    },
    label: {
      control: 'text',
      description: 'Label for the progress bar',
    },
    showValue: {
      control: 'boolean',
      description: 'Show the percentage value',
    },
    striped: {
      control: 'boolean',
      description: 'Show striped pattern',
    },
    animated: {
      control: 'boolean',
      description: 'Enable animation',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Show indeterminate loading state',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    size: 'md',
    variant: 'default',
    showValue: false,
    striped: false,
    animated: false,
    indeterminate: false,
  },
};

export const WithLabel: Story = {
  args: {
    ...Default.args,
    value: 45,
    label: 'Upload progress',
    showValue: true,
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    value: 60,
    size: 'sm',
    label: 'Small',
    showValue: true,
  },
};

export const Medium: Story = {
  args: {
    ...Default.args,
    value: 60,
    size: 'md',
    label: 'Medium',
    showValue: true,
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    value: 60,
    size: 'lg',
    label: 'Large',
    showValue: true,
  },
};

export const ExtraLarge: Story = {
  args: {
    ...Default.args,
    value: 60,
    size: 'xl',
    label: 'Extra Large',
    showValue: true,
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    value: 80,
    variant: 'success',
    label: 'Success',
    showValue: true,
  },
};

export const Warning: Story = {
  args: {
    ...Default.args,
    value: 50,
    variant: 'warning',
    label: 'Warning',
    showValue: true,
  },
};

export const Danger: Story = {
  args: {
    ...Default.args,
    value: 30,
    variant: 'danger',
    label: 'Danger',
    showValue: true,
  },
};

export const Striped: Story = {
  args: {
    ...Default.args,
    value: 70,
    striped: true,
    label: 'Striped progress',
    showValue: true,
  },
};

export const Animated: Story = {
  args: {
    ...Default.args,
    value: 50,
    animated: true,
    label: 'Animated progress',
    showValue: true,
  },
};

export const Indeterminate: Story = {
  args: {
    ...Default.args,
    value: 0,
    indeterminate: true,
    label: 'Loading...',
    showValue: false,
  },
};

export const CustomMax: Story = {
  args: {
    ...Default.args,
    value: 750,
    max: 1000,
    label: 'Storage used',
    showValue: true,
  },
};

// Circular Progress stories
type CircularStory = StoryObj<typeof CircularProgress>;

export const CircularDefault: CircularStory = {
  args: {
    value: 75,
    size: 'md',
    variant: 'default',
    showValue: true,
    indeterminate: false,
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularSmall: CircularStory = {
  args: {
    ...CircularDefault.args,
    size: 'sm',
    value: 60,
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularLarge: CircularStory = {
  args: {
    ...CircularDefault.args,
    size: 'lg',
    value: 60,
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularExtraLarge: CircularStory = {
  args: {
    ...CircularDefault.args,
    size: 'xl',
    value: 60,
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularSuccess: CircularStory = {
  args: {
    ...CircularDefault.args,
    value: 100,
    variant: 'success',
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularWarning: CircularStory = {
  args: {
    ...CircularDefault.args,
    value: 50,
    variant: 'warning',
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularDanger: CircularStory = {
  args: {
    ...CircularDefault.args,
    value: 25,
    variant: 'danger',
  },
  render: (args) => <CircularProgress {...args} />,
};

export const CircularIndeterminate: CircularStory = {
  args: {
    ...CircularDefault.args,
    value: 0,
    indeterminate: true,
    showValue: false,
  },
  render: (args) => <CircularProgress {...args} />,
};

// Animated demo with state management
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
    <div className="flex items-center gap-8">
      <div className="w-60">
        <Progress value={progress} label="Downloading..." showValue />
      </div>
      <CircularProgress value={progress} size="lg" showValue />
    </div>
  );
}

export const AnimatedDemo: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => <AnimatedProgressDemo />,
};

// Showcase stories
export const AllSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} size="sm" label="Small" showValue />
      <Progress value={60} size="md" label="Medium" showValue />
      <Progress value={60} size="lg" label="Large" showValue />
      <Progress value={60} size="xl" label="Extra Large" showValue />
    </div>
  ),
};

export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} variant="default" label="Default" showValue />
      <Progress value={80} variant="success" label="Success" showValue />
      <Progress value={50} variant="warning" label="Warning" showValue />
      <Progress value={30} variant="danger" label="Danger" showValue />
    </div>
  ),
};

export const AllCircularSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={60} size="sm" showValue />
      <CircularProgress value={60} size="md" showValue />
      <CircularProgress value={60} size="lg" showValue />
      <CircularProgress value={60} size="xl" showValue />
    </div>
  ),
};

export const AllCircularVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={75} variant="default" showValue />
      <CircularProgress value={100} variant="success" showValue />
      <CircularProgress value={50} variant="warning" showValue />
      <CircularProgress value={25} variant="danger" showValue />
    </div>
  ),
};

// Use case examples
export const FileUploadExample: Story = {
  parameters: {
    controls: { disable: true },
  },
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

export const SkillLevelsExample: Story = {
  parameters: {
    controls: { disable: true },
  },
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
