import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClampedText } from './ClampedText';

const LONG_TEXT = `Patient called regarding ongoing wrist discomfort following the workstation assessment on 6/12. Reports the new keyboard tray helped initially but symptoms returned after the quarterly reporting crunch. Discussed splint usage compliance — wearing it overnight but not during data entry, which is when symptoms peak.

Recommended: resume PT exercises twice daily, schedule ergonomic re-evaluation, and follow up with occupational health if numbness spreads past the second digit. Employee agreed to a two-week check-in and asked whether the standing desk request from March was still in the approval queue — confirmed it cleared facilities on Monday and installation is scheduled for the 28th.`;

const meta: Meta<typeof ClampedText> = {
  title: 'Components/Data Display/ClampedText',
  component: ClampedText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Clamps long text to N lines with a fade-out gradient and a Show more / Show less ' +
          'toggle. Text under the character threshold renders inline with no toggle. Match ' +
          '`fadeClassName` to the surface behind the text (default `from-card`).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: { description: 'The long text to clamp.', control: 'text' },
    lines: {
      description: 'Lines visible while collapsed.',
      control: 'select',
      options: [2, 3, 4, 5, 6, 7, 8],
    },
    threshold: {
      description: 'Skip the clamp below this character count.',
      control: 'number',
    },
    fadeClassName: {
      description: 'Gradient start matching the surface behind the text.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { text: LONG_TEXT, lines: 4 },
  render: (args) => (
    <div className="border-border bg-card text-foreground w-96 rounded-lg border p-4 text-sm leading-relaxed">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        Call note
      </h3>
      <ClampedText {...args} />
    </div>
  ),
};

export const ShortTextStaysFlat: Story = {
  args: { text: 'Left voicemail; will retry Thursday.' },
  render: (args) => (
    <div className="border-border bg-card text-foreground w-96 rounded-lg border p-4 text-sm">
      <ClampedText {...args} />
    </div>
  ),
};

export const OnPageBackground: Story = {
  args: { text: LONG_TEXT, lines: 3, fadeClassName: 'from-background' },
  render: (args) => (
    <div className="text-foreground w-96 p-4 text-sm leading-relaxed">
      <ClampedText {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'On the page background, pass `fadeClassName="from-background"` so the fade matches.',
      },
    },
  },
};
