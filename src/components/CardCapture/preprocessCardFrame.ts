import * as ort from 'onnxruntime-web';

export interface LetterboxMetadata {
  sourceWidth: number;
  sourceHeight: number;
  inputSize: number;
  scale: number;
  resizedWidth: number;
  resizedHeight: number;
  padX: number;
  padY: number;
}

export interface PreprocessedCardFrame {
  tensor: ort.Tensor;
  metadata: LetterboxMetadata;
}

const LETTERBOX_BACKGROUND = 'rgb(114, 114, 114)';

export function calculateLetterboxMetadata(
  sourceWidth: number,
  sourceHeight: number,
  inputSize: number
): LetterboxMetadata {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Source dimensions must be greater than zero.');
  }

  if (inputSize <= 0) {
    throw new Error('Model input size must be greater than zero.');
  }

  const scale = Math.min(inputSize / sourceWidth, inputSize / sourceHeight);

  const resizedWidth = Math.round(sourceWidth * scale);
  const resizedHeight = Math.round(sourceHeight * scale);

  const padX = Math.floor((inputSize - resizedWidth) / 2);
  const padY = Math.floor((inputSize - resizedHeight) / 2);

  return {
    sourceWidth,
    sourceHeight,
    inputSize,
    scale,
    resizedWidth,
    resizedHeight,
    padX,
    padY,
  };
}

export function convertRgbaToNchw(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array {
  const pixelCount = width * height;
  const expectedLength = pixelCount * 4;

  if (rgba.length !== expectedLength) {
    throw new Error(
      `Expected ${expectedLength} RGBA values, received ${rgba.length}.`
    );
  }

  const tensorData = new Float32Array(pixelCount * 3);

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const rgbaIndex = pixelIndex * 4;

    tensorData[pixelIndex] = rgba[rgbaIndex] / 255;
    tensorData[pixelCount + pixelIndex] = rgba[rgbaIndex + 1] / 255;
    tensorData[pixelCount * 2 + pixelIndex] = rgba[rgbaIndex + 2] / 255;
  }

  return tensorData;
}

export function preprocessCardFrame(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  inputSize = 640
): PreprocessedCardFrame {
  const metadata = calculateLetterboxMetadata(
    sourceWidth,
    sourceHeight,
    inputSize
  );

  const canvas = document.createElement('canvas');
  canvas.width = inputSize;
  canvas.height = inputSize;

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error('Unable to create a canvas rendering context.');
  }

  context.fillStyle = LETTERBOX_BACKGROUND;
  context.fillRect(0, 0, inputSize, inputSize);

  context.drawImage(
    source,
    metadata.padX,
    metadata.padY,
    metadata.resizedWidth,
    metadata.resizedHeight
  );

  const imageData = context.getImageData(0, 0, inputSize, inputSize);

  const tensorData = convertRgbaToNchw(imageData.data, inputSize, inputSize);

  return {
    tensor: new ort.Tensor('float32', tensorData, [1, 3, inputSize, inputSize]),
    metadata,
  };
}
