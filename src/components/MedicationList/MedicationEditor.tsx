'use client';

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
 * | Directions     | Sig/SigText                            |
 * | Refills        | NumberOfRefills                        |
 * | Substitution   | Substitutions (0 permitted / 1 DAW)    |
 * | Therapy start  | EffectiveDate (written date is host-owned)            |
 * | Indication     | Diagnosis/Primary                      |
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
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Label } from '../Label';
import { RadioGroup, Radio } from '../Radio';
import { DateInput } from '../DateInput';
import { Checkbox } from '../Checkbox';
import { Select } from '../Select';
import { currentAssertion, type ConditionConcern } from '../ProblemList';
import { normalizeConditionCodingSystem } from '../ConditionEditor';
import {
  PrescriptionIssueSummary,
  getPrescriptionIssues,
  usePrescriptionClock,
  usePrescriptionPreview,
  type PrescriptionValidationOptions,
} from '../PrescriptionReadiness';
import type {
  PrescriptionIssue,
  PrescriptionReadiness,
  PrescriptionValidationContext,
  ControlledSchedule,
} from '../../prescribing/types';
import type { Medication } from './MedicationList';
import { useCodeLookupConfig } from '../CodeLookup/context';

// =============================================================================
// Types
// =============================================================================

/** Minimal shape of a CodeLookup selection the editor consumes. */
export interface MedicationLookupResult {
  label: string;
  codetype: string;
  fullcode: string;
  /** Coding-system release supplied by the authoritative catalog adapter. */
  codeVersion?: string;
  /** Verified product metadata supplied by the host's catalog adapter, never parsed from label. */
  productId?: string;
  strength?: string;
  doseForm?: string;
  quantityUnit?: string;
  quantityUnits?: string[];
  conceptSpecificity?: 'product' | 'ingredient' | 'compound';
  controlledSchedule?: ControlledSchedule;
  observedAt?: string;
  sourceId?: string;
}

/**
 * Structural subset of `CodeLookupProps` the editor uses. `CodeLookup`
 * satisfies this — it is injected (not imported) because its Web Worker
 * keeps it out of the library build (see CodeLookup/index.ts).
 */
