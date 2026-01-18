import type { Meta, StoryObj } from '@storybook/react';
import { Text, SmallMuted } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'muted',
        'primary',
        'destructive',
        'success',
        'warning',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    truncate: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a paragraph of text.',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-2">
      <Text variant="default">Default text</Text>
      <Text variant="muted">Muted text</Text>
      <Text variant="primary">Primary text</Text>
      <Text variant="destructive">Destructive text</Text>
      <Text variant="success">Success text</Text>
      <Text variant="warning">Warning text</Text>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-2">
      <Text size="xs">Extra small text (xs)</Text>
      <Text size="sm">Small text (sm)</Text>
      <Text size="base">Base text (base)</Text>
      <Text size="lg">Large text (lg)</Text>
      <Text size="xl">Extra large text (xl)</Text>
      <Text size="2xl">2XL text</Text>
      <Text size="3xl">3XL text</Text>
    </div>
  ),
};

export const AllWeights: Story = {
  render: () => (
    <div className="space-y-2">
      <Text weight="normal">Normal weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
      <Text weight="bold">Bold weight</Text>
    </div>
  ),
};

export const AsHeadings: Story = {
  render: () => (
    <div className="space-y-4">
      <Text as="h1" size="3xl" weight="bold">
        Heading 1
      </Text>
      <Text as="h2" size="2xl" weight="bold">
        Heading 2
      </Text>
      <Text as="h3" size="xl" weight="semibold">
        Heading 3
      </Text>
      <Text as="h4" size="lg" weight="semibold">
        Heading 4
      </Text>
      <Text as="p">Regular paragraph text.</Text>
    </div>
  ),
};

export const Truncated: Story = {
  args: {
    children:
      'This is a very long text that will be truncated if it exceeds the container width. You can use the truncate prop to enable this behavior.',
    truncate: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export const SmallMutedExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Text weight="semibold">Form Field Label</Text>
        <SmallMuted>This is helper text using SmallMuted component.</SmallMuted>
      </div>
      <div>
        <Text weight="semibold">Another Field</Text>
        <SmallMuted>
          SmallMuted is a convenience component for helper text.
        </SmallMuted>
      </div>
    </div>
  ),
};
