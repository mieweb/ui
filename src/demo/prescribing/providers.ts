import { isoMillis, millisISO } from './scheduler';
import type { PrescriptionDraft } from '../../prescribing/types';
import { KNOWLEDGE_VERSION, syntheticRules } from './fixtures';
import type { FixtureContext, FixtureProduct, FixtureFact } from './fixtures';
import type { SimulationScenario } from './scenarios';

export interface SyntheticEvidence {
  providerId: string;
  datasetVersion: string;
  ruleId?: string;
  referenceUrl: string;
  observedAt?: string;
  retrievedAt: string;
  synthetic: true;
}
export interface SyntheticFinding {
  id: string;
  category:
    | 'interaction'
    | 'duplicate-therapy'
    | 'allergy'
    | 'pregnancy'
    | 'lactation'
    | 'reproductive-potential'
    | 'dosing'
    | 'formulary'
    | 'benefit'
    | 'pdmp'
    | 'prior-authorization';
  code: string;
  summary: string;
  rationale: string;
  severity: 'info' | 'warning' | 'critical';
  implicatedPrescriptionIds: string[];
  implicatedMedicationIds: string[];
  factPaths: string[];
  evidence: SyntheticEvidence[];
  suggestedActions: Array<{ code: string; label: string }>;
  disposition: {
    blocks: Array<'review' | 'sign' | 'transmit'>;
    resolution: 'none' | 'acknowledgement' | 'override' | 'cannot-override';
    allowedReasonCodes: string[];
  };
}
export interface SyntheticCheck<T = unknown> {
  status:
    | 'pending'
    | 'complete'
    | 'partial'
    | 'unavailable'
    | 'not-applicable'
    | 'not-requested';
  outcome: 'findings' | 'no-findings-within-coverage' | 'unknown';
  data: T | null;
  findings: SyntheticFinding[];
  missingInputs: string[];
  coverage: {
    domains: string[];
    evaluatedSubjects: string[];
    excludedSubjects: string[];
    datasetVersion: string | null;
  };
  evidence: SyntheticEvidence[];
  checkedAt: string | null;
  expiresAt: string | null;
  error: { code: string; retryable: boolean } | null;
}
export interface ProviderSnapshot {
  draft: PrescriptionDraft;
  product: FixtureProduct | null;
  context: FixtureContext;
  related: Array<{ draft: PrescriptionDraft; product: FixtureProduct | null }>;
  scenario: SimulationScenario;
  now: string;
}
export function evidence(
  domain: string,
  now: string,
  ruleId?: string
): SyntheticEvidence {
  return {
    providerId: `synthetic-${domain}`,
    datasetVersion: KNOWLEDGE_VERSION,
    ...(ruleId ? { ruleId } : {}),
    referenceUrl: `urn:mieweb:simulation:${domain}:${ruleId ?? 'coverage'}`,
    retrievedAt: now,
    synthetic: true,
  };
}
export function emptyCheck(
  domain: string,
  status: SyntheticCheck['status'] = 'pending'
): SyntheticCheck {
  return {
    status,
    outcome: 'unknown',
    data: null,
    findings: [],
    missingInputs: [],
    coverage: {
      domains: [domain],
      evaluatedSubjects: [],
      excludedSubjects: [],
      datasetVersion: null,
    },
    evidence: [],
    checkedAt: null,
    expiresAt: null,
    error: null,
  };
}
export function finding(
  domain: SyntheticFinding['category'],
  code: string,
  summary: string,
  snapshot: ProviderSnapshot,
  paths: string[],
  resolution: SyntheticFinding['disposition']['resolution'] = 'override'
): SyntheticFinding {
  return {
    id: `${domain}:${code}:${snapshot.draft.id ?? 'preview'}`,
    category: domain,
    code,
    summary,
    rationale:
      'Invented simulation rule. This is not a real drug safety recommendation.',
    severity: 'warning',
    implicatedPrescriptionIds: snapshot.draft.id ? [snapshot.draft.id] : [],
    implicatedMedicationIds: [],
    factPaths: paths,
    evidence: [evidence(domain, snapshot.now, code)],
    suggestedActions: [{ code: 'review', label: 'Review synthetic finding' }],
    disposition: {
      blocks: ['review', 'sign', 'transmit'],
      resolution,
      allowedReasonCodes:
        resolution === 'override'
          ? ['clinical-judgment', 'benefits-outweigh-risk', 'simulation-review']
          : resolution === 'acknowledgement'
            ? ['reviewed']
            : [],
    },
  };
}
function fresh<T>(
  fact: FixtureFact<T>,
  now: string
): fact is Extract<FixtureFact<T>, { state: 'known' }> {
  return (
    fact.state === 'known' &&
    isoMillis(now) - isoMillis(fact.observedAt) < syntheticRules.maxFactAgeMs &&
    isoMillis(fact.observedAt) <= isoMillis(now)
  );
}
function base(domain: string, snapshot: ProviderSnapshot): SyntheticCheck {
  const check = emptyCheck(domain, 'complete');
  check.checkedAt = snapshot.now;
  check.expiresAt = millisISO(
    isoMillis(snapshot.now) + syntheticRules.maxFactAgeMs
  );
  check.coverage.datasetVersion = KNOWLEDGE_VERSION;
  check.evidence = [evidence(domain, snapshot.now)];
  if (snapshot.scenario.unavailable === domain) {
    check.status = 'unavailable';
    check.error = { code: 'SIM_PROVIDER_UNAVAILABLE', retryable: true };
    return check;
  }
  if (
    !snapshot.product ||
    !syntheticRules[
      domain as keyof typeof syntheticProviders
    ].coveredProducts.some((id) => id === snapshot.product?.id)
  ) {
    check.status = 'partial';
    check.missingInputs.push('prescription.productId');
    check.coverage.excludedSubjects.push(snapshot.draft.display);
    return check;
  }
  check.coverage.evaluatedSubjects.push(snapshot.product.id);
  check.outcome = 'no-findings-within-coverage';
  return check;
}
function factExpiry(
  check: SyntheticCheck,
  facts: FixtureFact<unknown>[]
): void {
  const expiries = facts.flatMap((fact) =>
    fact.state === 'known'
      ? [isoMillis(fact.observedAt) + syntheticRules.maxFactAgeMs]
      : []
  );
  if (check.expiresAt) expiries.push(isoMillis(check.expiresAt));
  if (expiries.length) check.expiresAt = millisISO(Math.min(...expiries));
}
function complete(check: SyntheticCheck): SyntheticCheck {
  if (check.missingInputs.length || check.coverage.excludedSubjects.length)
    check.status = 'partial';
  check.outcome = check.findings.length
    ? 'findings'
    : check.status === 'complete'
      ? 'no-findings-within-coverage'
      : 'unknown';
  return check;
}

