'use client';

import * as React from 'react';
import { LoaderCircle, Plus, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { RecordState } from '../ActivityFeed/RecordState';
import { usePendingOverrides } from '../ActivityFeed/usePendingOverrides';

// =============================================================================
// Types
// =============================================================================

export interface AssociationListItem {
  id: string;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
}

export interface AssociationListLabels {
  loading: string;
  empty: string;
  error: string;
  retry: string;
  add: string;
  /** Accessible name of an item's remove button. */
  remove: (name: string) => string;
  showAll: (count: number) => string;
  showLess: string;
}

export const defaultAssociationListLabels: AssociationListLabels = {
  loading: 'Loading',
  empty: 'None yet',
  error: 'Could not load these records',
  retry: 'Try again',
  add: 'Add',
  remove: (name) => `Remove ${name}`,
  showAll: (count) => `Show all (${count})`,
  showLess: 'Show less',
};

export type AssociationListSlot =
  | 'header'
  | 'list'
  | 'item'
  | 'toggle'
  | 'state';

export interface AssociationListProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'children' | 'title'
> {
  /** Card heading, e.g. "Contacts". */
  title: string;
  items: AssociationListItem[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  /** Items shown before "Show all". Defaults to 5. */
  maxVisible?: number;
  onOpen?: (id: string, item: AssociationListItem) => void;
  getHref?: (id: string, item: AssociationListItem) => string;
  /** Renders the header's add button. */
  onAdd?: () => void;
  /** Confirmation is the caller's; the row shows pending until the promise settles. */
  onRemove?: (id: string, item: AssociationListItem) => void | Promise<void>;
  /** Trailing content per row, e.g. a role badge. */
  renderItemMeta?: (item: AssociationListItem) => React.ReactNode;
  emptyState?: React.ReactNode;
  labels?: Partial<AssociationListLabels>;
  classNames?: Partial<Record<AssociationListSlot, string>>;
  headingLevel?: 'h2' | 'h3' | 'h4';
}

// =============================================================================
// Component
// =============================================================================

/**
 * A card of records related to the current one. Declared
 * `parameters.catalog.collection` — its load states are part of the API.
 */
export const AssociationList = React.forwardRef<
  HTMLElement,
  AssociationListProps
>(
  (
    {
      title,
      items,
      loading = false,
      error = null,
      onRetry,
      maxVisible = 5,
      onOpen,
      getHref,
      onAdd,
      onRemove,
      renderItemMeta,
      emptyState,
      labels,
      classNames,
      headingLevel: Heading = 'h3',
      className,
      ...rest
    },
    ref
  ) => {
    const text = { ...defaultAssociationListLabels, ...labels };
    const headingId = React.useId();
    const listId = React.useId();
    const [expanded, setExpanded] = React.useState(false);
    const [pending, runRemove] = usePendingOverrides<true>();

    const shown = expanded ? items : items.slice(0, maxVisible);
    const linkClasses =
      'text-foreground block truncate rounded-sm text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    let body: React.ReactNode;
    if (error) {
      body = (
        <RecordState
          kind="error"
          slot="association-list-state"
          message={text.error}
          retryLabel={text.retry}
          onRetry={onRetry}
          className={cn('py-6', classNames?.state)}
        />
      );
    } else if (loading) {
      body = (
        <RecordState
          kind="loading"
          slot="association-list-state"
          message={text.loading}
          rows={2}
          className={classNames?.state}
        />
      );
    } else if (items.length === 0) {
      body = emptyState ?? (
        <RecordState
          kind="empty"
          slot="association-list-state"
          message={text.empty}
          className={cn('py-6', classNames?.state)}
        />
      );
    } else {
      body = (
        <>
          <ul
            id={listId}
            data-slot="association-list-list"
            className={cn('divide-border divide-y', classNames?.list)}
          >
            {shown.map((item) => {
              const isPending = pending.has(item.id);
              const href = getHref?.(item.id, item);
              let name: React.ReactNode = (
                <span className="text-foreground block truncate text-sm font-medium">
                  {item.name}
                </span>
              );
              if (href) {
                name = (
                  <a
                    href={href}
                    className={linkClasses}
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
                      onOpen(item.id, item);
                    }}
                  >
                    {item.name}
                  </a>
                );
              } else if (onOpen) {
                name = (
                  <button
                    type="button"
                    className={cn(linkClasses, 'max-w-full text-start')}
                    onClick={() => onOpen(item.id, item)}
                  >
                    {item.name}
                  </button>
                );
              }
              return (
                <li
                  key={item.id}
                  data-slot="association-list-item"
                  aria-busy={isPending || undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5',
                    isPending && 'opacity-60',
                    classNames?.item
                  )}
                >
                  <Avatar
                    size="sm"
                    name={item.name}
                    src={item.avatarUrl}
                    alt=""
                    aria-hidden
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    {name}
                    {item.subtitle && (
                      <span className="text-muted-foreground block truncate text-xs">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {renderItemMeta?.(item)}
                  {onRemove && (
                    <button
                      type="button"
                      aria-label={text.remove(item.name)}
                      title={text.remove(item.name)}
                      disabled={isPending}
                      onClick={() =>
                        void runRemove(item.id, true, () =>
                          onRemove(item.id, item)
                        )
                      }
                      className={cn(
                        'text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md p-1.5',
                        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
                      )}
                    >
                      {isPending ? (
                        <LoaderCircle
                          className="size-4 animate-spin motion-reduce:animate-none"
                          aria-hidden
                        />
                      ) : (
                        <X className="size-4" aria-hidden />
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {items.length > maxVisible && (
            <div className="border-border border-t px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                aria-expanded={expanded}
                aria-controls={listId}
                data-slot="association-list-toggle"
                className={classNames?.toggle}
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? text.showLess : text.showAll(items.length)}
              </Button>
            </div>
          )}
        </>
      );
    }

    return (
      <section
        ref={ref}
        aria-labelledby={headingId}
        data-slot="association-list"
        className={cn(
          'border-border bg-card overflow-hidden rounded-lg border',
          className
        )}
        {...rest}
      >
        <div
          data-slot="association-list-header"
          className={cn(
            'border-border flex items-center gap-2 border-b px-4 py-2.5',
            classNames?.header
          )}
        >
          <Heading
            id={headingId}
            className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold"
          >
            {title}
          </Heading>
          {!loading && !error && (
            <Badge size="sm" variant="secondary">
              {items.length}
            </Badge>
          )}
          {onAdd && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              leftIcon={<Plus className="size-4" aria-hidden />}
            >
              {text.add}
            </Button>
          )}
        </div>
        {body}
      </section>
    );
  }
);

AssociationList.displayName = 'AssociationList';
