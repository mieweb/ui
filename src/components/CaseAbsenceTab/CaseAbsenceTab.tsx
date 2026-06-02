import * as React from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** Absence status code. */
export type AbsenceStatus = 'FD' | 'LWD' | 'RWD' | 'RWDREGULARJOB' | 'OTH';

/** A single absence entry. */
export interface CaseAbsenceEntry {
  id: string;
  /** YYYY-MM-DD. */
  effectiveDate: string;
  status: AbsenceStatus;
  reason?: string;
  otherName?: string;
  /** Stable creation order used to break date ties. */
  createdSeq: number;
}

/** Draft payload for adding or editing an absence entry. */
export interface CaseAbsenceDraft {
  effectiveDate: string;
  status: AbsenceStatus;
  reason?: string;
  otherName?: string;
}

export interface CaseAbsenceTabProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Absence entries for the case. */
  entries: CaseAbsenceEntry[];
  /** Reason options for the reason selector. */
  reasonOptions: { value: string; label: string }[];
  /** Called when a new entry is added. */
  onAddEntry: (draft: CaseAbsenceDraft) => void;
  /** Called when an existing entry is edited and saved. */
  onUpdateEntry: (id: string, draft: CaseAbsenceDraft) => void;
}

const STATUS_OPTIONS: { value: AbsenceStatus; label: string }[] = [
  { value: 'FD', label: 'Full Duty' },
  { value: 'LWD', label: 'Lost Work Days' },
  { value: 'OTH', label: 'Other' },
  { value: 'RWD', label: 'Restricted Work Days' },
  {
    value: 'RWDREGULARJOB',
    label: 'OSHA Full Duty (Restrictions, no job impact)',
  },
];

function calculateDays(effectiveDate: string, nextDate: string): number {
  const start = new Date(effectiveDate.replace(/-/g, '/'));
  const end = new Date(nextDate.replace(/-/g, '/'));
  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays > 0 ? diffDays : 0;
}

function statusLabel(entry: Pick<CaseAbsenceEntry, 'status' | 'otherName'>) {
  if (entry.status === 'OTH' && entry.otherName) {
    return `OTH — ${entry.otherName}`;
  }
  return (
    STATUS_OPTIONS.find((o) => o.value === entry.status)?.label ?? entry.status
  );
}

const EMPTY_DRAFT: CaseAbsenceDraft = {
  effectiveDate: '',
  status: '' as AbsenceStatus,
  reason: '',
  otherName: '',
};

/**
 * Presentational absence tracker. Computes per-status day counts between
 * effective dates (the last row counts through "Count last status through").
 * Add/edit happen via the {@link CaseAbsenceTabProps.onAddEntry} and
 * {@link CaseAbsenceTabProps.onUpdateEntry} callbacks; the component owns only
 * the add form, inline-edit, and filter view state.
 */
export const CaseAbsenceTab = React.forwardRef<
  HTMLDivElement,
  CaseAbsenceTabProps
