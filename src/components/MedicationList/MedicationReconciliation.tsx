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
  type MedicationStatus,
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
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Label } from '../Label';

// =============================================================================
// Types
// =============================================================================

const MANAGED_ACTIONS: MedicationAction[] = [
  'correct',
  'add-task',
  'note',
  'remove',
  'move-up',
  'move-down',
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
  /** Hide all action buttons (display only) */
  readOnly?: boolean;
  /** Message shown when the Unreconciled group is empty */
  reconciledMessage?: string;
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

function MedicationDialog({
  dialog,
  onClose,
  onSave,
}: {
  dialog: Exclude<DialogState, null>;
  onClose: () => void;
  onSave: (fields: Record<string, string>) => void;
}) {
  const [form, setForm] = React.useState<Record<string, string>>(() => {
    if (dialog.kind === 'correct') {
      return {
        name: dialog.medication.name,
        sig: dialog.medication.sig ?? '',
      } as Record<string, string>;
    }
    if (dialog.kind === 'note')
      return { note: dialog.medication.note ?? '' } as Record<string, string>;
    if (dialog.kind === 'add-task')
      return { task: dialog.medication.task ?? '' } as Record<string, string>;
    return { name: '', sig: '' } as Record<string, string>;
  });

  const titles: Record<string, string> = {
    correct: 'Correct Medication',
    note: 'Medication Notes',
    'add-task': 'Add Task',
    add: 'Add Medication',
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const canSave =
    dialog.kind === 'correct' || dialog.kind === 'add'
      ? form.name.trim().length > 0
      : true;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} size="md">
      <ModalHeader>
        <ModalTitle>{titles[dialog.kind]}</ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="space-y-4">
        {dialog.kind !== 'add' && (
          <p className="text-muted-foreground text-sm">
            {dialog.medication.name}
          </p>
        )}
        {(dialog.kind === 'correct' || dialog.kind === 'add') && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="med-name">Medication</Label>
              <Input
                id="med-name"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. lisinopril 10 mg tablet"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-sig">Instructions (sig)</Label>
              <Input
                id="med-sig"
                value={form.sig}
                onChange={set('sig')}
                placeholder="e.g. 1 tablet by mouth daily"
              />
            </div>
          </>
        )}
        {dialog.kind === 'note' && (
          <div className="space-y-1.5">
            <Label htmlFor="med-note">Note</Label>
            <Textarea
              id="med-note"
              value={form.note}
              onChange={set('note')}
              rows={4}
            />
          </div>
        )}
        {dialog.kind === 'add-task' && (
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
        <Button onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
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
  readOnly = false,
  reconciledMessage,
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
      case 'correct':
        patchMedication(dialog.medication.id, {
          name: form.name.trim(),
          sig: form.sig.trim() || undefined,
        });
        break;
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
      case 'add':
        addMedication(form.name.trim(), form.sig.trim());
        break;
    }
  };

  return (
    <>
      <MedicationList
        medications={medications}
        title={title}
        readOnly={readOnly}
        actions={actions}
        onStatusChange={(med, status) => patchMedication(med.id, { status })}
        onAction={handleAction}
        quickAddOptions={quickAddOptions}
        onQuickAdd={(name) => addMedication(name)}
        onAddOther={() => setDialog({ kind: 'add' })}
        reconciledMessage={reconciledMessage}
        className={className}
        data-testid={dataTestId}
      />
      {dialog && (
        <MedicationDialog
          key={
            dialog.kind + ('medication' in dialog ? dialog.medication.id : '')
          }
          dialog={dialog}
          onClose={() => setDialog(null)}
          onSave={handleDialogSave}
        />
      )}
    </>
  );
}

export default MedicationReconciliation;
