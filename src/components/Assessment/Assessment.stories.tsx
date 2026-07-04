import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Assessment,
  type AssessmentItem,
  type AssessmentOrder,
} from './Assessment';
import { CodeLookup, type CodifyDomain } from '../CodeLookup';
import {
  ConditionEditor,
  type ConditionAssertionDraft,
} from '../ConditionEditor';
import type { ConditionAssertion, ConditionConcern } from '../ProblemList';

const meta: Meta<typeof Assessment> = {
  title: 'Healthcare/Assessment',
  component: Assessment,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Visit-specific **Assessment & Plan**.

- One block per assessed problem showing today's assertion (name, verification status, coding chips).
- With the plan enabled, orders linked to the problem — via \`concernId\`, the durable IndicationLink that survives recoding — render **indented under the problem**.
- Orders without a problem link collect in an **unlinked bucket** with one-click link chips.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Assessment>;

const concerns: ConditionConcern[] = [
  {
    concernId: 'C-42',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-4',
        date: '2026-07-03',
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
    concernId: 'C-11',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-15',
        date: '2026-07-03',
        text: 'Essential hypertension',
        verificationStatus: 'confirmed',
        coding: [{ system: 'ICD-10-CM', code: 'I10', primary: true }],
      },
    ],
  },
  {
    concernId: 'C-15',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'A-20',
        date: '2026-07-03',
        text: 'Hypothyroidism, suspected',
        verificationStatus: 'provisional',
        coding: [{ system: 'ICD-10-CM', code: 'E03.9' }],
      },
    ],
  },
];

const sampleItems: AssessmentItem[] = [
  {
    concernId: 'C-42',
    assertionId: 'A-4',
    note: 'A1c 7.2, improved from 7.9. Neuropathic pain controlled. Continue current regimen.',
  },
  {
    concernId: 'C-11',
    assertionId: 'A-15',
    note: 'BP 132/84 today. Continue lisinopril.',
  },
  {
    concernId: 'C-15',
    assertionId: 'A-20',
    note: 'Fatigue and cold intolerance. Check TSH.',
  },
];

const sampleOrders: AssessmentOrder[] = [
  {
    orderId: 'O-1',
    type: 'medication',
    display: 'insulin glargine 20 units subcutaneous qhs',
    concernId: 'C-42',
  },
  {
    orderId: 'O-2',
    type: 'medication',
    display: 'gabapentin 300 mg capsule',
    detail: '1 capsule po tid',
    concernId: 'C-42',
  },
  {
    orderId: 'O-3',
    type: 'lab',
    display: 'Hemoglobin A1c',
    detail: 'in 3 months',
    concernId: 'C-42',
  },
  {
    orderId: 'O-4',
    type: 'referral',
    display: 'Podiatry — diabetic foot exam',
    concernId: 'C-42',
  },
  {
    orderId: 'O-5',
    type: 'medication',
    display: 'lisinopril 10 mg tablet',
    detail: '1 tablet po daily',
    concernId: 'C-11',
  },
  {
    orderId: 'O-6',
    type: 'lab',
    display: 'TSH with reflex to free T4',
  },
  {
    orderId: 'O-7',
    type: 'imaging',
    display: 'Chest X-ray, 2 views',
  },
];

function InteractiveTemplate({
  billableOnly = false,
}: {
  billableOnly?: boolean;
}) {
  const [concernList, setConcernList] = useState<ConditionConcern[]>(concerns);
  const [items, setItems] = useState<AssessmentItem[]>(sampleItems);
  const [orders, setOrders] = useState<AssessmentOrder[]>(sampleOrders);
  const [showPlan, setShowPlan] = useState(true);
  const [editor, setEditor] = useState<{
    mode: 'refine' | 'revise';
    concern: ConditionConcern;
  } | null>(null);

  const codetypeToSystem: Record<string, string> = {
    ICD10: 'ICD-10-CM',
    'SNOMED US': 'SNOMED',
  };

  /** Refine/revise: append the new assertion and point the visit item at it. */
  const handleEditorSave = (draft: ConditionAssertionDraft) => {
    const target = editor?.concern;
    if (!target) return;
    const newAssertion: ConditionAssertion = {
      ...draft,
      id: `A-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setConcernList((prev) =>
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
    setItems((prev) =>
      prev.map((i) =>
        i.concernId === target.concernId
          ? { ...i, assertionId: newAssertion.id }
          : i
      )
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Assessment
        concerns={concernList}
        items={items}
        orders={orders}
        billableOnly={billableOnly}
        showPlan={showPlan}
        onShowPlanChange={setShowPlan}
        onAddAssessment={(pick) => {
          const concernId = `C-${Date.now()}`;
          const assertionId = `A-${Date.now()}`;
          setConcernList((prev) => [
            ...prev,
            {
              concernId,
              clinicalStatus: 'active',
              assertions: [
                {
                  id: assertionId,
                  date: new Date().toISOString().slice(0, 10),
                  text: pick.label,
                  // free text arrives uncoded and unconfirmed
                  verificationStatus: pick.code ? 'confirmed' : 'unconfirmed',
                  coding: pick.code
                    ? [
                        {
                          system:
                            codetypeToSystem[pick.code.codetype] ??
                            pick.code.codetype,
                          code: pick.code.fullcode,
                          primary: true,
                        },
                      ]
                    : [],
                },
              ],
            },
          ]);
          setItems((prev) => [...prev, { concernId, assertionId }]);
        }}
        onReorderItems={(ids) =>
          setItems((prev) =>
            [...prev].sort(
              (a, b) => ids.indexOf(a.concernId) - ids.indexOf(b.concernId)
            )
          )
        }
        onReorderOrders={(ids) =>
          setOrders((prev) =>
            [...prev].sort(
              (a, b) => ids.indexOf(a.orderId) - ids.indexOf(b.orderId)
            )
          )
        }
        onAddOrder={(item, order) =>
          setOrders((prev) => [
            ...prev,
            {
              orderId: `O-${Date.now()}`,
              type: order.type,
              display: order.display,
              detail: order.code
                ? `${order.code.codetype} ${order.code.fullcode}`
                : undefined,
              code: order.code,
              concernId: item?.concernId, // null item = unlinked order
            },
          ])
        }
        renderOrderSearch={({
          domains,
          preferDomains,
          preferCodetypes,
          billableOnly,
          placeholder,
          onPick,
          onFreeText,
        }) => (
          <CodeLookup
            indexUrl="/codify"
            searchDomains={domains as CodifyDomain[] | undefined}
            preferDomains={preferDomains as CodifyDomain[] | undefined}
            preferCodetypes={preferCodetypes}
            billableOnly={billableOnly}
            onSelect={onPick}
            onFreeText={onFreeText}
            limit={10}
            placeholder={placeholder}
            bare
          />
        )}
        onLinkOrder={(order, concernId) =>
          setOrders((prev) =>
            prev.map((o) =>
              o.orderId === order.orderId ? { ...o, concernId } : o
            )
          )
        }
        onAction={(item, action) => {
          if (action === 'refine' || action === 'revise') {
            const concern = concernList.find(
              (c) => c.concernId === item.concernId
            );
            if (concern) setEditor({ mode: action, concern });
          }
        }}
      />
      <ConditionEditor
        mode={editor?.mode ?? 'refine'}
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        concern={editor?.concern}
        onSave={handleEditorSave}
      />
    </div>
  );
}

/**
 * Assessment & Plan with orders nested under each problem via the durable
 * concern link. Hover a problem and use the **+** action to add an order
 * inline. Drag a problem block to re-sequence the assessment; drag an order
 * to reorder it within its plan — or drop it onto another problem (or between
 * its orders) to move it there. The TSH and chest X-ray orders arrive
 * unlinked — drag them onto a problem or use the chips in the amber bucket.
 */
export const Interactive: Story = {
  render: () => <InteractiveTemplate />,
};

/** Interactive with `billableOnly`: concern searches return only billable
 * (leaf) ICD-10 codes — category roots (E11) and SNOMED synonyms are dropped.
 * Try "diabetes" and compare with the plain Interactive story. */
export const BillableOnly: Story = {
  render: () => <InteractiveTemplate billableOnly />,
};

/** Assessment only — plan hidden. */
export const AssessmentOnly: Story = {
  args: {
    concerns,
    items: sampleItems,
    orders: sampleOrders,
    showPlan: false,
    readOnly: true,
    title: 'Assessment',
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <Assessment {...args} />
    </div>
  ),
};

/** Display-only A&P, e.g. for a signed note. */
export const ReadOnly: Story = {
  args: {
    concerns,
    items: sampleItems,
    orders: sampleOrders.filter((o) => o.concernId),
    readOnly: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <Assessment {...args} />
    </div>
  ),
};
