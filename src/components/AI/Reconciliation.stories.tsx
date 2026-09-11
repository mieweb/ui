import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  AIReconciliationPanel,
  type ReconciliationProposal,
} from './Reconciliation';
import { Button } from '../Button';

const meta: Meta<typeof AIReconciliationPanel> = {
  id: 'chat-reconciliationpanel',
  title: 'Modules/Chat/ReconciliationPanel',
  component: AIReconciliationPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A human-in-the-loop review of AI-proposed field changes: per-row accept/reject, inline edit, confidence badges, then one \`onApply\` with the accepted values.** \`AIReconciliationPanel\` takes \`title\`, optional \`description\`, a \`source: { label, thumbnailUrl?, generatedAt?, icon? }\` pill ("Driver's License · 2 minutes ago"), and \`proposals: ReconciliationProposal[]\` — each \`{ id, label, current, proposed, confidence?, confidenceLevel?, defaultAccepted?, required?, group?, hint?, description?, renderValue?, renderEditor? }\`. Rows whose \`current\` and \`proposed\` are equal (\`isEqual\`, default \`defaultReconciliationIsEqual\`: null/undefined/empty treated alike, case- and whitespace-insensitive strings, Dates by epoch, objects by key-sorted JSON) are dropped; if nothing is left the panel variant renders **null** and calls \`onNothingToReconcile\`. Confidence maps to \`high\` (≥ 0.85) / \`medium\` (≥ 0.6) / \`low\`, and low rows start **unchecked** unless \`defaultAccepted\` says otherwise; \`required\` rows are always checked and disabled. A bulk bar (\`hideBulkActions\` to remove) offers "Accept all" / "Reject all" with an indeterminate checkbox and a live "n of m selected" count. \`renderEditor(value, onChange)\` turns on an **Edit** toggle for that row. Footer: \`onSkip\` (ghost, \`skipLabel\` "Skip for now") and Apply (\`applyLabel\`, default "Apply n updates"), which awaits \`onApply(accepted: { id, value }[])\` with a loading state. \`variant="modal"\` wraps everything in \`Modal size="2xl"\` and requires \`open\` / \`onOpenChange\`. Keyboard: **A** toggles accept-all, **Cmd/Ctrl+Enter** applies. \`tone\` \`default\` | \`accent\`. Also exported: \`defaultReconciliationIsEqual\`, \`reconciliationPanelVariants\`, and the \`ReconciliationProposal\` / \`ReconciliationSource\` / \`ReconciliationAcceptedChange\` / \`ReconciliationConfidenceLevel\` types.

### Use it when

- An extraction step (\`DocumentScanner\` OCR, an intake-form parser, an agent's tool result) produced values that would **overwrite data on file**, and a person must confirm each one before you persist — profile updates from a scanned licence, medication lists from a PDF, demographics from a fax.
- You want consistent confidence semantics and audit-friendly output (\`onApply\` receives only what was accepted, with any inline edits applied).

### Don't use it when

- There is nothing to compare against: for brand-new records use a normal form (ESheet / Composite forms) pre-filled with the AI values.
- The decision is a single yes/no — \`AlertDialog\` or a \`Toast\` with an action.
- You need a side-by-side diff of long text or documents; rows are short values rendered by \`String(value)\` (or your \`renderValue\`).

### Example

\`\`\`tsx
const [scan, setScan] = useState<LicenseFields | null>(null);

<DocumentScanner documentType="drivers_license" onResult={(r) => setScan(r.fields)} />

{scan && (
  <AIReconciliationPanel
    variant="modal"
    open
    onOpenChange={(o) => !o && setScan(null)}
    title={t('profile.reviewScan.title')}
    description={t('profile.reviewScan.description')}
    source={{ label: t('profile.reviewScan.source'), generatedAt: new Date() }}
    proposals={[
      { id: 'name', label: t('profile.name'), current: profile.name, proposed: scan.fullName, confidence: scan.confidence.fullName },
      { id: 'dob', label: t('profile.dob'), current: profile.dob, proposed: scan.dob, confidence: scan.confidence.dob,
        renderValue: (v) => formatDate(v, locale) },
      { id: 'address', label: t('profile.address'), current: profile.address, proposed: scan.address, confidence: 0.7,
        renderEditor: (v, onChange) => <Input value={String(v ?? '')} onChange={(e) => onChange(e.target.value)} /> },
    ]}
    onApply={async (accepted) => { await api.patchProfile(Object.fromEntries(accepted.map((a) => [a.id, a.value]))); setScan(null); }}
    onSkip={() => setScan(null)}
  />
)}
\`\`\`

### Limitations

- **Accessibility as implemented:** the panel is \`role="group" aria-label={title}\`; each row's checkbox has \`aria-label="Apply update for <label>"\` and a visible \`<label>\`; the bulk count is \`role="status" aria-live="polite"\`. The Edit toggle uses \`aria-expanded\` / \`aria-controls\`. Group headers are \`aria-hidden\` (visual only), and the "From AI" column adds an \`sr-only\` "(AI-suggested value)" note. Confidence badges are text ("High confidence"…), not colour-only. The **A** shortcut listens on the container and skips inputs, but is undiscoverable (no hint in the UI). The modal variant's focus handling comes from \`Modal\`.
- **State resets** whenever the proposal signature (ids, proposed values, defaults, confidence) changes — supplying a new \`proposals\` array with changed values discards the user's per-row choices and edits.
- Empty result behaviour differs by variant: the panel variant renders nothing (parent layout may jump); the modal shows "No updates to review…" with a Close button.
- \`relativeTimeLabel\` ("just now", "3 minutes ago") and all default strings are English; dates in \`formatValueDefault\` use \`toLocaleDateString\`. RTL: the "From AI" dt icon and \`ml-1\` on "(required)" are physical; the rest is flex/grid.
- Theming uses semantic tokens (\`bg-card\`, \`border-border\`, \`text-muted-foreground\`, \`success-*\`) plus hard-coded \`amber-*\` for medium/low confidence. Depends on \`class-variance-authority\`; uses \`Checkbox\`, \`Button\`, \`Modal\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'files-documentscanner',
          why: 'Hand the fields from onResult to AIReconciliationPanel so the user reviews AI-extracted values before they are saved.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'variant="modal" wraps the panel in Modal (size 2xl) with ModalHeader/Body/Footer.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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

const handleApply = async (accepted: Array<{ id: string; value: unknown }>) => {
  // Stories swallow the result; the panel awaits this promise to drive its
  // loading state.
  void accepted;
  await new Promise((resolve) => setTimeout(resolve, 500));
};

export const Default: Story = {
  args: {
    title: 'Update your profile from your license?',
    description: 'Review the suggested changes and choose which ones to apply.',
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
    onNothingToReconcile: () => undefined,
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
