import * as React from 'react';
import { Upload, FileText, Pencil, Trash2, X, Check, Eye } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import { AlertDialog } from '../AlertDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A document attached to a case. */
export interface CaseDocument {
  id: string;
  /** YYYY-MM-DD. */
  dateReceived: string;
  documentType: string;
  receivedFrom: string;
  description: string;
  fileName?: string;
  fileSize?: number;
  fileDataUrl?: string;
  caseNumber?: string;
}

/** Payload for uploading a new document. */
export interface CaseDocumentDraft {
  documentType: string;
  receivedFrom: string;
  description: string;
  file: File | null;
}

/** Editable fields for an existing document. */
export interface CaseDocumentEdit {
  documentType: string;
  receivedFrom: string;
  description: string;
}

export interface CaseDocumentsTabProps
  extends React.HTMLAttributes<HTMLDivElement> {
  documents: CaseDocument[];
  /** Options for the document-type selector. */
  documentTypeOptions: { value: string; label: string }[];
  /** Called when a new document is uploaded. */
  onUpload: (draft: CaseDocumentDraft) => void;
  /** Called when an existing document's metadata is edited and saved. */
  onUpdateDocument: (id: string, edit: CaseDocumentEdit) => void;
  /** Called when a document is deleted. */
  onDeleteDocument: (id: string) => void;
  /** Called when the view action is invoked. When omitted, no view button is shown. */
  onViewDocument?: (doc: CaseDocument) => void;
}

const EMPTY_DRAFT: CaseDocumentDraft = {
  documentType: '',
  receivedFrom: '',
  description: '',
  file: null,
};

/**
 * Presentational case-documents manager: upload, list, inline-edit metadata,
 * delete (with confirmation), and optionally view. File reading/rendering is
 * delegated to the container via {@link CaseDocumentsTabProps.onUpload} and
 * {@link CaseDocumentsTabProps.onViewDocument}.
 */
export const CaseDocumentsTab = React.forwardRef<
  HTMLDivElement,
  CaseDocumentsTabProps
>(
  (
    {
      documents,
      documentTypeOptions,
      onUpload,
      onUpdateDocument,
      onDeleteDocument,
      onViewDocument,
      className,
      ...props
    },
    ref
  ) => {
    const [draft, setDraft] = React.useState<CaseDocumentDraft>(EMPTY_DRAFT);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editData, setEditData] = React.useState<CaseDocumentEdit>({
      documentType: '',
      receivedFrom: '',
      description: '',
    });

    const [toDelete, setToDelete] = React.useState<CaseDocument | null>(null);

    const sortedTypeOptions = React.useMemo(
      () =>
        [...documentTypeOptions].sort((a, b) =>
          a.label.localeCompare(b.label)
        ),
      [documentTypeOptions]
    );

    const typeName = (code: string) =>
      documentTypeOptions.find((t) => t.value === code)?.label ?? code;

    const resetForm = () => {
      setDraft(EMPTY_DRAFT);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = () => {
      if (!draft.documentType) return;
      onUpload(draft);
      resetForm();
    };

    const startEdit = (doc: CaseDocument) => {
      setEditingId(doc.id);
      setEditData({
        documentType: doc.documentType,
        receivedFrom: doc.receivedFrom,
        description: doc.description,
      });
    };

    const saveEdit = () => {
      if (!editingId) return;
      onUpdateDocument(editingId, editData);
      setEditingId(null);
    };

    return (
      <div
        ref={ref}
        data-slot="case-documents-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Documents</h3>
          <div className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''} for
            this case
          </div>
        </div>

        {/* Upload form */}
        <div className="rounded-lg border border-border bg-muted p-4">
          <div className="mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">Upload New Document</span>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="doc-type" className="text-sm text-muted-foreground">
                Document Type *
              </Label>
              <Select
                value={draft.documentType}
                onValueChange={(v) => setDraft({ ...draft, documentType: v })}
                placeholder="Select document type..."
                options={sortedTypeOptions}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="received-from" className="text-sm text-muted-foreground">
                Received From
              </Label>
              <Input
                id="received-from"
                value={draft.receivedFrom}
                onChange={(e) =>
                  setDraft({ ...draft, receivedFrom: e.target.value })
                }
                placeholder="Received from..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">File</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                  Choose File
                </Button>
                <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {draft.file ? draft.file.name : 'No file chosen'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  aria-label="Choose file"
                  onChange={(e) =>
                    setDraft({ ...draft, file: e.target.files?.[0] ?? null })
                  }
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="doc-description" className="text-sm text-muted-foreground">
                Description
              </Label>
              <Input
                id="doc-description"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                placeholder="Document description..."
              />
            </div>
            <Button onClick={handleUpload} disabled={!draft.documentType}>
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Documents table */}
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No documents uploaded
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.dateReceived}</TableCell>
                    <TableCell>
                      {editingId === doc.id ? (
                        <Select
                          aria-label="Edit document type"
                          value={editData.documentType}
                          onValueChange={(v) =>
                            setEditData({ ...editData, documentType: v })
                          }
                          options={sortedTypeOptions}
                        />
                      ) : (
                        typeName(doc.documentType)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === doc.id ? (
                        <Input
                          aria-label="Edit description"
                          value={editData.description}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              description: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        doc.description || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === doc.id ? (
                        <Input
                          aria-label="Edit received from"
                          value={editData.receivedFrom}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              receivedFrom: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        doc.receivedFrom || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.fileName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <FileText
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span
                            className="max-w-[120px] truncate"
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Save"
                            className="h-8 w-8 p-0"
                            onClick={saveEdit}
                          >
                            <Check
                              className="h-4 w-4 text-green-600"
                              aria-hidden="true"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Cancel"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingId(null)}
                          >
                            <X
                              className="h-4 w-4 text-destructive"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {onViewDocument && (doc.fileDataUrl || doc.fileName) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="View document"
                              className="h-8 w-8 p-0"
                              onClick={() => onViewDocument(doc)}
                            >
                              <Eye
                                className="h-4 w-4 text-primary-700"
                                aria-hidden="true"
                              />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Edit document"
                            className="h-8 w-8 p-0"
                            onClick={() => startEdit(doc)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Delete document"
                            className="h-8 w-8 p-0"
                            onClick={() => setToDelete(doc)}
                          >
                            <Trash2
                              className="h-4 w-4 text-destructive"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog
          open={toDelete !== null}
          onOpenChange={(open) => {
            if (!open) setToDelete(null);
          }}
          title="Delete Document"
          description="Are you sure you want to delete this document? This action cannot be undone."
          variant="destructive"
          actionLabel="Delete"
          onAction={() => {
            if (toDelete) onDeleteDocument(toDelete.id);
            setToDelete(null);
          }}
        >
          {toDelete && (
            <div className="rounded-md bg-muted p-3">
              <div className="font-medium">{typeName(toDelete.documentType)}</div>
              <div className="text-sm text-muted-foreground">
                {toDelete.description || 'No description'}
              </div>
            </div>
          )}
        </AlertDialog>
      </div>
    );
  }
);

CaseDocumentsTab.displayName = 'CaseDocumentsTab';
