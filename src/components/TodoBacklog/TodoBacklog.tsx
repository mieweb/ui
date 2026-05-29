import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CheckSquare,
  Circle,
  Download,
  Edit2,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { AlertDialog } from '../AlertDialog';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select, type SelectOption } from '../Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A todo row aggregated across cases. */
export interface BacklogTodo {
  id: string;
  caseNumber: string;
  employeeName: string;
  caseType: string;
  caseStatus: string;
  activity: string;
  /** Manager assigned directly on the todo. */
  caseManager?: string;
  /** Manager assigned on the parent case. */
  caseCaseManager?: string;
  dateScheduled?: string;
  dateClosed?: string;
  completed: boolean;
}

/** Identifies a selected todo. */
export interface TodoSelectionItem {
  caseNumber: string;
  todoId: string;
}

/** Bulk-edit changes applied to selected todos. */
export interface BulkTodoChanges {
  caseManager?: string;
  completed?: boolean;
}

interface SearchCriteria {
  searchTerm: string;
  filterStatus: string;
  filterCaseManager: string;
  filterCaseType: string;
}

/** A bookmarked search configuration. */
export interface SavedBacklogSearch extends SearchCriteria {
  id: string;
  name: string;
}

export interface TodoBacklogProps {
  /** All todos to display. */
  todos: BacklogTodo[];
  /** Return to the previous view. */
  onBack: () => void;
  /** Open a case by number. */
  onViewCase: (caseNumber: string) => void;
  /** Status filter options (value is matched case-insensitively against status codes). */
  statusOptions?: SelectOption[];
  /** Case-manager filter options. */
  caseManagerOptions?: SelectOption[];
  /** Case-type filter options. */
  caseTypeOptions?: SelectOption[];
  /** Apply bulk edits to the selected todos. */
  onBulkEdit?: (items: TodoSelectionItem[], changes: BulkTodoChanges) => void;
  /** Delete the selected todos. */
  onBulkDelete?: (items: TodoSelectionItem[]) => void;
  /** Print the current view. */
  onPrint?: () => void;
  /** Export the current view to CSV. */
  onExportCsv?: () => void;
  /** Initial bookmarked searches. */
  initialSavedSearches?: SavedBacklogSearch[];
  /** Fired when the bookmarked searches change (for persistence). */
  onSavedSearchesChange?: (searches: SavedBacklogSearch[]) => void;
  className?: string;
}

const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'comp', label: 'Completed' },
  { value: 'over', label: 'Overdue' },
];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function matchesStatus(todo: BacklogTodo, filterStatus: string): boolean {
  if (filterStatus === 'all') return true;
  const isOverdue =
    !todo.completed &&
    !!todo.dateScheduled &&
    new Date(todo.dateScheduled) < startOfToday();
  if (filterStatus === 'comp') return todo.completed;
  if (filterStatus === 'over') return !todo.completed && isOverdue;
  // active / open / pend / reopen all hide completed todos
  return !todo.completed;
}

/**
 * Cross-case todo backlog: a filterable, selectable table of all todos with
 * summary stats, bulk edit/delete, bookmarked searches, and print/CSV export.
 * Presentational — todo data and side effects (bulk mutations, print, export,
 * search persistence) are supplied via props.
 */
