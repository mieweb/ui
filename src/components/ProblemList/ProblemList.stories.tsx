import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  ProblemList,
  type ConditionAssertion,
  type ConditionConcern,
  type ProblemListAction,
} from './ProblemList';
import {
  ConditionEditor,
  type ConditionAssertionDraft,
  type ConditionEditorMode,
} from '../ConditionEditor';

const meta: Meta<typeof ProblemList> = {
  id: 'clinical-lists-problemlist',
  title: 'Healthcare/Clinical lists/ProblemList',
  component: ProblemList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **chart-scope problem list**: one row per \`ConditionConcern\` — the durable identity (\`concernId\`) that encounters and orders reference — whose coded characterization evolves through an **assertion history** (\`assertions[]\`, oldest → newest; \`currentAssertion()\` returns the last non-refuted one). Rows group into **Unconfirmed / Active / Inactive / Resolved** (\`concernGroupKey()\`), show ICD-10 / ICD-11 codes inline with SNOMED and crosswalk provenance in a tooltip (\`CodingChips\`), verification and \`uncertainty\` badges, concern \`relationships\`, and expand into the assertion timeline (refuted assertions struck through) plus \`observations\`. Fully **controlled**: \`concerns\` in; \`onAction(concern, action)\`, \`onAddProblem(text)\` and \`onReorder(concernIds)\` out. \`actions\` trims the row toolbar (\`open · observe · refine · revise · resolve · relate · move-up · move-down\`); \`readOnly\` removes it. Also exported: \`currentAssertion\`, \`concernGroupKey\`, \`CodingChips\`, \`UncertaintyBadge\`, \`concernHistoryContent\`, \`CONCERN_STATUS_LABELS\`, \`CHANGE_TYPE_LABELS\` and the model types (\`ConditionConcern\`, \`ConditionAssertion\`, \`ConditionCoding\`, \`ConcernStatus\`, \`VerificationStatus\`, \`Uncertainty\`).

### Use it when

- You are rendering the **patient's longitudinal problem list** — every concern the chart knows about, not what one visit addressed.
- The host owns the concerns as data and can persist appended assertions, status changes, relationships and ordering; the list never mutates.
- You want capture-first entry: \`onAddProblem\` hands you a bare name to store as an \`unconfirmed\` assertion, enriched later through \`ConditionEditor\`.

### Don't use it when

- You need the **encounter view** — which of these concerns is relevant *this visit* and how (Addressed / Relevant Hx / Noted) — [PresentingProblems](?path=/docs/clinical-lists-presentingproblems--docs). Relevance lives on the encounter reference, never on the concern.
- You need today's **assessment and plan**, with orders nested under problems — [Assessment](?path=/docs/encounter-orders-assessment--docs).
- You need to **edit** an assertion (codes, severity, onset, uncertainty) — pair with [ConditionEditor](?path=/docs/clinical-lists-conditioneditor--docs); ProblemList only emits \`refine\` / \`revise\` / \`relate\` / \`observe\` intents.
- Your data is a flat list of diagnosis strings with no history or coding — a \`Table\` or plain list is simpler; the concern/assertion model is the whole point here.

### Example

\`\`\`tsx
const [concerns, setConcerns] = useState<ConditionConcern[]>(chart.problems);
const [editor, setEditor] = useState<{ mode: ConditionEditorMode; concern?: ConditionConcern } | null>(null);

<ProblemList
  concerns={concerns}
  onAction={(concern, action) => {
    if (action === 'resolve') {
      setConcerns((prev) => prev.map((c) => (c.concernId === concern.concernId ? { ...c, clinicalStatus: 'resolved' } : c)));
    } else if (action !== 'open') {
      setEditor({ mode: action as ConditionEditorMode, concern }); // refine | revise | relate | observe
    }
  }}
  onAddProblem={(text) =>
    setConcerns((prev) => [
      ...prev,
      { concernId: newId(), clinicalStatus: 'active', source: 'manuallyAdded',
        assertions: [{ id: newId(), date: today(), text, verificationStatus: 'unconfirmed' }] },
    ])
  }
  onReorder={(ids) => setConcerns((prev) => [...prev].sort((a, b) => ids.indexOf(a.concernId) - ids.indexOf(b.concernId)))}
/>
<ConditionEditor
  mode={editor?.mode ?? 'refine'}
  open={editor !== null}
  onOpenChange={(open) => !open && setEditor(null)}
  concern={editor?.concern}
  relatableConcerns={concerns}
  onSave={(draft) => appendAssertion(editor!.concern!, draft)} // for 'revision', also mark draft.supersedes refuted
  onRelate={(rel) => addRelationship(editor!.concern!, rel)}
  onAddObservation={(text) => addObservation(editor!.concern!, text)}
/>
\`\`\`

The host appends the new assertion (and, for a \`revision\`, marks the superseded assertion \`refuted\`) — the list never rewrites history itself.

### Limitations

- **Accessibility as implemented.** Groups are \`<section aria-label>\` around a \`<ul>\`; every row is a focusable \`<li tabIndex={0}>\` whose \`aria-label\` spells out Enter (toggle history) and Alt+↑/↓ (reorder); ↑/↓ move focus between rows. Row actions are a \`RowActionToolbar\` (\`role="toolbar"\`, ←/→ inside) that is hover-revealed on fine-pointer devices, always visible on touch and reachable by Tab. Reorders (pointer drop or keyboard) are announced through \`useLiveAnnouncement\` into an \`sr-only\` \`aria-live="polite"\` region; adds, resolves and history expansion are **not** announced. Only the "N assertions" button carries \`aria-expanded\`. Coding provenance is a \`Tooltip\` on a focusable span.
- **Clinical logic is the host's.** Nothing validates codes, dedupes concerns, checks crosswalk consistency, derives \`clinicalStatus\` transitions or defines what \`resolve\` means — \`onAction(…, 'resolve')\` is a request. \`currentAssertion()\` falls back to the newest assertion even when every assertion is refuted.
- **Reordering** needs \`onReorder\` and is confined to the same group (a cross-group drop would imply a status change); the rendered order is whatever you feed back.
- **Responsive / RTL.** Rows \`flex-wrap\`; nothing collapses or truncates. The timeline's \`ml-*\` / \`pl-*\` and the toolbar's \`right-*\` overlay are physical, so RTL layouts do not mirror.
- **Theming / i18n.** Semantic tokens via \`Card\` / \`Badge\` (\`bg-muted\`, \`border-border\`, \`text-muted-foreground\`). \`title\` and \`emptyMessage\` are props; group headings, action labels, verification/uncertainty badge text, the add placeholder and "N assertions" are English constants.
- **Dependencies.** \`Card\`, \`Badge\`, \`Button\`, \`Tooltip\`, \`RowActionToolbar\`, \`useDragReorder\`, \`useLiveAnnouncement\`; main \`@mieweb/ui\` entry, no peers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'clinical-lists-presentingproblems',
          why: 'PresentingProblems takes these chart concerns as patientConcerns and tags which are relevant this encounter.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-conditioneditor',
          why: 'The refine / revise / relate / observe row actions open a ConditionEditor whose draft the host appends to the concern.',
        },
        {
          type: 'uses',
          target: 'actions-rowactiontoolbar',
          why: 'Each concern row reveals its actions through a RowActionToolbar.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof ProblemList>;

/** The canonical diabetes-evolution thread from the design doc. */
const diabetesConcern: ConditionConcern = {
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
      text: 'A1c 7.4, trending down. Mild nocturnal hypoglycemia — basal reduced 2u.',
      author: 'Dr. Chen',
    },
    {
      id: 'O-3',
      date: '2026-05-02',
      text: 'Foot exam normal. Neuropathic pain well controlled on gabapentin.',
      author: 'Dr. Chen',
    },
  ],
  assertions: [
    {
      id: 'A-1',
      date: '2019-03-12',
      text: 'Prediabetes',
      verificationStatus: 'provisional',
      coding: [{ system: 'ICD-10-CM', code: 'R73.03', display: 'Prediabetes' }],
    },
    {
      id: 'A-2',
      date: '2020-01-08',
      text: 'Type 2 diabetes mellitus',
      verificationStatus: 'refuted',
      changeType: 'refinement',
      supersedes: 'A-1',
      coding: [
        { system: 'ICD-10-CM', code: 'E11.9' },
        {
          system: 'SNOMED',
          code: '44054006',
          display: 'Type 2 diabetes mellitus',
        },
      ],
      note: 'Refuted 2023 — C-peptide and antibody testing indicated type 1.',
    },
    {
      id: 'A-3',
      date: '2023-06-14',
      text: 'Type 1 diabetes mellitus',
      verificationStatus: 'confirmed',
      changeType: 'revision',
      supersedes: 'A-2',
      coding: [
        { system: 'ICD-10-CM', code: 'E10.9' },
        {
          system: 'SNOMED',
          code: '46635009',
          display: 'Type 1 diabetes mellitus',
        },
      ],
    },
    {
      id: 'A-4',
      date: '2025-02-20',
      text: 'Type 1 diabetes mellitus with neuropathy',
      verificationStatus: 'confirmed',
      changeType: 'progression',
      supersedes: 'A-3',
      coding: [
        { system: 'ICD-10-CM', code: 'E10.42', primary: true },
        { system: 'ICD-11', code: '5A10', mappedFrom: 'SNOMED 46635009' },
        {
          system: 'SNOMED',
          code: '426875007',
          display: 'Diabetes mellitus type 1 with neuropathy',
        },
      ],
    },
  ],
};

const sampleConcerns: ConditionConcern[] = [
  diabetesConcern,
  {
    concernId: 'C-7',
    clinicalStatus: 'active',
    source: 'ehrProblemList',
    assertions: [
      {
        id: 'A-10',
        date: '2021-09-01',
        text: 'Dementia',
        verificationStatus: 'confirmed',
        coding: [{ system: 'ICD-10-CM', code: 'F03.90' }],
      },
      {
        id: 'A-11',
        date: '2024-04-17',
        text: 'Vascular dementia',
        verificationStatus: 'confirmed',
        changeType: 'refinement',
        supersedes: 'A-10',
        coding: [
          { system: 'ICD-10-CM', code: 'F01.50', primary: true },
          { system: 'SNOMED', code: '429998004', display: 'Vascular dementia' },
        ],
      },
    ],
    relationships: [
      {
        type: 'caused-by',
        concernId: 'C-8',
        display: 'Cerebrovascular disease',
      },
    ],
  },
  {
    concernId: 'C-8',
    clinicalStatus: 'active',
    source: 'manuallyAdded',
    assertions: [
      {
        id: 'A-12',
        date: '2024-04-17',
        text: 'Cerebrovascular disease',
        verificationStatus: 'confirmed',
        coding: [
          { system: 'ICD-10-CM', code: 'I67.9', primary: true },
          { system: 'SNOMED', code: '62914000' },
        ],
      },
    ],
  },
  {
    concernId: 'C-15',
    clinicalStatus: 'active',
    source: 'patientReported',
    assertions: [
      {
        id: 'A-20',
        date: '2026-06-30',
        text: 'something with her thyroid',
        verificationStatus: 'unconfirmed',
        uncertainty: {
          overall: 'low',
          fields: {
            coding: { known: false, reason: 'asked-unknown' },
            onset: {
              known: true,
              confidence: 'low',
              note: 'patient thinks a few years ago',
            },
          },
        },
      },
    ],
  },
  {
    concernId: 'C-3',
    clinicalStatus: 'resolved',
    source: 'ehrProblemList',
    assertions: [
      {
        id: 'A-30',
        date: '2018-11-02',
        text: 'Acute sinusitis',
        verificationStatus: 'confirmed',
        coding: [{ system: 'ICD-10-CM', code: 'J01.90', primary: true }],
      },
    ],
  },
];

function InteractiveTemplate() {
  const [concerns, setConcerns] = useState<ConditionConcern[]>(sampleConcerns);
  const [editor, setEditor] = useState<{
    mode: ConditionEditorMode;
    concern?: ConditionConcern;
  } | null>(null);

  const handleAction = (
    concern: ConditionConcern,
    action: ProblemListAction
  ) => {
    if (
      action === 'refine' ||
      action === 'revise' ||
      action === 'relate' ||
      action === 'observe'
    ) {
      setEditor({ mode: action, concern });
    } else if (action === 'resolve') {
      setConcerns((prev) =>
        prev.map((c) =>
          c.concernId === concern.concernId
            ? { ...c, clinicalStatus: 'resolved' }
            : c
        )
      );
    }
  };

  const handleSave = (draft: ConditionAssertionDraft) => {
    const target = editor?.concern;
    const newAssertion: ConditionAssertion = {
      ...draft,
      id: `A-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };
    if (!target) {
      // add — new concern with first assertion
      setConcerns((prev) => [
        ...prev,
        {
          concernId: `C-new-${Date.now()}`,
          clinicalStatus: 'active',
          source: 'manuallyAdded',
          assertions: [newAssertion],
        },
      ]);
      return;
    }
    setConcerns((prev) =>
      prev.map((c) => {
        if (c.concernId !== target.concernId) return c;
        const assertions =
          draft.changeType === 'revision'
            ? c.assertions.map((a) =>
                a.id === draft.supersedes
                  ? { ...a, verificationStatus: 'refuted' as const }
                  : a
              )
            : c.assertions;
        return { ...c, assertions: [...assertions, newAssertion] };
      })
    );
  };

  const handleRelate = (rel: { type: string; concernId: string }) => {
    const target = editor?.concern;
    if (!target) return;
    setConcerns((prev) =>
      prev.map((c) =>
        c.concernId === target.concernId
          ? {
              ...c,
              relationships: [
                ...(c.relationships ?? []),
                rel as NonNullable<ConditionConcern['relationships']>[number],
              ],
            }
          : c
      )
    );
  };

  const handleAddObservation = (text: string) => {
    const target = editor?.concern;
    if (!target) return;
    setConcerns((prev) =>
      prev.map((c) =>
        c.concernId === target.concernId
          ? {
              ...c,
              observations: [
                ...(c.observations ?? []),
                {
                  id: `O-${Date.now()}`,
                  date: new Date().toISOString().slice(0, 10),
                  text,
                },
              ],
            }
          : c
      )
    );
  };

  const handleReorder = (ids: string[]) => {
    setConcerns((prev) =>
      [...prev].sort(
        (a, b) => ids.indexOf(a.concernId) - ids.indexOf(b.concernId)
      )
    );
    // In an app: persist `ids` on the patient/encounter object so the
    // ordering survives across sessions.
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <ProblemList
        concerns={concerns}
        onAction={handleAction}
        onAddProblem={(text) =>
          handleSave({ text, verificationStatus: 'unconfirmed' })
        }
        onReorder={handleReorder}
      />
      <ConditionEditor
        mode={editor?.mode ?? 'refine'}
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        concern={editor?.concern}
        relatableConcerns={concerns}
        onSave={handleSave}
        onRelate={handleRelate}
        onAddObservation={handleAddObservation}
      />
    </div>
  );
}

