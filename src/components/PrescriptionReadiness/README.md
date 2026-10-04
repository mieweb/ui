# Prescription readiness integration

Incomplete prescription text is a draft. Save it before requesting review, signing, or sending.
The shared `PrescriptionDetails` payload is canonical; order display strings are projections.

```tsx
import { Assessment, OrderEditor } from '@mieweb/ui';
import { validatePrescription } from '@mieweb/ui/prescribing';

<Assessment
  concerns={concerns}
  items={assessmentItems}
  orders={orders}
  prescribing={(order) => ({
    input: {
      orderId: order.orderId,
      orderRevision: order.prescriptionRevision,
      context: currentContext,
      evaluatedAt: evaluationTime,
    },
    references: { patientId: patient.id, prescriberId: prescriber.id },
    policy,
  })}
  readinessByOrderId={readinessByOrderId}
  onEditOrderStart={(order) => {
    openEditor(order);
    return true;
  }}
  onCompletePrescription={(order, issue) => openEditor(order, issue?.fieldPath)}
  onPrescriptionIssueAction={(order, issue) =>
    navigateToRemediation(order, issue)
  }
/>;
```

Give the editor the current order and configuration, and its `initialIssueField` from the
completion callback. Await persistence in `onSave`; a rejection keeps the dialog and entered
values open. Save draft requires a medication name, even when supplied values are invalid.
A successful host save increments the content revision, refetches readiness, and announces the
result in a polite live region. Keep the modal mounted with a stable key while saving.

The pure `validatePrescription(input, policy)` function runs unchanged in a TypeScript server.
The server chooses its policy and reconstructs facts from its own patient, prescriber, pharmacy,
and provider records. Client results do not authorize actions. The UI only shows authoritative
review/send labels when order identity, content revision, context, policy, and workflow validity
match. An expired projection loses its ready label without waiting for a new network response.
Supply `now` on the badge/summary for an injected simulation clock; otherwise expiry follows the
real UI clock. Aggregate views/editors accept the same clock as `prescriptionNow`. Keep stable `references` even when a demographic/context fact is unavailable.

Generic list and sidebar composition uses existing slots:

```tsx
import { OrderList, OrderSidebar, PrescriptionIssueSummary } from '@mieweb/ui';

const summary = (order) => (
  <PrescriptionIssueSummary
    readiness={readinessByOrderId[order.orderId]}
    expectedOrderId={order.orderId}
    expectedOrderRevision={order.prescriptionRevision}
    expectedContextRevision={currentContext.revision}
    expectedPolicyVersion={policy.version}
    medicationName={order.display}
    onCompletePrescription={(issue) => openEditor(order, issue?.fieldPath)}
    onIssueAction={(issue) => navigateToRemediation(order, issue)}
    readOnly={!canPreparePrescription}
  />
);

<OrderList
  orders={orders}
  activeTab="all"
  tabs={[{ id: 'all', label: 'All orders' }]}
  renderOrder={(order) => <article key={order.orderId}>{order.display}{summary(order)}</article>}
/>
<OrderSidebar open orderId={selected.orderId} serviceName={selected.display}>
  {summary(selected)}
</OrderSidebar>
```

Chart summaries and work queues supply the same projection and stable order link, together with
encounter/concern and assignee details. Filter active prescriptions before counting; cancelled,
discontinued, historical, or transmitted records do not become unfinished drafts when policies
change. Hosts subscribe/refetch after edits and suppress stale late responses by identity/revision.

`ChartOrdersGrid` and `EncounterOrdersGrid` are exported by `@mieweb/ui/datavis`. Their history
adapter needs `orderId`, `prescriptionRevision`, `prescribingIntent: 'prescribe'`, and host
readiness. Coding keys are insufficient for editing an instance. Grid readiness filtering and
completion stay independent from order status, prerequisites, and requisition generation.

`MedicationList`, `MedicationReconciliation`, and the eSheet field show alerts only for
`prescribingIntent: 'prescribe'` rows. Intake, history, and administration defaults retain their
usual presentation. eSheet keeps the existing JSON response `{ medications: Medication[] }`;
pass prescribing callbacks/context explicitly during field registration or directly to the field.

Production clinical checks, PDMP access, coverage, PA, signing, and transmission belong to the
EHR adapters. The simulation demonstrates these contracts with synthetic fixtures and visibly
marks simulated host results. It does not establish clinical suitability or EPCS certification.

Injected medication lookups can return verified `productId`, `strength`, `doseForm`,
`quantityUnit`, `conceptSpecificity`, `controlledSchedule`, `observedAt`, and `sourceId` alongside
`label`, `codetype`, and `fullcode`. These are catalog metadata, separate from label parsing.
Selecting a new product clears dependent code/dose/instructions, then applies verified product
metadata. A plain coded pick without resolved metadata stays unresolved until the EHR adapter
resolves it. Product IDs stay in the payload; the clinical form presents search and selected-product
text rather than asking users to type internal identifiers. The host selects the pharmacy through
its navigation/issue callback and supplies the corresponding context/reference.

Parser contradictions are advisory in the editor: a Sig suggesting a different route/frequency
shows a visible notice, while explicit structured values and complex Sig text remain intact.
Historical delivery receipts remain visible after clinical eligibility expires. Cancelled or
replacement records use the host order lifecycle and a new prescription identity; they do not
become fresh signing/transmission permissions from a previous receipt.
