'use client';

import { useMessages } from '../../utils/messages';
import {
  dateToDisplayFormat,
  displayFormatToDateString,
} from '../../utils/date';

/**
 * MedicationEditor — prescription editor modal for a `Medication`.
 *
 * Captures the NCPDP SCRIPT NewRx `MedicationPrescribed` field set and codes
 * the drug via `CodeLookup` (RxNorm / FDB, offline). Used by
 * `MedicationReconciliation` for both **Correct** (edit) and **Add
 * Medication**, and usable directly:
 *
 * ```tsx
 * <MedicationEditor
 *   open={editing !== null}
 *   medication={editing ?? undefined}
 *   codeLookup={{ indexUrl: '/codify' }}
 *   onClose={() => setEditing(null)}
 *   onSave={(med) => upsert(med)}
 * />
 * ```
 *
 * NCPDP mapping (NewRx / MedicationPrescribed):
 *
 * | Editor field   | NCPDP element                          |
 * |----------------|----------------------------------------|
 * | Medication     | DrugDescription                        |
 * | Code           | DrugCoded (ProductCode / DrugDBCode)   |
 * | Strength       | Strength + StrengthUnitOfMeasure       |
 * | Dose form      | DrugCoded/FormCode                     |
 * | Quantity       | Quantity/Value                         |
 * | Quantity unit  | Quantity/QuantityUnitOfMeasure         |
 * | Days supply    | DaysSupply                             |
 * | Sig            | — (practitioner sig, expanded below)   |
 * | Patient sig    | Sig/SigText                            |
 * | Refills        | NumberOfRefills                        |
 * | Substitution   | Substitutions (0 permitted / 1 DAW)    |
 * | Start date     | WrittenDate / EffectiveDate            |
 * | Indication     | Diagnosis/Primary                      |
 * | Prescriber     | Prescriber                             |
 * | Pharmacy notes | Note                                   |
 */

import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Button, type ButtonProps } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Label } from '../Label';
import { RadioGroup, Radio } from '../Radio';
import { DateInput } from '../DateInput';
import { Select, type SelectOption } from '../Select';
import { MinusIcon, PlusIcon, TrashIcon } from '../Icons';
import type {
  Medication,
  MedicationCode,
  UncodedMedicationType,
  CompoundIngredient,
} from './MedicationList';
import {
  UNCODED_TYPE_LABELS,
  UNCODED_MEDICATION_TYPES,
} from './MedicationList';
import {
  calculateQuantity,
  expandSig,
  parseDurationDays,
  parseSig,
  sigDoseFor,
  type QuantityCalcFailure,
  type SigTerm,
} from './sig';
import { Calculator } from 'lucide-react';
import { Autocomplete } from '../Autocomplete';
import { cn } from '../../utils/cn';
import { useCodeLookupConfig } from '../CodeLookup/context';

// =============================================================================
// Types
// =============================================================================

/** Minimal shape of a CodeLookup selection the editor consumes. */
export interface MedicationLookupResult {
  label: string;
  codetype: string;
  fullcode: string;
}

/**
 * Structural subset of `CodeLookupProps` the editor uses. `CodeLookup`
 * satisfies this — it is injected (not imported) because its Web Worker
 * keeps it out of the library build (see CodeLookup/index.ts).
 */
export interface MedicationLookupProps {
  indexUrl: string;
  locale?: string;
  domains?: ('med' | 'condition')[];
  searchCodetypes?: string[];
  bare?: boolean;
  clearOnSelect?: boolean;
  placeholder?: string;
  initialQuery?: string;
  initialSearch?: boolean;
  onSelect?: (result: MedicationLookupResult) => void;
  /** The pick's family members (forms & strengths) — see `CodeLookup`. */
  onSelectFamily?: (
    members: MedicationLookupResult[],
    picked: MedicationLookupResult
  ) => void;
  onFreeText?: (text: string) => void;
}

/** CodeLookup wiring for the editor (component injected by the consumer). */
export interface CodeLookupConfig {
  /** The CodeLookup component: `import { CodeLookup } from '…/CodeLookup'` */
  component: React.ComponentType<MedicationLookupProps>;
  /** Base URL of the codify index, e.g. '/codify' */
  indexUrl: string;
  /** Shard locale (default 'en') */
  locale?: string;
}

/** One-click directions preset: chip label + the timing it fills in. The
 * editor puts the dose form's dose and route in front ("1 tab po", "apply
 * topically", "__ ml po" …), or uses the timing alone for an unknown form. */
export interface SigPreset {
  /** Chip text, e.g. "Twice a day with food" */
  label: string;
  /** Timing shorthand, e.g. "bid with food" */
  sig: string;
}