export function checkInteractions(snapshot: ProviderSnapshot): SyntheticCheck {
  const check = base('interactions', snapshot);
  if (!snapshot.product || check.status === 'unavailable') return check;
  if (
    !fresh(snapshot.context.medicationHistoryReviewed, snapshot.now) ||
    !snapshot.context.medicationHistoryReviewed.value
  )
    check.missingInputs.push('medicationHistoryReviewed');
  if (
    !fresh(snapshot.context.allergyHistoryReviewed, snapshot.now) ||
    !snapshot.context.allergyHistoryReviewed.value
  )
    check.missingInputs.push('allergyHistoryReviewed');
  const exposures = [
    ...snapshot.context.medicationExposures.map((record) => ({
      id: record.id,
      ingredients: record.ingredientIds,
      prescription: false,
    })),
    ...snapshot.related.map(({ draft, product }) => ({
      id: draft.id ?? 'proposed',
      ingredients: product?.ingredientIds ?? [],
      prescription: true,
    })),
  ];
  for (const exposure of exposures) {
    if (!exposure.ingredients.length) {
      check.coverage.excludedSubjects.push(exposure.id);
      continue;
    }
    const pair = [...snapshot.product.ingredientIds, ...exposure.ingredients]
      .sort()
      .join('+');
    check.coverage.evaluatedSubjects.push(pair);
    const isDemoPair = syntheticRules.interactions.pairs.some(
      (rulePair) => [...rulePair].sort().join('+') === pair
    );
    if (isDemoPair) {
      const item = finding(
        'interaction',
        'DEMO_PAIR_A_X',
        'Synthetic ingredient A / X interaction requires review',
        snapshot,
        ['medicationExposures']
      );
      item.id += `:${exposure.id}`;
      if (exposure.prescription)
        item.implicatedPrescriptionIds.push(exposure.id);
      else item.implicatedMedicationIds.push(exposure.id);
      check.findings.push(item);
    } else if (
      !syntheticRules.interactions.coveredNonfindingPairs.some(
        (covered) => [...covered].sort().join('+') === pair
      )
    ) {
      check.coverage.excludedSubjects.push(pair);
    }
  }
  for (const allergy of snapshot.context.allergies) {
    if (
      snapshot.product.ingredientIds.includes(allergy.ingredientId) &&
      allergy.verification === 'confirmed'
    ) {
      const item = finding(
        'allergy',
        'DEMO_ALLERGY',
        'Synthetic confirmed allergy requires correction',
        snapshot,
        ['allergies'],
        'cannot-override'
      );
      item.id += `:${allergy.id}`;
      item.severity = 'critical';
      check.findings.push(item);
    }
  }
  factExpiry(check, [
    snapshot.context.medicationHistoryReviewed,
    snapshot.context.allergyHistoryReviewed,
  ]);
  check.data = {
    evaluatedPairs: check.coverage.evaluatedSubjects,
    historyReviewed: snapshot.context.completeness.medicationHistory,
    synthetic: true,
  };
  return complete(check);
}