/**
 * Interactive problem list wired to the ConditionEditor. Expand the diabetes
 * row to see the concern-evolution timeline: prediabetes → T2DM (refuted) →
 * T1DM → T1DM with neuropathy. Hover a row for refine / revise / relate /
 * move actions (Alt+↑/↓ also reorders; ↑/↓ moves focus between rows; ←/→
 * moves within a toolbar). Reordering reports the full id order via
 * `onReorder` for the consumer to persist.
 */
export const Interactive: Story = {
  render: () => <InteractiveTemplate />,
};

/** Display-only rendering with no action affordances. */
export const ReadOnly: Story = {
  args: {
    concerns: sampleConcerns,
    readOnly: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <ProblemList {...args} />
    </div>
  ),
};

function EmptyTemplate() {
  const [concerns, setConcerns] = useState<ConditionConcern[]>([]);
  return (
    <div className="mx-auto max-w-3xl">
      <ProblemList
        concerns={concerns}
        onAddProblem={(text) =>
          setConcerns((prev) => [
            ...prev,
            {
              concernId: `C-${prev.length + 1}`,
              clinicalStatus: 'active',
              assertions: [
                {
                  id: `A-${prev.length + 1}`,
                  date: new Date().toISOString().slice(0, 10),
                  text,
                  verificationStatus: 'unconfirmed',
                },
              ],
            },
          ])
        }
      />
    </div>
  );
}

/** Empty state with capture-first add. */
export const Empty: Story = {
  render: () => <EmptyTemplate />,
};
