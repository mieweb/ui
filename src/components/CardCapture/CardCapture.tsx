import * as React from 'react';

import { cn } from '../../utils/cn';
import { Alert, AlertDescription, AlertTitle } from '../Alert';
import { Button } from '../Button';
import {
  AlertCircleIcon,
  CameraIcon,
  CheckIcon,
  RefreshIcon,
  ScanLineIcon,
} from '../Icons';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import { Spinner } from '../Spinner';
import { Text } from '../Text';
import { useCamera } from '../DocumentScanner/useCamera';
import { useDocumentDetection } from '../DocumentScanner/useDocumentDetection';
import { useCardDetection } from './useCardDetection';

export interface CardCaptureProps {
  /** Whether the card-capture modal is open. */
  open: boolean;

  /** Called when the modal should open or close. */
  onOpenChange: (open: boolean) => void;

  /** Called after the user confirms the captured image. */
  onCapture: (file: File) => void;

  /** Browser-accessible URL for the ONNX ID-card model. */
  modelUrl: string;

  /** Public path containing ONNX Runtime Web's WASM assets. */
  wasmPaths?: string;

  /** Enable automatic capture after a stable ID-card detection. */
  enableAutoCapture?: boolean;

  /** Minimum model confidence required for an ID-card prediction. */
  confidenceThreshold?: number;

  /** Number of seconds shown before automatic capture. */
  countdownSeconds?: number;

  /** Modal title. */
  title?: string;

  /** Instructions displayed above the camera. */
  description?: string;
}

interface CaptureStatusOverlayProps {
  isCameraReady: boolean;
  isModelReady: boolean;
  modelError: string | null;
  isInFocus: boolean;
  isBrightnessOk: boolean;
  isStable: boolean;
  isCardDetected: boolean;
  countdown: number;
  enableAutoCapture: boolean;
}

function getCaptureStatus({
  isCameraReady,
  isModelReady,
  modelError,
  isInFocus,
  isBrightnessOk,
  isStable,
  isCardDetected,
  countdown,
  enableAutoCapture,
}: CaptureStatusOverlayProps): string {
  if (!isCameraReady) {
    return 'Starting camera...';
  }

  if (!enableAutoCapture) {
    return 'Position your ID card within the frame';
  }

  if (modelError) {
    return 'Automatic detection unavailable';
  }

  if (!isModelReady) {
    return 'Loading ID-card detector...';
  }

  if (countdown > 0) {
    return `Capturing in ${countdown}...`;
  }

  if (!isInFocus) {
    return 'Hold the camera steady';
  }

  if (!isBrightnessOk) {
    return 'Adjust the lighting';
  }

  if (!isStable) {
    return 'Hold the card steady';
  }

  if (!isCardDetected) {
    return 'Position your ID card within the frame';
  }

  return 'ID card detected';
}

