import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Spinner } from '../Spinner';
import { ChevronDownIcon, ChevronRightIcon } from '../Icons';
import {
  accentClasses,
  defaultViewLabels,
  type Stage,
  type ViewBaseProps,
} from '../../views/types';

// =============================================================================
// Types
// =============================================================================

export type ListViewSlot =
  | 'group'
  | 'groupHeader'
  | 'item'
  | 'selectedItem'
  | 'state';

export interface ListViewProps<T>
  extends ViewBaseProps<T>, VariantProps<typeof itemVariants> {
  /**
   * Group rows by `accessors.getStatus`, using these stages for order and
   * labels. Items whose status matches no stage are appended under their own
   * heading rather than dropped.
   */
  stages?: readonly Stage[];
  /** Group by `accessors.getGroup` instead of by stage. */
  groupBy?: 'status' | 'group' | 'none';
  /** Groups that start collapsed. Uncontrolled; the user can reopen them. */
  defaultCollapsedGroups?: readonly string[];
  /** Retries the failed load. Renders the retry action only when provided. */
  onRetry?: () => void;
  classNames?: Partial<Record<ListViewSlot, string>>;
  /** Heading level for group headers, under the page's own heading. */
  headingLevel?: 'h2' | 'h3' | 'h4';
}

interface Group<T> {
  id: string;
  label: string;
  accent?: Stage['accent'];
  items: T[];
}

// =============================================================================
// Variants
// =============================================================================

const itemVariants = cva(
  [
    'flex w-full items-start gap-3 border-b border-border px-3 text-start',
    'last:border-b-0',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
  ],
  {
    variants: {
      density: {
        comfortable: 'py-3',
        compact: 'py-2',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-muted',
        false: '',
      },
      selected: {
        true: 'bg-primary-500/10',
        false: '',
      },
    },
    defaultVariants: {
      density: 'comfortable',
      interactive: false,
      selected: false,
    },
  }
);

// =============================================================================
// Grouping
// =============================================================================

