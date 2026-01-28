import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { SpinnerWithLabel } from '../Spinner';
import { Alert, AlertTitle, AlertDescription } from '../Alert';
import { Text } from '../Text';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
} from '../Modal';
import {
  UploadIcon,
  CameraIcon,
  ScanIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  TrashIcon,
} from '../Icons';
import { DropZone } from './DropZone';
import { FilePreview } from './FilePreview';
import { WebcamModal } from './WebcamModal';
import { useFileUpload } from './useFileUpload';
import { useIsMobile } from '../../hooks';
import type { ScannerState, ValidationError } from './types';
import { DEFAULT_ACCEPTED_FILE_TYPES, DEFAULT_MAX_FILE_SIZE_MB } from './types';

/**
 * Props for the DocumentScannerModal component
 */
export interface DocumentScannerModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when the modal should close
   */
  onOpenChange: (open: boolean) => void;

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
   * Title displayed in the modal header
   * @default "Scan Document"
   */
  title?: string;

  /**
   * Description displayed below the title
   * @default "Upload a file, take a photo, or use your webcam"
   */
  description?: string;

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
   * Disable all interactions.
   * @default false
   */
  disabled?: boolean;

  /**
   * Enable webcam capture option (desktop).
   * @default true
   */
  enableWebcam?: boolean;

  /**
   * Enable camera capture option (mobile).
   * @default true
   */
  enableCamera?: boolean;

  /**
   * Callback for validation errors
   */
  onValidationError?: (errors: ValidationError[]) => void;

  /**
   * Callback for state changes
   */
  onStateChange?: (state: ScannerState) => void;

  /**
   * Modal size
   * @default "xl"
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

  /**
   * Additional class name for the modal content
   */
  className?: string;

  /**
   * Whether to automatically close the modal on successful scan
   * @default true
   */
  closeOnSuccess?: boolean;
}

/**
 * DocumentScannerModal - A modal component for scanning documents, IDs, and cards
 *
 * This is a convenience wrapper that combines DocumentScanner functionality
 * with a Modal for a clean, ready-to-use document scanning experience.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Button onClick={() => setIsOpen(true)}>Scan Document</Button>
 *
 * <DocumentScannerModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onScan={async (files) => {
 *     const response = await fetch('/api/scan', {
 *       method: 'POST',
 *       body: createFormData(files),
 *     });
 *     return response.json();
 *   }}
 *   onResult={(data) => {
 *     console.log('Extracted data:', data);
 *   }}
 *   title="Scan Driver's License"
 *   description="Upload a photo or use your camera"
 * />
 * ```
 */
