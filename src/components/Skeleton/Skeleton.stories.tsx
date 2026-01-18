import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'text',
        'title',
        'avatar',
        'button',
        'card',
        'image',
      ],
      description: 'The visual style variant of the skeleton',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    width: {
      control: 'text',
      description:
        'Width of the skeleton (number for px or string for CSS value)',
    },
    height: {
      control: 'text',
      description:
        'Height of the skeleton (number for px or string for CSS value)',
    },
    circle: {
      control: 'boolean',
      description: 'Whether to render as a circle (rounded-full)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Skeleton width="100%" height={40} />
    </div>
  ),
};

export const Text: Story = {
  render: () => (
    <div className="w-80">
      <Skeleton variant="text" />
    </div>
  ),
};

export const Title: Story = {
  render: () => (
    <div className="w-80">
      <Skeleton variant="title" width="60%" />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={48} height={48} />
      <Skeleton circle width={56} height={56} />
    </div>
  ),
};

export const Button: Story = {
  render: () => (
    <div className="flex gap-2">
      <Skeleton variant="button" />
      <Skeleton variant="button" width={100} />
      <Skeleton variant="button" width={150} />
    </div>
  ),
};

export const Image: Story = {
  render: () => (
    <div className="w-80">
      <Skeleton variant="image" className="rounded-lg" />
    </div>
  ),
};

export const TextBlock: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonText lines={4} lastLineWidth="70%" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showImage showAvatar textLines={2} />
    </div>
  ),
};

export const CardWithoutImage: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showImage={false} showAvatar textLines={3} />
    </div>
  ),
};

export const Table: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <SkeletonTable rows={5} columns={4} />
    </div>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <div className="border-border bg-card w-80 rounded-xl border p-4">
      <div className="mb-4 flex items-center gap-4">
        <Skeleton circle width={64} height={64} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
      <SkeletonText lines={3} gap="md" />
      <div className="mt-4 flex gap-2">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="flex-1" />
      </div>
    </div>
  ),
};

export const ListItems: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton circle width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} showAvatar={false} textLines={1} />
      ))}
    </div>
  ),
};
