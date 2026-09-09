import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
} from './Sheet';
import { Button } from '../Button';

const meta: Meta<typeof Sheet> = {
  id: 'overlays-sheet',
  title: 'Components/Overlays/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A panel that slides in from a screen edge over a dimmed backdrop. \`side\` accepts \`top\` / \`bottom\` / \`left\` / \`right\` or the logical \`start\` / \`end\` (mirrored in RTL). Same anatomy as \`Modal\`: \`SheetHeader\`, \`SheetTitle\`, \`SheetBody\`, \`SheetFooter\`, \`SheetClose\`; controlled by \`open\` / \`onOpenChange\`.

### Use it when

- Secondary detail or filters for the page behind it: an order's details from a list, a filter drawer, a mobile navigation menu.
- Content is tall and reads better as a column than a centred box.

### Don't use it when

- The task should fully take over — \`Modal\`.
- The navigation is permanent on desktop — \`Sidebar\` (which itself becomes a drawer on small screens).
- The panel must stay open while the user works on the page — \`DockablePanel\` or \`FloatingWindow\`; a Sheet is modal.

### Example

\`\`\`tsx
<Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)} side="end">
  <SheetHeader>
    <SheetTitle>Order {selectedId}</SheetTitle>
    <SheetClose />
  </SheetHeader>
  <SheetBody>
    <OrderDetails id={selectedId} />
  </SheetBody>
</Sheet>
\`\`\`

### Limitations

- \`role="dialog"\` + \`aria-modal\`, focus trapped, Escape closes; focus is **not** returned to the trigger on close.
- Unlike \`Modal\`, the body scroll is not locked — long pages can scroll behind the backdrop.
- Fixed \`z-50\`, not portalled; keep it out of transformed/overflow-hidden ancestors.
- Width/height is the panel's own; pass \`className\` to size it (e.g. \`sm:max-w-md\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-modal',
          why: 'Modal centres and blocks; Sheet keeps the page visible beside an edge panel.',
        },
        {
          type: 'alternative to',
          target: 'overlays-sidebar',
          why: 'Sidebar is persistent app navigation; Sheet is a transient panel that closes.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <SheetExample {...args} />,
  args: {
    side: 'right',
  },
};

function SheetExample(args: React.ComponentProps<typeof Sheet>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet {...args} open={open} onOpenChange={setOpen}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetClose />
        </SheetHeader>
        <SheetBody>
          <SheetDescription>
            Refine the list using the options below.
          </SheetDescription>
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Apply</Button>
        </SheetFooter>
      </Sheet>
    </>
  );
}

export const LeftSide: Story = {
  ...Default,
  args: {
    side: 'left',
  },
};

export const Bottom: Story = {
  ...Default,
  args: {
    side: 'bottom',
  },
};
