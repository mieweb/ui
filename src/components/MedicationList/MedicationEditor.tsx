'use client';

import { useMessages } from '../../utils/messages';

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
 * | Start date     | WrittenDate / EffectiveDate            |
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
  /** Called when the editor is dismissed without saving */
  onClose: () => void;
  /** Called with the complete medication on save */
  onSave: (medication: Medication) => void;
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
 * and — parsed from the label — strength, dose form, and quantity unit.
 * Used by the editor and by inline add-search flows.
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
    },
    ...labelToMedicationFields(result.label),
  };
}

function newId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// MedicationEditor
// =============================================================================

export function MedicationEditor({
  open,
  medication,
  codeLookup,
  requireCode = false,
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

  const [draft, setDraft] = React.useState<Medication>(
    () =>
      medication ?? {
        id: newId(),
        name: '',
        status: 'unreconciled',
      }
  );

  // NOTE: draft state is seeded once per mount — give the editor a `key`
  // (e.g. the medication id) so a different target remounts it.

  // Focus the medication search / name input when the dialog opens.
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const input = bodyRef.current?.querySelector('input');
    input?.focus();
  }, []);

  const patch = (p: Partial<Medication>) =>
    setDraft((prev) => ({ ...prev, ...p }));

  const handleCodeSelect = (result: MedicationLookupResult) => {
    if (requireCode && (!result.codetype.trim() || !result.fullcode.trim()))
      return;
    // Populate strength / dose form / quantity unit from the coded label.
    patch(lookupToMedicationFields(result));
  };

  const handleSigChange = (sig: string) => {
    // Route / frequency / PRN are derived from the sig text.
    const { route, frequency, prn } = parseSig(sig);
    patch({ sig, route, frequency, prn: prn || undefined });
  };

  const hasCode = Boolean(draft.code?.system.trim() && draft.code.code.trim());
  const unchangedLegacyName = medication && draft.name === medication.name;
  const canSave =
    draft.name.trim().length > 0 &&
    (!requireCode || hasCode || Boolean(unchangedLegacyName));

  if (!open) return null;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalHeader>
        <ModalTitle>
          {medication ? m('Correct Medication') : m('Add Medication')}
        </ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="space-y-5">
        <div ref={bodyRef} className="contents">
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
                  onFreeText={
                    requireCode
                      ? undefined
                      : (text) => patch({ name: text, code: undefined })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {draft.code
                    ? m('Coded: {system} {code}', {
                        system: draft.code.system,
                        code: draft.code.code,
                      })
                    : draft.name
                      ? m(
                          'Uncoded free text: "{name}" — pick a result to code it',
                          { name: draft.name }
                        )
                      : requireCode
                        ? m('Pick a catalog result to code the medication')
                        : m(
                            'Pick a result to code the medication, or press Enter for free text'
                          )}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-strength">{m('Strength')}</Label>
                <Input
                  id="med-strength"
                  value={draft.strength ?? ''}
                  onChange={(e) => patch({ strength: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-form">{m('Dose form')}</Label>
                <Input
                  id="med-form"
                  value={draft.doseForm ?? ''}
                  onChange={(e) => {
                    const doseForm = e.target.value;
                    const normalized = doseForm.toLowerCase().trim();
                    // Quantity unit follows the dose form (tablet → tablet,
                    // solution → milliliter, …)
                    patch({
                      doseForm,
                      quantityUnit:
                        (FORM_TO_UNIT[normalized] ?? normalized) || undefined,
                    });
                  }}
                />
              </div>
            </div>
          </section>

          {/* ——— Dispensing ——— */}
          <section className="space-y-3" aria-label={m('Dispensing')}>
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {m('Dispensing')}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-qty">
                  {m('Quantity')}
                  {draft.quantityUnit ? ` (${draft.quantityUnit}s)` : ''}
                </Label>
                <Input
                  id="med-qty"
                  inputMode="decimal"
                  value={draft.quantity ?? ''}
                  onChange={(e) => patch({ quantity: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-days">{m('Days supply')}</Label>
                <Input
                  id="med-days"
                  inputMode="numeric"
                  value={draft.daysSupply ?? ''}
                  onChange={(e) => patch({ daysSupply: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-refills">{m('Refills')}</Label>
                <Input
                  id="med-refills"
                  inputMode="numeric"
                  value={draft.refills ?? ''}
                  onChange={(e) => patch({ refills: e.target.value })}
                />
              </div>
            </div>
            <RadioGroup
              name="med-substitution"
              label={m('Substitution')}
              value={draft.substitution ?? '0'}
              onValueChange={(v) => patch({ substitution: v as '0' | '1' })}
              orientation="horizontal"
              size="sm"
            >
              <Radio value="0" label={m('Substitution permitted')} />
              <Radio value="1" label={m('Dispense as written (DAW)')} />
            </RadioGroup>
          </section>

          {/* ——— Directions ——— */}
          <section className="space-y-3" aria-label={m('Directions')}>
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {m('Directions')}
            </h4>
            <div className="space-y-1.5">
              <Label htmlFor="med-sig">{m('Sig (patient directions)')}</Label>
              <Textarea
                id="med-sig"
                value={draft.sig ?? ''}
                onChange={(e) => handleSigChange(e.target.value)}
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

          {/* ——— Dates & context ——— */}
          <section className="space-y-3" aria-label={m('Dates and context')}>
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {m('Dates & context')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-start">{m('Start date')}</Label>
                <DateInput
                  id="med-start"
                  value={draft.startDate ?? ''}
                  onChange={(v) => patch({ startDate: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-end">{m('End date')}</Label>
                <DateInput
                  id="med-end"
                  value={draft.endDate ?? ''}
                  onChange={(v) => patch({ endDate: v })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-indication">{m('Indication')}</Label>
              <Input
                id="med-indication"
                value={draft.indication ?? ''}
                onChange={(e) => patch({ indication: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-pharmacy-notes">{m('Pharmacy notes')}</Label>
              <Textarea
                id="med-pharmacy-notes"
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
            onSave({ ...draft, name: draft.name.trim() });
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