export interface MedicationLookupProps {
  indexUrl: string;
  locale?: string;
  domains?: 'med'[];
  bare?: boolean;
  clearOnSelect?: boolean;
  placeholder?: string;
  initialQuery?: string;
  initialSearch?: boolean;
  /** Freeze the search input and result actions during an asynchronous save. */
  disabled?: boolean;
  /** Associate the injected search input with its inline prescription alerts. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  onSelect?: (result: MedicationLookupResult) => void;
  onFreeText?: (text: string) => void;
  /** Persist draft edits immediately, before a result or free-text submission. */
  onQueryChange?: (text: string) => void;
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

/** A condition code selected as the concern treated by this medication. */
export interface IndicationLookupResult {
  label: string;
  codetype: string;
  fullcode: string;
  codeVersion?: string;
  /** Catalog identity; never used as a chart concern's durable concernId. */
  fullid?: string;
}

/** Worker-free injection contract for a condition-domain CodeLookup. */
export interface IndicationLookupProps extends Omit<
  MedicationLookupProps,
  'domains' | 'onSelect'
> {
  domains?: 'condition'[];
  onSelect?: (result: IndicationLookupResult) => void;
}

export interface IndicationCodeLookupConfig {
  component: React.ComponentType<IndicationLookupProps>;
  indexUrl: string;
  locale?: string;
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
  /** Condition-domain Codify search, defaulting to the ambient provider. */
  indicationCodeLookup?: IndicationCodeLookupConfig | false;
  /** Existing chart concerns available as durable indication links. */
  indicationConcerns?: ConditionConcern[];
  /** Called when the editor is dismissed without saving */
  onClose: () => void;
  /** Called with the complete medication on save */
  onSave: (medication: Medication) => void | Promise<void>;
  /** Shared validator inputs. No checks run or alerts appear when omitted. */
  prescribing?: PrescriptionValidationOptions;
  /** Latest host evaluation. Edited values always fall back to a new local preview. */
  readiness?: PrescriptionReadiness;
  prescriptionNow?: string;
  /** Field path to focus when completing an order. */
  initialIssueField?: string;
  /** Host navigation for patient, prescriber, pharmacy, clinical, or system issues. */
  onIssueAction?: (issue: PrescriptionIssue) => void;
  /** Editor is display-only; unresolved issues remain visible. */
  readOnly?: boolean;
}

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

/**
 * Parse strength + dose form out of a coded drug label,
 * e.g. "lisinopril 20 mg tablet" → { strength: '20 mg', doseForm: 'tablet' }.
 */
export function parseMedicationLabel(label: string): {
  strength?: string;
  doseForm?: string;
} {
  const lower = label.toLowerCase();
  // bounded quantifiers keep the match linear-time on adversarial inputs
  // (unbounded \d+ groups backtrack polynomially on long digit runs)
  const strengthMatch = lower.match(
    /(\d{1,7}(?:\.\d{1,4})?(?:\s{0,4}\/\s{0,4}\d{1,7}(?:\.\d{1,4})?)?)\s{0,4}(mg\/ml|mcg\/ml|mg|mcg|g|ml|units?|%|meq)\b/
  );
  const doseForm = DOSE_FORMS.find((f) => lower.includes(f));
  return {
    strength: strengthMatch
      ? `${strengthMatch[1].replace(/\s+/g, '')} ${strengthMatch[2]}`
      : undefined,
    doseForm,
  };
}

const SIG_ROUTES: [RegExp, string][] = [
  [/\bby mouth\b|\boral(ly)?\b|\bpo\b/, 'oral'],
  [/\bsublingual(ly)?\b|\bunder the tongue\b|\bsl\b/, 'sublingual'],
  [/\bsubcutaneous(ly)?\b|\bsubq\b|\bsc\b|\bsq\b/, 'subcutaneous'],
  [/\bintramuscular(ly)?\b|\bim\b/, 'intramuscular'],
  [/\bintravenous(ly)?\b|\biv\b/, 'intravenous'],
  [/\binhal(e|ation|ed)\b|\bpuffs?\b|\bnebuliz/, 'inhalation'],
  [/\beyes?\b|\bophthalmic\b/, 'ophthalmic'],
  [/\bears?\b|\botic\b/, 'otic'],
  [/\bnostrils?\b|\bnasal(ly)?\b|\bintranasal/, 'nasal'],
  [/\brectal(ly)?\b|\bpr\b/, 'rectal'],
  [/\btransdermal\b|\bto (the )?skin\b|\bapply\b|\btopical(ly)?\b/, 'topical'],
];

// Order matters: specific patterns must precede the bare-"daily" fallback
// ("twice daily" must not match Once daily's \bdaily\b).
const SIG_FREQUENCIES: [RegExp, string][] = [
  [/\bevery other day\b|\bqod\b/, 'Every other day'],
  [/\btwice (a |per )?day\b|\btwice daily\b|\bbid\b/, 'Twice daily'],
  [
    /\b(three times|3 times)( a| per)? day\b|\b(three times|3 times) daily\b|\btid\b/,
    'Three times daily',
  ],
  [
    /\b(four times|4 times)( a| per)? day\b|\b(four times|4 times) daily\b|\bqid\b/,
    'Four times daily',
  ],
  [/\bevery morning\b|\bqam\b/, 'Every morning'],
  [/\b(at )?bedtime\b|\bqhs\b|\bat night\b/, 'Every bedtime'],
  [/\bweekly\b|\bonce a week\b|\bevery week\b/, 'Weekly'],
  [
    /\bonce (a |per )?day\b|\bonce daily\b|\bdaily\b|\bevery day\b|\bqd\b/,
    'Once daily',
  ],
];

/**
 * Derive route / frequency / PRN from free-text sig,
 * e.g. "1 tablet by mouth daily as needed" →
 * { route: 'oral', frequency: 'Once daily', prn: true }.
 */
export function parseSig(sig: string): {
  route?: string;
  frequency?: string;
  prn: boolean;
} {
  const lower = sig.toLowerCase();
  const route = SIG_ROUTES.find(([re]) => re.test(lower))?.[1];
  const frequency = SIG_FREQUENCIES.find(([re]) => re.test(lower))?.[1];
  const prn = /\bas needed\b|\bprn\b/.test(lower);
  return { route, frequency, prn };
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
      quantityUnit: FORM_TO_UNIT[doseForm] ?? doseForm,
    }),
  };
}

