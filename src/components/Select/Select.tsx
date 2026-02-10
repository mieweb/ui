import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
  /** Unique value for the option */
  value: string;
  /** Display label for the option */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional group this option belongs to */
  group?: string;
}

export interface SelectGroup {
  /** Group label */
  label: string;
  /** Options in this group */
  options: SelectOption[];
}

// ============================================================================
// Variants
// ============================================================================

const selectTriggerVariants = cva(
  [
    'flex w-full items-center justify-between gap-2',
    'border border-input rounded-lg',
    'bg-background text-foreground',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-3 text-base',
        lg: 'h-12 px-4 text-lg',
      },
      hasError: {
        true: 'border-destructive focus:ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
    },
  }
);

// ============================================================================
// Select Component
// ============================================================================

export interface SelectProps extends VariantProps<
  typeof selectTriggerVariants
> {
  /** Array of options or groups */
  options: (SelectOption | SelectGroup)[];
  /** Controlled value */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Label for the select */
  label?: string;
  /** Hide the label visually */
  hideLabel?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Enable search/filter */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** No results text */
  noResultsText?: string;
  /** Additional class name */
  className?: string;
  /** ID for the select */
  id?: string;
}

/**
 * An accessible select/dropdown component with search support.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 *   onValueChange={(value) => console.log(value)}
 * />
 * ```
 */
