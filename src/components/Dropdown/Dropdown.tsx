import * as React from 'react';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { inputVariants } from '../Input';

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'bottom';

export interface DropdownProps {
  /** The trigger element (usually a button) */
  trigger: React.ReactElement<{
    onClick?: () => void;
    disabled?: boolean;
    'aria-haspopup'?: string;
    'aria-expanded'?: boolean;
    'aria-controls'?: string;
  }>;
  /** Dropdown content */
  children: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Placement of the dropdown */
  placement?: DropdownPlacement;
  /** Additional class name for the dropdown menu */
  className?: string;
  /** Width of the dropdown menu */
  width?: 'auto' | 'trigger' | number;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Whether to render a search field at the top of the dropdown */
  searchable?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Accessible label for the search input */
  searchAriaLabel?: string;
  /** Content to render when no items match the search query */
  searchEmptyState?: React.ReactNode;
  /** Whether dropdown items support multi-select checkboxes */
  multiSelect?: boolean;
  /** Selected item values for controlled multi-select dropdowns */
  selectedValues?: string[];
  /** Initial selected item values for uncontrolled multi-select dropdowns */
  defaultSelectedValues?: string[];
  /** Callback fired when selected values change in multi-select mode */
  onSelectedValuesChange?: (values: string[]) => void;
  /** Whether to render a select-all control for multi-select dropdowns */
  showSelectAll?: boolean;
  /** Label for the select-all control */
  selectAllLabel?: React.ReactNode;
}

const placementStyles: Record<DropdownPlacement, string> = {
  'bottom-start': 'top-full left-0 mt-2',
  'bottom-end': 'top-full right-0 mt-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
};

interface DropdownContextValue {
  multiSelect: boolean;
  selectedValues: string[];
  toggleSelectedValue: (value: string) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function getNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join(' ');
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }

  return '';
}

function isDropdownElement<P>(
  node: React.ReactNode,
  component: React.JSXElementConstructor<P>
): node is React.ReactElement<P> {
  return React.isValidElement(node) && node.type === component;
}

function hasVisibleDropdownContent(node: React.ReactNode): boolean {
  if (node == null || typeof node === 'boolean') {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some(hasVisibleDropdownContent);
  }

  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) {
    if (typeof node === 'string') {
      return node.trim().length > 0;
    }

    return true;
  }

  if (node.type === React.Fragment) {
    return React.Children.toArray(node.props.children).some(
      hasVisibleDropdownContent
    );
  }

  if (
    node.type === DropdownSeparator ||
    node.type === DropdownLabel ||
    node.type === DropdownHeader
  ) {
    return false;
  }

  if (node.type === DropdownContent) {
    return React.Children.toArray(node.props.children).some(
      hasVisibleDropdownContent
    );
  }

  return true;
}

function normalizeDropdownSiblings(
  children: React.ReactNode[]
): React.ReactNode[] {
  const hasContentBefore = (index: number) => {
    for (let current = index - 1; current >= 0; current -= 1) {
      const child = children[current];

      if (isDropdownElement(child, DropdownSeparator)) {
        return false;
      }

      if (hasVisibleDropdownContent(child)) {
        return true;
      }
    }

    return false;
  };

  const hasContentAfter = (index: number) => {
    for (let current = index + 1; current < children.length; current += 1) {
      const child = children[current];

      if (isDropdownElement(child, DropdownSeparator)) {
        return false;
      }

      if (hasVisibleDropdownContent(child)) {
        return true;
      }
    }

    return false;
  };

  return children.filter((child, index) => {
    if (isDropdownElement(child, DropdownSeparator)) {
      return hasContentBefore(index) && hasContentAfter(index);
    }

    if (isDropdownElement(child, DropdownLabel)) {
      return hasContentAfter(index);
    }

    return true;
  });
}

