/* eslint-disable no-undef */
import * as React from 'react';
import { cn } from '../../utils/cn';
import type { AttachmentType, AttachmentState } from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get file type from MIME type.
 */
function getFileType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  ) {
    return 'document';
  }
  return 'file';
}

/**
 * Format file size in human-readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate file type and size.
 */
function validateFile(
  file: File,
  acceptedTypes?: string[],
  maxSize?: number
): { valid: boolean; error?: string } {
  if (acceptedTypes && acceptedTypes.length > 0) {
    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });
    if (!isAccepted) {
      return { valid: false, error: 'File type not supported' };
    }
  }

  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (max ${formatFileSize(maxSize)})`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique ID for attachments.
 */
function generateAttachmentId(): string {
  return `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Attachment Preview Item Component
// ============================================================================

export interface AttachmentPreviewItemProps {
  /** The attachment to preview */
  attachment: {
    id: string;
    file: File;
    previewUrl?: string;
    type: AttachmentType;
    state: AttachmentState;
    progress?: number;
    error?: string;
  };
  /** Called when remove is clicked */
  onRemove: () => void;
  /** Called when retry is clicked */
  onRetry?: () => void;
  className?: string;
}

/**
 * Preview item for a pending attachment.
 */
function AttachmentPreviewItem({
  attachment,
  onRemove,
  onRetry,
  className,
}: AttachmentPreviewItemProps) {
  const { file, previewUrl, type, state, progress } = attachment;
  const isImage = type === 'image';
  const isVideo = type === 'video';
  const isUploading = state === 'uploading';
  const isFailed = state === 'failed';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg',
        'bg-neutral-100 dark:bg-neutral-800',
        'border border-neutral-200 dark:border-neutral-700',
        isFailed && 'border-red-500',
        className
      )}
    >
      {/* Image/Video preview */}
      {(isImage || isVideo) && previewUrl ? (
        <div className="relative h-20 w-20">
          <img
            src={previewUrl}
            alt={file.name}
            className={cn(
              'h-full w-full object-cover',
              (isUploading || isFailed) && 'opacity-50'
            )}
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white drop-shadow"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        /* File preview */
        <div className="flex h-20 w-20 flex-col items-center justify-center p-2">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="mt-1 max-w-full truncate px-1 text-xs text-neutral-500">
            {file.name.split('.').pop()?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Upload progress overlay */}
      {isUploading && progress !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <svg
              className="mx-auto h-6 w-6 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="mt-1 text-xs">{progress}%</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {isFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <svg
              className="mx-auto h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 text-xs text-white underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'absolute -top-1 -right-1 z-10',
          'rounded-full p-1',
          'bg-neutral-900 text-white',
          'opacity-0 group-hover:opacity-100',
          'focus:ring-primary-500 focus:opacity-100 focus:ring-2 focus:outline-none',
          'transition-opacity'
        )}
        aria-label={`Remove ${file.name}`}
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* File name tooltip on hover */}
      <div
        className={cn(
          'absolute right-0 bottom-0 left-0',
          'bg-black/70 px-1 py-0.5',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity'
        )}
      >
        <p className="truncate text-xs text-white">{file.name}</p>
      </div>
    </div>
  );
}

AttachmentPreviewItem.displayName = 'AttachmentPreviewItem';

// ============================================================================
// Attachment Picker Component
// ============================================================================

export interface AttachmentPickerProps {
  /** Called when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Accepted file types (MIME types or extensions) */
  acceptedTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether multiple files can be selected */
  multiple?: boolean;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A button/trigger component for selecting attachments.
 */
const AttachmentPicker = React.forwardRef<
  HTMLInputElement,
  AttachmentPickerProps
>(
  (
    {
      onFilesSelected,
      acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
      maxFileSize = 25 * 1024 * 1024, // 25MB
      maxFiles = 10,
      multiple = true,
      disabled = false,
      onError,
      className,
      children,
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Validate files
      const validFiles: File[] = [];
      for (const file of files.slice(0, maxFiles)) {
        const validation = validateFile(file, acceptedTypes, maxFileSize);
        if (validation.valid) {
          validFiles.push(file);
        } else if (onError) {
          onError(`${file.name}: ${validation.error}`);
        }
      }

      if (files.length > maxFiles && onError) {
        onError(`Maximum ${maxFiles} files allowed`);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }

      // Reset input
      event.target.value = '';
    };

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-label="Select files to attach"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center',
            'rounded-full p-2',
            'text-neutral-500 hover:text-neutral-700',
            'dark:text-neutral-400 dark:hover:text-neutral-200',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            'focus:ring-primary-500 focus:ring-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            className
          )}
          aria-label="Attach files"
        >
          {children || (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          )}
        </button>
      </>
    );
  }
);

AttachmentPicker.displayName = 'AttachmentPicker';

// ============================================================================
// Drag Drop Zone Component
// ============================================================================

export interface DragDropZoneProps {
  /** Called when files are dropped */
  onFilesDropped: (files: File[]) => void;
  /** Accepted file types */
  acceptedTypes?: string[];
  /** Maximum file size */
  maxFileSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether the zone is disabled */
  disabled?: boolean;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Children to render inside the zone */
  children: React.ReactNode;
  className?: string;
}

/**
 * A wrapper component that accepts drag-and-drop files.
 */
function DragDropZone({
  onFilesDropped,
  acceptedTypes,
  maxFileSize,
  maxFiles = 10,
  disabled = false,
  onError,
  children,
  className,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounterRef = React.useRef(0);

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    dragCounterRef.current++;
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const file of files.slice(0, maxFiles)) {
      const validation = validateFile(file, acceptedTypes, maxFileSize);
      if (validation.valid) {
        validFiles.push(file);
      } else if (onError) {
        onError(`${file.name}: ${validation.error}`);
      }
    }

    if (files.length > maxFiles && onError) {
      onError(`Maximum ${maxFiles} files allowed`);
    }

    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn('relative', className)}
    >
      {children}

      {/* Drag overlay */}
      {isDragging && (
        <div
          className={cn(
            'absolute inset-0 z-50',
            'flex items-center justify-center',
            'bg-primary-50/90 dark:bg-primary-900/90',
            'border-primary-500 border-2 border-dashed',
            'rounded-lg'
          )}
        >
          <div className="text-center">
            <svg
              className="text-primary-500 mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-primary-700 dark:text-primary-300 mt-2 text-sm font-medium">
              Drop files here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

DragDropZone.displayName = 'DragDropZone';

// ============================================================================
// Camera Button Component (Mobile)
// ============================================================================

export interface CameraButtonProps {
  /** Called when a photo is captured */
  onCapture: (file: File) => void;
  /** Whether to use front camera */
  useFrontCamera?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  className?: string;
}

/**
 * Button to capture photos from camera (mobile).
 */
function CameraButton({
  onCapture,
  useFrontCamera = false,
  disabled = false,
  className,
}: CameraButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    event.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={useFrontCamera ? 'user' : 'environment'}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Take a photo"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-full p-2',
          'text-neutral-500 hover:text-neutral-700',
          'dark:text-neutral-400 dark:hover:text-neutral-200',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          'focus:ring-primary-500 focus:ring-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className
        )}
        aria-label="Take a photo"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </>
  );
}

CameraButton.displayName = 'CameraButton';

export {
  AttachmentPicker,
  AttachmentPreviewItem,
  DragDropZone,
  CameraButton,
  getFileType,
  formatFileSize,
  validateFile,
  generateAttachmentId,
};
