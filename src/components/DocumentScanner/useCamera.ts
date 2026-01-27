import * as React from 'react';
import type { CameraPermission } from './types';

/**
 * Hook options for useCamera
 */
export interface UseCameraOptions {
  /** Preferred facing mode for mobile cameras */
  facingMode?: 'user' | 'environment';
  /** Ideal video width */
  width?: number;
  /** Ideal video height */
  height?: number;
}

/**
 * Hook return type for useCamera
 */
export interface UseCameraReturn {
  /** Current camera permission state */
  permission: CameraPermission;
  /** Video stream */
  stream: MediaStream | null;
  /** Ref to attach to video element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the camera is ready */
  isReady: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Start the camera */
  startCamera: () => Promise<void>;
  /** Stop the camera */
  stopCamera: () => void;
  /** Capture a photo from the video stream */
  capturePhoto: () => File | null;
  /** Switch between front and back camera */
  switchCamera: () => void;
  /** Current facing mode */
  currentFacingMode: 'user' | 'environment';
}

/**
 * Check if the device has camera support
 */
function hasCameraSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check camera permission status
 */
async function checkCameraPermission(): Promise<CameraPermission> {
  if (!hasCameraSupport()) {
    return 'unavailable';
  }

  try {
    // Check if permissions API is available
    if (navigator.permissions) {
      const result = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      return result.state as CameraPermission;
    }
    // If permissions API is not available, we assume prompt state
    return 'prompt';
  } catch {
    // Some browsers don't support querying camera permission
    return 'prompt';
  }
}

/**
 * Hook for managing camera access and photo capture
 *
 * @example
 * ```tsx
 * const {
 *   permission,
 *   videoRef,
 *   isReady,
 *   startCamera,
 *   stopCamera,
 *   capturePhoto,
 * } = useCamera({
 *   facingMode: 'environment',
 *   width: 1920,
 *   height: 1080,
 * });
 * ```
 */
export function useCamera({
  facingMode: initialFacingMode = 'environment',
  width = 1920,
  height = 1080,
}: UseCameraOptions = {}): UseCameraReturn {
  const [permission, setPermission] =
    React.useState<CameraPermission>('prompt');
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = React.useState<
    'user' | 'environment'
  >(initialFacingMode);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Check initial permission status
  React.useEffect(() => {
    checkCameraPermission().then(setPermission);
  }, []);

  // Cleanup stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = React.useCallback(async () => {
    if (!hasCameraSupport()) {
      setPermission('unavailable');
      setError(new Error('Camera is not supported on this device'));
      return;
    }

    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermission('granted');

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);

      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setPermission('denied');
      } else if (
        error.name === 'NotFoundError' ||
        error.name === 'DevicesNotFoundError'
      ) {
        setPermission('unavailable');
      }
    }
  }, [currentFacingMode, width, height]);

  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const switchCamera = React.useCallback(() => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);

    // If camera is running, restart with new facing mode
    if (stream) {
      stopCamera();
      // Use setTimeout to allow state to update
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [currentFacingMode, stream, stopCamera, startCamera]);

  const capturePhoto = React.useCallback((): File | null => {
    if (!videoRef.current || !isReady) {
      return null;
    }

    const video = videoRef.current;

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];

    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: mimeType });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `capture-${timestamp}.jpg`;

    return new File([blob], filename, { type: 'image/jpeg' });
  }, [isReady]);

  return {
    permission,
    stream,
    videoRef,
    isReady,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    currentFacingMode,
  };
}
