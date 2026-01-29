'use client';

import * as React from 'react';
import { Card } from '../Card/Card';
import { Progress } from '../Progress/Progress';

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
    <div className={className}>
      {/* Dropzone */}
      {showDropzone && (
        <Card
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
          <div className="flex flex-col items-center justify-center p-6">
            <div
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
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} max={100} />
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Storage Usage */}
      {totalStorageUsed !== undefined && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Filename
              </th>
              <th className="py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Extension
              </th>
              <th className="py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Size
              </th>
              <th className="py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {files.length > 0 ? (
              files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.fileExtension)}
                      <span className="max-w-xs truncate text-sm text-gray-900 dark:text-white">
                        {file.filename}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-xs text-gray-500 uppercase dark:text-gray-400">
                      {file.fileExtension.replace('.', '')}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onPreview && (
                        <button
                          type="button"
                          onClick={() => onPreview(file.id)}
                          className="p-1.5 text-gray-400 transition-colors hover:text-blue-500 dark:hover:text-blue-400"
                          title="Preview"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      )}
                      {onDownload && (
                        <button
                          type="button"
                          onClick={() => onDownload(file.id)}
                          className="p-1.5 text-gray-400 transition-colors hover:text-green-500 dark:hover:text-green-400"
                          title="Download"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(file.id)}
                          className="p-1.5 text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8">
                  <div className="text-center">
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
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FileManager;
