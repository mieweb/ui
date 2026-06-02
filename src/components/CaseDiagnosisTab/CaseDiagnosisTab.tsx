import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit,
  GripVertical,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import { Textarea } from '../Textarea';
import { AlertDialog } from '../AlertDialog';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A single ICD-10 lookup result. */
export interface CaseIcdCode {
  code: string;
  description: string;
}

/** A single ICD-11 lookup result, optionally pre-mapped to ICD-10. */
export interface CaseIcd11Code {
  code: string;
  description: string;
  icd10Code?: string;
  icd10Description?: string;
}

/** A diagnosis attached to a case. */
export interface CaseDiagnosis {
  id: string;
  icd10Code: string;
  icd10Description?: string;
  icd11Code?: string;
  icd11Description?: string;
  diagnosisDate: string;
  notes?: string;
  isActive: boolean;
  priority: number;
}

/** Fields supplied when adding a diagnosis. The container assigns id/priority. */
export interface CaseDiagnosisDraft {
  icd10Code: string;
  icd10Description?: string;
  icd11Code?: string;
  icd11Description?: string;
  diagnosisDate: string;
  notes?: string;
  isActive: boolean;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export interface CaseDiagnosisTabProps {
  /** Diagnoses to display. */
  diagnoses: CaseDiagnosis[];
  /** Async ICD-10 lookup, invoked with the typed query (debounced internally). */
  searchIcd10: (query: string) => Promise<CaseIcdCode[]>;
  /** Optional async ICD-11 lookup. When omitted the ICD-11 quick-add row is hidden. */
  searchIcd11?: (query: string) => Promise<CaseIcd11Code[]>;
  /** Called to add a new diagnosis. */
  onAddDiagnosis: (draft: CaseDiagnosisDraft) => void;
  /**
   * Called with the full replacement list for edits, deletes, reordering, and
   * priority changes (all of which can touch multiple rows).
   */
  onDiagnosesChange: (next: CaseDiagnosis[]) => void;
  /** Default date for the add forms (YYYY-MM-DD). Defaults to today. */
  defaultDiagnosisDate?: string;
  className?: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Renumber priorities to be sequential starting at 1, preserving order. */
function renumber(list: CaseDiagnosis[]): CaseDiagnosis[] {
  return list.map((d, i) => ({ ...d, priority: i + 1 }));
}

interface IcdSearchInputProps<T extends CaseIcdCode> {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (text: string) => void;
  onSelect: (result: T) => void;
  search: (query: string) => Promise<T[]>;
  placeholder?: string;
}

/** Debounced ICD code search field with a results dropdown. */
function IcdSearchInput<T extends CaseIcdCode>({
  id,
  label,
  value,
  onChange,
  onSelect,
  search,
  placeholder,
}: IcdSearchInputProps<T>) {
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await search(value);
        if (!active) return;
        setResults(data);
        setShowResults(true);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, search]);

