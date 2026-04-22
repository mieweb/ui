import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { Button } from '../Button/Button';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A confirmation dialog built on top of `Modal`. Supports an optional custom-message textarea — used for invites, enrollment emails, and other actions where the sender may include a personal note.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

function Harness(props: React.ComponentProps<typeof ConfirmDialog>) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastMessage, setLastMessage] = React.useState<string | undefined>();

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      {lastMessage !== undefined && (
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          <strong>Last confirmed message:</strong>{' '}
          {lastMessage || <em>(none)</em>}
        </div>
      )}
      <ConfirmDialog
        {...props}
        open={open}
        onOpenChange={setOpen}
        isSubmitting={submitting}
        onConfirm={async (message) => {
          setSubmitting(true);
          await new Promise((r) => setTimeout(r, 600));
          setSubmitting(false);
          setLastMessage(message ?? '');
          setOpen(false);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    title: 'Remove user?',
    description:
      'They will lose access to this organization immediately. You can re-invite them later.',
    confirmLabel: 'Remove',
    variant: 'danger',
  },
};

export const SendEnrollmentEmail: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    title: 'Send enrollment email?',
    description:
      'An enrollment invitation will be sent to jane.doe@example.com. You can optionally include a personal note below.',
    confirmLabel: 'Send Email',
    messageField: {
      placeholder:
        "Add a personal note — e.g. 'Welcome to the team! Let us know if you have questions.'",
      helperText: 'Included in the invitation email.',
    },
  },
};

export const RequiredMessage: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    title: 'Reject claim?',
    description:
      'Please provide a reason — it will be shared with the submitter.',
    confirmLabel: 'Reject',
    variant: 'danger',
    messageField: {
      label: 'Rejection reason',
      placeholder: 'Explain why this claim is being rejected…',
      required: true,
      minLength: 10,
    },
  },
};

export const InfoOnly: Story = {
  render: (args) => <Harness {...args} />,
  args: {
    title: 'Publish changes?',
    description:
      'Your changes will be visible to all employees in this organization.',
    confirmLabel: 'Publish',
  },
};
