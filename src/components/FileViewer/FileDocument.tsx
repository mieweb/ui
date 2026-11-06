/**
 * FileDocument — a text file with a View/Edit toggle. View renders the file
 * with {@link FileViewer}; Edit is a plain-text editor. Switching back to View
 * before saving previews the draft, and Save/Cancel return to the view.
 */

import * as React from 'react';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import {
  defaultFileViewerLabels,
  FileViewer,
  type FileViewerLabels,
  type FileViewerRenderMarkdown,
} from './FileViewer';

// ============================================================================
// Labels
// ============================================================================

/** Every user-facing string the document renders, including the viewer's. */
export interface FileDocumentLabels extends FileViewerLabels {
  /** Accessible name of the View/Edit toggle group. */
  modeGroup: string;
  view: string;
  edit: string;
  /** Accessible name of the editor, e.g. "Contents of notes.md". */
  editor: (path: string) => string;
  /** Status shown while the draft differs from the saved text. */
  unsaved: string;
  save: string;
  cancel: string;
  /** Shown when `onSave` rejects. */
  saveFailed: string;
}

export const defaultFileDocumentLabels: FileDocumentLabels = {
  ...defaultFileViewerLabels,
  modeGroup: 'Display mode',
  view: 'View',
  edit: 'Edit',
  editor: (path) => `Contents of ${path}`,
  unsaved: 'Unsaved changes',
  save: 'Save',
  cancel: 'Cancel',
  saveFailed: 'The file could not be saved.',
};

// ============================================================================
// Component
// ============================================================================

export type FileDocumentMode = 'view' | 'edit';

export interface FileDocumentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  /** The file's path or name; shown above the toggle and passed to the viewer. */
  path: string;
  /**
   * The last saved text. An uncontrolled draft follows it while the draft has
   * no edits, so a host can reload the file in place.
   */
  content: string;
  /** Controlled draft. Omit to let the component keep it. */
  draft?: string;
  /** Called on every edit, and with `content` when Cancel drops the draft. */
  onDraftChange?: (draft: string) => void;
  /** Controlled mode. Omit to let the component keep it. */
  mode?: FileDocumentMode;
  /** Initial mode when uncontrolled, e.g. `'edit'` for a new, empty file. */
  defaultMode?: FileDocumentMode;
  onModeChange?: (mode: FileDocumentMode) => void;
  /**
   * Save the draft. While the promise is pending the Save button is busy and
   * the editor is read-only; on success the document returns to View, and on
   * rejection it stays in Edit and shows `labels.saveFailed`. The host should
   * update `content` before resolving.
   */
  onSave: (draft: string) => void | Promise<void>;
  /**
   * Asked before Cancel throws away an edited draft; resolve `false` to keep
   * editing. Without it, Cancel discards immediately.
   */
  confirmDiscard?: () => boolean | Promise<boolean>;
  /** Called after Cancel has dropped the draft. */
  onCancel?: () => void;
  /** Called when the draft starts or stops differing from `content`. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Passed to {@link FileViewer}. */
  highlightLimit?: number;
  /** Passed to {@link FileViewer}. */
  renderMarkdown?: FileViewerRenderMarkdown;
  /** Overrides for the English default strings. */
  labels?: Partial<FileDocumentLabels>;
}

/**
 * View or edit one text file. Loading and saving belong to the host; the
 * component owns the toggle, the save state, and (unless controlled) the draft
 * and mode.
 */
