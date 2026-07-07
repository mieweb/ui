'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { Card, CardHeader, CardContent } from '../Card/Card';
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  HandMetalIcon,
  HelpCircleIcon,
  PencilIcon,
  RefreshIcon,
  CalendarCheckIcon,
  StickyNoteIcon,
  BanIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  PlusIcon,
  GripVerticalIcon,
} from '../Icons';
import {
  useDragReorder,
  dragIndicatorClasses,
  type UseDragReorderReturn,
} from '../../hooks/useDragReorder';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';

// =============================================================================
// Types
// =============================================================================

/** Reconciliation status of a medication. */
export type MedicationStatus =
  | 'unreconciled'
  | 'taking'
  | 'taking-noncompliant'
  | 'not-taking'
  | 'unknown';

/** Coding-system reference for a medication (RxNorm / FDB / NDC …). */
export interface MedicationCode {
  /** Coding system, e.g. 'RxNORM', 'FDB', 'NDC' */
  system: string;
  /** Code within the system */
  code: string;
  /** Human-readable label the code was selected under */
  display?: string;
}

/**
 * A single medication in the presenting-medications list.
 *
 * Prescription-detail fields follow the NCPDP SCRIPT NewRx
 * `MedicationPrescribed` composite — see the README for the field mapping.
 * All are optional: a bare `{ id, name, status }` renders fine.
 */
export interface Medication {
  /** Stable unique id */
  id: string;
  /** Display name, e.g. "lisinopril 10 mg tablet" (NCPDP DrugDescription) */
  name: string;
  /** Patient-friendly instructions (NCPDP Sig / Directions) */
  sig?: string;
  /** Current reconciliation status */
  status: MedicationStatus;
  /** Whether the medication's end date has passed */
  expired?: boolean;
  /** Discontinued date (display string) — shown as "Discontinued on: date" */
  discontinuedDate?: string;
  /** Free-text note attached to the medication */
  note?: string;
  /** Follow-up task attached to the medication */
  task?: string;

  // —— Coding (NCPDP DrugCoded) ——
  /** Code reference (RxNorm / FDB / NDC) */
  code?: MedicationCode;

  // —— NCPDP SCRIPT NewRx prescription fields ——
  /** Strength, e.g. "10 mg" (Strength + StrengthUnitOfMeasure) */
  strength?: string;
  /** Dose form, e.g. "tablet" (DrugCoded/FormCode) */
  doseForm?: string;
  /** Quantity dispensed (Quantity/Value) */
  quantity?: string;
  /** Quantity unit of measure (Quantity/QuantityUnitOfMeasure) */
  quantityUnit?: string;
  /** Days supply (DaysSupply) */
  daysSupply?: string;
  /** Route of administration, e.g. "oral" */
  route?: string;
  /** Administration frequency, e.g. "Twice daily" */
  frequency?: string;
  /** As-needed flag (PRN) */
  prn?: boolean;
  /** Number of refills (NumberOfRefills) */
  refills?: string;
  /** Substitution / DAW: '0' permitted, '1' dispense as written */
  substitution?: '0' | '1';
  /** Start / written date (ISO yyyy-mm-dd) */
  startDate?: string;
  /** End date (ISO yyyy-mm-dd) */
  endDate?: string;
  /** Indication / diagnosis the medication treats */
  indication?: string;
  /** Note to pharmacy (Note) */
  pharmacyNotes?: string;
}

/** Non-status row actions revealed on hover. */
export type MedicationAction =
  | 'open'
  | 'correct'
  | 'refill'
  | 'add-task'
  | 'note'
  | 'remove'
  | 'move-up'
  | 'move-down';

