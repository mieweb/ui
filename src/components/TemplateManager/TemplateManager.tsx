import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AlertDialog } from '../AlertDialog';
import { Badge } from '../Badge';
import { Button } from '../Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../Card';
import { Input } from '../Input';
import { Label } from '../Label';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import { RichTextEditor, type RichTextVariableGroup } from '../RichTextEditor';
import { Select } from '../Select';

/** A stored template (e.g. a letter or case-note template). */
export interface TemplateItem {
  id: string;
  code: string;
  name?: string;
  description?: string;
  content?: string;
  active: boolean;
}

/** The editable fields of a template. */
export interface TemplateInput {
  code: string;
  name: string;
  description: string;
  content: string;
  active: boolean;
}

export interface TemplateManagerProps {
  /** Existing templates to manage. */
  templates: TemplateItem[];
  /** Create a new template. */
  onAdd: (template: TemplateInput) => void;
  /** Update an existing template. */
  onUpdate: (id: string, updates: Partial<TemplateInput>) => void;
  /** Delete a template. */
  onDelete: (id: string) => void;
  /** Singular entity label, e.g. "Letter Template" or "Case Note Template". */
  entityLabel: string;
  /** Description shown on the "add" card. */
  addDescription?: React.ReactNode;
  /** Description shown on the "existing templates" card. */
  listDescription?: React.ReactNode;
  /** Optional hint rendered above the content editor (e.g. Mustache variables). */
  contentHint?: React.ReactNode;
  /** Variable groups passed to the rich-text editor. */
  variableGroups?: RichTextVariableGroup[];
  /** Modal size for the editor dialog. */
  size?: 'lg' | '2xl' | '4xl';
  className?: string;
}

const EMPTY: TemplateInput = {
  code: '',
  name: '',
  description: '',
  content: '',
  active: true,
};

/**
 * Manages a library of rich-text templates (letters, case notes, etc.). Renders
 * an "add" card, a list of existing templates with status badges and previews,
 * and a create/edit modal backed by the {@link RichTextEditor}. Presentational:
 * persistence is delegated to `onAdd`/`onUpdate`/`onDelete`.
 */
export function TemplateManager({
  templates,
  onAdd,
  onUpdate,
  onDelete,
  entityLabel,
  addDescription,
  listDescription,
  contentHint,
  variableGroups,
  size = '4xl',
  className,
}: TemplateManagerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [draft, setDraft] = useState<TemplateInput>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

  const openDialog = (template?: TemplateItem) => {
    if (template) {
      setEditing(template);
      setDraft({
        code: template.code,
        name: template.name ?? '',
        description: template.description ?? '',
        content: template.content ?? '',
        active: template.active,
      });
    } else {
      setEditing(null);
      setDraft(EMPTY);
    }
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setDraft(EMPTY);
  };

  const handleSave = () => {
    if (!draft.code || !draft.name) return;
    const data: TemplateInput = {
      ...draft,
      code: draft.code.toLowerCase().replace(/\s+/g, '-'),
    };
    if (editing) {
      onUpdate(editing.id, data);
    } else {
      onAdd(data);
    }
    closeDialog();
  };

  const setField = (patch: Partial<TemplateInput>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <div data-slot="template-manager" className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Add New {entityLabel}</CardTitle>
          {addDescription && (
            <CardDescription>{addDescription}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create {entityLabel}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing {entityLabel}s</CardTitle>
          {listDescription && (
            <CardDescription>{listDescription}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No {entityLabel.toLowerCase()}s defined yet. Create your first
                one above.
              </p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border-border space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{template.name}</h3>
                        <Badge
                          variant={template.active ? 'default' : 'secondary'}
                        >
                          {template.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Code: {template.code}
                      </p>
                      {template.description && (
                        <p className="text-muted-foreground text-sm">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        aria-label={`Edit ${template.name}`}
                        onClick={() => openDialog(template)}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        aria-label={`Delete ${template.name}`}
                        onClick={() => setDeleteTarget(template)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  {template.content && (
                    <div className="border-border mt-3 border-t pt-3">
                      <p className="mb-2 text-sm font-medium">
                        Template Preview:
                      </p>
                      <div
                        className="prose prose-sm bg-muted/30 text-muted-foreground max-h-32 max-w-none overflow-y-auto rounded p-3 text-sm"
                        dangerouslySetInnerHTML={{
                          __html:
                            template.content.length > 500
                              ? `${template.content.substring(0, 500)}...`
                              : template.content,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}
        size={size}
      >
        <ModalHeader>
          <ModalTitle>
            {editing ? `Edit ${entityLabel}` : `Create ${entityLabel}`}
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={draft.name}
                onChange={(e) => setField({ name: e.target.value })}
                placeholder="e.g., Initial Contact"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-code">Template Code *</Label>
              <Input
                id="template-code"
                value={draft.code}
                onChange={(e) => setField({ code: e.target.value })}
                placeholder="e.g., initial-contact"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-active">Status</Label>
              <Select
                aria-label="Status"
                value={draft.active ? 'active' : 'inactive'}
                onValueChange={(val) => setField({ active: val === 'active' })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              value={draft.description}
              onChange={(e) => setField({ description: e.target.value })}
              placeholder="Brief description of when to use this template"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Template Content</Label>
            {contentHint && (
              <p className="text-muted-foreground mb-2 text-sm">
                {contentHint}
              </p>
            )}
            <RichTextEditor
              value={draft.content}
              onChange={(content) => setField({ content })}
              variableGroups={variableGroups}
              className="min-h-[300px]"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!draft.code || !draft.name}>
            {editing ? 'Update Template' : 'Create Template'}
          </Button>
        </ModalFooter>
      </Modal>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${entityLabel}?`}
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
        variant="destructive"
        actionLabel="Delete"
        onAction={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
