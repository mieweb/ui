import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCamera } from '../DocumentScanner/useCamera';
import { useDocumentDetection } from '../DocumentScanner/useDocumentDetection';
import { CardCapture } from './CardCapture';
import { useCardDetection } from './useCardDetection';

vi.mock('../DocumentScanner/useCamera', () => ({
  useCamera: vi.fn(),
}));

vi.mock('../DocumentScanner/useDocumentDetection', () => ({
  useDocumentDetection: vi.fn(),
}));

vi.mock('./useCardDetection', () => ({
  useCardDetection: vi.fn(),
}));

const mockUseCamera = vi.mocked(useCamera);
const mockUseDocumentDetection = vi.mocked(useDocumentDetection);
const mockUseCardDetection = vi.mocked(useCardDetection);

const mockStartCamera = vi.fn().mockResolvedValue(undefined);
const mockStopCamera = vi.fn();
const mockCapturePhoto = vi.fn();
const mockSwitchCamera = vi.fn();

const mockStartQualityDetection = vi.fn();
const mockStopQualityDetection = vi.fn();
const mockResetQualityDetection = vi.fn();

const mockStartCardDetection = vi.fn();
const mockStopCardDetection = vi.fn();
const mockResetCardDetection = vi.fn();

const mockCreateObjectUrl = vi.fn(() => 'blob:card-preview');
const mockRevokeObjectUrl = vi.fn();

function createCapturedFile(): File {
  return new File(['captured-card'], 'captured-card.jpg', {
    type: 'image/jpeg',
  });
}

function setupCameraMock(
  overrides: Partial<ReturnType<typeof useCamera>> = {}
): void {
  mockUseCamera.mockReturnValue({
    permission: 'granted',
    stream: null,
    videoRef: React.createRef<HTMLVideoElement>(),
    isReady: true,
    error: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    capturePhoto: mockCapturePhoto,
    switchCamera: mockSwitchCamera,
    currentFacingMode: 'environment',
    ...overrides,
  });
}

function setupQualityDetectionMock(
  overrides: Partial<ReturnType<typeof useDocumentDetection>> = {}
): void {
  mockUseDocumentDetection.mockReturnValue({
    isDetecting: true,
    metrics: {
      focusScore: 100,
      isInFocus: true,
      brightness: 120,
      isBrightnessOk: true,
      boundary: null,
      isDocumentDetected: true,
      documentCoverage: 50,
      isStable: true,
      stabilityDuration: 500,
    },
    isReadyForCapture: true,
    captureCountdown: 0,
    error: null,
    startDetection: mockStartQualityDetection,
    stopDetection: mockStopQualityDetection,
    resetDetection: mockResetQualityDetection,
    ...overrides,
  });
}

function setupCardDetectionMock(
  overrides: Partial<ReturnType<typeof useCardDetection>> = {}
): void {
  mockUseCardDetection.mockReturnValue({
    status: 'detected',
    isModelReady: true,
    isDetecting: true,
    isCardDetected: true,
    confidence: 0.91,
    consecutiveDetections: 2,
    error: null,
    startDetection: mockStartCardDetection,
    stopDetection: mockStopCardDetection,
    resetDetection: mockResetCardDetection,
    ...overrides,
  });
}

function renderCardCapture(
  props: Partial<React.ComponentProps<typeof CardCapture>> = {}
) {
  const onOpenChange = vi.fn();
  const onCapture = vi.fn();

  render(
    <CardCapture
      open
      modelUrl="/models/id-card-detector.onnx"
      onOpenChange={onOpenChange}
      onCapture={onCapture}
      {...props}
    />
  );

  return {
    onOpenChange,
    onCapture,
  };
}

describe('CardCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: mockCreateObjectUrl,
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: mockRevokeObjectUrl,
    });

    mockCapturePhoto.mockReturnValue(createCapturedFile());

    setupCameraMock();
    setupQualityDetectionMock();
    setupCardDetectionMock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the camera and detection hooks when opened', async () => {
    renderCardCapture();

    await waitFor(() => {
      expect(mockStartCamera).toHaveBeenCalled();
    });

    expect(mockStartQualityDetection).toHaveBeenCalled();
    expect(mockStartCardDetection).toHaveBeenCalled();

    expect(mockUseDocumentDetection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        enableAutoCapture: false,
        stabilityThreshold: 80,
        stabilityDuration: 400,
      })
    );
  });

  it('captures manually and returns the confirmed File', async () => {
    const capturedFile = createCapturedFile();
    mockCapturePhoto.mockReturnValue(capturedFile);

    const { onCapture, onOpenChange } = renderCardCapture();

    fireEvent.click(
      screen.getByRole('button', {
        name: /manual capture/i,
      })
    );

    expect(await screen.findByAltText('Captured ID card')).toBeInTheDocument();

    expect(mockStopCamera).toHaveBeenCalled();
    expect(mockStopCardDetection).toHaveBeenCalled();
    expect(mockStopQualityDetection).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', {
        name: /use this photo/i,
      })
    );

    expect(onCapture).toHaveBeenCalledWith(capturedFile);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('restarts the camera and detectors when retaking', async () => {
    renderCardCapture();

    fireEvent.click(
      screen.getByRole('button', {
        name: /manual capture/i,
      })
    );

    expect(await screen.findByAltText('Captured ID card')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /retake/i,
      })
    );

    expect(mockResetCardDetection).toHaveBeenCalled();
    expect(mockResetQualityDetection).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockStartCamera).toHaveBeenCalledTimes(2);
    });

    expect(
      screen.getByRole('button', {
        name: /manual capture/i,
      })
    ).toBeInTheDocument();
  });

  it('shows a permission message and allows retrying the camera', () => {
    setupCameraMock({
      permission: 'denied',
      isReady: false,
    });

    renderCardCapture();

    expect(screen.getByText('Camera access denied')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /try again/i,
      })
    );

    expect(mockStartCamera).toHaveBeenCalledTimes(1);
  });

  it('keeps manual capture available when model detection fails', () => {
    setupCardDetectionMock({
      status: 'error',
      isModelReady: false,
      isDetecting: false,
      isCardDetected: false,
      confidence: 0,
      consecutiveDetections: 0,
      error: 'Unable to load the card detector.',
    });

    renderCardCapture();

    const modelWarning = screen.getByRole('alert');

    expect(
      within(modelWarning).getByText('Automatic detection unavailable')
    ).toBeInTheDocument();

    expect(
      within(modelWarning).getByText(/unable to load the card detector/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /manual capture/i,
      })
    ).toBeEnabled();
  });

  it('automatically captures after the readiness countdown', async () => {
    vi.useFakeTimers();

    const capturedFile = createCapturedFile();
    mockCapturePhoto.mockReturnValue(capturedFile);

    renderCardCapture({
      countdownSeconds: 2,
    });

    expect(screen.getByText('Capturing in 2...')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Capturing in 1...')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockCapturePhoto).toHaveBeenCalled();

    expect(screen.getByAltText('Captured ID card')).toBeInTheDocument();
  });

  it('closes and cleans up when cancel is selected', () => {
    const { onOpenChange } = renderCardCapture();

    fireEvent.click(
      screen.getByRole('button', {
        name: /cancel/i,
      })
    );

    expect(mockStopCamera).toHaveBeenCalled();
    expect(mockStopCardDetection).toHaveBeenCalled();
    expect(mockStopQualityDetection).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