export function checkPregnancy(snapshot: ProviderSnapshot): SyntheticCheck {
  const check = base('pregnancy', snapshot);
  if (!snapshot.product || check.status === 'unavailable') return check;
  for (const key of ['pregnancy', 'lactation', 'reproductiveIntent'] as const) {
    const fact = snapshot.context[key];
    if (!fresh<unknown>(fact, snapshot.now) || fact.value === 'unknown')
      check.missingInputs.push(key);
    else if (
      (key === 'pregnancy' && fact.value === 'pregnant') ||
      (key === 'lactation' && fact.value === true) ||
      (key === 'reproductiveIntent' && fact.value === 'planning')
    ) {
      const category =
        key === 'reproductiveIntent' ? 'reproductive-potential' : key;
      check.findings.push(
        finding(
          category,
          `DEMO_${category.toUpperCase()}_PRECAUTION`,
          `Synthetic ${category} precaution: review the narrative fixture evidence`,
          snapshot,
          [key],
          'acknowledgement'
        )
      );
    }
  }
  factExpiry(check, [
    snapshot.context.pregnancy,
    snapshot.context.lactation,
    snapshot.context.reproductiveIntent,
  ]);
  check.data = {
    pregnancy: snapshot.context.pregnancy,
    lactation: snapshot.context.lactation,
    reproductivePotential: snapshot.context.reproductiveIntent,
    narrative:
      'Invented narrative risk and clinical considerations; no letter categories or safe/unsafe flag.',
    synthetic: true,
  };
  return complete(check);
}

export function checkDosing(snapshot: ProviderSnapshot): SyntheticCheck {
  const check = base('dosing', snapshot);
  if (!snapshot.product || check.status === 'unavailable') return check;
  const details = snapshot.draft.prescription;
  let doseMg: number | null = null;
  if (!details.dose || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(details.dose))
    check.missingInputs.push('prescription.dose');
  else if (Number(details.dose) <= 0)
    check.missingInputs.push('prescription.dose');
  else if (details.doseUnit === 'mg') doseMg = Number(details.dose);
  else if (details.doseUnit === 'g') doseMg = Number(details.dose) * 1000;
  else check.missingInputs.push('prescription.doseUnit');
  if (
    !syntheticRules.dosing.supportedRoutes.some(
      (route) => route === details.route
    )
  )
    check.missingInputs.push('prescription.route');
  const frequencyCount = details.frequency
    ? syntheticRules.dosing.supportedFrequencies[
        details.frequency as keyof typeof syntheticRules.dosing.supportedFrequencies
      ]
    : undefined;
  if (!frequencyCount) check.missingInputs.push('prescription.frequency');
  let maximumDailyMg: number | null = null;
  if (details.prn) {
    const maximum = details.maxDailyDose;
    if (
      !maximum ||
      !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(maximum) ||
      Number(maximum) <= 0 ||
      !['mg', 'g'].includes(details.doseUnit ?? '')
    )
      check.missingInputs.push('prescription.maxDailyDose');
    else {
      maximumDailyMg = Number(maximum) * (details.doseUnit === 'g' ? 1000 : 1);
      if (doseMg !== null && maximumDailyMg < doseMg)
        check.missingInputs.push('prescription.maxDailyDose');
    }
  }
  if (!details.indication) check.missingInputs.push('prescription.indication');
  let weightKg: number | null = null;
  if (snapshot.product.id === syntheticRules.dosing.weightProduct) {
    const weight = snapshot.context.measurements.weight;
    if (!fresh(weight, snapshot.now))
      check.missingInputs.push('measurements.weight');
    else
      weightKg =
        Number(weight.value.value) *
        (weight.value.unit === '[lb_av]'
          ? syntheticRules.dosing.poundsToKg
          : 1);
    if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg <= 0)) {
      weightKg = null;
      check.missingInputs.push('measurements.weight');
    }
  }
  if (snapshot.product.id === syntheticRules.dosing.renalProduct) {
    const renal = snapshot.context.renal;
    if (
      !fresh(renal, snapshot.now) ||
      renal.value.metric !== 'CrCl' ||
      renal.value.unit !== 'mL/min' ||
      !renal.value.method ||
      renal.value.dialysis
    )
      check.missingInputs.push('renal.CrCl.method');
  }
  if (
    snapshot.product.id === 'sim-a' &&
    doseMg !== null &&
    doseMg > syntheticRules.dosing.simAMaxPerDoseMg
  ) {
    const item = finding(
      'dosing',
      'DEMO_DOSE_HIGH',
      `${doseMg} mg exceeds the invented 10 mg per administration limit`,
      snapshot,
      ['prescription.dose', 'prescription.doseUnit'],
      'cannot-override'
    );
    item.suggestedActions = [
      { code: 'edit-dose', label: 'Correct demonstration dose' },
    ];
    check.findings.push(item);
  }
  factExpiry(check, [
    ...(snapshot.product.id === syntheticRules.dosing.weightProduct
      ? [snapshot.context.measurements.weight]
      : []),
    ...(snapshot.product.id === syntheticRules.dosing.renalProduct
      ? [snapshot.context.renal]
      : []),
  ]);
  check.data = {
    perDoseAmount:
      doseMg === null ? null : { value: String(doseMg), unit: 'mg' },
    dailyAmount:
      doseMg === null || details.prn || !frequencyCount
        ? null
        : {
            value: String(doseMg * (frequencyCount ?? 0)),
            unit: 'mg',
          },
    weightKg: weightKg === null ? null : String(Number(weightKg.toFixed(6))),
    maximumDailyAmount:
      maximumDailyMg === null
        ? null
        : { value: String(maximumDailyMg), unit: 'mg' },
    demonstrationRange:
      snapshot.product.id === 'sim-a' ? { maxPerDose: '10', unit: 'mg' } : null,
    synthetic: true,
  };
  return complete(check);
}