  return (
    <div className="relative flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-sm">
        {label}
      </Label>
      <div className="relative">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder={placeholder}
          className="pl-10 font-mono"
        />
        {isSearching && (
          <Loader2
            className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin"
            aria-hidden="true"
          />
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="border-border bg-card absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-lg">
          {results.map((result) => (
            <button
              key={result.code}
              type="button"
              className="border-border hover:bg-muted flex w-full items-start gap-2 border-b px-3 py-2 text-left last:border-b-0"
              onMouseDown={() => {
                onSelect(result);
                setShowResults(false);
              }}
            >
              <span className="text-primary-600 shrink-0 font-mono font-semibold">
                {result.code}
              </span>
              <span className="text-muted-foreground truncate text-sm">
                {result.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Presentational diagnosis manager for a case. Supports ICD-10 and (optionally)
 * ICD-11 lookups, quick-add rows, an add/edit modal, prioritized ordering with
 * drag-and-drop plus up/down controls, status filtering, and deletion.
 *
 * All state-mutating behavior is delegated to callbacks: {@link CaseDiagnosisTabProps.onAddDiagnosis}
 * for new rows and {@link CaseDiagnosisTabProps.onDiagnosesChange} for edits,
 * deletes, reordering, and priority changes.
 */
export const CaseDiagnosisTab = forwardRef<
  HTMLDivElement,
  CaseDiagnosisTabProps
>(function CaseDiagnosisTab(
  {
    diagnoses,
    searchIcd10,
    searchIcd11,
    onAddDiagnosis,
    onDiagnosesChange,
    defaultDiagnosisDate,
    className,
  },
  ref
) {
  const baseId = useId();
  const initialDate = defaultDiagnosisDate ?? today();

  const [filterActive, setFilterActive] = useState<StatusFilter>('active');

  // Quick add (ICD-10) form state.
  const [quickCode, setQuickCode] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickDate, setQuickDate] = useState(initialDate);

  // Quick add (ICD-11) form state.
  const [icd11Code, setIcd11Code] = useState('');
  const [icd11Description, setIcd11Description] = useState('');
  const [icd11Date, setIcd11Date] = useState(initialDate);
  const [icd11Selected, setIcd11Selected] = useState<CaseIcd11Code | null>(
    null
  );

  // Add/edit modal state.
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaseDiagnosis | null>(null);
  const [modalCode, setModalCode] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDate, setModalDate] = useState(initialDate);
  const [modalNotes, setModalNotes] = useState('');
  const [modalActive, setModalActive] = useState(true);

  // Delete confirmation.
  const [pendingDelete, setPendingDelete] = useState<CaseDiagnosis | null>(
    null
  );

  // Drag-and-drop reordering.
  const draggedIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const sorted = [...diagnoses]
    .filter((d) => {
      if (filterActive === 'active') return d.isActive;
      if (filterActive === 'inactive') return !d.isActive;
      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  const handleQuickAdd = () => {
    if (!quickCode || !quickDate) return;
    onAddDiagnosis({
      icd10Code: quickCode,
      icd10Description: quickDescription,
      diagnosisDate: quickDate,
      notes: '',
      isActive: true,
    });
    setQuickCode('');
    setQuickDescription('');
    setQuickDate(initialDate);
  };

  const handleIcd11Add = () => {
    if (!icd11Code || !icd11Date) return;
    const mappedCode = icd11Selected?.icd10Code ?? '';
    const mappedDescription = icd11Selected?.icd10Description ?? '';
    onAddDiagnosis({
      icd10Code: mappedCode,
      icd10Description: mappedDescription,
      icd11Code,
      icd11Description,
      diagnosisDate: icd11Date,
      notes: mappedCode
        ? `ICD-11 (International) - Auto-translated to ICD-10: ${mappedCode}`
        : 'ICD-11 (International)',
      isActive: true,
    });
    setIcd11Code('');
    setIcd11Description('');
    setIcd11Date(initialDate);
    setIcd11Selected(null);
  };

  const openEdit = (d: CaseDiagnosis) => {
    setEditing(d);
    setModalCode(d.icd10Code);
    setModalDescription(d.icd10Description ?? '');
    setModalDate(d.diagnosisDate);
    setModalNotes(d.notes ?? '');
    setModalActive(d.isActive);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    if (!modalCode || !modalDate) return;
    if (editing) {
      onDiagnosesChange(
        diagnoses.map((d) =>
          d.id === editing.id
            ? {
                ...d,
                icd10Code: modalCode,
                icd10Description: modalDescription,
                diagnosisDate: modalDate,
                notes: modalNotes,
                isActive: modalActive,
              }
            : d
        )
      );
    } else {
      onAddDiagnosis({
        icd10Code: modalCode,
        icd10Description: modalDescription,
        diagnosisDate: modalDate,
        notes: modalNotes,
        isActive: modalActive,
      });
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    onDiagnosesChange(
      renumber(diagnoses.filter((d) => d.id !== pendingDelete.id))
    );
    setPendingDelete(null);
  };

  const movePriority = (id: string, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    onDiagnosesChange(renumber(reordered));
  };

  const handleDrop = (dropIndex: number) => {
    const from = draggedIndex.current;
    draggedIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === dropIndex) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, item);
    onDiagnosesChange(renumber(reordered));
  };

  return (
    <div
      ref={ref}
      data-slot="case-diagnosis-tab"
      className={cn('space-y-6', className)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Diagnosis Information</h3>
      </div>

      {/* Filters */}
      <div className="bg-muted flex flex-wrap items-center gap-4 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${baseId}-status`} className="text-sm">
            Status:
          </Label>
          <Select
            aria-label="Filter by status"
            className="w-[140px]"
            value={filterActive}
            onValueChange={(value) => setFilterActive(value as StatusFilter)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ]}
          />
        </div>
        <div className="text-muted-foreground ml-auto text-sm">
          Showing {sorted.length} of {diagnoses.length} diagnoses
        </div>
      </div>

      {/* Quick add (ICD-10) */}
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
        <IcdSearchInput
          id={`${baseId}-quick-code`}
          label="ICD-10 Code:"
          value={quickCode}
          onChange={(text) => {
            setQuickCode(text);
            if (text.length < 2) setQuickDescription('');
          }}
          onSelect={(result) => {
            setQuickCode(result.code);
            setQuickDescription(result.description);
          }}
          search={searchIcd10}
          placeholder="Search ICD-10..."
        />
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${baseId}-quick-desc`}
            className="text-muted-foreground text-sm"
          >
            Description:
          </Label>
          <Input
            id={`${baseId}-quick-desc`}
            value={quickDescription}
            onChange={(e) => setQuickDescription(e.target.value)}
            placeholder="Auto-populated from ICD-10"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${baseId}-quick-date`}
            className="text-muted-foreground text-sm"
          >
            Diagnosis Date:
          </Label>
          <Input
            id={`${baseId}-quick-date`}
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
          />
        </div>
        <Button
          onClick={handleQuickAdd}
          className="w-full"
          disabled={!quickCode || !quickDate}
        >
          Add Diagnosis
        </Button>
      </div>

      {/* Quick add (ICD-11) */}
      {searchIcd11 && (
        <div className="border-border grid grid-cols-1 items-end gap-4 border-t border-dashed pt-4 md:grid-cols-4">
          <IcdSearchInput
            id={`${baseId}-icd11-code`}
            label={
              <>
                ICD-11 Code:{' '}
                <span className="text-warning-800 text-xs">
                  (international only)
                </span>
              </>
            }
            value={icd11Code}
            onChange={(text) => setIcd11Code(text)}
            onSelect={(result) => {
              setIcd11Code(result.code);
              setIcd11Description(result.description);
              setIcd11Selected(result);
            }}
            search={searchIcd11}
            placeholder="Search ICD-11..."
          />
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-icd11-desc`}
              className="text-muted-foreground text-sm"
            >
              Description:
            </Label>
            <Input
              id={`${baseId}-icd11-desc`}
              value={icd11Description}
              onChange={(e) => setIcd11Description(e.target.value)}
              placeholder="Auto-populated from ICD-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-icd11-date`}
              className="text-muted-foreground text-sm"
            >
              Diagnosis Date:
            </Label>
            <Input
              id={`${baseId}-icd11-date`}
              type="date"
              value={icd11Date}
              onChange={(e) => setIcd11Date(e.target.value)}
            />
          </div>
          <Button
            onClick={handleIcd11Add}
            className="w-full"
            disabled={!icd11Code || !icd11Date}
          >
            Add ICD-11 Diagnosis
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]" />
              <TableHead className="w-[80px]">Priority</TableHead>
              <TableHead>ICD-10 Code</TableHead>
              <TableHead>ICD-11 Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Diagnosis Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground py-8 text-center"
                >
                  No diagnoses found. Click &quot;Add Diagnosis&quot; to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((diagnosis, index) => {
                const icd10Desc = diagnosis.icd10Description ?? '';
                const icd11Desc = diagnosis.icd11Description ?? '';
                return (
                  <TableRow
                    key={diagnosis.id}
                    draggable
                    onDragStart={() => {
                      draggedIndex.current = index;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(index);
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(index);
                    }}
                    onDragEnd={() => {
                      draggedIndex.current = null;
                      setDragOverIndex(null);
                    }}
                    className={cn(
                      'cursor-move transition-colors',
                      dragOverIndex === index &&
                        'border-t-primary-500 border-t-2'
                    )}
                  >
                    <TableCell className="cursor-grab active:cursor-grabbing">
                      <GripVertical
                        className="text-muted-foreground h-4 w-4"
                        aria-hidden="true"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          diagnosis.priority === 1 ? 'default' : 'secondary'
                        }
                      >
                        {diagnosis.priority === 1
                          ? 'Primary'
                          : `#${diagnosis.priority}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {diagnosis.icd10Code}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {diagnosis.icd11Code || '-'}
                    </TableCell>
                    <TableCell>
                      {icd10Desc && icd11Desc ? (
                        icd10Desc.toLowerCase() === icd11Desc.toLowerCase() ? (
                          icd10Desc
                        ) : (
                          <div className="space-y-1">
                            <div>
                              <span className="text-muted-foreground text-xs font-medium">
                                ICD-10:
                              </span>{' '}
                              {icd10Desc}
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs font-medium">
                                ICD-11:
                              </span>{' '}
                              {icd11Desc}
                            </div>
                          </div>
                        )
                      ) : (
                        icd10Desc || icd11Desc || '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(diagnosis.diagnosisDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={diagnosis.isActive ? 'default' : 'secondary'}
                      >
                        {diagnosis.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {diagnosis.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Move up: ${diagnosis.icd10Code}`}
                          onClick={() => movePriority(diagnosis.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Move down: ${diagnosis.icd10Code}`}
                          onClick={() => movePriority(diagnosis.id, 'down')}
                          disabled={index === sorted.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Edit: ${diagnosis.icd10Code}`}
                          onClick={() => openEdit(diagnosis)}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Delete: ${diagnosis.icd10Code}`}
                          onClick={() => setPendingDelete(diagnosis)}
                        >
                          <Trash2
                            className="text-destructive h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen} size="2xl">
        <ModalHeader>
          <ModalTitle>
            {editing ? 'Edit Diagnosis' : 'Add Diagnosis'}
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {editing
              ? 'Update the diagnosis information below.'
              : 'Select or enter an ICD-10 code and provide diagnosis details.'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <IcdSearchInput
              id={`${baseId}-modal-code`}
              label="ICD-10 Code *"
              value={modalCode}
              onChange={(text) => {
                setModalCode(text);
                if (text.length < 2) setModalDescription('');
              }}
              onSelect={(result) => {
                setModalCode(result.code);
                setModalDescription(result.description);
              }}
              search={searchIcd10}
              placeholder="Search ICD-10 code or description..."
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${baseId}-modal-desc`}>Description</Label>
              <Input
                id={`${baseId}-modal-desc`}
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
                placeholder="Auto-populated from ICD-10 lookup"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${baseId}-modal-date`}>Diagnosis Date *</Label>
            <Input
              id={`${baseId}-modal-date`}
              type="date"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${baseId}-modal-notes`}>Notes</Label>
            <Textarea
              id={`${baseId}-modal-notes`}
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="Additional notes about this diagnosis..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleModalSave}
              disabled={!modalCode || !modalDate}
            >
              {editing ? 'Update Diagnosis' : 'Add Diagnosis'}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete diagnosis?"
        description="Are you sure you want to delete this diagnosis? This action cannot be undone."
        actionLabel="Delete"
        variant="destructive"
        onAction={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
});
