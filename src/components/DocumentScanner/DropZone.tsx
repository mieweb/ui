import * as React from 'react';
import { cn } from '../../utils/cn';
import type { DropZoneProps } from './types';

/**
 * DropZone component for drag-and-drop file uploads
 *
 * @example
 * ```tsx
 * <DropZone
 *   onFilesSelected={handleFiles}
 *   acceptedFileTypes={['image/jpeg', 'image/png']}
 *   multiple={false}
 * >
 *   <p>Drop files here or click to browse</p>
 * </DropZone>
 * ```
 */
export function DropZone({
  onFilesSelected,
  acceptedFileTypes,
  multiple,
  disabled = false,
  className,
  children,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);
  const dragCounter = React.useRef(0);

  const handleDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    },
    [disabled]
  );

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [disabled, onFilesSelected]
  );

  const handleClick = React.useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
        // Reset input so same file can be selected again
        e.target.value = '';
      }
    },
    [onFilesSelected]
  );

  const acceptString = acceptedFileTypes.join(',');

  return (
    <>
      {/* Hidden file input placed outside role="button" to avoid nested-interactive violation */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        ref={dropZoneRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drop files here or click to browse"
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          // Base styles
          'relative flex flex-col items-center justify-center',
          'min-h-[200px] w-full p-6',
          'rounded-xl border-2 border-dashed',
          'transition-all duration-200',
          'cursor-pointer',
          // Default state
          'border-neutral-300 bg-neutral-50',
          'dark:border-neutral-600 dark:bg-neutral-800/50',
          // Hover state
          'hover:border-primary-400 hover:bg-primary-50/50',
          'dark:hover:border-primary-500 dark:hover:bg-primary-900/20',
          // Focus state
          'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          // Dragging state
          isDragging && [
            'border-primary-500 bg-primary-50',
            'dark:border-primary-400 dark:bg-primary-900/30',
            'scale-[1.01]',
          ],
          // Disabled state
          disabled && [
            'cursor-not-allowed opacity-50',
            'hover:border-neutral-300 hover:bg-neutral-50',
            'dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50',
          ],
          className
        )}
      >
        {children}

        {/* Drag overlay feedback */}
        {isDragging && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-primary-500/10 rounded-xl',
              'pointer-events-none'
            )}
          >
            <span className="text-primary-600 dark:text-primary-400 text-lg font-medium">
              Drop files here
            </span>
          </div>
        )}
      </div>
    </>
  );
}

DropZone.displayName = 'DropZone';
