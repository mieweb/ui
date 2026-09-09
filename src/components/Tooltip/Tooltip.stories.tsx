import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
  id: 'overlays-tooltip',
  title: 'Components/Overlays/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A short label that appears on hover or keyboard focus of a single child element. Portalled to \`document.body\`, positioned with \`placement\` (auto-flips to stay on screen), \`delay\` (200 ms), \`offset\`, \`maxWidth\`. The trigger receives \`aria-describedby\` pointing at the \`role="tooltip"\` element, so the text is read as the control's description.

### Use it when

- Naming an icon-only control ("Delete", "Copy MRN") or clarifying an abbreviation — a few words, no interaction inside.
- The information is helpful but not required to operate the control.

### Don't use it when

- The content is a definition with structure (category, source, related terms) — \`GlossaryTooltip\`.
- You are citing where a number or claim comes from — \`SourceTip\`.
- The content contains links or buttons: tooltips are not focusable. Use a pinned card (the two above) or a \`Modal\`.
- On touch devices the tooltip cannot be hovered; make sure the child has a visible label or \`aria-label\` of its own.

### Example

\`\`\`tsx
<Tooltip content="Delete allergy">
  <Button variant="ghost" size="icon" aria-label="Delete allergy" onClick={remove}>
    <TrashIcon />
  </Button>
</Tooltip>
\`\`\`

### Limitations

- The child must accept \`onFocus\` / \`onBlur\` / \`aria-describedby\` props (any \`Button\` or native element does). A disabled button fires no events, so wrap it in a span.
- The tooltip is a description, not a name: an icon button still needs \`aria-label\`.
- Respects \`prefers-reduced-motion\` by skipping the fade.
- Rendered at \`z-[9999]\` so it clears modals; \`placement\` is physical (\`left\`/\`right\`), not logical.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-glossarytooltip',
          why: 'GlossaryTooltip is a rich, pinnable definition card; Tooltip is a few words of description.',
        },
        {
          type: 'alternative to',
          target: 'overlays-sourcetip',
          why: 'SourceTip cites provenance with links; Tooltip cannot hold interactive content.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description:
        'Preferred placement. Automatically flips if not enough space.',
    },
    delay: {
      control: 'number',
      description: 'Delay in milliseconds before showing the tooltip',
    },
    maxWidth: {
      control: 'number',
      description: 'Maximum width in pixels. Set to "none" for no limit.',
    },
    offset: {
      control: 'number',
      description: 'Distance from trigger element in pixels',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Placements: Story = {
  name: 'All Placements',
  render: () => (
    <div className="flex flex-col items-center gap-12 p-20">
      <Tooltip content="Tooltip on top" placement="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <div className="flex gap-20">
        <Tooltip content="Tooltip on left" placement="left">
          <Button variant="outline">Left</Button>
        </Tooltip>
        <Tooltip content="Tooltip on right" placement="right">
          <Button variant="outline">Right</Button>
        </Tooltip>
      </div>
      <Tooltip content="Tooltip on bottom" placement="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const SmartPositioning: Story = {
  name: 'Smart Positioning (Edge Detection)',
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="relative h-screen w-full p-4">
      <p className="mb-8 text-center text-sm text-neutral-500">
        Tooltips automatically flip when there isn&apos;t enough space. Try
        hovering over the buttons in each corner.
      </p>

      {/* Top-left corner */}
      <div className="absolute top-12 left-2">
        <Tooltip
          content="I flip to bottom-right when near the corner!"
          placement="top"
        >
          <Button variant="outline" size="sm">
            Top-Left
          </Button>
        </Tooltip>
      </div>

      {/* Top-right corner */}
      <div className="absolute top-12 right-2">
        <Tooltip
          content="I flip to bottom-left when near the corner!"
          placement="top"
        >
          <Button variant="outline" size="sm">
            Top-Right
          </Button>
        </Tooltip>
      </div>

      {/* Bottom-left corner */}
      <div className="absolute bottom-4 left-2">
        <Tooltip
          content="I flip to top-right when near the corner!"
          placement="bottom"
        >
          <Button variant="outline" size="sm">
            Bottom-Left
          </Button>
        </Tooltip>
      </div>

      {/* Bottom-right corner */}
      <div className="absolute right-2 bottom-4">
        <Tooltip
          content="I flip to top-left when near the corner!"
          placement="bottom"
        >
          <Button variant="outline" size="sm">
            Bottom-Right
          </Button>
        </Tooltip>
      </div>

      {/* Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Tooltip
          content="I have plenty of space, so I stay on top!"
          placement="top"
        >
          <Button>Center (Top)</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

export const WithDelay: Story = {
  args: {
    content: 'I appear after 500ms',
    delay: 500,
    children: <Button>Hover me (with delay)</Button>,
  },
};

export const Disabled: Story = {
  args: {
    content: 'You should not see this',
    disabled: true,
    children: <Button>Tooltip disabled</Button>,
  },
};

export const LongContent: Story = {
  name: 'Multi-line Content',
  args: {
    content:
      'This is a longer tooltip with more content. It wraps nicely within the max-width constraint, making it easy to read.',
    maxWidth: 200,
    children: <Button>Hover for more info</Button>,
  },
};

export const CustomMaxWidth: Story = {
  name: 'Custom Max Width',
  render: () => (
    <div className="flex flex-col items-center gap-8">
      <Tooltip
        content="This tooltip has a narrow max-width of 150px"
        maxWidth={150}
      >
        <Button variant="outline">Narrow (150px)</Button>
      </Tooltip>
      <Tooltip
        content="This tooltip has a wider max-width of 350px, allowing for more content on a single line before wrapping."
        maxWidth={350}
      >
        <Button variant="outline">Wide (350px)</Button>
      </Tooltip>
      <Tooltip
        content="This tooltip has no max-width limit at all!"
        maxWidth="none"
      >
        <Button variant="outline">No Limit</Button>
      </Tooltip>
    </div>
  ),
};

export const OnIconButton: Story = {
  name: 'Icon Button with Tooltip',
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip content="Edit">
        <Button variant="ghost" size="icon" aria-label="Edit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Delete">
        <Button variant="ghost" size="icon" aria-label="Delete">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Share">
        <Button variant="ghost" size="icon" aria-label="Share">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Download">
        <Button variant="ghost" size="icon" aria-label="Download">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
        </Button>
      </Tooltip>
    </div>
  ),
};

export const Toolbar: Story = {
  name: 'Toolbar Example',
  render: () => (
    <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <Tooltip content="Bold (Ctrl+B)">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="font-bold">B</span>
        </Button>
      </Tooltip>
      <Tooltip content="Italic (Ctrl+I)">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="italic">I</span>
        </Button>
      </Tooltip>
      <Tooltip content="Underline (Ctrl+U)">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="underline">U</span>
        </Button>
      </Tooltip>
      <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
      <Tooltip content="Align left">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Align left"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="3" y="5" width="18" height="2" rx="1" />
            <rect x="3" y="11" width="12" height="2" rx="1" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Align center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Align center"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="3" y="5" width="18" height="2" rx="1" />
            <rect x="6" y="11" width="12" height="2" rx="1" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
        </Button>
      </Tooltip>
      <Tooltip content="Align right">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Align right"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="3" y="5" width="18" height="2" rx="1" />
            <rect x="9" y="11" width="12" height="2" rx="1" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
        </Button>
      </Tooltip>
    </div>
  ),
};

export const Controlled: Story = {
  name: 'Controlled State',
  render: function ControlledExample() {
    const [open, setOpen] = React.useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-neutral-500">
          Tooltip state: <strong>{open ? 'Open' : 'Closed'}</strong>
        </p>
        <Tooltip
          content="This is a controlled tooltip"
          open={open}
          onOpenChange={setOpen}
        >
          <Button>Hover me</Button>
        </Tooltip>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Show Tooltip
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Hide Tooltip
          </Button>
        </div>
      </div>
    );
  },
};

// Import React for the controlled story
import * as React from 'react';
