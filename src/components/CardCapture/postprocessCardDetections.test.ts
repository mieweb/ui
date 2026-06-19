import * as ort from 'onnxruntime-web';
import { describe, expect, it } from 'vitest';

import type { LetterboxMetadata } from './preprocessCardFrame';
import {
  applyNonMaximumSuppression,
  calculateIntersectionOverUnion,
  mapModelBoxToSource,
  parseCardDetections,
  type CardPrediction,
} from './postprocessCardDetections';

const LANDSCAPE_METADATA: LetterboxMetadata = {
  sourceWidth: 1280,
  sourceHeight: 720,
  inputSize: 640,
  scale: 0.5,
  resizedWidth: 640,
  resizedHeight: 360,
  padX: 0,
  padY: 140,
};

function createPrediction(
  confidence: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CardPrediction {
  const width = x2 - x1;
  const height = y2 - y1;

  return {
    classId: 0,
    label: 'id_card',
    confidence,
    x1,
    y1,
    x2,
    y2,
    x: x1 + width / 2,
    y: y1 + height / 2,
    width,
    height,
  };
}

describe('mapModelBoxToSource', () => {
  it('removes letterbox padding and maps coordinates to the source frame', () => {
    const result = mapModelBoxToSource(
      {
        x1: 160,
        y1: 230,
        x2: 480,
        y2: 410,
      },
      LANDSCAPE_METADATA
    );

    expect(result).toEqual({
      x1: 320,
      y1: 180,
      x2: 960,
      y2: 540,
      x: 640,
      y: 360,
      width: 640,
      height: 360,
    });
  });

  it('supports normalized model coordinates', () => {
    const squareMetadata: LetterboxMetadata = {
      sourceWidth: 640,
      sourceHeight: 640,
      inputSize: 640,
      scale: 1,
      resizedWidth: 640,
      resizedHeight: 640,
      padX: 0,
      padY: 0,
    };

    const result = mapModelBoxToSource(
      {
        x1: 0.25,
        y1: 0.25,
        x2: 0.75,
        y2: 0.75,
      },
      squareMetadata
    );

    expect(result).toEqual({
      x1: 160,
      y1: 160,
      x2: 480,
      y2: 480,
      x: 320,
      y: 320,
      width: 320,
      height: 320,
    });
  });
});

describe('calculateIntersectionOverUnion', () => {
  it('returns zero for boxes that do not overlap', () => {
    const first = createPrediction(0.9, 0, 0, 100, 100);
    const second = createPrediction(0.8, 200, 200, 300, 300);

    expect(calculateIntersectionOverUnion(first, second)).toBe(0);
  });

  it('returns one for identical boxes', () => {
    const first = createPrediction(0.9, 0, 0, 100, 100);
    const second = createPrediction(0.8, 0, 0, 100, 100);

    expect(calculateIntersectionOverUnion(first, second)).toBe(1);
  });
});

describe('applyNonMaximumSuppression', () => {
  it('keeps the strongest prediction when boxes overlap', () => {
    const strongest = createPrediction(0.9, 100, 100, 300, 300);

    const overlapping = createPrediction(0.8, 110, 110, 295, 295);

    const separate = createPrediction(0.75, 400, 100, 550, 250);

    expect(
      applyNonMaximumSuppression([overlapping, separate, strongest], 0.45)
    ).toEqual([strongest, separate]);
  });
});

describe('parseCardDetections', () => {
  it('parses [1, attributes, boxes] model output and filters weak predictions', () => {
    const output = new ort.Tensor(
      'float32',
      new Float32Array([
        // center x
        320, 500,
        // center y
        320, 500,
        // width
        320, 50,
        // height
        180, 50,
        // confidence
        0.9, 0.4,
      ]),
      [1, 5, 2]
    );

    const predictions = parseCardDetections(output, LANDSCAPE_METADATA, {
      confidenceThreshold: 0.7,
    });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].confidence).toBeCloseTo(0.9);
    expect(predictions[0].label).toBe('id_card');
    expect(predictions[0].x1).toBeCloseTo(320);
    expect(predictions[0].y1).toBeCloseTo(180);
    expect(predictions[0].width).toBeCloseTo(640);
    expect(predictions[0].height).toBeCloseTo(360);
  });

  it('supports [1, boxes, attributes] model output', () => {
    const output = new ort.Tensor(
      'float32',
      new Float32Array([320, 320, 320, 180, 0.9, 500, 500, 50, 50, 0.4]),
      [1, 2, 5]
    );

    const predictions = parseCardDetections(output, LANDSCAPE_METADATA, {
      confidenceThreshold: 0.7,
    });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].confidence).toBeCloseTo(0.9);
  });

  it('rejects an unsupported output shape', () => {
    const output = new ort.Tensor('float32', new Float32Array(24), [1, 6, 4]);

    expect(() => parseCardDetections(output, LANDSCAPE_METADATA)).toThrow(
      'Expected 5 YOLO attributes per box'
    );
  });

  it('validates confidence and IoU thresholds', () => {
    const output = new ort.Tensor('float32', new Float32Array(5), [1, 5, 1]);

    expect(() =>
      parseCardDetections(output, LANDSCAPE_METADATA, {
        confidenceThreshold: 1.2,
      })
    ).toThrow('Confidence threshold must be between 0 and 1.');

    expect(() =>
      parseCardDetections(output, LANDSCAPE_METADATA, {
        iouThreshold: -0.1,
      })
    ).toThrow('IoU threshold must be between 0 and 1.');
  });
});