>(
  (
    { entries, reasonOptions, onAddEntry, onUpdateEntry, className, ...props },
    ref
  ) => {
    const [draft, setDraft] = React.useState<CaseAbsenceDraft>(EMPTY_DRAFT);
    const [countThrough, setCountThrough] = React.useState(
      () => new Date().toISOString().split('T')[0]
    );
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editDraft, setEditDraft] =
      React.useState<CaseAbsenceDraft>(EMPTY_DRAFT);

    const sorted = React.useMemo(
      () =>
        [...entries].sort((a, b) => {
          const c = a.effectiveDate.localeCompare(b.effectiveDate);
          return c !== 0 ? c : a.createdSeq - b.createdSeq;
        }),
      [entries]
    );

    const rows = sorted.map((entry, index) => {
      const nextDate =
        index < sorted.length - 1
          ? sorted[index + 1].effectiveDate
          : countThrough;
      const days = calculateDays(entry.effectiveDate, nextDate);
      return {
        ...entry,
        days: {
          FD: entry.status === 'FD' ? days : 0,
          LWD: entry.status === 'LWD' ? days : 0,
          RWD: entry.status === 'RWD' ? days : 0,
          RWDREGULARJOB: entry.status === 'RWDREGULARJOB' ? days : 0,
          OTH: entry.status === 'OTH' ? days : 0,
        },
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        FD: acc.FD + r.days.FD,
        LWD: acc.LWD + r.days.LWD,
        RWD: acc.RWD + r.days.RWD,
        RWDREGULARJOB: acc.RWDREGULARJOB + r.days.RWDREGULARJOB,
        OTH: acc.OTH + r.days.OTH,
      }),
      { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0 }
    );

    const canAdd =
      !!draft.effectiveDate &&
      !!draft.status &&
      (draft.status !== 'OTH' || !!draft.otherName);

    const handleAdd = () => {
      if (!canAdd) return;
      onAddEntry({
        effectiveDate: draft.effectiveDate,
        status: draft.status,
        reason: draft.reason || undefined,
        otherName: draft.status === 'OTH' ? draft.otherName : undefined,
      });
      setDraft(EMPTY_DRAFT);
    };

    const startEdit = (entry: CaseAbsenceEntry) => {
      setEditingId(entry.id);
      setEditDraft({
        effectiveDate: entry.effectiveDate,
        status: entry.status,
        reason: entry.reason ?? '',
        otherName: entry.otherName ?? '',
      });
    };

    const saveEdit = () => {
      if (!editingId) return;
      if (!editDraft.effectiveDate || !editDraft.status) return;
      if (editDraft.status === 'OTH' && !editDraft.otherName) return;
      onUpdateEntry(editingId, {
        effectiveDate: editDraft.effectiveDate,
        status: editDraft.status,
        reason: editDraft.reason || undefined,
        otherName: editDraft.otherName || undefined,
      });
      setEditingId(null);
    };

    return (
      <div
        ref={ref}
        data-slot="case-absence-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        {/* Add entry form */}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label
              htmlFor="absence-effective-date"
              className="text-muted-foreground text-sm"
            >
              Effective date:
            </Label>
            <Input
              id="absence-effective-date"
              type="date"
              value={draft.effectiveDate}
              onChange={(e) =>
                setDraft({ ...draft, effectiveDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="absence-status"
              className="text-muted-foreground text-sm"
            >
              Status:
            </Label>
            <Select
              value={draft.status}
              onValueChange={(v) =>
                setDraft({ ...draft, status: v as AbsenceStatus })
              }
              placeholder="Select status..."
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="absence-reason"
              className="text-muted-foreground text-sm"
            >
              Reason:
            </Label>
            <Select
              value={draft.reason}
              onValueChange={(v) => setDraft({ ...draft, reason: v })}
              placeholder="Select reason..."
              options={reasonOptions}
            />
          </div>
          {draft.status === 'OTH' && (
            <div className="space-y-2">
              <Label
                htmlFor="absence-other"
                className="text-muted-foreground text-sm"
              >
                Other name:
              </Label>
              <Input
                id="absence-other"
                value={draft.otherName}
                onChange={(e) =>
                  setDraft({ ...draft, otherName: e.target.value })
                }
                placeholder="Enter other name..."
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <Button onClick={handleAdd} disabled={!canAdd}>
              Add Entry
            </Button>
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="absence-count-through"
                className="text-muted-foreground text-sm whitespace-nowrap"
              >
                Count last status through:
              </Label>
              <Input
                id="absence-count-through"
                type="date"
                value={countThrough}
                onChange={(e) => setCountThrough(e.target.value)}
              />
            </div>
          </div>
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
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">FD</TableHead>
                <TableHead className="text-center">LWD</TableHead>
                <TableHead className="text-center">RWD</TableHead>
                <TableHead className="text-center">RWDREGULARJOB</TableHead>
                <TableHead className="text-center">OTH</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Input
                        type="date"
                        aria-label="Effective date"
                        value={editDraft.effectiveDate}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            effectiveDate: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    ) : (
                      entry.effectiveDate
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <div className="flex gap-2">
                        <Select
                          aria-label="Status"
                          value={editDraft.status}
                          onValueChange={(v) =>
                            setEditDraft({
                              ...editDraft,
                              status: v as AbsenceStatus,
                            })
                          }
                          options={STATUS_OPTIONS}
                        />
                        {editDraft.status === 'OTH' && (
                          <Input
                            aria-label="Other name"
                            value={editDraft.otherName}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                otherName: e.target.value,
                              })
                            }
                            placeholder="Other name..."
                            className="h-8"
                          />
                        )}
                      </div>
                    ) : (
                      statusLabel(entry)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <Select
                        aria-label="Reason"
                        value={editDraft.reason}
                        onValueChange={(v) =>
                          setEditDraft({ ...editDraft, reason: v })
                        }
                        placeholder="Select..."
                        options={reasonOptions}
                      />
                    ) : (
                      entry.reason || '-'
                    )}
                  </TableCell>
                  <TableCell className="text-center">{entry.days.FD}</TableCell>
                  <TableCell className="text-center">
                    {entry.days.LWD}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.days.RWD}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.days.RWDREGULARJOB}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.days.OTH}
                  </TableCell>
                  <TableCell>
                    {editingId === entry.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Save"
                          onClick={saveEdit}
                        >
                          <Save className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Cancel"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Edit entry"
                        onClick={() => startEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-medium">
                <TableCell colSpan={4} className="text-right">
                  Totals
                </TableCell>
                <TableCell className="text-center">{totals.FD}</TableCell>
                <TableCell className="text-center">{totals.LWD}</TableCell>
                <TableCell className="text-center">{totals.RWD}</TableCell>
                <TableCell className="text-center">
                  {totals.RWDREGULARJOB}
                </TableCell>
                <TableCell className="text-center">{totals.OTH}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
);

CaseAbsenceTab.displayName = 'CaseAbsenceTab';
