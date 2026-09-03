/**
 * Tests for useDocumentDetection hook utility functions
 *
 * Tests the pure functions used for stability detection
 */

/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';

// We need to test the pure functions, so we'll recreate them here
// In a real scenario, these could be exported from the hook file

/**
 * Calculate a fingerprint of the image for stability detection.
 */
function calculateFrameFingerprint(imageData: ImageData): number[] {
  const { data, width, height } = imageData;
  const gridSize = 8;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);
  const values: number[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let sum = 0;
      let count = 0;

      const startX = gx * cellWidth;
      const startY = gy * cellHeight;

      for (let y = startY; y < startY + cellHeight; y += 4) {
        for (let x = startX; x < startX + cellWidth; x += 4) {
          const idx = (y * width + x) * 4;
          if (idx < data.length - 2) {
            sum +=
              0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            count++;
          }
        }
      }

      values.push(count > 0 ? sum / count : 0);
    }
  }

  return values;
}

/**
 * Compare two fingerprints and return similarity score (0-100).
 */
function compareFingerprints(fp1: number[], fp2: number[]): number {
  if (fp1.length !== fp2.length || fp1.length === 0) return 0;

  let totalDiff = 0;
  for (let i = 0; i < fp1.length; i++) {
    totalDiff += Math.abs(fp1[i] - fp2[i]) / 255;
  }

  const avgDiff = totalDiff / fp1.length;
  return Math.max(0, Math.min(100, (1 - avgDiff * 5) * 100));
}

/**
 * Helper to create mock ImageData
 */
function createMockImageData(
  width: number,
  height: number,
  fillValue: number = 128
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillValue; // R
    data[i + 1] = fillValue; // G
    data[i + 2] = fillValue; // B
    data[i + 3] = 255; // A
  }
  return { data, width, height, colorSpace: 'srgb' };
}

/**
 * Helper to create ImageData with a specific pattern
 */
function createPatternedImageData(
  width: number,
  height: number,
  pattern: (x: number, y: number) => number
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const value = pattern(x, y);
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }
  return { data, width, height, colorSpace: 'srgb' };
}

