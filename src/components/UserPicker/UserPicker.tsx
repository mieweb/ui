'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, Loader2, Search, UserX } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Avatar } from '../Avatar';
import { AvatarGroup } from '../AvatarGroup';

export interface UserPickerUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserPickerLabels {
  placeholder: string;
  unassigned: string;
  search: string;
  noResults: string;
  loading: string;
  selectedCount: (count: number) => string;
  saving: string;
  saveFailed: string;
}

export const defaultUserPickerLabels: UserPickerLabels = {
  placeholder: 'Select a user',
  unassigned: 'Unassigned',
  search: 'Search users',
  noResults: 'No matching users',
  loading: 'Loading users…',
  selectedCount: (count) => `${count} selected`,
  saving: 'Saving…',
  saveFailed: 'Could not save. Try again.',
};

const triggerVariants = cva(
  [
    'flex w-full items-center gap-2 rounded-lg border border-input bg-background text-start text-foreground',
    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: { sm: 'min-h-8 px-2 py-1 text-sm', md: 'min-h-10 px-3 py-1.5' },
    },
    defaultVariants: { size: 'md' },
  }
);

interface UserPickerBaseProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    VariantProps<typeof triggerVariants> {
  users: UserPickerUser[];
  /** Field label; also the accessible name of the trigger. */
  label: string;
  /** Visually hide the label. */
  hideLabel?: boolean;
  /** Offer an "Unassigned" option that clears the selection. */
  allowUnassigned?: boolean;
  /** Show a loading row instead of options. */
  loading?: boolean;
  disabled?: boolean;
  /** Called as the search query changes (for server-side search). */
  onQueryChange?: (query: string) => void;
  /** Translatable strings. */
  labels?: Partial<UserPickerLabels>;
}

export interface UserPickerSingleProps extends UserPickerBaseProps {
  multiple?: false;
  value: string | null;
  /** May return a promise; a rejection restores the previous value. */
  onChange: (value: string | null) => void | Promise<void>;
}

export interface UserPickerMultipleProps extends UserPickerBaseProps {
  multiple: true;
  value: string[];
  /** May return a promise; a rejection restores the previous value. */
  onChange: (value: string[]) => void | Promise<void>;
}

export type UserPickerProps = UserPickerSingleProps | UserPickerMultipleProps;

type Row = { kind: 'none' } | { kind: 'user'; user: UserPickerUser };

/**
 * Choose one or several users (owners, assignees) from a searchable list
 * with avatars.
 */
