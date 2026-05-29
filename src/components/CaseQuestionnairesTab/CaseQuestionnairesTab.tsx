import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';

/** The set of DAR (Disability Action Request) action toggles. */
export interface DARActions {
  setTask: boolean;
  sendLetter: boolean;
  createInvoice: boolean;
  addAttachment: boolean;
  ltdSubmission: boolean;
}

const DEFAULT_ACTIONS: DARActions = {
  setTask: false,
  sendLetter: false,
  createInvoice: false,
  addAttachment: false,
  ltdSubmission: false,
};

const ACTION_LABELS: { key: keyof DARActions; label: string }[] = [
  { key: 'setTask', label: 'Set DAR Task' },
  { key: 'sendLetter', label: 'Send Letter' },
  { key: 'createInvoice', label: 'Create Invoice' },
  { key: 'addAttachment', label: 'Add Attachment' },
  { key: 'ltdSubmission', label: 'LTD App Submission' },
];

export interface CaseQuestionnairesTabProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Display value for the response date. Defaults to "Auto-generated". */
  responseDate?: string;
  /** Controlled DAR action toggle state. */
  actions?: Partial<DARActions>;
  /** Called with the full updated action set when any toggle changes. */
  onActionsChange?: (actions: DARActions) => void;
  /** Controlled notes value. */
  notes?: string;
  /** Called with the new notes value on change. */
  onNotesChange?: (notes: string) => void;
  /** Called when the "Create DAR" button is clicked. */
  onCreateDAR?: () => void;
}

/**
 * Presentational DAR (Disability Action Request) questionnaire panel.
 *
 * The action checkboxes and notes field can be used uncontrolled, or driven by
 * supplying {@link CaseQuestionnairesTabProps.actions} / {@link CaseQuestionnairesTabProps.notes}
 * with their respective change callbacks.
 */
export const CaseQuestionnairesTab = React.forwardRef<
  HTMLDivElement,
  CaseQuestionnairesTabProps
>(
  (
    {
      responseDate = 'Auto-generated',
      actions,
      onActionsChange,
      notes,
      onNotesChange,
      onCreateDAR,
      className,
      ...props
    },
    ref
  ) => {
    const [internalActions, setInternalActions] =
      React.useState<DARActions>(DEFAULT_ACTIONS);
    const resolvedActions: DARActions = {
      ...DEFAULT_ACTIONS,
      ...(actions ?? internalActions),
    };

    const toggle = (key: keyof DARActions, checked: boolean) => {
      const next = { ...resolvedActions, [key]: checked };
      if (actions === undefined) setInternalActions(next);
      onActionsChange?.(next);
    };

    return (
      <div
        ref={ref}
        data-slot="case-questionnaires-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Questionnaires — DAR (Disability Action Request)
          </h3>
          <Button size="sm" onClick={onCreateDAR}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create DAR
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="response-date" className="text-sm text-muted-foreground">
              Date of Response
            </Label>
            <div
              id="response-date"
              className="rounded-md bg-muted px-3 py-2 text-sm"
            >
              {responseDate}
            </div>
          </div>
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">DAR Actions</legend>
          <div className="space-y-3">
            {ACTION_LABELS.map(({ key, label }) => (
              <Checkbox
                key={key}
                label={label}
                checked={resolvedActions[key]}
                onChange={(e) => toggle(key, e.target.checked)}
              />
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="dar-notes" className="text-sm text-muted-foreground">
            Notes
          </Label>
          <Input
            id="dar-notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
          />
        </div>
      </div>
    );
  }
);

CaseQuestionnairesTab.displayName = 'CaseQuestionnairesTab';
