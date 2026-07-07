'use client';

/**
 * AllergyManager — batteries-included allergy list.
 *
 * Wraps the presentational `AllergyList` with the interaction layer: the
 * allergy editor (Correct / Add with CodeLookup allergen coding), the note
 * dialog, removal, and the no-known-allergies (NKA) flow. Uncontrolled via
 * `defaultAllergies` / controlled via `allergies` + `onChange` — same
 * pattern as `MedicationReconciliation`.
 */

import * as React from 'react';
import {
  AllergyList,
  type Allergy,
  type AllergyAction,
  type AllergyKind,
  type AllergySeverity,
  type AllergyType,
} from './AllergyList';
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
import { RadioGroup, Radio } from '../Radio';
import { DateInput } from '../DateInput';
import type { CodeLookupConfig } from '../MedicationList';

// =============================================================================
// Types
// =============================================================================

export interface AllergyManagerProps {
  /** Controlled allergy list (use with `onChange`) */
  allergies?: Allergy[];
  /** Initial allergy list (uncontrolled) */
  defaultAllergies?: Allergy[];
  /** Called with the next list after every mutation */
  onChange?: (allergies: Allergy[]) => void;
  /** No-known-allergies flag (controlled; see AllergyList) */
  noKnownAllergies?: boolean;
  /** Called when NKA is toggled */
  onNoKnownAllergiesChange?: (value: boolean) => void;
  /** Header title (pass null to hide) */
  title?: string | null;
  /**
   * CodeLookup wiring for allergen search (drug shard). Enables both the
   * inline add bar and coded allergens in the editor. Omit for plain text.
   */
  codeLookup?: CodeLookupConfig;
  /** Render an inline allergen search bar in the add section (requires codeLookup) */
  inlineAddSearch?: boolean;
  /** Hide all action affordances (display only) */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

function newId(): string {
  return `alg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Editor dialog
// =============================================================================

const TYPE_OPTIONS = [
  { value: 'drug', label: 'Drug' },
  { value: 'food', label: 'Food' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'other', label: 'Other' },
];

function AllergyEditor({
  allergy,
  codeLookup,
  onClose,
  onSave,
}: {
  allergy?: Allergy;
  codeLookup?: CodeLookupConfig;
  onClose: () => void;
  onSave: (allergy: Allergy) => void;
}) {
  const [draft, setDraft] = React.useState<Allergy>(
    () => allergy ?? { id: newId(), allergen: '', type: 'drug' }
  );

  const patch = (p: Partial<Allergy>) =>
    setDraft((prev) => ({ ...prev, ...p }));

  // Focus the allergen search / input when the dialog opens.
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    bodyRef.current?.querySelector('input')?.focus();
  }, []);

  const canSave = draft.allergen.trim().length > 0;

  // CodeLookup's shards cover drugs (RxNorm/FDB — the 'med' domain); food
  // and environmental allergens have no shard, so the search only renders
  // for drug-type allergies and other types use a plain text input.
  const isDrug = (draft.type ?? 'drug') === 'drug';

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="md">
      <ModalHeader>
        <ModalTitle>{allergy ? 'Correct Allergy' : 'Add Allergy'}</ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="space-y-4">
        <div ref={bodyRef} className="contents">
          <RadioGroup
            name="alg-kind"
            label="Mechanism"
            description="A true immune-mediated allergy, or a non-immune intolerance (e.g. GI upset)"
            value={draft.kind ?? 'allergy'}
            onValueChange={(v) => patch({ kind: v as AllergyKind })}
            orientation="horizontal"
            size="sm"
          >
            <Radio value="allergy" label="Allergy" />
            <Radio value="intolerance" label="Intolerance" />
          </RadioGroup>

          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={draft.type ?? 'drug'}
            onValueChange={(v) => {
              const type = v as AllergyType;
              // A drug code is wrong on a non-drug allergen.
              patch({
                type,
                ...(type !== 'drug' && { code: undefined }),
              });
            }}
          />

          {isDrug && codeLookup ? (
            <div className="space-y-1.5">
              <Label htmlFor="alg-search">Allergen</Label>
              <codeLookup.component
                indexUrl={codeLookup.indexUrl}
                locale={codeLookup.locale}
                domains={['med']}
                bare
                clearOnSelect={false}
                placeholder="Search drug allergens — e.g. penicillin"
                onSelect={(result) =>
                  patch({
                    allergen: result.label,
                    code: {
                      system: result.codetype,
                      code: result.fullcode,
                      display: result.label,
                    },
                  })
                }
                onFreeText={(text) =>
                  patch({ allergen: text, code: undefined })
                }
              />
              <p className="text-muted-foreground text-xs">
                {draft.code
                  ? `Coded: ${draft.code.system} ${draft.code.code}`
                  : draft.allergen
                    ? `Uncoded free text: "${draft.allergen}"`
                    : 'Pick a result to code the allergen, or press Enter for free text'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="alg-name">Allergen</Label>
              <Input
                id="alg-name"
                value={draft.allergen}
                onChange={(e) => patch({ allergen: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="alg-reaction">Reaction</Label>
            <Input
              id="alg-reaction"
              value={draft.reaction ?? ''}
              onChange={(e) => patch({ reaction: e.target.value })}
            />
          </div>

          <RadioGroup
            name="alg-severity"
            label="Severity"
            value={draft.severity ?? ''}
            onValueChange={(v) =>
              patch({ severity: (v || undefined) as AllergySeverity })
            }
            orientation="horizontal"
            size="sm"
          >
            <Radio value="mild" label="Mild" />
            <Radio value="moderate" label="Moderate" />
            <Radio value="severe" label="Severe" />
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="alg-onset">Onset date</Label>
            <DateInput
              id="alg-onset"
              value={draft.onsetDate ?? ''}
              onChange={(v) => patch({ onsetDate: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alg-note">Note</Label>
            <Textarea
              id="alg-note"
              value={draft.note ?? ''}
              onChange={(e) => patch({ note: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSave({ ...draft, allergen: draft.allergen.trim() });
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

// =============================================================================
// AllergyManager
// =============================================================================

type DialogState =
  | { kind: 'correct'; allergy: Allergy }
  | { kind: 'note'; allergy: Allergy }
  | { kind: 'add' }
  | null;

/**
 * @example Patient intake (uncontrolled, inline search, NKA)
 * ```tsx
 * <AllergyManager
 *   defaultAllergies={[]}
 *   inlineAddSearch
 *   codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
 *   noKnownAllergies={nka}
 *   onNoKnownAllergiesChange={setNka}
 *   onChange={save}
 * />
 * ```
 */
export function AllergyManager({
  allergies: controlled,
  defaultAllergies,
  onChange,
  noKnownAllergies,
  onNoKnownAllergiesChange,
  title = 'Allergies',
  codeLookup,
  inlineAddSearch = false,
  readOnly = false,
  className,
  'data-testid': dataTestId,
}: AllergyManagerProps): React.JSX.Element {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState<Allergy[]>(
    defaultAllergies ?? []
  );
  const allergies = isControlled ? controlled : internal;

  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [noteDraft, setNoteDraft] = React.useState('');

  const commit = (next: Allergy[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    // Any recorded allergy clears the NKA flag.
    if (next.length > 0 && noKnownAllergies) {
      onNoKnownAllergiesChange?.(false);
    }
  };

  const handleAction = (allergy: Allergy, action: AllergyAction) => {
    switch (action) {
      case 'remove':
        commit(allergies.filter((a) => a.id !== allergy.id));
        break;
      case 'correct':
        setDialog({ kind: 'correct', allergy });
        break;
      case 'note':
        setNoteDraft(allergy.note ?? '');
        setDialog({ kind: 'note', allergy });
        break;
    }
  };

  const addSearch =
    inlineAddSearch && codeLookup && !readOnly ? (
      <codeLookup.component
        indexUrl={codeLookup.indexUrl}
        locale={codeLookup.locale}
        domains={['med']}
        bare
        clearOnSelect
        placeholder="Search drug allergens to add — use Add allergy… for food/environmental"
        onSelect={(result) =>
          commit([
            ...allergies,
            {
              id: newId(),
              allergen: result.label,
              type: 'drug',
              code: {
                system: result.codetype,
                code: result.fullcode,
                display: result.label,
              },
            },
          ])
        }
        onFreeText={(text) =>
          // this search bar is explicitly for drug allergens — free-text
          // entries carry type 'drug' like the coded path
          commit([...allergies, { id: newId(), allergen: text, type: 'drug' }])
        }
      />
    ) : undefined;

  return (
    <>
      <AllergyList
        allergies={allergies}
        noKnownAllergies={noKnownAllergies}
        onNoKnownAllergiesChange={onNoKnownAllergiesChange}
        title={title}
        onAction={handleAction}
        onReorder={(ids) =>
          commit(
            [...allergies].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
          )
        }
        addSearch={addSearch}
        onAdd={() => setDialog({ kind: 'add' })}
        readOnly={readOnly}
        className={className}
        data-testid={dataTestId}
      />

      {dialog && (dialog.kind === 'correct' || dialog.kind === 'add') && (
        <AllergyEditor
          key={dialog.kind === 'correct' ? dialog.allergy.id : 'add'}
          allergy={dialog.kind === 'correct' ? dialog.allergy : undefined}
          codeLookup={codeLookup}
          onClose={() => setDialog(null)}
          onSave={(saved) => {
            if (dialog.kind === 'correct') {
              commit(allergies.map((a) => (a.id === saved.id ? saved : a)));
            } else {
              commit([...allergies, saved]);
            }
          }}
        />
      )}

      {dialog?.kind === 'note' && (
        <Modal open onOpenChange={(o) => !o && setDialog(null)} size="md">
          <ModalHeader>
            <ModalTitle>Allergy Notes</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {dialog.allergy.allergen}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="alg-note-dlg">Note</Label>
              <Textarea
                id="alg-note-dlg"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                commit(
                  allergies.map((a) =>
                    a.id === dialog.allergy.id
                      ? { ...a, note: noteDraft.trim() || undefined }
                      : a
                  )
                );
                setDialog(null);
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

export default AllergyManager;
