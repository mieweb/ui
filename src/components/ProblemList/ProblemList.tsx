'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { Card, CardHeader, CardContent } from '../Card/Card';
import {
  PencilIcon,
  RefreshIcon,
  CheckCircleIcon,
  LinkIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  HistoryIcon,
  HelpCircleIcon,
  GripVerticalIcon,
  StickyNoteIcon,
} from '../Icons';
import {
  useDragReorder,
  dragIndicatorClasses,
  type UseDragReorderReturn,
} from '../../hooks/useDragReorder';
import {
  RowActionToolbar,
  RowIconButton,
  toolbarKeyNav,
} from '../RowActionToolbar';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';

// Re-exported for backwards compatibility — the implementation moved to
// RowActionToolbar alongside the toolbar it serves.
export { toolbarKeyNav };

// =============================================================================
// Types — shared condition (concern/assertion) model
// =============================================================================

/** A single coding on a condition assertion (ICD-10 / ICD-11 / SNOMED). */
export interface ConditionCoding {
  /** Coding system, e.g. 'ICD-10-CM', 'ICD-11', 'SNOMED' */
  system: 'ICD-10-CM' | 'ICD-11' | 'SNOMED' | string;
  code: string;
  display?: string;
  /** Which coding is authoritative for this assertion */
  primary?: boolean;
  /** Provenance when derived via a crosswalk (e.g. SNOMED→ICD-10 map) */
  mappedFrom?: string;
}

/** Longitudinal status of the concern (the stable problem thread). */
export type ConcernStatus =
  | 'active'
  | 'recurrence'
  | 'relapse'
  | 'inactive'
  | 'remission'
  | 'resolved';

/** FHIR-aligned verification status of an assertion. */
export type VerificationStatus =
  | 'unconfirmed'
  | 'provisional'
  | 'differential'
  | 'confirmed'
  | 'refuted'
  | 'entered-in-error';

/** Why an assertion superseded its predecessor. */
export type AssertionChangeType =
  | 'refinement'
  | 'revision'
  | 'progression'
  | 'reattribution';

// ---- Uncertainty (mirrors §4 of the design doc) ----

/** Three-state flag for an optional field: confident / uncertain / explicitly unknown. */
export interface FieldUncertainty {
  /** false = explicitly unknown ("asked; patient doesn't know") — distinct from untouched */
  known: boolean;
  /** Why the value is absent (~ FHIR data-absent-reason) */
  reason?: 'asked-unknown' | 'not-asked' | 'masked' | 'unavailable';
  /** Softness of a value that IS present */
  confidence?: 'low' | 'medium' | 'high';
  note?: string;
}

/** Condition fields that can carry per-field uncertainty. */
export type UncertainConditionField =
  | 'coding'
  | 'onset'
  | 'severity'
  | 'laterality'
  | 'bodySite';

/** First-class uncertainty block for a condition assertion. */
export interface Uncertainty {
  overall?: 'confirmed' | 'low' | 'medium' | 'high';
  fields?: Partial<Record<UncertainConditionField, FieldUncertainty>>;
}

/** A time-stamped, coded characterization of a concern. */
export interface ConditionAssertion {
  id: string;
  /** Display date the assertion was made, e.g. "2023-06-14" */
  date: string;
  /** Free-text condition name — the only hard-required clinical field */
  text: string;
  coding?: ConditionCoding[];
  verificationStatus: VerificationStatus;
  /** How this assertion relates to the one it supersedes */
  changeType?: AssertionChangeType;
  /** Id of the assertion this one supersedes */
  supersedes?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  /** Onset — exact date and/or fuzzy human string ("since her twenties") */
  onset?: { date?: string; fuzzy?: string };
  /** First-class uncertainty (§4 of the design doc) */
  uncertainty?: Uncertainty;
  note?: string;
}

/** Relationship between two concerns. */
export interface ConcernRelationship {
  type:
    | 'caused-by'
    | 'evolved-from'
    | 'differential-sibling'
    | 'complication-of';
  /** concernId of the related concern */
  concernId: string;
  /** Display name of the related concern */
  display?: string;
}

