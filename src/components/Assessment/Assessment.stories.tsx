import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Assessment,
  type AssessmentItem,
  type AssessmentOrder,
} from './Assessment';
import { CodeLookup, type CodifyDomain } from '../CodeLookup';
import type { ConditionConcern } from '../ProblemList';

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

function InteractiveTemplate() {
  const [items, setItems] = useState<AssessmentItem[]>(sampleItems);
  const [orders, setOrders] = useState<AssessmentOrder[]>(sampleOrders);
  const [showPlan, setShowPlan] = useState(true);

  return (
    <div className="mx-auto max-w-3xl">
      <Assessment
        concerns={concerns}
        items={items}
        orders={orders}
        showPlan={showPlan}
        onShowPlanChange={setShowPlan}
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
              concernId: item.concernId,
            },
          ])
        }
        renderOrderSearch={({ domains, onPick }) => (
          <CodeLookup
            indexUrl="/codify"
            searchDomains={domains as CodifyDomain[] | undefined}
            onSelect={onPick}
            limit={10}
            placeholder='Search orders… (try "lasix", "a1c", "chest x")'
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
        onAction={(item, action) =>
          console.log('assessment action', action, item.concernId)
        }
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
