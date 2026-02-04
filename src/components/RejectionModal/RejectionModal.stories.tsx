import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RejectionModal, RejectionReason } from './RejectionModal';
import { Button } from '../Button/Button';

const meta: Meta<typeof RejectionModal> = {
  title: 'Components/RejectionModal',
  component: RejectionModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Container with transform creates a new containing block for position:fixed
      // This keeps the modal within this container in docs view
      <div
        className="flex min-h-[700px] items-center justify-center p-8"
        style={{ transform: 'translateZ(0)' }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    title: {
      control: 'text',
      description: 'Title for the modal',
    },
    description: {
      control: 'text',
      description: 'Description text',
    },
    submitLabel: {
      control: 'text',
      description: 'Submit button text',
    },
    cancelLabel: {
      control: 'text',
      description: 'Cancel button text',
    },
    variant: {
      control: 'select',
      options: ['default', 'danger'],
      description: 'Variant for styling',
    },
    showDetails: {
      control: 'boolean',
      description: 'Whether to show a free-form details field',
    },
    requireDetails: {
      control: 'boolean',
      description: 'Whether details are required',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Whether submission is in progress',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RejectionModal>;

// Interactive wrapper that starts open (like InviteUserModal)
function InteractiveDemo(
  props: Partial<React.ComponentProps<typeof RejectionModal>>
) {
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { reasonId: string; details?: string }) => {
    setIsSubmitting(true);
    console.log('Rejection submitted:', data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <>
      {!open && (
        <Button variant="danger" onClick={() => setOpen(true)}>
          {props.submitLabel || 'Reject Item'}
        </Button>
      )}
      <RejectionModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        {...props}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <InteractiveDemo />,
};

export const RejectOrder: Story = {
  render: () => (
    <InteractiveDemo
      title="Reject Order"
      description="Please provide a reason for rejecting this order."
      itemDescription="Order #ORD-12345 - John Smith (Drug Screen, Physical Exam)"
      reasons={[
        { id: 'incomplete', label: 'Missing required information' },
        { id: 'patient_no_show', label: 'Patient did not show up' },
        { id: 'service_unavailable', label: 'Service temporarily unavailable' },
        { id: 'insurance_issue', label: 'Insurance verification failed' },
        { id: 'other', label: 'Other', requiresDetails: true },
      ]}
    />
  ),
};

export const RejectReferral: Story = {
  render: () => (
    <InteractiveDemo
      title="Decline Referral"
      description="You are about to decline this referral request."
      itemDescription="Referral from Acme Corp - Pre-employment physical for 5 employees"
      submitLabel="Decline Referral"
      reasons={[
        { id: 'capacity', label: 'No available capacity' },
        { id: 'location', label: 'Outside service area' },
        { id: 'service', label: 'Service not offered' },
        { id: 'other', label: 'Other reason', requiresDetails: true },
      ]}
    />
  ),
};

export const RejectInvoice: Story = {
  render: () => (
    <InteractiveDemo
      title="Reject Invoice"
      description="Rejecting this invoice will send it back to the provider for revision."
      itemDescription="Invoice #INV-2024-001 - $1,250.00"
      submitLabel="Reject Invoice"
      reasons={[
        { id: 'incorrect_amount', label: 'Incorrect amount' },
        { id: 'missing_docs', label: 'Missing supporting documentation' },
        { id: 'wrong_services', label: 'Services do not match order' },
        { id: 'duplicate', label: 'Duplicate invoice' },
        { id: 'other', label: 'Other', requiresDetails: true },
      ]}
    />
  ),
};

export const WithRequiredDetails: Story = {
  render: () => (
    <InteractiveDemo
      title="Report Issue"
      description="Please describe the issue you encountered."
      requireDetails
      detailsLabel="Issue Description"
      detailsPlaceholder="Describe the issue in detail..."
      submitLabel="Submit Report"
      variant="default"
    />
  ),
};

export const SimpleReasons: Story = {
  render: () => (
    <InteractiveDemo
      title="Cancel Request"
      reasons={[
        { id: 'changed_mind', label: 'Changed my mind' },
        { id: 'found_alternative', label: 'Found an alternative' },
        { id: 'no_longer_needed', label: 'No longer needed' },
      ]}
      showDetails={false}
      submitLabel="Cancel Request"
      variant="default"
    />
  ),
};

export const CustomReasons: Story = {
  render: () => {
    const customReasons: RejectionReason[] = [
      {
        id: 'quality',
        label: 'Quality does not meet standards',
        requiresDetails: true,
      },
      { id: 'late', label: 'Submitted past deadline' },
      { id: 'format', label: 'Incorrect format or structure' },
      {
        id: 'incomplete',
        label: 'Missing required sections',
        requiresDetails: true,
      },
      {
        id: 'plagiarism',
        label: 'Potential plagiarism detected',
        requiresDetails: true,
      },
      { id: 'other', label: 'Other', requiresDetails: true },
    ];

    return (
      <InteractiveDemo
        title="Reject Submission"
        description="This submission will be returned to the author with your feedback."
        reasons={customReasons}
        submitLabel="Return Submission"
      />
    );
  },
};

export const NonDangerVariant: Story = {
  render: () => (
    <InteractiveDemo
      title="Decline Invitation"
      description="Let the sender know why you can't accept."
      variant="default"
      reasons={[
        { id: 'schedule', label: 'Schedule conflict' },
        { id: 'location', label: 'Location not convenient' },
        { id: 'not_interested', label: 'Not interested at this time' },
      ]}
      submitLabel="Decline"
    />
  ),
};

function SubmittingWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {!open && (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Show Submitting State
        </Button>
      )}
      <RejectionModal open={open} onOpenChange={setOpen} isSubmitting={true} />
    </>
  );
}

export const Submitting: Story = {
  render: () => <SubmittingWrapper />,
};
