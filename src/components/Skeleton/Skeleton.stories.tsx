import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from './Skeleton';

// =============================================================================
// Example Types
// =============================================================================

type ExampleType =
  | 'custom'
  | 'default'
  | 'text'
  | 'title'
  | 'avatar'
  | 'button'
  | 'image'
  | 'textBlock'
  | 'card'
  | 'cardWithoutImage'
  | 'cardMinimal'
  | 'table'
  | 'profileCard'
  | 'listItems';

// =============================================================================
// Wrapper Component
// =============================================================================

interface SkeletonExampleProps {
  example: ExampleType;
  /** Custom width (CSS value like '100%' or '200px') */
  customWidth?: string;
  /** Custom height in pixels */
  customHeight?: number;
  /** Custom variant */
  customVariant?: 'default' | 'text' | 'title' | 'avatar' | 'button' | 'card' | 'image';
  /** Custom border radius */
  customRounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Avatar size in pixels */
  avatarSize?: number;
  /** Number of text lines (for textBlock) */
  textLines?: number;
  /** Last line width (for textBlock) */
  lastLineWidth?: string;
  /** Text gap size (for textBlock) */
  textGap?: 'sm' | 'md' | 'lg';
  /** Show image in card */
  cardShowImage?: boolean;
  /** Show avatar in card */
  cardShowAvatar?: boolean;
  /** Number of text lines in card */
  cardTextLines?: number;
  /** Number of table rows */
  tableRows?: number;
  /** Number of table columns */
  tableColumns?: number;
  /** Number of list items */
  listItemCount?: number;
}

function SkeletonExample({
  example,
  customWidth = '100%',
  customHeight = 40,
  customVariant = 'default',
  customRounded = 'md',
  avatarSize = 48,
  textLines = 4,
  lastLineWidth = '70%',
  textGap = 'sm',
  cardShowImage = true,
  cardShowAvatar = true,
  cardTextLines = 2,
  tableRows = 5,
  tableColumns = 4,
  listItemCount = 4,
}: SkeletonExampleProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  switch (example) {
    case 'custom':
      return (
        <div className="w-80">
          <Skeleton
            variant={customVariant}
            width={customWidth}
            height={customHeight}
            className={roundedClasses[customRounded]}
          />
        </div>
      );

    case 'default':
      return (
        <div className="w-80">
          <Skeleton width="100%" height={40} />
        </div>
      );

    case 'text':
      return (
        <div className="w-80">
          <Skeleton variant="text" />
        </div>
      );

    case 'title':
      return (
        <div className="w-80">
          <Skeleton variant="title" width="60%" />
        </div>
      );

    case 'avatar':
      return (
        <div className="flex items-center justify-center">
          <Skeleton circle width={avatarSize} height={avatarSize} />
        </div>
      );

    case 'button':
      return (
        <div className="flex gap-2">
          <Skeleton variant="button" />
        </div>
      );

    case 'image':
      return (
        <div className="w-80">
          <Skeleton variant="image" className="rounded-lg" />
        </div>
      );

    case 'textBlock':
      return (
        <div className="w-80">
          <SkeletonText lines={textLines} lastLineWidth={lastLineWidth} gap={textGap} />
        </div>
      );

    case 'card':
      return (
        <div className="w-80">
          <SkeletonCard
            showImage={cardShowImage}
            showAvatar={cardShowAvatar}
            textLines={cardTextLines}
          />
        </div>
      );

    case 'cardWithoutImage':
      return (
        <div className="w-80">
          <SkeletonCard showImage={false} showAvatar={cardShowAvatar} textLines={cardTextLines} />
        </div>
      );

    case 'cardMinimal':
      return (
        <div className="w-80">
          <SkeletonCard showImage={false} showAvatar={false} textLines={cardTextLines} />
        </div>
      );

    case 'table':
      return (
        <div className="w-full max-w-2xl">
          <SkeletonTable rows={tableRows} columns={tableColumns} />
        </div>
      );

    case 'profileCard':
      return (
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
      );

    case 'listItems':
      return (
        <div className="w-80 space-y-4">
          {Array.from({ length: listItemCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton circle width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// =============================================================================
// Meta Configuration
// =============================================================================

const meta = {
  title: 'Components/Skeleton',
  component: SkeletonExample,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    example: {
      control: 'select',
      options: [
        'custom',
        'default',
        'text',
        'title',
        'avatar',
        'button',
        'image',
        'textBlock',
        'card',
        'cardWithoutImage',
        'cardMinimal',
        'table',
        'profileCard',
        'listItems',
      ],
      description: 'Type of skeleton example to display',
    },
    customWidth: {
      control: 'text',
      description: 'Width (CSS value like "100%" or "200px")',
    },
    customHeight: {
      control: { type: 'number', min: 8, max: 400 },
      description: 'Height in pixels',
    },
    customVariant: {
      control: 'select',
      options: ['default', 'text', 'title', 'avatar', 'button', 'card', 'image'],
      description: 'Variant type',
    },
    customRounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius',
    },
    avatarSize: {
      control: { type: 'number', min: 24, max: 128 },
      description: 'Avatar size in pixels',
      if: { arg: 'example', eq: 'avatar' },
    },
    textLines: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of text lines',
      if: { arg: 'example', eq: 'textBlock' },
    },
    lastLineWidth: {
      control: 'text',
      description: 'Width of the last line',
      if: { arg: 'example', eq: 'textBlock' },
    },
    textGap: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Gap between text lines',
      if: { arg: 'example', eq: 'textBlock' },
    },
    cardShowImage: {
      control: 'boolean',
      description: 'Show image in card',
      if: { arg: 'example', eq: 'card' },
    },
    cardShowAvatar: {
      control: 'boolean',
      description: 'Show avatar in card',
      if: { arg: 'example', eq: 'card' },
    },
    cardTextLines: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Number of text lines in card',
      if: { arg: 'example', eq: 'card' },
    },
    tableRows: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Number of table rows',
      if: { arg: 'example', eq: 'table' },
    },
    tableColumns: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of table columns',
      if: { arg: 'example', eq: 'table' },
    },
    listItemCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of list items',
      if: { arg: 'example', eq: 'listItems' },
    },
  },
} satisfies Meta<typeof SkeletonExample>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories with Args (Controls Work)
// =============================================================================

