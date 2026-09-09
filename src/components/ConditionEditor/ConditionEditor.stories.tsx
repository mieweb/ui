import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { useState } from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { CodeLookup } from '../CodeLookup';
import { DataVisNitroGrid, DataVisNitroSource } from '../DataVisNITRO';
import { RowActionToolbar, RowIconButton } from '../RowActionToolbar';
import { StickyNoteIcon, PencilIcon, RefreshIcon, LinkIcon } from '../Icons';
import {
  ConditionEditor,
  type ConditionAssertionDraft,
  type ConditionEditorMode,
} from './ConditionEditor';
import type {
  ConcernRelationship,
  ConditionAssertion,
  ConditionConcern,
  VerificationStatus,
} from '../ProblemList';

const meta: Meta<typeof ConditionEditor> = {
  id: 'clinical-lists-conditioneditor',
  title: 'Healthcare/Clinical lists/ConditionEditor',
  component: ConditionEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **modal editor for a condition assertion** — the write side of the concern / assertion model that \`ProblemList\` and \`Assessment\` display. One component, five \`mode\`s: \`add\` (new concern, first assertion), \`refine\` (new assertion, \`changeType: 'refinement'\`, or \`'progression'\` via a checkbox), \`revise\` (\`'revision'\`; a \`role="alert"\` warns that the prior assertion will be refuted), \`relate\` (relationship type + target from \`relatableConcerns\` → \`onRelate\`), \`observe\` (dated progress note → \`onAddObservation\`, with the past observations listed). **Capture-first:** the problem name is the only required field; ICD-10-CM / ICD-11 / SNOMED coding rows, verification status, severity, exact or fuzzy onset ("since her twenties") and a note are progressive enrichment. Every optional field carries the **three-state uncertainty** affordance — an *Unknown* toggle (explicitly unknown, distinct from untouched) and a low / medium / high confidence control — written to the draft's \`uncertainty.fields\`. \`renderCodeSearch\` dependency-injects a code search into the coding section (a pick appends a coding row and fills an empty name; free text fills the name); it defaults to the ambient \`CodeLookupProvider\` (condition shard, ICD-10 preferred) and \`false\` leaves manual code entry only. \`onSave\` returns a \`ConditionAssertionDraft\` (no \`id\` / \`date\` — the host assigns them); the draft is reseeded from \`concern\`'s current assertion whenever \`open\`, \`mode\` or \`concern\` changes.

### Use it when

- A \`ProblemList\` or \`Assessment\` row action (\`refine\` / \`revise\` / \`relate\` / \`observe\`) or an "Add problem" button needs a form, and the host will append the resulting assertion to the concern.
- You want uncertainty recorded as data (\`known: false\`, \`reason\`, \`confidence\`) rather than lost in a free-text note.
- You can supply a coded search (\`CodeLookup\` or your own) or accept manual system / code / display rows.

### Don't use it when

- You are editing a **medication** or an **order** — [MedicationList](?path=/docs/clinical-lists-medicationlist--docs)'s \`MedicationEditor\` (NCPDP fields) or [OrderEditor](?path=/docs/encounter-orders-ordereditor--docs). The field sets do not overlap.
- You only need to **display** conditions — [ProblemList](?path=/docs/clinical-lists-problemlist--docs) (chart) or [PresentingProblems](?path=/docs/clinical-lists-presentingproblems--docs) (encounter relevance); neither needs this editor to render.
- The task is just picking a code with no assertion semantics — use [CodeLookup](?path=/docs/clinical-lists-codelookup--docs) directly.

### Example

\`\`\`tsx
const [editor, setEditor] = useState<{ mode: ConditionEditorMode; concernId?: string } | null>(null);
const concern = concerns.find((c) => c.concernId === editor?.concernId);

<ConditionEditor
  mode={editor?.mode ?? 'add'}
  open={editor !== null}
  onOpenChange={(open) => !open && setEditor(null)}
  concern={editor?.mode === 'add' ? undefined : concern}
  relatableConcerns={concerns.filter((c) => c.concernId !== editor?.concernId)}
  onSave={(draft) => {
    const assertion: ConditionAssertion = { ...draft, id: newId(), date: today() };
    if (editor?.mode === 'add') return addConcern(assertion);
    // a revision refutes the assertion it supersedes; a refinement keeps it
    appendAssertion(editor!.concernId!, assertion, { refute: draft.changeType === 'revision' ? draft.supersedes : undefined });
  }}
  onRelate={(rel) => addRelationship(editor!.concernId!, rel)}
  onAddObservation={(text) => addObservation(editor!.concernId!, { id: newId(), date: today(), text })}
  renderCodeSearch={({ placeholder, onPick, onFreeText }) => (
    <CodeLookup indexUrl="/codify" searchDomains={['condition']} preferCodetypes={['ICD10']} bare placeholder={placeholder} onSelect={onPick} onFreeText={onFreeText} />
  )}
/>
\`\`\`

The host owns the concern list, ids and dates; the editor only produces a draft. Omit \`renderCodeSearch\` inside a \`CodeLookupProvider\` to inherit the app-wide lookup.

### Limitations

- **Accessibility as implemented.** Built on \`Modal\` (\`size="lg"\`), so focus trapping, Esc and overlay dismissal are inherited. Fields use \`Input\` / \`Textarea\` / \`Select\` labels; coding rows, uncertainty toggles (\`role="group"\`, \`aria-pressed\`), severity (\`role="group"\`) and remove buttons are individually \`aria-label\`led. The revise warning is \`role="alert"\`; nothing else is announced (a save simply closes the dialog). There is no \`ModalClose\` button — cancel is the footer button, Esc or the overlay.
- **Clinical safety.** No code validation (any string is accepted as a code), no check that a picked code matches the typed name, no duplicate-concern detection, and the *coding unknown* flag silently drops any codes on save. Injected lookups return whatever the shards contain — see CodeLookup's dataset caveats.
- **Progression** is a checkbox that only exists in \`refine\` mode; \`reattribution\` cannot be produced by this editor.
- **Reseeding** happens on every \`open\` / \`mode\` / \`concern\` change: unsaved edits are lost if the host swaps the concern while open.
- **Responsive / RTL.** Sections stack vertically; coding and onset rows \`flex-wrap\`. No breakpoint variants and no RTL-specific handling beyond the underlying inputs.
- **Theming / i18n.** Semantic tokens plus hard-coded amber for the revise alert. All titles, labels, placeholders, option labels and helper copy are English constants — no \`labels\` prop.
- **Dependencies.** \`Modal\`, \`Input\`, \`Textarea\`, \`Select\`, \`Badge\`, \`Button\`, the \`ProblemList\` model types and \`currentAssertion\`, \`CodeLookupProvider\` context; main \`@mieweb/ui\` entry. \`CodeLookup\` itself is not in the package — see its page.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'clinical-lists-problemlist',
          why: 'Opens from ProblemList row actions and returns the assertion draft the host appends to that concern.',
        },
        {
          type: 'composes with',
          target: 'encounter-orders-assessment',
          why: "Assessment's refine / revise actions open the editor to record today's assertion for an assessed problem.",
        },
        {
          type: 'composes with',
          target: 'clinical-lists-codelookup',
          why: 'renderCodeSearch injects a condition-shard CodeLookup into the coding section; a pick appends an ICD-10 / SNOMED coding row.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'The editor is a size="lg" Modal.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof ConditionEditor>;

// =============================================================================
// Sample concerns — variety across severity / verification / onset /
// relatedness / coding maturity
// =============================================================================

const SEED_CONCERNS: ConditionConcern[] = [
  {
    concernId: 'C-42',
    clinicalStatus: 'active',
    source: 'ehrProblemList',
    observations: [
      {
        id: 'O-1',
        date: '2025-09-14',
        text: 'A1c 7.9. Started CGM; counseled on carb counting.',
        author: 'J. Rivera NP',
      },
      {
        id: 'O-2',
        date: '2026-01-20',
        text: 'A1c 7.4, trending down. Basal reduced 2u for nocturnal hypoglycemia.',
        author: 'Dr. Chen',
      },
    ],
    assertions: [
      {
        id: 'A-3',
        date: '2023-06-14',
        text: 'Type 1 diabetes mellitus',
        verificationStatus: 'confirmed',
        severity: 'moderate',
        onset: { date: '2005-03-01' },
        coding: [
          { system: 'ICD-10-CM', code: 'E10.9', primary: true },
          { system: 'SNOMED', code: '46635009' },
        ],
      },
    ],
  },
  {
    concernId: 'C-51',
    clinicalStatus: 'active',
    source: 'ehrProblemList',
    relationships: [
      {
        type: 'caused-by',
        concernId: 'C-42',
        display: 'Type 1 diabetes mellitus',
      },
    ],
    assertions: [
      {
        id: 'A-20',
        date: '2025-11-02',
        text: 'Chronic kidney disease, stage 2',
        verificationStatus: 'confirmed',
        severity: 'mild',
        onset: { date: '2025-08-15' },
        coding: [
          { system: 'ICD-10-CM', code: 'N18.2', primary: true },
          { system: 'SNOMED', code: '431856006', mappedFrom: 'ICD-10-CM' },
        ],
      },
    ],
  },
  {
    concernId: 'C-8',
    clinicalStatus: 'active',
    source: 'claimsHistory',
    relationships: [
      {
        type: 'evolved-from',
        concernId: 'C-7',
        display: 'Transient ischemic attack',
      },
    ],
    assertions: [
      {
        id: 'A-12',
        date: '2024-04-17',
        text: 'Cerebrovascular disease',
        verificationStatus: 'confirmed',
        severity: 'severe',
        onset: { date: '2024-04-11' },
        coding: [{ system: 'ICD-10-CM', code: 'I67.9', primary: true }],
      },
    ],
  },
  {
    concernId: 'C-63',
    clinicalStatus: 'active',
    source: 'patientReported',
    assertions: [
      {
        id: 'A-31',
        date: '2026-02-09',
        text: 'Migraine with aura',
        verificationStatus: 'confirmed',
        severity: 'severe',
        onset: { fuzzy: 'since her twenties' },
        coding: [{ system: 'ICD-10-CM', code: 'G43.109', primary: true }],
        uncertainty: {
          fields: { onset: { known: true, confidence: 'low' } },
        },
      },
    ],
  },
  {
    concernId: 'C-70',
    clinicalStatus: 'active',
    source: 'manuallyAdded',
    relationships: [
      { type: 'differential-sibling', concernId: 'C-71', display: 'GERD' },
    ],
    assertions: [
      {
        id: 'A-40',
        date: '2026-06-28',
        text: 'Atypical chest pain',
        verificationStatus: 'differential',
        onset: { fuzzy: 'past two weeks, intermittent' },
        uncertainty: {
          overall: 'low',
          fields: { coding: { known: false, reason: 'not-asked' } },
        },
      },
    ],
  },
  {
    concernId: 'C-71',
    clinicalStatus: 'active',
    source: 'manuallyAdded',
    relationships: [
      {
        type: 'differential-sibling',
        concernId: 'C-70',
        display: 'Atypical chest pain',
      },
    ],
    assertions: [
      {
        id: 'A-41',
        date: '2026-06-28',
        text: 'Gastro-esophageal reflux disease',
        verificationStatus: 'provisional',
        severity: 'mild',
        onset: { fuzzy: 'worse after late meals' },
        coding: [{ system: 'ICD-10-CM', code: 'K21.9', primary: true }],
      },
    ],
  },
  {
    concernId: 'C-77',
    clinicalStatus: 'active',
    source: 'patientReported',
    assertions: [
      {
        id: 'A-50',
        date: '2026-04-03',
        text: 'Seasonal allergic rhinitis',
        verificationStatus: 'unconfirmed',
        severity: 'mild',
        onset: { fuzzy: 'every spring' },
        // capture-first: no coding yet
      },
    ],
  },
  {
    concernId: 'C-80',
    clinicalStatus: 'active',
    source: 'ehrProblemList',
    assertions: [
      {
        id: 'A-60',
        date: '2024-10-12',
        text: 'Osteoarthritis of knee',
        verificationStatus: 'provisional',
        coding: [{ system: 'ICD-10-CM', code: 'M17.9', primary: true }],
      },
      {
        id: 'A-61',
        date: '2025-05-06',
        text: 'Osteoarthritis of left knee',
        verificationStatus: 'confirmed',
        changeType: 'refinement',
        supersedes: 'A-60',
        severity: 'moderate',
        onset: { fuzzy: 'after 2019 skiing injury' },
        coding: [
          { system: 'ICD-10-CM', code: 'M17.12', primary: true },
          { system: 'ICD-11', code: 'FA01.1' },
          { system: 'SNOMED', code: '427409003' },
        ],
      },
    ],
  },
  {
    concernId: 'C-90',
    clinicalStatus: 'resolved',
    source: 'ehrProblemList',
    assertions: [
      {
        id: 'A-70',
        date: '2025-12-02',
        text: 'Community-acquired pneumonia',
        verificationStatus: 'confirmed',
        severity: 'moderate',
        onset: { date: '2025-11-27' },
        coding: [{ system: 'ICD-10-CM', code: 'J18.9', primary: true }],
      },
    ],
  },
  {
    concernId: 'C-95',
    clinicalStatus: 'inactive',
    source: 'claimsHistory',
    assertions: [
      {
        id: 'A-80',
        date: '2025-07-19',
        text: 'Latent tuberculosis',
        verificationStatus: 'refuted',
        note: 'IGRA negative ×2; prior claims code judged erroneous.',
        coding: [{ system: 'ICD-10-CM', code: 'Z22.7', primary: true }],
      },
    ],
  },
];

// =============================================================================
// Concern → grid row
// =============================================================================

/** Last non-refuted assertion, falling back to the newest one. */
function currentAssertion(concern: ConditionConcern): ConditionAssertion {
  const live = concern.assertions.filter(
    (a) => a.verificationStatus !== 'refuted'
  );
  return (live[live.length - 1] ??
    concern.assertions[concern.assertions.length - 1]) as ConditionAssertion;
}

function codingSummary(assertion: ConditionAssertion): string {
  if (!assertion.coding?.length) return '— uncoded —';
  return assertion.coding
    .map(
      (c) =>
        `${c.system} ${c.code}${c.primary ? '*' : ''}${
          c.mappedFrom ? ` (←${c.mappedFrom})` : ''
        }`
    )
    .join(', ');
}

function relatedSummary(concern: ConditionConcern): string {
  if (!concern.relationships?.length) return '';
  return concern.relationships
    .map((r) => `${r.type} ${r.display ?? r.concernId}`)
    .join('; ');
}

interface ConditionRow extends Record<string, unknown> {
  concernId: string;
  problem: string;
  status: string;
  verification: VerificationStatus;
  severity: string;
  onset: string;
  coding: string;
  related: string;
  asserted: string;
  /** carries the concernId for the actions cell renderer */
  actions: string;
}

function toRow(concern: ConditionConcern): ConditionRow {
  const a = currentAssertion(concern);
  return {
    concernId: concern.concernId,
    problem: a.text,
    status: concern.clinicalStatus,
    verification: a.verificationStatus,
    severity: a.severity ?? '',
    onset: a.onset?.date ?? a.onset?.fuzzy ?? '',
    coding: codingSummary(a),
    related: relatedSummary(concern),
    asserted: a.date,
    actions: concern.concernId,
  };
}

const CONDITION_COLUMNS: {
  field: keyof ConditionRow & string;
  header: string;
  type: 'string' | 'date';
}[] = [
  { field: 'problem', header: 'Problem', type: 'string' },
  { field: 'status', header: 'Status', type: 'string' },
  { field: 'verification', header: 'Verification', type: 'string' },
  { field: 'severity', header: 'Severity', type: 'string' },
  { field: 'onset', header: 'Onset', type: 'string' },
  { field: 'coding', header: 'Coding', type: 'string' },
  { field: 'related', header: 'Related', type: 'string' },
  { field: 'asserted', header: 'Asserted', type: 'date' },
];

/**
 * Hand rows to the grid through a short-lived `local` window-var source
 * (same pattern as SuperChat's nitroTableGrid) so the grid renders
 * synchronously and never pauses in the intermediate "Waiting…" state —
 * an async http/blob source lets the a11y test-runner snapshot the
 * low-contrast placeholder and fail.
 */
function useConditionRowsVar(rows: ConditionRow[]): string {
  const varName = React.useMemo(() => {
    const nextVarName = `__condition_editor_rows_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, unknown>)[nextVarName] = {
      typeInfo: CONDITION_COLUMNS.map(({ field, type }) => ({ field, type })),
      data: rows,
    };
    return nextVarName;
  }, [rows]);

  React.useEffect(
    () => () => {
      delete (window as unknown as Record<string, unknown>)[varName];
    },
    [varName]
  );
  return varName;
}

