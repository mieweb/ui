import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { OrderEditor } from './OrderEditor';
import { Button } from '../Button';
import { CodeLookup } from '../CodeLookup';
import {
  ORDER_TYPE_META,
  type AssessmentOrder,
  type OrderType,
} from '../Assessment';

const meta: Meta<typeof OrderEditor> = {
  title: 'Healthcare/OrderEditor',
  component: OrderEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Order editor modal for an \`AssessmentOrder\` that **morphs by order type**:

- \`medication\` → the full **MedicationEditor** (NCPDP SCRIPT prescription fields)
- \`lab\` / \`imaging\` / \`procedure\` / \`referral\` → dedicated editors sharing a
  common scaffold (coded order search, priority, timing, instructions,
  indication, performer notes) plus type-specific fields (body site, refer-to).

Same API as \`MedicationEditor\`: \`open\` / \`onClose\` / \`onSave\`, with
\`CodeLookup\` dependency-injected. Key it by the order id so a different
target remounts the draft.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrderEditor>;

const sampleOrders: AssessmentOrder[] = [
  {
    orderId: 'O-1',
    type: 'medication',
    display: 'lisinopril 10 mg tablet',
    detail: '1 tablet po daily',
    code: { fullid: 'FDB244899', codetype: 'FDB', fullcode: '244899' },
  },
  {
    orderId: 'O-2',
    type: 'lab',
    display: 'Hemoglobin A1c',
    timing: 'in 3 months',
  },
  {
    orderId: 'O-3',
    type: 'imaging',
    display: 'Chest X-ray, 2 views',
    bodySite: 'chest, PA and lateral',
    priority: 'urgent',
  },
  {
    orderId: 'O-4',
    type: 'procedure',
    display: 'Spirometry',
  },
  {
    orderId: 'O-5',
    type: 'referral',
    display: 'Podiatry — diabetic foot exam',
    referTo: 'Podiatry',
  },
];

/**
 * One button per order type — each opens the editor the wrapper morphs into.
 * Saves write back into the list below.
 */
export const Interactive: Story = {
  render: function Render() {
    const [orders, setOrders] = useState(sampleOrders);
    const [editing, setEditing] = useState<AssessmentOrder | null>(null);

    return (
      <div className="max-w-2xl space-y-4">
        <ul className="space-y-1 text-sm">
          {orders.map((o) => (
            <li key={o.orderId} className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">
                {ORDER_TYPE_META[o.type as OrderType].label}
              </span>
              <span className="text-foreground">{o.display}</span>
              {o.detail && (
                <span className="text-muted-foreground text-xs">
                  {o.detail}
                </span>
              )}
              {o.timing && (
                <span className="text-muted-foreground text-xs">
                  {o.timing}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => setEditing(o)}
              >
                Edit
              </Button>
            </li>
          ))}
        </ul>
        {editing && (
          <OrderEditor
            key={editing.orderId}
            open
            order={editing}
            codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
            onClose={() => setEditing(null)}
            onSave={(saved) =>
              setOrders((prev) =>
                prev.map((o) => (o.orderId === saved.orderId ? saved : o))
              )
            }
          />
        )}
      </div>
    );
  },
};
