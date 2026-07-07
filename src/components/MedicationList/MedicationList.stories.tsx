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
 * Fully interactive reconciliation flow. Click a status button on a row and
 * watch the medication move to the matching group. Drag a row (or use the
 * move actions) to reorder within a group.
 */
function InteractiveTemplate() {
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
    setMeds((prev) => {
      switch (action) {
        case 'remove':
          return prev.filter((m) => m.id !== med.id);
        case 'correct': {
          const name = window.prompt('Correct medication name:', med.name);
          return name
            ? prev.map((m) => (m.id === med.id ? { ...m, name } : m))
            : prev;
        }
        case 'note': {
          const note = window.prompt('Note:', med.note ?? '');
          return note !== null
            ? prev.map((m) =>
                m.id === med.id ? { ...m, note: note || undefined } : m
              )
            : prev;
        }
        case 'add-task': {
          const task = window.prompt('Task:', med.task ?? '');
          return task !== null
            ? prev.map((m) =>
                m.id === med.id ? { ...m, task: task || undefined } : m
              )
            : prev;
        }
        case 'move-up':
        case 'move-down': {
          const group = prev.filter((m) => m.status === med.status);
          const gi = group.findIndex((m) => m.id === med.id);
          const swap = group[gi + (action === 'move-up' ? -1 : 1)];
          if (!swap) return prev;
          const next = [...prev];
          const i = next.findIndex((m) => m.id === med.id);
          const j = next.findIndex((m) => m.id === swap.id);
          [next[i], next[j]] = [next[j], next[i]];
          return next;
        }
        default:
          return prev;
      }
    });
    setLog((prev) => [`${med.name}: ${action}`, ...prev.slice(0, 4)]);
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
        quickAddOptions={[
          'atorvastatin 20 mg tablet',
          'metformin 500 mg tablet',
        ]}
        onQuickAdd={(name) =>
          setMeds((prev) => [
            ...prev,
            { id: `new-${Date.now()}`, name, status: 'unreconciled' },
          ])
        }
        onAddOther={() =>
          setLog((prev) => ['Open medication search…', ...prev])
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
 * `MedicationReconciliation` — the batteries-included standalone component.
 * Owns all interaction (status changes, the NCPDP MedicationEditor for
 * Correct / Add, Notes / Add Task modals, reordering, removal). Uncontrolled
 * here; pass `medications` + `onChange` for controlled usage. This same
 * component powers the eSheet `medicationList` question type.
 *
 * With `codeLookup` wired, Correct / Add Medication code the drug against
 * RxNorm/FDB offline (type "lisinopril" in the editor's search box).
 */
export const Reconciliation: StoryObj<typeof MedicationReconciliation> = {
  render: () => (
    <MedicationReconciliation
      defaultMedications={sampleMedications}
      quickAddOptions={[
        'atorvastatin 20 mg tablet',
        'metformin 500 mg tablet',
      ]}
      codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
      onChange={(meds) => console.log('medications changed', meds)}
    />
  ),
};
