import * as React from 'react';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import { Textarea } from '../Textarea';
import { Badge } from '../Badge';
import { AlertDialog } from '../AlertDialog';
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

/** A work restriction for an employee. */
export interface CaseRestriction {
  id: string;
  /** Restriction code. */
  restriction: string;
  startDate: string;
  endDate?: string;
  reviewDate?: string;
  isPermanent: boolean;
  isActive: boolean;
  notes?: string;
  caseNumber: string;
}

/** Editable restriction fields. */
export interface CaseRestrictionDraft {
  restriction: string;
  startDate: string;
  endDate: string;
  reviewDate: string;
  isPermanent: boolean;
  isActive: boolean;
  notes: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type CaseFilter = 'all' | 'current';

export interface CaseRestrictionsTabProps
  extends React.HTMLAttributes<HTMLDivElement> {
  employeeName: string;
  currentCaseNumber: string;
  /** All restrictions for the employee (across cases). */
  restrictions: CaseRestriction[];
  /** Options for the restriction-type selector. */
  restrictionOptions: { value: string; label: string }[];
  onAddRestriction: (draft: CaseRestrictionDraft) => void;
  onUpdateRestriction: (id: string, draft: CaseRestrictionDraft) => void;
  onDeleteRestriction: (id: string) => void;
}

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_DRAFT: CaseRestrictionDraft = {
  restriction: '',
  startDate: '',
  endDate: '',
  reviewDate: '',
  isPermanent: false,
  isActive: true,
  notes: '',
};

const newQuickEntry = (): CaseRestrictionDraft => ({
  ...EMPTY_DRAFT,
  startDate: today(),
});

/**
 * Presentational work-restrictions manager: filter, add/edit (modal), quick
 * inline entry, clone, and delete (with confirmation). State is delegated to
 * the container through the callback props.
 */
export const CaseRestrictionsTab = React.forwardRef<
  HTMLDivElement,
  CaseRestrictionsTabProps
>(
  (
    {
      employeeName,
      currentCaseNumber,
      restrictions,
      restrictionOptions,
      onAddRestriction,
      onUpdateRestriction,
      onDeleteRestriction,
      className,
      ...props
    },
    ref
  ) => {
    const [showDialog, setShowDialog] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState<CaseRestrictionDraft>(EMPTY_DRAFT);

    const [filterActive, setFilterActive] = React.useState<StatusFilter>('active');
    const [filterCase, setFilterCase] = React.useState<CaseFilter>('all');

    const [quickEntryMode, setQuickEntryMode] = React.useState(false);
    const [quickEntry, setQuickEntry] = React.useState<CaseRestrictionDraft>(
      newQuickEntry
    );

    const [toDelete, setToDelete] = React.useState<string | null>(null);

    const displayName = (code: string) =>
      restrictionOptions.find((o) => o.value === code)?.label ?? code;

    const filtered = restrictions.filter((r) => {
      if (filterActive === 'active' && !r.isActive) return false;
      if (filterActive === 'inactive' && r.isActive) return false;
      if (filterCase === 'current' && r.caseNumber !== currentCaseNumber)
        return false;
      return true;
    });

    const openAdd = () => {
      setFormData(EMPTY_DRAFT);
      setEditingId(null);
      setShowDialog(true);
    };

    const openEdit = (r: CaseRestriction) => {
      setFormData({
        restriction: r.restriction,
        startDate: r.startDate,
        endDate: r.endDate || '',
        reviewDate: r.reviewDate || '',
        isPermanent: r.isPermanent,
        isActive: r.isActive,
        notes: r.notes || '',
      });
      setEditingId(r.id);
      setShowDialog(true);
    };

    const openClone = (r: CaseRestriction) => {
      setFormData({
        restriction: r.restriction,
        startDate: today(),
        endDate: r.endDate || '',
        reviewDate: r.reviewDate || '',
        isPermanent: r.isPermanent,
        isActive: true,
        notes: r.notes || '',
      });
      setEditingId(null);
      setShowDialog(true);
    };

    const handleSubmit = () => {
      if (!formData.restriction || !formData.startDate) return;
      if (editingId) {
        onUpdateRestriction(editingId, formData);
      } else {
        onAddRestriction(formData);
      }
      setShowDialog(false);
      setEditingId(null);
      setFormData(EMPTY_DRAFT);
    };

    const submitQuickEntry = (keepOpen: boolean) => {
      if (!quickEntry.restriction || !quickEntry.startDate) return;
      onAddRestriction(quickEntry);
      setQuickEntry(newQuickEntry());
      if (!keepOpen) setQuickEntryMode(true);
    };

    return (
      <div
        ref={ref}
        data-slot="case-restrictions-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Work Restrictions for {employeeName}
          </h3>
          <div className="flex gap-2">
            <Button
              variant={quickEntryMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setQuickEntryMode((v) => !v)}
            >
              {quickEntryMode ? 'Exit Quick Entry' : 'Quick Entry Mode'}
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Restriction
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
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
                { value: 'inactive', label: 'Inactive Only' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Case:</Label>
            <Select
              aria-label="Filter by case"
              className="w-[160px]"
              value={filterCase}
              onValueChange={(v) => setFilterCase(v as CaseFilter)}
              options={[
                { value: 'all', label: 'All Cases' },
                { value: 'current', label: 'Current Case Only' },
              ]}
            />
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filtered.length} of {restrictions.length} restrictions
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
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
              {quickEntryMode && (
                <TableRow className="bg-primary-50">
                  <TableCell>
                    <Checkbox
                      aria-label="Active"
                      checked={quickEntry.isActive}
                      onChange={(e) =>
                        setQuickEntry({
                          ...quickEntry,
                          isActive: e.target.checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      aria-label="Quick entry restriction"
                      placeholder="Select..."
                      value={quickEntry.restriction}
                      onValueChange={(v) =>
                        setQuickEntry({ ...quickEntry, restriction: v })
                      }
                      options={restrictionOptions}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {currentCaseNumber}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      aria-label="Quick entry start date"
                      className="h-9"
                      value={quickEntry.startDate}
                      onChange={(e) =>
                        setQuickEntry({
                          ...quickEntry,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      aria-label="Quick entry end date"
                      className="h-9"
                      value={quickEntry.endDate}
                      disabled={quickEntry.isPermanent}
                      onChange={(e) =>
                        setQuickEntry({
                          ...quickEntry,
                          endDate: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      aria-label="Quick entry review date"
                      className="h-9"
                      value={quickEntry.reviewDate}
                      onChange={(e) =>
                        setQuickEntry({
                          ...quickEntry,
                          reviewDate: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label="Quick entry notes"
                      className="h-9"
                      placeholder="Notes..."
                      value={quickEntry.notes}
                      onChange={(e) =>
                        setQuickEntry({ ...quickEntry, notes: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Save and add new"
                        className="h-8 w-8 p-0 text-green-600"
                        disabled={
                          !quickEntry.restriction || !quickEntry.startDate
                        }
                        onClick={() => submitQuickEntry(true)}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Save restriction"
                        className="h-8 w-8 p-0"
                        disabled={
                          !quickEntry.restriction || !quickEntry.startDate
                        }
                        onClick={() => submitQuickEntry(false)}
                      >
                        <Check
                          className="h-4 w-4 text-green-600"
                          aria-hidden="true"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Clear fields"
                        className="h-8 w-8 p-0"
                        onClick={() => setQuickEntry(newQuickEntry())}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No restrictions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={r.isActive ? 'default' : 'secondary'}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {displayName(r.restriction)}
                      {r.isPermanent && (
                        <Badge variant="outline" className="ml-2">
                          Permanent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {r.caseNumber}
                        {r.caseNumber === currentCaseNumber && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{r.startDate}</TableCell>
                    <TableCell>{r.endDate || '—'}</TableCell>
                    <TableCell>{r.reviewDate || '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {r.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Clone restriction"
                          className="h-8 w-8 p-0"
                          onClick={() => openClone(r)}
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit restriction"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete restriction"
                          className="h-8 w-8 p-0"
                          onClick={() => setToDelete(r.id)}
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

        {/* Add / edit dialog */}
        <Modal
          open={showDialog}
          onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) {
              setEditingId(null);
              setFormData(EMPTY_DRAFT);
            }
          }}
          size="2xl"
        >
          <ModalHeader>
            <ModalTitle>{editingId ? 'Edit' : 'Add'} Restriction</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restriction-type">Restriction Type</Label>
                <Select
                  placeholder="Select restriction..."
                  value={formData.restriction}
                  onValueChange={(v) =>
                    setFormData({ ...formData, restriction: v })
                  }
                  options={restrictionOptions}
                />
              </div>
              <div className="flex items-end pb-2">
                <Checkbox
                  label="Currently Active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  disabled={formData.isPermanent}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-date">Review Date</Label>
                <Input
                  id="review-date"
                  type="date"
                  value={formData.reviewDate}
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

            <div className="space-y-2">
              <Label htmlFor="restriction-notes">Notes</Label>
              <Textarea
                id="restriction-notes"
                placeholder="Additional notes about this restriction..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.restriction || !formData.startDate}
            >
              {editingId ? 'Update' : 'Add'} Restriction
            </Button>
          </ModalFooter>
        </Modal>

        <AlertDialog
          open={toDelete !== null}
          onOpenChange={(open) => {
            if (!open) setToDelete(null);
          }}
          title="Delete Restriction"
          description="Are you sure you want to delete this restriction? This action cannot be undone."
          variant="destructive"
          actionLabel="Delete"
          onAction={() => {
            if (toDelete) onDeleteRestriction(toDelete);
            setToDelete(null);
          }}
        />
      </div>
    );
  }
);

CaseRestrictionsTab.displayName = 'CaseRestrictionsTab';