function filterDropdownChildren(
  children: React.ReactNode,
  query: string
): React.ReactNode[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return React.Children.toArray(children);
  }

  const filteredChildren = React.Children.toArray(children)
    .map((child) => {
      if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
        if (typeof child === 'string' || typeof child === 'number') {
          return String(child).toLowerCase().includes(normalizedQuery)
            ? child
            : null;
        }

        return null;
      }

      if (child.type === React.Fragment) {
        const fragmentChildren = filterDropdownChildren(
          child.props.children,
          normalizedQuery
        );

        return fragmentChildren.length > 0
          ? React.cloneElement(child, undefined, fragmentChildren)
          : null;
      }

      if (isDropdownElement(child, DropdownHeader)) {
        return child;
      }

      if (isDropdownElement(child, DropdownItem)) {
        const searchText = [
          getNodeText(child.props.children),
          child.props.searchText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchText.includes(normalizedQuery) ? child : null;
      }

      if (isDropdownElement(child, DropdownContent)) {
        const contentChildren = filterDropdownChildren(
          child.props.children,
          normalizedQuery
        );

        return hasVisibleDropdownContent(contentChildren)
          ? React.cloneElement(child, undefined, contentChildren)
          : null;
      }

      if (isDropdownElement(child, DropdownSeparator)) {
        return child;
      }

      if (isDropdownElement(child, DropdownLabel)) {
        return child;
      }

      const nestedChildren = child.props.children;

      if (nestedChildren === undefined) {
        return child;
      }

      const filteredNestedChildren = filterDropdownChildren(
        nestedChildren,
        normalizedQuery
      );

      return filteredNestedChildren.length > 0
        ? React.cloneElement(child, undefined, filteredNestedChildren)
        : null;
    })
    .filter((child) => child !== null);

  return normalizeDropdownSiblings(filteredChildren);
}

function getSelectableValues(children: React.ReactNode): string[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (
      !React.isValidElement<{ children?: React.ReactNode; value?: unknown }>(
        child
      )
    ) {
      return [];
    }

    if (child.type === React.Fragment || child.type === DropdownContent) {
      return getSelectableValues(child.props.children);
    }

    if (isDropdownElement(child, DropdownItem)) {
      return typeof child.props.value === 'string' ? [child.props.value] : [];
    }

    return child.props.children !== undefined
      ? getSelectableValues(child.props.children)
      : [];
  });
}

/**
 * An accessible dropdown menu component.
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>Options</Button>}
 * >
 *   <DropdownItem onClick={() => console.log('Edit')}>Edit</DropdownItem>
 *   <DropdownItem onClick={() => console.log('Delete')} variant="danger">Delete</DropdownItem>
 * </Dropdown>
 * ```
 */
