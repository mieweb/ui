import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Spinner } from '../Spinner';
import { Alert, AlertTitle, AlertDescription } from '../Alert';
import { CameraIcon, RefreshIcon, CheckIcon, AlertCircleIcon, ScanLineIcon } from '../Icons';
import { useCamera } from './useCamera';
import { useDocumentDetection } from './useDocumentDetection';
import { DocumentDetectionOverlay } from './DocumentDetectionOverlay';
import type { WebcamModalProps } from './types';

/**
 * Camera viewfinder component
 */
function CameraViewfinder({
  videoRef,
  isReady,
  detectionOverlay,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  detectionOverlay?: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'h-full w-full object-cover',
          'transition-opacity duration-300',
          isReady ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-neutral-400">Starting camera...</span>
        </div>
      )}

      {/* Detection overlay (replaces default viewfinder when auto-detect is enabled) */}
      {isReady && detectionOverlay}

      {/* Default viewfinder overlay (when no detection overlay) */}
      {isReady && !detectionOverlay && (
        <div className="pointer-events-none absolute inset-0">
          {/* Corner guides */}
          <div className="absolute inset-8 rounded-lg border-2 border-white/30">
            {/* Top-left corner */}
            <div className="absolute -top-0.5 -left-0.5 h-6 w-6 rounded-tl-lg border-t-4 border-l-4 border-white" />
            {/* Top-right corner */}
            <div className="absolute -top-0.5 -right-0.5 h-6 w-6 rounded-tr-lg border-t-4 border-r-4 border-white" />
            {/* Bottom-left corner */}
            <div className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-white" />
            {/* Bottom-right corner */}
            <div className="absolute -right-0.5 -bottom-0.5 h-6 w-6 rounded-br-lg border-r-4 border-b-4 border-white" />
          </div>

          {/* Center hint text */}
          <div className="absolute right-0 bottom-4 left-0 text-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              Position document within the frame
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Permission denied message
 */
function PermissionDeniedMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Alert variant="warning" className="w-full">
        <AlertCircleIcon className="h-5 w-5" />
        <AlertTitle>Camera access denied</AlertTitle>
        <AlertDescription>
          Please allow camera access in your browser settings to use this
          feature. You may need to refresh the page after changing permissions.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2 text-center">
        <p className="text-muted-foreground text-sm">
          To enable camera access:
        </p>
        <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-left text-sm">
          <li>Click the camera/lock icon in your browser&apos;s address bar</li>
          <li>Allow camera access for this site</li>
          <li>Click the button below to try again</li>
        </ol>
      </div>

      <Button onClick={onRetry} leftIcon={<RefreshIcon className="h-4 w-4" />}>
        Try again
      </Button>
    </div>
  );
}

/**
 * Camera unavailable message
 */
function CameraUnavailableMessage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Alert variant="danger">
        <AlertCircleIcon className="h-5 w-5" />
        <AlertTitle>Camera unavailable</AlertTitle>
        <AlertDescription>
          No camera was detected on this device. Please ensure your camera is
          connected and not in use by another application.
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Photo preview with confirm/retake actions
 */
function PhotoPreview({
  previewUrl,
  onConfirm,
  onRetake,
}: {
  previewUrl: string;
  onConfirm: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
        <img
          src={previewUrl}
          alt="Captured document"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button
          variant="secondary"
          onClick={onRetake}
          leftIcon={<RefreshIcon className="h-4 w-4" />}
        >
          Retake
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          leftIcon={<CheckIcon className="h-4 w-4" />}
        >
          Use this photo
        </Button>
      </div>
    </div>
  );
}

/**
 * WebcamModal component for capturing photos using device webcam
 *
 * @example
 * ```tsx
 * <WebcamModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onCapture={(file) => handleCapture(file)}
 *   permission={permission}
 *   onRequestPermission={requestPermission}
 * />
 * ```
 */
