import type { Tensor } from 'onnxruntime-web';

import type { LetterboxMetadata } from './preprocessCardFrame';

export interface CardBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardPrediction extends CardBoundingBox {
  classId: 0;
  label: 'id_card';
  confidence: number;
}

export interface PostprocessCardDetectionsOptions {
  confidenceThreshold?: number;
  iouThreshold?: number;
}

interface ModelBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_IOU_THRESHOLD = 0.45;
const EXPECTED_ATTRIBUTE_COUNT = 5;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function validateThreshold(value: number, name: string): void {
  if (value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1.`);
  }
}

/**
 * Converts a box from the 640 × 640 letterboxed model coordinates back to
 * coordinates in the original webcam frame.
 */
export function mapModelBoxToSource(
  box: ModelBoundingBox,
  metadata: LetterboxMetadata
): CardBoundingBox {
  let { x1, y1, x2, y2 } = box;

  // Some exported models return normalized values between 0 and 1.
  const coordinatesAreNormalized = Math.max(x1, y1, x2, y2) <= 1.5;

  if (coordinatesAreNormalized) {
    x1 *= metadata.inputSize;
    y1 *= metadata.inputSize;
    x2 *= metadata.inputSize;
    y2 *= metadata.inputSize;
  }

  const sourceX1 = clamp(
    (x1 - metadata.padX) / metadata.scale,
    0,
    metadata.sourceWidth
  );

  const sourceY1 = clamp(
    (y1 - metadata.padY) / metadata.scale,
    0,
    metadata.sourceHeight
  );

  const sourceX2 = clamp(
    (x2 - metadata.padX) / metadata.scale,
    0,
    metadata.sourceWidth
  );

  const sourceY2 = clamp(
    (y2 - metadata.padY) / metadata.scale,
    0,
    metadata.sourceHeight
  );

  const width = Math.max(0, sourceX2 - sourceX1);
  const height = Math.max(0, sourceY2 - sourceY1);

  return {
    x1: sourceX1,
    y1: sourceY1,
    x2: sourceX2,
    y2: sourceY2,
    x: sourceX1 + width / 2,
    y: sourceY1 + height / 2,
    width,
    height,
  };
}

/**
 * Measures how much two bounding boxes overlap.
 *
 * 0 means no overlap.
 * 1 means the boxes are identical.
 */
export function calculateIntersectionOverUnion(
  first: CardBoundingBox,
  second: CardBoundingBox
): number {
  const intersectionX1 = Math.max(first.x1, second.x1);
  const intersectionY1 = Math.max(first.y1, second.y1);
  const intersectionX2 = Math.min(first.x2, second.x2);
  const intersectionY2 = Math.min(first.y2, second.y2);

  const intersectionWidth = Math.max(0, intersectionX2 - intersectionX1);

  const intersectionHeight = Math.max(0, intersectionY2 - intersectionY1);

  const intersectionArea = intersectionWidth * intersectionHeight;

  const firstArea =
    Math.max(0, first.x2 - first.x1) * Math.max(0, first.y2 - first.y1);

  const secondArea =
    Math.max(0, second.x2 - second.x1) * Math.max(0, second.y2 - second.y1);

  const unionArea = firstArea + secondArea - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
}

/**
 * Removes duplicate predictions that describe the same detected card.
 */
export function applyNonMaximumSuppression(
  predictions: CardPrediction[],
  iouThreshold = DEFAULT_IOU_THRESHOLD
): CardPrediction[] {
  validateThreshold(iouThreshold, 'IoU threshold');

  const sortedPredictions = [...predictions].sort(
    (first, second) => second.confidence - first.confidence
  );

  const selectedPredictions: CardPrediction[] = [];

  for (const prediction of sortedPredictions) {
    const overlapsSelectedPrediction = selectedPredictions.some(
      (selectedPrediction) =>
        calculateIntersectionOverUnion(selectedPrediction, prediction) >
        iouThreshold
    );

    if (!overlapsSelectedPrediction) {
      selectedPredictions.push(prediction);
    }
  }

  return selectedPredictions;
}

function createOutputAccessor(output: Tensor): {
  boxCount: number;
  getValue: (boxIndex: number, attributeIndex: number) => number;
} {
  if (output.type !== 'float32') {
    throw new Error(
      `Expected a float32 model output, received ${output.type}.`
    );
  }

  const dimensions = [...output.dims];

  if (dimensions.length !== 3 || dimensions[0] !== 1) {
    throw new Error(
      `Expected YOLO output dimensions [1, 5, boxes] or [1, boxes, 5], received [${dimensions.join(
        ', '
      )}].`
    );
  }

  const data = output.data as Float32Array;
  const [, firstDimension, secondDimension] = dimensions;

  // Model format: [1, attributes, boxes]
  if (firstDimension === EXPECTED_ATTRIBUTE_COUNT) {
    return {
      boxCount: secondDimension,
      getValue: (boxIndex, attributeIndex) =>
        Number(data[attributeIndex * secondDimension + boxIndex]),
    };
  }

  // Alternative export format: [1, boxes, attributes]
  if (secondDimension === EXPECTED_ATTRIBUTE_COUNT) {
    return {
      boxCount: firstDimension,
      getValue: (boxIndex, attributeIndex) =>
        Number(data[boxIndex * EXPECTED_ATTRIBUTE_COUNT + attributeIndex]),
    };
  }

  throw new Error(
    `Expected 5 YOLO attributes per box, received dimensions [${dimensions.join(
      ', '
    )}].`
  );
}

/**
 * Converts the one-class YOLO model output into card predictions in the
 * coordinates of the original webcam frame.
 */
export function parseCardDetections(
  output: Tensor,
  metadata: LetterboxMetadata,
  options: PostprocessCardDetectionsOptions = {}
): CardPrediction[] {
  const confidenceThreshold =
    options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;

  const iouThreshold = options.iouThreshold ?? DEFAULT_IOU_THRESHOLD;

  validateThreshold(confidenceThreshold, 'Confidence threshold');

  validateThreshold(iouThreshold, 'IoU threshold');

  const { boxCount, getValue } = createOutputAccessor(output);

  const predictions: CardPrediction[] = [];

  for (let boxIndex = 0; boxIndex < boxCount; boxIndex += 1) {
    const centerX = getValue(boxIndex, 0);
    const centerY = getValue(boxIndex, 1);
    const width = getValue(boxIndex, 2);
    const height = getValue(boxIndex, 3);
    const confidence = getValue(boxIndex, 4);

    if (confidence < confidenceThreshold) {
      continue;
    }

    const boundingBox = mapModelBoxToSource(
      {
        x1: centerX - width / 2,
        y1: centerY - height / 2,
        x2: centerX + width / 2,
        y2: centerY + height / 2,
      },
      metadata
    );

    if (boundingBox.width === 0 || boundingBox.height === 0) {
      continue;
    }

    predictions.push({
      classId: 0,
      label: 'id_card',
      confidence,
      ...boundingBox,
    });
  }

  return applyNonMaximumSuppression(predictions, iouThreshold);
}