/** A quick, dated progress note about a concern — lighter than an assertion. */
export interface ConditionObservation {
  id: string;
  /** Display date, e.g. "2026-07-03" */
  date: string;
  text: string;
  author?: string;
}

/**
 * A stable problem thread. The concernId is the durable identity that orders
 * and encounters reference; assertions carry the evolving codes.
 */
export interface ConditionConcern {
  concernId: string;
  clinicalStatus: ConcernStatus;
  /** Ordered oldest → newest; the last non-refuted assertion is current */
  assertions: ConditionAssertion[];
  /** Quick progress notes over time (newest last) */
  observations?: ConditionObservation[];
  relationships?: ConcernRelationship[];
  /** Where the concern came from */
  source?:
    | 'ehrProblemList'
    | 'patientReported'
    | 'manuallyAdded'
    | 'claimsHistory';
}

/** Row actions on a concern. */
export type ProblemListAction =
  | 'open'
  | 'observe'
  | 'refine'
  | 'revise'
  | 'resolve'
  | 'relate'
  | 'move-up'
  | 'move-down';

export interface ProblemListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'title'
> {
  /** Patient-level concerns (controlled) */
  concerns: ConditionConcern[];
  /** Header title (pass null to hide) */
  title?: string | null;
  /** Called when a row action is clicked */
  onAction?: (concern: ConditionConcern, action: ProblemListAction) => void;
  /** Called when a new problem is added via the capture-first input */
  onAddProblem?: (text: string) => void;
  /**
   * Called with the full ordered list of concernIds after a move — via drag
   * and drop, the move buttons, or Alt+Arrow keys. Enables reordering. The
   * component renders concerns in props order — persist the ids wherever the
   * encounter/patient object lives and feed them back in.
   */
  onReorder?: (concernIds: string[]) => void;
  /** Which row actions to show (default: all) */
  actions?: ProblemListAction[];
  /** Hide all action buttons (display only) */
  readOnly?: boolean;
  /** Message shown when there are no concerns */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

const GROUP_ORDER: { key: string; label: string; statuses: ConcernStatus[] }[] =
  [
    {
      key: 'active',
      label: 'Active',
      statuses: ['active', 'recurrence', 'relapse'],
    },
    { key: 'inactive', label: 'Inactive', statuses: ['inactive', 'remission'] },
    { key: 'resolved', label: 'Resolved', statuses: ['resolved'] },
  ];

/**
 * Grouping key for a concern. Unconfirmed concerns (current assertion not yet
 * verified) live in their own group, separate from Active / Resolved.
 */
export function concernGroupKey(concern: ConditionConcern): string {
  if (currentAssertion(concern)?.verificationStatus === 'unconfirmed') {
    return 'unconfirmed';
  }
  return (
    GROUP_ORDER.find((g) => g.statuses.includes(concern.clinicalStatus))?.key ??
    'active'
  );
}

export const CONCERN_STATUS_LABELS: Record<ConcernStatus, string> = {
  active: 'Active',
  recurrence: 'Recurrence',
  relapse: 'Relapse',
  inactive: 'Inactive',
  remission: 'Remission',
  resolved: 'Resolved',
};

export const CHANGE_TYPE_LABELS: Record<AssertionChangeType, string> = {
  refinement: 'Refined',
  revision: 'Revised',
  progression: 'Progressed',
  reattribution: 'Re-attributed',
};

const DEFAULT_ACTIONS: ProblemListAction[] = [
  'open',
  'observe',
  'refine',
  'revise',
  'resolve',
  'relate',
  'move-up',
  'move-down',
];

const ACTION_META: Record<
  ProblemListAction,
  { label: string; icon: React.ComponentType<{ size?: number | string }> }
> = {
  open: { label: 'Open', icon: ExternalLinkIcon },
  observe: { label: 'Add observation (progress note)', icon: StickyNoteIcon },
  refine: { label: 'Refine (more specific)', icon: PencilIcon },
  revise: { label: 'Revise (prior was wrong)', icon: RefreshIcon },
  resolve: { label: 'Resolve', icon: CheckCircleIcon },
  relate: { label: 'Relate to another problem', icon: LinkIcon },
  'move-up': { label: 'Move up (Alt+↑)', icon: ChevronUpIcon },
  'move-down': { label: 'Move down (Alt+↓)', icon: ChevronDownIcon },
};

const VERIFICATION_BADGE: Record<
  VerificationStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline';
  }
