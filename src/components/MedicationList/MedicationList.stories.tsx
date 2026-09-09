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
  id: 'clinical-lists-medicationlist',
  title: 'Healthcare/Clinical lists/MedicationList',
  component: MedicationList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **presenting-medications list with medication reconciliation**: review a patient's medications during an encounter and record whether they are actually taking each one. Rows group by \`MedicationStatus\` — Unreconciled → Taking as Directed → Not Taking as Directed → Not Taking → Unknown — and each row shows name, \`code\` (\`RxNORM 314076\`), \`sig\`, an **EXPIRED** flag, "Discontinued on", and any \`note\` / \`task\`. Three layers ship from this folder:

| Component | Use when | Story |
|---|---|---|
| \`MedicationReconciliation\` | You want the whole workflow working out of the box — status buttons, the NCPDP \`MedicationEditor\` for Correct / Add, Notes and Add Task dialogs, remove, reorder, quick-add or an inline coded search (\`inlineAddSearch\`). Uncontrolled (\`defaultMedications\`) or controlled (\`medications\` + \`onChange\`) | **Interactive**, **Empty**, **Reconciliation** |
| \`MedicationList\` | You need full control of the data flow and will supply your own dialogs / editor. Presentational and controlled: \`medications\` in, \`onStatusChange\` / \`onAction\` / \`onReorder\` / \`onQuickAdd\` / \`onAddOther\` out | **Headless**, **Default** and the variant stories |
| \`registerMedicationListFieldType()\` | The list is a question inside an eSheet form | [MedicationListField (eSheet)](?path=/docs/clinical-lists-medicationlistfield-esheet--docs) |

**Start with \`MedicationReconciliation\` unless you have a reason not to.** \`MedicationEditor\` (the NCPDP SCRIPT NewRx \`MedicationPrescribed\` field set — drug, code, strength, dose form, quantity, days supply, refills, DAW, sig, dates, indication, pharmacy notes) is exported on its own too, as are the parsers it uses: \`parseMedicationLabel\` ("lisinopril 20 mg tablet" → strength / dose form / quantity unit) and \`parseSig\` (route / frequency / PRN from the sig text). Drug coding is dependency-injected: \`codeLookup={{ component: CodeLookup, indexUrl }}\` (or an ambient \`CodeLookupProvider\`); omit it and the editor falls back to a plain name input. \`actions\` trims the row toolbar (\`open · correct · refill · add-task · note · remove · move-up · move-down\`); host-specific \`open\` / \`refill\` are reported through \`onAction\`, never handled.

### Use it when

- An encounter workflow needs the patient's medication list **reconciled** — every row ends up Taking / Not taking as directed / Not taking / Unknown — and the result persisted as \`Medication[]\`.
- You want prescription detail captured in NCPDP-shaped fields so it can feed an eRx or reconciliation document later.
- Patient-facing intake: \`MedicationReconciliation inlineAddSearch\` without \`quickAddOptions\` adds coded medications from an empty list without leading the patient.

### Don't use it when

- You need the **allergy** list — [AllergyList](?path=/docs/clinical-lists-allergylist--docs); same three-layer pattern, different model (NKA tri-state, allergy vs intolerance).
- You are placing a **new medication order** inside the visit's plan — [Assessment](?path=/docs/encounter-orders-assessment--docs) with [OrderEditor](?path=/docs/encounter-orders-ordereditor--docs), which morphs into this folder's \`MedicationEditor\` for \`type: 'medication'\` orders.
- You just need a read-only medication summary in a banner — [PatientHeader](?path=/docs/encounter-orders-patientheader--docs)'s \`showMedicationBanner\` renders name / dose pills; use \`MedicationList readOnly\` only when the grouped status view matters.
- You need drug–drug interaction, dose-range or formulary checks — nothing here validates clinical content.

### Example

\`\`\`tsx
// Batteries-included, controlled, coded — the recommended shape
const [meds, setMeds] = useState<Medication[]>(encounter.presentingMedications);

<MedicationReconciliation
  medications={meds}
  onChange={(next) => { setMeds(next); saveEncounter({ presentingMedications: next }); }}
  quickAddOptions={['aspirin 81 mg tablet', 'atorvastatin 20 mg tablet']}
  codeLookup={{ component: CodeLookup, indexUrl: '/codify' }} // omit inside a CodeLookupProvider
  actions={['correct', 'add-task', 'note', 'remove', 'refill']}
  onAction={(med, action) => action === 'refill' && openRefill(med)}   // host-specific actions
/>

// Presentational layer only — you own every mutation
<MedicationList
  medications={meds}
  onStatusChange={(med, status) => setMeds((prev) => prev.map((m) => (m.id === med.id ? { ...m, status } : m)))}
  onAction={(med, action) => action === 'remove' ? setMeds((prev) => prev.filter((m) => m.id !== med.id)) : openMyDialog(med, action)}
  onReorder={(ids) => setMeds((prev) => [...prev].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)))}
/>
\`\`\`

\`MedicationReconciliation\` owns dialog state only; the list itself is yours in controlled mode. Give \`MedicationEditor\` a \`key\` per target when you mount it directly — the draft is seeded once per mount.

### Limitations

- **Accessibility as implemented.** Groups are \`<section aria-label>\` with a \`<ul>\`; rows become focusable (\`tabIndex={0}\`, ↑/↓ between rows, Alt+↑/↓ to reorder) only when \`onReorder\` is set. Row actions are a \`RowActionToolbar\` (\`role="toolbar"\`, ←/→) — hover-revealed on fine-pointer devices, always visible on touch, reachable by Tab; status buttons carry \`aria-pressed\`. Status changes and reorders are announced via \`useLiveAnnouncement\` into an \`sr-only\` \`aria-live="polite"\` region; adds, removes, notes and tasks are **not** announced. The editor's derived route / frequency / PRN line is \`aria-live="polite"\`. Dialogs come from \`Modal\` (focus trap, Esc).
- **Clinical safety.** No interaction, allergy, duplicate-therapy, dose-range or formulary checking; \`expired\` and \`discontinuedDate\` are display flags the host derives; \`parseSig\` / \`parseMedicationLabel\` are regex heuristics for English sigs and labels and can be wrong — treat their output as suggestions. Coded search only covers what the codify shards contain (RxNorm / FDB); the fallback is uncoded free text.
- **Reordering** is confined to the same status group; cross-group moves must go through a status button.
- **Responsive / RTL.** Rows \`flex-wrap\`; the toolbar's \`right-*\` overlay and \`pl-*\` note indents are physical, so RTL does not mirror.
- **Theming / i18n.** Semantic tokens via \`Card\` / \`Badge\` plus hard-coded red for **EXPIRED**. \`title\`, \`reconciledMessage\` and \`emptyMessage\` are props; group labels (\`MEDICATION_STATUS_LABELS\`), action labels, dialog copy and the NCPDP field labels are English constants.
- **Dependencies / entry.** \`Card\`, \`Badge\`, \`Button\`, \`Modal\`, \`Textarea\`, \`Label\`, \`RowActionToolbar\`, \`useDragReorder\`, \`useLiveAnnouncement\`; main \`@mieweb/ui\` entry, no peers. \`CodeLookup\` is **not** in the package build (module Web Worker) — import it from a source checkout through your app bundler and inject it.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'clinical-lists-codelookup',
          why: 'codeLookup={{ component: CodeLookup, indexUrl }} gives MedicationEditor and the inline add bar offline RxNorm / FDB drug coding.',
        },
        {
          type: 'composes with',
          target: 'encounter-orders-ordereditor',
          why: "OrderEditor morphs into this folder's MedicationEditor for medication orders and maps AssessmentOrder ⇄ Medication.",
        },
        {
          type: 'uses',
          target: 'actions-rowactiontoolbar',
          why: 'Status buttons and row actions are RowIconButtons inside a RowActionToolbar.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
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
    sig: 'As needed pain, not to exceed 4 tablets in a 24-hour period',
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
 * Start from nothing and build the list quickly — without leading the
 * patient.
 */
export const Empty: StoryObj<typeof MedicationReconciliation> = {
  render: () => (
    <MedicationReconciliation
      defaultMedications={[]}
      inlineAddSearch
      codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
      onChange={(meds) => console.log('medications changed', meds)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Patient-facing rapid entry from an empty list** (intake / new patient).
Starts at "No medications recorded." with **no suggested medications** —
quick-add pills would *lead the patient*, so this variant omits
\`quickAddOptions\` entirely and uses \`inlineAddSearch\` instead:

- Type in the always-visible search bar, pick a coded result — the
  medication is added to **Unreconciled** immediately (name, RxNorm/FDB
  code, strength, dose form all captured); the input clears for the next
  one. Free text (Enter) works for anything not found
- Then record *how they're taking it*: hover/tap the new row and hit
  👍 / 🤘 / 👎 / ? — two interactions per medication total
- "Other…" is still there for entries needing full prescription detail

For clinician-facing quick picks, add \`quickAddOptions\` back — see
**Interactive**.
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
      quickAddOptions={['atorvastatin 20 mg tablet', 'metformin 500 mg tablet']}
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