export interface MedicationEditorProps {
  /** Whether the editor is open */
  open: boolean;
  /** Medication being edited — omit for "add" mode */
  medication?: Medication;
  /**
   * Codify shard location for RxNorm/FDB coding. Defaults to the ambient
   * `CodeLookupProvider`; pass `false` to force a plain name input.
   */
  codeLookup?: CodeLookupConfig | false;
  /** Require a catalog selection for new or renamed medications; retain legacy entries. */
  requireCode?: boolean;
  /** Directions presets shown as chips above the sig (omit to hide) */
  sigPresets?: SigPreset[];
  /** Days-supply presets shown beside the field (default: 30, 90) */
  durationPresets?: number[];
  /** Prescribers to choose from — omit for a free-text prescriber input */
  prescribers?: SelectOption[];
  /**
   * Extra sig dictionary terms (e.g. rows from `rxlist_frequencies`), added
   * to — and overriding — the built-in vocabulary used to expand the sig,
   * derive route / frequency, and calculate quantity.
   */
  sigTerms?: SigTerm[];
  /**
   * Whether to collect structured ingredients for a compound medication
   * (`uncodedType === 'CP'`).
   */
  collectCompoundIngredients?: boolean;
  /** Called when the editor is dismissed without saving */
  onClose: () => void;
  /** Called with the complete medication on save */
  onSave: (medication: Medication) => void;
}

/** Shared editor options `MedicationReconciliation` passes through. */
export type MedicationEditorOptions = Pick<
  MedicationEditorProps,
  | 'sigPresets'
  | 'durationPresets'
  | 'prescribers'
  | 'sigTerms'
  | 'collectCompoundIngredients'
>;

// =============================================================================
// Parsers — drug label → strength/form, sig → route/frequency/PRN
// =============================================================================

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
function baseDoseForm(doseForm: string): string | undefined {
  const lower = doseForm.toLowerCase();
  return DOSE_FORMS.find((f) => lower.includes(f));
}

/** Quantity unit implied by a dose form (tablet → tablet, solution →
 * milliliter, …); unknown forms map to themselves. */
function formToUnit(doseForm: string): string {
  const base = baseDoseForm(doseForm);
  return base ? FORM_TO_UNIT[base] : doseForm;
}

/** "tablet" → "tablets", "patch" → "patches", "suppository" →
 * "suppositories"; "each" stays. */
function pluralUnit(unit: string): string {
  if (unit === 'each') return unit;
  if (/(?:s|x|ch|sh)$/.test(unit)) return `${unit}es`;
  if (/[^aeiou]y$/.test(unit)) return `${unit.slice(0, -1)}ies`;
  return `${unit}s`;
}

/** "tablet" → "Tablets" for a unit select option label. */
function unitLabel(unit: string): string {
  const plural = pluralUnit(unit);
  return plural.charAt(0).toUpperCase() + plural.slice(1);
}

/** Selectable quantity units (NCPDP QuantityUnitOfMeasure) — the dose
 * form's implied unit (via {@link formToUnit}) is the default, but some
 * providers prefer to dispense in a different unit (e.g. grams of a cream
 * instead of applications). */
const QUANTITY_UNITS = [
  'tablet',
  'capsule',
  'patch',
  'suppository',
  'spray',
  'drop',
  'each',
  'milliliter',
  'gram',
  'milligram',
  'microgram',
  'unit',
];

/** Unit select options, plus the current value if it isn't one of the
 * known units (e.g. an unrecognized dose form, or legacy data). */
function quantityUnitOptions(current?: string): SelectOption[] {
  const units =
    current && !QUANTITY_UNITS.includes(current)
      ? [current, ...QUANTITY_UNITS]
      : QUANTITY_UNITS;
  return units.map((unit) => ({ value: unit, label: unitLabel(unit) }));
}

/** Whether a quantity unit should keep following its dose form — unset, or
 * still equal to what that dose form implies (hasn't been manually
 * overridden via the unit dropdown). */
