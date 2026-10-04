import { demoPrescriptionPolicy } from '../../prescribing/policy';
import type {
  PrescriptionDetails,
  PrescriptionReadiness,
  PrescribingConfiguration,
} from '../../prescribing/types';
import { createPrescriptionPreview } from './PrescriptionReadiness';

export const prescribingUiConfiguration: PrescribingConfiguration = {
  input: {
    orderId: 'rx-ui-1',
    orderRevision: '1',
    evaluatedAt: '2026-10-03T12:00:00.000Z',
    context: {
      revision: 'context-1',
      product: {
        state: 'known',
        value: {
          id: 'sim-a',
          coding: [{ system: 'urn:mieweb:simulation-drug', code: 'sim-a' }],
          conceptSpecificity: 'product',
          strength: '5 mg',
          doseForm: 'tablet',
        },
        observedAt: '2026-10-03T12:00:00.000Z',
        sourceId: 'simulation',
      },
      patient: {
        state: 'known',
        value: {
          id: 'patient-demo',
          name: 'Example Patient',
          address: 'Simulation address',
        },
        observedAt: '2026-10-03T12:00:00.000Z',
        sourceId: 'simulation',
      },
      prescriber: {
        state: 'known',
        value: {
          id: 'prescriber-demo',
          name: 'Demo Prescriber',
          address: 'Simulation address',
          authorized: true,
          networkEnrolled: true,
        },
        observedAt: '2026-10-03T12:00:00.000Z',
        sourceId: 'simulation',
      },
      pharmacy: {
        state: 'known',
        value: { id: 'pharmacy-demo', newRx: true, epcs: true },
        observedAt: '2026-10-03T12:00:00.000Z',
        sourceId: 'simulation',
      },
      controlledSchedule: {
        state: 'known',
        value: 'non-controlled',
        observedAt: '2026-10-03T12:00:00.000Z',
        sourceId: 'simulation',
      },
    },
  },
  policy: demoPrescriptionPolicy,
};
export const completeUiPrescription: PrescriptionDetails = {
  name: 'SimDrug A',
  productId: 'sim-a',
  code: { system: 'urn:mieweb:simulation-drug', code: 'sim-a' },
  strength: '5 mg',
  doseForm: 'tablet',
  dose: '5',
  doseUnit: 'mg',
  route: 'oral',
  frequency: 'Once daily',
  sig: 'Take one tablet by mouth daily. Simulation only.',
  quantity: '30',
  quantityUnit: 'tablet',
  refills: '0',
  substitution: '0',
  pharmacyId: 'pharmacy-demo',
};
export function uiReadiness(
  details: PrescriptionDetails,
  configuration = prescribingUiConfiguration
): PrescriptionReadiness {
  return createPrescriptionPreview(details, configuration)!;
}
export function simulatedWorkflow(gates: {
  review: 'pass' | 'fail' | 'unknown';
  sign: 'pass' | 'fail' | 'unknown';
  transmit: 'pass' | 'fail' | 'unknown';
}): PrescriptionReadiness {
  return {
    ...uiReadiness(completeUiPrescription),
    source: 'simulated-server',
    workflow: {
      evaluationId: 'evaluation-demo',
      evaluationRevision: '1',
      inputFingerprint: 'demo-input',
      workflowFingerprint: 'demo-workflow',
      projectedAt: '2026-10-03T12:00:00.000Z',
      expiresAt: null,
      validity: 'current',
      gates,
      issues: [],
    },
    signing: gates.transmit === 'pass' ? 'signed' : 'not-signed',
  };
}
