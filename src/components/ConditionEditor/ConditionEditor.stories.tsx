import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button';
import {
  ConditionEditor,
  type ConditionAssertionDraft,
  type ConditionEditorMode,
} from './ConditionEditor';
import type { ConditionConcern } from '../ProblemList';

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
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConditionEditor>;

const diabetes: ConditionConcern = {
  concernId: 'C-42',
  clinicalStatus: 'active',
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
      coding: [
        { system: 'ICD-10-CM', code: 'E10.9', primary: true },
        { system: 'SNOMED', code: '46635009' },
      ],
    },
  ],
};

const others: ConditionConcern[] = [
  diabetes,
  {
    concernId: 'C-8',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-12',
        date: '2024-04-17',
        text: 'Cerebrovascular disease',
        verificationStatus: 'confirmed',
      },
    ],
  },
];

function Template({ mode }: { mode: ConditionEditorMode }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string>('');
  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen(true)}>Open {mode} editor</Button>
      <ConditionEditor
        mode={mode}
        open={open}
        onOpenChange={setOpen}
        concern={mode === 'add' ? undefined : diabetes}
        relatableConcerns={others}
        onSave={(draft: ConditionAssertionDraft) =>
          setResult(JSON.stringify(draft, null, 2))
        }
        onRelate={(rel) => setResult(JSON.stringify(rel, null, 2))}
        onAddObservation={(text) => setResult(`observation: ${text}`)}
      />
      {result && (
        <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
          {result}
        </pre>
      )}
    </div>
  );
}

/** New concern — capture-first, name only required. */
export const Add: Story = { render: () => <Template mode="add" /> };

/** Quick progress note with the full observation history over time. */
export const Observe: Story = { render: () => <Template mode="observe" /> };

/** Refinement of T1DM — includes the "disease progressed" checkbox. */
export const Refine: Story = { render: () => <Template mode="refine" /> };

/** Revision — warns that the prior assertion will be refuted. */
export const Revise: Story = { render: () => <Template mode="revise" /> };

/** Relate to another concern (caused-by, evolved-from, …). */
export const Relate: Story = { render: () => <Template mode="relate" /> };
