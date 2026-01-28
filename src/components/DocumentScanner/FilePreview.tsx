import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { CloseIcon, ImageIcon, FileTextIcon } from '../Icons';
import type { FilePreviewProps, PreviewFile } from './types';

/**
 * Single file preview item
 */
interface FilePreviewItemProps {
  /** The preview file to display */
  file: PreviewFile;
  /** Callback to remove the file */
  onRemove: (id: string) => void;
  /** Whether removal is disabled */
  disabled?: boolean;
}

function FilePreviewItem({ file, onRemove, disabled }: FilePreviewItemProps) {
  const isPdf = file.file.type === 'application/pdf';
  const isImage = file.file.type.startsWith('image/');

  const handleRemove = React.useCallback(() => {
    onRemove(file.id);
  }, [file.id, onRemove]);

  return (
    <div
      role="group"
      aria-label={`File: ${file.file.name}`}
      className={cn(
        'group relative overflow-hidden rounded-lg',
        'border-border bg-card border',
        'focus-within:ring-primary-500 focus-within:ring-2 focus-within:ring-offset-2'
      )}
    >
      {/* Preview container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {isImage ? (
          <img
            src={file.previewUrl}
            alt={`Preview of ${file.file.name}`}
            className="h-full w-full object-cover"
          />
        ) : isPdf ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <FileTextIcon className="text-muted-foreground h-12 w-12" />
            <span className="text-muted-foreground text-xs">PDF Document</span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <ImageIcon className="text-muted-foreground h-12 w-12" />
            <span className="text-muted-foreground text-xs">File</span>
          </div>
        )}

        {/* Remove button overlay */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/0 transition-all duration-200',
            'group-hover:bg-black/30',
            disabled && 'pointer-events-none'
          )}
        >
          <Button
            variant="danger"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
            className={cn(
              'h-8 w-8 rounded-full',
              'opacity-0 transition-all duration-200',
              'group-hover:opacity-100',
              'focus-visible:opacity-100'
            )}
            aria-label={`Remove ${file.file.name}`}
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Source badge */}
        <span
          className={cn(
            'absolute bottom-2 left-2 px-2 py-0.5',
            'rounded-full text-xs font-medium',
            'bg-black/50 text-white',
            'capitalize'
          )}
        >
          {file.source}
        </span>
      </div>

      {/* File info */}
      <div className="p-2">
        <p
          className="text-foreground truncate text-sm font-medium"
          title={file.file.name}
        >
          {file.file.name}
        </p>
        <p className="text-muted-foreground text-xs">
          {formatFileSize(file.file.size)}
        </p>
      </div>
    </div>
  );
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * FilePreview component for displaying uploaded/captured files
 *
 * @example
 * ```tsx
 * <FilePreview
 *   files={previewFiles}
 *   onRemove={(id) => removeFile(id)}
 * />
 * ```
 */
export function FilePreview({ files, onRemove, disabled }: FilePreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        files.length === 1 && 'mx-auto max-w-xs grid-cols-1',
        files.length === 2 && 'grid-cols-2',
        files.length >= 3 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      )}
      role="list"
      aria-label="Selected files"
    >
      {files.map((file) => (
        <FilePreviewItem
          key={file.id}
          file={file}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

FilePreview.displayName = 'FilePreview';
