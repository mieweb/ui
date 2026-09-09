import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertDialog } from './AlertDialog';
import { Button } from '../Button';

const meta: Meta<typeof AlertDialog> = {
  id: 'feedback-alertdialog',
  title: 'Components/Feedback/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A confirmation dialog built on \`Modal\`: \`title\`, optional \`description\` / \`children\`, a Cancel button and one action button (\`actionLabel\`, \`onAction\`, \`variant="destructive"\` for red). Unlike \`Modal\` it **does not close on overlay click or Escape by default** — the user must choose.

### Use it when

- An action is destructive or irreversible and needs an explicit yes/no: delete, discard unsaved changes, sign out everywhere.
- The decision is binary and the text fits in a sentence or two.

### Don't use it when

- The dialog contains a form or more than a couple of choices — use \`Modal\` with its slots.
- You are only informing ("Saved", "3 items imported") — \`Toast\` or \`Alert\`.
- The confirmation can be undone cheaply; prefer doing the action and offering Undo in a \`Toast\`.

### Example

\`\`\`tsx
const [confirming, setConfirming] = useState(false);

<Button variant="danger" onClick={() => setConfirming(true)}>Delete case</Button>
<AlertDialog
  open={confirming}
  onOpenChange={setConfirming}
  variant="destructive"
  title="Delete case?"
  description="This removes the case and its documents. This cannot be undone."
  actionLabel="Delete"
  actionDisabled={deleting}
  onAction={async () => { await deleteCase(id); setConfirming(false); }}
/>
\`\`\`

### Limitations

- Inherits \`Modal\`'s focus trap, \`role="dialog"\` / \`aria-modal\` and body scroll lock. Focus moves to the first focusable element on open; **focus is not returned to the trigger on close** — do that in \`onOpenChange\` if the trigger is off-screen or in a list.
- \`cancelLabel\` / \`actionLabel\` default to English — pass translated nodes.
- Only one action besides Cancel; for "Save / Don't save / Cancel" use \`Modal\` + \`ButtonGroup\`.
- Fixed \`z-50\` layer, same as \`Modal\`; stacking above another Modal works but stacking order is DOM order.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'AlertDialog is a Modal with fixed slots and overlay/Escape dismissal turned off.',
        },
        {
          type: 'alternative to',
          target: 'overlays-modal',
          why: 'Modal for content and forms the user can dismiss; AlertDialog for a decision they cannot skip.',
        },
        {
          type: 'alternative to',
          target: 'feedback-alert',
          why: 'Alert informs inline; AlertDialog interrupts and requires an answer.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <AlertDialogExample {...args} />,
  args: {
    title: 'Are you sure?',
    description: 'This will save your changes and continue.',
    actionLabel: 'Continue',
  },
};

function AlertDialogExample(args: React.ComponentProps<typeof AlertDialog>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <AlertDialog
        {...args}
        open={open}
        onOpenChange={setOpen}
        onAction={() => setOpen(false)}
      />
    </>
  );
}

export const Destructive: Story = {
  render: (args) => <AlertDialogExample {...args} />,
  args: {
    title: 'Delete case?',
    description: 'This action cannot be undone.',
    actionLabel: 'Delete',
    variant: 'destructive',
  },
};
