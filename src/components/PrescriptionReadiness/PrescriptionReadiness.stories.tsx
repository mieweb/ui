import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PrescriptionIssueSummary } from './PrescriptionReadiness';
import {
  completeUiPrescription,
  prescribingUiConfiguration,
  simulatedWorkflow,
  uiReadiness,
} from './storyData';
import { Assessment, type AssessmentOrder } from '../Assessment';
import { OrderEditor } from '../OrderEditor';
import { CodeLookup } from '../CodeLookup';
import { currentAssertion } from '../ProblemList';
import { createFakeEhrService } from '../../demo/prescribing/createFakeEhrService';
import { createFakeFetch } from '../../demo/prescribing/createFakeFetch';
import { makeProducts } from '../../demo/prescribing/fixtures';
import { createHttpClient } from '../../prescribing/api/createHttpClient';
import {
  PrescribingMedicationLookup,
  prescribingCodifyIndexUrl,
  prescribingIndicationConcerns,
} from '../../demo/prescribing/PrescribingMedicationLookup';
import type { MedicationLookupProps } from '../MedicationList';

const meta: Meta<typeof PrescriptionIssueSummary> = {
  id: 'encounter-orders-prescriptionreadiness',
  title: 'Healthcare/Encounter & orders/PrescriptionReadiness',
  component: PrescriptionIssueSummary,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:beta'],
  parameters: {
    layout: 'padded',
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'encounter-orders-assessment',
          why: 'Assessment renders the same readiness projection for linked and unlinked medication orders.',
        },
        {
          type: 'uses',
          target: 'clinical-lists-medicationlist',
          why: 'Opt-in prescription intent uses shared issue presentation while history retains reconciliation.',
        },
        {
          type: 'uses',
          target: 'clinical-lists-codelookup',
          why: 'Medication and indication use Codify-backed med and condition searches; concern selection preserves chart identity.',
        },
      ],
    },
    docs: {
      description: {
        component: `### What it's for

PrescriptionReadinessBadge and PrescriptionIssueSummary show missing details, invalid values, external blockers, and host-confirmed workflow states. They consume the same revision-specific result as the editor and host queues.

### Use it when

An active prescription can be saved as a draft but needs completion before review or transmission. Supply expectedOrderId and expectedOrderRevision so stale or unrelated evaluations cannot appear ready.

### Don't use it when

A presenting-medication history row has no prescribing intent; use MedicationList's reconciliation presentation. The badge does not perform clinical checks or send a prescription.

### Example

Pass readinessByOrderId and onCompletePrescription to Assessment, or compose PrescriptionIssueSummary in an OrderList renderOrder slot. Supply prescribing configuration to run validatePrescription locally. A TypeScript EHR imports that same validator from @mieweb/ui/prescribing and reconstructs trusted context before enforcing actions.

### Limitations

The host owns persistence, identity, revisions, context freshness, clinical providers, review, signing, and transmission. Simulated server results always display Simulation. Details complete alone never means ready to send. Inline disclosure uses native details/summary. Floating summaries start collapsed, keep status and issue count visible, and cap their complete panel at 20% of dynamic viewport height with independently scrolling reasons. Container placement keeps the same summary outside a dialog's scrolling body. Toggle buttons expose aria-expanded/controls and status updates announce politely. Labels are customizable and semantic theme tokens support dark mode.`,
      },
    },
  },
  args: {
    expectedOrderId: 'rx-ui-1',
    expectedOrderRevision: '1',
    medicationName: 'Lasix',
  },
  argTypes: {
    readiness: { description: 'Shared validation and host workflow envelope.' },
    expectedOrderId: { description: 'Stable instance identity.' },
    expectedOrderRevision: { description: 'Current content revision.' },
    readOnly: { description: 'Show reasons without mutation controls.' },
    labels: { description: 'Localizable status and action copy.' },
    presentation: {
      description:
        'Inline by default; floating starts collapsed and caps the entire panel at 20dvh.',
      control: 'select',
      options: ['inline', 'floating'],
    },
    floatingPlacement: {
      description:
        'Viewport anchors to logical inline-end/bottom; container mounts outside a dialog scroll body.',
      control: 'select',
      options: ['viewport', 'container'],
    },
    onCompletePrescription: {
      description:
        'Open the full editor for this instance and first editable issue.',
    },
    onIssueAction: {
      description: 'Navigate to the field or external host remediation.',
    },
  },
};
export default meta;
type Story = StoryObj<typeof PrescriptionIssueSummary>;
export const BareLasix: Story = {
  args: { readiness: uiReadiness({ name: 'Lasix' }) },
};
export const Partial: Story = {
  args: {
    readiness: uiReadiness({
      name: 'SimDrug A',
      strength: '5 mg',
      doseForm: 'tablet',
    }),
  },
};
export const Invalid: Story = {
  args: {
    medicationName: 'SimDrug A',
    readiness: uiReadiness({ ...completeUiPrescription, quantity: '-1' }),
  },
};
export const Unknown: Story = { args: { readiness: undefined } };
export const DetailsComplete: Story = {
  args: {
    medicationName: 'SimDrug A',
    readiness: uiReadiness(completeUiPrescription),
  },
};
export const Blocked: Story = {
  args: {
    medicationName: 'SimDrug A',
    readiness: uiReadiness(completeUiPrescription, {
      ...prescribingUiConfiguration,
      input: {
        ...prescribingUiConfiguration.input,
        context: {
          ...prescribingUiConfiguration.input.context,
          prescriber: {
            state: 'known',
            value: {
              id: 'prescriber-demo',
              name: 'Demo Prescriber',
              address: 'Simulation address',
              authorized: false,
              networkEnrolled: false,
            },
            observedAt: '2026-10-03T12:00:00.000Z',
            sourceId: 'simulation',
          },
        },
      },
    }),
  },
};
export const ReadOnly: Story = {
  args: { readOnly: true, readiness: uiReadiness({ name: 'Lasix' }) },
};
export const ReadyForReview: Story = {
  args: {
    medicationName: 'SimDrug A',
    readiness: simulatedWorkflow({
      review: 'pass',
      sign: 'pass',
      transmit: 'unknown',
    }),
  },
};
export const ReadyToSend: Story = {
  args: {
    medicationName: 'SimDrug A',
    readiness: simulatedWorkflow({
      review: 'pass',
      sign: 'pass',
      transmit: 'pass',
    }),
  },
};
export const Mobile: Story = {
  args: { ...BareLasix.args },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
export const Floating: Story = {
  args: {
    readiness: uiReadiness({ name: 'Lasix' }),
    presentation: 'floating',
  },
  render: (args) => (
    <div className="min-h-[150dvh] space-y-4">
      <h2 className="text-lg font-semibold">Prescription workspace</h2>
      <p className="text-muted-foreground max-w-lg text-sm">
        Scroll this workspace. The compact status stays visible; expand it to
        review the reasons within a panel capped at 20% of the viewport height.
      </p>
      <PrescriptionIssueSummary {...args} />
    </div>
  ),
};
export const FloatingContained: Story = {
  args: {
    ...Floating.args,
    floatingPlacement: 'container',
  },
  render: (args) => (
    <div className="border-border flex h-[70dvh] max-w-2xl flex-col overflow-hidden rounded-lg border">
      <h2 className="shrink-0 p-4 text-lg font-semibold">
        Prescription editor layout
      </h2>
      <PrescriptionIssueSummary {...args} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="min-h-[100dvh]">
          <p className="text-muted-foreground text-sm">
            This scrolling body leaves the summary and footer visible. The
            prescription editor also displays each issue next to its field.
          </p>
        </div>
      </div>
      <div className="border-border shrink-0 border-t p-4 text-sm">
        Editor actions remain available here.
      </div>
    </div>
  ),
};
function DraftCompletion() {
  const [concerns, setConcerns] = useState(prescribingIndicationConcerns);
  const [lookup] = useState(() => {
    const service = createFakeEhrService({ scenarioId: 'lasix-draft' });
    const client = createHttpClient({ fetch: createFakeFetch(service) });
    return function Lookup(props: MedicationLookupProps) {
      return (
        <PrescribingMedicationLookup
          {...props}
          client={client}
          now={() => service.clock.now()}
        />
      );
    };
  });
  const [order, setOrder] = useState<AssessmentOrder>({
    orderId: 'rx-ui-1',
    type: 'medication',
    display: 'Lasix',
    prescriptionRevision: '1',
    prescribingIntent: 'prescribe',
  });
  const [editing, setEditing] = useState(false);
  const [field, setField] = useState<string>();
  const [saved, setSaved] = useState('');
  const linkedConcern = concerns.find(
    (concern) => concern.concernId === order.concernId
  );
  const linkedAssertion = linkedConcern
    ? currentAssertion(linkedConcern)
    : undefined;
  const catalogProduct = makeProducts(
    prescribingUiConfiguration.input.evaluatedAt
  ).find((product) => product.id === order.prescription?.productId);
  const configuration = {
    ...prescribingUiConfiguration,
    input: {
      ...prescribingUiConfiguration.input,
      orderRevision: order.prescriptionRevision!,
      context: {
        ...prescribingUiConfiguration.input.context,
        ...(catalogProduct && {
          product: {
            state: 'known' as const,
            value: {
              id: catalogProduct.id,
              coding: catalogProduct.coding,
              conceptSpecificity: catalogProduct.specificity,
              strength: catalogProduct.strength,
              doseForm: catalogProduct.form,
              quantityUnits: catalogProduct.quantityUnits,
            },
            observedAt: prescribingUiConfiguration.input.evaluatedAt,
            sourceId: 'urn:mieweb:simulation:catalog',
          },
          controlledSchedule: catalogProduct.controlledSchedule,
        }),
      },
    },
  };
  return (
    <div className="space-y-4">
      <Assessment
        concerns={concerns}
        items={
          linkedConcern && linkedAssertion
            ? [
                {
                  concernId: linkedConcern.concernId,
                  assertionId: linkedAssertion.id,
                },
              ]
            : []
        }
        orders={[order]}
        renderOrderSearch={false}
        prescribing={() => configuration}
        onEditOrderStart={() => {
          setEditing(true);
          return true;
        }}
        onCompletePrescription={(_, issue) => {
          setField(issue?.fieldPath);
          setEditing(true);
        }}
      />
      <p
        role="status"
        aria-live="polite"
        className="text-muted-foreground text-sm"
      >
        {saved}
      </p>
      {editing && (
        <OrderEditor
          key={order.prescriptionRevision}
          open
          order={order}
          codeLookup={{
            component: lookup,
            indexUrl: prescribingCodifyIndexUrl,
          }}
          indicationCodeLookup={{
            component: CodeLookup,
            indexUrl: prescribingCodifyIndexUrl,
          }}
          indicationConcerns={concerns}
          prescribing={configuration}
          initialIssueField={field}
          onClose={() => setEditing(false)}
          onSave={(next) => {
            if (next.prescription?.indication && !next.concernId) {
              const concernId = `demo-concern-${concerns.length + 1}`;
              setConcerns((previous) => [
                ...previous,
                {
                  concernId,
                  clinicalStatus: 'active',
                  source: 'manuallyAdded',
                  assertions: [
                    {
                      id: `${concernId}-assertion-1`,
                      date: '2026-10-03',
                      text: next.prescription!.indication!,
                      coding: next.prescription!.indicationCode
                        ? [next.prescription!.indicationCode]
                        : undefined,
                      verificationStatus: 'unconfirmed',
                    },
                  ],
                },
              ]);
              next = {
                ...next,
                concernId,
                prescription: { ...next.prescription, concernId },
              };
            }
            setOrder({
              ...next,
              prescriptionRevision: String(
                Number(order.prescriptionRevision) + 1
              ),
            });
            setSaved(
              'Saved as draft. Prescription readiness has been refreshed.'
            );
          }}
        />
      )}
    </div>
  );
}
export const Interactive: Story = { render: () => <DraftCompletion /> };
