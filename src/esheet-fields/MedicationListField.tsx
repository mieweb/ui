/**
 * MedicationListField — eSheet custom field wrapper around MedicationList.
 *
 * Exposed via the `@mieweb/ui/esheet` entry point (NOT the main bundle) so
 * that @esheet/* stays an optional dependency.
 *
 * The field stores its state as JSON in `response.answer`:
 * `{ medications: Medication[] }`. Statuses, corrections, notes, tasks,
 * ordering, and additions are all persisted immediately via `onResponse`.
 *
 * @example
 * ```tsx
 * import { registerMedicationListFieldType } from '@mieweb/ui/esheet';
 *
 * registerMedicationListFieldType(); // before rendering EsheetBuilder/Renderer
 * ```
 */

import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { registerCustomFieldTypes } from '@esheet/fields';
import {
  MedicationList,
  type Medication,
  type MedicationAction,
  type MedicationStatus,
} from '../components/MedicationList';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Label } from '../components/Label';

// =============================================================================
// Response (de)serialization
// =============================================================================

export interface MedicationListFieldValue {
  medications: Medication[];
}

function parseValue(answer: string | undefined): MedicationListFieldValue {
  if (!answer) return { medications: [] };
  try {
    const parsed = JSON.parse(answer) as MedicationListFieldValue;
    return { medications: parsed.medications ?? [] };
  } catch {
    return { medications: [] };
  }
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
// Field component
// =============================================================================

const FIELD_ACTIONS: MedicationAction[] = [
  'correct',
  'add-task',
  'note',
  'remove',
  'move-up',
  'move-down',
];

export function MedicationListField({
  field,
  response,
  isPreview,
  isEnabled,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const definition = field.definition as {
    question?: string;
    medications?: Medication[];
    quickAddOptions?: string[];
  };

  // Response wins; otherwise seed from the field definition's medication list.
  const value = React.useMemo(() => {
    if (response?.answer) return parseValue(response.answer);
    return { medications: definition.medications ?? [] };
  }, [response?.answer, definition.medications]);

  const [dialog, setDialog] = React.useState<DialogState>(null);

  const commit = (medications: Medication[]) => {
    onResponse({ answer: JSON.stringify({ medications }) });
  };

  const patchMedication = (id: string, patch: Partial<Medication>) => {
    commit(
      value.medications.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const handleStatusChange = (med: Medication, status: MedicationStatus) => {
    patchMedication(med.id, { status });
  };

  const moveMedication = (med: Medication, direction: -1 | 1) => {
    // Reorder within the same status group.
    const meds = [...value.medications];
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
        commit(value.medications.filter((m) => m.id !== med.id));
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
        break;
    }
  };

  const addMedication = (name: string, sig?: string) => {
    commit([
      ...value.medications,
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

  const interactive = isPreview && isEnabled;

  return (
    <>
      <MedicationList
        medications={value.medications}
        title={definition.question ?? 'Presenting medications'}
        readOnly={!interactive}
        actions={FIELD_ACTIONS}
        onStatusChange={handleStatusChange}
        onAction={handleAction}
        quickAddOptions={definition.quickAddOptions}
        onQuickAdd={(name) => addMedication(name)}
        onAddOther={() => setDialog({ kind: 'add' })}
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

// =============================================================================
// Registration
// =============================================================================

/**
 * Register the `medicationList` field type with eSheet.
 * Call once before rendering EsheetBuilder or EsheetRenderer.
 */
export function registerMedicationListFieldType(): void {
  registerCustomFieldTypes({
    medicationList: {
      label: 'Medication Reconciliation',
      category: 'rich',
      answerType: 'text',
      hasOptions: false,
      hasMatrix: false,
      defaultProps: {
        question: 'Presenting medications',
        quickAddOptions: [
          'aspirin 81 mg tablet',
          'atorvastatin 20 mg tablet',
          'metformin 500 mg tablet',
        ],
      },
      component: MedicationListField,
    },
  });
}

