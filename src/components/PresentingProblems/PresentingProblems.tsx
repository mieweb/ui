'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { Card, CardHeader, CardContent } from '../Card/Card';
import {
  PlusIcon,
  InfoIcon,
  EyeIcon,
  ClipboardCheckIcon,
  GripVerticalIcon,
} from '../Icons';
import {
  CodingChips,
  currentAssertion,
  toolbarKeyNav,
  type ConditionConcern,
} from '../ProblemList';
import {
  useDragReorder,
  dragIndicatorClasses,
} from '../../hooks/useDragReorder';

// =============================================================================
// Types
// =============================================================================

/** How the encounter is scoped — gates how it merges into the patient record. */
export type EncounterScope = 'problem-focused' | 'comprehensive';

/** Encounter-scoped relevance of a concern. Lives on the reference, never on the concern. */
export type ProblemRelevance = 'addressed' | 'relevant-history' | 'noted';

/** A reference from the encounter to a patient concern. */
export interface PresentingEntry {
  concernId: string;
  relevance: ProblemRelevance;
  comments?: string;
}

export interface PresentingProblemsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className' | 'title'
> {
  /** Patient-level concerns to select from */
  patientConcerns: ConditionConcern[];
  /** Encounter-scoped references (controlled) */
  presenting: PresentingEntry[];
  /** Encounter scope — problem-focused encounters assert nothing about unselected concerns */
  scope: EncounterScope;
  /** Header title (pass null to hide) */
  title?: string | null;
  /** Called when a concern's relevance is set (null = deselected) */
  onRelevanceChange?: (
    concern: ConditionConcern,
    relevance: ProblemRelevance | null
  ) => void;
  /** Called when a new (ad-hoc) problem is added by name */
  onAddProblem?: (text: string) => void;
  /**
   * Called with the new concernId order of the "Relevant this visit" list
   * after a drag — enables drag & drop reordering. The list renders in
   * `presenting` order; persist and feed the order back in.
   */
  onReorder?: (concernIds: string[]) => void;
  /** Negative assertion — only assertable when scope is comprehensive */
  noKnownProblems?: boolean;
  /** Called when the no-known-problems toggle changes */
  onNoKnownProblemsChange?: (value: boolean) => void;
  /** Hide all controls (display only) */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

export const RELEVANCE_LABELS: Record<ProblemRelevance, string> = {
  addressed: 'Addressed',
  'relevant-history': 'Relevant Hx',
  noted: 'Noted',
};

const RELEVANCE_ORDER: ProblemRelevance[] = [
  'addressed',
  'relevant-history',
  'noted',
];

const SCOPE_META: Record<
  EncounterScope,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number | string }>;
  }
> = {
  'problem-focused': {
    label: 'Problem-focused encounter',
    description:
      'Only selected problems are asserted. Unselected problems are out of scope — not absent.',
    icon: EyeIcon,
  },
  comprehensive: {
    label: 'Comprehensive visit',
    description:
      'Full review — closing this encounter reconciles the entire problem list.',
    icon: ClipboardCheckIcon,
  },
};

// =============================================================================
// Sub-components
// =============================================================================

