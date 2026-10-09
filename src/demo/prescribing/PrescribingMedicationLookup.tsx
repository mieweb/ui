import * as React from 'react';
import { CodeLookup } from '../../components/CodeLookup/CodeLookup';
import type { CodifyResult } from '../../components/CodeLookup/engine';
import type {
  MedicationLookupProps,
  MedicationLookupResult,
} from '../../components/MedicationList/MedicationEditor';
import type {
  DrugProduct,
  PrescribingApi,
} from '../../prescribing/api/contracts';
import type { ConditionConcern } from '../../components/ProblemList/ProblemList';

/** Small invented Codify shards for the actual worker-backed lookup in simulator stories. */
export const prescribingCodifyIndexUrl = '/prescribing-codify';
export const prescribingIndicationConcerns: ConditionConcern[] = [
  {
    concernId: 'demo-concern-1',
    clinicalStatus: 'active',
    source: 'ehrProblemList',
    assertions: [
      {
        id: 'demo-assertion-1',
        date: '2026-10-03',
        text: 'Synthetic indication',
        coding: [
          {
            system: 'urn:mieweb:simulation-condition',
            code: 'sim-condition-1',
            display: 'Synthetic indication',
          },
        ],
        verificationStatus: 'confirmed',
      },
    ],
  },
];

/** Only the EHR product response supplies prescription metadata; index labels do not. */
export function resolvedDrugToLookupResult(
  product: DrugProduct,
  selected: Pick<CodifyResult, 'codetype' | 'fullcode'>,
  observedAt: string
): MedicationLookupResult {
  const code = product.coding.find(
    (entry) =>
      entry.system === selected.codetype && entry.code === selected.fullcode
  );
  if (!code)
    throw new Error(
      'The selected code does not match the resolved drug product.'
    );
  return {
    label: product.display,
    codetype: code.system,
    fullcode: code.code,
    codeVersion: code.version,
    productId: product.id,
    strength: product.strength,
    doseForm: product.doseForm,
    quantityUnit: product.quantityUnits[0],
    quantityUnits: product.quantityUnits,
    conceptSpecificity: product.conceptSpecificity,
    controlledSchedule:
      product.controlledSchedule.state === 'known'
        ? product.controlledSchedule.value
        : undefined,
    observedAt,
    sourceId: 'urn:mieweb:simulation:catalog',
  };
}

/** App-owned CodeLookup adapter: resolve a picked code through the fake EHR API. */
export function PrescribingMedicationLookup({
  client,
  now,
  ...props
}: MedicationLookupProps & { client: PrescribingApi; now: () => string }) {
  const [error, setError] = React.useState('');
  const sequence = React.useRef(0);
  const abort = React.useRef<AbortController | null>(null);
  const invalidate = () => {
    abort.current?.abort();
    sequence.current += 1;
    setError('');
  };
  React.useEffect(
    () => () => {
      abort.current?.abort();
      sequence.current += 1;
    },
    []
  );
  return (
    <div className="space-y-2">
      <CodeLookup
        {...props}
        memory={false}
        onQueryChange={(text) => {
          invalidate();
          props.onQueryChange?.(text);
        }}
        onFreeText={(text) => {
          invalidate();
          props.onFreeText?.(text);
        }}
        onSelect={async (result) => {
          invalidate();
          // Clear the previous product while this new selection is being resolved.
          props.onFreeText?.(result.label);
          const controller = new AbortController();
          abort.current = controller;
          const current = sequence.current;
          try {
            const response = await client.getDrug(result.fullcode, {
              signal: controller.signal,
            });
            const resolved = resolvedDrugToLookupResult(
              response.body.data,
              result,
              now()
            );
            if (current === sequence.current && !controller.signal.aborted)
              props.onSelect?.(resolved);
          } catch (failure) {
            if (current === sequence.current && !controller.signal.aborted)
              setError(
                failure instanceof Error
                  ? failure.message
                  : 'Drug product could not be resolved.'
              );
          }
        }}
      />
      {error && (
        <p role="alert" className="text-sm">
          {error} You can save this medication as free text.
        </p>
      )}
    </div>
  );
}
