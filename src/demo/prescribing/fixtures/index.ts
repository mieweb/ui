import type { SimulationScenario } from '../scenarios';

export const SIMULATION_SYSTEM = 'urn:mieweb:simulation-drug';
export const KNOWLEDGE_VERSION = 'synthetic-2026.1';

export type FixtureFact<T> =
  | { state: 'known'; value: T; observedAt: string; sourceId: string }
  | { state: 'unknown'; reason: string }
  | { state: 'not-applicable'; reason: string };

export interface FixtureProduct {
  id: string;
  display: string;
  coding: Array<{ system: string; code: string; version: string }>;
  specificity: 'product';
  ingredientIds: string[];
  strength: string;
  form: string;
  quantityUnits: string[];
  controlledSchedule: FixtureFact<'non-controlled' | 'II'>;
  evidence: Array<{
    providerId: string;
    datasetVersion: string;
    retrievedAt: string;
    synthetic: true;
    referenceUrl: string;
  }>;
}

export interface FixtureContext {
  patientId: string;
  encounterId: string;
  revision: string;
  capturedAt: string;
  birthDate: string;
  agePrecision: 'day';
  demographics: { name: string; address: string; birthDate: string };
  medicationExposures: Array<{
    id: string;
    productId: string;
    ingredientIds: string[];
    status: 'active';
    use: 'reported';
    sourceRevision: string;
    effectiveAt: string;
  }>;
  medicationHistoryReviewed: FixtureFact<boolean>;
  allergies: Array<{
    id: string;
    ingredientId: string;
    verification: 'confirmed';
    reaction: string;
    severity: 'severe';
  }>;
  allergyHistoryReviewed: FixtureFact<boolean>;
  noKnownAllergies: FixtureFact<boolean>;
  pregnancy: FixtureFact<'pregnant' | 'not-pregnant' | 'unknown'>;
  lactation: FixtureFact<boolean>;
  reproductiveIntent: FixtureFact<'none' | 'planning'>;
  measurements: {
    weight: FixtureFact<{
      value: string;
      unit: 'kg' | '[lb_av]';
      method: string;
    }>;
    height: FixtureFact<{ value: string; unit: 'cm' }>;
  };
  renal: FixtureFact<{
    metric: 'CrCl' | 'eGFR';
    value: string;
    unit: string;
    method: string;
    dialysis: boolean;
  }>;
  hepatic: FixtureFact<'normal' | 'unknown'>;
  coverage: {
    revision: string;
    planId: string;
    memberId: string;
    active: FixtureFact<boolean>;
    benefitType: 'pharmacy';
  };
  completeness: { medicationHistory: boolean; allergyHistory: boolean };
}

export interface FixturePharmacy {
  id: string;
  name: string;
  address: string;
  directoryId: string;
  revision: string;
  capabilities: {
    NewRx: FixtureFact<boolean>;
    CancelRx: FixtureFact<boolean>;
    epcs: FixtureFact<boolean>;
  };
  refreshedAt: string;
}

export function known<T>(value: T, now: string): FixtureFact<T> {
  return {
    state: 'known',
    value,
    observedAt: now,
    sourceId: 'urn:mieweb:simulation:chart',
  };
}

export function makeProducts(now: string): FixtureProduct[] {
  return [
    {
      id: 'sim-a',
      display: 'SimDrug A 5 mg tablet',
      ingredientIds: ['sim-ingredient-a'],
      controlled: false,
    },
    {
      id: 'sim-b',
      display: 'SimDrug B 5 mg tablet',
      ingredientIds: ['sim-ingredient-b'],
      controlled: false,
    },
    {
      id: 'sim-renal',
      display: 'SimRenal 5 mg tablet',
      ingredientIds: ['sim-ingredient-renal'],
      controlled: false,
    },
    {
      id: 'sim-controlled',
      display: 'SimControlled 5 mg tablet',
      ingredientIds: ['sim-ingredient-controlled'],
      controlled: true,
    },
  ].map(({ id, display, ingredientIds, controlled }) => ({
    id,
    display,
    ingredientIds,
    coding: [
      { system: SIMULATION_SYSTEM, code: id, version: KNOWLEDGE_VERSION },
    ],
    specificity: 'product',
    strength: '5 mg',
    form: 'tablet',
    quantityUnits: ['tablet'],
    controlledSchedule: known(controlled ? 'II' : 'non-controlled', now),
    evidence: [
      {
        providerId: 'synthetic-catalog',
        datasetVersion: KNOWLEDGE_VERSION,
        retrievedAt: now,
        synthetic: true,
        referenceUrl: `urn:mieweb:simulation:product:${id}`,
      },
    ],
  }));
}

