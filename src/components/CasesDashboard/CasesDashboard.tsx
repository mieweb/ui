import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Filter,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge, type BadgeProps } from '../Badge';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { Input } from '../Input';
import { Label } from '../Label';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import { Select, type SelectOption } from '../Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A scheduled todo associated with a case. */
export interface DashboardTodo {
  completed: boolean;
  dateScheduled?: string;
  activity: string;
}

/** A case row rendered by the dashboard. */
export interface DashboardCase {
  caseNumber: string;
  employeeName: string;
  employeeNumber: string;
  status: string;
  caseType: string;
  caseManager: string;
  employeeLocation: string;
  dateOfDisability?: string;
  created: string;
  todos?: DashboardTodo[];
}

interface FilterCriteria {
  search: string;
  status: string;
  caseType: string;
  caseManager: string;
  location: string;
  dateCreatedFrom: string;
  dateCreatedTo: string;
}

interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
}

type SortField =
  | 'caseNumber'
  | 'employeeName'
  | 'employeeNumber'
  | 'status'
  | 'caseType'
  | 'caseManager'
  | 'employeeLocation'
  | 'dateOfDisability'
  | 'nextTodo';
type SortDirection = 'asc' | 'desc' | null;

export interface CasesDashboardProps {
  /** Cases to display. */
  cases: DashboardCase[];
  /** Open a case for viewing. */
  onViewCase: (caseNumber: string) => void;
  /** Active case-manager options for the advanced filter (value should match `caseManager`, case-insensitive). */
  caseManagerOptions?: SelectOption[];
  /** Active location options for the advanced filter. */
  locationOptions?: SelectOption[];
  className?: string;
}

const EMPTY_CRITERIA: FilterCriteria = {
  search: '',
  status: 'all',
  caseType: 'all',
  caseManager: 'all',
  location: 'all',
  dateCreatedFrom: '',
  dateCreatedTo: '',
};

const BUILTIN_FILTER_IDS = ['my-cases', 'all-cases', 'unassigned'];