function RelevanceControl({
  value,
  onChange,
  labelPrefix,
}: {
  value: ProblemRelevance | null;
  onChange: (relevance: ProblemRelevance | null) => void;
  labelPrefix: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label={`Relevance for ${labelPrefix}`}
      onKeyDown={toolbarKeyNav}
      className="border-border flex shrink-0 items-center overflow-hidden rounded-md border"
    >
      {RELEVANCE_ORDER.map((relevance) => {
        const active = value === relevance;
        return (
          <button
            key={relevance}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : relevance)}
            className={cn(
              'px-2 py-1 text-xs font-medium transition-colors',
              'border-border border-l first:border-l-0',
              active
                ? 'bg-primary-600 text-white'
                : 'bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            {RELEVANCE_LABELS[relevance]}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// PresentingProblems
// =============================================================================

/**
 * Encounter-scoped relevant problem list (a.k.a. Medical History), fed by the
 * patient-level ProblemList. Providers select which concerns are relevant this
 * visit and tag each reference with a relevance — the tag lives on the
 * encounter reference, never on the concern itself.
 *
 * In problem-focused scope, unselected concerns are visually out of scope (not
 * absent) and the negative assertion (no known problems) is disabled.
 *
 * @example
 * ```tsx
 * <PresentingProblems
 *   patientConcerns={concerns}
 *   presenting={presenting}
 *   scope="problem-focused"
 *   onRelevanceChange={(concern, relevance) => setRelevance(concern.concernId, relevance)}
 *   onAddProblem={(text) => addAdHocConcern(text)}
 * />
 * ```
 */
export const PresentingProblems = React.forwardRef<
  HTMLDivElement,
  PresentingProblemsProps
>(
  (
    {
      patientConcerns,
      presenting,
      scope,
      title = 'Presenting problems',
      onRelevanceChange,
      onAddProblem,
      onReorder,
      noKnownProblems = false,
      onNoKnownProblemsChange,
      readOnly = false,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const [draft, setDraft] = React.useState('');
    const [announcement, setAnnouncement] = React.useState('');
    const scopeMeta = SCOPE_META[scope];
    const ScopeIcon = scopeMeta.icon;

    const relevanceOf = (concernId: string): ProblemRelevance | null =>
      presenting.find((p) => p.concernId === concernId)?.relevance ?? null;

    const submitDraft = () => {
      const text = draft.trim();
      if (!text) return;
      onAddProblem?.(text);
      setDraft('');
    };

    // "Relevant this visit" renders in `presenting` order (drag-reorderable);
    // the unselected pool keeps patient problem-list order.
    const selected = presenting
      .map((p) => patientConcerns.find((c) => c.concernId === p.concernId))
      .filter((c): c is ConditionConcern => Boolean(c));
    const unselected = patientConcerns.filter((c) => !relevanceOf(c.concernId));

    const drag = useDragReorder({
      ids: selected.map((c) => c.concernId),
      onReorder:
        readOnly || !onReorder
          ? undefined
          : (ids) => {
              setAnnouncement('Relevant problems reordered');
              onReorder(ids);
            },
    });

    /** Keyboard equivalent of dragging a selected row (Alt+↑/↓). */
    const moveSelected = (concern: ConditionConcern, dir: -1 | 1) => {
      if (readOnly || !onReorder) return;
      const ids = selected.map((c) => c.concernId);
      const from = ids.indexOf(concern.concernId);
      const to = from + dir;
      if (to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      const current = currentAssertion(concern);
      setAnnouncement(
        `${current?.text ?? concern.concernId} moved ${dir === -1 ? 'up' : 'down'}`
      );
      onReorder(ids);
    };

    const renderRow = (
      concern: ConditionConcern,
      inUnselectedPool: boolean
    ) => {
      const current = currentAssertion(concern);
      if (!current) return null;
      const relevance = relevanceOf(concern.concernId);
      const entry = presenting.find((p) => p.concernId === concern.concernId);
      const draggable = !inUnselectedPool && drag.enabled;
      // Unselected problems are only "out of scope" in a problem-focused
      // encounter; a comprehensive visit reviews everything.
      const outOfScope = inUnselectedPool && scope === 'problem-focused';

      const handleRowKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return;
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          moveSelected(concern, e.key === 'ArrowUp' ? -1 : 1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
        }
      };

      return (
        // Selected rows are focus stops so drag reordering has a keyboard
        // equivalent (Alt+↑/↓) — 508.
        /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
        <li
          key={concern.concernId}
          data-concern-id={concern.concernId}
          tabIndex={draggable ? 0 : undefined}
          onKeyDown={draggable ? handleRowKeyDown : undefined}
          aria-label={
            draggable
              ? `${current.text}. Alt plus arrow keys to reorder.`
              : undefined
          }
          {...(draggable ? drag.rowProps(concern.concernId) : {})}
          className={cn(
            'border-border/60 flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b px-1 py-2',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            outOfScope && 'opacity-60',
            draggable && 'cursor-grab active:cursor-grabbing',
            draggable && dragIndicatorClasses(drag, concern.concernId)
          )}
        >
          {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
          {draggable ? (
            <GripVerticalIcon
              size={14}
              aria-hidden
              className="text-muted-foreground/50 shrink-0"
            />
          ) : (
            <span className="text-muted-foreground/60 select-none">•</span>
          )}
          <span className="text-foreground font-medium">{current.text}</span>
          <CodingChips coding={current.coding} />
          {entry?.comments && (
            <span className="text-muted-foreground text-xs">
              {entry.comments}
            </span>
          )}
          {outOfScope && (
            <Badge
              variant="outline"
              size="sm"
              className="text-muted-foreground"
            >
              out of scope
            </Badge>
          )}
          {!readOnly && (
            <span className="ml-auto">
              <RelevanceControl
                value={relevance}
                onChange={(r) => onRelevanceChange?.(concern, r)}
                labelPrefix={current.text}
              />
            </span>
          )}
        </li>
      );
    };

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

        <CardContent className="space-y-4 px-4 py-4">
          {/* Scope banner */}
          <div
            role="status"
            className={cn(
              'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
              scope === 'problem-focused'
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
                : 'border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-200'
            )}
          >
            <ScopeIcon size={16} />
            <span>
              <span className="font-semibold">{scopeMeta.label}.</span>{' '}
              {scopeMeta.description}
            </span>
          </div>

          {/* Selected / relevant this visit */}
          <section aria-label="Relevant this visit">
            <h4 className="border-border text-foreground border-b pb-1 text-sm font-semibold tracking-wide uppercase">
              Relevant this visit
            </h4>
            {selected.length > 0 ? (
              <ul className="mt-1">
                {selected.map((c) => renderRow(c, false))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                No problems selected yet.
              </p>
            )}
          </section>

          {/* Pick from patient problem list */}
          {unselected.length > 0 && (
            <section aria-label="Patient problem list">
              <h4 className="border-border text-muted-foreground border-b pb-1 text-sm font-semibold tracking-wide uppercase">
                From patient problem list
              </h4>
              <ul className="mt-1">
                {unselected.map((c) => renderRow(c, true))}
              </ul>
            </section>
          )}

          {/* Ad-hoc capture-first add */}
          {!readOnly && onAddProblem && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitDraft();
                }}
                placeholder="Add problem not on the list…"
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

          {/* Negative assertion — comprehensive scope only */}
          {!readOnly && onNoKnownProblemsChange && (
            <div className="flex items-center gap-2">
              <label
                className={cn(
                  'flex items-center gap-2 text-sm',
                  scope === 'problem-focused' &&
                    'text-muted-foreground opacity-60'
                )}
              >
                <input
                  type="checkbox"
                  checked={noKnownProblems}
                  disabled={scope === 'problem-focused'}
                  onChange={(e) => onNoKnownProblemsChange(e.target.checked)}
                  className="accent-primary-600 h-4 w-4"
                />
                No known problems
              </label>
              {scope === 'problem-focused' && (
                <Tooltip content="Negative assertions require a comprehensive visit — a problem-focused encounter asserts nothing about unmentioned problems.">
                  <InfoIcon size={14} className="text-muted-foreground" />
                </Tooltip>
              )}
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

PresentingProblems.displayName = 'PresentingProblems';

export default PresentingProblems;
