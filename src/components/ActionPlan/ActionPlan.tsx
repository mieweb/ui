'use client';

import * as React from 'react';
import { DateTime } from 'luxon';
import { CalendarClock, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Progress } from '../Progress';
import { accentClasses, toDateTime } from '../../views/types';
import { withLocale } from '../ActivityFeed/dayGroups';
import { RecordState } from '../ActivityFeed/RecordState';
import { usePendingOverrides } from '../ActivityFeed/usePendingOverrides';

// =============================================================================
// Types
// =============================================================================

export type ActionPlanStepStatus = 'todo' | 'in_progress' | 'done';

export interface ActionPlanOwner {
  name: string;
  avatarUrl?: string;
}

export interface ActionPlanStep {
  id: string;
  title: string;
  owner?: ActionPlanOwner;
  /** ISO date or date-time. Date-only values are wall dates in `timeZone`. */
  dueDate?: string;
  status: ActionPlanStepStatus;
  note?: string;
}

export interface ActionPlanLabels {
  title: string;
  progress: (done: number, total: number) => string;
  overdue: string;
  todo: string;
  inProgress: string;
  done: string;
  addStep: string;
  loading: string;
  empty: string;
  error: string;
  retry: string;
}

export const defaultActionPlanLabels: ActionPlanLabels = {
  title: 'Action plan',
  progress: (done, total) => `${done} of ${total} complete`,
  overdue: 'Overdue',
  todo: 'To do',
  inProgress: 'In progress',
  done: 'Done',
  addStep: 'Add step',
  loading: 'Loading plan',
  empty: 'No steps yet',
  error: 'Could not load this plan',
  retry: 'Try again',
};

export type ActionPlanSlot =
  | 'header'
  | 'progress'
  | 'group'
  | 'step'
  | 'overdueStep'
  | 'state';

export type ActionPlanArrange = 'manual' | 'dueDate' | 'status';

export interface ActionPlanProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'children' | 'title'
> {
  items: ActionPlanStep[];
  /** Card heading. Defaults to `labels.title`. */
  title?: string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  /** `manual` keeps `items` order; `dueDate` sorts soonest first; `status` groups by status. */
  arrange?: ActionPlanArrange;
  /** Reference for overdue checks. Defaults to the current time. */
  now?: Date;
  locale?: string;
  /** IANA zone for due dates. Defaults to local. */
  timeZone?: string;
  /** The checkbox shows the new status at once and restores it on rejection. */
  onStatusChange?: (
    id: string,
    status: ActionPlanStepStatus
  ) => void | Promise<void>;
  onAdd?: () => void;
  onOpen?: (id: string, step: ActionPlanStep) => void;
  getHref?: (id: string, step: ActionPlanStep) => string;
  /** Extra content on a step's meta line. */
  renderStepMeta?: (step: ActionPlanStep) => React.ReactNode;
  emptyState?: React.ReactNode;
  labels?: Partial<ActionPlanLabels>;
  classNames?: Partial<Record<ActionPlanSlot, string>>;
  headingLevel?: 'h2' | 'h3' | 'h4';
}

const STATUS_ORDER: ActionPlanStepStatus[] = ['in_progress', 'todo', 'done'];
const SUB_HEADING = { h2: 'h3', h3: 'h4', h4: 'h5' } as const;

// =============================================================================
// Component
// =============================================================================

/**
 * A shared checklist with progress and due dates. Declared
 * `parameters.catalog.collection` — its load states are part of the API.
 */
