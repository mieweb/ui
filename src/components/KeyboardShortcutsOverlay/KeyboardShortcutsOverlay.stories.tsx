import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Kbd, KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

const meta: Meta<typeof KeyboardShortcutsOverlay> = {
  title: 'Components/Overlays & Popups/KeyboardShortcutsOverlay',
  component: KeyboardShortcutsOverlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The `?` keyboard-shortcuts help dialog: shortcut rows with `Kbd` chips, optionally ' +
          'grouped into sections. Composes the library `Modal` (focus trap, Escape, overlay ' +
          'click) and pairs with `useKeyboardShortcut`, which owns the actual bindings. The ' +
          '`Kbd` chip is exported on its own for inline shortcut references in docs and menus.',
      },
    },
  },
  tags: ['autodocs'],
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
