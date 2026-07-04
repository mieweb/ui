import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  PresentingProblems,
  type EncounterScope,
  type PresentingEntry,
  type ProblemRelevance,
} from './PresentingProblems';
import type { ConditionConcern } from '../ProblemList';

const meta: Meta<typeof PresentingProblems> = {
  title: 'Healthcare/PresentingProblems',
  component: PresentingProblems,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Encounter-scoped **relevant problem list** (a.k.a. Medical History), fed by the patient-level ProblemList.

- Providers select which patient concerns are relevant this visit and tag each with a relevance (**Addressed / Relevant Hx / Noted**). The tag lives on the encounter *reference*, never on the concern — a specialist's judgment never pollutes the holistic record.
- The **scope banner** distinguishes a *problem-focused* encounter (unselected problems are out of scope, not absent) from a *comprehensive* visit (closing reconciles the full problem list).
- In problem-focused scope the negative assertion ("no known problems") is disabled: absence of mention asserts nothing.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PresentingProblems>;

const patientConcerns: ConditionConcern[] = [
  {
    concernId: 'C-42',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-4',
        date: '2025-02-20',
        text: 'Type 1 diabetes mellitus with neuropathy',
        verificationStatus: 'confirmed',
        coding: [
          { system: 'ICD-10-CM', code: 'E10.42', primary: true },
          { system: 'SNOMED', code: '426875007' },
        ],
      },
    ],
  },
  {
    concernId: 'C-7',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-11',
        date: '2024-04-17',
        text: 'Vascular dementia',
        verificationStatus: 'confirmed',
        coding: [{ system: 'ICD-10-CM', code: 'F01.50', primary: true }],
      },
    ],
  },
  {
    concernId: 'C-9',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-13',
        date: '2022-05-10',
        text: 'Psoriasis',
        verificationStatus: 'confirmed',
        coding: [{ system: 'ICD-10-CM', code: 'L40.9', primary: true }],
      },
    ],
  },
  {
    concernId: 'C-11',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-15',
        date: '2020-08-03',
        text: 'Essential hypertension',
        verificationStatus: 'confirmed',
        coding: [
          { system: 'ICD-10-CM', code: 'I10', primary: true },
          { system: 'SNOMED', code: '59621000' },
        ],
      },
    ],
  },
];

function InteractiveTemplate({ scope: initialScope }: { scope: EncounterScope }) {
  const [scope, setScope] = useState<EncounterScope>(initialScope);
  const [concerns, setConcerns] = useState<ConditionConcern[]>(patientConcerns);
  const [presenting, setPresenting] = useState<PresentingEntry[]>([
    { concernId: 'C-42', relevance: 'addressed' },
    { concernId: 'C-11', relevance: 'relevant-history' },
  ]);
  const [noKnownProblems, setNoKnownProblems] = useState(false);

  const handleRelevance = (
    concern: ConditionConcern,
    relevance: ProblemRelevance | null
  ) => {
    setPresenting((prev) => {
      const rest = prev.filter((p) => p.concernId !== concern.concernId);
      return relevance
        ? [...rest, { concernId: concern.concernId, relevance }]
        : rest;
    });
  };

  const handleAdd = (text: string) => {
    const id = `C-adhoc-${Date.now()}`;
    setConcerns((prev) => [
      ...prev,
      {
        concernId: id,
        clinicalStatus: 'active',
        source: 'manuallyAdded',
        assertions: [
          {
            id: `${id}-a1`,
            date: new Date().toISOString().slice(0, 10),
            text,
            verificationStatus: 'unconfirmed',
          },
        ],
      },
    ]);
    setPresenting((prev) => [...prev, { concernId: id, relevance: 'addressed' }]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">Encounter type:</span>
        {(['problem-focused', 'comprehensive'] as const).map((s) => (
          <label key={s} className="flex items-center gap-1">
            <input
              type="radio"
              checked={scope === s}
              onChange={() => setScope(s)}
              className="accent-primary-600"
            />
            {s}
          </label>
        ))}
      </div>
      <PresentingProblems
        patientConcerns={concerns}
        presenting={presenting}
        scope={scope}
        onRelevanceChange={handleRelevance}
        onAddProblem={handleAdd}
        onReorder={(ids) =>
          setPresenting((prev) =>
            [...prev].sort(
              (a, b) => ids.indexOf(a.concernId) - ids.indexOf(b.concernId)
            )
          )
        }
        noKnownProblems={noKnownProblems}
        onNoKnownProblemsChange={setNoKnownProblems}
      />
    </div>
  );
}

/**
 * A specialist's problem-focused encounter: only the concerns they attend to
 * are selected; the rest remain visibly out of scope. Toggle the encounter
 * type to see the scope banner and negative-assertion gating change.
 */
export const ProblemFocused: Story = {
  render: () => <InteractiveTemplate scope="problem-focused" />,
};

/** A comprehensive visit — full review, negative assertion allowed. */
export const Comprehensive: Story = {
  render: () => <InteractiveTemplate scope="comprehensive" />,
};

/** Display-only rendering. */
export const ReadOnly: Story = {
  args: {
    patientConcerns,
    presenting: [
      { concernId: 'C-42', relevance: 'addressed' },
      { concernId: 'C-11', relevance: 'relevant-history', comments: 'stable on lisinopril' },
    ],
    scope: 'problem-focused',
    readOnly: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <PresentingProblems {...args} />
    </div>
  ),
};