export function checkFormulary(snapshot: ProviderSnapshot): SyntheticCheck {
  const check = base('formulary', snapshot);
  if (!snapshot.product || check.status === 'unavailable') return check;
  if (snapshot.context.coverage.planId !== 'sim-plan-1') {
    check.missingInputs.push('coverage.planId');
    return complete(check);
  }
  check.data = {
    planId: snapshot.context.coverage.planId,
    formularyVersion: KNOWLEDGE_VERSION,
    productId: snapshot.product.id,
    coverage: 'covered',
    tier: 'synthetic-tier-1',
    restrictions: [],
    quantityLimit: null,
    stepTherapy: null,
    priorAuthorization: snapshot.scenario.pa ? 'yes' : 'no',
    alternatives: [],
    evidence: check.evidence,
    synthetic: true,
  };
  return complete(check);
}

export function checkBenefit(snapshot: ProviderSnapshot): SyntheticCheck {
  const check = base('benefit', snapshot);
  if (!snapshot.product || check.status === 'unavailable') return check;
  if (
    snapshot.context.coverage.planId !== 'sim-plan-1' ||
    snapshot.context.coverage.active.state !== 'known' ||
    !snapshot.context.coverage.active.value
  ) {
    check.missingInputs.push('coverage.activePlan');
    return complete(check);
  }
  const restricted = snapshot.scenario.coverage === 'restricted';
  const nonpreferred =
    snapshot.scenario.coverage === 'nonpreferred' ||
    snapshot.draft.pharmacyId === 'sim-pharmacy-2';
  check.data = {
    inquiryId: `sim-inquiry:${snapshot.draft.id ?? 'preview'}:${snapshot.draft.contentRevision ?? '1'}`,
    planId: snapshot.context.coverage.planId,
    memberId: snapshot.context.coverage.memberId,
    pharmacyId: snapshot.draft.pharmacyId,
    productId: snapshot.product.id,
    quantity: snapshot.draft.prescription.quantity,
    daysSupply: snapshot.draft.prescription.daysSupply ?? null,
    coverage: restricted ? 'not-covered' : 'covered',
    patientCostEstimate: restricted
      ? null
      : { amount: nonpreferred ? '35.00' : '10.00', currency: 'USD' },
    estimateAsOf: snapshot.now,
    estimateDisclaimer: 'Synthetic estimate only; not a guaranteed price.',
    restrictions: restricted
      ? [
          {
            code: 'SIM_RESTRICTION',
            message: 'Invented patient-specific restriction',
            productId: snapshot.product.id,
          },
        ]
      : [],
    priorAuthorization: snapshot.scenario.pa ? 'yes' : 'no',
    alternatives: [],
    payerResponseId: `sim-payer-response:${snapshot.draft.id ?? 'preview'}`,
    synthetic: true,
  };
  if (restricted) {
    const item = finding(
      'benefit',
      'DEMO_NOT_COVERED',
      'Synthetic member benefit is not covered',
      snapshot,
      ['coverage'],
      'acknowledgement'
    );
    item.disposition.blocks = [];
    check.findings.push(item);
  }
  return complete(check);
}

export const syntheticProviders = {
  interactions: checkInteractions,
  pregnancy: checkPregnancy,
  dosing: checkDosing,
  formulary: checkFormulary,
  benefit: checkBenefit,
};