export const UserPicker = React.forwardRef<HTMLDivElement, UserPickerProps>(
  function UserPicker(props, ref) {
    const {
      users,
      label,
      hideLabel,
      allowUnassigned,
      loading,
      disabled,
      onQueryChange,
      labels: labelOverrides,
      size,
      className,
      multiple,
      value,
      onChange,
      ...rest
    } = props;
    const labels = { ...defaultUserPickerLabels, ...labelOverrides };
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [pendingIds, setPendingIds] = React.useState<string[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const id = React.useId();
    const labelId = `${id}-label`;
    const listId = `${id}-list`;
    const errorId = `${id}-error`;

    const { anchorRef, floatingRef, style } = useAnchoredPosition<
      HTMLButtonElement,
      HTMLDivElement
    >({ open, matchMinWidth: true, maxHeight: 320 });
    const outsideRefs = React.useMemo(
      () => [containerRef, floatingRef],
      [floatingRef]
    );
    useClickOutside(outsideRefs, () => setOpen(false), open);

    const committed = multiple
      ? (value as string[])
      : value
        ? [value as string]
        : [];
    const selectedIds = pendingIds ?? committed;
    const selectedUsers = selectedIds
      .map((uid) => users.find((u) => u.id === uid))
      .filter((u): u is UserPickerUser => !!u);

    const q = query.trim().toLowerCase();
    const rows: Row[] = [
      ...(allowUnassigned && !q ? [{ kind: 'none' } as const] : []),
      ...users
        .filter(
          (u) =>
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        )
        .map((user) => ({ kind: 'user', user }) as const),
    ];
    const optionId = (i: number) => `${listId}-${i}`;

    React.useEffect(() => {
      if (open) searchRef.current?.focus();
    }, [open]);

    React.useEffect(() => {
      if (open) {
        document
          .getElementById(`${listId}-${activeIndex}`)
          ?.scrollIntoView?.({ block: 'nearest' });
      }
    }, [open, activeIndex, listId]);

    const openList = () => {
      if (disabled || pendingIds) return;
      const first = rows.findIndex(
        (r) => r.kind === 'user' && selectedIds.includes(r.user.id)
      );
      setActiveIndex(Math.max(first, 0));
      setOpen(true);
    };

    const close = (refocus: boolean) => {
      setOpen(false);
      setQuery('');
      onQueryChange?.('');
      if (refocus) triggerRef.current?.focus();
    };

    const emit = async (next: string[]) => {
      setError(null);
      setPendingIds(next);
      try {
        if (multiple) {
          await (onChange as UserPickerMultipleProps['onChange'])(next);
        } else {
          await (onChange as UserPickerSingleProps['onChange'])(
            next[0] ?? null
          );
        }
      } catch (e) {
        setError(
          e instanceof Error && e.message ? e.message : labels.saveFailed
        );
      } finally {
        setPendingIds(null);
      }
    };

    const choose = (row: Row) => {
      if (pendingIds) return;
      if (row.kind === 'none') {
        void emit([]);
        close(true);
      } else if (multiple) {
        const uid = row.user.id;
        void emit(
          selectedIds.includes(uid)
            ? selectedIds.filter((s) => s !== uid)
            : [...selectedIds, uid]
        );
      } else {
        if (row.user.id !== committed[0]) void emit([row.user.id]);
        close(true);
      }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const last = rows.length - 1;
      const moves: Record<string, number> = {
        ArrowDown: Math.min(activeIndex + 1, last),
        ArrowUp: Math.max(activeIndex - 1, 0),
        Home: 0,
        End: last,
      };
      if (e.key in moves) {
        e.preventDefault();
        setActiveIndex(moves[e.key]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (rows[activeIndex]) choose(rows[activeIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      } else if (e.key === 'Tab') {
        close(false);
      }
    };

    const summary =
      selectedUsers.length === 0 ? (
        <span className="text-muted-foreground truncate">
          {allowUnassigned ? labels.unassigned : labels.placeholder}
        </span>
      ) : selectedUsers.length === 1 ? (
        <>
          <Avatar
            aria-hidden="true"
            size="xs"
            src={selectedUsers[0].avatarUrl}
            name={selectedUsers[0].name}
          />
          <span className="truncate">{selectedUsers[0].name}</span>
        </>
      ) : (
        <>
          <AvatarGroup size="xs" max={3} aria-hidden="true">
            {selectedUsers.map((u) => (
              <Avatar key={u.id} src={u.avatarUrl} name={u.name} />
            ))}
          </AvatarGroup>
          <span className="truncate">
            {labels.selectedCount(selectedUsers.length)}
          </span>
        </>
      );

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        data-slot="user-picker"
        className={cn('w-full', className)}
        {...rest}
      >
        <span
          id={labelId}
          className={cn(
            'text-foreground mb-1.5 block text-sm font-medium',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </span>
        <button
          ref={(node) => {
            triggerRef.current = node;
            anchorRef.current = node;
          }}
          type="button"
          id={`${id}-trigger`}
          data-slot="user-picker-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-labelledby={`${labelId} ${id}-trigger`}
          aria-describedby={error ? errorId : undefined}
          aria-busy={pendingIds ? true : undefined}
          disabled={disabled}
          onClick={() => (open ? close(false) : openList())}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              openList();
            }
          }}
          className={triggerVariants({ size })}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {summary}
          </span>
          {pendingIds ? (
            <span role="status" className="inline-flex">
              <Loader2
                aria-hidden="true"
                className="text-muted-foreground h-4 w-4 animate-spin motion-reduce:animate-none"
              />
              <span className="sr-only">{labels.saving}</span>
            </span>
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground h-4 w-4 shrink-0"
            />
          )}
        </button>
        {error && (
          <p
            id={errorId}
            role="alert"
            data-slot="user-picker-error"
            className="text-destructive mt-1 text-sm"
          >
            {error}
          </p>
        )}
        {open &&
          createPortal(
            <div
              ref={floatingRef}
              style={style}
              data-slot="user-picker-popover"
              className="border-border bg-card text-card-foreground flex flex-col overflow-hidden rounded-md border shadow-lg"
            >
              <div className="border-border flex items-center gap-2 border-b px-3">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground h-4 w-4 shrink-0"
                />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-label={labels.search}
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    rows[activeIndex] ? optionId(activeIndex) : undefined
                  }
                  autoComplete="off"
                  placeholder={labels.search}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                    onQueryChange?.(e.target.value);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="placeholder:text-muted-foreground text-foreground h-9 w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div
                id={listId}
                role="listbox"
                aria-labelledby={labelId}
                aria-multiselectable={multiple || undefined}
                aria-busy={loading || undefined}
                className="min-h-0 flex-1 overflow-auto py-1"
              >
                {loading ? (
                  <div
                    role="status"
                    className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    />
                    {labels.loading}
                  </div>
                ) : rows.length === 0 ? (
                  <div className="text-muted-foreground px-3 py-2 text-sm">
                    {labels.noResults}
                  </div>
                ) : (
                  rows.map((row, i) => {
                    const selected =
                      row.kind === 'none'
                        ? selectedIds.length === 0
                        : selectedIds.includes(row.user.id);
                    return (
                      <button
                        key={row.kind === 'none' ? '__none__' : row.user.id}
                        type="button"
                        tabIndex={-1}
                        id={optionId(i)}
                        role="option"
                        aria-selected={selected}
                        data-active={i === activeIndex || undefined}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(row)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-start text-sm',
                          i === activeIndex ? 'bg-muted' : 'hover:bg-muted'
                        )}
                      >
                        {row.kind === 'none' ? (
                          <>
                            <span className="bg-muted text-muted-foreground inline-flex h-6 w-6 items-center justify-center rounded-full">
                              <UserX
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                            </span>
                            <span className="flex-1">{labels.unassigned}</span>
                          </>
                        ) : (
                          <>
                            <Avatar
                              aria-hidden="true"
                              size="xs"
                              src={row.user.avatarUrl}
                              name={row.user.name}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">
                                {row.user.name}
                              </span>
                              {row.user.email && (
                                <span className="text-muted-foreground block truncate text-xs">
                                  {row.user.email}
                                </span>
                              )}
                            </span>
                          </>
                        )}
                        <Check
                          aria-hidden="true"
                          className={cn(
                            'text-primary-600 dark:text-primary-400 h-4 w-4 shrink-0',
                            !selected && 'invisible'
                          )}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }
);

UserPicker.displayName = 'UserPicker';
