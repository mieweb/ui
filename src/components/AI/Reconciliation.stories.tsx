import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  AIReconciliationPanel,
  type ReconciliationProposal,
} from './Reconciliation';
import { Button } from '../Button';

const meta: Meta<typeof AIReconciliationPanel> = {
  title: 'Product/Feature Modules/AI/ReconciliationPanel',
  component: AIReconciliationPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AIReconciliationPanel>;

const licenseProposals: ReconciliationProposal[] = [
  {
    id: 'fullName',
    label: 'Legal name',
    current: 'jane q public',
    proposed: 'Jane Q. Public',
    confidence: 0.97,
  },
  {
    id: 'dob',
    label: 'Date of birth',
    current: null,
    proposed: '1990-04-12',
    confidence: 0.92,
    hint: 'Used to verify your identity on regulated forms.',
  },
  {
    id: 'address',
    label: 'Mailing address',
    current: '123 Old St, Anytown, OH 12345',
    proposed: '742 Evergreen Ter, Springfield, OH 45501',
    confidence: 0.71,
  },
  {
    id: 'licenseNumber',
    label: 'License number',
    current: '',
    proposed: 'OH-D123-4567',
    confidence: 0.55,
    hint: 'Low confidence — please double-check before applying.',
  },
];

const handleApply = async (
  accepted: Array<{ id: string; value: unknown }>
) => {
  // Stories swallow the result; the panel awaits this promise to drive its
  // loading state.
  void accepted;
  await new Promise((resolve) => setTimeout(resolve, 500));
};

export const Default: Story = {
  args: {
    title: 'Update your profile from your license?',
    description:
      'Review the suggested changes and choose which ones to apply.',
    source: {
      label: "Driver's License",
      generatedAt: new Date(Date.now() - 1000 * 60 * 2),
    },
    proposals: licenseProposals,
    onApply: handleApply,
    onSkip: () => undefined,
  },
};

function ModalVariantRender(
  args: React.ComponentProps<typeof AIReconciliationPanel>
) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Review AI suggestions</Button>
      <AIReconciliationPanel
        {...args}
        variant="modal"
        open={open}
        onOpenChange={setOpen}
        onSkip={() => setOpen(false)}
        onApply={async (a) => {
          await handleApply(a);
          setOpen(false);
        }}
      />
    </>
  );
}

export const ModalVariant: Story = {
  render: (args) => <ModalVariantRender {...args} />,
  args: {
    title: 'Update your profile from your license?',
    description: 'Review the suggested changes and choose which to apply.',
    source: {
      label: "Driver's License",
      generatedAt: new Date(Date.now() - 1000 * 30),
    },
    proposals: licenseProposals,
    onApply: handleApply,
  },
};

export const NothingToReconcile: Story = {
  args: {
    title: 'Update your profile from your license?',
    source: { label: "Driver's License", generatedAt: new Date() },
    proposals: [
      {
        id: 'fullName',
        label: 'Legal name',
        current: 'Jane Q. Public',
        proposed: 'jane q public',
        confidence: 1,
      },
    ],
    onApply: handleApply,
    onSkip: () => undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When every proposal is filtered out as equal, the panel renders nothing and fires `onNothingToReconcile`.',
      },
    },
  },
};

export const WithInlineEditor: Story = {
  args: {
    title: 'Confirm scanned values',
    source: { label: 'Ozwell extraction' },
    proposals: [
      {
        id: 'fullName',
        label: 'Legal name',
        current: 'Jane Doe',
        proposed: 'Jane Q. Public',
        confidence: 0.6,
        renderEditor: (value, onChange) => (
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="border-border bg-background w-full rounded border px-2 py-1 text-sm"
          />
        ),
      },
    ],
    onApply: handleApply,
    onSkip: () => undefined,
  },
};

export const Grouped: Story = {
  args: {
    title: 'Update profile from scan',
    source: { label: "Driver's License", generatedAt: new Date() },
    proposals: [
      {
        id: 'fullName',
        label: 'Legal name',
        group: 'Identity',
        current: 'Old Name',
        proposed: 'Jane Q. Public',
        confidence: 0.95,
      },
      {
        id: 'dob',
        label: 'Date of birth',
        group: 'Identity',
        current: null,
        proposed: '1990-04-12',
        confidence: 0.92,
      },
      {
        id: 'address',
        label: 'Mailing address',
        group: 'Contact',
        current: '123 Old St',
        proposed: '742 Evergreen Ter',
        confidence: 0.7,
      },
    ],
    onApply: handleApply,
    onSkip: () => undefined,
  },
};
