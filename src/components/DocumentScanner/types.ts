/**
 * Types for the DocumentScanner component
 */

/**
 * Accepted file types for document scanning
 */
export const DEFAULT_ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/webp',
  'application/pdf',
] as const;

/**
 * Default maximum file size in MB
 */
export const DEFAULT_MAX_FILE_SIZE_MB = 10;

/**
 * Scanner source type
 */
export type ScannerSource = 'upload' | 'camera' | 'webcam';

/**
 * Scanner state
 */
export type ScannerState =
  | 'idle'
  | 'capturing'
  | 'preview'
  | 'processing'
  | 'success'
  | 'error';

/**
 * File with preview URL
 */
export interface PreviewFile {
  /** The actual file object */
  file: File;
  /** Generated preview URL for display */
  previewUrl: string;
  /** Source of the file (upload, camera, or webcam) */
  source: ScannerSource;
  /** Unique ID for the file */
  id: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** File that caused the error */
  file: File;
  /** Error type */
  type: 'size' | 'type' | 'unknown';
  /** Human-readable error message */
  message: string;
}

/**
 * Camera permissions state
 */
export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unavailable';

/**
 * DocumentScanner component props
 */
export interface DocumentScannerProps {
  /**
   * Callback function that processes the scanned files.
   * Should return extracted data from the AI vision endpoint.
   */
  onScan: (files: File[]) => Promise<unknown>;

  /**
   * Callback function called with the extracted data after successful processing.
   */
  onResult: (data: unknown) => void;

  /**
   * Allow multiple file selection/capture.
   * @default false
   */
  multiple?: boolean;

  /**
   * Accepted file MIME types.
   * @default ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
   */
  acceptedFileTypes?: string[];

  /**
   * Maximum file size in megabytes.
   * @default 10
   */
  maxFileSizeMb?: number;

  /**
   * Disable the entire scanner.
   * @default false
   */
  disabled?: boolean;

  /**
   * Enable webcam capture on desktop.
   * @default true
   */
  enableWebcam?: boolean;

  /**
   * Enable camera capture on mobile.
   * @default true
   */
  enableCamera?: boolean;

  /**
   * Custom title text.
   * @default "Scan your document"
   */
  title?: string;

  /**
   * Custom description text.
   * @default "Upload a file, take a photo, or use your webcam"
   */
  description?: string;

  /**
   * Additional CSS classes.
   */
  className?: string;

  /**
   * Callback when an error occurs during file validation.
   */
  onValidationError?: (errors: ValidationError[]) => void;

  /**
   * Callback when the scanner state changes.
   */
  onStateChange?: (state: ScannerState) => void;
}

/**
 * WebcamModal component props
 */
export interface WebcamModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Callback when a photo is captured */
  onCapture: (file: File) => void;
  /** Camera permission state */
  permission: CameraPermission;
  /** Request camera permission */
  onRequestPermission: () => Promise<void>;
}

/**
 * FilePreview component props
 */
export interface FilePreviewProps {
  /** Files to preview */
  files: PreviewFile[];
  /** Callback to remove a file */
  onRemove: (id: string) => void;
  /** Whether removal is disabled */
  disabled?: boolean;
}

/**
 * DropZone component props
 */
export interface DropZoneProps {
  /** Callback when files are dropped or selected */
  onFilesSelected: (files: FileList) => void;
  /** Accepted file types */
  acceptedFileTypes: string[];
  /** Allow multiple file selection */
  multiple: boolean;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}