/**
 * Derive Medication fields from a CodeLookup pick: name, code reference,
 * and optional authoritative catalog metadata. Label parsing remains an
 * explicit suggestion helper and never supplies a confirmed product.
 * Used by inline add-search flows.
 */
export function lookupToMedicationFields(
  result: MedicationLookupResult
): Partial<Medication> {
  return {
    name: result.label,
    code: {
      system: result.codetype,
      code: result.fullcode,
      display: result.label,
      ...(result.codeVersion !== undefined && { version: result.codeVersion }),
    },
    productId: result.productId,
    strength: result.strength,
    doseForm: result.doseForm,
    quantityUnit: result.quantityUnit,
  };
}

function newId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Compare Codify aliases with canonical FHIR coding-system identifiers. */
function indicationCodingSystemKey(system: string): string {
  const uri = system.toLowerCase().replace(/\/$/, '');
  if (uri === 'http://snomed.info/sct') return 'SNOMED';
  if (uri === 'http://hl7.org/fhir/sid/icd-10-cm') return 'ICD-10-CM';
  return normalizeConditionCodingSystem(system);
}

/** Product/coding issues belong beside the visible medication search. */
function editorIssueField(fieldPath?: string): string | undefined {
  const field = fieldPath?.replace(/^(draft|prescription)\./, '');
  if (
    [
      'productId',
      'code',
      'context.product',
      'context.controlledSchedule',
      'display',
    ].some((alias) => field === alias || field?.startsWith(`${alias}.`))
  )
    return 'name';
  if (field === 'context.pharmacy') return 'pharmacyId';
  if (
    field === 'concernId' ||
    field === 'indicationCode' ||
    field?.startsWith('indicationCode.')
  )
    return 'indication';
  return field;
}

function isEditableFieldError(issue: PrescriptionIssue): boolean {
  return (
    issue.severity === 'error' &&
    issue.remediation === 'edit-prescription' &&
    !issue.fieldPath?.startsWith('context.')
  );
}

// =============================================================================
// MedicationEditor
// =============================================================================

