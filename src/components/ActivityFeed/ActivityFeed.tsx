'use client';

import * as React from 'react';
import { DateTime } from 'luxon';
import { Pin, Rows4, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { accentClasses, toDateTime, type Accent } from '../../views/types';
import { formatDayLabel, groupByDay, withLocale } from './dayGroups';
import { RecordState } from './RecordState';
import { usePendingOverrides } from './usePendingOverrides';

// =============================================================================
// Types
// =============================================================================

export type ActivityFeedDensity = 'comfortable' | 'compact';

export interface ActivityFeedCategory {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Token name, resolved to `--mieweb-*` colours. */
  color?: Accent;
}

export interface ActivityFeedActor {
  name: string;
  avatarUrl?: string;
}

export interface ActivityFeedLabels {
  loading: string;
  empty: string;
  /** Shown when items exist but the active filters hide all of them. */
  noMatches: string;
  error: string;
  retry: string;
  today: string;
  yesterday: string;
  undated: string;
  pinned: string;
  /** Accessible name of the category filter group. */
  filters: string;
  /** The chip that clears every filter. */
  allCategories: string;
  compact: string;
  pin: string;
  loadMore: string;
  /** Announced politely after a filter change. */
  resultCount: (count: number) => string;
}

export const defaultActivityFeedLabels: ActivityFeedLabels = {
  loading: 'Loading activity',
  empty: 'No activity yet',
  noMatches: 'No activity matches these filters',
  error: 'Could not load activity',
  retry: 'Try again',
  today: 'Today',
  yesterday: 'Yesterday',
  undated: 'Undated',
  pinned: 'Pinned',
  filters: 'Filter by category',
  allCategories: 'All',
  compact: 'Compact view',
  pin: 'Pin',
  loadMore: 'Load more',
  resultCount: (count) =>
    count === 1 ? '1 activity shown' : `${count} activities shown`,
};

export type ActivityFeedSlot =
  | 'toolbar'
  | 'filter'
  | 'section'
  | 'dayHeader'
  | 'item'
  | 'highlightedItem'
  | 'state'
  | 'loadMore';

export interface ActivityFeedItemContext {
  density: ActivityFeedDensity;
  pinned: boolean;
  category?: ActivityFeedCategory;
}

export interface ActivityFeedProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  items: T[];
  getId: (item: T) => string;
  /** ISO string or `Date`. Date-only strings are wall dates in `timeZone`. */
  getDate: (item: T) => Date | string | null | undefined;
  /** Matched against `categories[].id`. */
  getCategory?: (item: T) => string | undefined;
  getTitle?: (item: T) => string | undefined;
  getDescription?: (item: T) => string | undefined;
  getActor?: (item: T) => ActivityFeedActor | undefined;
  /** Filter chips, icons and colours, in display order. */
  categories?: readonly ActivityFeedCategory[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  /** BCP 47 locale for day headers and times. Defaults to the runtime's. */
  locale?: string;
  /** IANA zone that decides which day an item falls on. Defaults to local. */
  timeZone?: string;
  /** Pins "today" so stories and tests stay deterministic. */
  now?: Date;
  pinnedIds?: readonly string[];
  /** Receives the requested state; the row moves optimistically and restores on rejection. */
  onTogglePin?: (id: string, pinned: boolean) => void | Promise<void>;
  onOpen?: (id: string, item: T) => void;
  getHref?: (id: string, item: T) => string;
  /** Scrolls this row into view and highlights it — for deep links. */
  highlightedId?: string | null;
  hasMore?: boolean;
  /** The button shows pending until the returned promise settles. */
  onLoadMore?: () => void | Promise<void>;
  defaultCategories?: readonly string[];
  defaultDensity?: ActivityFeedDensity;
  /** Persists the selected categories and density in `localStorage` under this key. */
  storageKey?: string;
  /** Replaces the built-in row body. Pinning and opening still wrap it. */
  renderItem?: (item: T, context: ActivityFeedItemContext) => React.ReactNode;
  /** Extra content on the row's meta line (badges, durations, sentiment). */
  renderItemMeta?: (item: T) => React.ReactNode;
  /** Rendered under each day header, e.g. a roll-up of that day's calls. */
  renderDaySummary?: (dayKey: string, items: T[]) => React.ReactNode;
  emptyState?: React.ReactNode;
  labels?: Partial<ActivityFeedLabels>;
  classNames?: Partial<Record<ActivityFeedSlot, string>>;
  headingLevel?: 'h2' | 'h3' | 'h4';
}

interface StoredPrefs {
  categories?: string[];
  density?: ActivityFeedDensity;
}

function readPrefs(key: string): StoredPrefs {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    if (!raw || typeof raw !== 'object') return {};
    const { categories, density } = raw as Record<string, unknown>;
    return {
      categories:
        Array.isArray(categories) &&
        categories.every((c) => typeof c === 'string')
          ? categories
          : undefined,
      density:
        density === 'compact' || density === 'comfortable'
          ? density
          : undefined,
    };
  } catch {
    return {};
  }
}

