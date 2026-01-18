import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner, SpinnerWithLabel } from './Spinner';
import { Button } from '../Button';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'muted', 'white'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner variant="default" />
      <Spinner variant="muted" />
      <div className="rounded-lg bg-neutral-800 p-4">
        <Spinner variant="white" />
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <SpinnerWithLabel label="Loading..." />
      <SpinnerWithLabel label="Processing" labelPosition="right" />
      <SpinnerWithLabel label="Please wait" labelPosition="left" />
      <SpinnerWithLabel label="Saving changes" labelPosition="top" />
    </div>
  ),
};

export const InsideButton: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <Spinner size="sm" variant="white" />
        <span>Loading...</span>
      </Button>
      <Button variant="secondary" disabled>
        <Spinner size="sm" variant="muted" />
        <span>Processing</span>
      </Button>
    </div>
  ),
};

export const FullPage: Story = {
  render: () => (
    <div className="border-border relative h-[300px] w-[400px] overflow-hidden rounded-lg border">
      <p className="text-muted-foreground p-4">Content behind the spinner...</p>
      <div className="bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-muted-foreground text-sm">Loading your data...</p>
        </div>
      </div>
    </div>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Spinner size="sm" variant="muted" />
      <span>Saving your changes...</span>
    </div>
  ),
};

export const LoadingCard: Story = {
  render: () => (
    <div className="border-border bg-card flex w-80 flex-col items-center gap-4 rounded-xl border p-8">
      <Spinner size="lg" />
      <div className="text-center">
        <h3 className="font-semibold">Loading Data</h3>
        <p className="text-muted-foreground text-sm">
          Please wait while we fetch your information
        </p>
      </div>
    </div>
  ),
};
