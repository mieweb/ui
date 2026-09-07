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
  id: 'clinical-lists-presentingproblems',
  title: 'Healthcare/Clinical lists/PresentingProblems',
  component: PresentingProblems,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **encounter-scope problem list** (a.k.a. Medical History): the provider picks which of the patient's chart concerns matter *this visit* and tags each with a \`ProblemRelevance\` — **Addressed / Relevant Hx / Noted**. The tag lives on the encounter reference (\`PresentingEntry { concernId, relevance, comments? }\`), never on the \`ConditionConcern\`, so a specialist's judgment never pollutes the holistic record. Two sections: **Relevant this visit** (\`presenting\` order, drag-reorderable via \`onReorder\`) and **From patient problem list** (the unselected remainder of \`patientConcerns\`). The required \`scope\` — \`'problem-focused'\` or \`'comprehensive'\` — drives a \`role="status"\` banner, marks unselected rows *out of scope* (not absent) in problem-focused visits, and gates the negative assertion: the **No known problems** checkbox (\`noKnownProblems\` / \`onNoKnownProblemsChange\`) is disabled unless the visit is comprehensive. Controlled throughout: \`onRelevanceChange(concern, relevance | null)\`, \`onAddProblem(text)\` for ad-hoc capture, \`readOnly\` to strip controls. \`RELEVANCE_LABELS\` and the \`EncounterScope\` / \`ProblemRelevance\` / \`PresentingEntry\` types are exported.

### Use it when

- You are building the **encounter** and need "which problems are in play today" without editing the chart list itself.
- The host owns both the chart concerns (\`patientConcerns\`, the same \`ConditionConcern[]\` a \`ProblemList\` renders) and the encounter's \`presenting\` references, and can persist relevance changes and order.
- You must record a **negative assertion** correctly — only a comprehensive visit may say "no known problems".

### Don't use it when

- You are showing or maintaining the **chart-scope** list — statuses, assertion history, relationships, resolve — [ProblemList](?path=/docs/clinical-lists-problemlist--docs).
- You need today's **assertion plus plan** (orders under each problem) — [Assessment](?path=/docs/encounter-orders-assessment--docs). PresentingProblems answers *relevance*; Assessment answers *what we concluded and ordered*.
- You need to edit codes, severity or onset — [ConditionEditor](?path=/docs/clinical-lists-conditioneditor--docs) via a ProblemList or Assessment action; this component only adds by name.

### Example

\`\`\`tsx
const [presenting, setPresenting] = useState<PresentingEntry[]>(encounter.presentingProblems);
const [noKnownProblems, setNoKnownProblems] = useState(false);

<PresentingProblems
  patientConcerns={chartConcerns}
  presenting={presenting}
  scope={encounter.type === 'annual' ? 'comprehensive' : 'problem-focused'}
  onRelevanceChange={(concern, relevance) =>
    setPresenting((prev) => {
      const rest = prev.filter((p) => p.concernId !== concern.concernId);
      return relevance ? [...rest, { concernId: concern.concernId, relevance }] : rest;
    })
  }
  onAddProblem={(text) => {
    const concern = addAdHocConcern(text); // host appends an unconfirmed concern to the chart
    setPresenting((prev) => [...prev, { concernId: concern.concernId, relevance: 'addressed' }]);
  }}
  onReorder={(ids) => setPresenting((prev) => [...prev].sort((a, b) => ids.indexOf(a.concernId) - ids.indexOf(b.concernId)))}
  noKnownProblems={noKnownProblems}
  onNoKnownProblemsChange={setNoKnownProblems}
/>
\`\`\`

\`presenting\` and \`noKnownProblems\` belong to the encounter object; \`patientConcerns\` belongs to the chart — persist them separately.

### Limitations

- **Accessibility as implemented.** Each row's relevance control is a \`role="toolbar"\` of \`aria-pressed\` buttons with ←/→ navigation (\`toolbarKeyNav\`); only *selected* rows are focus stops (\`tabIndex={0}\`, ↑/↓ between rows, Alt+↑/↓ to reorder) — rows in the unselected pool are not keyboard-reachable except through their relevance buttons. Reorders are announced via \`useLiveAnnouncement\` into an \`sr-only\` \`aria-live="polite"\` region; relevance changes and adds are **not** announced. The scope banner is \`role="status"\`. Out-of-scope rows are dimmed to \`opacity-80\` plus an "out of scope" badge.
- **Clinical logic is the host's.** The component enforces only the scope gate; it does not merge relevance back into the chart, resolve or reconcile concerns on encounter close, or validate that a comprehensive visit actually reviewed everything.
- **No relevance editing of \`comments\`** — they display if present on the entry but there is no input for them.
- **Responsive / RTL.** Rows \`flex-wrap\` and push the relevance control with \`ml-auto\` (physical); no RTL mirroring.
- **Theming / i18n.** Semantic tokens via \`Card\` / \`Badge\`, plus hard-coded amber / primary banner colours. \`title\` is a prop; relevance labels, scope banner copy, section headings, "No problems selected yet.", the add placeholder and the negative-assertion tooltip are English constants.
- **Dependencies.** \`ProblemList\` (\`CodingChips\`, \`currentAssertion\`), \`Card\`, \`Badge\`, \`Button\`, \`Tooltip\`, \`RowActionToolbar\` (\`toolbarKeyNav\`), \`useDragReorder\`, \`useLiveAnnouncement\`; main \`@mieweb/ui\` entry, no peers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'clinical-lists-problemlist',
          why: 'Renders the chart-scope ConditionConcern[] from ProblemList as its patientConcerns pool and tags encounter relevance on top.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-assessment',
          why: "PresentingProblems records which chart problems are relevant this visit; Assessment records today's assertion and the orders placed for each.",
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
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

function InteractiveTemplate({
  scope: initialScope,
}: {
  scope: EncounterScope;
}) {
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
    setPresenting((prev) => [
      ...prev,
      { concernId: id, relevance: 'addressed' },
    ]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">
          Encounter type:
        </span>
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
      {
        concernId: 'C-11',
        relevance: 'relevant-history',
        comments: 'stable on lisinopril',
      },
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
