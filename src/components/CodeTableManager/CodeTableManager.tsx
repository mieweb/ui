import { useState } from 'react';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Button } from '../Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../Card';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';

/** A single configurable code-table row. */
export interface CodeTableItem {
  id: string;
  code: string;
  description?: string;
  active: boolean;
  /** Optional grouping value (e.g. region or pay-code category). */
  category?: string;
}

/** Values used to create a new code-table row (no id yet). */
export type NewCodeTableItem = Omit<CodeTableItem, 'id'>;

export interface CodeTableManagerProps {
  /** Heading used for the add/edit cards (e.g. "Case Status Codes"). */
  title: string;
  /** Supporting description for the add card. */
  description: string;
  /** The current list of items. */
  items: CodeTableItem[];
  /** Called to create a new item. */
  onAdd: (item: NewCodeTableItem) => void;
  /** Called to update an existing item. */
  onUpdate: (id: string, changes: Partial<NewCodeTableItem>) => void;
  /** Called to delete an item. */
  onDelete: (id: string) => void;
  /** When true, a description field is shown for each item. */
  hasDescription?: boolean;
  /** Label for the primary "code" field. Defaults to "Code". */
  codeLabel?: string;
  /** Label for the add button. Defaults to "Add Code". */
  addButtonLabel?: string;
  /**
   * When provided, a category dropdown is shown and existing items are grouped
   * under category headings (used for locations by region or pay codes by
   * category).
   */
  categoryOptions?: string[];
  /** Placeholder for the category dropdown. */
  categoryPlaceholder?: string;
  className?: string;
}

/**
 * A reusable, presentational create/edit/delete manager for simple
 * code tables made up of a code, optional description, optional category, and
 * an active flag. All persistence is delegated to the `onAdd`, `onUpdate`, and
 * `onDelete` callbacks.
 */
export function CodeTableManager({
  title,
  description,
  items,
  onAdd,
  onUpdate,
  onDelete,
  hasDescription = false,
  codeLabel = 'Code',
  addButtonLabel = 'Add Code',
  categoryOptions,
  categoryPlaceholder = 'Select category',
  className,
}: CodeTableManagerProps) {
  const hasCategory = Boolean(categoryOptions && categoryOptions.length > 0);

  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editActive, setEditActive] = useState(true);

  const categorySelectOptions = (categoryOptions ?? []).map((c) => ({
    value: c,
    label: c,
  }));

  const canAdd = Boolean(newCode.trim()) && (!hasCategory || Boolean(newCategory));

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({
      code: newCode.trim(),
      description: hasDescription ? newDescription.trim() : undefined,
      active: true,
      category: hasCategory ? newCategory : undefined,
    });
    setNewCode('');
    setNewDescription('');
    setNewCategory('');
  };

  const handleStartEdit = (item: CodeTableItem) => {
    setEditingId(item.id);
    setEditCode(item.code);
    setEditDescription(item.description ?? '');
    setEditCategory(item.category ?? '');
    setEditActive(item.active);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCode('');
    setEditDescription('');
    setEditCategory('');
    setEditActive(true);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editCode.trim()) return;
    if (hasCategory && !editCategory) return;
    onUpdate(editingId, {
      code: editCode.trim(),
      description: hasDescription ? editDescription.trim() : undefined,
      active: editActive,
      category: hasCategory ? editCategory : undefined,
    });
    handleCancelEdit();
  };

  const renderRow = (item: CodeTableItem) => (
    <div key={item.id} className="rounded-lg border border-border p-3">
      {editingId === item.id ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{codeLabel}</Label>
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
            </div>
            {hasDescription && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            )}
            {hasCategory && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editCategory}
                  onValueChange={setEditCategory}
                  options={categorySelectOptions}
                  placeholder={categoryPlaceholder}
                  aria-label="Category"
                />
              </div>
            )}
          </div>
          <Checkbox
            label="Active"
            checked={editActive}
            onChange={(e) => setEditActive(e.target.checked)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit}>
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.code}</span>
              {!item.active && (
                <Badge variant="secondary" size="sm">
                  Inactive
                </Badge>
              )}
            </div>
            {hasDescription && item.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              aria-label={`Edit ${item.code}`}
              onClick={() => handleStartEdit(item)}
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              aria-label={`Delete ${item.code}`}
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderList = () => {
    if (items.length === 0) {
      return (
        <p className="py-8 text-center text-muted-foreground">
          No entries defined yet. Add your first one above.
        </p>
      );
    }

    if (!hasCategory) {
      return <div className="space-y-2">{items.map(renderRow)}</div>;
    }

    return (
      <div className="space-y-6">
        {categoryOptions!
          .filter((cat) => items.some((i) => i.category === cat))
          .map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="border-b border-border pb-2 text-lg font-semibold">
                {cat}
              </h3>
              <div className="space-y-2 pl-2">
                {items.filter((i) => i.category === cat).map(renderRow)}
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)} data-slot="code-table-manager">
      <Card>
        <CardHeader>
          <CardTitle>Add New {title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'grid grid-cols-1 gap-4',
              hasDescription && hasCategory
                ? 'md:grid-cols-3'
                : hasDescription || hasCategory
                  ? 'md:grid-cols-2'
                  : ''
            )}
          >
            <div className="space-y-2">
              <Label>{codeLabel}</Label>
              <Input
                placeholder={`Enter ${codeLabel.toLowerCase()}...`}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            {hasDescription && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Enter description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            )}
            {hasCategory && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newCategory}
                  onValueChange={setNewCategory}
                  options={categorySelectOptions}
                  placeholder={categoryPlaceholder}
                  aria-label="Category"
                />
              </div>
            )}
          </div>
          <Button onClick={handleAdd} disabled={!canAdd}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {addButtonLabel}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing {title}</CardTitle>
          <CardDescription>Manage your values</CardDescription>
        </CardHeader>
        <CardContent>{renderList()}</CardContent>
      </Card>
    </div>
  );
}
