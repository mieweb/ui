import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta: Meta<typeof Separator> = {
  id: 'layout-separator',
  title: 'Components/Layout/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A 1px rule between blocks or inline items.** \`Separator\` is a \`div\` with \`bg-border\` and \`orientation\` \`horizontal\` (\`h-px w-full\`, default) or \`vertical\` (\`w-px h-full\` — the parent must give it a height, e.g. a flex row with \`items-stretch\` or an explicit \`h-4\`). \`decorative\` (default \`true\`) renders \`role="none"\`; set \`decorative={false}\` to expose \`role="separator"\` + \`aria-orientation\` when the rule marks a real boundary between groups. \`separatorVariants\` is exported.

### Use it when

- Visually splitting a toolbar, a metadata line ("Owner · Updated") or stacked form groups where spacing alone is not enough.
- You need the rule to be announced as structure (\`decorative={false}\`), e.g. between groups of menu items you render yourself.

### Don't use it when

- Inside a \`Card\` and the line should run edge to edge — \`CardDivider\` (an \`<hr>\` with \`-mx-4\` bleed).
- Between items in a header rail — \`AppHeaderDivider\` already has header spacing and colours.
- Between menu entries — \`DropdownSeparator\`; between list rows — the list's own \`divide-y\`.
- You want a labelled divider ("or", a date header) — compose it: two Separators around a \`Text\`.

### Example

\`\`\`tsx
<div className="flex h-8 items-center gap-3 text-sm">
  <span>{order.owner}</span>
  <Separator orientation="vertical" className="h-4" />
  <span>Updated {formatRelative(order.updatedAt)}</span>
  <Separator orientation="vertical" className="h-4" />
  <Badge variant="secondary">{order.status}</Badge>
</div>

<Separator decorative={false} className="my-6" />
<h2>Billing</h2>
\`\`\`

The vertical rules are decorative (default); the section rule is semantic.

### Limitations

- Accessibility: with the default \`decorative\`, the element is \`role="none"\` and invisible to AT; with \`decorative={false}\` it is \`role="separator"\` with \`aria-orientation\` but is **not focusable** (no \`tabIndex\`) — fine for a static divider, not for a resizable splitter. It is a \`div\`, not \`<hr>\`, so no native semantics without the role.
- \`vertical\` relies on \`h-full\`; in a parent without a definite height it collapses to 0 — give it a height class.
- No thickness, colour, inset or label variants — override via \`className\` (\`bg-primary-200\`, \`h-0.5\`, \`mx-4\`).
- RTL / responsive: symmetric; no breakpoints. Theming: \`bg-border\` only. No strings. Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-card',
          why: 'CardDivider is an <hr> that bleeds to the Card edges (-mx-4); Separator is the plain rule for everywhere else.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    decorative: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64">
      <p className="text-sm">Above</p>
      <Separator {...args} className="my-3" />
      <p className="text-sm">Below</p>
    </div>
  ),
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm">Left</span>
      <Separator {...args} />
      <span className="text-sm">Right</span>
    </div>
  ),
  args: {
    orientation: 'vertical',
  },
};

export const Semantic: Story = {
  render: (args) => (
    <div className="w-64">
      <p className="text-sm">Section one</p>
      <Separator {...args} className="my-3" />
      <p className="text-sm">Section two</p>
    </div>
  ),
  args: {
    decorative: false,
  },
};