function buildGroups<T>(
  items: T[],
  groupBy: 'status' | 'group' | 'none',
  accessors: ListViewProps<T>['accessors'],
  ungrouped: string,
  stages?: readonly Stage[]
): Group<T>[] {
  if (groupBy === 'none') return [{ id: '', label: '', items }];

  const read = groupBy === 'status' ? accessors.getStatus : accessors.getGroup;
  if (!read) return [{ id: '', label: '', items }];

  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = read(item) ?? '';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  const groups: Group<T>[] = [];
  // Stages fix the order, and an empty stage still shows — a board column that
  // disappears when it empties hides the fact that the stage exists. This only
  // applies to `groupBy="status"`: stages name statuses, so seeding them under
  // `groupBy="group"` would print an empty "Backlog"/"In progress" above the
  // real buckets. `ViewSet` always passes its shared stages, so that case is
  // reachable with nothing more than `listProps={{ groupBy: 'group' }}`.
  for (const stage of (groupBy === 'status' ? stages : undefined) ?? []) {
    groups.push({
      id: stage.id,
      label: stage.label,
      accent: stage.accent,
      items: buckets.get(stage.id) ?? [],
    });
    buckets.delete(stage.id);
  }
  for (const [key, bucket] of buckets) {
    groups.push({ id: key, label: key || ungrouped, items: bucket });
  }
  return groups;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Declared `parameters.catalog.collection` — the three load states below are
 * part of this component's API, not decoration.
 */
export function ListView<T>({
  items,
  accessors,
  loading = false,
  error = null,
  selectedId = null,
  onOpen,
  getHref,
  renderItem,
  emptyState,
  labels,
  stages,
  groupBy = stages ? 'status' : 'none',
  defaultCollapsedGroups,
  onRetry,
  density,
  className,
  classNames,
  headingLevel: Heading = 'h3',
}: ListViewProps<T>) {
  const text = { ...defaultViewLabels, ...labels };
  // Ids come from position, not from the status text: two distinct statuses can
  // normalise to the same string, and a duplicate id makes `aria-labelledby`
  // resolve to the wrong heading.
  const baseId = React.useId();
  const [collapsed, setCollapsed] = React.useState<Set<string>>(
    () => new Set(defaultCollapsedGroups ?? [])
  );

  const groups = React.useMemo(
    () => buildGroups(items, groupBy, accessors, text.ungrouped, stages),
    [items, groupBy, accessors, text.ungrouped, stages]
  );

  const state = (content: React.ReactNode) => (
    <div
      data-slot="list-view-state"
      className={cn(
        'text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm',
        classNames?.state
      )}
    >
      {content}
    </div>
  );

  let body: React.ReactNode;
  if (error) {
    body = state(
      <>
        <p role="alert" className="text-destructive">
          {text.error}
        </p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            {text.retry}
          </Button>
        )}
      </>
    );
  } else if (loading) {
    // Spinner is the status region and carries the accessible name; the visible
    // copy beside it would otherwise be announced twice.
    body = state(
      <span className="flex items-center gap-2">
        <Spinner size="sm" label={text.loading} />
        <span aria-hidden>{text.loading}</span>
      </span>
    );
  } else if (items.length === 0) {
    body = emptyState ?? state(text.empty);
  } else {
    body = groups.map((group, groupIndex) => {
      const isCollapsed = collapsed.has(group.id);
      const headerId = `${baseId}-group-${groupIndex}`;
      return (
        <section
          key={group.id}
          data-slot="list-view-group"
          className={cn(classNames?.group)}
        >
          {group.label && (
            <Heading className="sticky top-0 z-10">
              <button
                type="button"
                id={headerId}
                aria-expanded={!isCollapsed}
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (!next.delete(group.id)) next.add(group.id);
                    return next;
                  })
                }
                data-slot="list-view-group-header"
                className={cn(
                  'border-border bg-muted text-muted-foreground flex w-full items-center gap-2 border-b px-3 py-2 text-start text-xs font-semibold tracking-wide uppercase',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                  classNames?.groupHeader
                )}
              >
                {isCollapsed ? (
                  <ChevronRightIcon
                    className="size-3.5 rtl:rotate-180"
                    aria-hidden
                  />
                ) : (
                  <ChevronDownIcon className="size-3.5" aria-hidden />
                )}
                {group.accent && (
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      accentClasses[group.accent].marker
                    )}
                  />
                )}
                <span>{group.label}</span>
                <span className="ms-auto font-normal tabular-nums">
                  {group.items.length}
                </span>
              </button>
            </Heading>
          )}
          {!isCollapsed && (
            <ul aria-labelledby={group.label ? headerId : undefined}>
              {group.items.map((item) => {
                const id = accessors.getId(item);
                const selected = id === selectedId;
                const accent = accessors.getAccent?.(item);
                const subtitle = accessors.getSubtitle?.(item);
                const content = renderItem?.(item, { view: 'list' }) ?? (
                  <>
                    {accent && (
                      <span
                        aria-hidden
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          accentClasses[accent].marker
                        )}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block truncate font-medium">
                        {accessors.getTitle(item)}
                      </span>
                      {subtitle && (
                        <span className="text-muted-foreground block truncate text-sm">
                          {subtitle}
                        </span>
                      )}
                    </span>
                  </>
                );
                const classes = cn(
                  itemVariants({
                    density,
                    interactive: Boolean(onOpen || getHref),
                    selected,
                  }),
                  classNames?.item,
                  selected && classNames?.selectedItem
                );
                const href = getHref?.(id, item);
                return (
                  <li key={id}>
                    {href ? (
                      // An anchor, not a handler, so the row is middle-clickable
                      // and crawlable; onOpen still runs for router navigation.
                      <a
                        href={href}
                        aria-current={selected ? 'true' : undefined}
                        data-slot="list-view-item"
                        className={classes}
                        onClick={(event) => {
                          if (
                            !onOpen ||
                            event.defaultPrevented ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.button !== 0
                          )
                            return;
                          event.preventDefault();
                          onOpen(id, item);
                        }}
                      >
                        {content}
                      </a>
                    ) : onOpen ? (
                      <button
                        type="button"
                        aria-current={selected ? 'true' : undefined}
                        data-slot="list-view-item"
                        className={classes}
                        onClick={() => onOpen(id, item)}
                      >
                        {content}
                      </button>
                    ) : (
                      <div data-slot="list-view-item" className={classes}>
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
              {group.items.length === 0 && (
                <li className="text-muted-foreground px-3 py-2 text-sm">
                  {text.empty}
                </li>
              )}
            </ul>
          )}
        </section>
      );
    });
  }

  return (
    <div
      data-slot="list-view"
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
    >
      {body}
    </div>
  );
}

export { itemVariants as listViewItemVariants };