export const Default: Story = {
  args: {
    example: 'custom',
    customWidth: '200px',
    customHeight: 40,
    customVariant: 'default',
    customRounded: 'md',
  },
};

export const Text: Story = {
  args: {
    example: 'text',
  },
};

export const Title: Story = {
  args: {
    example: 'title',
  },
};

export const Avatar: Story = {
  args: {
    example: 'avatar',
    avatarSize: 48,
  },
};

export const Button: Story = {
  args: {
    example: 'button',
  },
};

export const Image: Story = {
  args: {
    example: 'image',
  },
};

export const TextBlock: Story = {
  args: {
    example: 'textBlock',
    textLines: 4,
    lastLineWidth: '70%',
    textGap: 'sm',
  },
};

export const Card: Story = {
  args: {
    example: 'card',
    cardShowImage: true,
    cardShowAvatar: true,
    cardTextLines: 2,
  },
};

export const CardWithoutImage: Story = {
  args: {
    example: 'cardWithoutImage',
    cardShowAvatar: true,
    cardTextLines: 3,
  },
};

export const CardMinimal: Story = {
  args: {
    example: 'cardMinimal',
    cardTextLines: 2,
  },
};

export const Table: Story = {
  args: {
    example: 'table',
    tableRows: 5,
    tableColumns: 4,
  },
};

export const ProfileCard: Story = {
  args: {
    example: 'profileCard',
  },
};

export const ListItems: Story = {
  args: {
    example: 'listItems',
    listItemCount: 4,
  },
};

// =============================================================================
// Showcase Stories (Controls Disabled)
// =============================================================================

export const AvatarSizes: Story = {
  args: {
    example: 'avatar',
  },
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton circle width={32} height={32} />
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={48} height={48} />
      <Skeleton circle width={56} height={56} />
      <Skeleton circle width={64} height={64} />
    </div>
  ),
};

export const ButtonVariations: Story = {
  args: {
    example: 'button',
  },
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex gap-2">
      <Skeleton variant="button" width={80} />
      <Skeleton variant="button" width={100} />
      <Skeleton variant="button" width={120} />
      <Skeleton variant="button" width={150} />
    </div>
  ),
};

export const Grid: Story = {
  args: {
    example: 'card',
  },
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} showAvatar={false} textLines={1} />
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  args: {
    example: 'default',
  },
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="w-80 space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Default</p>
        <Skeleton width="100%" height={40} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Text</p>
        <Skeleton variant="text" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Title</p>
        <Skeleton variant="title" width="60%" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Avatar</p>
        <Skeleton variant="avatar" circle width={48} height={48} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Button</p>
        <Skeleton variant="button" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Card</p>
        <Skeleton variant="card" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Image</p>
        <Skeleton variant="image" className="rounded-lg" />
      </div>
    </div>
  ),
};
