import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calculateLetterboxMetadata,
  convertRgbaToNchw,
  preprocessCardFrame,
} from './preprocessCardFrame';

describe('calculateLetterboxMetadata', () => {
  it('letterboxes a landscape frame', () => {
    expect(calculateLetterboxMetadata(1280, 720, 640)).toEqual({
      sourceWidth: 1280,
      sourceHeight: 720,
      inputSize: 640,
      scale: 0.5,
      resizedWidth: 640,
      resizedHeight: 360,
      padX: 0,
      padY: 140,
    });
  });

  it('letterboxes a portrait frame', () => {
    expect(calculateLetterboxMetadata(720, 1280, 640)).toEqual({
      sourceWidth: 720,
      sourceHeight: 1280,
      inputSize: 640,
      scale: 0.5,
      resizedWidth: 360,
      resizedHeight: 640,
      padX: 140,
      padY: 0,
    });
  });

  it('rejects invalid dimensions', () => {
    expect(() => calculateLetterboxMetadata(0, 720, 640)).toThrow(
      'Source dimensions must be greater than zero.'
    );

    expect(() => calculateLetterboxMetadata(1280, 720, 0)).toThrow(
      'Model input size must be greater than zero.'
    );
  });
});

describe('convertRgbaToNchw', () => {
  it('normalizes RGB pixels and converts them to channel-first layout', () => {
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]);

    const result = convertRgbaToNchw(rgba, 2, 2);

    expect(Array.from(result)).toEqual([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);
  });

  it('rejects pixel data with an unexpected length', () => {
    expect(() =>
      convertRgbaToNchw(new Uint8ClampedArray([255, 0, 0]), 1, 1)
    ).toThrow('Expected 4 RGBA values, received 3.');
  });
});

describe('preprocessCardFrame', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a float32 ONNX tensor from a browser image source', () => {
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]);

    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: rgba,
        width: 2,
        height: 2,
        colorSpace: 'srgb',
      }),
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(context),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    const source = {} as CanvasImageSource;

    const result = preprocessCardFrame(source, 2, 2, 2);

    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 2, 2);
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0, 2, 2);

    expect(result.tensor.type).toBe('float32');
    expect(result.tensor.dims).toEqual([1, 3, 2, 2]);

    expect(Array.from(result.tensor.data as Float32Array)).toEqual([
      1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1,
    ]);
  });
});