export interface MedicationListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'title'
> {
  /** Medications to display (controlled — grouping is derived from status) */
  medications: Medication[];
  /** Header title (pass null to hide) */
  title?: string | null;
  /** Called when a status button is clicked on a row */
  onStatusChange?: (medication: Medication, status: MedicationStatus) => void;
  /** Called when a non-status row action is clicked */
  onAction?: (medication: Medication, action: MedicationAction) => void;
  /**
   * Called with the full ordered list of medication ids after a drag —
   * enables drag & drop reordering within a status group. The list renders in
   * props order; persist the ids and feed them back in.
   */
  onReorder?: (medicationIds: string[]) => void;
  /** Which non-status actions to show on each row (default: all) */
  actions?: MedicationAction[];
  /** Common medication names for the quick-add list (omit to hide) */
  quickAddOptions?: string[];
  /** Called when a quick-add option is clicked */
  onQuickAdd?: (name: string) => void;
  /** Called when "Other…" is clicked in the quick-add list */
  onAddOther?: () => void;
  /** Hide all action buttons (display only) */
  readOnly?: boolean;
  /** Message shown when the Unreconciled group is empty */
  reconciledMessage?: string;
  /** Message shown when the medication list has no entries at all */
  emptyMessage?: string;
  /**
   * Custom add UI (e.g. an inline CodeLookup search) rendered in the
   * add-medication section, before any quick-add pills. Use for
   * patient-facing entry where suggested medications would be leading.
   */
  addSearch?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

const GROUP_ORDER: MedicationStatus[] = [
  'unreconciled',
  'taking',
  'taking-noncompliant',
  'not-taking',
  'unknown',
];

export const MEDICATION_STATUS_LABELS: Record<MedicationStatus, string> = {
  unreconciled: 'Unreconciled',
  taking: 'Taking as Directed',
  'taking-noncompliant': 'Not Taking as Directed',
  'not-taking': 'Not Taking',
  unknown: 'Unknown',
};

const DEFAULT_ACTIONS: MedicationAction[] = [
  'open',
  'correct',
  'refill',
  'add-task',
  'note',
  'remove',
];

const ACTION_META: Record<
  MedicationAction,
  { label: string; icon: React.ComponentType<{ size?: number | string }> }
> = {
  open: { label: 'Open', icon: ExternalLinkIcon },
  correct: { label: 'Correct', icon: PencilIcon },
  refill: { label: 'Refill', icon: RefreshIcon },
  'add-task': { label: 'Add Task', icon: CalendarCheckIcon },
  note: { label: 'Notes', icon: StickyNoteIcon },
  remove: { label: 'Remove', icon: BanIcon },
  'move-up': { label: 'Move Up', icon: ChevronUpIcon },
  'move-down': { label: 'Move Down', icon: ChevronDownIcon },
};

const STATUS_BUTTON_META: {
  status: MedicationStatus;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
}[] = [
  { status: 'taking', label: 'Taking', icon: ThumbsUpIcon },
  {
    status: 'taking-noncompliant',
    label: 'Taking – Noncompliant',
    icon: HandMetalIcon,
  },
  { status: 'not-taking', label: 'Not Taking', icon: ThumbsDownIcon },
  { status: 'unknown', label: 'Unknown', icon: HelpCircleIcon },
];

// =============================================================================
// Sub-components
// =============================================================================

function RowIconButton({
  label,
  icon: Icon,
  onClick,
  active,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-pressed={active}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          'h-8 w-8 shrink-0',
          active &&
            'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
        )}
      >
        <Icon size={16} />
      </Button>
    </Tooltip>
  );
}