function unitFollowsForm(doseForm?: string, quantityUnit?: string): boolean {
  return !quantityUnit || quantityUnit === formToUnit(doseForm ?? '');
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

/** A preset's practitioner sig for a dose form, e.g. 'bid with food' on a
 * tablet → '1 tab po bid with food'. */
function presetSig(preset: SigPreset, doseForm?: string): string {
  return [sigDoseFor(doseForm), preset.sig].filter(Boolean).join(' ');
}

/** Patient sig plus the route / frequency / PRN derived from it. */
function patientSigFields(
  patientSig: string,
  terms?: SigTerm[]
): Partial<Medication> {
  const { route, frequency, prn } = parseSig(patientSig, terms);
  return { patientSig, route, frequency, prn: prn || undefined };
}

/**
 * Derive the label-parsed Medication fields — strength, dose form, and the
 * form-implied quantity unit — from a drug display label,
 * e.g. "lisinopril 10 mg tablet" → { strength: '10 mg', doseForm: 'tablet',
 * quantityUnit: 'tablet' }.
 */
export function labelToMedicationFields(label: string): Partial<Medication> {
  const { strength, doseForm } = parseMedicationLabel(label);
  return {
    ...(strength && { strength }),
    ...(doseForm && {
      doseForm,
      quantityUnit: doseFormToQuantityUnit(doseForm),
    }),
  };
}

/** Code reference for a CodeLookup pick. */
function lookupCode(result: MedicationLookupResult): MedicationCode {
  return {
    system: result.codetype,
    code: result.fullcode,
    display: result.label,
  };
}

/**
 * Derive Medication fields from a CodeLookup pick: name, code reference,
 * and — parsed from the label — strength, dose form, and quantity unit.
 * A coded medication has no uncoded type. Used by the editor and by inline
 * add-search flows.
 */
export function lookupToMedicationFields(
  result: MedicationLookupResult
): Partial<Medication> {
  return {
    name: result.label,
    code: lookupCode(result),
    uncodedType: undefined,
    ...labelToMedicationFields(result.label),
  };
}

/** A specific coded product of a drug, keyed by its strength + dose form. */
interface ProductOption {
  product: MedicationLookupResult;
  strength: string;
  doseForm: string;
}

/** Products in a pick's family — members whose label names both a strength
 * and a dose form (drops drug-name rows like "Xanax" / "Xanax Pill"). The
 * first member wins when two share a strength + dose form. */
function productOptions(members: MedicationLookupResult[]): ProductOption[] {
  const byKey = new Map<string, ProductOption>();
  for (const product of members) {
    const { strength, doseForm } = parseMedicationLabel(product.label);
    if (!strength || !doseForm) continue;
    const key = `${strength}|${doseForm}`;
    if (!byKey.has(key)) byKey.set(key, { product, strength, doseForm });
  }
  return [...byKey.values()];
}

const sameText = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** Distinct `pick` values of the options, narrowed by the other field when it
 * holds one of the option values. */
function distinctOptions(
  options: ProductOption[],
  pick: 'strength' | 'doseForm',
  other: string
): string[] {
  const otherKey = pick === 'strength' ? 'doseForm' : 'strength';
  const narrowed = options.some((o) => sameText(o[otherKey], other))
    ? options.filter((o) => sameText(o[otherKey], other))
    : options;
  const values = [...new Set(narrowed.map((o) => o[pick]))];
  return pick === 'strength'
    ? values.sort((a, b) => parseFloat(a) - parseFloat(b))
    : values.sort((a, b) => a.localeCompare(b));
}

function newId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Medication dates persist as ISO `yyyy-mm-dd`; the editor's date inputs edit
// MM/DD/YYYY. Convert at the editor boundary, passing through unrecognized
// values unchanged.
function isoDateToDisplay(value?: string): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dateToDisplayFormat(value)
    : value;
}

function displayDateToIso(value?: string): string | undefined {
  return value ? displayFormatToDateString(value) : value;
}

const DEFAULT_DURATION_PRESETS = [30, 90];

const QUANTITY_MESSAGES: Record<
  QuantityCalcFailure | 'no-form' | 'needs-input',
  string
> = {
  form: "Quantity can't be calculated for this dose form — enter it manually",
  blank: 'Fill in the __ amounts in the sig to calculate quantity',
  unparsed: 'Unable to calculate quantity',
  'no-form': 'Choose a dose form to calculate quantity',
  'needs-input': 'Enter the sig and days supply to calculate quantity',
};

/** What quantity is calculated from — a change triggers a recalculation. */
function calcInputs(med: Medication): string {
  return JSON.stringify([
    med.name,
    med.code?.code,
    med.strength,
    med.doseForm,
    med.sig || med.patientSig,
    parseDurationDays(med.daysSupply ?? ''),
  ]);
}
/** NCPDP NumberOfRefills is two digits. */
const MAX_REFILLS = 99;
const MAX_REFILLS_DIGITS = String(MAX_REFILLS).length;

