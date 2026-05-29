import { useState } from 'react';
import {
  Check,
  Edit2,
  HelpCircle,
  Plus,
  TestTube,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
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
  ModalHeader,
  ModalTitle,
} from '../Modal';
import { Textarea } from '../Textarea';
import {
  TodoTemplateBuilder,
  TodoTemplateHelp,
  type TodoTemplateOption,
} from '../TodoTemplateBuilder';

/** A case type with its default (template) todo lines. */
export interface CaseTypeDefinition {
  id: string;
  name: string;
  defaultTodos: string[];
}

/** Values used to create a new case type (no id yet). */
export type NewCaseType = Omit<CaseTypeDefinition, 'id'>;

/** The anchor dates supplied to the todo-preview generator. */
export interface CaseTypePreviewAnchors {
  caseCreation: string;
  dateOfDisability?: string;
}

/** A todo produced by the preview generator. */
export interface CaseTypePreviewTodo {
  title: string;
  description?: string;
  dueDate: string;
}

export interface CaseTypeManagerProps {
  /** The current list of case types. */
  caseTypes: CaseTypeDefinition[];
  /** Called to create a new case type. */
  onAdd: (caseType: NewCaseType) => void;
  /** Called to update a case type. */
  onUpdate: (id: string, changes: Partial<NewCaseType>) => void;
  /** Called to delete a case type. */
  onDelete: (id: string) => void;
  /**
   * Generates a preview list of todos from template lines and anchor dates.
   * When omitted, the "Test" preview action is hidden.
   */
  onPreviewTodos?: (
    defaultTodos: string[],
    anchors: CaseTypePreviewAnchors
  ) => CaseTypePreviewTodo[];
  /** Document type options offered by the template builder. */
  templateDocumentTypes?: TodoTemplateOption[];
  /** Anchor date options offered by the template builder. */
  templateAnchorOptions?: TodoTemplateOption[];
  className?: string;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * A presentational manager for case types and their default todo templates.
 * Includes an inline template builder/help and an optional preview dialog that
 * delegates todo generation to {@link CaseTypeManagerProps.onPreviewTodos}.
 */
export function CaseTypeManager({
  caseTypes,
  onAdd,
  onUpdate,
  onDelete,
  onPreviewTodos,
  templateDocumentTypes,
  templateAnchorOptions,
  className,
}: CaseTypeManagerProps) {
  const [newName, setNewName] = useState('');
  const [newTodos, setNewTodos] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTodos, setEditTodos] = useState('');

  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderTarget, setBuilderTarget] = useState<'new' | 'edit'>('new');
  const [helpOpen, setHelpOpen] = useState(false);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewCaseCreation, setPreviewCaseCreation] = useState(todayIso());
  const [previewDisability, setPreviewDisability] = useState('');
  const [previewTodos, setPreviewTodos] = useState<CaseTypePreviewTodo[]>([]);

  const toLines = (value: string): string[] =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({ name: newName.trim(), defaultTodos: toLines(newTodos) });
    setNewName('');
    setNewTodos('');
  };

  const handleStartEdit = (caseType: CaseTypeDefinition) => {
    setEditingId(caseType.id);
    setEditName(caseType.name);
    setEditTodos(caseType.defaultTodos.join('\n'));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTodos('');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate(editingId, {
      name: editName.trim(),
      defaultTodos: toLines(editTodos),
    });
    handleCancelEdit();
  };

  const handleInsertTemplate = (template: string) => {
    if (builderTarget === 'edit') {
      setEditTodos((prev) => (prev ? `${prev}\n${template}` : template));
    } else {
      setNewTodos((prev) => (prev ? `${prev}\n${template}` : template));
    }
  };

  const openBuilder = (target: 'new' | 'edit') => {
    setBuilderTarget(target);
    setBuilderOpen(true);
  };

  const openPreview = (caseType: CaseTypeDefinition) => {
    setPreviewId(caseType.id);
    setPreviewCaseCreation(todayIso());
    setPreviewDisability('');
    setPreviewTodos([]);
  };

  const handleGeneratePreview = () => {
    if (!onPreviewTodos || !previewId) return;
    const caseType = caseTypes.find((ct) => ct.id === previewId);
    if (!caseType) return;
    setPreviewTodos(
      onPreviewTodos(caseType.defaultTodos, {
        caseCreation: previewCaseCreation,
        dateOfDisability: previewDisability || undefined,
      })
    );
  };

  const previewCaseType = caseTypes.find((ct) => ct.id === previewId) ?? null;

  const renderTemplateTools = (target: 'new' | 'edit') => (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => openBuilder(target)}
      >
        <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Template Builder
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setHelpOpen(true)}
      >
        <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
        Help
      </Button>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)} data-slot="case-type-manager">
      <Card>
        <CardHeader>
          <CardTitle>Add New Case Type</CardTitle>
          <CardDescription>
            Create a new case type with default todo items that will be assigned
            to new cases of this type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case-type-name">Case Type Name</Label>
            <Input
              id="case-type-name"
              placeholder="e.g., Short-term Disability"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-todos">
              Default Todo Items (one per line)
            </Label>
            {renderTemplateTools('new')}
            <Textarea
              id="default-todos"
              rows={6}
              placeholder={
                'e.g.,\nRequest medical documentation\nReview claim eligibility\nContact employee'
              }
              value={newTodos}
              onChange={(e) => setNewTodos(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={!newName.trim()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Case Type
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Case Types</CardTitle>
          <CardDescription>Manage and edit your case type templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {caseTypes.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No case types defined yet. Add your first case type above.
              </p>
            ) : (
              caseTypes.map((caseType) => (
                <div
                  key={caseType.id}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  {editingId === caseType.id ? (
                    <>
                      <div className="space-y-2">
                        <Label>Case Type Name</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Todo Items (one per line)</Label>
                        {renderTemplateTools('edit')}
                        <Textarea
                          rows={6}
                          value={editTodos}
                          onChange={(e) => setEditTodos(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="mr-2 h-4 w-4" aria-hidden="true" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium">{caseType.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {caseType.defaultTodos.length} default todo
                            {caseType.defaultTodos.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {onPreviewTodos && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreview(caseType)}
                            >
                              <TestTube
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              Test
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${caseType.name}`}
                            onClick={() => handleStartEdit(caseType)}
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            aria-label={`Delete ${caseType.name}`}
                            onClick={() => onDelete(caseType.id)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      {caseType.defaultTodos.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Default Todos:</p>
                          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {caseType.defaultTodos.map((todo, index) => (
                              <li key={index}>{todo}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <TodoTemplateBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onInsert={handleInsertTemplate}
        documentTypes={templateDocumentTypes}
        anchorOptions={templateAnchorOptions}
      />
      <TodoTemplateHelp open={helpOpen} onOpenChange={setHelpOpen} />

      <Modal
        open={previewId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
        size="3xl"
      >
        <ModalHeader>
          <ModalTitle>
            Test Todo Logic{previewCaseType ? `: ${previewCaseType.name}` : ''}
          </ModalTitle>
          <p className="text-sm text-muted-foreground">
            Set anchor dates to preview the generated todo list
          </p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preview-case-creation">Case Creation Date</Label>
              <Input
                id="preview-case-creation"
                type="date"
                value={previewCaseCreation}
                onChange={(e) => setPreviewCaseCreation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-disability">Date of Disability</Label>
              <Input
                id="preview-disability"
                type="date"
                value={previewDisability}
                onChange={(e) => setPreviewDisability(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGeneratePreview}>Generate Todo Preview</Button>
          {previewTodos.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 font-medium">
                Generated Todos ({previewTodos.length})
              </h4>
              <div className="space-y-2">
                {previewTodos.map((todo, index) => (
                  <div
                    key={index}
                    className="border-b border-border pb-2 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{todo.title}</p>
                        {todo.description && (
                          <p className="text-sm text-muted-foreground">
                            {todo.description}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-medium">{todo.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