function MedicationRow({
  medication,
  actions,
  readOnly,
  drag,
  onMove,
  onStatusChange,
  onAction,
}: {
  medication: Medication;
  actions: MedicationAction[];
  readOnly: boolean;
  drag: UseDragReorderReturn;
  /** Keyboard equivalent of drag reordering (Alt+↑/↓) */
  onMove?: (medication: Medication, dir: -1 | 1) => void;
  onStatusChange?: (medication: Medication, status: MedicationStatus) => void;
  onAction?: (medication: Medication, action: MedicationAction) => void;
}) {
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      onMove?.(medication, e.key === 'ArrowUp' ? -1 : 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const list = e.currentTarget.closest('ul');
      if (!list) return;
      const rows = Array.from(
        list.querySelectorAll<HTMLElement>('li[data-medication-id]')
      );
      const i = rows.indexOf(e.currentTarget as HTMLElement);
      rows[
        e.key === 'ArrowUp'
          ? Math.max(0, i - 1)
          : Math.min(rows.length - 1, i + 1)
      ]?.focus();
    }
  };

  return (
    // Rows are focus stops when reordering is enabled so drag & drop has a
    // keyboard equivalent (Alt+↑/↓) — 508.
    /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
    <li
      data-medication-id={medication.id}
      tabIndex={drag.enabled ? 0 : undefined}
      onKeyDown={drag.enabled ? handleRowKeyDown : undefined}
      aria-label={
        drag.enabled
          ? `${medication.name}. Alt plus arrow keys to reorder.`
          : undefined
      }
      {...drag.rowProps(medication.id)}
      className={cn(
        'group border-border/60 relative flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b px-1 py-2',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        drag.enabled && 'cursor-grab active:cursor-grabbing',
        dragIndicatorClasses(drag, medication.id)
      )}
    >
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      {drag.enabled ? (
        <GripVerticalIcon
          size={14}
          aria-hidden
          className="text-muted-foreground/50 shrink-0"
        />
      ) : (
        <span className="text-muted-foreground/60 select-none">•</span>
      )}
      <span className="text-foreground font-medium">{medication.name}</span>
      {medication.code && (
        <span
          className="text-muted-foreground/70 text-xs"
          title={medication.code.display}
        >
          {medication.code.system} {medication.code.code}
        </span>
      )}
      {medication.sig && (
        <span className="text-muted-foreground text-sm">{medication.sig}</span>
      )}
      {medication.expired && (
        <span className="text-sm font-bold text-red-600 dark:text-red-400">
          EXPIRED
        </span>
      )}
      {medication.discontinuedDate && (
        <span className="text-muted-foreground text-sm">
          Discontinued on: {medication.discontinuedDate}
        </span>
      )}
      {(medication.note || medication.task) && (
        <span className="flex w-full basis-full flex-col gap-0.5 pl-4">
          {medication.note && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <StickyNoteIcon size={12} />
              {medication.note}
            </span>
          )}
          {medication.task && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CalendarCheckIcon size={12} />
              Task: {medication.task}
            </span>
          )}
        </span>
      )}

      {!readOnly && (
        <div
          role="toolbar"
          aria-label={`Actions for ${medication.name}`}
          className={cn(
            // Floating overlay on the right edge of the row
            'bg-card border-border absolute top-1/2 right-0 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-md border p-0.5 shadow-sm',
            // Hidden until hover / keyboard focus; always available to AT
            'pointer-events-none opacity-0 transition-opacity',
            'group-hover:pointer-events-auto group-hover:opacity-100',
            'focus-within:pointer-events-auto focus-within:opacity-100'
          )}
        >
          {actions.includes('open') && (
            <RowIconButton
              label={ACTION_META.open.label}
              icon={ACTION_META.open.icon}
              onClick={() => onAction?.(medication, 'open')}
            />
          )}
          {STATUS_BUTTON_META.map(({ status, label, icon }) => (
            <RowIconButton
              key={status}
              label={label}
              icon={icon}
              active={medication.status === status}
              onClick={() => onStatusChange?.(medication, status)}
            />
          ))}
          {actions
            .filter((a): a is Exclude<MedicationAction, 'open'> => a !== 'open')
            .map((action) => (
              <RowIconButton
                key={action}
                label={ACTION_META[action].label}
                icon={ACTION_META[action].icon}
                onClick={() => onAction?.(medication, action)}
              />
            ))}
        </div>
      )}
    </li>
  );
}

// =============================================================================
// MedicationList
// =============================================================================

/**
 * Presenting-medications list with medication reconciliation.
 *
 * Controlled component: medications (with their statuses) come in via props;
 * every user interaction is reported through callbacks. Rows are grouped by
 * reconciliation status; hovering (or keyboard-focusing) a row reveals the
 * status buttons and other row actions.
 *
 * @example
 * ```tsx
 * <MedicationList
 *   medications={meds}
 *   onStatusChange={(med, status) =>
 *     setMeds((prev) =>
 *       prev.map((m) => (m.id === med.id ? { ...m, status } : m))
 *     )
 *   }
 *   onAction={(med, action) => handleAction(med, action)}
 * />
 * ```
 */
export const MedicationList = React.forwardRef<
  HTMLDivElement,
  MedicationListProps
