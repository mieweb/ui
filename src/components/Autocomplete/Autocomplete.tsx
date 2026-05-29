import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { inputVariants } from '../Input';

export interface AutocompleteProps<T>
  extends Pick<VariantProps<typeof inputVariants>, 'size'> {
  /** Candidate items to search through. */
  items: T[];
  /** Called when the user picks an item. */
  onSelect: (item: T) => void;
  /** Returns a stable key for an item (used for React keys & option ids). */
  getItemKey: (item: T) => string;
  /** Renders the visible content of a result row. */
  renderItem: (item: T) => React.ReactNode;
  /**
   * Predicate used to filter `items` by the current query. When omitted, all
   * `items` are shown as-is (the caller is responsible for filtering).
   */
  filter?: (item: T, query: string) => boolean;
  /** Controlled query value. */
  value?: string;
  /** Default query value (uncontrolled). */
  defaultValue?: string;
  /** Called whenever the query changes. */
  onValueChange?: (query: string) => void;
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Content shown when there are no matching items. */
  emptyMessage?: React.ReactNode;
  /**
   * Renders the label of a "create new" action appended to the results. When
   * provided together with `onCreate`, the action row is shown.
   */
  createLabel?: (query: string) => React.ReactNode;
  /** Called when the "create new" action is chosen. Receives the query. */
  onCreate?: (query: string) => void;
  /** Minimum query length before results open. Defaults to 1. */
  minQueryLength?: number;
  /** Clear the query after a selection. Defaults to true. */
  clearOnSelect?: boolean;
  /** Disable the input. */
  disabled?: boolean;
  /** Accessible label for the combobox input. */
  'aria-label'?: string;
  /** Class applied to the outer wrapper. */
  className?: string;
  /** Class applied to the input element. */
  inputClassName?: string;
  /** Forwarded ref to the underlying input. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Additional props forwarded to the input element. */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'size'
    | 'placeholder'
    | 'disabled'
    | 'aria-label'
  >;
}

type Row<T> =
  | { kind: 'item'; item: T; key: string }
  | { kind: 'create'; key: string };

/**
 * A data-agnostic, presentational combobox. It renders a search input with a
 * filterable results popover and an optional "create new" action. All data and
 * side effects are supplied via props/callbacks so it can be wired to any store.
 *
 * @example
 * ```tsx
 * <Autocomplete
 *   items={employees}
 *   getItemKey={(e) => e.id}
 *   filter={(e, q) => e.name.toLowerCase().includes(q.toLowerCase())}
 *   renderItem={(e) => <span>{e.name}</span>}
 *   onSelect={handleSelect}
 *   placeholder="Search employees…"
 * />
 * ```
 */
function Autocomplete<T>({
  items,
  onSelect,
  getItemKey,
  renderItem,
  filter,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  placeholder,
  emptyMessage,
  createLabel,
  onCreate,
  minQueryLength = 1,
  clearOnSelect = true,
  disabled,
  size,
  className,
  inputClassName,
  inputRef,
  inputProps,
  'aria-label': ariaLabel,
}: AutocompleteProps<T>) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const query = isControlled ? controlledValue : uncontrolledValue;

  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  useClickOutside(containerRef, () => setOpen(false), open);

  const setQuery = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const filteredItems = React.useMemo(() => {
    if (!filter) return items;
    return items.filter((item) => filter(item, query));
  }, [items, filter, query]);

  const showCreate = Boolean(onCreate && createLabel && query.length > 0);

  const rows = React.useMemo<Row<T>[]>(() => {
    const itemRows: Row<T>[] = filteredItems.map((item) => ({
      kind: 'item',
      item,
      key: getItemKey(item),
    }));
    if (showCreate) {
      itemRows.push({ kind: 'create', key: '__create__' });
    }
    return itemRows;
  }, [filteredItems, showCreate, getItemKey]);

  const meetsMinLength = query.length >= minQueryLength;
  const hasContent =
    rows.length > 0 || (meetsMinLength && emptyMessage != null);
  const isOpen = open && meetsMinLength && hasContent;

  React.useEffect(() => {
    if (!isOpen) setActiveIndex(-1);
  }, [isOpen]);

  const commitRow = (row: Row<T>) => {
    if (row.kind === 'item') {
      onSelect(row.item);
    } else {
      onCreate?.(query);
    }
    setOpen(false);
    setActiveIndex(-1);
    if (clearOnSelect) setQuery('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => (rows.length === 0 ? -1 : (i + 1) % rows.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) return;
      setActiveIndex((i) =>
        rows.length === 0 ? -1 : (i - 1 + rows.length) % rows.length
      );
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && activeIndex < rows.length) {
        e.preventDefault();
        commitRow(rows[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const activeId =
    isOpen && activeIndex >= 0 && activeIndex < rows.length
      ? `${listId}-opt-${rows[activeIndex].key}`
      : undefined;

  return (
    <div
      ref={containerRef}
      data-slot="autocomplete"
      className={cn('relative', className)}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-label={ariaLabel}
        autoComplete="off"
        data-slot="autocomplete-input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (meetsMinLength) setOpen(true);
        }}
        className={cn(inputVariants({ size }), inputClassName)}
        {...inputProps}
      />

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          data-slot="autocomplete-list"
          className={cn(
            'absolute z-50 mt-1 w-full overflow-auto rounded-md border border-border',
            'max-h-[300px] bg-card text-card-foreground shadow-lg'
          )}
        >
          {rows.length === 0
            ? emptyMessage != null && (
                <div
                  data-slot="autocomplete-empty"
                  className="px-4 py-3 text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </div>
              )
            : rows.map((row, index) => {
                const isActive = index === activeIndex;
                const optionId = `${listId}-opt-${row.key}`;
                return (
                  <button
                    key={row.key}
                    id={optionId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-slot={
                      row.kind === 'create'
                        ? 'autocomplete-create'
                        : 'autocomplete-option'
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commitRow(row)}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm transition-colors',
                      'border-b border-border last:border-b-0',
                      'focus:outline-none',
                      isActive ? 'bg-muted text-foreground' : 'hover:bg-muted',
                      row.kind === 'create' &&
                        'flex items-center gap-2 font-medium text-primary-800'
                    )}
                  >
                    {row.kind === 'create'
                      ? createLabel!(query)
                      : renderItem(row.item)}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}

Autocomplete.displayName = 'Autocomplete';

export { Autocomplete };
