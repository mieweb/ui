'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Card } from '../Card/Card';
import { DownloadIcon, EyeIcon, MoreHorizontalIcon, TrashIcon } from '../Icons';
import { Progress } from '../Progress/Progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

export interface FileItem {
  id: string;
  filename: string;
  fileSize: number;
  fileExtension: string;
  uploadedAt?: Date;
  uploadedBy?: {
    id: string;
    name: string;
  };
  url?: string;
}

export interface FileManagerProps {
  /** List of files */
  files: FileItem[];
  /** Total storage used (bytes) */
  totalStorageUsed?: number;
  /** Storage limit (bytes) */
  storageLimit?: number;
  /** Handler for file upload */
  onUpload?: (files: FileList) => void;
  /** Handler for file delete */
  onDelete?: (fileId: string) => void;
  /** Handler for file download */
  onDownload?: (fileId: string) => void;
  /** Handler for file preview */
  onPreview?: (fileId: string) => void;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Whether to show drag and drop zone */
  showDropzone?: boolean;
  /** Accepted file types */
  acceptedFileTypes?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Error message to display */
  errorMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(extension: string): React.ReactNode {
  const ext = extension.toLowerCase().replace('.', '');

  // Document types
  if (['pdf'].includes(ext)) {
    return (
      <svg
        className="h-5 w-5 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (['doc', 'docx'].includes(ext)) {
    return (
      <svg
        className="h-5 w-5 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return (
      <svg
        className="h-5 w-5 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return (
      <svg
        className="h-5 w-5 text-purple-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * FileManager provides file upload, listing, and management functionality.
 */
export function FileManager({
  files,
  totalStorageUsed,
  storageLimit,
  onUpload,
  onDelete,
  onDownload,
  onPreview,
  uploadProgress,
  isUploading = false,
  showDropzone = true,
  acceptedFileTypes,
  errorMessage,
  className = '',
}: FileManagerProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasActions = !!(onPreview || onDownload || onDelete);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (onUpload && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpload && e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      // Reset input
      e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div data-slot="file-manager" className={className}>
      {/* Dropzone */}
      {showDropzone && (
        <Card
          data-slot="file-manager-dropzone"
          className={`mb-4 cursor-pointer border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          } `.trim()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <div
            data-slot="file-manager-dropzone-content"
            className="flex flex-col items-center justify-center p-6"
          >
            <div
              data-slot="file-manager-upload-icon"
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                isDragging
                  ? 'bg-blue-100 dark:bg-blue-800'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <svg
                className={`h-6 w-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {isDragging ? 'Drop files here' : 'Add File'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Click or drag and drop
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
            />
          </div>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress !== undefined && (
        <div data-slot="file-manager-progress" className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} max={100} />
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          data-slot="file-manager-error"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
        >
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Storage Usage */}
      {totalStorageUsed !== undefined && (
        <div
          data-slot="file-manager-storage"
          className="mb-4 rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Used Storage:{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatFileSize(totalStorageUsed)}
            </span>
            {storageLimit && (
              <span className="text-gray-500">
                {' '}
                / {formatFileSize(storageLimit)}
              </span>
            )}
          </p>
        </div>
      )}

      {/* File Table */}
      <div data-slot="file-manager-table">
        <Table responsive>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead className="text-center">Extension</TableHead>
              <TableHead className="text-center">Size</TableHead>
              {hasActions && (
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length > 0 ? (
              files.map((file) => (
                <TableRow key={file.id} data-slot="file-manager-row">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.fileExtension)}
                      <span className="max-w-xs truncate text-sm text-gray-900 dark:text-white">
                        {file.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-gray-500 uppercase dark:text-gray-400">
                      {file.fileExtension.replace('.', '')}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </TableCell>
                  {hasActions && (
                    <TableCell
                      data-slot="file-manager-actions"
                      className="text-right"
                    >
                      <FileRowActionMenu
                        fileId={file.id}
                        filename={file.filename}
                        onPreview={onPreview}
                        onDownload={onDownload}
                        onDelete={onDelete}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={hasActions ? 4 : 3} className="py-8">
                  <div data-slot="file-manager-empty" className="text-center">
                    <svg
                      className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      No Files
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Upload files to get started
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Internal: row-level 3-dot overflow menu (matches DashboardWidget pattern)
// -----------------------------------------------------------------------------

function FileRowActionMenu({
  fileId,
  filename,
  onPreview,
  onDownload,
  onDelete,
}: {
  fileId: string;
  filename: string;
  onPreview?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const [menuPos, setMenuPos] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function updatePosition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right,
      });
    }

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  const actions = [
    onPreview && {
      key: 'preview',
      label: 'Preview',
      icon: <EyeIcon size={14} />,
      onClick: () => onPreview(fileId),
    },
    onDownload && {
      key: 'download',
      label: 'Download',
      icon: <DownloadIcon size={14} />,
      onClick: () => onDownload(fileId),
    },
    onDelete && {
      key: 'delete',
      label: 'Delete',
      icon: <TrashIcon size={14} />,
      variant: 'danger' as const,
      onClick: () => onDelete(fileId),
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    icon: React.ReactNode;
    variant?: 'danger';
    onClick: () => void;
  }[];

  if (actions.length === 0) return null;

  return (
    <div className="relative inline-flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded',
          'text-neutral-400 transition-colors',
          'hover:bg-neutral-100 hover:text-neutral-600',
          'dark:hover:bg-neutral-700 dark:hover:text-neutral-300',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`File actions for ${filename}`}
      >
        <MoreHorizontalIcon size={14} />
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              transform: 'translateX(-100%)',
            }}
            className={cn(
              'z-[9999] min-w-[10rem]',
              'rounded-lg border border-neutral-200 bg-white py-1 shadow-lg',
              'dark:border-neutral-700 dark:bg-neutral-800',
              'animate-in fade-in zoom-in-95 duration-100'
            )}
          >
            {actions.map((action) => (
              <button
                key={action.key}
                role="menuitem"
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                  'transition-colors duration-100',
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick();
                }}
              >
                {action.icon && (
                  <span className="h-3.5 w-3.5 shrink-0">{action.icon}</span>
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

export default FileManager;