/** Toggle-style preset button (directions / duration chips). */
function PresetChip({
  selected,
  className,
  ...props
}: Omit<ButtonProps, 'variant' | 'size'> & { selected: boolean }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? 'primary' : 'outline'}
      aria-pressed={selected}
      className={cn('shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

/** Compound / Supply toggles for an uncoded medication (pick one or none). */
function UncodedTypePicker({
  value,
  onChange,
}: {
  value?: UncodedMedicationType;
  onChange: (value: UncodedMedicationType | undefined) => void;
}) {
  const hintId = React.useId();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div
        role="group"
        aria-label="Uncoded medication type"
        aria-describedby={hintId}
        className="flex gap-2"
      >
        {UNCODED_MEDICATION_TYPES.map((type) => (
          <PresetChip
            key={type}
            selected={value === type}
            onClick={() => onChange(value === type ? undefined : type)}
          >
            {UNCODED_TYPE_LABELS[type]}
          </PresetChip>
        ))}
      </div>
      <p id={hintId} className="text-muted-foreground text-xs">
        To e-send an uncoded prescription, mark it as a compound or a supply.
      </p>
    </div>
  );
}

/** Text input that becomes an autocomplete when there are suggestions. */
function SuggestField({
  id,
  value,
  suggestions,
  placeholder,
  onChange,
  'aria-label': ariaLabel,
}: {
  id: string;
  value: string;
  suggestions: string[];
  placeholder: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
}) {
  if (suggestions.length === 0) {
    return (
      <Input
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  // Holding a suggestion lists them all, so switching needs no clearing.
  const showAll = suggestions.some((s) => sameText(s, value));
  return (
    <Autocomplete<string>
      items={suggestions}
      getItemKey={(s) => s}
      renderItem={(s) => s}
      filter={(s, q) =>
        showAll || s.toLowerCase().includes(q.trim().toLowerCase())
      }
      value={value}
      onValueChange={onChange}
      onSelect={onChange}
      minQueryLength={0}
      clearOnSelect={false}
      placeholder={placeholder}
      aria-label={ariaLabel}
      inputProps={{ id }}
    />
  );
}

/**
 * One row of a compound medication's structured ingredients: drug, form,
 * strength, quantity, and quantity unit. Drug uses the same injected
 * `CodeLookup` (or plain input) as the main medication field; form and
 * strength use the same autocomplete-capable `SuggestField` — without the
 * main field's drug-family (product) narrowing, since each ingredient is
 * coded independently.
 */
function CompoundIngredientRow({
  ingredient,
  index,
  codeLookup,
  onChange,
  onRemove,
}: {
  ingredient: CompoundIngredient;
  index: number;
  codeLookup?: CodeLookupConfig;
  onChange: (fields: Partial<CompoundIngredient>) => void;
  onRemove: () => void;
}) {
  const label = `ingredient ${index + 1}`;

  const handleDoseFormChange = (doseForm: string) => {
    onChange({
      doseForm,
      ...(unitFollowsForm(ingredient.doseForm, ingredient.quantityUnit) && {
        quantityUnit: formToUnit(doseForm.toLowerCase().trim()) || undefined,
      }),
    });
  };

  return (
    <div
      role="group"
      aria-label={`Ingredient ${index + 1}`}
      className="grid grid-cols-[2fr_1fr_1fr_0.8fr_1fr_2rem] items-center gap-2"
    >
      {codeLookup ? (
        <codeLookup.component
          indexUrl={codeLookup.indexUrl}
          locale={codeLookup.locale}
          domains={['med']}
          bare
          clearOnSelect={false}
          placeholder="Search RxNorm / FDB"
          initialQuery={ingredient.name || undefined}
          onSelect={(result) =>
            onChange({
              strength: undefined,
              doseForm: undefined,
              quantityUnit: undefined,
              ...lookupToMedicationFields(result),
            })
          }
          onFreeText={(text) => onChange({ name: text, code: undefined })}
        />
      ) : (
        <Input
          aria-label={`Drug, ${label}`}
          value={ingredient.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      )}
      <SuggestField
        id={`ingredient-${index}-form`}
        aria-label={`Form, ${label}`}
        value={ingredient.doseForm ?? ''}
        suggestions={[]}
        placeholder="Form"
        onChange={handleDoseFormChange}
      />
      <SuggestField
        id={`ingredient-${index}-strength`}
        aria-label={`Strength, ${label}`}
        value={ingredient.strength ?? ''}
        suggestions={[]}
        placeholder="Strength"
        onChange={(strength) => onChange({ strength })}
      />
      <Input
        aria-label={`Quantity, ${label}`}
        inputMode="decimal"
        className="min-w-0"
        value={ingredient.quantity ?? ''}
        onChange={(e) => onChange({ quantity: e.target.value })}
      />
      <Select
        label={`Quantity unit, ${label}`}
        hideLabel
        placeholder="Unit"
        options={quantityUnitOptions(ingredient.quantityUnit)}
        value={ingredient.quantityUnit}
        onValueChange={(quantityUnit) => onChange({ quantityUnit })}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        <TrashIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Refills count (0–99) with −/+ buttons; the input stays typeable. */
function RefillsStepper({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = Number.parseInt(value, 10);
  const count = Number.isFinite(parsed) ? parsed : 0;
  const step = (delta: number) =>
    onChange(String(Math.min(MAX_REFILLS, Math.max(0, count + delta))));

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Decrease refills"
        aria-controls={id}
        disabled={count <= 0}
        onClick={() => step(-1)}
      >
        <MinusIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Input
        id={id}
        inputMode="numeric"
        maxLength={MAX_REFILLS_DIGITS}
        className="w-11 px-2 text-center"
        value={value}
        // Digits only; the length cap keeps typed values within 0–99.
        onChange={(e) =>
          onChange(
            e.target.value.replace(/\D/g, '').slice(0, MAX_REFILLS_DIGITS)
          )
        }
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Increase refills"
        aria-controls={id}
        disabled={count >= MAX_REFILLS}
        onClick={() => step(1)}
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

// =============================================================================
// MedicationEditor
// =============================================================================

export function MedicationEditor({
  open,
  medication,
  codeLookup,
  requireCode = false,
  sigPresets,
  durationPresets = DEFAULT_DURATION_PRESETS,
  prescribers,
  sigTerms,
  collectCompoundIngredients,
  onClose,
  onSave,
}: MedicationEditorProps): React.JSX.Element | null {
  const m = useMessages();
  // Default the lookup to the ambient provider; `false` forces plain text.
  const ambientCodeLookup = useCodeLookupConfig();
  const effectiveCodeLookup: CodeLookupConfig | undefined =
    codeLookup === false
      ? undefined
      : (codeLookup ?? ambientCodeLookup ?? undefined);

  // Sig helpers with the host's dictionary terms
  const expand = (shorthand: string) => expandSig(shorthand, sigTerms);
  const sigFieldsFor = (patientSig: string) =>
    patientSigFields(patientSig, sigTerms);

  const [draft, setDraft] = React.useState<Medication>(() =>
    medication
      ? {
          ...medication,
          startDate: isoDateToDisplay(medication.startDate),
          endDate: isoDateToDisplay(medication.endDate),
          // Records saved before `patientSig` existed only carry `sig`.
          ...(medication.patientSig === undefined &&
            medication.sig &&
            sigFieldsFor(expand(medication.sig))),
        }
      : { id: newId(), name: '', status: 'unreconciled' }
  );

  // NOTE: draft state is seeded once per mount — give the editor a `key`
  // (e.g. the medication id) so a different target remounts it.

  // The patient sig follows the expansion of the practitioner sig until
  // edited by hand. A patient sig that didn't come from it is never
  // overwritten.
  const [patientSigFollows, setPatientSigFollows] = React.useState(
    () =>
      !medication?.patientSig ||
      medication.patientSig === expand(medication.sig ?? '')
  );

  // Focus the medication search / name input when the dialog opens.
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const input = bodyRef.current?.querySelector('input');
    input?.focus();
  }, []);

  // The last preset applied; its dose follows the dose form until the
  // practitioner sig is edited by hand.
  const [appliedPreset, setAppliedPreset] = React.useState<SigPreset | null>(
    null
  );

  const patch = (p: Partial<Medication>) =>
    setDraft((prev) => {
      const next = { ...prev, ...p };
      if (!appliedPreset || next.doseForm === prev.doseForm) return next;
      const sig = presetSig(appliedPreset, next.doseForm);
      return {
        ...next,
        sig,
        ...(patientSigFollows && sigFieldsFor(expand(sig))),
      };
    });

  // A drug-level pick ("Xanax", no strength or form) offers its products'
  // strengths and dose forms; choosing them codes the specific product.
  const [drugFamily, setDrugFamily] = React.useState<{
    drug: MedicationLookupResult;
    options: ProductOption[];
  } | null>(null);
  /** The current coded pick — family replies for anything else are stale. */
  const lastPickRef = React.useRef<MedicationLookupResult | null>(null);

  const handleCodeSelect = (result: MedicationLookupResult) => {
    if (requireCode && (!result.codetype.trim() || !result.fullcode.trim()))
      return;
    // Populate strength / dose form / quantity unit from the coded label,
    // dropping the previous drug's values when the new label has none.
    lastPickRef.current = result;
    setDrugFamily(null);
    patch({
      strength: undefined,
      doseForm: undefined,
      quantityUnit: undefined,
      ...lookupToMedicationFields(result),
    });
  };

  const handleCodeFamily = (
    members: MedicationLookupResult[],
    picked: MedicationLookupResult
  ) => {
    // The family arrives after the pick; ignore it if the user has since
    // picked something else or switched to free text.
    const current = lastPickRef.current;
    if (
      current?.codetype !== picked.codetype ||
      current.fullcode !== picked.fullcode
    ) {
      return;
    }
    const { strength, doseForm } = parseMedicationLabel(picked.label);
    if (strength && doseForm) return; // already a specific product
    const options = productOptions(members);
    setDrugFamily(options.length > 0 ? { drug: picked, options } : null);
  };

  const handleStrengthFormChange = (
    fields: { strength: string } | { doseForm: string }
  ) => {
    const next = {
      strength: draft.strength ?? '',
      doseForm: draft.doseForm ?? '',
      ...fields,
    };
    const typed: Partial<Medication> = {
      ...fields,
      // Quantity unit follows the dose form (tablet → tablet, solution →
      // milliliter, …) until manually overridden via the unit dropdown.
      ...('doseForm' in fields &&
        unitFollowsForm(draft.doseForm, draft.quantityUnit) && {
          quantityUnit:
            formToUnit(fields.doseForm.toLowerCase().trim()) || undefined,
        }),
    };
    if (!drugFamily) return patch(typed);

    const matches = drugFamily.options.filter(
      (o) =>
        (!next.strength.trim() || sameText(o.strength, next.strength)) &&
        (!next.doseForm.trim() || sameText(o.doseForm, next.doseForm))
    );
    const specified = next.strength.trim() || next.doseForm.trim();
    if (specified && matches.length === 1) {
      // One product left — code it (fills the other field too).
      patch(lookupToMedicationFields(matches[0].product));
    } else {
      // Ambiguous or unknown combination — stay coded at the drug level.
      const { drug } = drugFamily;
      patch({ ...typed, name: drug.label, code: lookupCode(drug) });
    }
  };

  // —— Compound ingredients ——
  // At least one (possibly blank) row is always shown — editing it lazily
  // creates the real entry in `compoundIngredients`; it's dropped on save
  // if left blank (see the Save handler).
  const ingredientRows = (): CompoundIngredient[] =>
    draft.compoundIngredients && draft.compoundIngredients.length > 0
      ? draft.compoundIngredients
      : [{ name: '' }];

  const addIngredient = () =>
    patch({ compoundIngredients: [...ingredientRows(), { name: '' }] });

  const patchIngredient = (
    index: number,
    fields: Partial<CompoundIngredient>
  ) =>
    patch({
      compoundIngredients: ingredientRows().map((ing, i) =>
        i === index ? { ...ing, ...fields } : ing
      ),
    });

  const removeIngredient = (index: number) =>
    patch({
      compoundIngredients: ingredientRows().filter((_, i) => i !== index),
    });

  const codeHint = (() => {
    if (!draft.code) {
      return draft.name
        ? m('Uncoded free text: "{name}" — pick a result to code it', {
            name: draft.name,
          })
        : requireCode
          ? m('Pick a catalog result to code the medication')
          : m(
              'Pick a result to code the medication, or press Enter for free text'
            );
    }
    const coded = m('Coded: {system} {code}', {
      system: draft.code.system,
      code: draft.code.code,
    });
    if (!drugFamily) return coded;
    const { drug } = drugFamily;
    return draft.code.system === drug.codetype &&
      draft.code.code === drug.fullcode
      ? `${coded} — choose a strength and dose form to code the product`
      : `${coded} (${draft.name})`;
  })();

  const handlePatientSigChange = (patientSig: string) => {
    // Hand-editing the patient sig stops it following the practitioner sig;
    // clearing it resumes.
    setPatientSigFollows(patientSig.trim() === '');
    patch(sigFieldsFor(patientSig));
  };

  const handleSigChange = (sig: string) => {
    setAppliedPreset(null);
    patch({
      sig,
      ...(patientSigFollows && sigFieldsFor(expand(sig))),
    });
  };

  const handlePresetSelect = (preset: SigPreset) => {
    // A preset is an explicit choice — it always rewrites the patient sig.
    const sig = presetSig(preset, draft.doseForm);
    const fields = { sig, ...sigFieldsFor(expand(sig)) };
    setAppliedPreset(preset);
    setPatientSigFollows(true);
    patch(fields);
    recalculateQuantity({ ...draft, ...fields });
  };

  // —— Quantity calculation ——
  // Recalculated when focus leaves a field after the drug, strength, dose
  // form, sig, or days supply changed (or a preset / Calculate is clicked);
  // overwrites the quantity, like the current product.
  const [quantityNote, setQuantityNote] = React.useState<string | null>(null);
  const lastCalcInputs = React.useRef(calcInputs(draft));
  const ingredientsHeadingId = React.useId();

  const recalculateQuantity = (med: Medication, explicit = false) => {
    lastCalcInputs.current = calcInputs(med);
    const sig = (med.sig || med.patientSig || '').trim();
    const days = parseDurationDays(med.daysSupply ?? '');
    if (!sig || days <= 0) {
      setQuantityNote(explicit ? QUANTITY_MESSAGES['needs-input'] : null);
      return;
    }
    const result = calculateQuantity({
      sig,
      days,
      doseForm: med.doseForm,
      strength: med.strength,
      terms: sigTerms,
    });
    if ('quantity' in result) {
      patch({ quantity: String(result.quantity) });
      setQuantityNote(null);
      return;
    }
    // The form is calculable but the sig can't be worked out: clear the
    // stale quantity (current product). Non-calculable forms (creams, …)
    // keep a manually entered quantity.
    if (result.reason !== 'form') patch({ quantity: '' });
    setQuantityNote(
      QUANTITY_MESSAGES[
        result.reason === 'form' && !med.doseForm?.trim()
          ? 'no-form'
          : result.reason
      ]
    );
  };

  const handleFieldBlur = () => {
    if (calcInputs(draft) !== lastCalcInputs.current) {
      recalculateQuantity(draft);
    }
  };

  const handleDurationPreset = (days: number) => {
    patch({ daysSupply: String(days) });
    recalculateQuantity({ ...draft, daysSupply: String(days) });
  };

  const handleDaysBlur = () => {
    // "2w" / "1m 2w" → days
    const days = parseDurationDays(draft.daysSupply ?? '');
    if (days > 0 && String(days) !== draft.daysSupply?.trim()) {
      patch({ daysSupply: String(days) });
    }
  };

  const hasCode = Boolean(draft.code?.system.trim() && draft.code.code.trim());
  // Only records that were uncoded on entry are exempt from requireCode —
  // an originally coded medication must keep (or replace) its code.
  const unchangedLegacyName =
    medication && !medication.code && draft.name === medication.name;
  const canSave =
    draft.name.trim().length > 0 &&
    (!requireCode || hasCode || Boolean(unchangedLegacyName));

  if (!open) return null;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="2xl">
      <ModalHeader>
        <ModalTitle>
          {medication ? m('Correct Medication') : m('Add Medication')}
        </ModalTitle>
        <ModalClose aria-label={m('Close')} />
      </ModalHeader>
      <ModalBody>
        <div ref={bodyRef} className="space-y-5" onBlur={handleFieldBlur}>
          {/* ——— Medication + coding ——— */}
          <section className="space-y-3" aria-label={m('Medication')}>
            {effectiveCodeLookup ? (
              <div className="space-y-1.5">
                <Label htmlFor="med-search">{m('Medication')}</Label>
                <effectiveCodeLookup.component
                  indexUrl={effectiveCodeLookup.indexUrl}
                  locale={effectiveCodeLookup.locale}
                  domains={['med']}
                  bare
                  clearOnSelect={false}
                  placeholder={m('Search RxNorm / FDB — e.g. lisinopril')}
                  // Seed the search box with the medication name. Editing an
                  // uncoded medication also runs the search immediately so the
                  // closest coded matches are offered (a pick fills coding,
                  // strength, and dose form); coded ones just show their name.
                  initialQuery={medication?.name || undefined}
                  initialSearch={medication ? !medication.code : undefined}
                  onSelect={handleCodeSelect}
                  onSelectFamily={handleCodeFamily}
                  onFreeText={
                    requireCode
                      ? undefined
                      : (text) => {
                          lastPickRef.current = null;
                          setDrugFamily(null);
                          patch({ name: text, code: undefined });
                        }
                  }
                />
                <p className="text-muted-foreground text-xs" aria-live="polite">
                  {codeHint}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="med-name">{m('Medication')}</Label>
                <Input
                  id="med-name"
                  value={draft.name}
                  readOnly={requireCode}
                  onChange={(e) =>
                    patch({ name: e.target.value, code: undefined })
                  }
                />
              </div>
            )}
            {!draft.code && draft.name.trim() && (
              <UncodedTypePicker
                value={draft.uncodedType}
                onChange={(uncodedType) => patch({ uncodedType })}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-strength">{m('Strength')}</Label>
                <SuggestField
                  id="med-strength"
                  value={draft.strength ?? ''}
                  suggestions={
                    drugFamily
                      ? distinctOptions(
                          drugFamily.options,
                          'strength',
                          draft.doseForm ?? ''
                        )
                      : []
                  }
                  placeholder="Choose a strength"
                  onChange={(strength) =>
                    handleStrengthFormChange({ strength })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-form">{m('Dose form')}</Label>
                <SuggestField
                  id="med-form"
                  value={draft.doseForm ?? ''}
                  suggestions={
                    drugFamily
                      ? distinctOptions(
                          drugFamily.options,
                          'doseForm',
                          draft.strength ?? ''
                        )
                      : []
                  }
                  placeholder="Choose a dose form"
                  onChange={(doseForm) =>
                    handleStrengthFormChange({ doseForm })
                  }
                />
              </div>
            </div>
            {collectCompoundIngredients && draft.uncodedType === 'CP' && (
              <div
                role="group"
                aria-labelledby={ingredientsHeadingId}
                className="space-y-2"
              >
                <p
                  id={ingredientsHeadingId}
                  className="text-foreground text-sm font-medium"
                >
                  Ingredients
                </p>
                <div
                  aria-hidden="true"
                  className="grid grid-cols-[2fr_1fr_1fr_0.8fr_1fr_2rem] gap-2"
                >
                  <span className="text-muted-foreground text-xs font-medium">
                    Drug
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    Form
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    Strength
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    Quantity
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    Unit
                  </span>
                  <span />
                </div>
                {ingredientRows().map((ingredient, index) => (
                  <CompoundIngredientRow
                    key={index}
                    index={index}
                    ingredient={ingredient}
                    codeLookup={effectiveCodeLookup}
                    onChange={(fields) => patchIngredient(index, fields)}
                    onRemove={() => removeIngredient(index)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  Add ingredient
                </Button>
              </div>
            )}
          </section>

          {/* ——— Directions ——— */}
          <section className="space-y-3" aria-label={m('Directions')}>
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {m('Directions')}
            </h4>
            {sigPresets && sigPresets.length > 0 && (
              <div
                role="group"
                aria-label="Directions presets"
                className="flex flex-wrap gap-2"
              >
                {sigPresets.map((preset) => {
                  const sig = presetSig(preset, draft.doseForm);
                  return (
                    <PresetChip
                      key={`${preset.label}|${preset.sig}`}
                      selected={draft.sig === sig}
                      title={sig}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.label}
                    </PresetChip>
                  );
                })}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="med-sig">{m('Practitioner sig')}</Label>
              <Input
                id="med-sig"
                placeholder="e.g. 1 tab po bid with food"
                aria-describedby="med-sig-hint"
                value={draft.sig ?? ''}
                onChange={(e) => handleSigChange(e.target.value)}
              />
              <p id="med-sig-hint" className="text-muted-foreground text-xs">
                Shorthand expands into the patient directions below
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-patient-sig">Sig (patient directions)</Label>
              <Textarea
                id="med-patient-sig"
                richText={false}
                value={draft.patientSig ?? ''}
                onChange={(e) => handlePatientSigChange(e.target.value)}
                rows={2}
              />
              <p className="text-muted-foreground text-xs" aria-live="polite">
                {draft.route || draft.frequency || draft.prn ? (
                  <>
                    {m('Derived:')}{' '}
                    {[
                      draft.route && m('route {route}', { route: draft.route }),
                      draft.frequency && m(draft.frequency.toLowerCase()),
                      draft.prn && m('PRN (as needed)'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </>
                ) : (
                  m('Route, frequency, and PRN are derived from the directions')
                )}
              </p>
            </div>
          </section>

          {/* ——— Prescription ——— */}
          <section className="space-y-3" aria-label="Prescription">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Prescription
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-days">Days supply</Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="med-days"
                    className="min-w-0"
                    value={draft.daysSupply ?? ''}
                    onChange={(e) => patch({ daysSupply: e.target.value })}
                    onBlur={handleDaysBlur}
                  />
                  {durationPresets.map((days) => (
                    <PresetChip
                      key={days}
                      selected={draft.daysSupply === String(days)}
                      // starts with the visible text so voice control works
                      aria-label={`${days}d, ${days} days supply`}
                      onClick={() => handleDurationPreset(days)}
                    >
                      {days}d
                    </PresetChip>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-refills">Refills</Label>
                <RefillsStepper
                  id="med-refills"
                  value={draft.refills ?? ''}
                  onChange={(refills) => patch({ refills })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-qty">Quantity</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="med-qty"
                  inputMode="decimal"
                  className="min-w-0"
                  aria-describedby="med-qty-note"
                  value={draft.quantity ?? ''}
                  onChange={(e) => patch({ quantity: e.target.value })}
                />
                <Select
                  id="med-qty-unit"
                  label="Quantity unit"
                  hideLabel
                  className="w-40 shrink-0"
                  placeholder="Select unit"
                  options={quantityUnitOptions(draft.quantityUnit)}
                  value={draft.quantityUnit}
                  onValueChange={(quantityUnit) => patch({ quantityUnit })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Calculate quantity"
                  title="Calculate quantity from the sig and days supply"
                  onClick={() => recalculateQuantity(draft, true)}
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <p
                id="med-qty-note"
                role="status"
                aria-live="polite"
                className="text-destructive text-xs empty:hidden"
              >
                {quantityNote}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-indication">Indication</Label>
                <Input
                  id="med-indication"
                  value={draft.indication ?? ''}
                  onChange={(e) => patch({ indication: e.target.value })}
                />
              </div>
              {prescribers ? (
                <Select
                  id="med-prescriber"
                  label="Prescriber"
                  placeholder="Select prescriber"
                  options={prescribers}
                  value={draft.prescriber}
                  onValueChange={(prescriber) => patch({ prescriber })}
                />
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="med-prescriber">Prescriber</Label>
                  <Input
                    id="med-prescriber"
                    value={draft.prescriber ?? ''}
                    onChange={(e) => patch({ prescriber: e.target.value })}
                  />
                </div>
              )}
            </div>
            <RadioGroup
              name="med-substitution"
              label="Substitution"
              value={draft.substitution ?? '0'}
              onValueChange={(v) => patch({ substitution: v as '0' | '1' })}
              orientation="horizontal"
              size="sm"
            >
              <Radio value="0" label="Substitution permitted" />
              <Radio value="1" label="Dispense as written (DAW)" />
            </RadioGroup>
          </section>

          {/* ——— Dates & notes ——— */}
          <section className="space-y-3" aria-label={m('Dates and notes')}>
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {m('Dates & notes')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-start">{m('Start date')}</Label>
                <DateInput
                  id="med-start"
                  showCalendar
                  value={draft.startDate ?? ''}
                  onChange={(v) => patch({ startDate: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-end">{m('End date')}</Label>
                <DateInput
                  id="med-end"
                  showCalendar
                  value={draft.endDate ?? ''}
                  onChange={(v) => patch({ endDate: v })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-pharmacy-notes">{m('Pharmacy notes')}</Label>
              <Textarea
                id="med-pharmacy-notes"
                richText={false}
                value={draft.pharmacyNotes ?? ''}
                onChange={(e) => patch({ pharmacyNotes: e.target.value })}
                rows={2}
              />
            </div>
          </section>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {m('Cancel')}
        </Button>
        <Button
          onClick={() => {
            const uncodedType = draft.code ? undefined : draft.uncodedType;
            onSave({
              ...draft,
              name: draft.name.trim(),
              startDate: displayDateToIso(draft.startDate),
              endDate: displayDateToIso(draft.endDate),
              // only an uncoded medication has an uncoded type
              uncodedType,
              // ingredients only apply to a compound; drop blank rows
              compoundIngredients:
                uncodedType === 'CP'
                  ? draft.compoundIngredients?.filter((i) => i.name.trim())
                  : undefined,
            });
            onClose();
          }}
          disabled={!canSave}
        >
          {m('Save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default MedicationEditor;
