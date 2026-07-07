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
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { DateInput } from '../DateInput';
import type { Medication } from './MedicationList';

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
  domains?: 'med'[];
  bare?: boolean;
  clearOnSelect?: boolean;
  placeholder?: string;
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
  /** Codify shard location; omit to fall back to a plain name input */
  codeLookup?: CodeLookupConfig;
  /** Called when the editor is dismissed without saving */
  onClose: () => void;
  /** Called with the complete medication on save */
  onSave: (medication: Medication) => void;
}

// =============================================================================
// NCPDP option lists (pragmatic common subsets)
// =============================================================================

const QUANTITY_UNITS = [
  'Tablet',
  'Capsule',
  'Each',
  'Milliliter',
  'Gram',
  'Unit',
  'Patch',
  'Suppository',
  'Spray',
  'Drop',
].map((u) => ({ value: u.toLowerCase(), label: u }));

const ROUTES = [
  'Oral',
  'Sublingual',
  'Topical',
  'Subcutaneous',
  'Intramuscular',
  'Intravenous',
  'Inhalation',
  'Ophthalmic',
  'Otic',
  'Nasal',
  'Rectal',
  'Transdermal',
].map((r) => ({ value: r.toLowerCase(), label: r }));

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every morning',
  'Every bedtime',
  'Every other day',
  'Weekly',
  'As needed',
].map((f) => ({ value: f, label: f }));

const SUBSTITUTION_OPTIONS = [
  { value: '0', label: '0 — Substitution permitted' },
  { value: '1', label: '1 — Dispense as written (DAW)' },
];

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
  onClose,
  onSave,
}: MedicationEditorProps): React.JSX.Element | null {
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

  const patch = (p: Partial<Medication>) =>
    setDraft((prev) => ({ ...prev, ...p }));

  const handleCodeSelect = (result: MedicationLookupResult) => {
    patch({
      name: result.label,
      code: {
        system: result.codetype,
        code: result.fullcode,
        display: result.label,
      },
    });
  };

  const canSave = draft.name.trim().length > 0;

  if (!open) return null;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalHeader>
        <ModalTitle>
          {medication ? 'Correct Medication' : 'Add Medication'}
        </ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="space-y-5">
        {/* ——— Medication + coding ——— */}
        <section className="space-y-3" aria-label="Medication">
          {codeLookup ? (
            <div className="space-y-1.5">
              <Label htmlFor="med-search">Medication</Label>
              <codeLookup.component
                indexUrl={codeLookup.indexUrl}
                locale={codeLookup.locale}
                domains={['med']}
                bare
                clearOnSelect={false}
                placeholder="Search RxNorm / FDB — e.g. lisinopril"
                onSelect={handleCodeSelect}
                onFreeText={(text) =>
                  patch({ name: text, code: undefined })
                }
              />
              <p className="text-muted-foreground text-xs">
                {draft.code
                  ? `Coded: ${draft.code.system} ${draft.code.code}`
                  : draft.name
                    ? `Uncoded free text: "${draft.name}" — pick a result to code it`
                    : 'Pick a result to code the medication, or press Enter for free text'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="med-name">Medication</Label>
              <Input
                id="med-name"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="e.g. lisinopril 10 mg tablet"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="med-strength">Strength</Label>
              <Input
                id="med-strength"
                value={draft.strength ?? ''}
                onChange={(e) => patch({ strength: e.target.value })}
                placeholder="10 mg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-form">Dose form</Label>
              <Input
                id="med-form"
                value={draft.doseForm ?? ''}
                onChange={(e) => patch({ doseForm: e.target.value })}
                placeholder="tablet"
              />
            </div>
          </div>
        </section>

        {/* ——— Dispensing ——— */}
        <section className="space-y-3" aria-label="Dispensing">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Dispensing
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="med-qty">Quantity</Label>
              <Input
                id="med-qty"
                inputMode="decimal"
                value={draft.quantity ?? ''}
                onChange={(e) => patch({ quantity: e.target.value })}
                placeholder="30"
              />
            </div>
            <Select
              label="Unit"
              options={QUANTITY_UNITS}
              value={draft.quantityUnit}
              onValueChange={(v) => patch({ quantityUnit: v })}
              placeholder="Unit"
              size="md"
            />
            <div className="space-y-1.5">
              <Label htmlFor="med-days">Days supply</Label>
              <Input
                id="med-days"
                inputMode="numeric"
                value={draft.daysSupply ?? ''}
                onChange={(e) => patch({ daysSupply: e.target.value })}
                placeholder="30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-refills">Refills</Label>
              <Input
                id="med-refills"
                inputMode="numeric"
                value={draft.refills ?? ''}
                onChange={(e) => patch({ refills: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <Select
            label="Substitution"
            options={SUBSTITUTION_OPTIONS}
            value={draft.substitution}
            onValueChange={(v) => patch({ substitution: v as '0' | '1' })}
            placeholder="0 — Substitution permitted"
          />
        </section>

        {/* ——— Directions ——— */}
        <section className="space-y-3" aria-label="Directions">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Directions
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="med-sig">Sig (patient directions)</Label>
            <Textarea
              id="med-sig"
              value={draft.sig ?? ''}
              onChange={(e) => patch({ sig: e.target.value })}
              rows={2}
              placeholder="1 tablet by mouth daily"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Route"
              options={ROUTES}
              value={draft.route}
              onValueChange={(v) => patch({ route: v })}
              placeholder="Route"
            />
            <Select
              label="Frequency"
              options={FREQUENCIES}
              value={draft.frequency}
              onValueChange={(v) => patch({ frequency: v })}
              placeholder="Frequency"
            />
          </div>
          <Checkbox
            label="PRN (as needed)"
            checked={draft.prn ?? false}
            onChange={(e) => patch({ prn: e.target.checked })}
          />
        </section>

        {/* ——— Dates & context ——— */}
        <section className="space-y-3" aria-label="Dates and context">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Dates &amp; context
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="med-start">Start date</Label>
              <DateInput
                id="med-start"
                value={draft.startDate ?? ''}
                onChange={(v) => patch({ startDate: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-end">End date</Label>
              <DateInput
                id="med-end"
                value={draft.endDate ?? ''}
                onChange={(v) => patch({ endDate: v })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="med-indication">Indication</Label>
            <Input
              id="med-indication"
              value={draft.indication ?? ''}
              onChange={(e) => patch({ indication: e.target.value })}
              placeholder="e.g. Essential hypertension"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="med-pharmacy-notes">Pharmacy notes</Label>
            <Textarea
              id="med-pharmacy-notes"
              value={draft.pharmacyNotes ?? ''}
              onChange={(e) => patch({ pharmacyNotes: e.target.value })}
              rows={2}
            />
          </div>
        </section>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSave({ ...draft, name: draft.name.trim() });
            onClose();
          }}
          disabled={!canSave}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default MedicationEditor;