export function WebcamModal({
  open,
  onOpenChange,
  onCapture,
  enableAutoCapture = true,
}: Omit<WebcamModalProps, 'permission' | 'onRequestPermission'> & {
  /** Enable auto-capture when document is detected */
  enableAutoCapture?: boolean;
}) {
  const {
    permission,
    videoRef,
    isReady,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    currentFacingMode,
  } = useCamera({
    facingMode: 'environment',
    width: 1920,
    height: 1080,
  });

  const [capturedFile, setCapturedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = React.useState(enableAutoCapture);
  const [videoDimensions, setVideoDimensions] = React.useState({ width: 0, height: 0 });

  // Auto-capture callback
  const handleAutoCapture = React.useCallback(() => {
    const file = capturePhoto();
    if (file) {
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }
  }, [capturePhoto, stopCamera]);

  // Document detection hook - uses simplified focus + stability detection
  const detection = useDocumentDetection(
    videoRef,
    {
      enableAutoCapture: autoDetectEnabled,
      minFocusScore: 15, // Very forgiving focus threshold
      stabilityDuration: 500, // 0.5 seconds of stability
      captureCountdown: 2, // 2 second countdown
    },
    handleAutoCapture
  );

  // Track if we've started the camera for this modal session
  const hasStartedRef = React.useRef(false);

  // Update video dimensions when ready
  React.useEffect(() => {
    const video = videoRef.current;
    if (video && isReady) {
      const updateDimensions = () => {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
      updateDimensions();
      video.addEventListener('resize', updateDimensions);
      return () => video.removeEventListener('resize', updateDimensions);
    }
  }, [isReady, videoRef]);

  // Start camera and detection when modal opens
  React.useEffect(() => {
    if (open && permission !== 'denied' && permission !== 'unavailable') {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        startCamera();
      }
    } else if (!open) {
      hasStartedRef.current = false;
      stopCamera();
      detection.stopDetection();
      // Reset captured state
      setCapturedFile(null);
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, permission]);

  // Start detection when camera is ready
  React.useEffect(() => {
    if (isReady && autoDetectEnabled && !capturedFile) {
      detection.startDetection();
    }
    return () => {
      detection.stopDetection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, autoDetectEnabled, capturedFile]);

  const handleCapture = React.useCallback(() => {
    const file = capturePhoto();
    if (file) {
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }
  }, [capturePhoto, stopCamera]);

  const handleRetake = React.useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedFile(null);
    setPreviewUrl(null);
    detection.resetDetection();
    startCamera();
  }, [previewUrl, startCamera, detection]);

  const handleConfirm = React.useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      onOpenChange(false);
    }
  }, [capturedFile, onCapture, onOpenChange]);

  const handleClose = React.useCallback(() => {
    stopCamera();
    detection.stopDetection();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedFile(null);
    setPreviewUrl(null);
    onOpenChange(false);
  }, [stopCamera, detection, previewUrl, onOpenChange]);

  const renderContent = () => {
    if (permission === 'denied') {
      return <PermissionDeniedMessage onRetry={startCamera} />;
    }

    if (permission === 'unavailable') {
      return <CameraUnavailableMessage />;
    }

    if (capturedFile && previewUrl) {
      return (
        <PhotoPreview
          previewUrl={previewUrl}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <CameraViewfinder
          videoRef={videoRef}
          isReady={isReady}
          detectionOverlay={
            autoDetectEnabled && isReady ? (
              <DocumentDetectionOverlay
                metrics={detection.metrics}
                isReadyForCapture={detection.isReadyForCapture}
                captureCountdown={detection.captureCountdown}
                videoDimensions={videoDimensions}
                showDetailedMetrics={false}
              />
            ) : undefined
          }
        />

        <div className="flex flex-col gap-3">
          {/* Auto-detect toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={autoDetectEnabled ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setAutoDetectEnabled(!autoDetectEnabled);
                if (!autoDetectEnabled) {
                  detection.startDetection();
                } else {
                  detection.stopDetection();
                }
              }}
              leftIcon={<ScanLineIcon className="h-4 w-4" />}
            >
              {autoDetectEnabled ? 'Auto-capture ON' : 'Auto-capture OFF'}
            </Button>
          </div>

          {/* Capture controls */}
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              onClick={switchCamera}
              disabled={!isReady}
              aria-label={`Switch to ${currentFacingMode === 'user' ? 'back' : 'front'} camera`}
            >
              <RefreshIcon className="h-5 w-5" />
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCapture}
              disabled={!isReady}
              leftIcon={<CameraIcon className="h-5 w-5" />}
            >
              {autoDetectEnabled ? 'Manual Capture' : 'Capture'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      size="lg"
      aria-label="Webcam capture"
    >
      <ModalHeader>
        <ModalTitle>Take a Photo</ModalTitle>
        <ModalClose />
      </ModalHeader>

      <ModalBody>{renderContent()}</ModalBody>

      {permission !== 'denied' &&
        permission !== 'unavailable' &&
        !capturedFile && (
          <ModalFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </ModalFooter>
        )}
    </Modal>
  );
}

WebcamModal.displayName = 'WebcamModal';