export const ActionPlan = React.forwardRef<HTMLElement, ActionPlanProps>(
  (
    {
      items,
      title,
      loading = false,
      error = null,
      onRetry,
      arrange = 'manual',
      now,
      locale,
      timeZone = 'local',
      onStatusChange,
      onAdd,
      onOpen,
      getHref,
      renderStepMeta,
      emptyState,
      labels,
      classNames,
      headingLevel: Heading = 'h3',
      className,
      ...rest
    },
    ref
  ) => {
    const text = { ...defaultActionPlanLabels, ...labels };
    const baseId = React.useId();
    const [overrides, runStatus] = usePendingOverrides<ActionPlanStepStatus>();
    const today = (now ? DateTime.fromJSDate(now) : DateTime.now())
      .setZone(timeZone)
      .startOf('day');

    const statusOf = (step: ActionPlanStep) =>
      overrides.get(step.id) ?? step.status;
    const statusLabel: Record<ActionPlanStepStatus, string> = {
      todo: text.todo,
      in_progress: text.inProgress,
      done: text.done,
    };
    const done = items.filter((s) => statusOf(s) === 'done').length;

    const dueOf = (step: ActionPlanStep) => toDateTime(step.dueDate, timeZone);

    const renderStep = (step: ActionPlanStep) => {
      const status = statusOf(step);
      const pending = overrides.has(step.id);
      const due = dueOf(step);
      const overdue =
        status !== 'done' && due !== null && due.startOf('day') < today;
      // Position, not the caller's id: ids with spaces would break aria-labelledby.
      const titleId = `${baseId}-step-${items.indexOf(step)}`;
      const href = getHref?.(step.id, step);
      const titleClasses = cn(
        'text-sm font-medium',
        status === 'done'
          ? 'text-muted-foreground line-through'
          : 'text-foreground'
      );
      const focusRing =
        'rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

      let titleNode: React.ReactNode = (
        <span id={titleId} className={titleClasses}>
          {step.title}
        </span>
      );
      if (href) {
        titleNode = (
          <a
            id={titleId}
            href={href}
            className={cn(titleClasses, focusRing)}
            onClick={(event) => {
              if (
                !onOpen ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.button !== 0
              )
                return;
              event.preventDefault();
              onOpen(step.id, step);
            }}
          >
            {step.title}
          </a>
        );
      } else if (onOpen) {
        titleNode = (
          <button
            id={titleId}
            type="button"
            className={cn(titleClasses, focusRing, 'text-start')}
            onClick={() => onOpen(step.id, step)}
          >
            {step.title}
          </button>
        );
      }

      return (
        <li
          key={step.id}
          data-slot="action-plan-step"
          data-overdue={overdue || undefined}
          aria-busy={pending || undefined}
          className={cn(
            'flex items-start gap-3 px-4 py-3',
            overdue && accentClasses.destructive.tint,
            classNames?.step,
            overdue && classNames?.overdueStep
          )}
        >
          <Checkbox
            size="sm"
            className="mt-0.5"
            checked={status === 'done'}
            disabled={!onStatusChange || pending}
            aria-labelledby={titleId}
            onChange={(event) => {
              if (!onStatusChange) return;
              const next = event.currentTarget.checked ? 'done' : 'todo';
              void runStatus(step.id, next, () =>
                onStatusChange(step.id, next)
              );
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {titleNode}
              {status === 'in_progress' && (
                <Badge size="sm" variant="secondary">
                  {text.inProgress}
                </Badge>
              )}
              {overdue && (
                <Badge size="sm" variant="danger">
                  {text.overdue}
                </Badge>
              )}
            </div>
            {(step.owner || due) && (
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {step.owner && (
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar
                      size="xs"
                      name={step.owner.name}
                      src={step.owner.avatarUrl}
                      alt=""
                      aria-hidden
                    />
                    {step.owner.name}
                  </span>
                )}
                {due && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3.5" aria-hidden />
                    <time dateTime={step.dueDate}>
                      {withLocale(due, locale).toLocaleString(
                        DateTime.DATE_MED
                      )}
                    </time>
                  </span>
                )}
                {renderStepMeta?.(step)}
              </div>
            )}
            {step.note && (
              <p className="text-muted-foreground mt-1 text-sm">{step.note}</p>
            )}
          </div>
        </li>
      );
    };

    let body: React.ReactNode;
    if (error) {
      body = (
        <RecordState
          kind="error"
          slot="action-plan-state"
          message={text.error}
          retryLabel={text.retry}
          onRetry={onRetry}
          className={classNames?.state}
        />
      );
    } else if (loading) {
      body = (
        <RecordState
          kind="loading"
          slot="action-plan-state"
          message={text.loading}
          className={classNames?.state}
        />
      );
    } else if (items.length === 0) {
      body = emptyState ?? (
        <RecordState
          kind="empty"
          slot="action-plan-state"
          message={text.empty}
          className={classNames?.state}
        />
      );
    } else if (arrange === 'status') {
      const SubHeading = SUB_HEADING[Heading];
      body = STATUS_ORDER.map((status) => {
        const group = items.filter((s) => statusOf(s) === status);
        if (group.length === 0) return null;
        const groupId = `${baseId}-group-${status}`;
        return (
          <section
            key={status}
            aria-labelledby={groupId}
            data-slot="action-plan-group"
            className={classNames?.group}
          >
            <SubHeading
              id={groupId}
              className="border-border bg-muted text-muted-foreground flex items-center justify-between border-y px-4 py-1.5 text-xs font-semibold tracking-wide uppercase"
            >
              {statusLabel[status]}
              <span className="font-normal tabular-nums">{group.length}</span>
            </SubHeading>
            <ul className="divide-border divide-y">{group.map(renderStep)}</ul>
          </section>
        );
      });
    } else {
      const ordered =
        arrange === 'dueDate'
          ? [...items].sort(
              (a, b) =>
                (dueOf(a)?.toMillis() ?? Infinity) -
                  (dueOf(b)?.toMillis() ?? Infinity) || 0
            )
          : items;
      body = (
        <ul className="divide-border divide-y">{ordered.map(renderStep)}</ul>
      );
    }

    const headingId = `${baseId}-title`;
    return (
      <section
        ref={ref}
        aria-labelledby={headingId}
        data-slot="action-plan"
        className={cn(
          'border-border bg-card overflow-hidden rounded-lg border',
          className
        )}
        {...rest}
      >
        <div
          data-slot="action-plan-header"
          className={cn(
            'border-border space-y-3 border-b px-4 py-3',
            classNames?.header
          )}
        >
          <div className="flex items-center gap-2">
            <Heading
              id={headingId}
              className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold"
            >
              {title ?? text.title}
            </Heading>
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAdd}
                leftIcon={<Plus className="size-4" aria-hidden />}
              >
                {text.addStep}
              </Button>
            )}
          </div>
          {!loading && !error && items.length > 0 && (
            <div
              data-slot="action-plan-progress"
              className={classNames?.progress}
            >
              <Progress
                size="sm"
                value={done}
                max={items.length}
                label={text.progress(done, items.length)}
              />
            </div>
          )}
        </div>
        {body}
      </section>
    );
  }
);

ActionPlan.displayName = 'ActionPlan';
