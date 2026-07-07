'use client';

/**
 * MedicationReconciliation — batteries-included medication reconciliation.
 *
 * Wraps the presentational `MedicationList` with the full interaction layer:
 * status changes, Correct / Notes / Add Task modal dialogs, reordering,
 * removal, and adding medications (quick-add pills + "Other…" modal).
 *
 * Works standalone (uncontrolled with `defaultMedications`, or controlled
 * with `medications` + `onChange`) and is the engine behind the eSheet
 * `medicationList` question type.
 */

import * as React from 'react';
import {
  MedicationList,
  type Medication,
  type MedicationAction,
} from './MedicationList';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Button } from '../Button';
import { Textarea } from '../Textarea';
import { Label } from '../Label';
import {
  MedicationEditor,
  lookupToMedicationFields,
  type CodeLookupConfig,
} from './MedicationEditor';

// =============================================================================
// Types
// =============================================================================

const MANAGED_ACTIONS: MedicationAction[] = [
  'correct',
  'add-task',
  'note',
  'remove',
];

export interface MedicationReconciliationProps {
  /** Controlled medication list (use with `onChange`) */
  medications?: Medication[];
  /** Initial medication list (uncontrolled) */
  defaultMedications?: Medication[];
  /** Called with the next list after every mutation */
  onChange?: (medications: Medication[]) => void;
  /** Header title (pass null to hide) */
  title?: string | null;
  /** Common medication names for the quick-add list (omit to hide) */
  quickAddOptions?: string[];
  /** Row actions to show (default: correct, add-task, note, remove, move-up, move-down) */
  actions?: MedicationAction[];
  /**
   * Called for host-specific actions this component does not manage
   * (e.g. 'open', 'refill' when included in `actions`).
   */
  onAction?: (medication: Medication, action: MedicationAction) => void;
  /**
   * CodeLookup wiring for the medication editor (Correct / Add Medication):
   * pass the CodeLookup component + shard location to enable RxNorm/FDB
   * coding. Omit for a plain-text medication name input.
   *
   * ```tsx
   * import { CodeLookup } from '@mieweb/ui/…/CodeLookup';
   * <MedicationReconciliation codeLookup={{ component: CodeLookup, indexUrl: '/codify' }} … />
   * ```
   */
  codeLookup?: CodeLookupConfig;
  /**
   * Render an inline CodeLookup search bar in the add-medication section
   * (requires `codeLookup`). Picks add immediately as Unreconciled — the
   * fastest entry path, and non-leading (no suggested medications), which
   * makes it the right choice for patient-facing intake.
   */
  inlineAddSearch?: boolean;
  /** Hide all action buttons (display only) */
  readOnly?: boolean;
  /** Message shown when the Unreconciled group is empty */
  reconciledMessage?: string;
  /** Message shown when the medication list has no entries at all */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

function newId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Modal dialogs
// =============================================================================

type DialogState =
  | { kind: 'correct'; medication: Medication }
  | { kind: 'note'; medication: Medication }
  | { kind: 'add-task'; medication: Medication }
  | { kind: 'add' }
  | null;

/** Small note / task dialog. Correct + Add use the full MedicationEditor. */
function MedicationDialog({
  dialog,
  onClose,
  onSave,
}: {
  dialog: { kind: 'note' | 'add-task'; medication: Medication };
  onClose: () => void;
  onSave: (fields: Record<string, string>) => void;
}) {
  const [form, setForm] = React.useState<Record<string, string>>(() =>
    dialog.kind === 'note'
      ? ({ note: dialog.medication.note ?? '' } as Record<string, string>)
      : ({ task: dialog.medication.task ?? '' } as Record<string, string>)
  );

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} size="md">
      <ModalHeader>
        <ModalTitle>
          {dialog.kind === 'note' ? 'Medication Notes' : 'Add Task'}
        </ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {dialog.medication.name}
        </p>
        {dialog.kind === 'note' ? (
          <div className="space-y-1.5">
            <Label htmlFor="med-note">Note</Label>
            <Textarea
              id="med-note"
              value={form.note}
              onChange={set('note')}
              rows={4}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="med-task">Task</Label>
            <Textarea
              id="med-task"
              value={form.task}
              onChange={set('task')}
              rows={3}
              placeholder="Follow-up task for this medication"
            />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </ModalFooter>
    </Modal>
  );
}

// =============================================================================
// MedicationReconciliation
// =============================================================================

/**
 * @example Standalone (uncontrolled)
 * ```tsx
 * <MedicationReconciliation
 *   defaultMedications={presentingMeds}
 *   quickAddOptions={['aspirin 81 mg tablet']}
 *   onChange={(meds) => save(meds)}
 * />
 * ```
 *
 * @example Controlled
 * ```tsx
 * <MedicationReconciliation medications={meds} onChange={setMeds} />
 * ```
 */
export function MedicationReconciliation({
  medications: controlledMedications,
  defaultMedications,
  onChange,
  title = 'Presenting medications',
  quickAddOptions,
  actions = MANAGED_ACTIONS,
  onAction,
  codeLookup,
  inlineAddSearch = false,
  readOnly = false,
  reconciledMessage,
  emptyMessage,
  className,
  'data-testid': dataTestId,
}: MedicationReconciliationProps): React.JSX.Element {
  const isControlled = controlledMedications !== undefined;
  const [internal, setInternal] = React.useState<Medication[]>(
    defaultMedications ?? []
  );
  const medications = isControlled ? controlledMedications : internal;

  const [dialog, setDialog] = React.useState<DialogState>(null);

  const commit = (next: Medication[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const patchMedication = (id: string, patch: Partial<Medication>) => {
    commit(medications.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const moveMedication = (med: Medication, direction: -1 | 1) => {
    // Reorder within the same status group.
    const meds = [...medications];
    const group = meds.filter((m) => m.status === med.status);
    const groupIndex = group.findIndex((m) => m.id === med.id);
    const swapWith = group[groupIndex + direction];
    if (!swapWith) return;
    const i = meds.findIndex((m) => m.id === med.id);
    const j = meds.findIndex((m) => m.id === swapWith.id);
    [meds[i], meds[j]] = [meds[j], meds[i]];
    commit(meds);
  };

  const handleAction = (med: Medication, action: MedicationAction) => {
    switch (action) {
      case 'remove':
        commit(medications.filter((m) => m.id !== med.id));
        break;
      case 'move-up':
        moveMedication(med, -1);
        break;
      case 'move-down':
        moveMedication(med, 1);
        break;
      case 'correct':
      case 'note':
      case 'add-task':
        setDialog({ kind: action, medication: med });
        break;
      default:
        // Host-specific actions ('open', 'refill') are delegated.
        onAction?.(med, action);
        break;
    }
  };

  const addMedication = (name: string, sig?: string) => {
    commit([
      ...medications,
      { id: newId(), name, sig: sig || undefined, status: 'unreconciled' },
    ]);
  };

  const handleDialogSave = (form: Record<string, string>) => {
    if (!dialog) return;
    switch (dialog.kind) {
      case 'note':
        patchMedication(dialog.medication.id, {
          note: form.note.trim() || undefined,
        });
        break;
      case 'add-task':
        patchMedication(dialog.medication.id, {
          task: form.task.trim() || undefined,
        });
        break;
    }
  };

  /** Correct + Add flow through the full NCPDP MedicationEditor. */
  const editorOpen = dialog?.kind === 'correct' || dialog?.kind === 'add';
  const editorTarget = dialog?.kind === 'correct' ? dialog.medication : undefined;

  const handleEditorSave = (med: Medication) => {
    if (dialog?.kind === 'correct') {
      commit(medications.map((m) => (m.id === med.id ? med : m)));
    } else {
      commit([...medications, { ...med, status: 'unreconciled' }]);
    }
  };

  /** Inline CodeLookup add bar — picks/free text land in Unreconciled. */
  const addSearch =
    inlineAddSearch && codeLookup && !readOnly ? (
      <codeLookup.component
        indexUrl={codeLookup.indexUrl}
        locale={codeLookup.locale}
        domains={['med']}
        bare
        clearOnSelect
        placeholder="Search medications to add"
        onSelect={(result) =>
          commit([
            ...medications,
            {
              id: newId(),
              name: result.label,
              status: 'unreconciled',
              ...lookupToMedicationFields(result),
            },
          ])
        }
        onFreeText={(text) => addMedication(text)}
      />
    ) : undefined;

  return (
    <>
      <MedicationList
        medications={medications}
        title={title}
        readOnly={readOnly}
        actions={actions}
        onStatusChange={(med, status) => patchMedication(med.id, { status })}
        onAction={handleAction}
        onReorder={(ids) =>
          commit(
            [...medications].sort(
              (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)
            )
          )
        }
        quickAddOptions={quickAddOptions}
        onQuickAdd={(name) => addMedication(name)}
        onAddOther={() => setDialog({ kind: 'add' })}
        addSearch={addSearch}
        reconciledMessage={reconciledMessage}
        emptyMessage={emptyMessage}
        className={className}
        data-testid={dataTestId}
      />
      {dialog && (dialog.kind === 'note' || dialog.kind === 'add-task') && (
        <MedicationDialog
          key={dialog.kind + dialog.medication.id}
          dialog={dialog}
          onClose={() => setDialog(null)}
          onSave={handleDialogSave}
        />
      )}
      {editorOpen && (
        <MedicationEditor
          key={editorTarget?.id ?? 'add'}
          open
          medication={editorTarget}
          codeLookup={codeLookup}
          onClose={() => setDialog(null)}
          onSave={handleEditorSave}
        />
      )}
    </>
  );
}

export default MedicationReconciliation;
