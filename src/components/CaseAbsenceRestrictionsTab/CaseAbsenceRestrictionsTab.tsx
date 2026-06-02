import { forwardRef, useId, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Alert, AlertDescription, AlertTitle } from '../Alert';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
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

/** Recognized absence status codes (a status may carry a numeric suffix). */
export type AbsenceTrackingStatus =
  | 'FD'
  | 'LWD'
  | 'RWD'
  | 'RWDREGULARJOB'
  | 'OTH';

/** A single absence-tracking timeline entry. */
export interface AbsenceTrackingEntry {
  id: string;
  effectiveDate: string;
  endDate?: string;
  status: string;
  reason?: string;
  otherName?: string;
  createdSeq: number;
  caseNumber?: string;
}

/** Fields supplied when adding/updating an absence entry. */
export interface AbsenceTrackingDraft {
  effectiveDate: string;
  endDate?: string;
  status: string;
  reason?: string;
  otherName?: string;
}

/** A work restriction attached to a case. */
export interface WorkRestrictionEntry {
  id: string;
  restriction: string;
  startDate: string;
  endDate?: string;
  reviewDate?: string;
  isPermanent: boolean;
  isActive: boolean;
  notes?: string;
  caseNumber?: string;
}

/** Fields supplied when adding/updating a work restriction. */
export interface WorkRestrictionDraft {
  restriction: string;
  startDate: string;
  endDate?: string;
  reviewDate?: string;
  isPermanent: boolean;
  isActive: boolean;
  notes?: string;
}

