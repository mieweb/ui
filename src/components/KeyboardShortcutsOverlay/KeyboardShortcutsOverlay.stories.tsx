import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Kbd, KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

const meta: Meta<typeof KeyboardShortcutsOverlay> = {
  id: 'overlays-keyboardshortcutsoverlay',
  title: 'Components/Overlays/KeyboardShortcutsOverlay',
  component: KeyboardShortcutsOverlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The \`?\` keyboard-shortcuts help dialog: shortcut rows rendered as \`Kbd\` chips, either a flat \`shortcuts\` list or \`groups\` with headings, plus an optional \`hint\` footer. It composes the library \`Modal\` (focus trap, Escape, overlay click) and pairs with \`useKeyboardShortcut\`, which owns the actual bindings. \`Kbd\` is exported on its own for inline shortcut references in docs and menus.

### Use it when

- The app has keyboard shortcuts and users need one place to discover them (conventionally opened with \`?\`).
- You show a shortcut next to a menu item or in documentation (\`<Kbd>\` alone).

### Don't use it when

- Users need to *run* commands by typing — that is \`CommandPalette\`; this overlay only documents keys.
- There are one or two shortcuts; a \`Tooltip\` with a \`Kbd\` on the control is enough.

### Example

\`\`\`tsx
const [help, setHelp] = useState(false);
useKeyboardShortcut('?', () => setHelp(true));

<KeyboardShortcutsOverlay
  open={help}
  onClose={() => setHelp(false)}
  groups={[
    { title: 'Navigation', shortcuts: [{ keys: 'g o', description: 'Go to orders' }] },
    { title: 'Editing', shortcuts: [{ keys: ['Mod+S', 'Ctrl+S'], description: 'Save' }] },
  ]}
/>
\`\`\`

### Limitations

- Inherits \`Modal\`'s behaviour and limits (no focus return on close, fixed \`z-50\`, body scroll lock).
- Key names are displayed as given; translate descriptions and \`alternativesLabel\` ("or") in the host.
- Does not detect the platform — pass \`keys\` alternatives (Mod/Ctrl) yourself.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'Renders inside a Modal with its header, body and footer slots.',
        },
        {
          type: 'alternative to',
          target: 'navigation-commandpalette',
          why: 'CommandPalette runs commands from a search box; this overlay only lists the keyboard shortcuts.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    shortcuts: { description: 'Flat list of shortcuts.', control: false },
    groups: {
      description: 'Sectioned shortcuts with headings.',
      control: false,
    },
    title: { description: 'Dialog heading.', control: 'text' },
    hint: { description: 'Footer hint (null hides it).', control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const NAVIGATION = [
  { keys: ['j', '↓'], description: 'Next record' },
  { keys: ['k', '↑'], description: 'Previous record' },
  { keys: 'Enter', description: 'Open selected record' },
  { keys: 'Esc', description: 'Close panel' },
];

const ACTIONS = [
  { keys: '⌘K', description: 'Command palette' },
  { keys: 'c', description: 'Compose note' },
  { keys: 'e / a', description: 'Archive record' },
];

export const Default: Story = {
  render: (args) => <OverlayExample {...args} />,
  args: { shortcuts: [...NAVIGATION, ...ACTIONS.slice(0, 1)] },
};

export const Grouped: Story = {
  render: (args) => <OverlayExample {...args} />,
  args: {
    groups: [
      { title: 'Navigation', shortcuts: NAVIGATION },
      { title: 'Actions', shortcuts: ACTIONS },
    ],
  },
};

function OverlayExample(
  args: React.ComponentProps<typeof KeyboardShortcutsOverlay>
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Show shortcuts
      </Button>
      <KeyboardShortcutsOverlay
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export const KbdChip: Story = {
  render: () => (
    <p className="text-foreground text-sm">
      Press <Kbd>⌘K</Kbd> to open the command palette, or <Kbd>?</Kbd> for help.
    </p>
  ),
  parameters: {
    docs: {
      description: { story: 'The `Kbd` chip used inline in prose and menus.' },
    },
  },
};
