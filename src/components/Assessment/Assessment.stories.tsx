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
import { OrderEditor } from '../OrderEditor';
import type { ConditionAssertion, ConditionConcern } from '../ProblemList';

const meta: Meta<typeof Assessment> = {
  id: 'encounter-orders-assessment',
  title: 'Healthcare/Encounter & orders/Assessment',
  component: Assessment,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The visit's **Assessment & Plan**: an ordered list (\`items: AssessmentItem[]\` — \`{ concernId, assertionId, note? }\`) of the problems assessed today, each block showing that day's assertion (name, non-confirmed verification badge, \`CodingChips\`) and, with \`showPlan\`, the **orders nested under it**. Orders (\`AssessmentOrder\` — \`type: medication | lab | imaging | procedure | referral\`, \`display\`, \`detail\`, \`code?\`, \`priority\`, \`timing\`, \`indication\`, \`notes\`, \`bodySite\`, \`referTo\`) link to a problem through \`concernId\`, the **durable IndicationLink** that survives recoding; orders without one collect in an amber **unlinked bucket** with one-click link chips, and dragging an order onto another problem re-links it (\`onLinkOrder\`). A **unified add row** (\`renderOrderSearch\`) adds a concern or an order from one coded search: in \`auto\` mode the pick's coding system decides (\`isConditionCodetype\` → \`onAddAssessment\`, otherwise \`orderTypeForCodetype\` → \`onAddOrder\`), free text asks which; \`defaultAddMode\` and \`billableOnly\` tune it. Per-problem **+** opens an inline add-order form filtered by order type. Everything is controlled: \`concerns\` (the \`ConditionConcern[]\` the items point into), \`items\`, \`orders\` in; \`onAction(item, 'refine' | 'revise' | 'add-order')\`, \`onAddOrder\`, \`onAddAssessment\`, \`onLinkOrder\`, \`onEditOrderStart\` / \`onEditOrder\`, \`onRemoveOrder\`, \`onReorderItems\`, \`onReorderOrders\`, \`onShowPlanChange\` out. Exported alongside: \`ORDER_TYPE_META\`, \`ORDER_TYPE_SEARCH_DOMAINS\`, \`orderTypeForCodetype\`, \`isConditionCodetype\`.

### Use it when

- You are building the **encounter note's A&P** — what was concluded about each problem today and what was ordered for it — and want orders visibly tied to their indication.
- The host owns the encounter's items and orders and can persist link, order and sequence changes; the chart concerns come from the same model \`ProblemList\` renders.
- Orders should be **coded** at entry — inject \`CodeLookup\` through \`renderOrderSearch\` (or an ambient \`CodeLookupProvider\`); omit both and the add forms degrade to free text.

### Don't use it when

- You need the **chart** problem list with statuses and assertion history — [ProblemList](?path=/docs/clinical-lists-problemlist--docs).
- You need to record which problems are **relevant** this visit (Addressed / Relevant Hx / Noted) rather than assessed with a plan — [PresentingProblems](?path=/docs/clinical-lists-presentingproblems--docs). Typical flow: PresentingProblems at the start of the visit, Assessment at the end.
- You need to **edit** an assertion or an order in full — pair with [ConditionEditor](?path=/docs/clinical-lists-conditioneditor--docs) (\`refine\` / \`revise\`) and [OrderEditor](?path=/docs/encounter-orders-ordereditor--docs) (\`onEditOrderStart\`); Assessment itself only edits an order's \`display\` / \`detail\` inline.
- You want the **due list** that proposes orders from surveillance programs — [HealthSurveillance](?path=/docs/encounter-orders-healthsurveillance--docs); feed its picks in here as orders linked to the program's concern.
- The visit has no orders and no coding — a plain note field is simpler.

### Example

\`\`\`tsx
const [items, setItems] = useState<AssessmentItem[]>(encounter.assessment);
const [orders, setOrders] = useState<AssessmentOrder[]>(encounter.orders);
const [editor, setEditor] = useState<{ mode: 'refine' | 'revise'; concern: ConditionConcern } | null>(null);
const [orderEditing, setOrderEditing] = useState<AssessmentOrder | null>(null);

<Assessment
  concerns={chartConcerns}
  items={items}
  orders={orders}
  onAction={(item, action) => action !== 'add-order' && setEditor({ mode: action, concern: byId(item.concernId) })}
  onAddOrder={(item, order) => setOrders((prev) => [...prev, { orderId: newId(), ...order, concernId: item?.concernId }])} // null item = unlinked
  onAddAssessment={(pick) => { const concern = addConcernFromPick(pick); setItems((prev) => [...prev, { concernId: concern.concernId, assertionId: concern.assertions[0].id }]); }}
  onLinkOrder={(order, concernId) => setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? { ...o, concernId } : o)))}
  onEditOrderStart={(order) => { setOrderEditing(order); return true; }}   // take over with OrderEditor
  onRemoveOrder={(order) => setOrders((prev) => prev.filter((o) => o.orderId !== order.orderId))}
  onReorderItems={(ids) => setItems((prev) => [...prev].sort((a, b) => ids.indexOf(a.concernId) - ids.indexOf(b.concernId)))}
  onReorderOrders={(ids) => setOrders((prev) => [...prev].sort((a, b) => ids.indexOf(a.orderId) - ids.indexOf(b.orderId)))}
  renderOrderSearch={({ domains, preferDomains, preferCodetypes, billableOnly, placeholder, onPick, onFreeText }) => (
    <CodeLookup indexUrl="/codify" bare searchDomains={domains} preferDomains={preferDomains} preferCodetypes={preferCodetypes} billableOnly={billableOnly} placeholder={placeholder} onSelect={onPick} onFreeText={onFreeText} />
  )}
/>
<ConditionEditor mode={editor?.mode ?? 'refine'} open={editor !== null} onOpenChange={(o) => !o && setEditor(null)} concern={editor?.concern} onSave={appendAssertionAndRepointItem} />
{orderEditing && <OrderEditor key={orderEditing.orderId} open order={orderEditing} onClose={() => setOrderEditing(null)} onSave={(saved) => setOrders((prev) => prev.map((o) => (o.orderId === saved.orderId ? saved : o)))} />}
\`\`\`

\`items\` and \`orders\` are encounter state; \`concerns\` is chart state — when a refine / revise lands, append the assertion to the concern **and** repoint the item's \`assertionId\`.

### Limitations

- **Accessibility as implemented.** Problem blocks are an \`<ol>\` of \`<li>\` that are **not** focus stops — reordering a problem block is drag-only, with no keyboard equivalent. Order rows *are* focusable (\`tabIndex={0}\`, \`aria-label\` spelling out the keys): ↑/↓ move between orders in a plan, Alt+↑/↓ reorder, Alt+←/→ move the order to the adjacent problem; a \`Dropdown\` move menu (\`aria-label="Move …"\`) offers the same. Each plan is a \`<ul aria-label="Plan for …">\`; the unlinked bucket is \`aria-label="Orders not linked to a concern"\`; add forms are \`role="form"\` with labelled selects and inputs. Row actions use \`RowActionToolbar\` (hover-revealed on fine pointers, visible on touch, Tab-reachable). Reorders, re-links, edits and removals are announced via \`useLiveAnnouncement\` (\`sr-only\` \`aria-live="polite"\`); adds and link-chip clicks are **not**.
- **Clinical safety.** No duplicate-order detection, no indication-required rule, no interaction / allergy / dose checking, no order-set logic; \`orderTypeForCodetype\` is a heuristic (imaging is never inferred — it is a manual pick) and \`isConditionCodetype\` treats OSHA / FMCSA / NFPA / FAA programs as concerns by design. Free-text picks arrive **uncoded**.
- **Inline order edit** covers only \`display\` and \`detail\`; everything else needs \`onEditOrderStart\` + \`OrderEditor\`.
- **Responsive / RTL.** Blocks \`flex-wrap\`; plan indents (\`ml-2.5 pl-4\`), the unlinked bucket and toolbar overlays are physical — no RTL mirroring. The add row's search needs \`min-w-64\`.
- **Theming / i18n.** Semantic tokens plus hard-coded amber for the unlinked bucket. \`title\` is a prop; "Show plan", "No problems assessed this visit.", "Add (auto) / Add concern / Add order", placeholders and \`ORDER_TYPE_META\` labels are English constants.
- **Dependencies / entry.** \`ProblemList\` (\`CodingChips\`, model types), \`Card\`, \`Badge\`, \`Button\`, \`Tooltip\`, \`Dropdown\`, \`RowActionToolbar\`, \`useDragReorder\`, \`useLiveAnnouncement\`, \`CodeLookupProvider\` context; main \`@mieweb/ui\` entry, no peers. \`CodeLookup\` is not in the package build.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'encounter-orders-ordereditor',
          why: 'onEditOrderStart hands an order to OrderEditor for full editing; the saved AssessmentOrder flows back through orders.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-conditioneditor',
          why: "The refine / revise row actions open ConditionEditor to record today's assertion for the assessed concern.",
        },
        {
          type: 'composes with',
          target: 'encounter-orders-healthsurveillance',
          why: "HealthSurveillance's onOrderMany picks become AssessmentOrders linked to the program's concern in this plan.",
        },
        {
          type: 'alternative to',
          target: 'clinical-lists-presentingproblems',
          why: "PresentingProblems records which chart problems are relevant this visit; Assessment records today's assertion and the orders placed for each.",
        },
        {
          type: 'depends on',
          target: 'clinical-lists-problemlist',
          why: "Items point into ProblemList's ConditionConcern model and reuse its CodingChips and assertion types.",
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
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
    timing: 'in 3 months',
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
    // properly coded (picked from the codify index)
    code: { fullid: 'FDB244899', codetype: 'FDB', fullcode: '244899' },
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
  /** Order being edited in the OrderEditor modal (morphs by order type) */
  const [orderEditing, setOrderEditing] = useState<AssessmentOrder | null>(
    null
  );

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
        onEditOrderStart={(order) => {
          // Every order type edits in the OrderEditor — it morphs into the
          // MedicationEditor (full NCPDP prescription) for medications and
          // into the lab/imaging/procedure/referral editors otherwise.
          setOrderEditing(order);
          return true;
        }}
        onEditOrder={(order, changes) =>
          setOrders((prev) =>
            prev.map((o) =>
              o.orderId === order.orderId
                ? { ...o, display: changes.display, detail: changes.detail }
                : o
            )
          )
        }
        onRemoveOrder={(order) =>
          setOrders((prev) => prev.filter((o) => o.orderId !== order.orderId))
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
      {orderEditing && (
        <OrderEditor
          key={orderEditing.orderId}
          open
          order={orderEditing}
          codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
          onClose={() => setOrderEditing(null)}
          onSave={(saved) =>
            setOrders((prev) =>
              prev.map((o) => (o.orderId === saved.orderId ? saved : o))
            )
          }
        />
      )}
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
