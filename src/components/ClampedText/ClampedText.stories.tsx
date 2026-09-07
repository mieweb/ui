import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClampedText } from './ClampedText';

const LONG_TEXT = `Patient called regarding ongoing wrist discomfort following the workstation assessment on 6/12. Reports the new keyboard tray helped initially but symptoms returned after the quarterly reporting crunch. Discussed splint usage compliance — wearing it overnight but not during data entry, which is when symptoms peak.

Recommended: resume PT exercises twice daily, schedule ergonomic re-evaluation, and follow up with occupational health if numbness spreads past the second digit. Employee agreed to a two-week check-in and asked whether the standing desk request from March was still in the approval queue — confirmed it cleared facilities on Monday and installation is scheduled for the 28th.`;

const meta: Meta<typeof ClampedText> = {
  id: 'data-display-clampedtext',
  title: 'Components/Data display/ClampedText',
  component: ClampedText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**Multi-line truncation with a reveal toggle** for free-text values — notes, messages, descriptions — inside detail panels, cards and modals. Pass \`text\` (a string, not children); when it is longer than \`threshold\` characters (default 280) the component clamps it to \`lines\` (2–8, default 6) with a fade-out gradient and a "Show more" / "Show less" button. Shorter text renders as a plain inline \`<span>\` with no toggle, so brief values stay flat. \`fadeClassName\` (default \`from-card\`) sets the gradient start so the fade matches the surface behind it; \`showMoreLabel\` / \`showLessLabel\` override the toggle strings.

### Use it when

- A record field can be anything from one line to several paragraphs and the layout must stay predictable until the reader asks for more.
- The text is user-authored prose whose whitespace should be preserved (\`whitespace-pre-wrap\`, \`break-words\`).

### Don't use it when

- One line with an ellipsis is enough (titles, cells) — \`Text truncate\` in Foundations.
- The content is rich (markdown, links, mentions) — this renders a string only; clamp your own container with \`line-clamp-*\` instead.
- The whole section should collapse, not just overflow — \`Collapsible\` / \`Accordion\`.

### Example

\`\`\`tsx
<Card>
  <CardContent>
    <ClampedText text={note.body} lines={4} />
  </CardContent>
</Card>

// On a muted panel the fade must match the panel colour
<ClampedText text={message.text} lines={3} fadeClassName="from-muted" showMoreLabel={t('more')} showLessLabel={t('less')} />
\`\`\`

Open/closed state is internal and resets when the component remounts; there is no controlled mode.

### Limitations

- Accessibility: the toggle is a \`<button aria-expanded>\` without \`aria-controls\`, and the clamped block has no id — screen readers hear "Show more, collapsed" but are not linked to the text. While collapsed the hidden lines are still in the DOM, so they are read in full by assistive tech (clamping is CSS only). The toggle's \`onClick\` calls \`stopPropagation\`, so it will not trigger a clickable parent row.
- \`lines\` outside 2–8 falls back to 6. \`line-clamp-7\` / \`-8\` are beyond Tailwind 3's core scale — the \`@mieweb/ui\` preset extends \`theme.lineClamp\`; TW4 generates them natively.
- The threshold is a **character** count, not a line count: 280 chars in a very narrow column may already exceed \`lines\` before the toggle appears, and 280 chars of short words may not need clamping at all. Tune \`threshold\` to the column width.
- i18n: default labels are English; both are props. RTL: symmetric layout; the gradient is \`inset-x-0\`.
- Theming: toggle text is \`primary-800/700\` (\`dark:primary-400/300\`); the fade colour is whatever you pass in \`fadeClassName\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'foundations-text',
          why: 'ClampedText clamps prose to N lines with a Show more toggle; Text truncate cuts a single line with an ellipsis and no reveal.',
        },
        {
          type: 'composes with',
          target: 'layout-card',
          why: 'The default fade (from-card) is tuned to sit on a Card surface; pass fadeClassName when the text is elsewhere.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
