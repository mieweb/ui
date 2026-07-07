'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { Card, CardHeader, CardContent } from '../Card/Card';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import {
  useDragReorder,
  dragIndicatorClasses,
  type UseDragReorderReturn,
} from '../../hooks/useDragReorder';
import {
  PencilIcon,
  StickyNoteIcon,
  BanIcon,
  PlusIcon,
  AlertCircleIcon,
  GripVerticalIcon,
} from '../Icons';

// =============================================================================
// Types
// =============================================================================

/** Allergy category (FHIR AllergyIntolerance.category). */
export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';

/**
 * Mechanism distinction (FHIR AllergyIntolerance.type): a true
 * immune-mediated allergy vs a non-immune intolerance (e.g. GI upset).
 * The distinction matters clinically — an intolerance mislabeled as an
 * allergy causes unnecessary avoidance of first-line drugs.
 */
export type AllergyKind = 'allergy' | 'intolerance';

/** Reaction severity (FHIR reaction.severity). */
export type AllergySeverity = 'mild' | 'moderate' | 'severe';

/** Coding-system reference for an allergen (RxNorm / FDB / SNOMED …). */
export interface AllergyCode {
  system: string;
  code: string;
  display?: string;
}

/**
 * A single allergy / intolerance.
 *
 * Loosely follows FHIR AllergyIntolerance: allergen (+ optional code),
 * category, reaction, severity, onset, and clinical status.
 */
export interface Allergy {
  /** Stable unique id */
  id: string;
  /** Allergen display name, e.g. "penicillin" */
  allergen: string;
  /** Category — groups the list */
  type?: AllergyType;
  /** Allergy vs intolerance (FHIR AllergyIntolerance.type; default 'allergy') */
  kind?: AllergyKind;
  /** Reaction description, e.g. "hives" */
  reaction?: string;
  /** Reaction severity — drives the badge color */
  severity?: AllergySeverity;
  /** Onset date (display string) */
  onsetDate?: string;
  /** Free-text note */
  note?: string;
  /** Inactive/resolved entries render struck through */
  inactive?: boolean;
  /** Code reference (RxNorm/FDB for drugs, SNOMED otherwise) */
  code?: AllergyCode;
}

/** Row actions revealed on hover. */
export type AllergyAction = 'correct' | 'note' | 'remove';

export interface AllergyListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'title'
> {
  /** Allergies to display (controlled) */
  allergies: Allergy[];
  /**
   * No-known-allergies flag (NKA/NKDA). An empty list is ambiguous —
   * "not asked" vs "asked, none" — so this is explicit tri-state:
   * undefined = not recorded, true = no known allergies.
   * Ignored when `allergies` is non-empty.
   */
  noKnownAllergies?: boolean;
  /** Called when the no-known-allergies affordance is toggled */
  onNoKnownAllergiesChange?: (value: boolean) => void;
  /** Header title (pass null to hide) */
  title?: string | null;
  /** Row actions to show (default: all) */
  actions?: AllergyAction[];
  /** Called when a row action is clicked */
  onAction?: (allergy: Allergy, action: AllergyAction) => void;
  /**
   * Called with the full new id order after a drag/keyboard reorder.
   * Omit to disable reordering. Drops are restricted to the same
   * category group.
   */
  onReorder?: (allergyIds: string[]) => void;
  /** Custom add UI (e.g. an inline CodeLookup search) */
  addSearch?: React.ReactNode;
  /** Called when the "Add allergy" button is clicked (omit to hide) */
  onAdd?: () => void;
  /** Hide all action affordances (display only) */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TYPE_ORDER: AllergyType[] = ['drug', 'food', 'environmental', 'other'];

export const ALLERGY_TYPE_LABELS: Record<AllergyType, string> = {
  drug: 'Drug',
  food: 'Food',
  environmental: 'Environmental',
  other: 'Other',
};

const SEVERITY_BADGE: Record<
  AllergySeverity,
  'danger' | 'warning' | 'secondary'
> = {
  severe: 'danger',
  moderate: 'warning',
  mild: 'secondary',
};

const DEFAULT_ACTIONS: AllergyAction[] = ['correct', 'note', 'remove'];

const ACTION_META: Record<
  AllergyAction,
  { label: string; icon: React.ComponentType<{ size?: number | string }> }
> = {
  correct: { label: 'Correct', icon: PencilIcon },
  note: { label: 'Notes', icon: StickyNoteIcon },
  remove: { label: 'Remove', icon: BanIcon },
};

// =============================================================================
// Sub-components
// =============================================================================

function RowIconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
  onClick: () => void;
}) {
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="h-8 w-8 shrink-0"
      >
        <Icon size={16} />
      </Button>
    </Tooltip>
  );
}