> = {
  unconfirmed: { label: 'Unconfirmed', variant: 'outline' },
  provisional: { label: 'Provisional', variant: 'warning' },
  differential: { label: 'Differential', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  refuted: { label: 'Refuted', variant: 'secondary' },
  'entered-in-error': { label: 'Entered in error', variant: 'secondary' },
};

// =============================================================================
// Helpers
// =============================================================================

/** The current (last non-refuted, non-error) assertion of a concern. */
export function currentAssertion(
  concern: ConditionConcern
): ConditionAssertion | undefined {
  for (let i = concern.assertions.length - 1; i >= 0; i--) {
    const a = concern.assertions[i];
    if (
      a.verificationStatus !== 'refuted' &&
      a.verificationStatus !== 'entered-in-error'
    ) {
      return a;
    }
  }
  return concern.assertions[concern.assertions.length - 1];
}

const UNCERTAIN_FIELD_LABELS: Record<UncertainConditionField, string> = {
  coding: 'Coding',
  onset: 'Onset',
  severity: 'Severity',
  laterality: 'Laterality',
  bodySite: 'Body site',
};

function describeFieldUncertainty(
  field: UncertainConditionField,
  f: FieldUncertainty
): string {
  const label = UNCERTAIN_FIELD_LABELS[field];
  if (!f.known) {
    const reason =
      f.reason === 'asked-unknown'
        ? 'asked — unknown'
        : (f.reason ?? 'unknown').replace(/-/g, ' ');
    return `${label}: ${reason}${f.note ? ` (${f.note})` : ''}`;
  }
  return `${label}: ${f.confidence ?? 'uncertain'} confidence${f.note ? ` (${f.note})` : ''}`;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Parenthetical coding display. Clinicians don't need chip noise: inline we
 * show only ICD-10/ICD-11 codes, unlabeled (the code format is obvious), and
 * SNOMED stays out of the way. The full coding background — every system,
 * display name, and crosswalk provenance — lives in the tooltip.
 */
export function CodingChips({ coding }: { coding?: ConditionCoding[] }) {
  if (!coding?.length) return null;
  const icd = coding.filter((c) => c.system.startsWith('ICD'));
  const inline = icd.length > 0 ? icd : coding.filter((c) => c.primary);
  const label = inline.map((c) => c.code).join(', ');
  return (
    <Tooltip
      content={
        <span className="flex flex-col gap-0.5">
          {coding.map((c) => (
            <span key={`${c.system}:${c.code}`}>
              {c.system} {c.code}
              {c.display ? ` — ${c.display}` : ''}
              {c.primary ? ' · primary' : ''}
              {c.mappedFrom ? ` · mapped from ${c.mappedFrom}` : ''}
            </span>
          ))}
        </span>
      }
    >
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        ({label || 'coded'})
      </span>
    </Tooltip>
  );
}

/**
 * Full concern background for a hover/long-press tooltip: assertion history,
 * coding background, and recent observations.
 */
export function concernHistoryContent(
  concern: ConditionConcern
): React.ReactNode {
  return (
    <span className="flex max-w-xs flex-col gap-1">
      <span className="font-semibold">History</span>
      {[...concern.assertions].reverse().map((a) => (
        <span key={a.id}>
          {a.date} — {a.text}
          {a.changeType
            ? ` (${CHANGE_TYPE_LABELS[a.changeType].toLowerCase()})`
            : ''}
          {a.verificationStatus === 'refuted' ? ' — refuted' : ''}
        </span>
      ))}
      {concern.observations && concern.observations.length > 0 && (
        <>
          <span className="mt-1 font-semibold">Observations</span>
          {[...concern.observations]
            .reverse()
            .slice(0, 3)
            .map((o) => (
              <span key={o.id}>
                {o.date} — {o.text}
              </span>
            ))}
        </>
      )}
      {(currentAssertion(concern)?.coding?.length ?? 0) > 0 && (
        <>
          <span className="mt-1 font-semibold">Coding</span>
          {currentAssertion(concern)!.coding!.map((c) => (
            <span key={`${c.system}:${c.code}`}>
              {c.system} {c.code}
              {c.display ? ` — ${c.display}` : ''}
            </span>
          ))}
        </>
      )}
    </span>
  );
}

/** Badge summarizing an assertion's uncertainty block (§4 of the design doc). */
export function UncertaintyBadge({
  uncertainty,
}: {
  uncertainty?: Uncertainty;
}) {
  if (!uncertainty) return null;
  const fieldEntries = Object.entries(uncertainty.fields ?? {}) as Array<
    [UncertainConditionField, FieldUncertainty]
  >;
  const overall =
    uncertainty.overall && uncertainty.overall !== 'confirmed'
      ? uncertainty.overall
      : null;
  if (!overall && fieldEntries.length === 0) return null;
  const lines = [
    ...(overall ? [`Overall certainty: ${overall}`] : []),
    ...fieldEntries.map(([field, f]) => describeFieldUncertainty(field, f)),
  ];
  return (
    <Tooltip content={lines.join(' · ')}>
      <Badge variant="warning" size="sm" className="gap-1">
        <HelpCircleIcon size={10} />
        {overall ? `${overall} certainty` : `${fieldEntries.length} uncertain`}
      </Badge>
    </Tooltip>
  );
}

function AssertionTimeline({ concern }: { concern: ConditionConcern }) {
  const items = [...concern.assertions].reverse(); // newest first
  return (
    <ol
      aria-label="Assertion history"
      className="border-border mt-2 ml-1.5 space-y-2 border-l pl-4"
    >
      {items.map((a) => {
        const refuted =
          a.verificationStatus === 'refuted' ||
          a.verificationStatus === 'entered-in-error';
        const verification = VERIFICATION_BADGE[a.verificationStatus];
        return (
          <li key={a.id} className="relative text-sm">
            <span
              aria-hidden
              className="bg-border absolute top-1.5 -left-5 h-2 w-2 rounded-full"
            />
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-muted-foreground text-xs tabular-nums">
                {a.date}
              </span>
              <span
                className={cn(
                  'text-foreground font-medium',
                  refuted && 'text-muted-foreground line-through'
                )}
              >
                {a.text}
              </span>
              {a.changeType && (
                <Badge variant="secondary" size="sm">
                  {CHANGE_TYPE_LABELS[a.changeType]}
                </Badge>
              )}
              <Badge variant={verification.variant} size="sm">
                {verification.label}
              </Badge>
              <UncertaintyBadge uncertainty={a.uncertainty} />
              <CodingChips coding={a.coding} />
            </span>
            {a.note && (
              <p className="text-muted-foreground mt-0.5 text-xs">{a.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ConcernRow({
  concern,
  actions,
  readOnly,
  canReorder,
  drag,
  onAction,
}: {
  concern: ConditionConcern;
  actions: ProblemListAction[];
  readOnly: boolean;
  canReorder: boolean;
  drag: UseDragReorderReturn;
  onAction?: (concern: ConditionConcern, action: ProblemListAction) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const current = currentAssertion(concern);
  const hasHistory = concern.assertions.length > 1;

  const visibleActions = actions.filter(
    (a) => canReorder || (a !== 'move-up' && a !== 'move-down')
  );

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      if (!canReorder) return;
      e.preventDefault();
      onAction?.(concern, e.key === 'ArrowUp' ? 'move-up' : 'move-down');
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Roving focus between rows
      e.preventDefault();
      const list = e.currentTarget.closest('ul');
      if (!list) return;
      const rows = Array.from(
        list.querySelectorAll<HTMLElement>('li[data-concern-id]')
      );
      const i = rows.indexOf(e.currentTarget as HTMLElement);
      rows[
        e.key === 'ArrowUp'
          ? Math.max(0, i - 1)
          : Math.min(rows.length - 1, i + 1)
      ]?.focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && hasHistory) {
      e.preventDefault();
      setExpanded((v) => !v);
    }
  };

  if (!current) return null;

  return (
    // Roving-focus row (WAI-ARIA listbox-like keyboard pattern): the row is a
    // legitimate focus stop so ↑/↓ navigate rows, Enter toggles history, and
    // Alt+↑/↓ reorders — required for 508 keyboard operability.
    /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
    <li
      data-concern-id={concern.concernId}
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
      {...drag.rowProps(concern.concernId)}
      aria-label={`${current.text}. ${hasHistory ? 'Press Enter to toggle history. ' : ''}${canReorder ? 'Alt plus arrow keys to reorder.' : ''}`}
      className={cn(
        'group border-border/60 relative border-b px-1 py-2',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        drag.enabled && 'cursor-grab active:cursor-grabbing',
        dragIndicatorClasses(drag, concern.concernId)
      )}
    >
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1">
        {drag.enabled ? (
          <GripVerticalIcon
            size={14}
            aria-hidden
            className="text-muted-foreground/50 shrink-0"
          />
        ) : (
          <span className="text-muted-foreground/60 select-none">•</span>
        )}
        {/* Hover (or long-press on touch) the name for the complete background:
            assertion history, observations, and coding provenance. */}
        <Tooltip content={concernHistoryContent(concern)}>
          <span className="text-foreground font-medium">{current.text}</span>
        </Tooltip>
        <CodingChips coding={current.coding} />
        {/* 'unconfirmed' is conveyed by the Unconfirmed group header */}
        {current.verificationStatus !== 'confirmed' &&
          current.verificationStatus !== 'unconfirmed' && (
            <Badge
              variant={VERIFICATION_BADGE[current.verificationStatus].variant}
              size="sm"
            >
              {VERIFICATION_BADGE[current.verificationStatus].label}
            </Badge>
          )}
        <UncertaintyBadge uncertainty={current.uncertainty} />
        {concern.relationships?.map((r) => (
          <Badge key={`${r.type}:${r.concernId}`} variant="outline" size="sm">
            <LinkIcon size={10} className="mr-1" />
            {r.type.replace(/-/g, ' ')}
            {r.display ? `: ${r.display}` : ''}
          </Badge>
        ))}
        {hasHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            leftIcon={<HistoryIcon size={12} />}
            rightIcon={
              expanded ? (
                <ChevronUpIcon size={12} />
              ) : (
                <ChevronDownIcon size={12} />
              )
            }
            className="text-muted-foreground h-auto px-1.5 py-0.5 text-xs"
          >
            {concern.assertions.length} assertions
          </Button>
        )}

        {!readOnly && (
          <RowActionToolbar label={`Actions for ${current.text}`} align="top">
            {visibleActions.map((action) => (
              <RowIconButton
                key={action}
                label={ACTION_META[action].label}
                icon={ACTION_META[action].icon}
                onClick={() => onAction?.(concern, action)}
              />
            ))}
          </RowActionToolbar>
        )}
      </div>

      {expanded && (
        <>
          <AssertionTimeline concern={concern} />
          {concern.observations && concern.observations.length > 0 && (
            <div className="mt-2 ml-1.5 pl-4">
              <h5 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Observations
              </h5>
              <ol aria-label="Observations" className="mt-1 space-y-1">
                {[...concern.observations].reverse().map((o) => (
                  <li key={o.id} className="flex flex-wrap gap-x-2 text-sm">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {o.date}
                    </span>
                    <span className="text-foreground">{o.text}</span>
                    {o.author && (
                      <span className="text-muted-foreground text-xs">
                        — {o.author}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </li>
  );
}

// =============================================================================
// ProblemList
// =============================================================================

/**
 * Patient-level problem list built on the concern/assertion model: each row is
 * a stable ConditionConcern whose coded characterization evolves through an
 * assertion history (refinement / revision / progression). Rows expand to show
 * the assertion timeline; refuted assertions render struck-through.
 *
 * Controlled component: concerns come in via props; every user interaction is
 * reported through callbacks.
 *
 * @example
 * ```tsx
 * <ProblemList
 *   concerns={concerns}
 *   onAction={(concern, action) => handleAction(concern, action)}
 *   onAddProblem={(text) => addConcern(text)}
 * />
 * ```
 */
export const ProblemList = React.forwardRef<HTMLDivElement, ProblemListProps>(
  (
    {
      concerns,
      title = 'Problem list',
      onAction,
      onAddProblem,
      onReorder,
      actions = DEFAULT_ACTIONS,
      readOnly = false,
      emptyMessage = 'No problems recorded.',
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [draft, setDraft] = React.useState('');
    // clears-then-sets so repeated identical messages re-announce
    const [announcement, setAnnouncement] = useLiveAnnouncement();

    const submitDraft = () => {
      const text = draft.trim();
      if (!text) return;
      onAddProblem?.(text);
      setDraft('');
    };

    /** Swap with the adjacent concern in the same group, then report the full order. */
    const moveConcern = React.useCallback(
      (concern: ConditionConcern, dir: -1 | 1) => {
        if (!onReorder || readOnly) return;
        const groupKey = concernGroupKey(concern);
        const ids = concerns.map((c) => c.concernId);
        const from = ids.indexOf(concern.concernId);
        // nearest neighbor in the same group
        let to = from + dir;
        while (
          to >= 0 &&
          to < concerns.length &&
          concernGroupKey(concerns[to]) !== groupKey
        ) {
          to += dir;
        }
        if (to < 0 || to >= concerns.length) return;
        [ids[from], ids[to]] = [ids[to], ids[from]];
        const current = currentAssertion(concern);
        setAnnouncement(
          `${current?.text ?? concern.concernId} moved ${dir === -1 ? 'up' : 'down'}`
        );
        onReorder(ids);
      },
      [concerns, onReorder, readOnly, setAnnouncement]
    );

    const handleAction = React.useCallback(
      (concern: ConditionConcern, action: ProblemListAction) => {
        if (action === 'move-up') moveConcern(concern, -1);
        else if (action === 'move-down') moveConcern(concern, 1);
        else onAction?.(concern, action);
      },
      [moveConcern, onAction]
    );

    // Drag & drop reordering, restricted to the same group (a cross-group
    // drop would silently imply a status change).
    const groupOf = React.useCallback(
      (id: string) => {
        const c = concerns.find((x) => x.concernId === id);
        return c ? concernGroupKey(c) : undefined;
      },
      [concerns]
    );
    const drag = useDragReorder({
      ids: concerns.map((c) => c.concernId),
      onReorder:
        readOnly || !onReorder
          ? undefined
          : (newIds) => {
              // announce pointer drops too, not just keyboard moves
              setAnnouncement('Problem list reordered');
              onReorder(newIds);
            },
      canDropOn: (dragged, target) => groupOf(dragged) === groupOf(target),
    });

    // Unconfirmed concerns get their own list, ahead of Active / Resolved.
    const groups = [
      {
        key: 'unconfirmed',
        label: 'Unconfirmed',
        items: concerns.filter((c) => concernGroupKey(c) === 'unconfirmed'),
      },
      ...GROUP_ORDER.map(({ key, label }) => ({
        key,
        label,
        items: concerns.filter((c) => concernGroupKey(c) === key),
      })),
    ].filter((g) => g.items.length > 0 || g.key === 'active');

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
          {groups.map(({ key, label, items }) => (
            <section key={key} aria-label={label}>
              <h4 className="border-border text-foreground border-b pb-1 text-sm font-semibold tracking-wide uppercase">
                {label}
              </h4>
              {items.length > 0 ? (
                <ul className="mt-1">
                  {items.map((concern) => (
                    <ConcernRow
                      key={concern.concernId}
                      concern={concern}
                      actions={actions}
                      readOnly={readOnly}
                      canReorder={drag.enabled}
                      drag={drag}
                      onAction={handleAction}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">
                  {emptyMessage}
                </p>
              )}
            </section>
          ))}

          {!readOnly && onAddProblem && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitDraft();
                }}
                placeholder="Add problem (name is enough)…"
                aria-label="Add problem"
                className={cn(
                  'border-border bg-background text-foreground placeholder:text-muted-foreground',
                  'h-8 flex-1 rounded-md border px-2.5 text-sm',
                  'focus:ring-ring focus:ring-2 focus:outline-none'
                )}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={submitDraft}
                disabled={!draft.trim()}
                leftIcon={<PlusIcon size={12} />}
                className="h-8"
              >
                Add
              </Button>
            </div>
          )}
        </CardContent>

        {/* Reorder announcements for screen readers */}
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </Card>
    );
  }
);

ProblemList.displayName = 'ProblemList';

export default ProblemList;
