import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  MedicationList,
  MEDICATION_STATUS_LABELS,
  type Medication,
  type MedicationAction,
  type MedicationStatus,
} from './MedicationList';
import { MedicationReconciliation } from './MedicationReconciliation';
import { CodeLookup } from '../CodeLookup';

const meta: Meta<typeof MedicationList> = {
  title: 'Healthcare/MedicationList',
  component: MedicationList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Presenting-medications list with **medication reconciliation**.

- Medications group themselves by reconciliation status (Unreconciled, Taking as Directed, Not Taking as Directed, Not Taking, Unknown).
- Hover (or keyboard-focus) a row to reveal the status buttons and other row actions.
- Fully controlled: pass \`medications\` and handle \`onStatusChange\` / \`onAction\`.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MedicationList>;

const sampleMedications: Medication[] = [
  { id: '1', name: 'calcium 500 mg tablet', status: 'unreconciled' },
  {
    id: '2',
    name: 'Lasix 20 mg tablet',
    sig: '1 tablet by mouth weekly; take if weight greater than 149 pounds',
    status: 'unreconciled',
  },
  {
    id: '3',
    name: 'lisinopril 10 mg tablet',
    status: 'unreconciled',
    expired: true,
  },
  { id: '4', name: 'Coumadin 5 mg tablet', status: 'taking' },
  {
    id: '5',
    name: 'ibuprofen 600 mg tablet',
    sig: 'As needed pain, not to exceed 4 tablets in 24 hours period',
    status: 'taking-noncompliant',
    expired: true,
  },
  {
    id: '6',
    name: 'aspirin 81 mg tablet,delayed release',
    status: 'not-taking',
    expired: true,
  },
];

/**
 * The full reconciliation experience — `MedicationReconciliation` with the
 * NCPDP MedicationEditor and offline RxNorm/FDB coding. Correct / Add open
 * the prescription editor; Notes / Add Task open dialogs; rows drag or move
 * within their group; every change is reported through `onChange`.
 */
function InteractiveTemplate() {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <MedicationReconciliation
        defaultMedications={sampleMedications}
        quickAddOptions={[
          'atorvastatin 20 mg tablet',
          'metformin 500 mg tablet',
        ]}
        codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
        onChange={(meds) =>
          setLog((prev) => [
            `onChange — ${meds.length} medications`,
            ...prev.slice(0, 4),
          ])
        }
      />
      {log.length > 0 && (
        <div className="text-muted-foreground rounded border p-2 font-mono text-xs">
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveTemplate />,
};

/**
 * The presentational `MedicationList` layer by itself — fully controlled,
 * no built-in dialogs. Every callback just logs; wire your own handlers
 * (or use `MedicationReconciliation`, demonstrated in Interactive, for the
 * batteries-included behavior).
 */
function HeadlessTemplate() {
  const [meds, setMeds] = useState<Medication[]>(sampleMedications);
  const [log, setLog] = useState<string[]>([]);

  const handleStatusChange = (med: Medication, status: MedicationStatus) => {
    setMeds((prev) =>
      prev.map((m) => (m.id === med.id ? { ...m, status } : m))
    );
    setLog((prev) => [
      `${med.name} → ${MEDICATION_STATUS_LABELS[status]}`,
      ...prev.slice(0, 4),
    ]);
  };

  const handleAction = (med: Medication, action: MedicationAction) => {
    if (action === 'remove') {
      setMeds((prev) => prev.filter((m) => m.id !== med.id));
    }
    setLog((prev) => [`onAction: ${med.name}: ${action}`, ...prev.slice(0, 4)]);
  };

  return (
    <div className="space-y-4">
      <MedicationList
        medications={meds}
        onStatusChange={handleStatusChange}
        onAction={handleAction}
        onReorder={(ids) =>
          setMeds((prev) =>
            [...prev].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
          )
        }
        quickAddOptions={['atorvastatin 20 mg tablet']}
        onQuickAdd={(name) =>
          setMeds((prev) => [
            ...prev,
            { id: `new-${Date.now()}`, name, status: 'unreconciled' },
          ])
        }
        onAddOther={() => setLog((prev) => ['onAddOther', ...prev])}
      />
      {log.length > 0 && (
        <div className="text-muted-foreground rounded border p-2 font-mono text-xs">
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Headless: Story = {
  render: () => <HeadlessTemplate />,
};

/** Static list matching the WebChart "Presenting medications" screen. */
export const Default: Story = {
  args: {
    medications: sampleMedications,
    quickAddOptions: ['atorvastatin 20 mg tablet'],
  },
};

/** Everything reconciled — Unreconciled group shows the completion message. */
export const FullyReconciled: Story = {
  args: {
    medications: sampleMedications.map((m) =>
      m.status === 'unreconciled' ? { ...m, status: 'taking' as const } : m
    ),
  },
};

/** Read-only (no hover actions). */
export const ReadOnly: Story = {
  args: {
    medications: sampleMedications,
    readOnly: true,
  },
};

/** Discontinued + expired flags. */
export const Flags: Story = {
  args: {
    medications: [
      {
        id: '1',
        name: 'lisinopril 10 mg tablet',
        status: 'unreconciled',
        expired: true,
      },
      {
        id: '2',
        name: 'warfarin 2 mg tablet',
        status: 'not-taking',
        discontinuedDate: '2026-05-14',
      },
    ],
  },
};

/** Limit the row actions shown. */
export const LimitedActions: Story = {
  args: {
    medications: sampleMedications,
    actions: ['correct', 'remove'],
  },
};

/**
 * `MedicationReconciliation` in uncontrolled mode without CodeLookup — the
 * editor falls back to a plain medication name input.
 */
export const Reconciliation: StoryObj<typeof MedicationReconciliation> = {
  render: () => (
    <MedicationReconciliation
      defaultMedications={sampleMedications}
      quickAddOptions={[
        'atorvastatin 20 mg tablet',
        'metformin 500 mg tablet',
      ]}
      onChange={(meds) => console.log('medications changed', meds)}
    />
  ),
};