>(
  (
    {
      medications,
      title = 'Presenting medications',
      onStatusChange,
      onAction,
      onReorder,
      actions = DEFAULT_ACTIONS,
      quickAddOptions,
      onQuickAdd,
      onAddOther,
      readOnly = false,
      reconciledMessage = 'All medications reconciled.',
      emptyMessage = 'No medications recorded.',
      addSearch,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    // clears-then-sets so repeated identical messages re-announce
    const [announcement, setAnnouncement] = useLiveAnnouncement();

    const handleStatusChange = React.useCallback(
      (medication: Medication, status: MedicationStatus) => {
        setAnnouncement(
          `${medication.name} marked ${MEDICATION_STATUS_LABELS[status]}`
        );
        onStatusChange?.(medication, status);
      },
      [onStatusChange, setAnnouncement]
    );

    const groups = GROUP_ORDER.map((status) => ({
      status,
      label: MEDICATION_STATUS_LABELS[status],
      items: medications.filter((m) => m.status === status),
    })).filter((g) => g.items.length > 0 || g.status === 'unreconciled');

    // Drag & drop reordering, restricted to the same status group (a cross-
    // group drop would silently imply a reconciliation change).
    const statusOf = React.useCallback(
      (id: string) => medications.find((m) => m.id === id)?.status,
      [medications]
    );
    const drag = useDragReorder({
      ids: medications.map((m) => m.id),
      onReorder:
        readOnly || !onReorder
          ? undefined
          : (ids) => {
              // announce pointer drops too, not just keyboard moves
              setAnnouncement('Medication list reordered');
              onReorder(ids);
            },
      canDropOn: (dragged, target) => statusOf(dragged) === statusOf(target),
    });

    /** Keyboard equivalent of dragging a row: swap within the status group. */
    const moveMedication = React.useCallback(
      (medication: Medication, dir: -1 | 1) => {
        if (readOnly || !onReorder) return;
        const ids = medications.map((m) => m.id);
        const from = ids.indexOf(medication.id);
        let to = from + dir;
        while (
          to >= 0 &&
          to < medications.length &&
          medications[to].status !== medication.status
        ) {
          to += dir;
        }
        if (to < 0 || to >= medications.length) return;
        [ids[from], ids[to]] = [ids[to], ids[from]];
        setAnnouncement(
          `${medication.name} moved ${dir === -1 ? 'up' : 'down'}`
        );
        onReorder(ids);
      },
      [medications, onReorder, readOnly, setAnnouncement]
    );

    return (
      <Card
        ref={ref}
        padding="none"
        className={cn('w-full', className)}
        data-testid={dataTestId}
        {...props}
      >
        {title !== null && (
          <CardHeader className="border-border bg-muted/50 border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              {title}
            </h3>
          </CardHeader>
        )}

        <CardContent className="space-y-6 px-4 py-4">
          {groups.map(({ status, label, items }) => (
            <section key={status} aria-label={label}>
              <h4 className="border-border text-foreground border-b pb-1 text-sm font-semibold tracking-wide uppercase">
                {label}
              </h4>
              {items.length > 0 ? (
                <ul className="mt-1">
                  {items.map((medication) => (
                    <MedicationRow
                      key={medication.id}
                      medication={medication}
                      actions={actions}
                      readOnly={readOnly}
                      drag={drag}
                      onMove={moveMedication}
                      onStatusChange={handleStatusChange}
                      onAction={onAction}
                    />
                  ))}
                </ul>
              ) : medications.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  {emptyMessage}
                </p>
              ) : (
                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                  <Badge variant="success" size="sm">
                    ✓
                  </Badge>
                  {reconciledMessage}
                </p>
              )}
            </section>
          ))}

          {!readOnly && (addSearch || quickAddOptions?.length || onAddOther) && (
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Add medication
              </span>
              {addSearch}
              {(quickAddOptions?.length || onAddOther) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {quickAddOptions?.map((name) => (
                    <Button
                      key={name}
                      variant="ghost"
                      size="sm"
                      onClick={() => onQuickAdd?.(name)}
                      leftIcon={<PlusIcon size={12} />}
                      className="border-border h-auto rounded-full border px-2.5 py-1 text-xs"
                    >
                      {name}
                    </Button>
                  ))}
                  {onAddOther && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddOther}
                      leftIcon={<PlusIcon size={12} />}
                      className="h-auto rounded-full px-2.5 py-1 text-xs"
                    >
                      Other…
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Confirmation announcement for screen readers */}
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </Card>
    );
  }
);

MedicationList.displayName = 'MedicationList';

export default MedicationList;
