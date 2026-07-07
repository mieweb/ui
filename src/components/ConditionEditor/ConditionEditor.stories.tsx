import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { useState } from 'react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { CodeLookup } from '../CodeLookup';
import { DataVisNitroGrid, DataVisNitroSource } from '../DataVisNITRO';
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
  title: 'Healthcare/ConditionEditor',
  component: ConditionEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Dialog editor for **condition assertions** — the condition analog of the planned MedicationEditor.

- **Capture-first:** only the problem name is required; ICD-10-CM / ICD-11 / SNOMED codings, severity, and onset are progressive enrichment.
- **Three-state uncertainty (§4.1):** every optional field has an *Unknown* toggle (explicitly unknown — distinct from untouched) and a low/med/high confidence control, written to the assertion's \`uncertainty\` block.
- **Fuzzy onset:** an exact date *or* a human string ("since her twenties").
- **Modes:** \`add\` / \`refine\` (with a progression checkbox) / \`revise\` (warns the prior assertion will be refuted) / \`relate\` (relationship type + target concern).
- **Code search:** \`renderCodeSearch\` dependency-injects a [CodeLookup](?path=/docs/healthcare-codelookup--docs) into the coding section (same pattern as Assessment's \`renderOrderSearch\`) — picking a result appends a coding row and fills an empty problem name.

The story is one **NITRO grid** of the patient's conditions — spanning severities,
verification statuses, exact and fuzzy onsets, concern relationships, and coding
maturity (uncoded capture → ICD-10-CM / ICD-11 / SNOMED with crosswalk provenance).
Each row carries **Observe / Refine / Revise / Relate** operations; **Add problem**
sits below the grid. Every operation writes back to the grid.
        `,
      },
    },
  },
  tags: ['autodocs'],
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

/** Serialize rows into an object-URL `{ typeInfo, data }` source. */
function useConditionRowsUrl(rows: ConditionRow[]): string {
  const url = React.useMemo(() => {
    const payload = {
      typeInfo: CONDITION_COLUMNS.map(({ field, type }) => ({ field, type })),
      data: rows,
    };
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    return URL.createObjectURL(blob);
  }, [rows]);

  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return url;
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
const ROW_OPS: ConditionEditorMode[] = [
  'observe',
  'refine',
  'revise',
  'relate',
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
  const url = useConditionRowsUrl(rows);

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
          <span className="flex gap-0.5">
            {ROW_OPS.map((m) => (
              <Button
                key={m}
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px] capitalize"
                onClick={() => setEditor({ mode: m, concernId: value })}
              >
                {m}
              </Button>
            ))}
          </span>
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
      <DataVisNitroSource type="http" url={url}>
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
