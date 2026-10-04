import type { ActionStage, PrescriptionDetails } from './types';
export type PrescriptionService =
  | 'validation'
  | 'interactions'
  | 'pregnancy'
  | 'dosing'
  | 'formulary'
  | 'benefit';
export interface PrescriptionPolicy {
  schemaVersion: '1';
  id: string;
  version: string;
  requiredFields: Array<keyof PrescriptionDetails>;
  supportedCodingSystems: string[];
  supportedDoseUnits: string[];
  supportedQuantityUnits: string[];
  requirePatient: boolean;
  requirePrescriber: boolean;
  requirePharmacy: boolean;
  requireClassification: boolean;
  requireResolvedProduct: boolean;
  maxContextAgeMs: number;
  allowCompound: boolean;
  scheduleRefillLimits: Partial<Record<'II' | 'III' | 'IV' | 'V', number>>;
  requiredChecks: Record<ActionStage, PrescriptionService[]>;
  pdmp: {
    requiredForSchedules: string[];
    jurisdictions: string[];
    maxAgeMs: number;
  };
  priorAuthorization: { holdTransmit: boolean };
  holdNonCoveredBenefit: boolean;
  holdReplacementUntilCancellation: boolean;
}
/** An explicit demonstration profile, not a certified network checklist. */
export const demoPrescriptionPolicy: PrescriptionPolicy = {
  schemaVersion: '1',
  id: 'demo-outpatient',
  version: '1.0.0',
  requiredFields: [
    'productId',
    'code',
    'strength',
    'doseForm',
    'sig',
    'dose',
    'doseUnit',
    'route',
    'frequency',
    'quantity',
    'quantityUnit',
    'refills',
    'substitution',
  ],
  supportedCodingSystems: [
    'urn:mieweb:simulation-drug',
    'RxNorm',
    'NDC',
    'http://www.nlm.nih.gov/research/umls/rxnorm',
    'http://hl7.org/fhir/sid/ndc',
  ],
  supportedDoseUnits: ['mg', 'g', 'mL', 'tablet', 'capsule'],
  supportedQuantityUnits: ['tablet', 'capsule', 'mL', 'g', 'each'],
  requirePatient: true,
  requirePrescriber: true,
  requirePharmacy: true,
  requireClassification: true,
  requireResolvedProduct: true,
  maxContextAgeMs: 86400000,
  allowCompound: false,
  scheduleRefillLimits: { II: 0, III: 5, IV: 5 },
  requiredChecks: {
    review: ['validation', 'interactions', 'pregnancy', 'dosing'],
    sign: ['validation', 'interactions', 'pregnancy', 'dosing'],
    transmit: [
      'validation',
      'interactions',
      'pregnancy',
      'dosing',
      'formulary',
      'benefit',
    ],
  },
  pdmp: {
    requiredForSchedules: ['II', 'III', 'IV', 'V'],
    jurisdictions: ['SIM'],
    maxAgeMs: 86400000,
  },
  priorAuthorization: { holdTransmit: true },
  holdNonCoveredBenefit: false,
  holdReplacementUntilCancellation: true,
};
export const prescriptionDetailFields: Array<keyof PrescriptionDetails> = [
  'name',
  'sig',
  'code',
  'productId',
  'strength',
  'doseForm',
  'dose',
  'doseUnit',
  'quantity',
  'quantityUnit',
  'daysSupply',
  'route',
  'frequency',
  'prn',
  'prnReason',
  'maxDailyDose',
  'refills',
  'substitution',
  'startDate',
  'endDate',
  'writtenDate',
  'indication',
  'pharmacyNotes',
  'pharmacyId',
];