function writePrefs(key: string, prefs: StoredPrefs) {
  try {
    window.localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // Storage full or blocked: the preference just doesn't persist.
  }
}

const chipClasses =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

// =============================================================================
// Component
// =============================================================================

function ActivityFeedInner<T>(
  {
    items,
    getId,
    getDate,
    getCategory,
    getTitle,
    getDescription,
    getActor,
    categories = [],
    loading = false,
    error = null,
    onRetry,
    locale,
    timeZone = 'local',
    now,
    pinnedIds,
    onTogglePin,
    onOpen,
    getHref,
    highlightedId = null,
    hasMore = false,
    onLoadMore,
    defaultCategories,
    defaultDensity = 'comfortable',
    storageKey,
    renderItem,
    renderItemMeta,
    renderDaySummary,
    emptyState,
    labels,
    classNames,
    headingLevel: Heading = 'h3',
    className,
    ...rest
  }: ActivityFeedProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const text = { ...defaultActivityFeedLabels, ...labels };
  const baseId = React.useId();
  const reducedMotion = usePrefersReducedMotion();
  const [announcement, announce] = useLiveAnnouncement();
  const [pinOverrides, runPin] = usePendingOverrides<boolean>();
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [selected, setSelected] = React.useState<readonly string[]>(
    defaultCategories ?? []
  );
  const [density, setDensity] =
    React.useState<ActivityFeedDensity>(defaultDensity);
  const rowRefs = React.useRef(new Map<string, HTMLElement>());

  // Read after mount so server and first client render agree.
  React.useEffect(() => {
    if (!storageKey) return;
    const stored = readPrefs(storageKey);
    if (stored.categories) setSelected(stored.categories);
    if (stored.density) setDensity(stored.density);
  }, [storageKey]);

  React.useEffect(() => {
    if (!highlightedId) return;
    rowRefs.current.get(highlightedId)?.scrollIntoView?.({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [highlightedId, loading, reducedMotion]);

  const categoryById = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  // Persisted IDs may reference renamed/removed categories; applying them
  // verbatim would filter out everything with no chip shown as active.
  const effectiveFilter = React.useMemo(
    () => selected.filter((id) => categoryById.has(id)),
    [selected, categoryById]
  );
  const pinnedSet = React.useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const isPinned = (id: string) => pinOverrides.get(id) ?? pinnedSet.has(id);
  const matches = (item: T, filter: readonly string[]) =>
    filter.length === 0 || filter.includes(getCategory?.(item) ?? '');

  const updateFilters = (next: readonly string[]) => {
    setSelected(next);
    if (storageKey) writePrefs(storageKey, { categories: [...next], density });
    announce(text.resultCount(items.filter((i) => matches(i, next)).length));
  };

  const toggleDensity = () => {
    const next = density === 'compact' ? 'comfortable' : 'compact';
    setDensity(next);
    if (storageKey)
      writePrefs(storageKey, { categories: [...selected], density: next });
  };

  const loadMore = async () => {
    if (!onLoadMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } catch {
      // The caller reports the failure; the button becomes usable again.
    } finally {
      setLoadingMore(false);
    }
  };

  const zone = timeZone;
  const reference = now ?? new Date();
  const compact = density === 'compact';
  const visible = items.filter((item) => matches(item, effectiveFilter));
  const pinnedItems = groupByDay(
    visible.filter((item) => isPinned(getId(item))),
    getDate,
    zone
  ).flatMap((g) => g.items);
  const days = groupByDay(
    visible.filter((item) => !isPinned(getId(item))),
    getDate,
    zone
  );

  let row = 0;
  const renderRow = (item: T) => {
    const id = getId(item);
    const pinned = isPinned(id);
    const pending = pinOverrides.has(id);
    const highlighted = id === highlightedId;
    const category = categoryById.get(getCategory?.(item) ?? '');
    const titleId = `${baseId}-title-${row++}`;
    const accent = accentClasses[category?.color ?? 'neutral'];
    const Icon = category?.icon;
    const dt = toDateTime(getDate(item), zone);
    const localDt = dt && withLocale(dt, locale);
    const actor = getActor?.(item);
    const description = compact ? undefined : getDescription?.(item);

    const body = renderItem?.(item, { density, pinned, category }) ?? (
      <>
        <span
          aria-hidden
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full',
            compact ? 'size-5' : 'mt-0.5 size-7',
            accent.tint
          )}
        >
          {Icon ? (
            <Icon className="text-foreground size-3.5" />
          ) : (
            <span className={cn('size-2 rounded-full', accent.marker)} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            id={titleId}
            className="text-foreground block truncate text-sm font-medium"
          >
            {getTitle?.(item) ?? category?.label ?? id}
          </span>
          {description && (
            <span className="text-muted-foreground line-clamp-2 block text-sm">
              {description}
            </span>
          )}
          <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {actor && (
              <span className="inline-flex items-center gap-1.5">
                {!compact && (
                  <Avatar
                    size="xs"
                    name={actor.name}
                    src={actor.avatarUrl}
                    alt=""
                    aria-hidden
                  />
                )}
                {actor.name}
              </span>
            )}
            {category && <span>{category.label}</span>}
            {localDt && (
              <time
                dateTime={localDt.toISO() ?? undefined}
                title={localDt.toLocaleString(DateTime.DATETIME_MED)}
              >
                {localDt.toLocaleString(DateTime.TIME_SIMPLE)}
              </time>
            )}
            {renderItemMeta?.(item)}
          </span>
        </span>
      </>
    );

    const mainClasses =
      'flex min-w-0 flex-1 items-start gap-3 rounded-md text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
    const href = getHref?.(id, item);
    let main: React.ReactNode;
    if (href) {
      main = (
        <a
          href={href}
          className={mainClasses}
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
            onOpen(id, item);
          }}
          onKeyDown={(event) => {
            // Anchors ignore Space natively; rows open on Enter and Space alike.
            if (event.key !== ' ') return;
            event.preventDefault();
            event.currentTarget.click();
          }}
        >
          {body}
        </a>
      );
    } else if (onOpen) {
      main = (
        <button
          type="button"
          className={mainClasses}
          onClick={() => onOpen(id, item)}
        >
          {body}
        </button>
      );
    } else {
      main = <div className={mainClasses}>{body}</div>;
    }

    return (
      <li
        key={id}
        ref={(el) => {
          if (el) rowRefs.current.set(id, el);
          else rowRefs.current.delete(id);
        }}
        data-slot="activity-feed-item"
        data-highlighted={highlighted || undefined}
        aria-busy={pending || undefined}
        className={cn(
          'flex items-start gap-2 px-3',
          compact ? 'py-1.5' : 'py-3',
          highlighted && 'ring-primary-500 bg-primary-500/10 ring-2 ring-inset',
          classNames?.item,
          highlighted && classNames?.highlightedItem
        )}
      >
        {main}
        {onTogglePin && renderItem && (
          <span id={titleId} hidden>
            {getTitle?.(item) ?? category?.label ?? id}
          </span>
        )}
        {onTogglePin && (
          <button
            type="button"
            aria-pressed={pinned}
            aria-label={text.pin}
            aria-describedby={titleId}
            disabled={pending}
            title={text.pin}
            onClick={() =>
              void runPin(id, !pinned, () => onTogglePin(id, !pinned))
            }
            className={cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md p-1.5',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              'disabled:opacity-50',
              pinned && 'text-foreground'
            )}
          >
            <Pin
              className={cn('size-4', pinned && 'fill-current')}
              aria-hidden
            />
          </button>
        )}
      </li>
    );
  };

  const section = (
    key: string,
    label: React.ReactNode,
    sectionItems: T[],
    summary?: React.ReactNode
  ) => {
    const headingId = `${baseId}-day-${key || 'none'}`;
    return (
      <section
        key={key}
        aria-labelledby={headingId}
        data-slot="activity-feed-section"
        className={classNames?.section}
      >
        <Heading
          id={headingId}
          data-slot="activity-feed-day-header"
          className={cn(
            'border-border bg-card text-muted-foreground sticky top-0 z-10 flex items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase',
            classNames?.dayHeader
          )}
        >
          {label}
        </Heading>
        {summary}
        <ul className="divide-border divide-y">
          {sectionItems.map(renderRow)}
        </ul>
      </section>
    );
  };

  let body: React.ReactNode;
  if (error) {
    body = (
      <RecordState
        kind="error"
        slot="activity-feed-state"
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
        slot="activity-feed-state"
        message={text.loading}
        className={classNames?.state}
      />
    );
  } else if (items.length === 0) {
    body = emptyState ?? (
      <RecordState
        kind="empty"
        slot="activity-feed-state"
        message={text.empty}
        className={classNames?.state}
      />
    );
  } else if (visible.length === 0) {
    body = (
      <RecordState
        kind="empty"
        slot="activity-feed-state"
        message={text.noMatches}
        className={classNames?.state}
      >
        <Button variant="ghost" size="sm" onClick={() => updateFilters([])}>
          {text.allCategories}
        </Button>
      </RecordState>
    );
  } else {
    body = (
      <>
        {pinnedItems.length > 0 &&
          section(
            'pinned',
            <>
              <Pin className="size-3.5" aria-hidden />
              {text.pinned}
            </>,
            pinnedItems
          )}
        {days.map((day) =>
          section(
            day.key,
            formatDayLabel(day.key, {
              now: reference,
              zone,
              locale,
              today: text.today,
              yesterday: text.yesterday,
              undated: text.undated,
            }),
            day.items,
            renderDaySummary?.(day.key, day.items)
          )
        )}
        {hasMore && onLoadMore && (
          <div
            data-slot="activity-feed-load-more"
            className={cn('border-border border-t p-3', classNames?.loadMore)}
          >
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              isLoading={loadingMore}
              onClick={() => void loadMore()}
            >
              {text.loadMore}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="activity-feed"
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
      {...rest}
    >
      {(categories.length > 0 || items.length > 0) && (
        <div
          data-slot="activity-feed-toolbar"
          className={cn(
            'border-border flex items-center gap-2 border-b px-3 py-2',
            classNames?.toolbar
          )}
        >
          {categories.length > 0 && (
            <div
              role="group"
              aria-label={text.filters}
              className="flex min-w-0 flex-1 flex-wrap gap-1.5"
            >
              <button
                type="button"
                aria-pressed={effectiveFilter.length === 0}
                onClick={() => updateFilters([])}
                data-slot="activity-feed-filter"
                className={cn(
                  chipClasses,
                  effectiveFilter.length === 0
                    ? 'border-primary-500/40 bg-primary-500/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted',
                  classNames?.filter
                )}
              >
                {text.allCategories}
              </button>
              {categories.map((category) => {
                const active = effectiveFilter.includes(category.id);
                const accent = accentClasses[category.color ?? 'primary'];
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      updateFilters(
                        active
                          ? effectiveFilter.filter((c) => c !== category.id)
                          : [...effectiveFilter, category.id]
                      )
                    }
                    data-slot="activity-feed-filter"
                    className={cn(
                      chipClasses,
                      active
                        ? cn(accent.tint, accent.border, 'text-foreground')
                        : 'border-border text-muted-foreground hover:bg-muted',
                      classNames?.filter
                    )}
                  >
                    {Icon && <Icon className="size-3.5" aria-hidden />}
                    {category.label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            aria-pressed={compact}
            aria-label={text.compact}
            title={text.compact}
            onClick={toggleDensity}
            className={cn(
              'text-muted-foreground hover:bg-muted ms-auto shrink-0 rounded-md p-1.5',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              compact && 'bg-muted text-foreground'
            )}
          >
            <Rows4 className="size-4" aria-hidden />
          </button>
        </div>
      )}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {body}
    </div>
  );
}

/**
 * A day-grouped feed of a record's activity. Declared
 * `parameters.catalog.collection` — its load states are part of the API.
 */
export const ActivityFeed = React.forwardRef(ActivityFeedInner) as <T>(
  props: ActivityFeedProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

(ActivityFeed as React.FC).displayName = 'ActivityFeed';
