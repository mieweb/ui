import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertDialog, type AlertDialogVariant } from './AlertDialog';
import { ConfirmDialogProvider, useConfirm } from './ConfirmDialogProvider';
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

A confirmation dialog built on \`Modal\`: \`title\`, optional \`description\` / \`children\`, a Cancel button and one action button (\`actionLabel\`, \`onAction\`). \`variant\` sets the tone — \`default\`, \`destructive\` (red action), \`warning\`, \`success\`, \`info\` — with a matching icon for the non-default ones. Unlike \`Modal\` it **does not close on overlay click or Escape** — the user must choose.

If \`onAction\` returns a Promise, the dialog shows a busy action button (\`labels.busy\`), disables Cancel, closes when the promise resolves and stays open (re-enabled) when it rejects. A synchronous \`onAction\` leaves closing to you.

For call-site code that just needs an answer, mount \`ConfirmDialogProvider\` once and call \`useConfirm()\`: \`await confirm({ title, description, actionLabel, cancelLabel, variant })\` resolves \`true\` / \`false\`, and \`await alert({ … })\` shows a single OK button (default variant \`info\`).

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
  onAction={() => deleteCase(id)} // returns a Promise: busy, then closes
/>

// Or imperatively, under <ConfirmDialogProvider>:
const { confirm } = useConfirm();
if (await confirm({ title: 'Delete case?', variant: 'destructive', actionLabel: 'Delete' })) {
  await deleteCase(id);
}
\`\`\`

### Limitations

- Accessibility: the dialog element is \`role="alertdialog"\` + \`aria-modal\`, labelled by the title and described by \`description\`. \`Modal\` has no \`role\` prop, so AlertDialog sets the attribute on Modal's dialog element after mount. Focus is trapped; initial focus lands on **Cancel** for \`destructive\` and \`warning\` (so Enter does not confirm a dangerous action) and on the action otherwise, and **returns to the previously focused element** on close. While busy, the action button has \`aria-busy\` and focus returns to it if the promise rejects. Escape does nothing — the user must pick a button.
- Strings: \`labels\` (\`cancel\`, \`action\`, \`busy\`, \`acknowledge\`) with English defaults in \`defaultAlertDialogLabels\`; \`cancelLabel\` / \`actionLabel\` still override per dialog. \`ConfirmDialogProvider\` takes the same \`labels\` for every dialog it opens.
- \`useConfirm()\` throws outside a \`ConfirmDialogProvider\`. The provider shows one dialog at a time; a new request while one is open resolves the old one as cancelled.
- Only one action besides Cancel; for "Save / Don't save / Cancel" use \`Modal\` + \`ButtonGroup\`.
- Theming: icon tiles use \`destructive\`, \`warning\`, \`success\` and \`info\` tokens; dark mode via the same tokens. RTL-safe (flex + gap). Icons from \`lucide-react\`.
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
      description:
        'Tone: icon, action button colour, and initial focus (Cancel for destructive/warning).',
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
    },
    onAction: {
      description:
        'Action handler. Return a Promise for a busy state that closes on resolve and stays open on reject.',
      control: false,
    },
    labels: {
      description:
        'User-facing strings (cancel, action, busy, acknowledge); defaults in defaultAlertDialogLabels.',
    },
    hideCancel: { description: 'Hides the Cancel button.' },
    actionDisabled: { description: 'Disables the action button.' },
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

const VARIANT_COPY: Record<
  AlertDialogVariant,
  { title: string; description: string; actionLabel: string }
> = {
  default: {
    title: 'Publish changes?',
    description: 'Everyone on the team will see the new version.',
    actionLabel: 'Publish',
  },
  destructive: {
    title: 'Delete case?',
    description: 'This removes the case and its documents.',
    actionLabel: 'Delete',
  },
  warning: {
    title: 'Discard unsaved changes?',
    description: 'Your edits to this form will be lost.',
    actionLabel: 'Discard',
  },
  success: {
    title: 'Import complete',
    description: '128 employees were added. Send their invitations now?',
    actionLabel: 'Send invitations',
  },
  info: {
    title: 'Scheduled maintenance',
    description: 'The portal will be read-only on Sunday from 2–4 AM ET.',
    actionLabel: 'Got it',
  },
};

function VariantsDemo() {
  const [open, setOpen] = useState<AlertDialogVariant | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(VARIANT_COPY) as AlertDialogVariant[]).map((variant) => (
        <Button
          key={variant}
          variant="secondary"
          onClick={() => setOpen(variant)}
        >
          {variant}
        </Button>
      ))}
      {open && (
        <AlertDialog
          open
          onOpenChange={(next) => !next && setOpen(null)}
          variant={open}
          {...VARIANT_COPY[open]}
          onAction={() => setOpen(null)}
        />
      )}
    </div>
  );
}

export const Variants: Story = {
  render: () => <VariantsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'All five tones. Destructive and warning open with focus on Cancel; the others focus the action.',
      },
    },
  },
};

function AsyncActionDemo() {
  const [open, setOpen] = useState(false);
  const [fail, setFail] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <label className="text-muted-foreground flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fail}
          onChange={(e) => setFail(e.target.checked)}
        />
        Make the request fail
      </label>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Archive employer
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        variant="destructive"
        title="Archive employer?"
        description="Open orders stay active; new orders are blocked."
        actionLabel="Archive"
        labels={{ busy: 'Archiving…' }}
        onAction={() =>
          new Promise<void>((resolve, reject) =>
            setTimeout(
              () => (fail ? reject(new Error('Request failed')) : resolve()),
              1500
            )
          )
        }
      />
    </div>
  );
}

export const AsyncAction: Story = {
  render: () => <AsyncActionDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '`onAction` returns a Promise: the action shows `labels.busy` and Cancel is disabled until it settles. It closes on resolve; tick the box to see it stay open on reject.',
      },
    },
  },
};

function ImperativeConfirmDemo() {
  const { confirm, alert } = useConfirm();
  const [result, setResult] = useState('—');
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <Button
          variant="danger"
          onClick={async () => {
            const ok = await confirm({
              title: 'Remove provider?',
              description: 'They will no longer receive referrals.',
              actionLabel: 'Remove',
              variant: 'destructive',
            });
            setResult(ok ? 'confirmed' : 'cancelled');
          }}
        >
          confirm()
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await alert({
              title: 'Export started',
              description: 'We will email you when the file is ready.',
            });
            setResult('acknowledged');
          }}
        >
          alert()
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">Result: {result}</p>
    </div>
  );
}

export const ImperativeConfirm: Story = {
  render: () => (
    <ConfirmDialogProvider>
      <ImperativeConfirmDemo />
    </ConfirmDialogProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`ConfirmDialogProvider` + `useConfirm()`: `confirm()` resolves `true`/`false`; `alert()` has a single OK button and resolves when dismissed.',
      },
    },
  },
};
