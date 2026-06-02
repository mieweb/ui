import { forwardRef, useEffect, useId, useState } from 'react';
import { LayoutList, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import { RichTextEditor } from '../RichTextEditor';
import { FloatingWindow } from '../FloatingWindow';
import { AlertDialog } from '../AlertDialog';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A letter attached to a case. */
export interface CaseLetter {
  id: string;
  letterType: string;
  template: string;
  sentFrom: string;
  content: string;
  createdDate: string;
  sentDate?: string;
  status: 'Draft' | 'Sent';
  attachmentItemTypes?: string[];
  additionalItems?: string;
}

/** Fields supplied from the editor when saving or sending a letter. */
export interface CaseLetterInput {
  /** Present when editing an existing letter. */
  id?: string;
  letterType: string;
  template: string;
  sentFrom: string;
  content: string;
  attachmentItemTypes: string[];
}

/** A reusable letter template. */
export interface CaseLetterTemplateOption {
  code: string;
  name?: string;
  content?: string;
  active?: boolean;
}

/** A new template created from the current letter content. */
export interface NewLetterTemplate {
  code: string;
  name: string;
  description?: string;
  content: string;
}

/** A selectable "needs to be attached" item. */
export interface LetterAttachmentItemType {
  id: string;
  label: string;
}

/** A selectable case manager option. */
export interface LetterCaseManagerOption {
  value: string;
  label: string;
}

/** Default attachment item types (alphabetized) used when none are supplied. */
export const DEFAULT_LETTER_ATTACHMENT_ITEM_TYPES: LetterAttachmentItemType[] =
  [
    { id: 'a2k-informational', label: 'A2K Informational Process Pamphlet' },
    { id: 'ada-accommodation-request', label: 'ADA Accommodation Request' },
    { id: 'aetna-maternity', label: 'Aetna Enhanced Maternity Fact Sheet' },
    { id: 'disability-guidelines', label: 'Disability Process Guidelines' },
    { id: 'eap-flyer', label: 'EAP Flyer' },
    {
      id: 'maternity-pay-example',
      label: 'Maternity Pay Example (Salaried only)',
    },
    { id: 'maven-flyer', label: 'Maven Flyer' },
    { id: 'nj-forms', label: 'New Jersey Forms' },
    {
      id: 'rejuvenate-flyer',
      label: 'Rejuvenate Flyer (Kidney Disease/Transplants)',
    },
    {
      id: 'sal-hrly-responsibilities',
      label: 'Sal/Hrly Responsibilities Letter',
    },
    {
      id: 'std-application-full',
      label: 'STD Application - Full, case to already be opened',
    },
    { id: 'std-application-partial', label: 'STD Application - Partial' },
    { id: 'std-reimbursement', label: 'STD Reimbursement Agreement' },
    { id: 'usw-responsibilities', label: 'USW Responsibilities Letter' },
    { id: 'other', label: 'Other' },
  ];

export interface CaseLettersTabProps {
  /** Letters to display. */
  letters: CaseLetter[];
  /** Available letter templates for the editor's template picker. */
  templates: CaseLetterTemplateOption[];
  /** Case managers available in the "Letter Sent From" picker. */
  caseManagers: LetterCaseManagerOption[];
  /** Default sender (e.g. the case's assigned manager). */
  defaultSentFrom?: string;
  /** Attachment item types. Defaults to {@link DEFAULT_LETTER_ATTACHMENT_ITEM_TYPES}. */
  attachmentItemTypes?: LetterAttachmentItemType[];
  /** Resolves mustache variables in template/letter content. Defaults to identity. */
  evaluateTemplate?: (content: string) => string;
  /** Save the editor's contents as a draft (add when no id, update otherwise). */
  onSaveDraft: (letter: CaseLetterInput) => void;
  /** Save and mark the editor's contents as sent. */
  onSendLetter: (letter: CaseLetterInput) => void;
  /** Delete a letter by id. */
  onDeleteLetter: (id: string) => void;
  /** Save the current content as a reusable template. Hidden when omitted. */
  onSaveAsTemplate?: (template: NewLetterTemplate) => void;
  className?: string;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Convert plain text (with blank-line paragraphs) to simple HTML. */
function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Presentational letters manager for a case. Provides list/detail views, a
 * floating editor (template picker, rich-text content, attachment-item
 * checklist), save-draft/send actions, deletion, and an optional
 * save-as-template flow. All persistence and side effects (todo generation,
 * storage) are delegated to callbacks.
 */
export const CaseLettersTab = forwardRef<HTMLDivElement, CaseLettersTabProps>(
  function CaseLettersTab(
    {
      letters,
      templates,
      caseManagers,
      defaultSentFrom = '',
      attachmentItemTypes = DEFAULT_LETTER_ATTACHMENT_ITEM_TYPES,
      evaluateTemplate = (c) => c,
      onSaveDraft,
      onSendLetter,
      onDeleteLetter,
      onSaveAsTemplate,
      className,
    },
    ref
  ) {
    const baseId = useId();

    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [editorOpen, setEditorOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [editing, setEditing] = useState<CaseLetter | null>(null);
    const [pendingDelete, setPendingDelete] = useState<CaseLetter | null>(null);

    // Editor form state.
    const [sentFrom, setSentFrom] = useState(defaultSentFrom);
    const [template, setTemplate] = useState('');
    const [content, setContent] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [otherDescription, setOtherDescription] = useState('');

    // Save-as-template dialog state.
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateCode, setNewTemplateCode] = useState('');
    const [newTemplateDescription, setNewTemplateDescription] = useState('');

    useEffect(() => {
      if (!editorOpen) return;
      setSentFrom((prev) => prev || defaultSentFrom);
    }, [editorOpen, defaultSentFrom]);

    const templateName =
      templates.find((t) => t.code === template)?.name || template || 'Draft';

    const resetEditor = () => {
      setEditing(null);
      setSentFrom(defaultSentFrom);
      setTemplate('');
      setContent('');
      setSelectedTypes([]);
      setOtherDescription('');
    };

    const openCreate = () => {
      resetEditor();
      setEditorOpen(true);
      setMinimized(false);
    };

    const openEdit = (letter: CaseLetter) => {
      setEditing(letter);
      setSentFrom(letter.sentFrom);
      setTemplate(letter.template);
      setContent(letter.content);
      setSelectedTypes(letter.attachmentItemTypes ?? []);
      setOtherDescription('');
      setEditorOpen(true);
      setMinimized(false);
    };

    const handleTemplateChange = (code: string) => {
      setTemplate(code);
      const selected = templates.find((t) => t.code === code);
      if (selected?.content) {
        const evaluated = evaluateTemplate(selected.content);
        const isHtml = /<[a-z][^>]*>/i.test(evaluated);
        setContent(isHtml ? evaluated : textToHtml(evaluated));
      }
    };

    const otherInvalid =
      selectedTypes.includes('other') && !otherDescription.trim();

    const buildInput = (): CaseLetterInput => {
      const finalTypes = selectedTypes.map((type) =>
        type === 'other' && otherDescription
          ? `other: ${otherDescription}`
          : type
      );
      return {
        id: editing?.id,
        letterType: templateName,
        template,
        sentFrom,
        content: evaluateTemplate(content),
        attachmentItemTypes: finalTypes,
      };
    };

    const handleSaveDraft = () => {
      if (otherInvalid) return;
      onSaveDraft(buildInput());
      setEditorOpen(false);
      setMinimized(false);
    };

    const handleSend = () => {
      if (otherInvalid) return;
      onSendLetter(buildInput());
      setEditorOpen(false);
      setMinimized(false);
    };

    const confirmDelete = () => {
      if (!pendingDelete) return;
      onDeleteLetter(pendingDelete.id);
      setPendingDelete(null);
    };

    const handleConfirmSaveTemplate = () => {
      if (!newTemplateName || !newTemplateCode || !onSaveAsTemplate) return;
      onSaveAsTemplate({
        code: newTemplateCode.toLowerCase().replace(/\s+/g, '-'),
        name: newTemplateName,
        description: newTemplateDescription,
        content,
      });
      setTemplateDialogOpen(false);
      setNewTemplateName('');
      setNewTemplateCode('');
      setNewTemplateDescription('');
    };

    const editorTitle = editing ? 'Edit Letter' : 'Create Letter';

    return (
      <div
        ref={ref}
        data-slot="case-letters-tab"
        className={cn('space-y-6', className)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Letters</h3>
            <p className="text-muted-foreground text-sm">
              {letters.length} letter{letters.length !== 1 ? 's' : ''} for this
              case
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="border-border flex rounded-md border">
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
              Create Letter
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="border-border rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Files to Attach</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No letters created yet. Click &quot;Create Letter&quot; to
                      get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  letters.map((letter) => (
                    <TableRow key={letter.id}>
                      <TableCell>{formatDate(letter.createdDate)}</TableCell>
                      <TableCell>{letter.template || '—'}</TableCell>
                      <TableCell>{letter.sentFrom}</TableCell>
                      <TableCell>
                        {letter.attachmentItemTypes &&
                        letter.attachmentItemTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {letter.attachmentItemTypes
                              .slice(0, 2)
                              .map((typeId) => {
                                const typeLabel =
                                  attachmentItemTypes.find(
                                    (t) => t.id === typeId
                                  )?.label || typeId;
                                return (
                                  <Badge
                                    key={typeId}
                                    variant="warning"
                                    size="sm"
                                  >
                                    {typeLabel}
                                  </Badge>
                                );
                              })}
                            {letter.attachmentItemTypes.length > 2 && (
                              <span className="text-muted-foreground text-xs">
                                +{letter.attachmentItemTypes.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            letter.status === 'Sent' ? 'default' : 'secondary'
                          }
                        >
                          {letter.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit letter: ${letter.letterType}`}
                            onClick={() => openEdit(letter)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Delete letter: ${letter.letterType}`}
                            onClick={() => setPendingDelete(letter)}
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
            {letters.length === 0 ? (
              <div className="border-border text-muted-foreground rounded-lg border p-8 text-center">
                No letters created yet. Click &quot;Create Letter&quot; to get
                started.
              </div>
            ) : (
              letters.map((letter) => (
                <div
                  key={letter.id}
                  className="border-border overflow-hidden rounded-lg border"
                >
                  <div className="border-border bg-muted flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Date
                        </div>
                        <div className="font-medium">
                          {formatDate(letter.createdDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Template
                        </div>
                        <div>{letter.template || '—'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          From
                        </div>
                        <div>{letter.sentFrom}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          Status
                        </div>
                        <Badge
                          variant={
                            letter.status === 'Sent' ? 'default' : 'secondary'
                          }
                        >
                          {letter.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(letter)}
                      >
                        <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingDelete(letter)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="bg-card p-6">
                    <div className="text-muted-foreground mb-2 text-xs font-medium">
                      LETTER CONTENT
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          letter.content ||
                          "<p class='text-muted-foreground italic'>No content</p>",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <FloatingWindow
          open={editorOpen}
          minimized={minimized}
          title={editorTitle}
          onClose={() => setEditorOpen(false)}
          onMinimize={() => setMinimized(true)}
          footer={
            <div className="flex w-full items-center justify-between">
              {onSaveAsTemplate ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTemplateDialogOpen(true);
                    setNewTemplateName('');
                    setNewTemplateCode('');
                    setNewTemplateDescription('');
                  }}
                >
                  Save as Template
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button onClick={handleSend}>Send Letter</Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-from`} className="text-xs">
                  Letter Sent From
                </Label>
                <Select
                  aria-label="Letter sent from"
                  value={sentFrom}
                  onValueChange={setSentFrom}
                  placeholder="Select case manager..."
                  options={caseManagers}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-template`} className="text-xs">
                  Letter Template
                </Label>
                <Select
                  aria-label="Letter template"
                  value={template}
                  onValueChange={handleTemplateChange}
                  placeholder="Select template..."
                  options={templates
                    .filter((t) => t.active !== false)
                    .map((t) => ({ value: t.code, label: t.name || t.code }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Letter Content</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Type your letter content here or select a template..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Items that need to be attached to the letter
              </Label>
              <div className="border-border bg-muted max-h-[180px] space-y-2 overflow-y-auto rounded-md border p-3">
                {attachmentItemTypes.map((type) => {
                  const isSelected = selectedTypes.includes(type.id);
                  return (
                    <div key={type.id} className="space-y-2">
                      <Checkbox
                        label={type.label}
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedTypes((prev) =>
                            checked
                              ? [...prev, type.id]
                              : prev.filter((t) => t !== type.id)
                          );
                          if (!checked && type.id === 'other') {
                            setOtherDescription('');
                          }
                        }}
                      />
                      {type.id === 'other' && isSelected && (
                        <div className="ml-6">
                          <Input
                            aria-label="Other attachment description"
                            placeholder="Please specify what 'Other' means (required)"
                            value={otherDescription}
                            onChange={(e) =>
                              setOtherDescription(e.target.value)
                            }
                            className={cn(
                              !otherDescription && 'border-destructive'
                            )}
                          />
                          {!otherDescription && (
                            <p className="text-destructive mt-1 text-xs">
                              This field is required when Other is selected
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </FloatingWindow>

        {onSaveAsTemplate && (
          <Modal open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <ModalHeader>
              <ModalTitle>Save as Template</ModalTitle>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Save this letter as a reusable template. Use Mustache tags like{' '}
                {'{{employeeName}}'} in your content.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-tpl-name`}>Template Name</Label>
                <Input
                  id={`${baseId}-tpl-name`}
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Welcome Letter"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-tpl-code`}>Template Code</Label>
                <Input
                  id={`${baseId}-tpl-code`}
                  value={newTemplateCode}
                  onChange={(e) => setNewTemplateCode(e.target.value)}
                  placeholder="e.g., welcome-letter"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${baseId}-tpl-desc`}>
                  Description (Optional)
                </Label>
                <Input
                  id={`${baseId}-tpl-desc`}
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Brief description of when to use this template"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => setTemplateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSaveTemplate}
                disabled={!newTemplateName || !newTemplateCode}
              >
                Save Template
              </Button>
            </ModalFooter>
          </Modal>
        )}

        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          title="Delete letter?"
          description="Are you sure you want to delete this letter? This action cannot be undone."
          actionLabel="Delete"
          variant="destructive"
          onAction={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    );
  }
);
