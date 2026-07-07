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
Presenting-medications list with **medication reconciliation** — review a
patient's medications during an encounter and record whether they're
actually taking each one. Medications group themselves by status
(Unreconciled → Taking as Directed → Not Taking as Directed → Not Taking →
Unknown); hover or keyboard-focus a row to reveal the action toolbar.

### Which layer do I use?

| Component | Use when | Story |
|---|---|---|
| \`MedicationReconciliation\` | You want the whole workflow working out of the box — dialogs, NCPDP editor, add/remove/reorder | **Interactive**, **Reconciliation** |
| \`MedicationList\` | You need full control of the data flow and will supply your own dialogs/editor | **Headless**, **Default**, and the variant stories |
| \`registerMedicationListFieldType()\` | The list is a question inside an eSheet form | *eSheet/MedicationListField* |

Start with \`MedicationReconciliation\` unless you have a reason not to.
Full docs: [README](https://github.com/mieweb/ui/blob/main/src/components/MedicationList/README.md).
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
  parameters: {
    docs: {
      description: {
        story: `
**Start here.** The complete reconciliation workflow using
\`MedicationReconciliation\` — the component most apps should reach for.
Everything works without writing any handler code:

- **Status buttons** (👍 🤘 👎 ?) move the row to the matching group
- **Correct** and **Other…** open the NCPDP \`MedicationEditor\`; the drug
  search codes against RxNorm/FDB offline (try typing "lisinopril 20") and
  auto-fills strength, dose form, and quantity unit
- **Notes / Add Task** open small dialogs; their text appears under the row
- **Drag** a row by its grip to reorder within its status group (same
  interaction as Assessment); Alt+↑/↓ is the keyboard equivalent
- Every mutation surfaces through \`onChange\` (logged below the list)

\`codeLookup\` is dependency-injected (\`{ component: CodeLookup, indexUrl }\`)
because CodeLookup's Web Worker keeps it out of the main library bundle.
        `,
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story: `
The **presentational \`MedicationList\` layer by itself** — use this only
when you need to own the data flow (your own editor, server round-trips per
action, custom dialogs). It renders and reports; it never mutates:

- \`onStatusChange\` / \`onAction\` / \`onReorder\` / \`onQuickAdd\` /
  \`onAddOther\` fire with the row and intent — the log below shows each one
- Nothing happens unless *you* update \`medications\` (here only status,
  remove, reorder, and quick-add are wired; Correct/Notes/Add Task just log,
  which is exactly what you'd see if you forgot to handle them)

If you find yourself reimplementing the dialogs, switch to
\`MedicationReconciliation\` (see **Interactive**).
        `,
      },
    },
  },
};

/** Static list matching the WebChart "Presenting medications" screen. */
export const Default: Story = {
  args: {
    medications: sampleMedications,
    quickAddOptions: ['atorvastatin 20 mg tablet'],
  },
  parameters: {
    docs: {
      description: {
        story: `
The default presentation with no handlers wired — what you get from just
\`<MedicationList medications={…}/>\`. Mirrors the WebChart "Presenting
medications" screen this component reproduces. Buttons render but do
nothing: pair with handlers (see **Headless**) or use
\`MedicationReconciliation\`. Use the Controls panel to experiment with
props.
        `,
      },
    },
  },
};

/** Everything reconciled — Unreconciled group shows the completion message. */
export const FullyReconciled: Story = {
  args: {
    medications: sampleMedications.map((m) =>
      m.status === 'unreconciled' ? { ...m, status: 'taking' as const } : m
    ),
  },
  parameters: {
    docs: {
      description: {
        story: `
The "done" state: when no medication is left \`unreconciled\`, the
Unreconciled group stays visible with a ✓ completion message
(customizable via \`reconciledMessage\`) so clinicians can confirm at a
glance that the review is finished — an empty group disappearing would be
ambiguous.
        `,
      },
    },
  },
};

/** Read-only (no hover actions). */
export const ReadOnly: Story = {
  args: {
    medications: sampleMedications,
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
\`readOnly\` removes every action affordance (toolbars, quick-add, drag) —
for chart summaries, printouts, or when the viewer lacks permission to
reconcile. The eSheet field uses this automatically outside fill-out mode
(e.g. on the builder canvas).
        `,
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: `
Per-row safety flags: \`expired: true\` renders a red **EXPIRED** marker
(the medication's end date has passed); \`discontinuedDate\` renders
"Discontinued on: *date*". These are display-only — deriving them (e.g.
comparing \`endDate\` to today) is the host's responsibility.
        `,
      },
    },
  },
};

/** Limit the row actions shown. */
export const LimitedActions: Story = {
  args: {
    medications: sampleMedications,
    actions: ['correct', 'remove'],
  },
  parameters: {
    docs: {
      description: {
        story: `
The \`actions\` prop controls which non-status buttons each row offers —
here only Correct and Remove. Trim to what your context supports: e.g. the
eSheet field omits \`open\`/\`refill\` because a form has no EHR to open or
refill against. Status buttons are always shown (hide everything with
\`readOnly\`).
        `,
      },
    },
  },
};

/**
 * Start from nothing and build the list quickly.
 */
export const Empty: StoryObj<typeof MedicationReconciliation> = {
  render: () => (
    <MedicationReconciliation
      defaultMedications={[]}
      quickAddOptions={[
        'aspirin 81 mg tablet',
        'atorvastatin 20 mg tablet',
        'lisinopril 10 mg tablet',
        'metformin 500 mg tablet',
        'omeprazole 20 mg capsule',
      ]}
      codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
      onChange={(meds) => console.log('medications changed', meds)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Rapid entry from an empty list** — the intake / new-patient workflow.
Starts with zero medications ("No medications recorded."):

- **Quick-add pills** append common medications with one click — curate
  \`quickAddOptions\` to your clinic's top prescriptions for fastest entry
- **Other…** opens the editor with the CodeLookup search focused: type,
  pick a coded result (strength/form auto-fill), Save — three actions per
  medication
- New entries land in **Unreconciled**, ready for the reconciliation pass
        `,
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: `
\`MedicationReconciliation\` **without** \`codeLookup\` — for apps that
can't ship the codify index (or don't need coding). The editor's drug
search degrades to a plain medication name input; everything else (NCPDP
fields, sig parsing, dialogs, reordering) works identically. Uncontrolled
here via \`defaultMedications\`; changes surface in the browser console
through \`onChange\`.
        `,
      },
    },
  },
};