export function DocumentScannerModal({
  open,
  onOpenChange,
  onScan,
  onResult,
  title = 'Scan Document',
  description = 'Upload a file, take a photo, or use your webcam',
  multiple = false,
  acceptedFileTypes = [...DEFAULT_ACCEPTED_FILE_TYPES],
  maxFileSizeMb = DEFAULT_MAX_FILE_SIZE_MB,
  disabled = false,
  enableWebcam = true,
  enableCamera = true,
  onValidationError,
  onStateChange,
  size = 'xl',
  className,
  closeOnSuccess = true,
}: DocumentScannerModalProps) {
  const [state, setState] = React.useState<ScannerState>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<
    ValidationError[]
  >([]);

  const isMobile = useIsMobile();
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const {
    files,
    addFiles,
    addFile,
    removeFile,
    clearFiles,
    getFiles,
    hasFiles,
  } = useFileUpload({
    acceptedFileTypes,
    maxFileSizeMb,
    multiple,
    onValidationError: (errors) => {
      setValidationErrors(errors);
      onValidationError?.(errors);
    },
  });

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      // Delay reset to allow closing animation
      const timer = setTimeout(() => {
        clearFiles();
        setState('idle');
        setError(null);
        setValidationErrors([]);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, clearFiles]);

  // Notify parent of state changes
  React.useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Update state when files change
  React.useEffect(() => {
    if (hasFiles && state === 'idle') {
      setState('preview');
    } else if (!hasFiles && state === 'preview') {
      setState('idle');
    }
  }, [hasFiles, state]);

  // Handle file selection from dropzone
  const handleFilesSelected = React.useCallback(
    (fileList: FileList) => {
      setError(null);
      setValidationErrors([]);
      addFiles(fileList, 'upload');
    },
    [addFiles]
  );

  // Handle camera capture on mobile
  const handleCameraCapture = React.useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleCameraInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setError(null);
        setValidationErrors([]);
        addFiles(e.target.files, 'camera');
        e.target.value = '';
      }
    },
    [addFiles]
  );

  // Handle webcam capture
  const handleWebcamCapture = React.useCallback(
    (file: File) => {
      setError(null);
      setValidationErrors([]);
      addFile(file, 'webcam');
    },
    [addFile]
  );

  // Handle scan/submit
  const handleScan = React.useCallback(async () => {
    if (!hasFiles) return;

    try {
      setState('processing');
      setError(null);

      const filesToScan = getFiles();
      const result = await onScan(filesToScan);

      setState('success');
      onResult(result);

      // Auto-close modal after successful scan
      if (closeOnSuccess) {
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } catch (err) {
      setState('error');
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An error occurred while processing your document. Please try again.';
      setError(errorMessage);
    }
  }, [hasFiles, getFiles, onScan, onResult, closeOnSuccess, onOpenChange]);

  // Handle retry after error
  const handleRetry = React.useCallback(() => {
    setState('preview');
    setError(null);
  }, []);

  // Handle clear all
  const handleClearAll = React.useCallback(() => {
    clearFiles();
    setError(null);
    setValidationErrors([]);
    setState('idle');
  }, [clearFiles]);

  // Generate accept string for camera input
  const cameraAcceptString = acceptedFileTypes
    .filter((type) => type.startsWith('image/'))
    .join(',');

  // Render the appropriate content based on state
  const renderContent = () => {
    // Processing state
    if (state === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <SpinnerWithLabel
            size="xl"
            label="Analyzing your document..."
            labelPosition="bottom"
          />
          <Text variant="muted" size="sm" className="max-w-xs text-center">
            Our AI is extracting information from your document. This usually
            takes a few seconds.
          </Text>
        </div>
      );
    }

    // Success state
    if (state === 'success') {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <Text weight="semibold" size="lg">
            Document scanned successfully!
          </Text>
          <Text variant="muted" size="sm">
            The extracted data has been processed.
          </Text>
        </div>
      );
    }

    // Error state
    if (state === 'error') {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <Alert variant="danger" className="w-full">
            <AlertCircleIcon className="h-5 w-5" />
            <AlertTitle>Processing failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClearAll}>
              Start over
            </Button>
            <Button variant="primary" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        </div>
      );
    }

    // Preview state (has files)
    if (state === 'preview' && hasFiles) {
      return (
        <div className="flex flex-col gap-6">
          <FilePreview
            files={files}
            onRemove={removeFile}
            disabled={disabled}
          />

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Alert
              variant="warning"
              dismissible
              onDismiss={() => setValidationErrors([])}
            >
              <AlertCircleIcon className="h-5 w-5" />
              <AlertTitle>Some files were not added</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validationErrors.map((err, index) => (
                    <li key={index} className="text-sm">
                      <strong>{err.file.name}:</strong> {err.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {multiple && (
              <Button
                variant="secondary"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = acceptedFileTypes.join(',');
                  input.multiple = multiple;
                  input.onchange = (e) => {
                    const inputFiles = (e.target as HTMLInputElement).files;
                    if (inputFiles) addFiles(inputFiles, 'upload');
                  };
                  input.click();
                }}
                leftIcon={<UploadIcon className="h-4 w-4" />}
                disabled={disabled}
              >
                Add more files
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={handleClearAll}
              leftIcon={<TrashIcon className="h-4 w-4" />}
              disabled={disabled}
            >
              Clear all
            </Button>

            <Button
              variant="primary"
              onClick={handleScan}
              leftIcon={<ScanIcon className="h-4 w-4" />}
              disabled={disabled}
            >
              Scan {files.length > 1 ? `${files.length} documents` : 'document'}
            </Button>
          </div>
        </div>
      );
    }

    // Idle state (default)
    return (
      <div className="flex flex-col gap-6">
        <DropZone
          onFilesSelected={handleFilesSelected}
          acceptedFileTypes={acceptedFileTypes}
          multiple={multiple}
          disabled={disabled}
          className="min-h-[200px]"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-primary-100 dark:bg-primary-900/30 flex h-14 w-14 items-center justify-center rounded-full">
              <UploadIcon className="text-primary-600 dark:text-primary-400 h-7 w-7" />
            </div>

            <div className="space-y-1">
              <Text weight="medium">Drag and drop your files here</Text>
              <Text variant="muted" size="sm">
                or click to browse
              </Text>
            </div>

            <Text variant="muted" size="xs" className="max-w-xs">
              Supported formats: JPEG, PNG, HEIC, WebP, PDF
              <br />
              Max size: {maxFileSizeMb} MB
            </Text>
          </div>
        </DropZone>

        {/* Alternative capture methods */}
        {(enableCamera || enableWebcam) && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full max-w-xs items-center gap-3">
              <div className="bg-border h-px flex-1" />
              <Text variant="muted" size="sm">
                or
              </Text>
              <div className="bg-border h-px flex-1" />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {/* Mobile camera button */}
              {enableCamera && isMobile && (
                <Button
                  variant="secondary"
                  onClick={handleCameraCapture}
                  leftIcon={<CameraIcon className="h-4 w-4" />}
                  disabled={disabled}
                >
                  Take a photo
                </Button>
              )}

              {/* Desktop webcam button */}
              {enableWebcam && !isMobile && (
                <Button
                  variant="secondary"
                  onClick={() => setIsWebcamOpen(true)}
                  leftIcon={<CameraIcon className="h-4 w-4" />}
                  disabled={disabled}
                >
                  Use webcam
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Alert
            variant="warning"
            dismissible
            onDismiss={() => setValidationErrors([])}
          >
            <AlertCircleIcon className="h-5 w-5" />
            <AlertTitle>Invalid files</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {validationErrors.map((err, index) => (
                  <li key={index} className="text-sm">
                    <strong>{err.file.name}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        size={size}
        className={cn('max-h-[90vh] overflow-y-auto', className)}
      >
        <ModalHeader>
          <div>
            <ModalTitle>{title}</ModalTitle>
            {description && (
              <Text variant="muted" size="sm" className="mt-1">
                {description}
              </Text>
            )}
          </div>
          <ModalClose />
        </ModalHeader>
        <ModalBody>{renderContent()}</ModalBody>
      </Modal>

      {/* Hidden camera input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={cameraAcceptString}
        capture="environment"
        onChange={handleCameraInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Webcam modal */}
      <WebcamModal
        open={isWebcamOpen}
        onOpenChange={setIsWebcamOpen}
        onCapture={handleWebcamCapture}
      />
    </>
  );
}

DocumentScannerModal.displayName = 'DocumentScannerModal';