/** A selectable code option. */
export interface AbsenceRestrictionOption {
  value: string;
  label: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type CaseFilter = 'all' | 'current';

export interface CaseAbsenceRestrictionsTabProps {
  /** Absence timeline entries. */
  absences: AbsenceTrackingEntry[];
  /** Work restrictions (for the employee, possibly across cases). */
  restrictions: WorkRestrictionEntry[];
  /** Absence status code options. */
  statusOptions: AbsenceRestrictionOption[];
  /** Absence reason code options (used for OTH status). */
  reasonOptions: AbsenceRestrictionOption[];
  /** Restriction code options. */
  restrictionOptions: AbsenceRestrictionOption[];
  /** The current case number, used for "Current Case Only" filtering and badges. */
  currentCaseNumber?: string;
  /** Default "count last status through" date (YYYY-MM-DD). Defaults to today. */
  defaultCountThrough?: string;
  /** Add an absence entry. */
  onAddAbsence: (draft: AbsenceTrackingDraft) => void;
  /** Update an absence entry by id. */
  onUpdateAbsence: (id: string, draft: AbsenceTrackingDraft) => void;
  /** Add a work restriction. */
  onAddRestriction: (draft: WorkRestrictionDraft) => void;
  /** Update a work restriction by id. */
  onUpdateRestriction: (id: string, draft: WorkRestrictionDraft) => void;
  /** Delete a work restriction by id. */
  onDeleteRestriction: (id: string) => void;
  className?: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Extract the leading alphabetic status code (e.g. "RWD2" -> "RWD"). */
function statusCodeOf(status: string): string {
  const match = status.match(/^([A-Z]+)/);
  return match ? match[1] : status;
}

/** Whole days between two dates (excluding the end), clamped at 0. */
function daysBetween(start: string, end: string): number {
  const s = new Date(start.replace(/-/g, '/'));
  const e = new Date(end.replace(/-/g, '/'));
  const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

interface AbsenceAuditIssue {
  severity: 'error' | 'warning';
  entryIds: string[];
}

/** Detect consecutive-status, gap, and duplicate timeline issues. */
function auditEntries(sorted: AbsenceTrackingEntry[]): AbsenceAuditIssue[] {
  const issues: AbsenceAuditIssue[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevCode = statusCodeOf(prev.status);
    const currCode = statusCodeOf(curr.status);
    if (
      prevCode === currCode &&
      (currCode === 'RWD' || currCode === 'FD' || currCode === 'LWD')
    ) {
      issues.push({ severity: 'error', entryIds: [prev.id, curr.id] });
    }
    const diffDays = daysBetween(prev.effectiveDate, curr.effectiveDate);
    if (diffDays > 1) {
      issues.push({ severity: 'warning', entryIds: [prev.id, curr.id] });
    }
  }
  const dateStatusMap = new Map<string, AbsenceTrackingEntry[]>();
  for (const entry of sorted) {
    const key = `${entry.effectiveDate}-${statusCodeOf(entry.status)}`;
    const list = dateStatusMap.get(key) ?? [];
    list.push(entry);
    dateStatusMap.set(key, list);
  }
  for (const dupes of dateStatusMap.values()) {
    if (dupes.length > 1) {
      issues.push({ severity: 'error', entryIds: dupes.map((d) => d.id) });
    }
  }
  return issues;
}

const DAY_COLUMNS: AbsenceTrackingStatus[] = [
  'FD',
  'LWD',
  'RWD',
  'RWDREGULARJOB',
  'OTH',
];

/**
 * Presentational combined absence-tracking and work-restrictions manager. The
 * absence section computes per-status day buckets between effective dates,
 * flags timeline issues (consecutive/gap/duplicate), and supports inline edit.
 * The restrictions section provides quick-add, an edit modal, clone, and
 * delete. All mutations are delegated to callbacks.
 */
export const CaseAbsenceRestrictionsTab = forwardRef<
  HTMLDivElement,
  CaseAbsenceRestrictionsTabProps
>(function CaseAbsenceRestrictionsTab(
  {
    absences,
    restrictions,
    statusOptions,
    reasonOptions,
    restrictionOptions,
    currentCaseNumber,
    defaultCountThrough,
    onAddAbsence,
    onUpdateAbsence,
    onAddRestriction,
    onUpdateRestriction,
    onDeleteRestriction,
    className,
  },
  ref
) {
  const baseId = useId();

  // ===== Absence state =====
  const [effectiveDate, setEffectiveDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [otherName, setOtherName] = useState('');
  const [countThrough, setCountThrough] = useState(
    defaultCountThrough ?? today()
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<AbsenceTrackingDraft>({
    effectiveDate: '',
    endDate: '',
    status: '',
    reason: '',
    otherName: '',
  });
  const [absenceFilterActive, setAbsenceFilterActive] =
    useState<StatusFilter>('active');
  const [validationError, setValidationError] = useState<string | null>(null);

  // ===== Restriction state =====
  const [restrictionFilterActive, setRestrictionFilterActive] =
    useState<StatusFilter>('active');
  const [restrictionFilterCase, setRestrictionFilterCase] =
    useState<CaseFilter>('current');
  const [showDialog, setShowDialog] = useState(false);
  const [restrictionEditingId, setRestrictionEditingId] = useState<
    string | null
  >(null);
  const [pendingDelete, setPendingDelete] =
    useState<WorkRestrictionEntry | null>(null);
  const emptyRestriction: WorkRestrictionDraft = {
    restriction: '',
    startDate: '',
    endDate: '',
    reviewDate: '',
    isPermanent: false,
    isActive: true,
    notes: '',
  };
  const [quickEntry, setQuickEntry] = useState<WorkRestrictionDraft>({
    ...emptyRestriction,
    startDate: today(),
  });
  const [formData, setFormData] =
    useState<WorkRestrictionDraft>(emptyRestriction);

  const statusLabelOf = (entry: AbsenceTrackingEntry): string => {
    if (statusCodeOf(entry.status) === 'OTH' && entry.otherName) {
      return `OTH — ${entry.otherName}`;
    }
    return (
      statusOptions.find((o) => o.value === entry.status)?.label || entry.status
    );
  };

  const restrictionDisplayName = (code: string): string =>
    restrictionOptions.find((o) => o.value === code)?.label || code;

  // Active restrictions for the current case (gate for RWD statuses).
  const currentCaseRestrictions = restrictions.filter(
    (r) =>
      r.isActive && (!currentCaseNumber || r.caseNumber === currentCaseNumber)
  );

  // ===== Absence derived data =====
  const filteredAbsences = absences.filter((entry) => {
    const isInactive = entry.endDate ? entry.endDate < today() : false;
    if (absenceFilterActive === 'active' && isInactive) return false;
    if (absenceFilterActive === 'inactive' && !isInactive) return false;
    return true;
  });

  const sortedEntries = [...filteredAbsences].sort((a, b) => {
    const cmp = a.effectiveDate.localeCompare(b.effectiveDate);
    return cmp !== 0 ? cmp : a.createdSeq - b.createdSeq;
  });

  const auditIssues = auditEntries(sortedEntries);

  const entriesWithDays = sortedEntries.map((entry, index) => {
    const nextDate =
      index < sortedEntries.length - 1
        ? sortedEntries[index + 1].effectiveDate
        : countThrough;
    const days = daysBetween(entry.effectiveDate, nextDate);
    const code = statusCodeOf(entry.status);
    return {
      ...entry,
      days: {
        FD: code === 'FD' ? days : 0,
        LWD: code === 'LWD' ? days : 0,
        RWD: code === 'RWD' ? days : 0,
        RWDREGULARJOB: code === 'RWDREGULARJOB' ? days : 0,
        OTH: code === 'OTH' ? days : 0,
      } as Record<AbsenceTrackingStatus, number>,
    };
  });

  const totals = entriesWithDays.reduce(
    (acc, e) => {
      DAY_COLUMNS.forEach((col) => {
        acc[col] += e.days[col];
      });
      return acc;
    },
    { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0 } as Record<
      AbsenceTrackingStatus,
      number
    >
  );

  const validateNewEntry = (status: string, date: string): string | null => {
    const code = statusCodeOf(status);
    const withNew = [
      ...sortedEntries.map((e) => ({
        effectiveDate: e.effectiveDate,
        status: e.status,
        id: e.id,
        createdSeq: e.createdSeq,
      })),
      { effectiveDate: date, status, id: 'new', createdSeq: 999999 },
    ].sort((a, b) => {
      const cmp = a.effectiveDate.localeCompare(b.effectiveDate);
      return cmp !== 0 ? cmp : a.createdSeq - b.createdSeq;
    });
    const idx = withNew.findIndex((e) => e.id === 'new');
    const conflicts = (other: { status: string }) => {
      const otherCode = statusCodeOf(other.status);
      return (
        otherCode === code &&
        (code === 'RWD' || code === 'FD' || code === 'LWD')
      );
    };
    const label = statusOptions.find((o) => o.value === code)?.label || code;
    if (idx > 0 && conflicts(withNew[idx - 1])) {
      return `Cannot add consecutive "${label}" entries. Please extend the existing entry instead.`;
    }
    if (idx < withNew.length - 1 && conflicts(withNew[idx + 1])) {
      return `Cannot add consecutive "${label}" entries. There's already a ${label} entry nearby.`;
    }
    return null;
  };

  const rwdNeedsRestriction =
    selectedStatus.startsWith('RWD') && currentCaseRestrictions.length === 0;

  const handleAddAbsence = () => {
    if (!effectiveDate || !selectedStatus) return;
    if (selectedStatus.startsWith('OTH') && !selectedReason) return;
    if (rwdNeedsRestriction) return;
    const error = validateNewEntry(selectedStatus, effectiveDate);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onAddAbsence({
      effectiveDate,
      endDate: absenceEndDate || undefined,
      status: selectedStatus,
      reason: selectedReason || undefined,
      otherName: selectedStatus.startsWith('OTH') ? otherName : undefined,
    });
    setEffectiveDate('');
    setAbsenceEndDate('');
    setSelectedStatus('');
    setSelectedReason('');
    setOtherName('');
  };

  const handleEditAbsence = (entry: AbsenceTrackingEntry) => {
    setEditingId(entry.id);
    setEditData({
      effectiveDate: entry.effectiveDate,
      endDate: entry.endDate || '',
      status: entry.status,
      reason: entry.reason || '',
      otherName: entry.otherName || '',
    });
  };

  const handleSaveAbsence = () => {
    if (!editingId || !editData.effectiveDate || !editData.status) return;
    if (editData.status.startsWith('OTH') && !editData.otherName) return;
    onUpdateAbsence(editingId, {
      effectiveDate: editData.effectiveDate,
      endDate: editData.endDate || undefined,
      status: editData.status,
      reason: editData.reason || undefined,
      otherName: editData.otherName || undefined,
    });
    setEditingId(null);
  };

  // ===== Restriction derived data =====
  const filteredRestrictions = restrictions.filter((r) => {
    if (restrictionFilterActive === 'active' && !r.isActive) return false;
    if (restrictionFilterActive === 'inactive' && r.isActive) return false;
    if (
      restrictionFilterCase === 'current' &&
      r.caseNumber !== currentCaseNumber
    )
      return false;
    return true;
  });

  const handleQuickAddRestriction = () => {
    if (!quickEntry.restriction || !quickEntry.startDate) return;
    onAddRestriction(quickEntry);
    setQuickEntry({ ...emptyRestriction, startDate: today() });
  };

  const openRestrictionEdit = (r: WorkRestrictionEntry) => {
    setFormData({
      restriction: r.restriction,
      startDate: r.startDate,
      endDate: r.endDate || '',
      reviewDate: r.reviewDate || '',
      isPermanent: r.isPermanent,
      isActive: r.isActive,
      notes: r.notes || '',
    });
    setRestrictionEditingId(r.id);
    setShowDialog(true);
  };

  const openRestrictionClone = (r: WorkRestrictionEntry) => {
    setFormData({
      restriction: r.restriction,
      startDate: today(),
      endDate: r.endDate || '',
      reviewDate: r.reviewDate || '',
      isPermanent: r.isPermanent,
      isActive: true,
      notes: r.notes || '',
    });
    setRestrictionEditingId(null);
    setShowDialog(true);
  };

  const handleRestrictionSubmit = () => {
    if (!formData.restriction || !formData.startDate) return;
    if (restrictionEditingId) {
      onUpdateRestriction(restrictionEditingId, formData);
    } else {
      onAddRestriction(formData);
    }
    setFormData(emptyRestriction);
    setRestrictionEditingId(null);
    setShowDialog(false);
  };

  const statusFilterOptions: AbsenceRestrictionOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' },
  ];
  const caseFilterOptions: AbsenceRestrictionOption[] = [
    { value: 'all', label: 'All Cases' },
    { value: 'current', label: 'Current Case Only' },
  ];

  return (
    <div
      ref={ref}
      data-slot="case-absence-restrictions-tab"
      className={cn('space-y-8', className)}
    >
      {/* ===== Absence section ===== */}
      <section className="space-y-6">
        <div className="border-border flex items-center gap-3 border-b pb-3">
          <Calendar className="text-primary-600 h-5 w-5" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Absence Tracking</h3>
        </div>

        <div className="bg-muted grid grid-cols-1 items-center gap-4 rounded-lg px-4 py-3 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Status:</Label>
            <Select
              aria-label="Filter absences by status"
              className="flex-1"
              value={absenceFilterActive}
              onValueChange={(v) => setAbsenceFilterActive(v as StatusFilter)}
              options={statusFilterOptions}
            />
          </div>
          <div />
          <div className="text-muted-foreground text-right text-sm">
            Showing {filteredAbsences.length} of {absences.length} entries
          </div>
        </div>

        {validationError && (
          <Alert variant="danger">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Cannot Add Entry</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-eff`}
              className="text-muted-foreground text-sm"
            >
              Effective date:
            </Label>
            <Input
              id={`${baseId}-eff`}
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-end`}
              className="text-muted-foreground text-sm"
            >
              End date:
            </Label>
            <Input
              id={`${baseId}-end`}
              type="date"
              value={absenceEndDate}
              onChange={(e) => setAbsenceEndDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-status`}
              className="text-muted-foreground text-sm"
            >
              Status:
            </Label>
            <Select
              aria-label="Absence status"
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              placeholder="Select status..."
              options={statusOptions}
            />
            {rwdNeedsRestriction && (
              <p className="text-destructive text-xs">
                Restriction required for this status
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-reason`}
              className="text-muted-foreground text-sm"
            >
              Reason:
              {selectedStatus.startsWith('OTH') && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <Select
              aria-label="Absence reason"
              value={selectedReason}
              onValueChange={setSelectedReason}
              placeholder="Select reason..."
              options={reasonOptions}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-count`}
              className="text-muted-foreground text-sm whitespace-nowrap"
            >
              Count last status through:
            </Label>
            <Input
              id={`${baseId}-count`}
              type="date"
              value={countThrough}
              onChange={(e) => setCountThrough(e.target.value)}
            />
          </div>
          <Button
            onClick={handleAddAbsence}
            className="w-full"
            disabled={
              !effectiveDate ||
              !selectedStatus ||
              (selectedStatus.startsWith('OTH') && !selectedReason) ||
              rwdNeedsRestriction
            }
          >
            Add Entry
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Days are counted from each effective date up to (but excluding) the
          next effective date. The last row counts through the date on the right
          (defaults to today).
        </p>

        <div className="border-border rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                {DAY_COLUMNS.map((col) => (
                  <TableHead key={col} className="text-center">
                    {col}
                  </TableHead>
                ))}
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesWithDays.map((entry, index) => {
                const hasError = auditIssues.some(
                  (i) => i.severity === 'error' && i.entryIds.includes(entry.id)
                );
                const hasWarning = auditIssues.some(
                  (i) =>
                    i.severity === 'warning' && i.entryIds.includes(entry.id)
                );
                const isEditing = editingId === entry.id;
                return (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      hasError && 'bg-destructive/10',
                      !hasError && hasWarning && 'bg-warning-50'
                    )}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          aria-label="Edit effective date"
                          className="h-8"
                          value={editData.effectiveDate}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              effectiveDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        entry.effectiveDate
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          aria-label="Edit end date"
                          className="h-8"
                          value={editData.endDate || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              endDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        entry.endDate || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Select
                            aria-label="Edit status"
                            value={editData.status}
                            onValueChange={(v) =>
                              setEditData({ ...editData, status: v })
                            }
                            options={statusOptions}
                          />
                          {editData.status.startsWith('OTH') && (
                            <Input
                              aria-label="Edit other name"
                              className="h-8"
                              value={editData.otherName || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  otherName: e.target.value,
                                })
                              }
                              placeholder="Other name..."
                            />
                          )}
                        </div>
                      ) : (
                        statusLabelOf(entry)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          aria-label="Edit reason"
                          value={editData.reason || ''}
                          onValueChange={(v) =>
                            setEditData({ ...editData, reason: v })
                          }
                          placeholder="Select..."
                          options={reasonOptions}
                        />
                      ) : (
                        entry.reason || '-'
                      )}
                    </TableCell>
                    {DAY_COLUMNS.map((col) => (
                      <TableCell key={col} className="text-center">
                        {entry.days[col]}
                      </TableCell>
                    ))}
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Save absence entry"
                            onClick={handleSaveAbsence}
                          >
                            <Save className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Cancel edit"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`Edit absence entry: ${statusLabelOf(entry)}`}
                          onClick={() => handleEditAbsence(entry)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted font-medium">
                <TableCell colSpan={5} className="text-right">
                  Totals
                </TableCell>
                {DAY_COLUMNS.map((col) => (
                  <TableCell key={col} className="text-center">
                    {totals[col]}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ===== Restrictions section ===== */}
      <section
        className={cn(
          'space-y-6 rounded-lg p-4',
          rwdNeedsRestriction && 'border-destructive border-2'
        )}
      >
        <div className="border-border flex items-center gap-3 border-b pb-3">
          <ShieldAlert
            className="text-primary-600 h-5 w-5"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Work Restrictions</h3>
          {rwdNeedsRestriction && (
            <span className="text-destructive ml-auto text-sm">
              Restriction required for selected status
            </span>
          )}
        </div>

        <div className="bg-muted grid grid-cols-1 items-center gap-4 rounded-lg px-4 py-3 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Status:</Label>
            <Select
              aria-label="Filter restrictions by status"
              className="flex-1"
              value={restrictionFilterActive}
              onValueChange={(v) =>
                setRestrictionFilterActive(v as StatusFilter)
              }
              options={statusFilterOptions}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Case:</Label>
            <Select
              aria-label="Filter restrictions by case"
              className="w-[180px]"
              value={restrictionFilterCase}
              onValueChange={(v) => setRestrictionFilterCase(v as CaseFilter)}
              options={caseFilterOptions}
            />
          </div>
          <div className="text-muted-foreground text-right text-sm">
            Showing {filteredRestrictions.length} of {restrictions.length}{' '}
            restrictions
          </div>
        </div>

        {/* Quick add restriction */}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-r-type`}
              className="text-muted-foreground text-sm"
            >
              Restriction:
            </Label>
            <Select
              aria-label="Restriction type"
              value={quickEntry.restriction}
              onValueChange={(v) =>
                setQuickEntry({ ...quickEntry, restriction: v })
              }
              placeholder="Select restriction..."
              options={restrictionOptions}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-r-start`}
              className="text-muted-foreground text-sm"
            >
              Start date:
            </Label>
            <Input
              id={`${baseId}-r-start`}
              type="date"
              value={quickEntry.startDate}
              onChange={(e) =>
                setQuickEntry({ ...quickEntry, startDate: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-r-end`}
              className="text-muted-foreground text-sm"
            >
              End date:
            </Label>
            <Input
              id={`${baseId}-r-end`}
              type="date"
              value={quickEntry.endDate || ''}
              onChange={(e) =>
                setQuickEntry({ ...quickEntry, endDate: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={`${baseId}-r-review`}
              className="text-muted-foreground text-sm"
            >
              Review date:
            </Label>
            <Input
              id={`${baseId}-r-review`}
              type="date"
              value={quickEntry.reviewDate || ''}
              onChange={(e) =>
                setQuickEntry({ ...quickEntry, reviewDate: e.target.value })
              }
            />
          </div>
          <Button
            onClick={handleQuickAddRestriction}
            className="w-full"
            disabled={!quickEntry.restriction || !quickEntry.startDate}
          >
            Add Restriction
          </Button>
        </div>

        <div className="border-border rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restriction</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestrictions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No restrictions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRestrictions.map((restriction) => (
                  <TableRow key={restriction.id}>
                    <TableCell className="font-medium">
                      {restrictionDisplayName(restriction.restriction)}
                      {restriction.isPermanent && (
                        <Badge variant="outline" size="sm" className="ml-2">
                          Permanent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {restriction.caseNumber}
                        {restriction.caseNumber === currentCaseNumber && (
                          <Badge variant="outline" size="sm" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{restriction.startDate}</TableCell>
                    <TableCell>{restriction.endDate || '—'}</TableCell>
                    <TableCell>{restriction.reviewDate || '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {restriction.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Clone restriction: ${restrictionDisplayName(restriction.restriction)}`}
                          onClick={() => openRestrictionClone(restriction)}
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Edit restriction: ${restrictionDisplayName(restriction.restriction)}`}
                          onClick={() => openRestrictionEdit(restriction)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Delete restriction: ${restrictionDisplayName(restriction.restriction)}`}
                          onClick={() => setPendingDelete(restriction)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Restriction edit modal */}
      <Modal
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setFormData(emptyRestriction);
            setRestrictionEditingId(null);
          }
        }}
        size="2xl"
      >
        <ModalHeader>
          <ModalTitle>
            {restrictionEditingId ? 'Edit Restriction' : 'Add Restriction'}
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Restriction Type</Label>
            <Select
              aria-label="Restriction type (modal)"
              value={formData.restriction}
              onValueChange={(v) =>
                setFormData({ ...formData, restriction: v })
              }
              placeholder="Select restriction..."
              options={restrictionOptions}
            />
          </div>
          <Checkbox
            label="Currently Active"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
          />
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${baseId}-f-start`}>Start Date</Label>
              <Input
                id={`${baseId}-f-start`}
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${baseId}-f-end`}>End Date</Label>
              <Input
                id={`${baseId}-f-end`}
                type="date"
                value={formData.endDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                disabled={formData.isPermanent}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${baseId}-f-review`}>Review Date</Label>
              <Input
                id={`${baseId}-f-review`}
                type="date"
                value={formData.reviewDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, reviewDate: e.target.value })
                }
              />
            </div>
          </div>
          <Checkbox
            label="Permanent Restriction"
            checked={formData.isPermanent}
            onChange={(e) =>
              setFormData({
                ...formData,
                isPermanent: e.target.checked,
                endDate: e.target.checked ? '' : formData.endDate,
              })
            }
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${baseId}-f-notes`}>Notes</Label>
            <Textarea
              id={`${baseId}-f-notes`}
              placeholder="Additional notes about this restriction..."
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRestrictionSubmit}
              disabled={!formData.restriction || !formData.startDate}
            >
              {restrictionEditingId ? 'Update Restriction' : 'Add Restriction'}
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete restriction?"
        description="Are you sure you want to delete this restriction? This action cannot be undone."
        actionLabel="Delete"
        variant="destructive"
        onAction={() => {
          if (pendingDelete) onDeleteRestriction(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
});