function CaptureStatusOverlay(props: CaptureStatusOverlayProps) {
  const ready =
    props.isCardDetected &&
    props.isInFocus &&
    props.isBrightnessOk &&
    props.isStable;

  const message = getCaptureStatus(props);

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={cn(
          'absolute inset-4 rounded-lg border-4 transition-colors duration-300',
          ready ? 'border-success' : 'border-neutral-100/50'
        )}
      >
        <div className="absolute -top-1 -left-1 h-6 w-6 rounded-tl border-t-4 border-l-4 border-current" />
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-tr border-t-4 border-r-4 border-current" />
        <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl border-b-4 border-l-4 border-current" />
        <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-br border-r-4 border-b-4 border-current" />
      </div>

      <div className="absolute top-3 right-3 left-3 text-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-sm',
            ready
              ? 'bg-success text-white'
              : 'bg-neutral-950/70 text-neutral-50'
          )}
          role="status"
          aria-live="polite"
        >
          {props.isModelReady && !props.modelError ? (
            <ScanLineIcon className="h-4 w-4" />
          ) : (
            <Spinner size="sm" />
          )}

          {message}
        </div>
      </div>

      {props.countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-success flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg">
            <span className="text-4xl font-bold">{props.countdown}</span>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-950">
        <img
          src={previewUrl}
          alt="Captured ID card"
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

function PermissionDeniedMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-4 py-6">
      <Alert variant="warning">
        <AlertCircleIcon className="h-5 w-5" />
        <AlertTitle>Camera access denied</AlertTitle>
        <AlertDescription>
          Allow camera access in your browser settings, then try again.
        </AlertDescription>
      </Alert>

      <div className="flex justify-center">
        <Button
          onClick={onRetry}
          leftIcon={<RefreshIcon className="h-4 w-4" />}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

function CameraUnavailableMessage() {
  return (
    <Alert variant="danger">
      <AlertCircleIcon className="h-5 w-5" />
      <AlertTitle>Camera unavailable</AlertTitle>
      <AlertDescription>
        No available camera was detected on this device.
      </AlertDescription>
    </Alert>
  );
}

export function CardCapture({
  open,
  onOpenChange,
  onCapture,
  modelUrl,
  wasmPaths,
  enableAutoCapture = true,
  confidenceThreshold = 0.7,
  countdownSeconds = 2,
  title = 'Capture ID card',
  description = 'Position your ID card within the frame and hold it steady.',
}: CardCaptureProps) {
  const {
    permission,
    videoRef,
    isReady,
    error: cameraError,
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

  const {
    metrics: qualityMetrics,
    isReadyForCapture: isQualityReady,
    startDetection: startQualityDetection,
    stopDetection: stopQualityDetection,
    resetDetection: resetQualityDetection,
  } = useDocumentDetection(videoRef, {
    enableAutoCapture: false,
    minFocusScore: 15,
    stabilityThreshold: 80,
    stabilityDuration: 400,
  });

  const {
    isModelReady,
    isCardDetected,
    error: cardDetectionError,
    startDetection: startCardDetection,
    stopDetection: stopCardDetection,
    resetDetection: resetCardDetection,
  } = useCardDetection(videoRef, {
    modelUrl,
    wasmPaths,
    confidenceThreshold,
  });

  const [capturedFile, setCapturedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState(0);

  const hasStartedCameraRef = React.useRef(false);
  const autoCaptureStartedRef = React.useRef(false);

  const clearPreview = React.useCallback(() => {
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return null;
    });
  }, []);

  const resetCaptureState = React.useCallback(() => {
    setCapturedFile(null);
    clearPreview();
    setCountdown(0);
    autoCaptureStartedRef.current = false;
  }, [clearPreview]);

  const handleCapture = React.useCallback(() => {
    const file = capturePhoto();

    if (!file) {
      autoCaptureStartedRef.current = false;
      setCountdown(0);
      return;
    }

    stopCardDetection();
    stopQualityDetection();

    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCountdown(0);

    stopCamera();
  }, [capturePhoto, stopCamera, stopCardDetection, stopQualityDetection]);

  const handleClose = React.useCallback(() => {
    stopCamera();
    stopCardDetection();
    stopQualityDetection();
    resetCaptureState();
    hasStartedCameraRef.current = false;
    onOpenChange(false);
  }, [
    onOpenChange,
    resetCaptureState,
    stopCamera,
    stopCardDetection,
    stopQualityDetection,
  ]);

  const handleRetake = React.useCallback(() => {
    resetCaptureState();
    resetCardDetection();
    resetQualityDetection();
    void startCamera();
  }, [
    resetCaptureState,
    resetCardDetection,
    resetQualityDetection,
    startCamera,
  ]);

  const handleConfirm = React.useCallback(() => {
    if (!capturedFile) {
      return;
    }

    onCapture(capturedFile);
    handleClose();
  }, [capturedFile, handleClose, onCapture]);

  React.useEffect(() => {
    if (
      open &&
      permission !== 'denied' &&
      permission !== 'unavailable' &&
      !hasStartedCameraRef.current
    ) {
      hasStartedCameraRef.current = true;
      void startCamera();
    }
  }, [open, permission, startCamera]);

  React.useEffect(() => {
    if (!open) {
      stopCamera();
      stopCardDetection();
      stopQualityDetection();
      resetCaptureState();
      hasStartedCameraRef.current = false;
    }
  }, [
    open,
    resetCaptureState,
    stopCamera,
    stopCardDetection,
    stopQualityDetection,
  ]);

  React.useEffect(() => {
    if (open && isReady && !capturedFile && enableAutoCapture) {
      startQualityDetection();
      startCardDetection();

      return () => {
        stopQualityDetection();
        stopCardDetection();
      };
    }

    stopQualityDetection();
    stopCardDetection();

    return undefined;
  }, [
    capturedFile,
    enableAutoCapture,
    isReady,
    open,
    startCardDetection,
    startQualityDetection,
    stopCardDetection,
    stopQualityDetection,
  ]);

  const isReadyForAutoCapture =
    enableAutoCapture && isQualityReady && isCardDetected && !capturedFile;

  React.useEffect(() => {
    if (!isReadyForAutoCapture) {
      setCountdown(0);
      autoCaptureStartedRef.current = false;
      return;
    }

    if (!autoCaptureStartedRef.current) {
      autoCaptureStartedRef.current = true;
      setCountdown(countdownSeconds);
    }
  }, [countdownSeconds, isReadyForAutoCapture]);

  React.useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const countdownTimer = window.setTimeout(() => {
      if (countdown === 1) {
        setCountdown(0);
        handleCapture();
        return;
      }

      setCountdown((currentCountdown) => Math.max(0, currentCountdown - 1));
    }, 1000);

    return () => {
      window.clearTimeout(countdownTimer);
    };
  }, [countdown, handleCapture]);

  React.useEffect(() => {
    return () => {
      clearPreview();
    };
  }, [clearPreview]);

  const renderContent = () => {
    if (permission === 'denied') {
      return (
        <PermissionDeniedMessage
          onRetry={() => {
            void startCamera();
          }}
        />
      );
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
        <div>
          <Text as="p" size="sm" variant="muted">
            {description}
          </Text>
        </div>

        <div className="relative mx-auto h-[48vh] max-h-[28rem] min-h-64 w-full overflow-hidden rounded-lg bg-neutral-950">
          {' '}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'h-full w-full object-contain transition-opacity duration-300',
              isReady ? 'opacity-100' : 'opacity-0'
            )}
          />
          {!isReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <Text size="sm" className="text-neutral-300">
                Starting camera...
              </Text>
            </div>
          )}
          <CaptureStatusOverlay
            isCameraReady={isReady}
            isModelReady={isModelReady}
            modelError={cardDetectionError}
            isInFocus={qualityMetrics.isInFocus}
            isBrightnessOk={qualityMetrics.isBrightnessOk}
            isStable={qualityMetrics.isStable}
            isCardDetected={isCardDetected}
            countdown={countdown}
            enableAutoCapture={enableAutoCapture}
          />
        </div>

        {cardDetectionError && (
          <Alert variant="warning">
            <AlertCircleIcon className="h-5 w-5" />
            <AlertTitle>Automatic detection unavailable</AlertTitle>
            <AlertDescription>
              {cardDetectionError} You can still capture the image manually.
            </AlertDescription>
          </Alert>
        )}

        {cameraError && (
          <Alert variant="danger">
            <AlertCircleIcon className="h-5 w-5" />
            <AlertTitle>Camera error</AlertTitle>
            <AlertDescription>{cameraError.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={switchCamera}
            disabled={!isReady}
            aria-label={`Switch to ${
              currentFacingMode === 'user' ? 'back' : 'front'
            } camera`}
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
            Manual capture
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
      size="lg"
      aria-label="ID-card capture"
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
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

CardCapture.displayName = 'CardCapture';
