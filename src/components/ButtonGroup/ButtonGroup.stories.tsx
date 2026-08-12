import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, type ButtonGroupProps } from './ButtonGroup';
import { Button, type ButtonProps } from '../Button';

type ButtonVariant = NonNullable<ButtonProps['variant']>;

type PlaygroundArgs = ButtonGroupProps & {
  /** Label for the first button (empty hides it) */
  firstLabel: string;
  /** Label for the second button (empty hides it) */
  secondLabel: string;
  /** Label for the third button (empty hides it) */
  thirdLabel: string;
  /** Variant for the first button */
  firstVariant: ButtonVariant;
  /** Variant for the second button */
  secondVariant: ButtonVariant;
  /** Variant for the third button */
  thirdVariant: ButtonVariant;
  /** Width of the resizable demo container in px */
  containerWidth: number;
};

const variantOptions: ButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
  'outline',
  'danger',
  'link',
];

/** Shared playground: resizable container + up to three label-driven buttons */
function renderPlayground({
  firstLabel,
  secondLabel,
  thirdLabel,
  firstVariant,
  secondVariant,
  thirdVariant,
  containerWidth,
  ...groupProps
}: PlaygroundArgs) {
  const buttons = [
    { label: firstLabel, variant: firstVariant },
    { label: secondLabel, variant: secondVariant },
    { label: thirdLabel, variant: thirdVariant },
  ].filter((b) => b.label);
  return (
    <div
      className="resize-x overflow-auto rounded-lg border border-dashed border-neutral-300 p-4"
      style={{ width: containerWidth, minWidth: 140, maxWidth: 720 }}
    >
      <ButtonGroup {...groupProps}>
        {buttons.map(({ label, variant }, i) => (
          <Button key={i} variant={variant}>
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Forms & Inputs/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['auto', 'horizontal', 'vertical'],
    },
    split: {
      options: [false, true, 2],
      control: {
        type: 'select',
        labels: {
          false: 'No split — all buttons right',
          true: 'First button left, rest right',
          2: 'First two left, rest right',
        },
      },
    },
    firstLabel: { control: 'text' },
    secondLabel: { control: 'text' },
    thirdLabel: { control: 'text' },
    firstVariant: { control: 'select', options: variantOptions },
    secondVariant: { control: 'select', options: variantOptions },
    thirdVariant: { control: 'select', options: variantOptions },
    containerWidth: {
      control: { type: 'range', min: 140, max: 720, step: 10 },
    },
  },
  args: {
    orientation: 'auto',
    split: false,
    firstLabel: 'Cancel',
    secondLabel: 'Save draft',
    thirdLabel: 'Save and close',
    firstVariant: 'danger',
    secondVariant: 'secondary',
    thirdVariant: 'primary',
    containerWidth: 480,
  },
  render: renderPlayground,
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

/**
 * Adjust the label and container-width controls (or drag the dashed
 * container's resize handle) to see the group respond.
 */
export const Default: Story = {};

/**
 * Drag the resize handle or the container-width control: while the row fits,
 * buttons stay side by side. As soon as a label would truncate, the group
 * stacks vertically so the full text stays readable — and returns to a row
 * when space allows.
 */
export const AutoStacking: Story = {
  args: {
    firstLabel: 'No, keep this record and return to the previous screen',
    secondLabel: 'Yes, permanently delete this patient encounter record',
    thirdLabel: '',
    firstVariant: 'secondary',
    secondVariant: 'danger',
  },
};

/**
 * One short and one long label. Starting wide, the group is horizontal with
 * both labels fully visible. Narrow the container: the moment the long label
 * would truncate, the group stacks so the full text stays readable. Narrower
 * still, even the stacked button truncates (with auto tooltip).
 */
export const MixedLengthLabels: Story = {
  args: {
    firstLabel: 'Cancel',
    secondLabel: 'Submit encounter and notify the care team',
    thirdLabel: '',
    firstVariant: 'secondary',
    secondVariant: 'primary',
    containerWidth: 560,
  },
};

/**
 * `split` divides the row into left and right sections: `true` puts the first
 * button on the left, `2` puts two on the left, etc. Without `split`, all
 * buttons align right. When the group stacks, the split is ignored and
 * buttons render in order, full width.
 */
export const SplitActions: Story = {
  args: {
    split: true,
    firstLabel: 'Back',
    secondLabel: 'Save draft',
    thirdLabel: 'Submit encounter',
    firstVariant: 'ghost',
    secondVariant: 'secondary',
    thirdVariant: 'primary',
    containerWidth: 560,
  },
};