export function makeContext(
  scenario: SimulationScenario,
  now: string
): FixtureContext {
  const old = '2025-01-01T12:00:00.000Z';
  return {
    patientId: 'sim-patient-1',
    encounterId: 'sim-encounter-1',
    revision: '1',
    capturedAt: now,
    birthDate: '1986-06-01',
    agePrecision: 'day',
    demographics: {
      name: 'Synthetic Patient One',
      address: '1 Simulation Way, Testville, IN 00000',
      birthDate: '1986-06-01',
    },
    medicationExposures: scenario.interaction
      ? [
          {
            id: 'sim-exposure-1',
            productId: 'sim-exposure',
            ingredientIds: ['sim-ingredient-x'],
            status: 'active',
            use: 'reported',
            sourceRevision: '1',
            effectiveAt: now,
          },
        ]
      : [],
    medicationHistoryReviewed: scenario.historyMissing
      ? { state: 'unknown', reason: 'Medication history is not reviewed' }
      : known(true, now),
    allergies: [],
    allergyHistoryReviewed: known(true, now),
    noKnownAllergies: known(true, now),
    pregnancy:
      scenario.pregnancy === 'unknown'
        ? { state: 'unknown', reason: 'Pregnancy observation unavailable' }
        : known(
            scenario.pregnancy === 'precaution' ? 'pregnant' : 'not-pregnant',
            scenario.pregnancy === 'stale' ? old : now
          ),
    lactation: known(false, now),
    reproductiveIntent: known('none', now),
    measurements: {
      weight:
        scenario.dose === 'missing-weight'
          ? { state: 'unknown', reason: 'Current measured weight unavailable' }
          : known(
              {
                value:
                  scenario.dose === 'alternate-weight' ? '154.32358353' : '70',
                unit: scenario.dose === 'alternate-weight' ? '[lb_av]' : 'kg',
                method: 'synthetic-measurement',
              },
              now
            ),
      height: known({ value: '170', unit: 'cm' }, now),
    },
    renal: known(
      {
        metric: scenario.dose === 'wrong-renal' ? 'eGFR' : 'CrCl',
        value: '90',
        unit: scenario.dose === 'wrong-renal' ? 'mL/min/1.73m2' : 'mL/min',
        method: 'synthetic-method',
        dialysis: false,
      },
      now
    ),
    hepatic: known('normal', now),
    coverage: {
      revision: '1',
      planId:
        scenario.coverage === 'unsupported'
          ? 'sim-unsupported-plan'
          : 'sim-plan-1',
      memberId: 'sim-member-1',
      active: known(scenario.coverage !== 'inactive', now),
      benefitType: 'pharmacy',
    },
    completeness: {
      medicationHistory: !scenario.historyMissing,
      allergyHistory: true,
    },
  };
}

export function makePharmacies(now: string): FixturePharmacy[] {
  return ['sim-pharmacy-1', 'sim-pharmacy-2'].map((id, index) => ({
    id,
    name:
      index === 0 ? 'Synthetic Preferred Pharmacy' : 'Synthetic Other Pharmacy',
    address: `${index + 2} Simulation Way, Testville, IN 00000`,
    directoryId: `urn:mieweb:simulation:pharmacy:${index + 1}`,
    revision: '1',
    capabilities: {
      NewRx: known(true, now),
      CancelRx: known(true, now),
      epcs: known(true, now),
    },
    refreshedAt: now,
  }));
}

export const syntheticRules = {
  version: KNOWLEDGE_VERSION,
  maxFactAgeMs: 24 * 60 * 60 * 1000,
  interactions: {
    id: 'DEMO_PAIR_A_X',
    pairs: [['sim-ingredient-a', 'sim-ingredient-x']],
    coveredProducts: ['sim-a', 'sim-b', 'sim-renal', 'sim-controlled'],
    coveredExposureIngredients: ['sim-ingredient-x'],
    coveredNonfindingPairs: [
      ['sim-ingredient-a', 'sim-ingredient-b'],
      ['sim-ingredient-a', 'sim-ingredient-renal'],
      ['sim-ingredient-a', 'sim-ingredient-controlled'],
      ['sim-ingredient-b', 'sim-ingredient-renal'],
      ['sim-ingredient-b', 'sim-ingredient-controlled'],
      ['sim-ingredient-b', 'sim-ingredient-x'],
      ['sim-ingredient-renal', 'sim-ingredient-controlled'],
      ['sim-ingredient-renal', 'sim-ingredient-x'],
      ['sim-ingredient-controlled', 'sim-ingredient-x'],
    ],
    requiredFactPaths: ['medicationHistoryReviewed', 'allergyHistoryReviewed'],
  },
  pregnancy: {
    id: 'DEMO_PREGNANCY_PRECAUTION',
    coveredProducts: ['sim-a', 'sim-b', 'sim-renal', 'sim-controlled'],
    requiredFactPaths: ['pregnancy', 'lactation', 'reproductiveIntent'],
  },
  dosing: {
    id: 'DEMO_DOSE_HIGH',
    simAMaxPerDoseMg: 10,
    coveredProducts: ['sim-a', 'sim-b', 'sim-renal', 'sim-controlled'],
    weightProduct: 'sim-b',
    renalProduct: 'sim-renal',
    requiredRenalMetric: 'CrCl',
    poundsToKg: 0.45359237,
    supportedRoutes: ['oral'],
    supportedFrequencies: { daily: 1, 'once daily': 1, 'twice daily': 2 },
  },
  formulary: {
    coveredProducts: ['sim-a', 'sim-b', 'sim-renal', 'sim-controlled'],
  },
  benefit: {
    coveredProducts: ['sim-a', 'sim-b', 'sim-renal', 'sim-controlled'],
  },
} as const;
