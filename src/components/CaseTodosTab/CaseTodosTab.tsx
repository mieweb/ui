import * as React from 'react';
import {
  Plus,
  Trash2,
  Wand2,
  FileText,
  Edit2,
  CheckSquare,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Checkbox } from '../Checkbox';
import { Textarea } from '../Textarea';
import { Select } from '../Select';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A to-do activity on a case. */
export interface CaseTodo {
  id: string;
  dateScheduled?: string;
  activity: string;
  caseManager: string;
  completed: boolean;
  dateClosed?: string;
  completedBy?: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export interface CaseTodosTabProps extends React.HTMLAttributes<HTMLDivElement> {
  todos: CaseTodo[];
  /** Case-manager options for bulk reassignment. */
  caseManagerOptions: { value: string; label: string }[];
  /** Default anchor date (YYYY-MM-DD) for the generate-from-template dialog. */
  defaultGenerateAnchorDate?: string;
  /** Replaces the full todo list (add, inline edit, cascade, bulk, reopen). */
  onTodosChange: (todos: CaseTodo[]) => void;
  /**
   * When provided, completing a todo opens a note dialog and calls this with
   * the entered note; the container owns marking the todo complete + side
   * effects (case note, confetti). When omitted, completion is applied locally.
   */
  onCompleteTodo?: (todo: CaseTodo, note: string) => void;
  /**
   * When provided, a "Generate from Template" button is shown; called with the
   * chosen anchor date (YYYY-MM-DD) so the container can produce todos.
   */
  onGenerateFromTemplate?: (anchorDate: string) => void;
}

const today = () => new Date().toISOString().split('T')[0];

/**
 * Shifts the date of the target todo to {@link newDate} and cascades the same
 * day-delta to every subsequent todo with a scheduled date. Pure.
 */
export function cascadeTodoDate(
  todos: CaseTodo[],
  id: string,
  newDate: string
): CaseTodo[] {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return todos;
  const oldDate = todos[index].dateScheduled;
  if (!oldDate || !newDate) {
    return todos.map((t) =>
      t.id === id ? { ...t, dateScheduled: newDate } : t
    );
  }
  const delta = Math.round(
    (new Date(newDate).getTime() - new Date(oldDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (delta === 0) {
    return todos.map((t) =>
      t.id === id ? { ...t, dateScheduled: newDate } : t
    );
  }
  return todos.map((todo, i) => {
    if (i < index) return todo;
    if (i === index) return { ...todo, dateScheduled: newDate };
    if (todo.dateScheduled) {
      const d = new Date(todo.dateScheduled);
      d.setDate(d.getDate() + delta);
      return { ...todo, dateScheduled: d.toISOString().split('T')[0] };
    }
    return todo;
  });
}

/**
 * Presentational to-do manager: add, inline-edit (with cascading date shifts),
 * complete-with-note, bulk edit/delete, filter, and template generation. All
 * persistence is delegated to the container via the callback props.
 */
export const CaseTodosTab = React.forwardRef<HTMLDivElement, CaseTodosTabProps>(
  (
    {
      todos,
      caseManagerOptions,
      defaultGenerateAnchorDate,
      onTodosChange,
      onCompleteTodo,
      onGenerateFromTemplate,
      className,
      ...props
    },
    ref
  ) => {
    const [filterActive, setFilterActive] =
      React.useState<StatusFilter>('active');
    const [selected, setSelected] = React.useState<Set<string>>(new Set());
    const [bulkEditMode, setBulkEditMode] = React.useState(false);
    const [bulkCaseManager, setBulkCaseManager] = React.useState('');
    const [bulkCompleted, setBulkCompleted] = React.useState('');

    const [showGenerate, setShowGenerate] = React.useState(false);
    const [anchorDate, setAnchorDate] = React.useState(
      defaultGenerateAnchorDate ?? ''
    );

    const [pendingComplete, setPendingComplete] =
      React.useState<CaseTodo | null>(null);
    const [completionNote, setCompletionNote] = React.useState('');

    const filtered = todos.filter((t) => {
      if (filterActive === 'active' && t.completed) return false;
      if (filterActive === 'inactive' && !t.completed) return false;
      return true;
    });

    const allSelected =
      filtered.length > 0 && filtered.every((t) => selected.has(t.id));
    const someSelected = selected.size > 0;

    const updateTodo = (id: string, updates: Partial<CaseTodo>) =>
      onTodosChange(todos.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    const addTodo = () =>
      onTodosChange([
        ...todos,
        {
          id: Date.now().toString(),
          activity: '',
          caseManager: '',
          completed: false,
        },
      ]);

    const deleteTodo = (id: string) =>
      onTodosChange(todos.filter((t) => t.id !== id));

    const toggleSelection = (id: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });

    const handleCheckComplete = (todo: CaseTodo, checked: boolean) => {
      if (checked && !todo.completed) {
        if (onCompleteTodo) {
          setPendingComplete(todo);
          setCompletionNote('');
        } else {
          updateTodo(todo.id, { completed: true, dateClosed: today() });
        }
      } else {
        updateTodo(todo.id, {
          completed: false,
          dateClosed: undefined,
          completedBy: undefined,
        });
      }
    };

    const confirmCompletion = () => {
      if (pendingComplete && onCompleteTodo) {
        onCompleteTodo(pendingComplete, completionNote.trim());
      }
      setPendingComplete(null);
      setCompletionNote('');
    };

    const applyBulkEdit = () => {
      const next = todos.map((todo) => {
        if (!selected.has(todo.id)) return todo;
        const updates: Partial<CaseTodo> = {};
        if (bulkCaseManager && bulkCaseManager !== 'no-change') {
          updates.caseManager = bulkCaseManager;
        }
        if (bulkCompleted === 'completed') {
          updates.completed = true;
          updates.dateClosed = today();
        } else if (bulkCompleted === 'active') {
          updates.completed = false;
          updates.dateClosed = undefined;
          updates.completedBy = undefined;
        }
        return { ...todo, ...updates };
      });
      onTodosChange(next);
      setSelected(new Set());
      setBulkEditMode(false);
      setBulkCaseManager('');
      setBulkCompleted('');
    };

    const bulkDelete = () => {
      onTodosChange(todos.filter((t) => !selected.has(t.id)));
      setSelected(new Set());
      setBulkEditMode(false);
    };

    return (
      <div
        ref={ref}
        data-slot="case-todos-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">To-Do Activities</h3>
          <div className="flex gap-2">
            {onGenerateFromTemplate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGenerate(true)}
              >
                <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Generate from Template
              </Button>
            )}
            <Button size="sm" onClick={addTodo}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add To-Do
            </Button>
          </div>
        </div>

        {/* Bulk edit toolbar */}
        {someSelected && (
          <div className="border-primary-500 bg-muted rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare
                  className="text-primary-600 h-5 w-5"
                  aria-hidden="true"
                />
                <span className="font-medium">{selected.size} selected</span>
              </div>
              <div className="bg-border h-6 w-px" />
              {!bulkEditMode ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkEditMode(true)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={bulkDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Delete Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(new Set())}
                  >
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
                      className="w-[180px]"
                      placeholder="No change"
                      value={bulkCaseManager}
                      onValueChange={setBulkCaseManager}
                      options={[
                        { value: 'no-change', label: 'No change' },
                        ...caseManagerOptions,
                      ]}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Status:</Label>
                    <Select
                      aria-label="Bulk status"
                      className="w-[150px]"
                      placeholder="No change"
                      value={bulkCompleted}
                      onValueChange={setBulkCompleted}
                      options={[
                        { value: 'no-change', label: 'No change' },
                        { value: 'completed', label: 'Mark Completed' },
                        { value: 'active', label: 'Mark Active' },
                      ]}
                    />
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      onClick={applyBulkEdit}
                      disabled={
                        (!bulkCaseManager || bulkCaseManager === 'no-change') &&
                        (!bulkCompleted || bulkCompleted === 'no-change')
                      }
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
          </div>
        )}

        {/* Filters */}
        <div className="bg-muted flex items-center gap-4 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status:</Label>
            <Select
              aria-label="Filter by status"
              className="w-[140px]"
              value={filterActive}
              onValueChange={(v) => setFilterActive(v as StatusFilter)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Completed' },
              ]}
            />
          </div>
          <div className="text-foreground ml-auto text-sm">
            Showing {filtered.length} of {todos.length} todos
          </div>
        </div>

        {/* Table */}
        <div className="border-border rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    aria-label="Select all"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? new Set(filtered.map((t) => t.id))
                          : new Set()
                      )
                    }
                  />
                </TableHead>
                <TableHead className="w-[150px]">Date Scheduled</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-[150px]">Case Manager</TableHead>
                <TableHead className="w-[100px]">Completed</TableHead>
                <TableHead className="w-[150px]">Date Closed</TableHead>
                <TableHead className="w-[150px]">Completed By</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No to-do items found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((todo) => {
                  const isSelected = selected.has(todo.id);
                  return (
                    <TableRow
                      key={todo.id}
                      className={isSelected ? 'bg-muted' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Select todo: ${todo.activity || 'Untitled'}`}
                          checked={isSelected}
                          onChange={() => toggleSelection(todo.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          aria-label="Date scheduled"
                          value={todo.dateScheduled || ''}
                          onChange={(e) =>
                            onTodosChange(
                              cascadeTodoDate(todos, todo.id, e.target.value)
                            )
                          }
                          title="Changing this date will shift all subsequent todo dates by the same amount"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label="Activity"
                          placeholder="Enter activity..."
                          value={todo.activity}
                          onChange={(e) =>
                            updateTodo(todo.id, { activity: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label="Case manager"
                          placeholder="Case Manager"
                          value={todo.caseManager}
                          onChange={(e) =>
                            updateTodo(todo.id, { caseManager: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Checkbox
                            aria-label={`Mark complete: ${todo.activity || 'Untitled'}`}
                            checked={todo.completed}
                            onChange={(e) =>
                              handleCheckComplete(todo, e.target.checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          aria-label="Date closed"
                          value={todo.dateClosed || ''}
                          disabled={!todo.completed}
                          onChange={(e) =>
                            updateTodo(todo.id, { dateClosed: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {todo.completedBy || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete todo"
                          className="h-8 w-8 p-0"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Generate dialog */}
        <Modal open={showGenerate} onOpenChange={setShowGenerate} size="lg">
          <ModalHeader>
            <ModalTitle>Generate Todos from Template</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Set anchor dates to calculate due dates for todo items.
              Auto-populated from Case Dates if available.
            </p>
            <div className="space-y-2">
              <Label htmlFor="generate-anchor-date">Date of Disability</Label>
              <Input
                id="generate-anchor-date"
                type="date"
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onGenerateFromTemplate?.(anchorDate);
                setShowGenerate(false);
              }}
            >
              Generate Todos
            </Button>
          </ModalFooter>
        </Modal>

        {/* Completion note dialog */}
        <Modal
          open={pendingComplete !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPendingComplete(null);
              setCompletionNote('');
            }
          }}
          size="lg"
        >
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" aria-hidden="true" />
              Complete To-Do
            </ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-muted-foreground text-sm">
              A case note will be added when completing this to-do. You can add
              additional details below.
            </p>
            <div className="bg-muted rounded-md p-3">
              <div className="text-muted-foreground mb-1 text-sm">
                To-Do Activity
              </div>
              <div className="font-medium">
                {pendingComplete?.activity || 'Untitled'}
              </div>
              {pendingComplete?.dateScheduled && (
                <div className="text-muted-foreground mt-1 text-sm">
                  Scheduled: {pendingComplete.dateScheduled}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="completion-note">Case Note (optional)</Label>
              <Textarea
                id="completion-note"
                placeholder="Enter any notes about completing this to-do..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                rows={4}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingComplete(null);
                setCompletionNote('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmCompletion}>Complete</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
);

CaseTodosTab.displayName = 'CaseTodosTab';