function Select({
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  label,
  hideLabel = false,
  error,
  helperText,
  size,
  hasError,
  searchable = false,
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found',
  className,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const generatedId = React.useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  // Flatten options for easy access
  const flatOptions = React.useMemo(() => {
    const result: SelectOption[] = [];
    for (const item of options) {
      if ('options' in item) {
        result.push(...item.options);
      } else {
        result.push(item);
      }
    }
    return result;
  }, [options]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    const query = searchQuery.toLowerCase();
    const result: (SelectOption | SelectGroup)[] = [];

    for (const item of options) {
      if ('options' in item) {
        const filteredGroupOptions = item.options.filter((opt) =>
          opt.label.toLowerCase().includes(query)
        );
        if (filteredGroupOptions.length > 0) {
          result.push({ ...item, options: filteredGroupOptions });
        }
      } else {
        if (item.label.toLowerCase().includes(query)) {
          result.push(item);
        }
      }
    }

    return result;
  }, [options, searchQuery]);

  // Get filtered flat options for keyboard navigation
  const filteredFlatOptions = React.useMemo(() => {
    const result: SelectOption[] = [];
    for (const item of filteredOptions) {
      if ('options' in item) {
        result.push(...item.options.filter((opt) => !opt.disabled));
      } else if (!item.disabled) {
        result.push(item);
      }
    }
    return result;
  }, [filteredOptions]);

  // Get selected option
  const selectedOption = flatOptions.find((opt) => opt.value === value);

  // Close dropdown on click outside (handles both container and portaled dropdown)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, isOpen);

  // Track trigger position for portal dropdown
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>(
    {}
  );

  const updateDropdownPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedDropdownHeight = Math.min(
      (flatOptions.length * 40) + 16,
      300
    );
    const openAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(openAbove ? spaceAbove - 8 : spaceBelow - 8, 300),
      overflowY: 'auto',
      zIndex: 9999,
    });
  }, [flatOptions.length]);

  React.useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();

    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  // Handle value change
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
    },
    [isControlled, onValueChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredFlatOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredFlatOptions.length - 1
            );
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            handleValueChange(filteredFlatOptions[highlightedIndex].value);
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case 'Home':
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setHighlightedIndex(filteredFlatOptions.length - 1);
          break;
      }
    },
    [isOpen, highlightedIndex, filteredFlatOptions, handleValueChange]
  );

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when search changes
  React.useEffect(() => {
    setHighlightedIndex(filteredFlatOptions.length > 0 ? 0 : -1);
  }, [searchQuery, filteredFlatOptions.length]);

  // Build aria-describedby
  const describedByIds = [error ? errorId : null, helperText ? helperId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            'text-foreground text-sm font-medium',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-invalid={hasError || !!error}
          aria-describedby={describedByIds || undefined}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            selectTriggerVariants({ size, hasError: hasError || !!error })
          )}
        >
          <span
            className={cn(
              'truncate',
              !selectedOption && 'text-muted-foreground'
            )}
          >
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown (portaled to body to avoid overflow clipping) */}
        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className={cn(
                'border-border bg-card rounded-lg border shadow-lg',
                'animate-in fade-in zoom-in-95 duration-100'
              )}
            >
              {/* Search Input */}
              {searchable && (
                <div className="border-border border-b p-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className={cn(
                      'border-input bg-background w-full rounded-md border px-3 py-2 text-sm',
                      'placeholder:text-muted-foreground',
                      'focus:ring-ring focus:ring-2 focus:outline-none'
                    )}
                    aria-label="Search options"
                  />
                </div>
              )}

              {/* Options List */}
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-label={label || 'Options'}
                className="max-h-60 overflow-auto p-1"
              >
                {filteredFlatOptions.length === 0 ? (
                  <li className="text-muted-foreground px-3 py-2 text-center text-sm">
                    {noResultsText}
                  </li>
                ) : (
                  filteredOptions.map((item) => {
                    if ('options' in item) {
                      // Render group
                      return (
                        <li key={`group-${item.label}`} role="presentation">
                          <div className="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
                            {item.label}
                          </div>
                          <ul role="group" aria-label={item.label}>
                            {item.options.map((option) => (
                              <SelectOptionItem
                                key={option.value}
                                option={option}
                                isSelected={option.value === value}
                                isHighlighted={
                                  filteredFlatOptions[highlightedIndex]
                                    ?.value === option.value
                                }
                                onSelect={() => handleValueChange(option.value)}
                                onMouseEnter={() => {
                                  const idx = filteredFlatOptions.findIndex(
                                    (o) => o.value === option.value
                                  );
                                  setHighlightedIndex(idx);
                                }}
                              />
                            ))}
                          </ul>
                        </li>
                      );
                    }

                    // Render single option
                    return (
                      <SelectOptionItem
                        key={item.value}
                        option={item}
                        isSelected={item.value === value}
                        isHighlighted={
                          filteredFlatOptions[highlightedIndex]?.value ===
                          item.value
                        }
                        onSelect={() => handleValueChange(item.value)}
                        onMouseEnter={() => {
                          const idx = filteredFlatOptions.findIndex(
                            (o) => o.value === item.value
                          );
                          setHighlightedIndex(idx);
                        }}
                      />
                    );
                  })
                )}
              </ul>
            </div>,
            document.body
          )}
      </div>

      {/* Error Message */}
      {error && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p id={helperId} className="text-muted-foreground text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
}

Select.displayName = 'Select';

// ============================================================================
// Select Option Item (Internal)
// ============================================================================

interface SelectOptionItemProps {
  option: SelectOption;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

function SelectOptionItem({
  option,
  isSelected,
  isHighlighted,
  onSelect,
  onMouseEnter,
}: SelectOptionItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!option.disabled) {
        onSelect();
      }
    }
  };

  return (
    <li
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
      data-highlighted={isHighlighted}
      data-disabled={option.disabled}
      tabIndex={isHighlighted ? 0 : -1}
      onClick={option.disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={option.disabled ? undefined : onMouseEnter}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm',
        'transition-colors outline-none',
        isHighlighted && 'bg-muted',
        isSelected &&
          'bg-primary-50 text-primary-900 dark:bg-primary-950 dark:text-primary-100',
        option.disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span className="flex-1 truncate">{option.label}</span>
      {isSelected && (
        <CheckIcon className="text-primary-500 h-4 w-4 shrink-0" />
      )}
    </li>
  );
}

// ============================================================================
// Icons
// ============================================================================

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export { Select, selectTriggerVariants };
