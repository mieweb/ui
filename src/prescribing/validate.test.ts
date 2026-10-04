import { describe, expect, it } from 'vitest';
import { validatePrescription, normalizeDecimal } from './validate';
import { demoPrescriptionPolicy } from './policy';
import { completeValidationFixture } from './fixtures';
const fixture = () =>
  JSON.parse(
    JSON.stringify(completeValidationFixture)
  ) as typeof completeValidationFixture;
describe('shared prescription validator', () => {
  it('is JSON stable, repeatable and leaves its input untouched with explicit zero refills', () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const result = validatePrescription(input, demoPrescriptionPolicy);
    expect(result.dataState).toBe('complete');
    expect(result.issues).toEqual([]);
    expect(JSON.stringify(input)).toBe(before);
    expect(
      validatePrescription(
        JSON.parse(before),
        JSON.parse(JSON.stringify(demoPrescriptionPolicy))
      )
    ).toEqual(result);
  });
  it('allows a bare Lasix draft and reports stable missing detail paths without guessing', () => {
    const input = fixture();
    input.draft.display = 'Lasix';
    input.draft.prescription = {};
    input.context.controlledSchedule = {
      state: 'unknown',
      reason: 'Unresolved product',
    };
    const result = validatePrescription(input, demoPrescriptionPolicy);
    expect(result.dataState).toBe('incomplete');
    expect(result.checks.transmit).toBe('fail');
    expect(result.issues[0].fieldPath).toBe('prescription.productId');
    expect(result.issues.some((i) => i.code === 'CONTEXT_UNKNOWN')).toBe(true);
  });
  it.each(['-1', 'ten', '1.5'])(
    'rejects invalid refill %s but keeps input representable',
    (value) => {
      const input = fixture();
      input.draft.prescription.refills = value;
      expect(
        validatePrescription(input, demoPrescriptionPolicy).issues.some(
          (i) => i.code === 'REFILLS_INTEGER'
        )
      ).toBe(true);
    }
  );
  it.each(['0', '-1', 'NaN', '1 mg'])(
    'rejects nonpositive/malformed quantity %s',
    (value) => {
      const input = fixture();
      input.draft.prescription.quantity = value;
      expect(
        validatePrescription(input, demoPrescriptionPolicy).dataState
      ).toBe('invalid');
    }
  );
  it('applies schedule-specific limits and conditional PRN fields', () => {
    const input = fixture();
    input.context.controlledSchedule = {
      state: 'known',
      value: 'II',
      observedAt: input.evaluatedAt,
      sourceId: 'fixture',
    };
    input.draft.prescription.refills = '1';
    input.draft.prescription.prn = true;
    const codes = validatePrescription(
      input,
      demoPrescriptionPolicy
    ).issues.map((i) => i.code);
    expect(codes).toContain('CONTROLLED_REFILL_LIMIT');
    expect(codes).toContain('PRN_REASON_REQUIRED');
  });
  it('distinguishes therapy date from written date and checks fixed date boundaries', () => {
    const input = fixture();
    input.draft.prescription.startDate = '2027-01-01';
    expect(validatePrescription(input, demoPrescriptionPolicy).dataState).toBe(
      'complete'
    );
    input.draft.prescription.writtenDate = '2026-10-04';
    expect(
      validatePrescription(input, demoPrescriptionPolicy).issues.map(
        (i) => i.code
      )
    ).toContain('WRITTEN_DATE_FUTURE');
    input.draft.prescription.endDate = '2026-02-30';
    expect(
      validatePrescription(input, demoPrescriptionPolicy).issues.map(
        (i) => i.code
      )
    ).toContain('DATE_INVALID');
  });
  it.each([null, false, 0, ''])(
    'does not pass malformed known fact value %s',
    (value) => {
      const input = fixture();
      const changed = JSON.parse(JSON.stringify(input));
      changed.context.patient.value = value;
      expect(
        validatePrescription(changed, demoPrescriptionPolicy).checks.review
      ).toBe('unknown');
    }
  );
  it('rejects unsupported policies, invalid configuration, implicit-date timestamps and stale facts', () => {
    expect(
      validatePrescription(fixture(), {
        ...demoPrescriptionPolicy,
        schemaVersion: '2',
      }).checks.review
    ).toBe('unknown');
    expect(
      validatePrescription(fixture(), {
        ...demoPrescriptionPolicy,
        pdmp: { ...demoPrescriptionPolicy.pdmp, maxAgeMs: NaN },
      }).checks.review
    ).toBe('unknown');
    const input = fixture();
    input.evaluatedAt = '12:00:00';
    expect(validatePrescription(input, demoPrescriptionPolicy).dataState).toBe(
      'unknown'
    );
    input.evaluatedAt = '2026-10-04T12:00:00Z';
    expect(
      validatePrescription(input, demoPrescriptionPolicy).checks.review
    ).toBe('unknown');
  });
  it('normalizes decimals without floating point changes', () => {
    expect(normalizeDecimal('000.5000')).toBe('0.5');
    expect(normalizeDecimal('9007199254740993.001')).toBe(
      '9007199254740993.001'
    );
    expect(normalizeDecimal('1e3')).toBeNull();
  });
});
