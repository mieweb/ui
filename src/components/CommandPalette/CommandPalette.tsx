import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useClickOutside } from '../../hooks/useClickOutside';
import {
  useCommandPalette,
  type CommandPaletteItem,
  type CommandPaletteCategory,
} from './CommandPaletteProvider';

// =============================================================================
// Icons
// =============================================================================

const SearchIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// =============================================================================
// Helpers
// =============================================================================

/** Check if running on Mac */
const isMac =
  typeof window !== 'undefined' &&
  typeof window.navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

// =============================================================================
// CommandPalette Component
// =============================================================================

export interface CommandPaletteProps {
  /** Placeholder text for search input */
  placeholder?: string;
  /** Whether search is loading */
  isLoading?: boolean;
  /** Called when an item is selected */
  onSelect?: (item: CommandPaletteItem) => void;
  /** Custom empty state content */
  emptyState?: React.ReactNode;
  /** Custom render function for items */
  renderItem?: (
    item: CommandPaletteItem,
    options: { isSelected: boolean; index: number }
  ) => React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Additional CSS classes for the modal */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function CommandPalette({
  placeholder = 'Search...',
  isLoading = false,
  onSelect,
  emptyState,
  renderItem,
  footer,
  className,
  'data-testid': testId = 'command-palette',
}: CommandPaletteProps): React.JSX.Element | null {
  const {
    isOpen,
    close,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    activeCategory,
    setActiveCategory,
    items,
    categories,
  } = useCommandPalette();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items by query and category
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by category
    if (activeCategory) {
      result = result.filter((item) => item.category === activeCategory);
    }

    // Filter by query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (item) =>
          item.label.toLowerCase().includes(lowerQuery) ||
          item.subtitle?.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [items, query, activeCategory]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Map<string, CommandPaletteItem[]> = new Map();

    filteredItems.forEach((item) => {
      const category = item.category ?? 'Other';
      const group = groups.get(category) ?? [];
      group.push(item);
      groups.set(category, group);
    });

    return groups;
  }, [filteredItems]);

  // Handle close
  useEscapeKey(close, isOpen);
  useClickOutside(containerRef, close);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [filteredItems.length, setSelectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(
            Math.min(selectedIndex + 1, filteredItems.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            const item = filteredItems[selectedIndex];
            if (!item.disabled) {
              onSelect?.(item);
              close();
            }
          }
          break;
        case 'Tab':
          e.preventDefault();
          // Cycle through categories
          if (categories.length > 0) {
            const currentIdx = activeCategory
              ? categories.findIndex((c) => c.id === activeCategory)
              : -1;
            const nextIdx = e.shiftKey
              ? currentIdx <= 0
                ? categories.length - 1
                : currentIdx - 1
              : currentIdx >= categories.length - 1
                ? -1
                : currentIdx + 1;
            setActiveCategory(nextIdx === -1 ? null : categories[nextIdx].id);
          }
          break;
      }
    },
    [
      filteredItems,
      selectedIndex,
      setSelectedIndex,
      onSelect,
      close,
      categories,
      activeCategory,
      setActiveCategory,
    ]
  );

  const handleItemClick = useCallback(
    (item: CommandPaletteItem) => {
      if (!item.disabled) {
        onSelect?.(item);
        close();
      }
    },
    [onSelect, close]
  );

  const getCategoryInfo = useCallback(
    (categoryId: string): CommandPaletteCategory | undefined => {
      return categories.find((c) => c.id === categoryId);
    },
    [categories]
  );

  if (!isOpen) return null;

  // Calculate global index for items across groups
  let globalIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm dark:bg-black/70"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl px-4">
        <div
          ref={containerRef}
          data-testid={testId}
          className={cn(
            'rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
            'overflow-hidden shadow-2xl',
            className
          )}
        >
          {/* Search Input */}
          <div className="relative border-b border-gray-200 dark:border-gray-700">
            <div className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              data-testid={`${testId}-input`}
              className={cn(
                'w-full bg-transparent py-4 pr-12 pl-12 text-base',
                'focus:outline-none dark:text-white dark:placeholder-gray-400'
              )}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                data-testid={`${testId}-clear`}
                className="absolute top-1/2 right-12 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XIcon />
              </button>
            )}
            {isLoading && (
              <div className="text-primary-500 absolute top-1/2 right-4 -translate-y-1/2">
                <SpinnerIcon />
              </div>
            )}
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 p-2 dark:border-gray-700">
              <button
                onClick={() => setActiveCategory(null)}
                data-testid={`${testId}-filter-all`}
                className={cn(
                  'rounded px-2 py-1 text-xs font-medium transition-colors',
                  activeCategory === null
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  data-testid={`${testId}-filter-${cat.id}`}
                  className={cn(
                    'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                    activeCategory === cat.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  )}
                >
                  {cat.icon && <span className="h-3 w-3">{cat.icon}</span>}
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Results List */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {emptyState ?? (
                  <>
                    <div className="mx-auto mb-2 h-8 w-8 opacity-50">
                      <SearchIcon />
                    </div>
                    <p className="text-sm">
                      {query.trim()
                        ? `No results for "${query}"`
                        : 'Start typing to search...'}
                    </p>
                  </>
                )}
              </div>
            ) : (
              Array.from(groupedItems.entries()).map(
                ([categoryId, categoryItems]) => {
                  const categoryInfo = getCategoryInfo(categoryId);
                  return (
                    <div key={categoryId}>
                      {/* Group Header */}
                      <div
                        className={cn(
                          'sticky top-0 px-3 py-2 text-xs font-semibold',
                          'text-gray-500 dark:text-gray-400',
                          'bg-gray-50 dark:bg-gray-900/50'
                        )}
                      >
                        {categoryInfo?.icon && (
                          <span
                            className={cn(
                              'mr-2 inline-block h-4 w-4 align-middle',
                              categoryInfo.colorClass
                            )}
                          >
                            {categoryInfo.icon}
                          </span>
                        )}
                        {categoryInfo?.label ?? categoryId} (
                        {categoryItems.length})
                      </div>

                      {/* Group Items */}
                      {categoryItems.map((item) => {
                        globalIndex++;
                        const currentIndex = globalIndex;
                        const isSelected = currentIndex === selectedIndex;

                        if (renderItem) {
                          return (
                            <div
                              key={item.id}
                              role="option"
                              aria-selected={isSelected}
                              data-index={currentIndex}
                              onClick={() => handleItemClick(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleItemClick(item);
                                }
                              }}
                              onMouseEnter={() =>
                                setSelectedIndex(currentIndex)
                              }
                              tabIndex={0}
                            >
                              {renderItem(item, {
                                isSelected,
                                index: currentIndex,
                              })}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={item.id}
                            data-index={currentIndex}
                            onClick={() => handleItemClick(item)}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            disabled={item.disabled}
                            className={cn(
                              'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                              isSelected
                                ? 'bg-primary-50 dark:bg-primary-500/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                              item.disabled && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            {item.icon && (
                              <div
                                className={cn(
                                  'mt-0.5 h-4 w-4 flex-shrink-0',
                                  isSelected
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-400'
                                )}
                              >
                                {item.icon}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {item.label}
                              </div>
                              {item.subtitle && (
                                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {item.subtitle}
                                </div>
                              )}
                              {item.description && (
                                <div className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.shortcut && (
                              <kbd
                                className={cn(
                                  'hidden items-center px-1.5 py-0.5 text-[10px] sm:inline-flex',
                                  'rounded border bg-gray-100 dark:bg-gray-700',
                                  'border-gray-200 dark:border-gray-600',
                                  'text-gray-500 dark:text-gray-400'
                                )}
                              >
                                {item.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
              )
            )}
          </div>

          {/* Footer */}
          {footer ?? (
            <div
              className={cn(
                'border-t border-gray-100 p-2 dark:border-gray-700',
                'bg-gray-50 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400',
                'flex items-center justify-between'
              )}
            >
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">
                  ↑↓
                </kbd>
                <span>navigate</span>
                <kbd className="ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">
                  ↵
                </kbd>
                <span>select</span>
                <kbd className="ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">
                  esc
                </kbd>
                <span>close</span>
              </div>
              <span>{filteredItems.length} results</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// CommandPaletteTrigger Component
// =============================================================================

export interface CommandPaletteTriggerProps {
  /** Button content (default shows search icon and keyboard hint) */
  children?: React.ReactNode;
  /** Placeholder text to show in the trigger */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function CommandPaletteTrigger({
  children,
  placeholder = 'Search...',
  className,
  'data-testid': testId = 'command-palette-trigger',
}: CommandPaletteTriggerProps): React.JSX.Element {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      data-testid={testId}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600',
        'bg-white px-4 py-2.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        'hover:border-gray-400 dark:hover:border-gray-500',
        'transition-colors hover:bg-gray-50 dark:hover:bg-gray-600',
        'min-w-[200px] sm:min-w-[300px]',
        className
      )}
    >
      {children ?? (
        <>
          <SearchIcon />
          <span className="flex-1 text-left whitespace-nowrap">
            {placeholder}
          </span>
          <kbd
            className={cn(
              'inline-flex items-center gap-0.5 px-2 py-0.5',
              'rounded border border-gray-200 bg-gray-100 dark:border-gray-500 dark:bg-gray-600',
              'flex-shrink-0 text-xs text-gray-500 dark:text-gray-300'
            )}
          >
            {isMac ? '⌘' : 'Ctrl'}+K
          </kbd>
        </>
      )}
    </button>
  );
}
