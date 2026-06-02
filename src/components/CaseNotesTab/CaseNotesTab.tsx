import { forwardRef, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  History,
  LayoutList,
  List,
  ListTodo,
  Lock,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Unlock,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { stripHtmlTags } from '../../utils/html';
import { Alert, AlertDescription } from '../Alert';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { FloatingWindow } from '../FloatingWindow';
import { Input } from '../Input';
import { Label } from '../Label';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../Modal';
import { RichTextEditor } from '../RichTextEditor';
import { Select } from '../Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A historical version of a case note. */
export interface CaseNoteVersion {
  id: string;
  content: string;
  editedBy: string;
  editedAt: string;
}

/** A single case note record. */
export interface CaseNoteItem {
  id: string;
  noteDate: string;
  activity: string;
  caseManager: string;
  /**
   * Rich HTML content of the note. Rendered via `dangerouslySetInnerHTML`.
   * **Consumers must sanitize this value** (e.g. with DOMPurify) before
   * passing it in — this component does not perform XSS sanitization.
   */
  notes: string;
  createdBy?: string;
  dateEntered: string;
  lineout?: boolean;
  isLocked?: boolean;
  lockedBy?: string;
  deletedBy?: string;
  versions?: CaseNoteVersion[];
  currentVersion: number;
}

/** Payload emitted when a note is created or edited. */
export interface CaseNoteInput {
  /** Present when editing an existing note. */
  id?: string;
  noteDate: string;
  activity: string;
  caseManager: string;
  notes: string;
}

export interface NoteSelectOption {
  value: string;
  label: string;
}

/** Template option; selecting one seeds the editor content. */
export interface NoteTemplateOption extends NoteSelectOption {
  /** Plain-text template body (newlines become paragraphs). */
  content?: string;
}

export interface QuickAbsenceDraft {
  effectiveDate: string;
  status: string;
  otherName?: string;
}

export interface QuickRestrictionDraft {
  restriction: string;
  startDate: string;
  endDate?: string;
  isPermanent: boolean;
  notes?: string;
}

export interface QuickTodoDraft {
  activity: string;
  dateScheduled?: string;
}

export interface CaseNotesTabProps {
  /** All notes for the case (in display order). */
  notes: CaseNoteItem[];
  /** Activity options for the note form. */
  activityOptions: NoteSelectOption[];
  /** Case-note template options. */
  templateOptions?: NoteTemplateOption[];
  /** Case-manager options for the note form. */
  caseManagerOptions: NoteSelectOption[];
  /** Default case manager pre-selected when creating a note. */
  defaultCaseManager?: string;
  /** When true, the current user may lock/unlock and edit locked notes. */
  canLock?: boolean;
  /** Create/update a note. */
  onSaveNote: (input: CaseNoteInput) => void;
  /** Delete (soft-delete) a note by id. */
  onDeleteNote: (id: string) => void;
  /** Toggle a note lock; only rendered when `canLock` is true. */
  onToggleLock?: (id: string) => void;
  /** Render a diff between two HTML contents; enables the diff view. */
  renderDiff?: (oldContent: string, newContent: string) => string;
  /** Status options for quick-add absence; enables that section. */
  quickAbsenceStatusOptions?: NoteSelectOption[];
  onQuickAddAbsence?: (draft: QuickAbsenceDraft) => void;
  /** Restriction options for quick-add restriction; enables that section. */
  quickRestrictionOptions?: NoteSelectOption[];
  onQuickAddRestriction?: (draft: QuickRestrictionDraft) => void;
  /** Enables the quick-add to-do section. */
  onQuickAddTodo?: (draft: QuickTodoDraft) => void;
  className?: string;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate()
  ).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${formatDate(value)} ${d.toLocaleTimeString()}`;
}

/** Convert plain text (blank-line separated) into simple HTML paragraphs. */
function templateToHtml(text: string): string {
  return text
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

const todayIso = () => new Date().toISOString().split('T')[0];

/**
 * Presentational case-notes manager: list/detail views, a floating note editor
 * (rich text, activity/template/case-manager selects, optional quick-add panels
 * for absence/restriction/to-do), soft delete, admin lock/unlock, and a version
 * history modal with an optional diff view. All mutations are emitted via
 * callbacks; the container owns persistence, versioning, and activity logging.
 */
export const CaseNotesTab = forwardRef<HTMLDivElement, CaseNotesTabProps>(
  function CaseNotesTab(
    {
      notes,
      activityOptions,
      templateOptions,
      caseManagerOptions,
      defaultCaseManager,
      canLock = false,
      onSaveNote,
      onDeleteNote,
      onToggleLock,
      renderDiff,
      quickAbsenceStatusOptions,
      onQuickAddAbsence,
      quickRestrictionOptions,
      onQuickAddRestriction,
      onQuickAddTodo,
      className,
    },
    ref
  ) {
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [editorOpen, setEditorOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [editingNote, setEditingNote] = useState<CaseNoteItem | null>(null);
    const [validationError, setValidationError] = useState('');

    // Editor fields.
    const [noteDate, setNoteDate] = useState(todayIso());
    const [activity, setActivity] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [noteCaseManager, setNoteCaseManager] = useState(
      defaultCaseManager ?? ''
    );
    const [content, setContent] = useState('');

    // Version history.
    const [historyNote, setHistoryNote] = useState<CaseNoteItem | null>(null);
    const [diffMode, setDiffMode] = useState(false);
    const [compareIndex, setCompareIndex] = useState(0);

    // Quick-add panels.
    const [showQuickAbsence, setShowQuickAbsence] = useState(false);
    const [absenceDate, setAbsenceDate] = useState('');
    const [absenceStatus, setAbsenceStatus] = useState('');
    const [absenceOtherName, setAbsenceOtherName] = useState('');
    const [addedAbsences, setAddedAbsences] = useState<string[]>([]);

    const [showQuickRestriction, setShowQuickRestriction] = useState(false);
    const [restrictionType, setRestrictionType] = useState('');
    const [restrictionStart, setRestrictionStart] = useState(todayIso());
    const [restrictionEnd, setRestrictionEnd] = useState('');
    const [restrictionPermanent, setRestrictionPermanent] = useState(false);
    const [restrictionNotes, setRestrictionNotes] = useState('');
    const [addedRestrictions, setAddedRestrictions] = useState<string[]>([]);

    const [showQuickTodo, setShowQuickTodo] = useState(false);
    const [todoActivity, setTodoActivity] = useState('');
    const [todoDate, setTodoDate] = useState('');
    const [addedTodos, setAddedTodos] = useState<string[]>([]);

    useEffect(() => {
      // Reset quick-add session feedback whenever the editor closes.
      if (!editorOpen) {
        setAddedAbsences([]);
        setAddedRestrictions([]);
        setAddedTodos([]);
      }
    }, [editorOpen]);

    const openCreate = () => {
      setEditingNote(null);
      setNoteDate(todayIso());
      setActivity('');
      setSelectedTemplate('');
      setNoteCaseManager(defaultCaseManager ?? '');
      setContent('');
      setValidationError('');
      setMinimized(false);
      setEditorOpen(true);
    };

    const openEdit = (note: CaseNoteItem) => {
      if (note.isLocked && !canLock) {
        setValidationError(
          'This note is locked and can only be edited by an administrator.'
        );
        return;
      }
      setEditingNote(note);
      setNoteDate(note.noteDate);
      setActivity(note.activity);
      setSelectedTemplate('');
      setNoteCaseManager(note.caseManager);
      setContent(note.notes);
      setValidationError('');
      setMinimized(false);
      setEditorOpen(true);
    };

    const handleSave = () => {
      const missing: string[] = [];
      if (!activity) missing.push('Activity');
      if (!content) missing.push('Notes');
      if (missing.length > 0) {
        setValidationError(
          `Please fill in the required field${
            missing.length > 1 ? 's' : ''
          }: ${missing.join(', ')}`
        );
        return;
      }
      onSaveNote({
        id: editingNote?.id,
        noteDate,
        activity,
        caseManager: noteCaseManager,
        notes: content,
      });
      setValidationError('');
      setEditorOpen(false);
    };

    const handleTemplateChange = (value: string) => {
      setSelectedTemplate(value);
      const template = templateOptions?.find((t) => t.value === value);
      if (template?.content) {
        setContent(templateToHtml(template.content));
      }
    };

    const openHistory = (note: CaseNoteItem) => {
      setHistoryNote(note);
      setDiffMode(false);
      setCompareIndex(0);
    };

    const isLocked = (note: CaseNoteItem) => Boolean(note.isLocked) && !canLock;

    // Diff content derivation for the version history modal.
    const diffContent = (() => {
      if (!historyNote || !diffMode || !renderDiff) return null;
      const versions = historyNote.versions ?? [];
      if (versions.length === 0) return null;
      if (compareIndex === 0) {
        const older = versions[versions.length - 1];
        if (!older) return null;
        return {
          oldNumber: historyNote.currentVersion - 1,
          newNumber: historyNote.currentVersion,
          oldDate: older.editedAt,
          newDate: historyNote.dateEntered,
          oldEditor: older.editedBy,
          newEditor: historyNote.caseManager,
          html: renderDiff(older.content, historyNote.notes),
        };
      }
      const oldIdx = versions.length - compareIndex - 1;
      const newIdx = versions.length - compareIndex;
      if (oldIdx < 0 || newIdx >= versions.length) return null;
      const older = versions[oldIdx];
      const newer = versions[newIdx];
      if (!older || !newer) return null;
      return {
        oldNumber: historyNote.currentVersion - compareIndex - 1,
        newNumber: historyNote.currentVersion - compareIndex,
        oldDate: older.editedAt,
        newDate: newer.editedAt,
        oldEditor: older.editedBy,
        newEditor: newer.editedBy,
        html: renderDiff(older.content, newer.content),
      };
    })();

    const submitQuickAbsence = () => {
      if (!onQuickAddAbsence || !absenceDate || !absenceStatus) return;
      if (absenceStatus === 'OTH' && !absenceOtherName) return;
      onQuickAddAbsence({
        effectiveDate: absenceDate,
        status: absenceStatus,
        otherName: absenceStatus === 'OTH' ? absenceOtherName : undefined,
      });
      setAddedAbsences((prev) => [
        ...prev,
        `${absenceDate} - ${absenceStatus}`,
      ]);
      setAbsenceDate('');
      setAbsenceStatus('');
      setAbsenceOtherName('');
    };

    const submitQuickRestriction = () => {
      if (!onQuickAddRestriction || !restrictionType || !restrictionStart)
        return;
      onQuickAddRestriction({
        restriction: restrictionType,
        startDate: restrictionStart,
        endDate: restrictionEnd || undefined,
        isPermanent: restrictionPermanent,
        notes: restrictionNotes || undefined,
      });
      setAddedRestrictions((prev) => [...prev, restrictionType]);
      setRestrictionType('');
      setRestrictionStart(todayIso());
      setRestrictionEnd('');
      setRestrictionPermanent(false);
      setRestrictionNotes('');
    };

    const submitQuickTodo = () => {
      if (!onQuickAddTodo || !todoActivity) return;
      onQuickAddTodo({
        activity: todoActivity,
        dateScheduled: todoDate || undefined,
      });
      setAddedTodos((prev) => [...prev, todoActivity]);
      setTodoActivity('');
      setTodoDate('');
    };

    return (
      <div
        ref={ref}
        data-slot="case-notes-tab"
        className={cn('space-y-6', className)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Case Notes</h3>
            <p className="text-muted-foreground text-sm">
              {notes.length} note{notes.length !== 1 ? 's' : ''} for this case
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="border-border flex overflow-hidden rounded-md border">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="mr-1 h-4 w-4" aria-hidden="true" />
                List
              </Button>
              <Button
                variant={viewMode === 'detail' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('detail')}
                className="rounded-l-none"
              >
                <LayoutList className="mr-1 h-4 w-4" aria-hidden="true" />
                Detail
              </Button>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Case Note
            </Button>
          </div>
        </div>

        {validationError && !editorOpen && (
          <Alert variant="danger">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {viewMode === 'list' ? (
          <div className="border-border rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Notes Preview</TableHead>
                  <TableHead>Case Manager</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No case notes yet. Click &quot;Add Case Note&quot; to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((note) => (
                    <TableRow
                      key={note.id}
                      className={note.lineout ? 'opacity-60' : undefined}
                    >
                      <TableCell
                        className={cn(
                          'font-medium',
                          note.lineout && 'line-through'
                        )}
                      >
                        {formatDate(note.noteDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{note.activity}</Badge>
                          {note.isLocked && (
                            <Lock
                              className="text-muted-foreground h-3 w-3"
                              aria-label="Locked"
                            />
                          )}
                          {note.lineout && (
                            <Badge variant="danger" size="sm">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span
                          className={cn(
                            'text-muted-foreground block truncate text-sm',
                            note.lineout && 'line-through'
                          )}
                        >
                          {stripHtmlTags(note.notes).slice(0, 100)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={note.lineout ? 'line-through' : undefined}
                      >
                        {note.caseManager}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" size="sm">
                          v{note.currentVersion}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {note.versions && note.versions.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openHistory(note)}
                              aria-label={`View version history: ${note.activity}`}
                            >
                              <History className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          {canLock && onToggleLock && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onToggleLock(note.id)}
                              aria-label={
                                note.isLocked
                                  ? `Unlock note: ${note.activity}`
                                  : `Lock note: ${note.activity}`
                              }
                            >
                              {note.isLocked ? (
                                <Lock className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Unlock
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(note)}
                            disabled={isLocked(note) || note.lineout}
                            aria-label={`Edit note: ${note.activity}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onDeleteNote(note.id)}
                            disabled={isLocked(note) || note.lineout}
                            aria-label={`Delete note: ${note.activity}`}
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
        ) : (
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="border-border text-muted-foreground rounded-lg border p-8 text-center">
                No case notes yet. Click &quot;Add Case Note&quot; to get
                started.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    'border-border overflow-hidden rounded-lg border',
                    note.lineout && 'opacity-60'
                  )}
                >
                  <div className="border-border bg-muted/30 flex items-center justify-between border-b p-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Date
                        </div>
                        <div
                          className={cn(
                            'font-medium',
                            note.lineout && 'line-through'
                          )}
                        >
                          {formatDate(note.noteDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Activity
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{note.activity}</Badge>
                          {note.isLocked && (
                            <Badge variant="secondary" size="sm">
                              Locked
                            </Badge>
                          )}
                          {note.lineout && (
                            <Badge variant="danger">Deleted</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Case Manager
                        </div>
                        <div
                          className={note.lineout ? 'line-through' : undefined}
                        >
                          {note.caseManager}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Version
                        </div>
                        <Badge variant="secondary" size="sm">
                          v{note.currentVersion}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {note.versions && note.versions.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistory(note)}
                        >
                          <History
                            className="mr-1 h-4 w-4"
                            aria-hidden="true"
                          />
                          History
                        </Button>
                      )}
                      {canLock && onToggleLock && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleLock(note.id)}
                          disabled={note.lineout}
                        >
                          {note.isLocked ? (
                            <Lock className="mr-1 h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Unlock
                              className="mr-1 h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                          {note.isLocked ? 'Unlock' : 'Lock'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(note)}
                        disabled={isLocked(note) || note.lineout}
                      >
                        <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
                        disabled={isLocked(note) || note.lineout}
                      >
                        <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="bg-background p-6">
                    <div className="text-muted-foreground mb-2 text-xs font-medium">
                      NOTE CONTENT
                    </div>
                    <div
                      className={cn(
                        'prose prose-sm max-w-none',
                        note.lineout && 'line-through'
                      )}
                      dangerouslySetInnerHTML={{
                        __html:
                          note.notes ||
                          "<p class='text-muted-foreground italic'>No content</p>",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Version history modal */}
        <Modal
          open={Boolean(historyNote)}
          onOpenChange={(open) => {
            if (!open) setHistoryNote(null);
          }}
          size="4xl"
        >
          <ModalHeader>
            <ModalTitle>Version History</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Current version: v{historyNote?.currentVersion}
            </p>
            {renderDiff && (
              <div className="border-border flex flex-wrap items-center gap-3 border-b pb-4">
                <Button
                  variant={!diffMode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDiffMode(false)}
                >
                  All Versions
                </Button>
                <Button
                  variant={diffMode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDiffMode(true)}
                  disabled={
                    !historyNote?.versions || historyNote.versions.length === 0
                  }
                >
                  Show Differences
                </Button>
                {diffMode &&
                  historyNote &&
                  (historyNote.versions?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareIndex((i) => i + 1)}
                        disabled={
                          compareIndex >= (historyNote.versions?.length ?? 0)
                        }
                      >
                        <ChevronLeft
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        Older
                      </Button>
                      <span className="text-muted-foreground text-sm whitespace-nowrap">
                        Comparing v{diffContent?.oldNumber} → v
                        {diffContent?.newNumber}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCompareIndex((i) => Math.max(0, i - 1))
                        }
                        disabled={compareIndex === 0}
                      >
                        Newer
                        <ChevronRight
                          className="ml-1 h-4 w-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {diffMode && diffContent ? (
              <div className="border-border bg-muted/30 rounded-lg border p-4">
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div>
                    <Badge variant="outline">v{diffContent.oldNumber}</Badge>
                    <div className="text-muted-foreground mt-1">
                      {formatDateTime(diffContent.oldDate)}
                    </div>
                    <div className="text-xs">{diffContent.oldEditor}</div>
                  </div>
                  <div className="text-muted-foreground">→</div>
                  <div>
                    <Badge>v{diffContent.newNumber}</Badge>
                    <div className="text-muted-foreground mt-1">
                      {formatDateTime(diffContent.newDate)}
                    </div>
                    <div className="text-xs">{diffContent.newEditor}</div>
                  </div>
                </div>
                <div
                  className="prose prose-sm border-border bg-background max-w-none rounded border p-4 break-words"
                  dangerouslySetInnerHTML={{ __html: diffContent.html }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {historyNote && (
                  <div className="border-border bg-primary-50 rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Badge>v{historyNote.currentVersion}</Badge>
                      <Badge variant="secondary">Current</Badge>
                      <span className="text-muted-foreground text-sm">
                        {formatDateTime(historyNote.dateEntered)}
                      </span>
                      <span className="text-sm">
                        by {historyNote.caseManager}
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: historyNote.notes }}
                    />
                  </div>
                )}
                {historyNote?.versions
                  ?.slice()
                  .reverse()
                  .map((version, index) => {
                    const versionNumber =
                      (historyNote.currentVersion ?? 0) - 1 - index;
                    return (
                      <div
                        key={version.id}
                        className="border-border rounded-lg border p-4"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <Badge variant="outline">v{versionNumber}</Badge>
                          <span className="text-muted-foreground text-sm">
                            {formatDateTime(version.editedAt)}
                          </span>
                          <span className="text-sm">by {version.editedBy}</span>
                        </div>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: version.content }}
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </ModalBody>
        </Modal>

        {/* Note editor */}
        <FloatingWindow
          open={editorOpen}
          minimized={minimized}
          onClose={() => setEditorOpen(false)}
          onMinimize={() => setMinimized(true)}
          title={
            editingNote
              ? `Edit Note (v${editingNote.currentVersion})`
              : 'Create Note'
          }
          aria-label="Case note editor"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Note</Button>
            </div>
          }
        >
          <div className="space-y-4 p-6">
            {validationError && (
              <Alert variant="danger">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {editingNote?.isLocked && (
              <Alert>
                <Lock className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  This note is locked by {editingNote.lockedBy}.{' '}
                  {!canLock && 'Only administrators can edit locked notes.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="case-note-date" className="text-xs">
                  Note Date
                </Label>
                <Input
                  id="case-note-date"
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Activity <span className="text-destructive">*</span>
                </Label>
                <Select
                  aria-label="Note activity"
                  value={activity}
                  onValueChange={(value) => {
                    setActivity(value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="Select activity..."
                  options={activityOptions}
                />
              </div>
              {templateOptions && templateOptions.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Case Note Template</Label>
                  <Select
                    aria-label="Case note template"
                    value={selectedTemplate}
                    onValueChange={handleTemplateChange}
                    placeholder="Select template..."
                    options={templateOptions}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Case Manager</Label>
                <Select
                  aria-label="Note case manager"
                  value={noteCaseManager}
                  onValueChange={setNoteCaseManager}
                  placeholder="Select case manager..."
                  options={caseManagerOptions}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                Notes <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={content}
                onChange={(value) => {
                  setContent(value);
                  if (validationError) setValidationError('');
                }}
                placeholder="Type your case notes here..."
              />
            </div>

            {onQuickAddAbsence && quickAbsenceStatusOptions && (
              <QuickPanel
                icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
                title="Quick Add Absence Entry"
                open={showQuickAbsence}
                onToggle={() => setShowQuickAbsence((v) => !v)}
                added={addedAbsences}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Effective Date</Label>
                    <Input
                      type="date"
                      aria-label="Quick absence effective date"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select
                      aria-label="Quick absence status"
                      value={absenceStatus}
                      onValueChange={setAbsenceStatus}
                      placeholder="Select status..."
                      options={quickAbsenceStatusOptions}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={submitQuickAbsence}
                      disabled={
                        !absenceDate ||
                        !absenceStatus ||
                        (absenceStatus === 'OTH' && !absenceOtherName)
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                </div>
                {absenceStatus === 'OTH' && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Other Name</Label>
                    <Input
                      aria-label="Quick absence other name"
                      value={absenceOtherName}
                      onChange={(e) => setAbsenceOtherName(e.target.value)}
                      placeholder="Enter other name..."
                    />
                  </div>
                )}
              </QuickPanel>
            )}

            {onQuickAddRestriction && quickRestrictionOptions && (
              <QuickPanel
                icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
                title="Quick Add Restriction"
                open={showQuickRestriction}
                onToggle={() => setShowQuickRestriction((v) => !v)}
                added={addedRestrictions}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Restriction Type</Label>
                    <Select
                      aria-label="Quick restriction type"
                      value={restrictionType}
                      onValueChange={setRestrictionType}
                      placeholder="Select restriction..."
                      options={quickRestrictionOptions}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      aria-label="Quick restriction start date"
                      value={restrictionStart}
                      onChange={(e) => setRestrictionStart(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      aria-label="Quick restriction end date"
                      value={restrictionEnd}
                      onChange={(e) => setRestrictionEnd(e.target.value)}
                      disabled={restrictionPermanent}
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <Checkbox
                      label="Permanent"
                      checked={restrictionPermanent}
                      onChange={(e) => {
                        setRestrictionPermanent(e.target.checked);
                        if (e.target.checked) setRestrictionEnd('');
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={submitQuickRestriction}
                      disabled={!restrictionType || !restrictionStart}
                    >
                      <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    aria-label="Quick restriction notes"
                    value={restrictionNotes}
                    onChange={(e) => setRestrictionNotes(e.target.value)}
                    placeholder="Optional notes..."
                  />
                </div>
              </QuickPanel>
            )}

            {onQuickAddTodo && (
              <QuickPanel
                icon={<ListTodo className="h-4 w-4" aria-hidden="true" />}
                title="Quick Add To-Do"
                open={showQuickTodo}
                onToggle={() => setShowQuickTodo((v) => !v)}
                added={addedTodos}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-xs">Activity</Label>
                    <Input
                      aria-label="Quick to-do activity"
                      value={todoActivity}
                      onChange={(e) => setTodoActivity(e.target.value)}
                      placeholder="Enter to-do activity..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      aria-label="Quick to-do due date"
                      value={todoDate}
                      onChange={(e) => setTodoDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={submitQuickTodo}
                    disabled={!todoActivity}
                  >
                    <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                    Add To-Do
                  </Button>
                </div>
              </QuickPanel>
            )}
          </div>
        </FloatingWindow>
      </div>
    );
  }
);

interface QuickPanelProps {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  added: string[];
  children: React.ReactNode;
}

/** Collapsible quick-entry panel used inside the note editor. */
function QuickPanel({
  icon,
  title,
  open,
  onToggle,
  added,
  children,
}: QuickPanelProps) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <button
        type="button"
        className="bg-muted/40 hover:bg-muted/60 flex w-full items-center justify-between px-4 py-2 text-sm font-medium transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="border-border space-y-3 border-t p-4">
          {children}
          {added.length > 0 && (
            <div className="text-muted-foreground space-x-1 text-xs">
              <span className="font-medium">Added this session:</span>
              {added.map((item, i) => (
                <Badge key={`${item}-${i}`} variant="secondary" size="sm">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
