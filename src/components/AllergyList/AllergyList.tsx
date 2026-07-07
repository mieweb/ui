'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { Card, CardHeader, CardContent } from '../Card/Card';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import {
  PencilIcon,
  StickyNoteIcon,
  BanIcon,
  PlusIcon,
  AlertCircleIcon,
} from '../Icons';

// =============================================================================
// Types
// =============================================================================

/** Allergy category (FHIR AllergyIntolerance.category). */
export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';

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
  onAction,
}: {
  allergy: Allergy;
  actions: AllergyAction[];
  readOnly: boolean;
  onAction?: (allergy: Allergy, action: AllergyAction) => void;
}) {
  return (
    <li
      data-allergy-id={allergy.id}
      className="group border-border/60 relative flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b px-1 py-2"
    >
      <span className="text-muted-foreground/60 select-none">•</span>
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
            'bg-card border-border absolute top-1/2 right-0 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-md border p-0.5 shadow-sm',
            'pointer-events-none opacity-0 transition-opacity',
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
      addSearch,
      onAdd,
      readOnly = false,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [announcement] = useLiveAnnouncement();

    const groups = TYPE_ORDER.map((type) => ({
      type,
      label: ALLERGY_TYPE_LABELS[type],
      items: allergies.filter((a) => (a.type ?? 'other') === type),
    })).filter((g) => g.items.length > 0);

    const empty = allergies.length === 0;

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
