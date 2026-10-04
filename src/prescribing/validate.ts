import { DateTime } from 'luxon';
import type { PrescriptionPolicy } from './policy';
import { prescriptionDetailFields } from './policy';
import type {
  Fact,
  PrescriptionIssue,
  PrescriptionValidationInput,
  PrescriptionValidationResult,
} from './types';
export const isJsonObject = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const normalizeDecimal = (value: string): string | null => {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const [integer, fraction] = trimmed.split('.');
  const normalizedInteger = integer.replace(/^0+(?=\d)/, '');
  const normalizedFraction = fraction?.replace(/0+$/, '');
  return normalizedFraction
    ? `${normalizedInteger}.${normalizedFraction}`
    : normalizedInteger;
};
const fullTimestamp = (value: unknown) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value
  );
const date = (value: unknown) =>
  typeof value === 'string'
    ? DateTime.fromISO(value, { zone: 'UTC' })
    : DateTime.invalid('invalid input');
const fieldLabels: Record<string, string> = {
  name: 'Medication name',
  sig: 'Directions',
  productId: 'Drug product',
  code: 'Drug code',
  strength: 'Strength',
  doseForm: 'Dosage form',
  dose: 'Dose',
  doseUnit: 'Dose unit',
  quantity: 'Dispense quantity',
  quantityUnit: 'Dispensing unit',
  daysSupply: 'Days supply',
  route: 'Route',
  frequency: 'Frequency',
  prnReason: 'As-needed reason',
  maxDailyDose: 'Maximum daily dose',
  refills: 'Refills',
  substitution: 'Substitution choice',
  startDate: 'Therapy start date',
  endDate: 'Therapy end date',
  writtenDate: 'Written date',
  indication: 'Indication',
  pharmacyNotes: 'Pharmacy notes',
  pharmacyId: 'Pharmacy',
  prn: 'As-needed choice',
};
const fieldLabel = (field: string) => fieldLabels[field] ?? field;
const nonempty = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;
/** Pure, synchronous and deterministic: all time and context enter through input. */
export function validatePrescription(
  rawInput: PrescriptionValidationInput | unknown,
  rawPolicy: PrescriptionPolicy | unknown
): PrescriptionValidationResult {
  const input = isJsonObject(rawInput) ? rawInput : {};
  const draft = isJsonObject(input.draft) ? input.draft : {};
  const details = isJsonObject(draft.prescription) ? draft.prescription : {};
  const context = isJsonObject(input.context) ? input.context : {};
  const policy = isJsonObject(rawPolicy) ? rawPolicy : {};
  const result: PrescriptionValidationResult = {
    orderId: typeof input.orderId === 'string' ? input.orderId : '',
    orderRevision:
      typeof input.orderRevision === 'string' ? input.orderRevision : '',
    contextRevision:
      typeof context.revision === 'string' ? context.revision : '',
    policyVersion: typeof policy.version === 'string' ? policy.version : '',
    evaluatedAt: typeof input.evaluatedAt === 'string' ? input.evaluatedAt : '',
    dataState: 'unknown',
    checks: { review: 'unknown', transmit: 'unknown' },
    issues: [],
  };
  const add = (
    code: string,
    fieldPath: string,
    message: string,
    remediation: PrescriptionIssue['remediation'] = 'edit-prescription',
    ruleSource: PrescriptionIssue['ruleSource'] = 'product'
  ) =>
    result.issues.push({
      code,
      ruleId: `prescribing.${code.toLowerCase()}`,
      ruleSource,
      fieldPath,
      message,
      severity: 'error',
      blocks: ['review', 'sign', 'transmit'],
      remediation,
    });
  const validPolicy =
    policy.schemaVersion === '1' &&
    nonempty(policy.id) &&
    nonempty(policy.version) &&
    Array.isArray(policy.requiredFields) &&
    policy.requiredFields.every(
      (f) =>
        typeof f === 'string' && prescriptionDetailFields.includes(f as never)
    ) &&
    [
      'supportedCodingSystems',
      'supportedDoseUnits',
      'supportedQuantityUnits',
    ].every(
      (k) =>
        Array.isArray(policy[k]) &&
        (policy[k] as unknown[]).every((v) => typeof v === 'string')
    ) &&
    [
      'requirePatient',
      'requirePrescriber',
      'requirePharmacy',
      'requireClassification',
      'requireResolvedProduct',
      'allowCompound',
    ].every((k) => typeof policy[k] === 'boolean') &&
    typeof policy.maxContextAgeMs === 'number' &&
    Number.isFinite(policy.maxContextAgeMs) &&
    policy.maxContextAgeMs > 0 &&
    isJsonObject(policy.scheduleRefillLimits) &&
    Object.entries(policy.scheduleRefillLimits).every(
      ([k, v]) =>
        ['II', 'III', 'IV', 'V'].includes(k) &&
        typeof v === 'number' &&
        Number.isInteger(v) &&
        v >= 0
    ) &&
    isJsonObject(policy.requiredChecks) &&
    ['review', 'sign', 'transmit'].every(
      (k) =>
        Array.isArray(
          policy.requiredChecks &&
            (policy.requiredChecks as Record<string, unknown>)[k]
        ) &&
        (policy.requiredChecks as Record<string, unknown[]>)[k].every((v) =>
          [
            'validation',
            'interactions',
            'pregnancy',
            'dosing',
            'formulary',
            'benefit',
          ].includes(String(v))
        )
    ) &&
    isJsonObject(policy.pdmp) &&
    Array.isArray(policy.pdmp.requiredForSchedules) &&
    policy.pdmp.requiredForSchedules.every(
      (v) => typeof v === 'string' && ['II', 'III', 'IV', 'V'].includes(v)
    ) &&
    Array.isArray(policy.pdmp.jurisdictions) &&
    policy.pdmp.jurisdictions.every((v) => typeof v === 'string' && v.trim()) &&
    typeof policy.pdmp.maxAgeMs === 'number' &&
    Number.isFinite(policy.pdmp.maxAgeMs) &&
    policy.pdmp.maxAgeMs > 0 &&
    isJsonObject(policy.priorAuthorization) &&
    typeof policy.priorAuthorization.holdTransmit === 'boolean' &&
    typeof policy.holdNonCoveredBenefit === 'boolean' &&
    typeof policy.holdReplacementUntilCancellation === 'boolean';
  if (!validPolicy) {
    add(
      'POLICY_UNAVAILABLE',
      'policy',
      'Validation policy is unsupported or malformed.',
      'system',
      'organization'
    );
    return result;
  }
  const p = rawPolicy as PrescriptionPolicy;
  const now = date(input.evaluatedAt);
  if (
    !fullTimestamp(input.evaluatedAt) ||
    !now.isValid ||
    !nonempty(input.orderId) ||
    !nonempty(input.orderRevision) ||
    !nonempty(context.revision) ||
    !isJsonObject(input.draft) ||
    !isJsonObject(draft.prescription)
  ) {
    add(
      'INPUT_MALFORMED',
      'input',
      'Prescription input or evaluation context is malformed.',
      'system'
    );
    return result;
  }
  let invalid = false;
  let missing = false;
  let unknown = false;
  if (
    !nonempty(draft.patientId) ||
    !nonempty(draft.prescriberId) ||
    !['prescribe', 'history', 'administration'].includes(String(draft.intent))
  ) {
    add(
      'DRAFT_IDENTITY_INVALID',
      'draft',
      'Patient, prescriber and prescribing intent must be explicit.'
    );
    invalid = true;
  }
  if (!nonempty(draft.display)) {
    add('REQUIRED', 'display', 'Medication name is required.');
    missing = true;
  }
  for (const field of prescriptionDetailFields) {
    const value = details[field];
    if (
      value !== undefined &&
      ((field === 'prn' && typeof value !== 'boolean') ||
        (field === 'code' &&
          (!isJsonObject(value) ||
            !nonempty(value.system) ||
            !nonempty(value.code))) ||
        (field !== 'prn' && field !== 'code' && typeof value !== 'string'))
    ) {
      add(
        'FIELD_TYPE',
        `prescription.${field}`,
        `${fieldLabel(field)} has an invalid value type.`
      );
      invalid = true;
    }
  }
  for (const field of p.requiredFields) {
    if (
      details[field] === undefined ||
      details[field] === null ||
      (typeof details[field] === 'string' && !nonempty(details[field]))
    ) {
      add(
        'REQUIRED',
        `prescription.${field}`,
        `${fieldLabel(field)} is required to complete the prescription.`
      );
      missing = true;
    }
  }
  for (const field of [
    'dose',
    'quantity',
    'daysSupply',
    'maxDailyDose',
  ] as const) {
    if (details[field] !== undefined && details[field] !== '') {
      const normalized =
        typeof details[field] === 'string'
          ? normalizeDecimal(details[field] as string)
          : null;
      if (
        normalized === null ||
        Number(normalized) <= 0 ||
        !Number.isFinite(Number(normalized))
      ) {
        add(
          'POSITIVE_DECIMAL',
          `prescription.${field}`,
          `${fieldLabel(field)} must be a positive decimal.`
        );
        invalid = true;
      }
    }
  }
  if (
    details.refills !== undefined &&
    details.refills !== '' &&
    (typeof details.refills !== 'string' ||
      !/^\d+$/.test(details.refills.trim()) ||
      !Number.isSafeInteger(Number(details.refills)))
  ) {
    add(
      'REFILLS_INTEGER',
      'prescription.refills',
      'Refills must be a nonnegative integer; zero is valid.'
    );
    invalid = true;
  }
  if (
    details.substitution !== undefined &&
    !['0', '1'].includes(String(details.substitution))
  ) {
    add(
      'SUBSTITUTION_INVALID',
      'prescription.substitution',
      'Choose permitted substitution or dispense as written.'
    );
    invalid = true;
  }
  const coding = details.code ?? draft.code;
  if (
    coding !== undefined &&
    (!isJsonObject(coding) ||
      !nonempty(coding.code) ||
      !p.supportedCodingSystems.includes(String(coding.system)))
  ) {
    add(
      'CODING_UNSUPPORTED',
      'prescription.code',
      'Resolve a product with a supported coding system.'
    );
    invalid = true;
  }
  for (const [field, supported] of [
    ['doseUnit', p.supportedDoseUnits],
    ['quantityUnit', p.supportedQuantityUnits],
  ] as const) {
    if (
      nonempty(details[field]) &&
      !supported.includes(String(details[field]))
    ) {
      add(
        'UNIT_UNSUPPORTED',
        `prescription.${field}`,
        `Choose a supported ${fieldLabel(field).toLowerCase()}.`
      );
      invalid = true;
    }
  }
  if (details.prn === true && !nonempty(details.prnReason)) {
    add(
      'PRN_REASON_REQUIRED',
      'prescription.prnReason',
      'Specify the as-needed reason.'
    );
    missing = true;
  }
  for (const field of ['startDate', 'endDate', 'writtenDate'] as const) {
    if (
      details[field] !== undefined &&
      details[field] !== '' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(String(details[field])) ||
        !date(details[field]).isValid)
    ) {
      add(
        'DATE_INVALID',
        `prescription.${field}`,
        `${fieldLabel(field)} must be a valid calendar date.`
      );
      invalid = true;
    }
  }
  if (
    date(details.startDate).isValid &&
    date(details.endDate).isValid &&
    date(details.endDate) < date(details.startDate)
  ) {
    add(
      'DATE_ORDER',
      'prescription.endDate',
      'Therapy end date precedes start date.'
    );
    invalid = true;
  }
  if (
    date(details.writtenDate).isValid &&
    date(details.writtenDate).startOf('day') > now.startOf('day')
  ) {
    add(
      'WRITTEN_DATE_FUTURE',
      'prescription.writtenDate',
      'Written date cannot be in the future.'
    );
    invalid = true;
  }
  const checkFact = <T>(
    key: string,
    required: boolean,
    remediation: PrescriptionIssue['remediation']
  ): T | undefined => {
    if (!required) return undefined;
    const fact = context[key];
    if (
      !isJsonObject(fact) ||
      !['known', 'unknown', 'not-applicable'].includes(String(fact.state)) ||
      (fact.state === 'known' &&
        (!fullTimestamp(fact.observedAt) ||
          !date(fact.observedAt).isValid ||
          !nonempty(fact.sourceId) ||
          !('value' in fact))) ||
      (fact.state !== 'known' && !nonempty(fact.reason))
    ) {
      add(
        'CONTEXT_MALFORMED',
        `context.${key}`,
        `${key} context is missing or malformed.`,
        remediation,
        'organization'
      );
      unknown = true;
      return undefined;
    }
    if (fact.state !== 'known') {
      add(
        'CONTEXT_UNKNOWN',
        `context.${key}`,
        `${key} must be resolved for this action.`,
        remediation,
        'organization'
      );
      unknown = true;
      return undefined;
    }
    const age = now.toMillis() - date(fact.observedAt).toMillis();
    if (age < 0 || age >= p.maxContextAgeMs) {
      add(
        'CONTEXT_STALE',
        `context.${key}`,
        `${key} context must be refreshed.`,
        remediation,
        'organization'
      );
      unknown = true;
      return undefined;
    }
    const value = fact.value;
    const validValue =
      key === 'controlledSchedule'
        ? typeof value === 'string' &&
          ['non-controlled', 'II', 'III', 'IV', 'V'].includes(value)
        : isJsonObject(value);
    if (!validValue) {
      add(
        'CONTEXT_MALFORMED',
        `context.${key}`,
        `${key} context value is malformed.`,
        remediation,
        'organization'
      );
      unknown = true;
      return undefined;
    }
    return (fact as unknown as Fact<T> & { value: T }).value;
  };
  const product = checkFact<Record<string, unknown>>(
    'product',
    p.requireResolvedProduct,
    'edit-prescription'
  );
  if (product) {
    const productCoding = product.coding;
    if (
      !nonempty(product.id) ||
      !['product', 'ingredient', 'compound'].includes(
        String(product.conceptSpecificity)
      ) ||
      !Array.isArray(productCoding) ||
      productCoding.length === 0 ||
      productCoding.some(
        (c) => !isJsonObject(c) || !nonempty(c.system) || !nonempty(c.code)
      ) ||
      typeof product.strength !== 'string' ||
      typeof product.doseForm !== 'string'
    ) {
      add(
        'PRODUCT_METADATA_UNKNOWN',
        'context.product',
        'Resolved drug product metadata must be verified.',
        'edit-prescription'
      );
      unknown = true;
    } else if (
      product.conceptSpecificity === 'ingredient' ||
      (product.conceptSpecificity === 'compound' && !p.allowCompound)
    ) {
      add(
        'PRODUCT_PATH_UNSUPPORTED',
        'prescription.productId',
        'Select a supported drug product; this profile does not support the selected ingredient or compound pathway.'
      );
      unknown = true;
    } else {
      if (nonempty(details.productId) && details.productId !== product.id) {
        add(
          'PRODUCT_ID_MISMATCH',
          'prescription.productId',
          'Drug product does not match the resolved catalog record.'
        );
        invalid = true;
      }
      if (
        isJsonObject(coding) &&
        !productCoding.some(
          (c) =>
            isJsonObject(c) &&
            c.system === coding.system &&
            c.code === coding.code &&
            (coding.version === undefined || c.version === coding.version)
        )
      ) {
        add(
          'PRODUCT_CODE_MISMATCH',
          'prescription.code',
          'Drug code does not match the selected product.'
        );
        invalid = true;
      }
      for (const field of ['strength', 'doseForm'] as const)
        if (
          nonempty(details[field]) &&
          String(details[field]).trim() !== String(product[field]).trim()
        ) {
          add(
            'PRODUCT_DETAIL_MISMATCH',
            `prescription.${field}`,
            `${fieldLabel(field)} does not match the selected product; reselect or confirm the intended product.`
          );
          invalid = true;
        }
    }
  }
  const patient = checkFact<Record<string, unknown>>(
    'patient',
    p.requirePatient,
    'patient'
  );
  if (
    patient &&
    (!isJsonObject(patient) ||
      patient.id !== draft.patientId ||
      !nonempty(patient.name) ||
      !nonempty(patient.address))
  ) {
    add(
      'PATIENT_INVALID',
      'context.patient',
      'Patient identity, name and address must be verified.',
      'patient',
      'network'
    );
    invalid = true;
  }
  const prescriber = checkFact<Record<string, unknown>>(
    'prescriber',
    p.requirePrescriber,
    'prescriber'
  );
  if (
    prescriber &&
    (!isJsonObject(prescriber) ||
      prescriber.id !== draft.prescriberId ||
      !nonempty(prescriber.name) ||
      !nonempty(prescriber.address) ||
      prescriber.authorized !== true ||
      prescriber.networkEnrolled !== true)
  ) {
    add(
      'PRESCRIBER_INELIGIBLE',
      'context.prescriber',
      'Prescriber identity and prescribing authority must be verified.',
      'prescriber',
      'network'
    );
    invalid = true;
  }
  const pharmacy = checkFact<Record<string, unknown>>(
    'pharmacy',
    p.requirePharmacy,
    'pharmacy'
  );
  if (
    pharmacy &&
    (!isJsonObject(pharmacy) ||
      pharmacy.id !== (draft.pharmacyId ?? details.pharmacyId) ||
      pharmacy.newRx !== true)
  ) {
    add(
      'PHARMACY_INELIGIBLE',
      'context.pharmacy',
      'Select a destination supporting the intended transaction.',
      'pharmacy',
      'network'
    );
    invalid = true;
  }
  const schedule = checkFact<string>(
    'controlledSchedule',
    p.requireClassification,
    'edit-prescription'
  );
  if (
    schedule &&
    !['non-controlled', 'II', 'III', 'IV', 'V'].includes(schedule)
  ) {
    add(
      'CLASSIFICATION_INVALID',
      'context.controlledSchedule',
      'Controlled-substance classification is invalid.',
      'system'
    );
    unknown = true;
  } else if (schedule && schedule !== 'non-controlled') {
    const limit =
      p.scheduleRefillLimits[schedule as keyof typeof p.scheduleRefillLimits];
    if (
      limit !== undefined &&
      typeof details.refills === 'string' &&
      /^\d+$/.test(details.refills.trim()) &&
      Number(details.refills) > limit
    ) {
      add(
        'CONTROLLED_REFILL_LIMIT',
        'prescription.refills',
        `This profile permits at most ${limit} refills for schedule ${schedule}.`,
        'edit-prescription',
        'federal'
      );
      invalid = true;
    }
    if (
      prescriber &&
      (!nonempty(prescriber.deaRegistration) ||
        prescriber.epcsAuthorized !== true)
    ) {
      add(
        'EPCS_AUTHORITY_UNKNOWN',
        'context.prescriber',
        'Controlled prescribing registration and EPCS authority must be verified.',
        'prescriber',
        'federal'
      );
      unknown = true;
    }
    if (pharmacy && pharmacy.epcs !== true) {
      add(
        'PHARMACY_EPCS',
        'context.pharmacy',
        'Destination lacks verified EPCS capability.',
        'pharmacy',
        'network'
      );
      invalid = true;
    }
  }
  result.dataState = invalid
    ? 'invalid'
    : missing
      ? 'incomplete'
      : unknown
        ? 'unknown'
        : 'complete';
  result.checks = {
    review: invalid || missing ? 'fail' : unknown ? 'unknown' : 'pass',
    transmit: invalid || missing ? 'fail' : unknown ? 'unknown' : 'pass',
  };
  return result;
}
