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
  title: 'Healthcare/ProblemList',
  component: ProblemList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Patient-level problem list built on the **concern / assertion** model.

- Each row is a stable \`ConditionConcern\` — the durable identity that orders and encounters reference.
- The coded characterization evolves through an **assertion history** (refinement / revision / progression); expand a row to see the timeline. Refuted assertions render struck-through.
- Coding chips show ICD-10-CM / ICD-11 / SNOMED codes side by side (the primary coding is filled).
- Capture-first: the add input accepts a bare problem name.
        `,
      },
    },
  },
  tags: ['autodocs'],
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
        { system: 'SNOMED', code: '44054006', display: 'Type 2 diabetes mellitus' },
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
        { system: 'SNOMED', code: '46635009', display: 'Type 1 diabetes mellitus' },
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
      { type: 'caused-by', concernId: 'C-8', display: 'Cerebrovascular disease' },
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

  const handleAction = (concern: ConditionConcern, action: ProblemListAction) => {
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
