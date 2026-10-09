import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Rating } from './Rating';

const meta: Meta<typeof Rating> = {
  id: 'record-details-rating',
  title: 'Components/Record details/Rating',
  component: Rating,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'record-details-reviewcard',
          why: 'ReviewCard shows a read-only Rating beside the author and date.',
        },
      ],
    },
    docs: {
      description: {
        component: `
### What it's for

Shows a star rating. Without \`onChange\` it is a read-only display that rounds to
the nearest half star and reads as "4.5 out of 5"; with \`onChange\` it becomes an
input — a radio group of whole stars. \`ReviewCard\` (same entry point) is the
companion card for a single review.

### Use it when

- A provider, clinic or vendor shows its average or a single review score.
- A feedback form asks for a 1–N score.

### Don't use it when

- The score is not stars-shaped (NPS 0–10, a percentage) — use a number, \`Progress\` or a segmented control.
- You need fractional input — the interactive mode selects whole stars only.

### Example

\`\`\`tsx
const [stars, setStars] = React.useState(0);

<Rating value={4.6} size="sm" />
<Rating value={stars} onChange={setStars} labels={{ group: 'Rate your visit' }} />
\`\`\`

### Limitations

- Read-only: one \`role="img"\` whose name comes from \`labels.value(value, max)\`; the stars are \`aria-hidden\`.
- Interactive: \`role="radiogroup"\` of \`role="radio"\` buttons with a roving tab stop; Arrow keys step (Left/Right flip in RTL, values clamp at 1 and \`max\`), Home/End jump. Selecting focuses the new star.
- Half stars clip from the inline start, so they fill correctly in RTL. Filled stars use the \`warning\` token; empty stars \`muted-foreground\`.
- The hover scale respects \`prefers-reduced-motion\`. Strings default to English; override through \`labels\`.
`,
      },
    },
  },
  argTypes: {
    value: {
      description: 'Current rating; read-only displays round to half stars.',
      control: { type: 'number', step: 0.1 },
    },
    max: { description: 'Number of stars.', control: 'number' },
    size: {
      description: 'Star size.',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    onChange: { description: 'Makes the rating an editable radio group.' },
    disabled: {
      description: 'Disables the interactive mode.',
      control: 'boolean',
    },
    labels: {
      description: 'Overrides for the value text, group name and option names.',
    },
  },
  args: { value: 3.5 },
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const ReadOnly: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Rating {...args} size="sm" />
      <Rating {...args} size="md" />
      <Rating {...args} size="lg" />
    </div>
  ),
};

function InteractiveDemo(args: React.ComponentProps<typeof Rating>) {
  const [value, setValue] = React.useState(0);
  return <Rating {...args} value={value} onChange={setValue} />;
}

export const Interactive: Story = {
  render: (args) => <InteractiveDemo {...args} />,
};

export const Disabled: Story = {
  args: { value: 4, onChange: () => {}, disabled: true },
};

export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <Rating {...args} />
    </div>
  ),
};