// =============================================================================
// Cell badges
// =============================================================================

const VERIFICATION_VARIANT: Record<
  VerificationStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'danger'
> = {
  confirmed: 'success',
  provisional: 'warning',
  differential: 'warning',
  unconfirmed: 'secondary',
  refuted: 'danger',
  'entered-in-error': 'danger',
};

const SEVERITY_VARIANT: Record<string, 'secondary' | 'warning' | 'danger'> = {
  mild: 'secondary',
  moderate: 'warning',
  severe: 'danger',
};

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'success' | 'warning' | 'danger'
> = {
  active: 'default',
  recurrence: 'warning',
  relapse: 'warning',
  inactive: 'secondary',
  remission: 'secondary',
  resolved: 'success',
};

function formatConditionCell(
  value: unknown,
  _row: unknown,
  column: { field: string }
): React.ReactNode {
  if (typeof value !== 'string' || value === '') {
    return value as React.ReactNode;
  }
  if (column.field === 'verification') {
    return (
      <Badge
        size="sm"
        variant={VERIFICATION_VARIANT[value as VerificationStatus] ?? 'default'}
      >
        {value}
      </Badge>
    );
  }
  if (column.field === 'severity') {
    return (
      <Badge size="sm" variant={SEVERITY_VARIANT[value] ?? 'secondary'}>
        {value}
      </Badge>
    );
  }
  if (column.field === 'status') {
    return (
      <Badge size="sm" variant={STATUS_VARIANT[value] ?? 'default'}>
        {value}
      </Badge>
    );
  }
  return value;
}