function AllergyRow({
  allergy,
  actions,
  readOnly,
  drag,
  onMove,
  onAction,
}: {
  allergy: Allergy;
  actions: AllergyAction[];
  readOnly: boolean;
  drag: UseDragReorderReturn;
  /** Keyboard equivalent of drag reordering (Alt+↑/↓) */
  onMove?: (allergy: Allergy, dir: -1 | 1) => void;
  onAction?: (allergy: Allergy, action: AllergyAction) => void;
}) {
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      onMove?.(allergy, e.key === 'ArrowUp' ? -1 : 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const list = e.currentTarget.closest('ul');
      if (!list) return;
      const rows = Array.from(
        list.querySelectorAll<HTMLElement>('li[data-allergy-id]')
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
      data-allergy-id={allergy.id}
      tabIndex={drag.enabled ? 0 : undefined}
      onKeyDown={drag.enabled ? handleRowKeyDown : undefined}
      aria-label={
        drag.enabled
          ? `${allergy.allergen}. Alt plus arrow keys to reorder.`
          : undefined
      }
      {...drag.rowProps(allergy.id)}
      className={cn(
        'group border-border/60 relative flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b px-1 py-2',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        drag.enabled && 'cursor-grab active:cursor-grabbing',
        dragIndicatorClasses(drag, allergy.id)
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
      <span
        className={cn(
          'text-foreground font-medium',
          allergy.inactive && 'text-muted-foreground line-through'
        )}
      >
        {allergy.allergen}
      </span>
      {allergy.code && (
        <span
          className="text-muted-foreground/70 text-xs"
          title={allergy.code.display}
        >
          {allergy.code.system} {allergy.code.code}
        </span>
      )}
      {allergy.severity && (
        <Badge variant={SEVERITY_BADGE[allergy.severity]} size="sm">
          {allergy.severity}
        </Badge>
      )}
      {allergy.kind === 'intolerance' && (
        <Badge variant="secondary" size="sm">
          intolerance
        </Badge>
      )}
      {allergy.reaction && (
        <span className="text-muted-foreground text-sm">
          — {allergy.reaction}
        </span>
      )}
      {allergy.onsetDate && (
        <span className="text-muted-foreground text-xs">
          since {allergy.onsetDate}
        </span>
      )}
      {allergy.inactive && (
        <Badge variant="secondary" size="sm">
          inactive
        </Badge>
      )}
      {allergy.note && (
        <span className="flex w-full basis-full items-center gap-1.5 pl-4">
          <StickyNoteIcon size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{allergy.note}</span>
        </span>
      )}

      {!readOnly && actions.length > 0 && (
        <div
          role="toolbar"
          aria-label={`Actions for ${allergy.allergen}`}
          className={cn(
            'z-10 ml-auto flex items-center gap-0.5 transition-opacity',
            // Hover-capable (fine pointer) devices: floating overlay, hidden
            // until hover or keyboard focus. Touch devices can't hover, so the
            // toolbar stays in flow and always visible.
            'pointer-fine:bg-card pointer-fine:border-border pointer-fine:absolute pointer-fine:top-1/2 pointer-fine:right-0 pointer-fine:-translate-y-1/2 pointer-fine:rounded-md pointer-fine:border pointer-fine:p-0.5 pointer-fine:shadow-sm',
            'pointer-fine:pointer-events-none pointer-fine:opacity-0',
            'group-hover:pointer-events-auto group-hover:opacity-100',
            'focus-within:pointer-events-auto focus-within:opacity-100'
          )}
        >
          {actions.map((action) => (
            <RowIconButton
              key={action}
              label={ACTION_META[action].label}
              icon={ACTION_META[action].icon}
              onClick={() => onAction?.(allergy, action)}
            />
          ))}
        </div>
      )}
    </li>
  );
}

// =============================================================================
// AllergyList
// =============================================================================

/**
 * Allergy / intolerance list — presentational layer.
 *
 * Controlled: allergies come in via props; every interaction is reported
 * through callbacks. Entries group by category (Drug → Food →
 * Environmental → Other); severity renders as a colored badge; hover (or
 * keyboard-focus) a row for Correct / Notes / Remove.
 *
 * The empty state is explicit tri-state via `noKnownAllergies` (NKA):
 * an empty list shows "Allergy status not recorded" until the No Known
 * Allergies affordance is confirmed — an empty list must never silently
 * read as "no allergies".
 *
 * Pair with `AllergyManager` for the batteries-included experience.
 */
export const AllergyList = React.forwardRef<HTMLDivElement, AllergyListProps>(
  (
    {
      allergies,
      noKnownAllergies,
      onNoKnownAllergiesChange,
      title = 'Allergies',
      actions = DEFAULT_ACTIONS,
      onAction,
      onReorder,
      addSearch,
      onAdd,
      readOnly = false,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [announcement, setAnnouncement] = useLiveAnnouncement();

    const groups = TYPE_ORDER.map((type) => ({
      type,
      label: ALLERGY_TYPE_LABELS[type],
      items: allergies.filter((a) => (a.type ?? 'other') === type),
    })).filter((g) => g.items.length > 0);

    const empty = allergies.length === 0;

    // Drag & drop reordering, restricted to the same category group.
    const typeOf = React.useCallback(
      (id: string) => allergies.find((a) => a.id === id)?.type ?? 'other',
      [allergies]
    );
    const drag = useDragReorder({
      ids: allergies.map((a) => a.id),
      onReorder:
        readOnly || !onReorder
          ? undefined
          : (ids) => {
              setAnnouncement('Allergy list reordered');
              onReorder(ids);
            },
      canDropOn: (dragged, target) => typeOf(dragged) === typeOf(target),
    });

    /** Keyboard equivalent of dragging a row: swap within the category. */
    const moveAllergy = React.useCallback(
      (allergy: Allergy, dir: -1 | 1) => {
        if (readOnly || !onReorder) return;
        const ids = allergies.map((a) => a.id);
        const from = ids.indexOf(allergy.id);
        let to = from + dir;
        while (
          to >= 0 &&
          to < allergies.length &&
          (allergies[to].type ?? 'other') !== (allergy.type ?? 'other')
        ) {
          to += dir;
        }
        if (to < 0 || to >= allergies.length) return;
        [ids[from], ids[to]] = [ids[to], ids[from]];
        setAnnouncement(`${allergy.allergen} moved ${dir === -1 ? 'up' : 'down'}`);
        onReorder(ids);
      },
      [allergies, onReorder, readOnly, setAnnouncement]
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
            <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              <AlertCircleIcon
                size={16}
                className="text-red-600 dark:text-red-400"
              />
              {title}
            </h3>
          </CardHeader>
        )}

        <CardContent className="space-y-5 px-4 py-4">
          {empty ? (
            <div className="space-y-2">
              {noKnownAllergies ? (
                <p className="text-foreground flex items-center gap-1.5 text-sm">
                  <Badge variant="success" size="sm">
                    ✓
                  </Badge>
                  No known allergies (NKA)
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Allergy status not recorded.
                </p>
              )}
              {!readOnly && onNoKnownAllergiesChange && (
                <Button
                  variant={noKnownAllergies ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => onNoKnownAllergiesChange(!noKnownAllergies)}
                >
                  {noKnownAllergies
                    ? 'Clear no-known-allergies'
                    : 'Confirm: no known allergies'}
                </Button>
              )}
            </div>
          ) : (
            groups.map(({ type, label, items }) => (
              <section key={type} aria-label={label}>
                <h4 className="border-border text-foreground border-b pb-1 text-sm font-semibold tracking-wide uppercase">
                  {label}
                </h4>
                <ul className="mt-1">
                  {items.map((allergy) => (
                    <AllergyRow
                      key={allergy.id}
                      allergy={allergy}
                      actions={actions}
                      readOnly={readOnly}
                      drag={drag}
                      onMove={moveAllergy}
                      onAction={onAction}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}

          {!readOnly && (addSearch || onAdd) && (
            <div className="space-y-2">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Add allergy
              </span>
              {addSearch}
              {onAdd && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAdd}
                  leftIcon={<PlusIcon size={12} />}
                  className="h-auto rounded-full px-2.5 py-1 text-xs"
                >
                  Add allergy…
                </Button>
              )}
            </div>
          )}
        </CardContent>

        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </Card>
    );
  }
);

AllergyList.displayName = 'AllergyList';

export default AllergyList;