function Dropdown({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom-start',
  className,
  width = 'auto',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchAriaLabel = 'Search dropdown items',
  searchEmptyState = 'No results found',
  multiSelect = false,
  selectedValues: controlledSelectedValues,
  defaultSelectedValues = [],
  onSelectedValuesChange,
  showSelectAll = false,
  selectAllLabel = 'Select all',
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [uncontrolledSelectedValues, setUncontrolledSelectedValues] =
    React.useState(defaultSelectedValues);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const menuId = React.useId();

  const isControlled = controlledOpen !== undefined;
  const isSelectedValuesControlled = controlledSelectedValues !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const selectedValues = isSelectedValuesControlled
    ? controlledSelectedValues
    : uncontrolledSelectedValues;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const handleToggle = React.useCallback(() => {
    if (!disabled) {
      setOpen(!isOpen);
    }
  }, [disabled, isOpen, setOpen]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const setSelectedValues = React.useCallback(
    (values: string[]) => {
      if (!isSelectedValuesControlled) {
        setUncontrolledSelectedValues(values);
      }
      onSelectedValuesChange?.(values);
    },
    [isSelectedValuesControlled, onSelectedValuesChange]
  );

  const toggleSelectedValue = React.useCallback(
    (value: string) => {
      if (!multiSelect) {
        return;
      }

      setSelectedValues(
        selectedValues.includes(value)
          ? selectedValues.filter((selectedValue) => selectedValue !== value)
          : [...selectedValues, value]
      );
    },
    [multiSelect, selectedValues, setSelectedValues]
  );

  const dropdownContext = React.useMemo<DropdownContextValue>(
    () => ({
      multiSelect,
      selectedValues,
      toggleSelectedValue,
    }),
    [multiSelect, selectedValues, toggleSelectedValue]
  );

  useClickOutside(containerRef, handleClose, isOpen);
  useEscapeKey(handleClose, isOpen);

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    if (searchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isOpen, searchable]);

  // Clone trigger to add event handlers
  const triggerElement = React.cloneElement(trigger, {
    onClick: handleToggle,
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
    disabled: disabled || trigger.props.disabled,
  });

  const widthStyle =
    typeof width === 'number'
      ? { width: `${width}px` }
      : width === 'trigger'
        ? { minWidth: '100%' }
        : {};

  const filteredChildren = React.useMemo(
    () => filterDropdownChildren(children, searchQuery),
    [children, searchQuery]
  );
  const visibleSelectableValues = React.useMemo(
    () => getSelectableValues(searchable ? filteredChildren : children),
    [children, filteredChildren, searchable]
  );
  const hasSearchResults = React.useMemo(
    () => hasVisibleDropdownContent(filteredChildren),
    [filteredChildren]
  );
  const allVisibleSelected =
    visibleSelectableValues.length > 0 &&
    visibleSelectableValues.every((value) => selectedValues.includes(value));
  const someVisibleSelected = visibleSelectableValues.some((value) =>
    selectedValues.includes(value)
  );

  const handleSelectAll = React.useCallback(() => {
    if (!multiSelect || visibleSelectableValues.length === 0) {
      return;
    }

    const visibleValueSet = new Set(visibleSelectableValues);

    setSelectedValues(
      allVisibleSelected
        ? selectedValues.filter((value) => !visibleValueSet.has(value))
        : Array.from(new Set([...selectedValues, ...visibleSelectableValues]))
    );
  }, [
    allVisibleSelected,
    multiSelect,
    selectedValues,
    setSelectedValues,
    visibleSelectableValues,
  ]);

  return (
    <DropdownContext.Provider value={dropdownContext}>
      <div ref={containerRef} className="relative inline-flex">
        {triggerElement}
        {isOpen && (
          <div
            style={widthStyle}
            data-slot="dropdown-menu"
            className={cn(
              'absolute z-50 min-w-[12rem]',
              'rounded-xl border border-neutral-200 bg-white shadow-lg',
              'dark:border-neutral-700 dark:bg-neutral-800',
              'animate-in fade-in zoom-in-95 duration-100',
              placementStyles[placement],
              className
            )}
          >
            {searchable && (
              <div
                className="border-b border-neutral-200 p-2 dark:border-neutral-700"
                data-slot="dropdown-search"
              >
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchAriaLabel}
                  aria-controls={menuId}
                  aria-autocomplete="list"
                  data-slot="dropdown-search-input"
                  className={cn(
                    inputVariants({ size: 'sm' }),
                    'text-sm',
                    'dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100'
                  )}
                />
              </div>
            )}
            <div id={menuId} role="menu">
              {multiSelect &&
                showSelectAll &&
                visibleSelectableValues.length > 0 && (
                  <>
                    <div className="p-2" data-slot="dropdown-select-all">
                      <DropdownItem
                        checked={allVisibleSelected}
                        indeterminate={
                          !allVisibleSelected && someVisibleSelected
                        }
                        onClick={handleSelectAll}
                      >
                        {selectAllLabel}
                      </DropdownItem>
                    </div>
                    <DropdownSeparator />
                  </>
                )}
              {searchable ? (
                hasSearchResults ? (
                  filteredChildren
                ) : (
                  <div
                    className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400"
                    data-slot="dropdown-empty"
                  >
                    {searchEmptyState}
                  </div>
                )
              ) : (
                children
              )}
            </div>
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

Dropdown.displayName = 'Dropdown';

// ============================================================================
// Dropdown Header Component
// ============================================================================

export interface DropdownHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** Avatar element or image */
  avatar?: React.ReactNode;
  /** Primary text (e.g., user name) */
  title: React.ReactNode;
  /** Secondary text (e.g., email) */
  subtitle?: React.ReactNode;
}

/**
 * A header section for dropdown menus, typically used for user info.
 *
 * @example
 * ```tsx
 * <DropdownHeader
 *   avatar={<Avatar name="John Doe" />}
 *   title="John Doe"
 *   subtitle="john@example.com"
 * />
 * ```
 */
const DropdownHeader = React.forwardRef<HTMLDivElement, DropdownHeaderProps>(
  ({ className, avatar, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="dropdown-header"
        className={cn(
          'border-b border-neutral-200 p-4 dark:border-neutral-700',
          className
        )}
        {...props}
      >
        <div
          className="flex items-center gap-3"
          data-slot="dropdown-header-row"
        >
          {avatar}
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-neutral-900 dark:text-white"
              data-slot="dropdown-header-title"
            >
              {title}
            </p>
            {subtitle && (
              <p
                className="truncate text-xs text-neutral-500 dark:text-neutral-400"
                data-slot="dropdown-header-subtitle"
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }
);

DropdownHeader.displayName = 'DropdownHeader';

// ============================================================================
// Dropdown Content Component
// ============================================================================

export type DropdownContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A container for dropdown menu items with proper padding.
 */
const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="dropdown-content"
        className={cn('p-2', className)}
        {...props}
      />
    );
  }
);

DropdownContent.displayName = 'DropdownContent';

// ============================================================================
// Dropdown Item Component
// ============================================================================

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Danger variant for destructive actions */
  variant?: 'default' | 'danger';
  /** Optional text used when filtering searchable dropdown items */
  searchText?: string;
  /** Checked state for multi-select items */
  checked?: boolean;
  /** Indeterminate state for multi-select items */
  indeterminate?: boolean;
  /** Callback fired when a multi-select item changes */
  onCheckedChange?: (checked: boolean) => void;
}

function DropdownItemCheckbox({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      data-slot="dropdown-checkbox"
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors duration-150',
        checked || indeterminate
          ? 'border-primary-500 bg-primary-500 text-white'
          : 'border-input bg-background text-transparent'
      )}
    >
      {indeterminate ? (
        <svg
          className="h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 8h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          className="h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * An item within a Dropdown menu.
 */
const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  (
    {
      className,
      icon,
      variant = 'default',
      children,
      searchText,
      checked,
      indeterminate = false,
      onCheckedChange,
      onClick,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const dropdownContext = React.useContext(DropdownContext);
    const itemValue = typeof value === 'string' ? value : undefined;
    const contextSelectedValues = dropdownContext?.selectedValues ?? [];
    const isMultiSelectItem =
      (dropdownContext?.multiSelect === true && itemValue !== undefined) ||
      checked !== undefined ||
      indeterminate;
    const isChecked =
      checked ??
      (isMultiSelectItem
        ? itemValue !== undefined && contextSelectedValues.includes(itemValue)
        : false);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (
          dropdownContext &&
          isMultiSelectItem &&
          itemValue !== undefined &&
          !disabled
        ) {
          dropdownContext.toggleSelectedValue(itemValue);
          onCheckedChange?.(!isChecked);
        }

        onClick?.(event);
      },
      [
        disabled,
        dropdownContext,
        isChecked,
        isMultiSelectItem,
        itemValue,
        onCheckedChange,
        onClick,
      ]
    );

    return (
      <button
        ref={ref}
        type="button"
        role={isMultiSelectItem ? 'menuitemcheckbox' : 'menuitem'}
        aria-checked={
          isMultiSelectItem ? (indeterminate ? 'mixed' : isChecked) : undefined
        }
        disabled={disabled}
        data-slot="dropdown-item"
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
          'transition-colors duration-150',
          'focus:outline-none',
          variant === 'default' && [
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-100 dark:hover:bg-neutral-700',
            'focus:bg-neutral-100 dark:focus:bg-neutral-700',
          ],
          variant === 'danger' && [
            'text-red-600 dark:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-900/20',
            'focus:bg-red-50 dark:focus:bg-red-900/20',
          ],
          className
        )}
        data-search-text={searchText}
        onClick={handleClick}
        value={value}
        {...props}
      >
        {isMultiSelectItem && (
          <DropdownItemCheckbox
            checked={isChecked}
            indeterminate={indeterminate}
          />
        )}
        {icon && (
          <span className="h-4 w-4 shrink-0" data-slot="dropdown-item-icon">
            {icon}
          </span>
        )}
        <span className="font-medium" data-slot="dropdown-item-label">
          {children}
        </span>
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

// ============================================================================
// Dropdown Separator Component
// ============================================================================

/**
 * A separator between dropdown items.
 */
function DropdownSeparator({ className }: { className?: string }) {
  return (
    <hr
      data-slot="dropdown-separator"
      className={cn(
        'border-t border-neutral-200 dark:border-neutral-700',
        className
      )}
    />
  );
}

DropdownSeparator.displayName = 'DropdownSeparator';

// ============================================================================
// Dropdown Label Component
// ============================================================================

/**
 * A label/header for a group of dropdown items.
 */
function DropdownLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="dropdown-label"
      className={cn(
        'px-3 py-1.5 text-xs font-semibold tracking-wider uppercase',
        'text-neutral-500 dark:text-neutral-400',
        className
      )}
    >
      {children}
    </div>
  );
}

DropdownLabel.displayName = 'DropdownLabel';

export {
  Dropdown,
  DropdownHeader,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
};
