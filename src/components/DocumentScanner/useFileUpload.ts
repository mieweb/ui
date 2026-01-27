import * as React from 'react';
import type { PreviewFile, ValidationError, ScannerSource } from './types';
import { DEFAULT_MAX_FILE_SIZE_MB, DEFAULT_ACCEPTED_FILE_TYPES } from './types';

/**
 * Generate a unique ID for a file
 */
function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate a file against type and size constraints
 */
function validateFile(
  file: File,
  acceptedTypes: string[],
  maxSizeMb: number
): ValidationError | null {
  // Check file type
  if (!acceptedTypes.includes(file.type)) {
    return {
      file,
      type: 'type',
      message: `File type "${file.type || 'unknown'}" is not supported. Accepted types: ${acceptedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      file,
      type: 'size',
      message: `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size of ${maxSizeMb} MB`,
    };
  }

  return null;
}

/**
 * Create a preview URL for a file
 */
function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Hook options for useFileUpload
 */
export interface UseFileUploadOptions {
  /** Accepted file MIME types */
  acceptedFileTypes?: string[];
  /** Maximum file size in MB */
  maxFileSizeMb?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Callback for validation errors */
  onValidationError?: (errors: ValidationError[]) => void;
}

/**
 * Hook return type for useFileUpload
 */
export interface UseFileUploadReturn {
  /** Current preview files */
  files: PreviewFile[];
  /** Add files from FileList */
  addFiles: (fileList: FileList, source?: ScannerSource) => void;
  /** Add a single file */
  addFile: (file: File, source?: ScannerSource) => void;
  /** Remove a file by ID */
  removeFile: (id: string) => void;
  /** Clear all files */
  clearFiles: () => void;
  /** Get raw File objects */
  getFiles: () => File[];
  /** Whether there are files selected */
  hasFiles: boolean;
}

/**
 * Hook for managing file uploads with validation and preview URLs
 *
 * @example
 * ```tsx
 * const {
 *   files,
 *   addFiles,
 *   removeFile,
 *   clearFiles,
 *   hasFiles,
 * } = useFileUpload({
 *   acceptedFileTypes: ['image/jpeg', 'image/png'],
 *   maxFileSizeMb: 5,
 *   multiple: true,
 *   onValidationError: (errors) => console.error(errors),
 * });
 * ```
 */
export function useFileUpload({
  acceptedFileTypes = [...DEFAULT_ACCEPTED_FILE_TYPES],
  maxFileSizeMb = DEFAULT_MAX_FILE_SIZE_MB,
  multiple = false,
  onValidationError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [files, setFiles] = React.useState<PreviewFile[]>([]);

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // Only run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = React.useCallback(
    (fileList: FileList, source: ScannerSource = 'upload') => {
      const newFiles: PreviewFile[] = [];
      const errors: ValidationError[] = [];

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file, acceptedFileTypes, maxFileSizeMb);
        if (error) {
          errors.push(error);
        } else {
          newFiles.push({
            file,
            previewUrl: createPreviewUrl(file),
            source,
            id: generateFileId(),
          });
        }
      });

      if (errors.length > 0) {
        onValidationError?.(errors);
      }

      if (newFiles.length > 0) {
        setFiles((prev) => {
          // If not multiple, revoke old URLs and replace
          if (!multiple) {
            prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
            return newFiles.slice(0, 1);
          }
          return [...prev, ...newFiles];
        });
      }
    },
    [acceptedFileTypes, maxFileSizeMb, multiple, onValidationError]
  );

  const addFile = React.useCallback(
    (file: File, source: ScannerSource = 'upload') => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      addFiles(dataTransfer.files, source);
    },
    [addFiles]
  );

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = React.useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return [];
    });
  }, []);

  const getFiles = React.useCallback(() => {
    return files.map((f) => f.file);
  }, [files]);

  return {
    files,
    addFiles,
    addFile,
    removeFile,
    clearFiles,
    getFiles,
    hasFiles: files.length > 0,
  };
}