// =============================================================================
// Story — one stateful grid; operations on the rows, Add at the bottom
// =============================================================================

const TODAY = '2026-07-04';
const ROW_OPS: {
  mode: ConditionEditorMode;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
}[] = [
  { mode: 'observe', label: 'Observe (progress note)', icon: StickyNoteIcon },
  { mode: 'refine', label: 'Refine (more specific)', icon: PencilIcon },
  { mode: 'revise', label: 'Revise (prior was wrong)', icon: RefreshIcon },
  { mode: 'relate', label: 'Relate to another problem', icon: LinkIcon },
];

let seq = 0;
const uid = () => `${Date.now().toString(36)}-${seq++}`;

function Template() {
  const [concerns, setConcerns] = useState<ConditionConcern[]>(SEED_CONCERNS);
  const [editor, setEditor] = useState<{
    mode: ConditionEditorMode;
    concernId?: string;
  } | null>(null);
  const [result, setResult] = useState<string>('');

  const rows = React.useMemo(() => concerns.map(toRow), [concerns]);
  const varName = useConditionRowsVar(rows);

  const columns = React.useMemo(
    () => [
      ...CONDITION_COLUMNS.map(({ field, header }) => ({
        field: field as string,
        header,
      })),
      {
        field: 'actions',
        header: '',
        sortable: false,
        filterable: false,
        // Right-stick the cell inside the grid's horizontal scroller so the
        // toolbar is reachable without side-scrolling to the last column.
        // The cell is transparent; the toolbar carries its own card chrome.
        className: 'sticky right-0 z-[1]',
      },
    ],
    []
  );

  const formatCell = React.useCallback(
    (
      value: unknown,
      row: Record<string, unknown>,
      column: { field: string }
    ): React.ReactNode => {
      if (column.field === 'actions' && typeof value === 'string' && value) {
        return (
          <RowActionToolbar
            label={`Actions for ${String(row.problem ?? value)}`}
            group="grid"
          >
            {ROW_OPS.map(({ mode, label, icon }) => (
              <RowIconButton
                key={mode}
                label={label}
                icon={icon}
                size="sm"
                onClick={() => setEditor({ mode, concernId: value })}
              />
            ))}
          </RowActionToolbar>
        );
      }
      return formatConditionCell(value, row, column);
    },
    []
  );

  const concern = concerns.find((c) => c.concernId === editor?.concernId);

  const handleSave = (draft: ConditionAssertionDraft) => {
    setResult(JSON.stringify(draft, null, 2));
    if (!editor) return;
    const assertion: ConditionAssertion = {
      ...draft,
      id: `A-${uid()}`,
      date: TODAY,
    };
    if (editor.mode === 'add') {
      setConcerns((prev) => [
        ...prev,
        {
          concernId: `C-${uid()}`,
          clinicalStatus: 'active',
          source: 'manuallyAdded',
          assertions: [assertion],
        },
      ]);
      return;
    }
    setConcerns((prev) =>
      prev.map((c) =>
        c.concernId !== editor.concernId
          ? c
          : {
              ...c,
              assertions: [
                // a revision refutes the assertion it supersedes
                ...(editor.mode === 'revise'
                  ? c.assertions.map((a) =>
                      a.id === draft.supersedes
                        ? { ...a, verificationStatus: 'refuted' as const }
                        : a
                    )
                  : c.assertions),
                assertion,
              ],
            }
      )
    );
  };

  const handleRelate = (rel: ConcernRelationship) => {
    setResult(JSON.stringify(rel, null, 2));
    if (!editor?.concernId) return;
    const target = concerns.find((c) => c.concernId === rel.concernId);
    setConcerns((prev) =>
      prev.map((c) =>
        c.concernId !== editor.concernId
          ? c
          : {
              ...c,
              relationships: [
                ...(c.relationships ?? []),
                {
                  ...rel,
                  display: target ? currentAssertion(target).text : undefined,
                },
              ],
            }
      )
    );
  };

  const handleObservation = (text: string) => {
    setResult(`observation: ${text}`);
    if (!editor?.concernId) return;
    setConcerns((prev) =>
      prev.map((c) =>
        c.concernId !== editor.concernId
          ? c
          : {
              ...c,
              observations: [
                ...(c.observations ?? []),
                { id: `O-${uid()}`, date: TODAY, text },
              ],
            }
      )
    );
  };

  return (
    <div className="space-y-3">
      <DataVisNitroSource type="local" varName={varName}>
        <DataVisNitroGrid
          title="Problem list — conditions"
          height="420px"
          columns={columns}
          features={{ stickyHeaders: true }}
          formatCell={formatCell}
        />
      </DataVisNitroSource>
      <Button onClick={() => setEditor({ mode: 'add' })}>Add problem</Button>
      <ConditionEditor
        mode={editor?.mode ?? 'add'}
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        concern={editor?.mode === 'add' ? undefined : concern}
        relatableConcerns={concerns.filter(
          (c) => c.concernId !== editor?.concernId
        )}
        onSave={handleSave}
        onRelate={handleRelate}
        onAddObservation={handleObservation}
        renderCodeSearch={({ placeholder, onPick, onFreeText }) => (
          <CodeLookup
            indexUrl="/codify"
            searchDomains={['condition']}
            preferCodetypes={['ICD10']}
            onSelect={onPick}
            onFreeText={onFreeText}
            limit={8}
            placeholder={placeholder}
            bare
          />
        )}
      />
      {result && (
        <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
          {result}
        </pre>
      )}
    </div>
  );
}

/**
 * One problem grid, all operations: **Observe / Refine / Revise / Relate** on
 * each row, **Add problem** below. Saves, relationships, and observations
 * write back to the grid; the editor's coding section searches the offline
 * codify index via the injected CodeLookup.
 */
export const Interactive: Story = { render: () => <Template /> };
