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
import { OrderEditor, type OrderLookupProps } from '../OrderEditor';
import { Input } from '../Input';
import { Button } from '../Button';

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

The host owns persistence, identity, revisions, context freshness, clinical providers, review, signing, and transmission. Simulated server results always display Simulation. Details complete alone never means ready to send. Disclosure uses native details/summary, actions are keyboard accessible, and editor summaries announce changes politely. Labels are customizable and semantic theme tokens support dark mode.`,
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
function SimulationDrugLookup({
  initialQuery,
  onFreeText,
  onSelect,
}: OrderLookupProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  return (
    <div className="space-y-2">
      <Input
        aria-label="Medication"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onFreeText?.(event.target.value);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setQuery('SimDrug A');
          onSelect?.({
            fullid: 'sim-a',
            label: 'SimDrug A',
            codetype: 'urn:mieweb:simulation-drug',
            fullcode: 'sim-a',
            productId: 'sim-a',
            strength: '5 mg',
            doseForm: 'tablet',
            quantityUnit: 'tablet',
            conceptSpecificity: 'product',
            controlledSchedule: 'non-controlled',
            observedAt: '2026-10-03T12:00:00.000Z',
            sourceId: 'synthetic-catalog',
          });
        }}
      >
        Select SimDrug A 5 mg tablet
      </Button>
      <p className="text-muted-foreground text-xs">
        Synthetic catalog for this demonstration.
      </p>
    </div>
  );
}
function DraftCompletion() {
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
  const configuration = {
    ...prescribingUiConfiguration,
    input: {
      ...prescribingUiConfiguration.input,
      orderRevision: order.prescriptionRevision!,
    },
  };
  return (
    <div className="space-y-4">
      <Assessment
        concerns={[]}
        items={[]}
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
            component: SimulationDrugLookup,
            indexUrl: '/simulation-catalog',
          }}
          prescribing={configuration}
          initialIssueField={field}
          onClose={() => setEditing(false)}
          onSave={(next) => {
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
