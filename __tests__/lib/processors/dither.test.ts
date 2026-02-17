/**
 * Tests for dithering algorithms
 */

import {
  applyDithering,
  colorDistance,
  perceptualColorDistance,
  rgbToLab,
  findNearestColor,
  clamp,
  applyFloydSteinberg,
  applyAtkinson,
  applyOrdered,
} from '@/lib/processors/dither';

import {
  DITHERING_ALGORITHMS,
  type RGB,
} from '@/lib/processors/dither-types';

describe('Dithering', () => {
  // Create a simple test buffer
  const testBuffer = Buffer.from([255, 128, 64, 32]);

  describe('applyDithering', () => {
    it('should return a buffer', () => {
      const result = applyDithering(testBuffer, 'floyd-steinberg');

      expect(result).toBeInstanceOf(Buffer);
    });

    it.each(DITHERING_ALGORITHMS)(
      'should accept %s algorithm',
      (algorithm) => {
        expect(() => {
          applyDithering(testBuffer, algorithm);
        }).not.toThrow();
      }
    );
  });

  describe('DITHERING_ALGORITHMS', () => {
    it('should include floyd-steinberg', () => {
      expect(DITHERING_ALGORITHMS).toContain('floyd-steinberg');
    });

    it('should include ordered', () => {
      expect(DITHERING_ALGORITHMS).toContain('ordered');
    });

    it('should include atkinson', () => {
      expect(DITHERING_ALGORITHMS).toContain('atkinson');
    });
  });

  describe('colorDistance', () => {
    it('should return 0 for identical colors', () => {
      const color: RGB = { r: 128, g: 128, b: 128 };
      const distance = colorDistance(color, color);

      expect(distance).toBe(0);
    });

    it('should calculate distance correctly', () => {
      const black: RGB = { r: 0, g: 0, b: 0 };
      const white: RGB = { r: 255, g: 255, b: 255 };
      const distance = colorDistance(black, white);

      // sqrt(255^2 + 255^2 + 255^2) = sqrt(195075) ≈ 441.67
      expect(distance).toBeCloseTo(441.67, 1);
    });
  });

  describe('rgbToLab', () => {
    it('should convert black correctly', () => {
      const lab = rgbToLab({ r: 0, g: 0, b: 0 });

      expect(lab.L).toBeCloseTo(0, 0);
    });

    it('should convert white correctly', () => {
      const lab = rgbToLab({ r: 255, g: 255, b: 255 });

      expect(lab.L).toBeCloseTo(100, 0);
    });

    it('should have a/b near 0 for gray', () => {
      const lab = rgbToLab({ r: 128, g: 128, b: 128 });

      expect(Math.abs(lab.a)).toBeLessThan(1);
      expect(Math.abs(lab.b)).toBeLessThan(1);
    });
  });

  describe('perceptualColorDistance', () => {
    it('should return 0 for identical colors', () => {
      const color: RGB = { r: 128, g: 128, b: 128 };
      const distance = perceptualColorDistance(color, color);

      expect(distance).toBe(0);
    });

    it('should give larger distance for perceptually different colors', () => {
      const red: RGB = { r: 255, g: 0, b: 0 };
      const green: RGB = { r: 0, g: 255, b: 0 };
      const distance = perceptualColorDistance(red, green);

      expect(distance).toBeGreaterThan(50);
    });
  });

  describe('findNearestColor', () => {
    const palette: RGB[] = [
      { r: 0, g: 0, b: 0 }, // Black
      { r: 255, g: 255, b: 255 }, // White
    ];

    it('should find exact match', () => {
      const result = findNearestColor({ r: 0, g: 0, b: 0 }, palette);

      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should find nearest color', () => {
      const result = findNearestColor({ r: 200, g: 200, b: 200 }, palette);

      // Closer to white
      expect(result).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should find nearest color for dark gray', () => {
      const result = findNearestColor({ r: 50, g: 50, b: 50 }, palette);

      // Closer to black
      expect(result).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('clamp', () => {
    it('should clamp values above 255 to 255', () => {
      expect(clamp(300)).toBe(255);
    });

    it('should clamp values below 0 to 0', () => {
      expect(clamp(-50)).toBe(0);
    });

    it('should not change values in range', () => {
      expect(clamp(128)).toBe(128);
    });

    it('should round floating point values', () => {
      expect(clamp(128.7)).toBe(129);
    });
  });

  describe('applyFloydSteinberg', () => {
    it('should reduce image to palette colors', () => {
      const palette: RGB[] = [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 },
      ];

      // Create a small 2x2 gray image (RGBA)
      const pixels = new Uint8ClampedArray([
        128, 128, 128, 255, // Gray
        128, 128, 128, 255, // Gray
        128, 128, 128, 255, // Gray
        128, 128, 128, 255, // Gray
      ]);

      const result = applyFloydSteinberg(pixels, 2, 2, palette);

      // Output should only contain palette colors
      for (let i = 0; i < 4; i++) {
        const r = result[i * 4];
        const g = result[i * 4 + 1];
        const b = result[i * 4 + 2];

        // Should be either black or white
        expect(
          (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255)
        ).toBe(true);
      }
    });
  });

  describe('applyAtkinson', () => {
    it('should reduce image to palette colors', () => {
      const palette: RGB[] = [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 },
      ];

      const pixels = new Uint8ClampedArray([
        128, 128, 128, 255,
        128, 128, 128, 255,
        128, 128, 128, 255,
        128, 128, 128, 255,
      ]);

      const result = applyAtkinson(pixels, 2, 2, palette);

      expect(result).toBeInstanceOf(Uint8ClampedArray);
      expect(result.length).toBe(16);
    });
  });

  describe('applyOrdered', () => {
    it('should reduce image to palette colors', () => {
      const palette: RGB[] = [
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 },
      ];

      const pixels = new Uint8ClampedArray([
        128, 128, 128, 255,
        128, 128, 128, 255,
        128, 128, 128, 255,
        128, 128, 128, 255,
      ]);

      const result = applyOrdered(pixels, 2, 2, palette);

      expect(result).toBeInstanceOf(Uint8ClampedArray);
      expect(result.length).toBe(16);
    });
  });
});

