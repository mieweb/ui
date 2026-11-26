/**
 * Pure drug-label parsers shared by `MedicationEditor` and the
 * MedHistoryReconciliation scorer: dose forms, strength, and the quantity
 * unit a dose form implies. No React — safe to import from pure modules.
 */

const DOSE_FORMS = [
  'tablet',
  'capsule',
  'solution',
  'suspension',
  'syrup',
  'cream',
  'ointment',
  'gel',
  'patch',
  'suppository',
  'spray',
  'drops',
  'inhaler',
  'injection',
  'lozenge',
  'powder',
  'film',
];

/** Quantity unit implied by each dose form (NCPDP QuantityUnitOfMeasure). */
const FORM_TO_UNIT: Record<string, string> = {
  tablet: 'tablet',
  capsule: 'capsule',
  solution: 'milliliter',
  suspension: 'milliliter',
  syrup: 'milliliter',
  cream: 'gram',
  ointment: 'gram',
  gel: 'gram',
  patch: 'patch',
  suppository: 'suppository',
  spray: 'spray',
  drops: 'milliliter',
  inhaler: 'each',
  injection: 'milliliter',
  lozenge: 'each',
  powder: 'gram',
  film: 'each',
};

/** Strength amount + unit, e.g. "20 mg", "0.5 mg/ml" (global: all matches).
 * Bounded quantifiers keep matching linear-time on adversarial inputs
 * (unbounded \d+ groups backtrack polynomially on long digit runs). */
const STRENGTH_RE =
  /(\d{1,7}(?:\.\d{1,4})?(?:\s{0,4}\/\s{0,4}\d{1,7}(?:\.\d{1,4})?)?)\s{0,4}(mg\/ml|mcg\/ml|mg|mcg|g|ml|units?|%|meq)\b/g;

/** Base dose form a (possibly qualified) form names, e.g.
 * "tablet,extended release" → "tablet". */
export function baseDoseForm(doseForm: string): string | undefined {
  const lower = doseForm.toLowerCase();
  return DOSE_FORMS.find((f) => lower.includes(f));
}

/** Quantity unit implied by a dose form (tablet → tablet, solution →
 * milliliter, …); unknown forms map to themselves. */
export function formToUnit(doseForm: string): string {
  const base = baseDoseForm(doseForm);
  return base ? FORM_TO_UNIT[base] : doseForm;
}

/**
 * Quantity unit implied by a dose form (tablet → tablet, solution →
 * milliliter, …); unrecognized forms fall back to the form itself. Keeps
 * dose-form qualifiers working ("tablet,extended release" → "tablet") by
 * delegating to {@link formToUnit}'s base-form match.
 */
export function doseFormToQuantityUnit(doseForm: string): string | undefined {
  return formToUnit(doseForm) || undefined;
}

/**
 * Parse strength + dose form out of a coded drug label,
 * e.g. "lisinopril 20 mg tablet" → { strength: '20 mg', doseForm: 'tablet' }.
 * The dose form keeps its qualifiers so products stay distinct:
 * "Xanax XR 1 mg tablet,extended release" → 'tablet,extended release'.
 */
export function parseMedicationLabel(label: string): {
  strength?: string;
  doseForm?: string;
} {
  const lower = label.toLowerCase();
  const matches = [...lower.matchAll(STRENGTH_RE)];
  const first = matches[0];
  const last = matches[matches.length - 1];
  const base = baseDoseForm(lower);
  let doseForm = base;
  if (base && last) {
    // The form is what follows the (last) strength, minus "[Brand]" tags.
    const tail = lower
      .slice((last.index ?? 0) + last[0].length)
      .replace(/\[[^\]]{0,200}\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (tail.includes(base)) doseForm = tail;
  }
  return {
    strength: first ? `${first[1].replace(/\s+/g, '')} ${first[2]}` : undefined,
    doseForm,
  };
}
