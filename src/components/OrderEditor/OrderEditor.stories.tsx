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
  id: 'encounter-orders-ordereditor',
  title: 'Healthcare/Encounter & orders/OrderEditor',
  component: OrderEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **order editor modal** for an \`AssessmentOrder\` (the order type from [Assessment](?path=/docs/encounter-orders-assessment--docs)). One component that **morphs by \`order.type\`** (or \`defaultType\` in add mode):

| \`order.type\` | Editor | Fields |
|---|---|---|
| \`medication\` | \`MedicationEditor\` from [MedicationList](?path=/docs/clinical-lists-medicationlist--docs) | full NCPDP SCRIPT prescription — mapped through \`orderToMedication\` / \`medicationToOrder\` |
| \`lab\` | \`LabOrderEditor\` | coded search (\`lab\` shard), priority, "When to collect" |
| \`imaging\` | \`ImagingOrderEditor\` | coded search (\`procedure\` shard), body site, priority, "When to perform" |
| \`procedure\` | \`ProcedureOrderEditor\` | coded search (\`procedure\`), body site, priority |
| \`referral\` | \`ReferralEditor\` | coded search (\`procedure\`), refer-to specialty / provider, "When to be seen", notes to consultant |

The four non-medication editors share a scaffold: an **Order** section (coded search or plain \`Input\`, plus the type-specific field), **Scheduling** (\`priority\` radio — routine / urgent / STAT — and free-text \`timing\`), **Details** (\`detail\` instructions, \`indication\`, \`notes\` to performer / consultant). API-compatible with \`MedicationEditor\`: \`open\`, \`order?\`, \`onClose\`, \`onSave(order)\`; \`codeLookup={{ component, indexUrl, locale? }}\` is dependency-injected (defaults to an ambient \`CodeLookupProvider\`, \`false\` forces plain text). The search box is seeded with the order's name, and an **uncoded** order searches immediately so the closest coded matches are offered. The draft is seeded once per mount — give the editor a \`key\` (the order id) so a different target remounts it. The typed editors and the two mapping helpers are exported individually.

### Use it when

- \`Assessment\`'s \`onEditOrderStart\` (or your own order list) needs a full edit surface for an order of any type, and you want one component instead of a switch statement.
- The order should be **coded** (LOINC / Quest / LabCorp for labs, HCPCS / ICD-10-PCS for procedures and imaging, RxNorm / FDB for medications) and you can inject \`CodeLookup\`.
- You know the type up front for add mode — \`defaultType="lab"\` opens the lab editor with an empty draft.

### Don't use it when

- You only need the **inline** display / detail edit that \`Assessment\` already provides via \`onEditOrder\` — skip the modal.
- You are reconciling **presenting medications** (what the patient takes), not prescribing — \`MedicationReconciliation\`; this editor edits an order, and \`orderToMedication\` always seeds \`status: 'unreconciled'\`.
- The order needs fields this scaffold lacks — specimen, ICD indication codes, structured frequency for labs, insurance authorisation — build a domain form; \`timing\` and \`detail\` are free text here.

### Example

\`\`\`tsx
const [orders, setOrders] = useState<AssessmentOrder[]>(encounter.orders);
const [editing, setEditing] = useState<AssessmentOrder | 'new-lab' | null>(null);

{editing && (
  <OrderEditor
    key={typeof editing === 'string' ? editing : editing.orderId} // remount per target — draft seeds once
    open
    order={typeof editing === 'string' ? undefined : editing}
    defaultType="lab"
    codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}   // omit inside a CodeLookupProvider
    onClose={() => setEditing(null)}
    onSave={(saved) =>
      setOrders((prev) => (prev.some((o) => o.orderId === saved.orderId) ? prev.map((o) => (o.orderId === saved.orderId ? saved : o)) : [...prev, saved]))
    }
  />
)}

// inside <Assessment …>: hand every order edit to the modal
onEditOrderStart={(order) => { setEditing(order); return true; }}
\`\`\`

The host owns the orders array; the editor returns the complete \`AssessmentOrder\` (with a generated \`orderId\` in add mode) and never persists.

### Limitations

- **Accessibility as implemented.** Built on \`Modal\` (\`size="lg"\`, focus trap, Esc, \`ModalClose\`); sections are \`<section aria-label>\` ("Order", "Scheduling", "Details"); fields use \`Label htmlFor\`, the priority radio is a labelled \`RadioGroup\`. The first \`<input>\` in the body is focused on open. Coding status ("Coded: FDB 244899" / "Uncoded free text") is a plain \`<p>\`, not a live region; a save closes silently. The Order label's \`htmlFor="ord-search"\` does not target the injected lookup's input (CodeLookup labels itself "Search medical codes").
- **Clinical safety.** No validation beyond a non-empty name: no duplicate-order, indication-required, specimen or authorisation checks, no interaction / allergy / dose checking on medication orders, and \`priority\` / \`timing\` are advisory strings. Coded search is only as complete as the codify shards.
- **Type is fixed per editor** — you cannot change an order from \`lab\` to \`imaging\` inside the dialog; close and reopen with a different \`defaultType\`.
- **Medication path** loses fields \`AssessmentOrder\` has no home for (\`priority\`, \`timing\`, \`bodySite\`, \`referTo\` are preserved from \`base\`, but the NCPDP-only fields — strength, quantity, refills, DAW — exist only inside the editor session and are folded to \`display\` / \`detail\` / \`indication\` / \`notes\` on save).
- **Responsive / RTL.** Single-column stack inside the modal; no breakpoint variants, no RTL handling beyond the inputs.
- **Theming / i18n.** Semantic tokens; all nouns, section headings, placeholders ("Search labs — e.g. a1c"), radio labels and status copy are English constants with no \`labels\` prop.
- **Dependencies / entry.** \`Modal\`, \`Input\`, \`Textarea\`, \`Label\`, \`RadioGroup\`, \`Button\`, \`MedicationList\` (\`MedicationEditor\`, \`parseSig\`, \`labelToMedicationFields\`), \`Assessment\` types; main \`@mieweb/ui\` entry, no peers. \`CodeLookup\` is not in the package build.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'encounter-orders-assessment',
          why: "Assessment's onEditOrderStart hands an order to OrderEditor and receives the saved AssessmentOrder back through orders.",
        },
        {
          type: 'composes with',
          target: 'clinical-lists-medicationlist',
          why: 'For type "medication" the wrapper renders MedicationList\'s MedicationEditor, mapping AssessmentOrder ⇄ Medication.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-codelookup',
          why: 'codeLookup injects CodeLookup so each typed editor searches the lab / procedure / med shards and seeds from the order name.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'Every typed editor is a size="lg" Modal.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
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
