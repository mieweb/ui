'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../Input';

// ============================================================================
// Types
// ============================================================================

/**
 * Selectable service item
 */
export interface SelectableService {
  /** Unique identifier */
  id: string;
  /** Service name */
  name: string;
  /** Service code (e.g., CPT code) */
  code?: string;
  /** Service description */
  description?: string;
  /** Price or cost */
  price?: number;
  /** Whether the service is disabled */
  disabled?: boolean;
}

/**
 * Service group containing services
 */
export interface ServiceGroup {
  /** Unique identifier */
  id: string;
  /** Group name */
  name: string;
  /** Services in this group */
  services: SelectableService[];
  /** Sub-groups (optional nesting) */
  subGroups?: ServiceGroup[];
}

// ============================================================================
// Service Picker Props
// ============================================================================

export interface ServicePickerProps {
  /** Array of service groups */
  groups: ServiceGroup[];
  /** Currently selected service IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (selectedIds: string[]) => void;
  /** Whether to show search input */
  showSearch?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Whether to allow multiple selection */
  multiple?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Heading text */
  heading?: string;
  /** Whether to hide heading */
  hideHeading?: boolean;
  /** Whether the picker fills full width */
  fullWidth?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Filter services by search query
 */
function filterServices(groups: ServiceGroup[], query: string): ServiceGroup[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return groups;

  const filtered: ServiceGroup[] = [];

  for (const group of groups) {
    // Filter services in this group
    const filteredServices = group.services.filter(
      (service) =>
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.code?.toLowerCase().includes(normalizedQuery) ||
        service.description?.toLowerCase().includes(normalizedQuery)
    );

    // Recursively filter sub-groups
    const filteredSubGroups = group.subGroups
      ? filterServices(group.subGroups, query)
      : undefined;

    // Include group if it has matching services or sub-groups with matches
    const hasMatches =
      filteredServices.length > 0 ||
      (filteredSubGroups && filteredSubGroups.length > 0);

    if (hasMatches) {
      filtered.push({
        ...group,
        services: filteredServices,
        subGroups: filteredSubGroups?.filter(
          (sg) =>
            sg.services.length > 0 || (sg.subGroups && sg.subGroups.length > 0)
        ),
      });
    }
  }

  return filtered;
}

/**
 * Flatten all services from groups for search results
 */
function flattenServices(groups: ServiceGroup[]): SelectableService[] {
  const services: SelectableService[] = [];

  const traverse = (group: ServiceGroup) => {
    services.push(...group.services);
    group.subGroups?.forEach(traverse);
  };

  groups.forEach(traverse);
  return services;
}

// ============================================================================
// Service Picker Component
// ============================================================================

/**
 * A service picker component with search, grouping, and multi-select support.
 *
 * @example
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<string[]>([]);
 *
 * <ServicePicker
 *   groups={serviceGroups}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   showSearch
 *   multiple
 * />
 * ```
 */
export function ServicePicker({
  groups,
  selectedIds,
  onSelectionChange,
  showSearch = true,
  searchPlaceholder = 'Search by service name, code, category, etc.',
  multiple = true,
  loading = false,
  error,
  emptyMessage = 'No Available Services',
  heading = 'Available Services',
  hideHeading = false,
  fullWidth = false,
  className,
}: ServicePickerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set()
  );

  // Filter groups based on search
  const filteredGroups = React.useMemo(
    () => filterServices(groups, searchQuery),
    [groups, searchQuery]
  );

  // Get flat list for search results
  const searchResults = React.useMemo(
    () => (searchQuery ? flattenServices(filteredGroups) : []),
    [filteredGroups, searchQuery]
  );

  const isSearching = searchQuery.length > 0;