export function TodoBacklog({
  todos,
  onBack,
  onViewCase,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  caseManagerOptions,
  caseTypeOptions,
  onBulkEdit,
  onBulkDelete,
  onPrint,
  onExportCsv,
  initialSavedSearches = [],
  onSavedSearchesChange,
  className,
}: TodoBacklogProps) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCaseManager, setFilterCaseManager] = useState('all');
  const [filterCaseType, setFilterCaseType] = useState('all');
  const [filterDraftLetters, setFilterDraftLetters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkCaseManager, setBulkCaseManager] = useState('');
  const [bulkCompleted, setBulkCompleted] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedSearches, setSavedSearches] =
    useState<SavedBacklogSearch[]>(initialSavedSearches);
  const [activeSavedSearch, setActiveSavedSearch] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  const managerOptions = useMemo<SelectOption[]>(() => {
    if (caseManagerOptions) {
      return [{ value: 'all', label: 'All' }, ...caseManagerOptions];
    }
    const managers = new Set<string>();
    todos.forEach((t) => {
      if (t.caseManager) managers.add(t.caseManager);
      if (t.caseCaseManager) managers.add(t.caseCaseManager);
    });
    return [
      { value: 'all', label: 'All' },
      ...Array.from(managers)
        .sort()
        .map((m) => ({ value: m, label: m })),
    ];
  }, [caseManagerOptions, todos]);

  const typeOptions = useMemo<SelectOption[]>(() => {
    if (caseTypeOptions) {
      return [{ value: 'all', label: 'All' }, ...caseTypeOptions];
    }
    const types = new Set<string>();
    todos.forEach((t) => {
      if (t.caseType) types.add(t.caseType);
    });
    return [
      { value: 'all', label: 'All' },
      ...Array.from(types)
        .sort()
        .map((type) => ({
          value: type,
          label: type.includes(' — ') ? type.split(' — ')[1] : type,
        })),
    ];
  }, [caseTypeOptions, todos]);

  const matchesCriteria = (todo: BacklogTodo, criteria: SearchCriteria) => {
    if (!matchesStatus(todo, criteria.filterStatus)) return false;
    if (
      criteria.filterCaseManager !== 'all' &&
      todo.caseManager !== criteria.filterCaseManager &&
      todo.caseCaseManager !== criteria.filterCaseManager
    ) {
      return false;
    }
    if (
      criteria.filterCaseType !== 'all' &&
      todo.caseType !== criteria.filterCaseType
    ) {
      return false;
    }
    if (criteria.searchTerm) {
      const s = criteria.searchTerm.toLowerCase();
      if (
        !todo.activity.toLowerCase().includes(s) &&
        !todo.employeeName.toLowerCase().includes(s) &&
        !todo.caseNumber.toLowerCase().includes(s)
      ) {
        return false;
      }
    }
    return true;
  };

  const filteredTodos = todos.filter((todo) => {
    if (
      filterDraftLetters &&
      !todo.activity.toLowerCase().includes('complete draft letter')
    ) {
      return false;
    }
    return matchesCriteria(todo, {
      searchTerm,
      filterStatus,
      filterCaseManager,
      filterCaseType,
    });
  });

  const stats = useMemo(() => {
    const today = startOfToday();
    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
      overdue: todos.filter(
        (t) =>
          !t.completed &&
          !!t.dateScheduled &&
          new Date(t.dateScheduled) < today
      ).length,
      draftLetters: todos.filter(
        (t) =>
          !t.completed &&
          t.activity.toLowerCase().includes('complete draft letter')
      ).length,
    };
  }, [todos]);

  const getTodoKey = (caseNumber: string, todoId: string) =>
    `${caseNumber}\u0000${todoId}`;
  const parseTodoKey = (key: string): TodoSelectionItem => {
    const [caseNumber, todoId] = key.split('\u0000');
    return { caseNumber, todoId };
  };

  const toggleTodoSelection = (caseNumber: string, todoId: string) => {
    const key = getTodoKey(caseNumber, todoId);
    setSelectedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected =
    filteredTodos.length > 0 &&
    filteredTodos.every((t) => selectedTodos.has(getTodoKey(t.caseNumber, t.id)));
  const someSelected = selectedTodos.size > 0;
  const selectionItems = () =>
    Array.from(selectedTodos).map(parseTodoKey);

  const resetBulk = () => {
    setSelectedTodos(new Set());
    setBulkEditMode(false);
    setBulkCaseManager('');
    setBulkCompleted('');
  };

  const applyBulkEdit = () => {
    const changes: BulkTodoChanges = {};
    if (bulkCaseManager && bulkCaseManager !== 'no-change') {
      changes.caseManager = bulkCaseManager;
    }
    if (bulkCompleted === 'completed') changes.completed = true;
    else if (bulkCompleted === 'active') changes.completed = false;
    onBulkEdit?.(selectionItems(), changes);
    resetBulk();
  };

  const handleBulkDelete = () => {
    onBulkDelete?.(selectionItems());
    setConfirmDelete(false);
    resetBulk();
  };

  const hasActiveFilters =
    !!searchTerm ||
    filterStatus !== 'all' ||
    filterCaseManager !== 'all' ||
    filterCaseType !== 'all';

  const getSearchResultCount = (search: SavedBacklogSearch) =>
    todos.filter((t) => matchesCriteria(t, search)).length;

  const updateSavedSearches = (next: SavedBacklogSearch[]) => {
    setSavedSearches(next);
    onSavedSearchesChange?.(next);
  };

  const saveCurrentSearch = () => {
    if (!newSearchName.trim()) return;
    const next: SavedBacklogSearch = {
      id: `search-${savedSearches.length + 1}-${Date.now()}`,
      name: newSearchName.trim(),
      searchTerm,
      filterStatus,
      filterCaseManager,
      filterCaseType,
    };
    updateSavedSearches([...savedSearches, next]);
    setNewSearchName('');
    setShowSaveDialog(false);
  };

  const applySavedSearch = (search: SavedBacklogSearch) => {
    if (activeSavedSearch === search.id) {
      setSearchTerm('');
      setFilterStatus('all');
      setFilterCaseManager('all');
      setFilterCaseType('all');
      setActiveSavedSearch(null);
    } else {
      setSearchTerm(search.searchTerm);
      setFilterStatus(search.filterStatus);
      setFilterCaseManager(search.filterCaseManager);
      setFilterCaseType(search.filterCaseType);
      setFilterDraftLetters(false);
      setActiveSavedSearch(search.id);
    }
  };

  const deleteSavedSearch = (searchId: string) => {
    updateSavedSearches(savedSearches.filter((s) => s.id !== searchId));
    if (activeSavedSearch === searchId) setActiveSavedSearch(null);
  };

  const getStatusBadge = (todo: BacklogTodo) => {
    if (todo.completed) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          Completed
        </Badge>
      );
    }
    if (todo.dateScheduled && new Date(todo.dateScheduled) < startOfToday()) {
      return (
        <Badge variant="danger" className="gap-1">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          Overdue
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Circle className="h-3 w-3" aria-hidden="true" />
        Active
      </Badge>
    );
  };

  return (
    <div className={cn('container mx-auto space-y-6 px-4 py-6', className)} data-slot="todo-backlog">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">To Do</h1>
            <p className="text-muted-foreground">All To-Dos across all cases</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
              Print
            </Button>
          )}
          {onExportCsv && (
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} valueClassName="text-primary" />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          valueClassName="text-destructive"
        />
        <Card
          role="button"
          tabIndex={0}
          aria-pressed={filterDraftLetters}
          className={cn(
            'min-w-[120px] cursor-pointer transition-colors',
            filterDraftLetters && 'border-warning-500 bg-warning-50'
          )}
          onClick={() => setFilterDraftLetters((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterDraftLetters((v) => !v);
            }
          }}
        >
          <CardHeader className="py-3">
            <CardDescription className="flex items-center justify-between">
              Draft Letters
              {filterDraftLetters && (
                <span className="text-xs text-warning-600">(filtered)</span>
              )}
            </CardDescription>
            <CardTitle className="text-2xl text-warning-600">
              {stats.draftLetters}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {savedSearches.length > 0 && (
        <Card className="bg-muted/40">
          <CardContent className="px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">Bookmarked Searches:</span>
              </div>
              {savedSearches.map((search) => (
                <div key={search.id} className="flex items-center">
                  <Button
                    variant={activeSavedSearch === search.id ? 'primary' : 'outline'}
                    size="sm"
                    className="h-8"
                    onClick={() => applySavedSearch(search)}
                  >
                    <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    {search.name}
                    <Badge variant="secondary" className="ml-2">
                      {getSearchResultCount(search)}
                    </Badge>
                    {activeSavedSearch === search.id && (
                      <span className="ml-1.5 text-xs">(active)</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${search.name}`}
                    className="ml-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSavedSearch(search.id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {someSelected && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="font-medium">{selectedTodos.size} selected</span>
              </div>
              <div className="h-6 w-px bg-border" />
              {!bulkEditMode ? (
                <>
                  {onBulkEdit && (
                    <Button size="sm" variant="outline" onClick={() => setBulkEditMode(true)}>
                      <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Edit Selected
                    </Button>
                  )}
                  {onBulkDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Delete Selected
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTodos(new Set())}>
                    <X className="mr-2 h-4 w-4" aria-hidden="true" />
                    Clear Selection
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Case Manager:</Label>
                    <Select
                      aria-label="Bulk case manager"
                      value={bulkCaseManager}
                      onValueChange={setBulkCaseManager}
                      options={managerOptions.filter((o) => o.value !== 'all')}
                      placeholder="No change"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Status:</Label>
                    <Select
                      aria-label="Bulk status"
                      value={bulkCompleted}
                      onValueChange={setBulkCompleted}
                      options={[
                        { value: 'completed', label: 'Mark Completed' },
                        { value: 'active', label: 'Mark Active' },
                      ]}
                      placeholder="No change"
                    />
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      onClick={applyBulkEdit}
                      disabled={!bulkCaseManager && !bulkCompleted}
                    >
                      Apply Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setBulkEditMode(false);
                        setBulkCaseManager('');
                        setBulkCompleted('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="backlog-search" className="text-sm">
                Search
              </Label>
              <Input
                id="backlog-search"
                placeholder="Search activity, employee, case..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select
                aria-label="Status"
                value={filterStatus}
                onValueChange={setFilterStatus}
                options={statusOptions}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Case Manager</Label>
              <Select
                aria-label="Case Manager"
                value={filterCaseManager}
                onValueChange={setFilterCaseManager}
                options={managerOptions}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Case Type</Label>
              <Select
                aria-label="Case Type"
                value={filterCaseType}
                onValueChange={setFilterCaseType}
                options={typeOptions}
              />
            </div>
            {onSavedSearchesChange && hasActiveFilters && !showSaveDialog && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setShowSaveDialog(true)}
              >
                <Bookmark className="mr-2 h-4 w-4" aria-hidden="true" />
                Bookmark Search
              </Button>
            )}
            {showSaveDialog && (
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Search name"
                  placeholder="Enter search name..."
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  className="h-9 w-[180px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveCurrentSearch();
                    if (e.key === 'Escape') {
                      setShowSaveDialog(false);
                      setNewSearchName('');
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-9"
                  onClick={saveCurrentSearch}
                  disabled={!newSearchName.trim()}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewSearchName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredTodos.length} of {todos.length} To-Dos
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      aria-label="Select all"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTodos(
                            new Set(
                              filteredTodos.map((t) =>
                                getTodoKey(t.caseNumber, t.id)
                              )
                            )
                          );
                        } else {
                          setSelectedTodos(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Case Manager</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No To-Dos found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTodos.map((todo, idx) => {
                    const key = getTodoKey(todo.caseNumber, todo.id);
                    const isSelected = selectedTodos.has(key);
                    return (
                      <TableRow
                        key={`${todo.caseNumber}-${todo.id}-${idx}`}
                        className={isSelected ? 'bg-muted/50' : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            aria-label={`Select todo: ${todo.activity}`}
                            onChange={() =>
                              toggleTodoSelection(todo.caseNumber, todo.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate font-medium">
                          {todo.activity || '-'}
                        </TableCell>
                        <TableCell>{todo.employeeName}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="h-auto p-0 font-mono text-sm"
                            onClick={() => onViewCase(todo.caseNumber)}
                          >
                            {todo.caseNumber}
                          </Button>
                        </TableCell>
                        <TableCell>{todo.caseType}</TableCell>
                        <TableCell>
                          {todo.caseManager || todo.caseCaseManager || '-'}
                        </TableCell>
                        <TableCell>{todo.dateScheduled || '-'}</TableCell>
                        <TableCell>{getStatusBadge(todo)}</TableCell>
                        <TableCell>{todo.dateClosed || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="Delete selected To-Dos?"
        description={`Are you sure you want to delete ${selectedTodos.size} todo(s)? This cannot be undone.`}
        actionLabel="Delete"
        onAction={handleBulkDelete}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <Card className="min-w-[120px]">
      <CardHeader className="py-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn('text-2xl', valueClassName)}>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