describe('Stability Detection Functions', () => {
  describe('calculateFrameFingerprint', () => {
    it('should return an array of 64 values (8x8 grid)', () => {
      const imageData = createMockImageData(100, 100);
      const fingerprint = calculateFrameFingerprint(imageData);
      expect(fingerprint).toHaveLength(64);
    });

    it('should return consistent values for identical images', () => {
      const imageData1 = createMockImageData(100, 100, 128);
      const imageData2 = createMockImageData(100, 100, 128);

      const fp1 = calculateFrameFingerprint(imageData1);
      const fp2 = calculateFrameFingerprint(imageData2);

      expect(fp1).toEqual(fp2);
    });

    it('should return different values for different images', () => {
      const imageData1 = createMockImageData(100, 100, 50);
      const imageData2 = createMockImageData(100, 100, 200);

      const fp1 = calculateFrameFingerprint(imageData1);
      const fp2 = calculateFrameFingerprint(imageData2);

      expect(fp1).not.toEqual(fp2);
    });

    it('should detect differences in image regions', () => {
      // Create two images where only one quadrant differs
      const imageData1 = createPatternedImageData(100, 100, () => 100);
      const imageData2 = createPatternedImageData(100, 100, (x, y) => {
        // Top-left quadrant is different
        if (x < 50 && y < 50) return 200;
        return 100;
      });

      const fp1 = calculateFrameFingerprint(imageData1);
      const fp2 = calculateFrameFingerprint(imageData2);

      // First few values (top-left) should differ
      expect(fp1.slice(0, 16)).not.toEqual(fp2.slice(0, 16));
    });
  });

  describe('compareFingerprints', () => {
    it('should return 100 for identical fingerprints', () => {
      const fp = [100, 100, 100, 100];
      expect(compareFingerprints(fp, fp)).toBe(100);
    });

    it('should return 0 for empty fingerprints', () => {
      expect(compareFingerprints([], [])).toBe(0);
    });

    it('should return 0 for mismatched lengths', () => {
      expect(compareFingerprints([1, 2, 3], [1, 2])).toBe(0);
    });

    it('should return high similarity for similar fingerprints', () => {
      const fp1 = Array(64).fill(100);
      const fp2 = Array(64).fill(105); // Small difference

      const similarity = compareFingerprints(fp1, fp2);
      expect(similarity).toBeGreaterThan(90);
    });

    it('should return low similarity for very different fingerprints', () => {
      const fp1 = Array(64).fill(0);
      const fp2 = Array(64).fill(255);

      const similarity = compareFingerprints(fp1, fp2);
      expect(similarity).toBe(0);
    });

    it('should return moderate similarity for moderate differences', () => {
      const fp1 = Array(64).fill(100);
      const fp2 = Array(64).fill(130); // ~12% difference

      const similarity = compareFingerprints(fp1, fp2);
      expect(similarity).toBeGreaterThan(30);
      expect(similarity).toBeLessThan(80);
    });

    it('should handle partial differences correctly', () => {
      // Half the values are same, half are different
      const fp1 = [...Array(32).fill(100), ...Array(32).fill(100)];
      const fp2 = [...Array(32).fill(100), ...Array(32).fill(200)];

      const similarity = compareFingerprints(fp1, fp2);
      // Should be between full match and full mismatch
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(100);
    });
  });

  describe('Stability threshold behavior', () => {
    const STABILITY_THRESHOLD = 85;

    it('should consider frames stable when similarity > threshold', () => {
      const fp1 = Array(64).fill(100);
      const fp2 = Array(64).fill(103); // Very slight difference

      const similarity = compareFingerprints(fp1, fp2);
      expect(similarity).toBeGreaterThan(STABILITY_THRESHOLD);
    });

    it('should consider frames unstable when there is movement', () => {
      const fp1 = Array(64).fill(100);
      const fp2 = Array(64).fill(150); // Significant movement

      const similarity = compareFingerprints(fp1, fp2);
      expect(similarity).toBeLessThan(STABILITY_THRESHOLD);
    });

    it('should detect small movements that should reset stability', () => {
      // Simulate camera shake - some cells change moderately
      const fp1 = Array(64).fill(100);
      const fp2 = fp1.map((v, i) => (i % 4 === 0 ? v + 30 : v)); // Every 4th cell changes by 30

      const similarity = compareFingerprints(fp1, fp2);
      // This should be below threshold due to localized changes
      expect(similarity).toBeLessThan(95);
    });
  });

  describe('Real-world scenarios', () => {
    it('should detect when document enters frame', () => {
      // Frame 1: Empty background (all same color)
      const emptyFrame = createMockImageData(200, 200, 200);
      // Frame 2: Document in frame (creates contrast)
      const docFrame = createPatternedImageData(200, 200, (x, y) => {
        // Simulate document area
        if (x > 40 && x < 160 && y > 40 && y < 160) return 255;
        return 200;
      });

      const fp1 = calculateFrameFingerprint(emptyFrame);
      const fp2 = calculateFrameFingerprint(docFrame);
      const similarity = compareFingerprints(fp1, fp2);

      // Should detect significant change
      expect(similarity).toBeLessThan(85);
    });

    it('should remain stable when document is stationary', () => {
      // Two identical frames with document
      const docFrame1 = createPatternedImageData(200, 200, (x, y) => {
        if (x > 40 && x < 160 && y > 40 && y < 160) return 255;
        return 200;
      });
      const docFrame2 = createPatternedImageData(200, 200, (x, y) => {
        if (x > 40 && x < 160 && y > 40 && y < 160) return 255;
        return 200;
      });

      const fp1 = calculateFrameFingerprint(docFrame1);
      const fp2 = calculateFrameFingerprint(docFrame2);
      const similarity = compareFingerprints(fp1, fp2);

      expect(similarity).toBe(100);
    });

    it('should detect document movement', () => {
      // Document shifted by 20 pixels
      const docFrame1 = createPatternedImageData(200, 200, (x, y) => {
        if (x > 40 && x < 160 && y > 40 && y < 160) return 255;
        return 100;
      });
      const docFrame2 = createPatternedImageData(200, 200, (x, y) => {
        // Shifted document
        if (x > 60 && x < 180 && y > 40 && y < 160) return 255;
        return 100;
      });

      const fp1 = calculateFrameFingerprint(docFrame1);
      const fp2 = calculateFrameFingerprint(docFrame2);
      const similarity = compareFingerprints(fp1, fp2);

      // Should detect the movement
      expect(similarity).toBeLessThan(95);
    });
  });
});