  const handleServiceToggle = (serviceId: string) => {
    if (multiple) {
      if (selectedIds.includes(serviceId)) {
        onSelectionChange(selectedIds.filter((id) => id !== serviceId));
      } else {
        onSelectionChange([...selectedIds, serviceId]);
      }
    } else {
      onSelectionChange([serviceId]);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const hasSelectedInGroup = (group: ServiceGroup): boolean => {
    const hasDirectSelection = group.services.some((s) =>
      selectedIds.includes(s.id)
    );
    const hasSubSelection = group.subGroups?.some(hasSelectedInGroup) ?? false;
    return hasDirectSelection || hasSubSelection;
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground border-border shadow-card flex flex-col rounded-xl border',
        !fullWidth && 'lg:max-w-md',
        className
      )}
    >
      <div className="p-3">
        {!hideHeading && (
          <h2 className="text-foreground mb-3 text-xl font-bold">{heading}</h2>
        )}

        {showSearch && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="text-muted-foreground h-5 w-5" />
            </div>
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10"
              data-cy="input-search-services"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-4">
            <strong>{error}</strong>
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <SpinnerIcon className="h-5 w-5 animate-spin" />
            <span>Loading available services...</span>
          </div>
        ) : isSearching ? (
          // Search results - flat list
          <ul className="space-y-1">
            {searchResults.length > 0 ? (
              searchResults.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  selected={selectedIds.includes(service.id)}
                  onToggle={() => handleServiceToggle(service.id)}
                  multiple={multiple}
                />
              ))
            ) : (
              <li>
                <div className="bg-muted text-muted-foreground rounded-lg p-4">
                  <strong>{emptyMessage}</strong>
                </div>
              </li>
            )}
          </ul>
        ) : (
          // Grouped list - accordion style
          <ul className="space-y-1">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <ServiceGroupItem
                  key={group.id}
                  group={group}
                  selectedIds={selectedIds}
                  expandedGroups={expandedGroups}
                  onToggleGroup={toggleGroup}
                  onToggleService={handleServiceToggle}
                  hasSelectedInGroup={hasSelectedInGroup}
                  multiple={multiple}
                />
              ))
            ) : (
              <li>
                <div className="bg-muted text-muted-foreground rounded-lg p-4">
                  <strong>{emptyMessage}</strong>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

ServicePicker.displayName = 'ServicePicker';

// ============================================================================
// Service Group Item
// ============================================================================

interface ServiceGroupItemProps {
  group: ServiceGroup;
  selectedIds: string[];
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onToggleService: (serviceId: string) => void;
  hasSelectedInGroup: (group: ServiceGroup) => boolean;
  multiple: boolean;
  depth?: number;
}

function ServiceGroupItem({
  group,
  selectedIds,
  expandedGroups,
  onToggleGroup,
  onToggleService,
  hasSelectedInGroup,
  multiple,
  depth = 0,
}: ServiceGroupItemProps) {
  const isExpanded = expandedGroups.has(group.id);
  const hasSelection = hasSelectedInGroup(group);

  return (
    <li className="service-group">
      <button
        type="button"
        onClick={() => onToggleGroup(group.id)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2',
          'text-muted-foreground text-left text-sm font-medium',
          'hover:bg-muted',
          'transition-colors',
          depth > 0 && 'ml-4'
        )}
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <span>{group.name}</span>
          {hasSelection && (
            <span
              className="bg-primary h-2 w-2 rounded-full"
              aria-label="Has selected items"
            />
          )}
        </span>
        <ChevronIcon
          className={cn(
            'text-muted-foreground h-5 w-5 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {isExpanded && (
        <ul className="mt-1 space-y-1 pl-4">
          {/* Direct services */}
          {group.services.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
              selected={selectedIds.includes(service.id)}
              onToggle={() => onToggleService(service.id)}
              multiple={multiple}
            />
          ))}

          {/* Sub-groups */}
          {group.subGroups?.map((subGroup) => (
            <ServiceGroupItem
              key={subGroup.id}
              group={subGroup}
              selectedIds={selectedIds}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
              onToggleService={onToggleService}
              hasSelectedInGroup={hasSelectedInGroup}
              multiple={multiple}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ============================================================================
// Service Item
// ============================================================================

interface ServiceItemProps {
  service: SelectableService;
  selected: boolean;
  onToggle: () => void;
  multiple: boolean;
}

function ServiceItem({
  service,
  selected,
  onToggle,
  multiple,
}: ServiceItemProps) {
  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
          'hover:bg-muted',
          'transition-colors',
          service.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {multiple ? (
          <span className="relative inline-flex shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              disabled={service.disabled}
              className={cn(
                'peer h-4 w-4 shrink-0 appearance-none rounded',
                'border-input bg-background border-2',
                'cursor-pointer transition-all duration-150',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'checked:bg-primary-500 checked:border-primary-500'
              )}
            />
            <CheckIcon className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </span>
        ) : (
          <span className="relative inline-flex shrink-0 items-center justify-center">
            <input
              type="radio"
              checked={selected}
              onChange={onToggle}
              disabled={service.disabled}
              className={cn(
                'peer h-4 w-4 shrink-0 appearance-none rounded-full',
                'border-input bg-background border-2',
                'cursor-pointer transition-all duration-150',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'checked:border-primary-500'
              )}
            />
            <span className="bg-primary-500 pointer-events-none absolute h-2 w-2 scale-0 rounded-full transition-transform peer-checked:scale-100" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              {service.name}
            </span>
            {service.code && (
              <span className="text-muted-foreground text-xs">
                ({service.code})
              </span>
            )}
          </div>
          {service.description && (
            <p className="text-muted-foreground truncate text-xs">
              {service.description}
            </p>
          )}
        </div>
        {service.price !== undefined && (
          <span className="text-foreground text-sm font-medium">
            ${service.price.toFixed(2)}
          </span>
        )}
      </label>
    </li>
  );
}

// ============================================================================
// Icons
// ============================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
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
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