const DEFAULT_SAVED_FILTERS: SavedFilter[] = [
  { id: 'my-cases', name: 'My Cases', criteria: { ...EMPTY_CRITERIA } },
  { id: 'all-cases', name: 'All Cases', criteria: { ...EMPTY_CRITERIA } },
  {
    id: 'unassigned',
    name: 'Unassigned Cases',
    criteria: { ...EMPTY_CRITERIA, status: 'Open', caseManager: 'Unassigned' },
  },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE_VARIANT: Record<string, BadgeProps['variant']> = {
  Open: 'default',
  Pending: 'secondary',
  Closed: 'outline',
};

/**
 * Cases dashboard: a searchable, sortable, filterable table of cases with saved
 * filters and summary stats. Presentational — receives the case list and
 * option lists and emits `onViewCase` when a row is opened.
 */
export function CasesDashboard({
  cases,
  onViewCase,
  caseManagerOptions,
  locationOptions,
  className,
}: CasesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(
    'my-cases'
  );
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({
    ...EMPTY_CRITERIA,
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(
    DEFAULT_SAVED_FILTERS
  );
  const [showSaveFilterDialog, setShowSaveFilterDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const filteredCases = cases.filter((caseItem) => {
    const filters = showMoreFilters
      ? advancedFilters
      : { search: searchTerm, status: statusFilter };

    const search = showMoreFilters ? advancedFilters.search : searchTerm;
    const matchesSearch =
      !search ||
      caseItem.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      caseItem.employeeNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filters.status === 'all' ||
      caseItem.status.toLowerCase() === filters.status.toLowerCase();

    const matchesCaseType =
      !showMoreFilters ||
      advancedFilters.caseType === 'all' ||
      caseItem.caseType === advancedFilters.caseType;

    const matchesCaseManager =
      !showMoreFilters ||
      advancedFilters.caseManager === 'all' ||
      caseItem.caseManager.toLowerCase() ===
        advancedFilters.caseManager.toLowerCase();

    const matchesLocation =
      !showMoreFilters ||
      advancedFilters.location === 'all' ||
      caseItem.employeeLocation === advancedFilters.location ||
      caseItem.employeeLocation.startsWith(advancedFilters.location + ',');

    const matchesDateFrom =
      !showMoreFilters ||
      !advancedFilters.dateCreatedFrom ||
      new Date(caseItem.created) >= new Date(advancedFilters.dateCreatedFrom);

    const matchesDateTo =
      !showMoreFilters ||
      !advancedFilters.dateCreatedTo ||
      new Date(caseItem.created) <= new Date(advancedFilters.dateCreatedTo);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCaseType &&
      matchesCaseManager &&
      matchesLocation &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const getNextTodoTime = (caseItem: DashboardCase): number | '' => {
    if (!caseItem.todos || caseItem.todos.length === 0) return '';
    const upcoming = caseItem.todos
      .filter((todo) => !todo.completed && todo.dateScheduled)
      .sort(
        (x, y) =>
          new Date(x.dateScheduled as string).getTime() -
          new Date(y.dateScheduled as string).getTime()
      );
    return upcoming.length > 0
      ? new Date(upcoming[0].dateScheduled as string).getTime()
      : '';
  };

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: string | number = '';
    let bValue: string | number = '';

    if (sortField === 'nextTodo') {
      aValue = getNextTodoTime(a);
      bValue = getNextTodoTime(b);
    } else if (sortField === 'dateOfDisability') {
      aValue = a.dateOfDisability ? new Date(a.dateOfDisability).getTime() : 0;
      bValue = b.dateOfDisability ? new Date(b.dateOfDisability).getTime() : 0;
    } else {
      aValue = a[sortField] ?? '';
      bValue = b[sortField] ?? '';
    }

    if (!aValue) return sortDirection === 'asc' ? 1 : -1;
    if (!bValue) return sortDirection === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown
          className="text-muted-foreground ml-2 h-4 w-4"
          aria-hidden="true"
        />
      );
    }
    if (sortDirection === 'asc') {
      return (
        <ArrowUp className="text-primary ml-2 h-4 w-4" aria-hidden="true" />
      );
    }
    return (
      <ArrowDown className="text-primary ml-2 h-4 w-4" aria-hidden="true" />
    );
  };

  const getNextTodoLabel = (caseItem: DashboardCase) => {
    if (!caseItem.todos || caseItem.todos.length === 0) return '—';
    const upcoming = caseItem.todos
      .filter((todo) => !todo.completed && todo.dateScheduled)
      .sort(
        (a, b) =>
          new Date(a.dateScheduled as string).getTime() -
          new Date(b.dateScheduled as string).getTime()
      );
    if (upcoming.length === 0) return '—';
    const next = upcoming[0];
    const due = new Date((next.dateScheduled as string) + 'T00:00:00');
    const formatted = `${String(due.getMonth() + 1).padStart(2, '0')}/${String(
      due.getDate()
    ).padStart(2, '0')}/${due.getFullYear()}`;
    return `${next.activity} (${formatted})`;
  };

  const caseTypeOptions = useMemo<SelectOption[]>(() => {
    const unique = Array.from(
      new Set(cases.map((c) => c.caseType).filter(Boolean))
    );
    return [
      { value: 'all', label: 'All Case Types' },
      ...unique.map((type) => ({ value: type, label: type })),
    ];
  }, [cases]);

  const managerOptions = useMemo<SelectOption[]>(() => {
    if (caseManagerOptions) {
      return [{ value: 'all', label: 'All Managers' }, ...caseManagerOptions];
    }
    const unique = Array.from(
      new Set(cases.map((c) => c.caseManager).filter(Boolean))
    );
    return [
      { value: 'all', label: 'All Managers' },
      ...unique.map((name) => ({ value: name.toLowerCase(), label: name })),
    ];
  }, [caseManagerOptions, cases]);

  const locOptions = useMemo<SelectOption[]>(() => {
    if (locationOptions) {
      return [{ value: 'all', label: 'All Locations' }, ...locationOptions];
    }
    const unique = Array.from(
      new Set(cases.map((c) => c.employeeLocation).filter(Boolean))
    );
    return [
      { value: 'all', label: 'All Locations' },
      ...unique.map((loc) => ({ value: loc, label: loc })),
    ];
  }, [locationOptions, cases]);

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    setSavedFilters((prev) => [
      ...prev,
      {
        id: `filter-${prev.length + 1}`,
        name: filterName,
        criteria: { ...advancedFilters },
      },
    ]);
    setFilterName('');
    setShowSaveFilterDialog(false);
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setAdvancedFilters(filter.criteria);
    setActiveFilterId(filter.id);
    if (!showMoreFilters) {
      setSearchTerm(filter.criteria.search);
      setStatusFilter(filter.criteria.status);
    }
    setShowMoreFilters(true);
  };

  const handleDeleteFilter = (filterId: string) => {
    if (BUILTIN_FILTER_IDS.includes(filterId)) return;
    setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleClearFilters = () => {
    setAdvancedFilters({ ...EMPTY_CRITERIA });
    setSearchTerm('');
    setStatusFilter('all');
    setActiveFilterId('all-cases');
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={STATUS_BADGE_VARIANT[status] || 'default'}>{status}</Badge>
  );

  const sortableColumns: { field: SortField; label: string }[] = [
    { field: 'caseNumber', label: 'Case Number' },
    { field: 'employeeName', label: 'Employee Name' },
    { field: 'employeeNumber', label: 'Employee Number' },
    { field: 'status', label: 'Status' },
    { field: 'caseType', label: 'Case Type' },
    { field: 'caseManager', label: 'Case Manager' },
    { field: 'employeeLocation', label: 'Location' },
    { field: 'dateOfDisability', label: 'Date of Disability' },
    { field: 'nextTodo', label: 'Next Todo' },
  ];

  return (
    <div
      className={cn('container mx-auto max-w-[1400px] p-6', className)}
      data-slot="cases-dashboard"
    >
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Cases Dashboard</h1>
        <p className="text-muted-foreground">
          View and manage all employee cases
        </p>
      </div>

      <div className="border-border bg-card mb-6 rounded-lg border p-4 shadow-sm md:p-6">
        {!showMoreFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dashboard-search">Search Cases</Label>
              <div className="relative">
                <Search
                  className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  id="dashboard-search"
                  placeholder="Search by name, case number, or employee number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select
                aria-label="Filter by Status"
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={STATUS_OPTIONS}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Dropdown
                placement="bottom-end"
                width={224}
                trigger={
                  <Button
                    variant="outline"
                    className="justify-start gap-2 sm:justify-center"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {savedFilters.find((f) => f.id === activeFilterId)
                        ?.name || 'Saved Filters'}
                    </span>
                    <ChevronDown
                      className="ml-auto h-4 w-4 sm:ml-0"
                      aria-hidden="true"
                    />
                  </Button>
                }
              >
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-sm px-2 py-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadFilter(filter)}
                      className={cn(
                        'flex-1 text-left text-sm',
                        activeFilterId === filter.id &&
                          'text-primary font-semibold'
                      )}
                    >
                      {filter.name}
                    </button>
                    {!BUILTIN_FILTER_IDS.includes(filter.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${filter.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFilter(filter.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2
                          className="text-destructive h-3 w-3"
                          aria-hidden="true"
                        />
                      </Button>
                    )}
                  </div>
                ))}
              </Dropdown>

              <Button
                variant="outline"
                className="justify-start gap-2 sm:justify-center"
                onClick={() => setShowMoreFilters(true)}
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                <span>More Filters</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="adv-search">Search Cases</Label>
                <div className="relative">
                  <Search
                    className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    id="adv-search"
                    placeholder="Search by name, case number, or employee number..."
                    value={advancedFilters.search}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        search: e.target.value,
                      })
                    }
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-status">Status</Label>
                <Select
                  aria-label="Status"
                  value={advancedFilters.status}
                  onValueChange={(value) =>
                    setAdvancedFilters({ ...advancedFilters, status: value })
                  }
                  options={STATUS_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-case-type">Case Type</Label>
                <Select
                  aria-label="Case Type"
                  value={advancedFilters.caseType}
                  onValueChange={(value) =>
                    setAdvancedFilters({ ...advancedFilters, caseType: value })
                  }
                  options={caseTypeOptions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-manager">Case Manager</Label>
                <Select
                  aria-label="Case Manager"
                  value={advancedFilters.caseManager}
                  onValueChange={(value) =>
                    setAdvancedFilters({
                      ...advancedFilters,
                      caseManager: value,
                    })
                  }
                  options={managerOptions}
                />
              </div>

              {advancedFilters.search && (
                <div className="space-y-2">
                  <Label htmlFor="adv-location">Location</Label>
                  <Select
                    aria-label="Location"
                    value={advancedFilters.location}
                    onValueChange={(value) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        location: value,
                      })
                    }
                    options={locOptions}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col items-stretch justify-between gap-2 pt-2 sm:flex-row sm:items-center">
              <Button onClick={() => setShowMoreFilters(false)}>
                Show Less
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
                <Button
                  onClick={() => setShowSaveFilterDialog(true)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Filter
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-border bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {sortableColumns.map((col) => (
                <TableHead key={col.field}>
                  <button
                    type="button"
                    onClick={() => handleSort(col.field)}
                    className="hover:text-foreground flex items-center transition-colors"
                  >
                    {col.label}
                    {renderSortIcon(col.field)}
                  </button>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-muted-foreground py-8 text-center"
                >
                  No cases found
                </TableCell>
              </TableRow>
            ) : (
              sortedCases.map((caseItem) => (
                <TableRow
                  key={caseItem.caseNumber}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onViewCase(caseItem.caseNumber)}
                >
                  <TableCell className="font-medium">
                    {caseItem.caseNumber}
                  </TableCell>
                  <TableCell>{caseItem.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {caseItem.employeeNumber}
                  </TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>{caseItem.caseType}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {caseItem.caseManager}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {caseItem.employeeLocation}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {caseItem.dateOfDisability || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getNextTodoLabel(caseItem)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCase(caseItem.caseNumber);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardStat label="Total Cases" value={cases.length} />
        <DashboardStat
          label="Open Cases"
          value={cases.filter((c) => c.status === 'Open').length}
        />
        <DashboardStat
          label="Unassigned Cases"
          value={cases.filter((c) => c.caseManager === 'Unassigned').length}
        />
      </div>

      <Modal
        open={showSaveFilterDialog}
        onOpenChange={setShowSaveFilterDialog}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Save Filter</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-muted-foreground mb-4 text-sm">
            Give your filter configuration a name so you can quickly apply it
            later.
          </p>
          <div className="space-y-2">
            <Label htmlFor="filter-name">Filter Name</Label>
            <Input
              id="filter-name"
              placeholder="e.g., My Open Cases, Urgent Cases..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowSaveFilterDialog(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
            Save Filter
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-card flex-1 rounded-lg border p-6 shadow-sm">
      <p className="text-muted-foreground mb-1 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