export const FileDocument = React.forwardRef<HTMLDivElement, FileDocumentProps>(
  (
    {
      path,
      content,
      draft: controlledDraft,
      onDraftChange,
      mode: controlledMode,
      defaultMode = 'view',
      onModeChange,
      onSave,
      confirmDiscard,
      onCancel,
      onDirtyChange,
      highlightLimit,
      renderMarkdown,
      labels: labelOverrides,
      className,
      ...rest
    },
    ref
  ) => {
    const labels = { ...defaultFileDocumentLabels, ...labelOverrides };

    const [uncontrolledDraft, setUncontrolledDraft] = React.useState(content);
    const [syncedContent, setSyncedContent] = React.useState(content);
    // A reloaded file replaces an unedited draft (adjusting state during render).
    if (content !== syncedContent) {
      setSyncedContent(content);
      if (uncontrolledDraft === syncedContent) setUncontrolledDraft(content);
    }
    const draft = controlledDraft ?? uncontrolledDraft;
    const setDraft = (next: string) => {
      if (controlledDraft === undefined) setUncontrolledDraft(next);
      onDraftChange?.(next);
    };

    const [uncontrolledMode, setUncontrolledMode] =
      React.useState<FileDocumentMode>(defaultMode);
    const mode = controlledMode ?? uncontrolledMode;
    const setMode = (next: FileDocumentMode) => {
      if (controlledMode === undefined) setUncontrolledMode(next);
      onModeChange?.(next);
    };

    const [saving, setSaving] = React.useState(false);
    const [saveFailed, setSaveFailed] = React.useState(false);
    const dirty = draft !== content;

    const onDirtyChangeRef = React.useRef(onDirtyChange);
    onDirtyChangeRef.current = onDirtyChange;
    const reportedDirty = React.useRef(false);
    React.useEffect(() => {
      if (dirty === reportedDirty.current) return;
      reportedDirty.current = dirty;
      onDirtyChangeRef.current?.(dirty);
    }, [dirty]);

    const save = async () => {
      setSaving(true);
      setSaveFailed(false);
      try {
        await onSave(draft);
        setMode('view');
      } catch {
        setSaveFailed(true);
      } finally {
        setSaving(false);
      }
    };

    const cancel = async () => {
      if (dirty && confirmDiscard && !(await confirmDiscard())) return;
      setDraft(content);
      setSaveFailed(false);
      setMode('view');
      onCancel?.();
    };

    return (
      <div
        ref={ref}
        data-slot="file-document"
        className={cn('flex min-h-0 flex-col gap-2', className)}
        {...rest}
      >
        <span
          data-slot="file-document-path"
          className="text-muted-foreground font-mono text-xs break-all"
        >
          {path}
        </span>
        <div
          data-slot="file-document-toolbar"
          className="flex flex-wrap items-center gap-2"
        >
          <ModeToggle mode={mode} onChange={setMode} labels={labels} />
          {dirty && (
            <span
              role="status"
              data-slot="file-document-unsaved"
              className="text-warning-700 dark:text-warning-300 text-xs"
            >
              {labels.unsaved}
            </span>
          )}
          {(mode === 'edit' || dirty) && (
            <div
              data-slot="file-document-actions"
              className="ms-auto flex gap-2"
            >
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void cancel()}
                disabled={saving}
              >
                {labels.cancel}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void save()}
                disabled={!dirty}
                isLoading={saving}
              >
                {labels.save}
              </Button>
            </div>
          )}
        </div>
        {saveFailed && (
          <p
            role="alert"
            className="text-destructive-700 dark:text-destructive-400 text-xs"
          >
            {labels.saveFailed}
          </p>
        )}
        {mode === 'view' ? (
          <FileViewer
            path={path}
            text={draft}
            highlightLimit={highlightLimit}
            renderMarkdown={renderMarkdown}
            labels={labels}
            className="flex-1"
          />
        ) : (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            // Edits made during a save could be overwritten when it lands.
            readOnly={saving}
            aria-label={labels.editor(path)}
            spellCheck={false}
            dir="auto"
            data-slot="file-document-editor"
            className="border-input focus-visible:ring-primary-500 min-h-0 flex-1 resize-none rounded-md border bg-transparent p-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        )}
      </div>
    );
  }
);

FileDocument.displayName = 'FileDocument';

/** Two-state View/Edit switch; each button reports whether it's the active mode. */
function ModeToggle({
  mode,
  onChange,
  labels,
}: {
  mode: FileDocumentMode;
  onChange: (mode: FileDocumentMode) => void;
  labels: FileDocumentLabels;
}) {
  const options = [
    { value: 'view', label: labels.view, Icon: Eye },
    { value: 'edit', label: labels.edit, Icon: Pencil },
  ] as const;

  return (
    <div
      role="group"
      aria-label={labels.modeGroup}
      data-slot="file-document-mode"
      className="bg-muted flex items-center gap-0.5 rounded-lg p-0.5"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
            mode === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
