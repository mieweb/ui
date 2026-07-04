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

/** A single medication in the presenting-medications list. */
export interface Medication {
  /** Stable unique id */
  id: string;
  /** Display name, e.g. "lisinopril 10 mg tablet" */
  name: string;
  /** Patient-friendly instructions (sig), shown in gray after the name */
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
  'move-up',
  'move-down',
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
  onStatusChange,
  onAction,
}: {
  medication: Medication;
  actions: MedicationAction[];
  readOnly: boolean;
  drag: UseDragReorderReturn;
  onStatusChange?: (medication: Medication, status: MedicationStatus) => void;
  onAction?: (medication: Medication, action: MedicationAction) => void;
}) {
  return (
    <li
      data-medication-id={medication.id}
      {...drag.rowProps(medication.id)}
      className={cn(
        'group border-border/60 relative flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b px-1 py-2',
        drag.enabled && 'cursor-grab active:cursor-grabbing',
        dragIndicatorClasses(drag, medication.id)
      )}
    >
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
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [announcement, setAnnouncement] = React.useState('');

    const handleStatusChange = React.useCallback(
      (medication: Medication, status: MedicationStatus) => {
        setAnnouncement(
          `${medication.name} marked ${MEDICATION_STATUS_LABELS[status]}`
        );
        onStatusChange?.(medication, status);
      },
      [onStatusChange]
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
      onReorder: readOnly ? undefined : onReorder,
      canDropOn: (dragged, target) => statusOf(dragged) === statusOf(target),
    });

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
                      onStatusChange={handleStatusChange}
                      onAction={onAction}
                    />
                  ))}
                </ul>
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

          {!readOnly && (quickAddOptions?.length || onAddOther) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Add medication
              </span>
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