export function MedicationEditor({
  open,
  medication,
  codeLookup,
  indicationCodeLookup,
  indicationConcerns = [],
  onClose,
  onSave,
  prescribing,
  readiness,
  prescriptionNow,
  initialIssueField,
  onIssueAction,
  readOnly = false,
}: MedicationEditorProps): React.JSX.Element | null {
  const ambientCodeLookup = useCodeLookupConfig();
  const effectiveCodeLookup: CodeLookupConfig | undefined =
    codeLookup === false
      ? undefined
      : (codeLookup ?? ambientCodeLookup ?? undefined);
  const effectiveIndicationLookup: IndicationCodeLookupConfig | undefined =
    indicationCodeLookup === false
      ? undefined
      : (indicationCodeLookup ?? ambientCodeLookup ?? undefined);
  const [draft, setDraft] = React.useState<Medication>(() => ({
    id: prescribing?.input.orderId ?? newId(),
    name: '',
    status: 'unreconciled',
    ...medication,
    substitution: medication?.substitution ?? '0',
  }));
  const [edited, setEdited] = React.useState(false);
  const [selectedProduct, setSelectedProduct] =
    React.useState<PrescriptionValidationContext['product']>();
  const [selectedSchedule, setSelectedSchedule] =
    React.useState<PrescriptionValidationContext['controlledSchedule']>();
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  // CodeLookup reads its initial query once; choosing a chart concern reseeds it.
  const [indicationLookupRevision, setIndicationLookupRevision] =
    React.useState(0);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  // Capture each closed-to-open transition before the modal's passive focus
  // effect. Delayed cleanup avoids stealing focus during StrictMode replay.
  const originRef = React.useRef<HTMLElement | null>(null);
  const previousOpen = React.useRef(false);
  const mountedRef = React.useRef(false);
  const focusGeneration = React.useRef(0);
  const restoreOrigin = React.useCallback(() => {
    const origin = originRef.current;
    const generation = focusGeneration.current;
    queueMicrotask(() => {
      if (generation === focusGeneration.current && origin?.isConnected)
        origin.focus();
    });
  }, []);
  React.useLayoutEffect(() => {
    if (open && !previousOpen.current) {
      originRef.current = document.activeElement as HTMLElement;
      focusGeneration.current += 1;
    } else if (!open && previousOpen.current) restoreOrigin();
    previousOpen.current = open;
  }, [open, restoreOrigin]);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queueMicrotask(() => {
        if (!mountedRef.current) restoreOrigin();
      });
    };
  }, [restoreOrigin]);
  const close = () => {
    onClose();
    restoreOrigin();
  };
  const instanceId = React.useId();
  const previewConfiguration =
    prescribing && selectedProduct
      ? {
          ...prescribing,
          input: {
            ...prescribing.input,
            context: {
              ...prescribing.input.context,
              product: selectedProduct,
              controlledSchedule: selectedSchedule ?? {
                state: 'unknown' as const,
                reason:
                  'Drug classification must be refreshed for this product.',
              },
            },
          },
        }
      : prescribing;
  const preview = usePrescriptionPreview(
    draft,
    previewConfiguration,
    edited ? undefined : readiness,
    prescriptionNow
  );
  const clock = usePrescriptionClock(
    preview?.workflow?.expiresAt,
    prescriptionNow
  );
  const readinessProps = {
    readiness: preview,
    now: clock,
    medicationName: draft.name || 'Medication',
    expectedOrderId: draft.id,
    expectedOrderRevision:
      prescribing?.input.orderRevision ?? draft.prescriptionRevision,
    expectedContextRevision: prescribing?.input.context.revision,
    expectedPolicyVersion: prescribing?.policy.version,
  };
  const issues = getPrescriptionIssues(readinessProps);
  const patch = (fields: Partial<Medication>) => {
    setEdited(true);
    setSaveError('');
    setDraft((previous) => ({ ...previous, ...fields }));
  };
  const focusField = React.useCallback((fieldPath?: string) => {
    const field = editorIssueField(fieldPath);
    const target = field
      ? Array.from(
          bodyRef.current?.querySelectorAll<HTMLElement>(
            '[data-prescription-field]'
          ) ?? []
        ).find((element) => element.dataset.prescriptionField === field)
      : undefined;
    const input = target?.matches('input, textarea, select')
      ? target
      : target?.querySelector<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
    (
      input ??
      bodyRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
      )
    )?.focus();
  }, []);
  React.useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => {
      if (active) focusField(initialIssueField);
    });
    return () => {
      active = false;
    };
  }, [open, initialIssueField, focusField]);
  const issueAction = (issue: PrescriptionIssue) => {
    if (issue.remediation === 'edit-prescription') focusField(issue.fieldPath);
    else onIssueAction?.(issue);
  };
  const fieldMessages = (field: string) =>
    issues
      .filter((issue) => editorIssueField(issue.fieldPath) === field)
      .filter(
        (issue, index, all) =>
          all.findIndex(
            (other) =>
              other.code === issue.code && other.message === issue.message
          ) === index
      );
  const hasFieldError = (field: string) =>
    fieldMessages(field).some(isEditableFieldError);
  const attributes = (field: string) => ({
    id: `${instanceId}-${field}`,
    'data-prescription-field': field,
    'aria-invalid': hasFieldError(field) || undefined,
    'aria-describedby': fieldMessages(field).length
      ? `${instanceId}-${field}-issues`
      : undefined,
    'aria-errormessage': hasFieldError(field)
      ? `${instanceId}-${field}-issues`
      : undefined,
    className: hasFieldError(field)
      ? 'border-destructive focus:ring-destructive focus-visible:ring-destructive'
      : undefined,
    disabled: readOnly || saving,
  });
  const messages = (field: string) =>
    fieldMessages(field).length > 0 && (
      <div
        id={`${instanceId}-${field}-issues`}
        className="space-y-1 text-xs"
        data-slot="prescription-field-issues"
      >
        {fieldMessages(field).map((issue) => (
          <p
            key={`${issue.code}:${issue.fieldPath ?? ''}`}
            className={
              isEditableFieldError(issue)
                ? 'text-danger-700 dark:text-danger-300'
                : 'text-warning-900 dark:text-warning-200'
            }
          >
            {issue.message}
          </p>
        ))}
      </div>
    );
  const textField = (
    field: keyof Medication & string,
    label: string,
    inputMode?: 'numeric' | 'decimal'
  ) => (
    <div className="space-y-1.5" key={field}>
      <Label htmlFor={`${instanceId}-${field}`}>{label}</Label>
      <Input
        {...attributes(field)}
        inputMode={inputMode}
        value={String(draft[field] ?? '')}
        onChange={(event) => patch({ [field]: event.target.value })}
      />
      {messages(field)}
    </div>
  );
  // Parsers only suggest values. A user must explicitly confirm them, and an
  // unparseable complex Sig remains valid draft text.
  const labelSuggestion = parseMedicationLabel(draft.name);
  const sigSuggestion = parseSig(draft.sig ?? '');
  const hasSuggestions =
    (!draft.strength && labelSuggestion.strength) ||
    (!draft.doseForm && labelSuggestion.doseForm) ||
    (!draft.route && sigSuggestion.route) ||
    (!draft.frequency && sigSuggestion.frequency);
  const changeDrug = (name: string, code?: Medication['code']) => {
    if (
      name === draft.name &&
      code?.system === draft.code?.system &&
      code?.code === draft.code?.code
    )
      return;
    setSelectedProduct(undefined);
    setSelectedSchedule(undefined);
    patch({
      name,
      code,
      productId: undefined,
      strength: undefined,
      doseForm: undefined,
      dose: undefined,
      doseUnit: undefined,
      quantityUnit: undefined,
      route: undefined,
      frequency: undefined,
      sig: undefined,
      prn: undefined,
      prnReason: undefined,
      maxDailyDose: undefined,
    });
  };
  const handleProductSelect = (result: MedicationLookupResult) => {
    changeDrug(result.label, {
      system: result.codetype,
      code: result.fullcode,
      display: result.label,
      ...(result.codeVersion !== undefined && { version: result.codeVersion }),
    });
    patch({
      productId: result.productId,
      strength: result.strength,
      doseForm: result.doseForm,
      quantityUnit: result.quantityUnit,
    });
    if (result.productId && result.strength && result.doseForm) {
      const observedAt =
        result.observedAt ?? prescribing?.input.evaluatedAt ?? '';
      const sourceId = result.sourceId ?? 'injected-catalog';
      setSelectedProduct({
        state: 'known',
        value: {
          id: result.productId,
          coding: [
            {
              system: result.codetype,
              code: result.fullcode,
              ...(result.codeVersion !== undefined && {
                version: result.codeVersion,
              }),
            },
          ],
          conceptSpecificity: result.conceptSpecificity ?? 'product',
          strength: result.strength,
          doseForm: result.doseForm,
          quantityUnits:
            result.quantityUnits ??
            (result.quantityUnit ? [result.quantityUnit] : []),
        },
        observedAt,
        sourceId,
      });
      if (result.controlledSchedule)
        setSelectedSchedule({
          state: 'known',
          value: result.controlledSchedule,
          observedAt,
          sourceId,
        });
      else if (
        prescribing?.input.context.product?.state === 'known' &&
        prescribing.input.context.product.value.id === result.productId
      )
        setSelectedSchedule(prescribing.input.context.controlledSchedule);
    }
  };
  const availableConcerns = indicationConcerns.flatMap((concern) => {
    const assertion = currentAssertion(concern);
    return assertion &&
      assertion.verificationStatus !== 'refuted' &&
      assertion.verificationStatus !== 'entered-in-error'
      ? [{ concern, assertion }]
      : [];
  });
  const changeIndication = (indication: string) => {
    patch({ indication, indicationCode: undefined, concernId: undefined });
  };
  const selectIndication = (result: IndicationLookupResult) => {
    const system = normalizeConditionCodingSystem(result.codetype);
    const matches = availableConcerns.filter(({ assertion }) =>
      assertion.coding?.some(
        (coding) =>
          indicationCodingSystemKey(coding.system) ===
            indicationCodingSystemKey(system) && coding.code === result.fullcode
      )
    );
    // A shared code can describe several concerns. Retain an existing match,
    // or link a unique match; otherwise the host resolves the chart concern.
    const match =
      matches.find(({ concern }) => concern.concernId === draft.concernId) ??
      (matches.length === 1 ? matches[0] : undefined);
    patch({
      indication: result.label,
      indicationCode: {
        system,
        code: result.fullcode,
        display: result.label,
        ...(result.codeVersion !== undefined && {
          version: result.codeVersion,
        }),
      },
      concernId: match?.concern.concernId,
    });
  };
  const selectConcern = (concernId: string) => {
    const selected = availableConcerns.find(
      ({ concern }) => concern.concernId === concernId
    );
    if (!selected) {
      patch({ concernId: undefined });
      return;
    }
    const coding =
      selected.assertion.coding?.find((entry) => entry.primary) ??
      selected.assertion.coding?.[0];
    patch({
      indication: selected.assertion.text,
      indicationCode: coding
        ? {
            system: normalizeConditionCodingSystem(coding.system),
            code: coding.code,
            display: coding.display ?? selected.assertion.text,
          }
        : undefined,
      concernId: selected.concern.concernId,
    });
    setIndicationLookupRevision((revision) => revision + 1);
  };
  const linkedConcern = availableConcerns.find(
    ({ concern }) => concern.concernId === draft.concernId
  );
  const directionContradictions = [
    draft.route &&
    sigSuggestion.route &&
    draft.route.toLowerCase() !== sigSuggestion.route.toLowerCase()
      ? `Directions suggest route ${sigSuggestion.route}; the structured route is ${draft.route}.`
      : '',
    draft.frequency &&
    sigSuggestion.frequency &&
    draft.frequency.toLowerCase() !== sigSuggestion.frequency.toLowerCase()
      ? `Directions suggest ${sigSuggestion.frequency.toLowerCase()}; the structured frequency is ${draft.frequency.toLowerCase()}.`
      : '',
  ].filter(Boolean);
  const canSave = draft.name.trim().length > 0 && !saving && !readOnly;
  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave({ ...draft, name: draft.name.trim() });
      close();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save the draft. Try again.'
      );
    } finally {
      setSaving(false);
    }
  };
  if (!open) return null;
  return (
    <Modal open onOpenChange={(next) => !next && !saving && close()} size="lg">
      <ModalHeader>
        <ModalTitle>
          {prescribing
            ? 'Complete prescription'
            : medication
              ? 'Correct Medication'
              : 'Add Medication'}
        </ModalTitle>
        <ModalClose />
      </ModalHeader>
      {(prescribing || readiness) && (
        <PrescriptionIssueSummary
          {...readinessProps}
          presentation="floating"
          floatingPlacement="container"
          className="mx-6 mb-3 w-auto shrink-0"
          onIssueAction={readOnly ? undefined : issueAction}
          readOnly={readOnly}
        />
      )}
      <ModalBody className="space-y-5">
        <div ref={bodyRef} className="space-y-5">
          <section className="space-y-3" aria-label="Medication">
            {effectiveCodeLookup && !readOnly ? (
              <div
                className="space-y-1.5"
                role="group"
                aria-labelledby={`${instanceId}-name-label`}
                aria-describedby={attributes('name')['aria-describedby']}
                data-prescription-field="name"
              >
                <Label
                  id={`${instanceId}-name-label`}
                  htmlFor={`${instanceId}-name`}
                >
                  Medication
                </Label>
                <effectiveCodeLookup.component
                  id={`${instanceId}-name`}
                  aria-label="Medication"
                  aria-invalid={attributes('name')['aria-invalid']}
                  aria-describedby={attributes('name')['aria-describedby']}
                  indexUrl={effectiveCodeLookup.indexUrl}
                  locale={effectiveCodeLookup.locale}
                  domains={['med']}
                  bare
                  clearOnSelect={false}
                  placeholder="Search medications"
                  initialQuery={draft.name || undefined}
                  initialSearch={!draft.code}
                  disabled={saving}
                  onSelect={handleProductSelect}
                  onFreeText={(name) => changeDrug(name)}
                  onQueryChange={(name) => changeDrug(name)}
                />
                <p className="text-muted-foreground text-xs">
                  {draft.code
                    ? `Coded: ${draft.code.system} ${draft.code.code}`
                    : 'Free-text draft; select a product when ready.'}
                </p>
                {messages('name')}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor={`${instanceId}-name`}>Medication</Label>
                <Input
                  {...attributes('name')}
                  value={draft.name}
                  onChange={(event) => changeDrug(event.target.value)}
                />
                {messages('name')}
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Drug product:{' '}
              {draft.code
                ? (draft.code.display ?? draft.name)
                : 'Not selected. Use medication search to select a product.'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {textField('strength', 'Product strength')}
              {textField('doseForm', 'Dose form')}
            </div>
            {hasSuggestions && !readOnly && (
              <div className="border-border rounded border p-2 text-xs">
                <p>
                  Suggested from the label or directions:{' '}
                  {[
                    !draft.strength && labelSuggestion.strength,
                    !draft.doseForm && labelSuggestion.doseForm,
                    !draft.route && sigSuggestion.route,
                    !draft.frequency && sigSuggestion.frequency,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() =>
                    patch({
                      strength: draft.strength || labelSuggestion.strength,
                      doseForm: draft.doseForm || labelSuggestion.doseForm,
                      route: draft.route || sigSuggestion.route,
                      frequency: draft.frequency || sigSuggestion.frequency,
                      prn: draft.prn ?? sigSuggestion.prn,
                    })
                  }
                >
                  Confirm suggested details
                </Button>
              </div>
            )}
          </section>
          <section className="space-y-3" aria-label="Directions">
            <h4 className="text-muted-foreground text-xs font-semibold uppercase">
              Directions
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {textField('dose', 'Dose per administration', 'decimal')}
              {textField('doseUnit', 'Dose unit')}
              {textField('route', 'Route')}
              {textField('frequency', 'Frequency')}
            </div>
            <Checkbox
              {...attributes('prn')}
              checked={draft.prn ?? false}
              disabled={readOnly || saving}
              label="As needed (PRN)"
              onChange={(event) => patch({ prn: event.target.checked })}
            />
            {messages('prn')}
            {draft.prn && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {textField('prnReason', 'As-needed reason')}
                {textField('maxDailyDose', 'Maximum daily dose', 'decimal')}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`${instanceId}-sig`}>
                Sig (patient directions)
              </Label>
              <Textarea
                {...attributes('sig')}
                value={draft.sig ?? ''}
                onChange={(event) => patch({ sig: event.target.value })}
                rows={3}
              />
              {messages('sig')}
              {directionContradictions.length > 0 && (
                <div
                  className="border-warning-500 rounded border p-2 text-sm"
                  role="status"
                >
                  {directionContradictions.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                  <p>
                    Confirm the intended directions and structured values.
                    Suggestions do not invalidate complex directions
                    automatically.
                  </p>
                </div>
              )}
              <p className="text-muted-foreground text-xs">
                Keep complex directions intact. Confirm structured route and
                frequency separately.
              </p>
            </div>
          </section>
          <section className="space-y-3" aria-label="Dispensing">
            <h4 className="text-muted-foreground text-xs font-semibold uppercase">
              Dispensing
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {textField('quantity', 'Quantity', 'decimal')}
              {textField('quantityUnit', 'Dispensing unit')}
              {textField('daysSupply', 'Days supply', 'numeric')}
              {textField('refills', 'Refills', 'numeric')}
            </div>
            <div className="space-y-1.5">
              <RadioGroup
                name={`${instanceId}-substitution`}
                label="Substitution"
                value={draft.substitution ?? '0'}
                onValueChange={(value) =>
                  !readOnly &&
                  !saving &&
                  patch({ substitution: value as '0' | '1' })
                }
                orientation="horizontal"
                size="sm"
              >
                <Radio
                  {...attributes('substitution')}
                  value="0"
                  label="Substitution permitted"
                  disabled={readOnly || saving}
                />
                <Radio
                  {...attributes('substitution')}
                  id={`${instanceId}-substitution-daw`}
                  value="1"
                  label="Dispense as written (DAW)"
                  disabled={readOnly || saving}
                />
              </RadioGroup>
              {messages('substitution')}
            </div>
          </section>
          <section className="space-y-3" aria-label="Dates and context">
            <h4 className="text-muted-foreground text-xs font-semibold uppercase">
              Dates and context
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${instanceId}-startDate`}>
                  Therapy start date
                </Label>
                <DateInput
                  {...attributes('startDate')}
                  value={draft.startDate ?? ''}
                  onChange={(value) => patch({ startDate: value })}
                />
                {messages('startDate')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${instanceId}-endDate`}>
                  Therapy end date
                </Label>
                <DateInput
                  {...attributes('endDate')}
                  value={draft.endDate ?? ''}
                  onChange={(value) => patch({ endDate: value })}
                />
                {messages('endDate')}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                id={`${instanceId}-indication-label`}
                htmlFor={`${instanceId}-indication`}
              >
                Indication
              </Label>
              {effectiveIndicationLookup && !readOnly ? (
                <div
                  role="group"
                  aria-labelledby={`${instanceId}-indication-label`}
                  aria-describedby={
                    attributes('indication')['aria-describedby']
                  }
                  data-prescription-field="indication"
                >
                  <effectiveIndicationLookup.component
                    key={indicationLookupRevision}
                    id={`${instanceId}-indication`}
                    aria-label="Indication (concern)"
                    aria-invalid={attributes('indication')['aria-invalid']}
                    aria-describedby={
                      attributes('indication')['aria-describedby']
                    }
                    indexUrl={effectiveIndicationLookup.indexUrl}
                    locale={effectiveIndicationLookup.locale}
                    domains={['condition']}
                    bare
                    clearOnSelect={false}
                    placeholder="Search the concern treated by this medication"
                    initialQuery={draft.indication || undefined}
                    initialSearch={!draft.indicationCode}
                    disabled={saving}
                    onSelect={selectIndication}
                    onFreeText={changeIndication}
                    onQueryChange={changeIndication}
                  />
                </div>
              ) : (
                <Input
                  {...attributes('indication')}
                  value={draft.indication ?? ''}
                  onChange={(event) => changeIndication(event.target.value)}
                />
              )}
              {messages('indication')}
              <p className="text-muted-foreground text-xs">
                {draft.indicationCode
                  ? `Coded: ${draft.indicationCode.system} ${draft.indicationCode.code}`
                  : 'Free-text indication; select a concern or code when ready.'}
              </p>
              {draft.concernId && (
                <p className="text-muted-foreground text-xs">
                  Linked chart concern:{' '}
                  {linkedConcern?.assertion.text ??
                    draft.indication ??
                    draft.concernId}
                </p>
              )}
              {availableConcerns.length > 0 && !readOnly && (
                <Select
                  id={`${instanceId}-concern`}
                  label="Chart concern"
                  placeholder="Choose an existing concern"
                  value={draft.concernId ?? ''}
                  disabled={saving}
                  options={[
                    { value: '', label: 'No linked chart concern' },
                    ...availableConcerns.map(({ concern, assertion }) => ({
                      value: concern.concernId,
                      label: assertion.text,
                    })),
                  ]}
                  onValueChange={selectConcern}
                />
              )}
            </div>
            {prescribing && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-sm">
                  Pharmacy:{' '}
                  {prescribing.input.context.pharmacy?.state === 'known'
                    ? 'Selected by the EHR'
                    : 'Selection needed in the EHR'}
                </p>
                {messages('pharmacyId')}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`${instanceId}-pharmacyNotes`}>
                Pharmacy notes
              </Label>
              <Textarea
                {...attributes('pharmacyNotes')}
                value={draft.pharmacyNotes ?? ''}
                onChange={(event) =>
                  patch({ pharmacyNotes: event.target.value })
                }
                rows={2}
              />
              {messages('pharmacyNotes')}
            </div>
            <p className="text-muted-foreground text-xs">
              The prescriber signing workflow supplies the written and signed
              date.
            </p>
          </section>
          {saveError && (
            <p role="alert" className="text-danger-600 text-sm">
              {saveError}
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={close} disabled={saving}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button onClick={() => void save()} disabled={!canSave}>
            {saving
              ? 'Saving…'
              : prescribing || readiness
                ? 'Save draft'
                : 'Save'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default MedicationEditor;
