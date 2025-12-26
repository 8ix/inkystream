# Extending Image Processors

This guide explains how to add new dithering algorithms and image processing features to InkyStream.

## Overview

Image processors in InkyStream transform uploaded photos into optimized images for e-ink displays. The main processing stages are:

1. Resize to display dimensions
2. Apply color palette reduction
3. Apply dithering algorithm
4. Output as PNG

## Adding a New Dithering Algorithm

### 1. Understand the Interface

Dithering algorithms implement this interface:

```typescript
// lib/processors/dither.ts

export type DitheringAlgorithm = 
  | 'floyd-steinberg'
  | 'ordered'
  | 'atkinson'
  | 'your-new-algorithm';

export interface DitherOptions {
  palette: string[];
  algorithm: DitheringAlgorithm;
}

export function applyDithering(
  imageBuffer: Buffer,
  options: DitherOptions
): Promise<Buffer>;
```

### 2. Implement the Algorithm

Add your implementation to `lib/processors/dither.ts`:

```typescript
/**
 * Sierra Lite Dithering
 * A simplified error-diffusion algorithm
 */
function applySierraLite(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Get current pixel
      const oldR = output[idx];
      const oldG = output[idx + 1];
      const oldB = output[idx + 2];
      
      // Find nearest palette color
      const newColor = findNearestColor({ r: oldR, g: oldG, b: oldB }, palette);
      
      // Set new color
      output[idx] = newColor.r;
      output[idx + 1] = newColor.g;
      output[idx + 2] = newColor.b;
      
      // Calculate error
      const errR = oldR - newColor.r;
      const errG = oldG - newColor.g;
      const errB = oldB - newColor.b;
      
      // Distribute error (Sierra Lite pattern)
      //       X   2/4
      //   1/4 1/4
      
      if (x + 1 < width) {
        distributeError(output, idx + 4, errR, errG, errB, 2/4);
      }
      if (y + 1 < height) {
        if (x > 0) {
          distributeError(output, idx + width * 4 - 4, errR, errG, errB, 1/4);
        }
        distributeError(output, idx + width * 4, errR, errG, errB, 1/4);
      }
    }
  }
  
  return output;
}
```

### 3. Register the Algorithm

Update the algorithm registry:

```typescript
const DITHERING_ALGORITHMS = {
  'floyd-steinberg': applyFloydSteinberg,
  'ordered': applyOrdered,
  'atkinson': applyAtkinson,
  'sierra-lite': applySierraLite,  // Add your algorithm
};

export function applyDithering(
  imageBuffer: Buffer,
  options: DitherOptions
): Promise<Buffer> {
  const algorithm = DITHERING_ALGORITHMS[options.algorithm];
  if (!algorithm) {
    throw new Error(`Unknown dithering algorithm: ${options.algorithm}`);
  }
  // ... apply algorithm
}
```

### 4. Update Type Definitions

Add the new algorithm to the type:

```typescript
// lib/types/processor.ts
export type DitheringAlgorithm = 
  | 'floyd-steinberg'
  | 'ordered'
  | 'atkinson'
  | 'sierra-lite';  // Add here

export const DITHERING_ALGORITHMS = [
  'floyd-steinberg',
  'ordered',
  'atkinson',
  'sierra-lite',  // Add here
] as const;
```

### 5. Add Tests

Create tests for your algorithm:

```typescript
// __tests__/lib/processors/dither.test.ts
import { applyDithering } from '@/lib/processors/dither';

describe('Sierra Lite Dithering', () => {
  it('should reduce image to palette colors', async () => {
    const testImage = createTestImage(100, 100);
    const palette = ['#000000', '#FFFFFF'];
    
    const result = await applyDithering(testImage, {
      algorithm: 'sierra-lite',
      palette,
    });
    
    // Verify output only contains palette colors
    const colors = extractUniqueColors(result);
    expect(colors.every(c => palette.includes(c))).toBe(true);
  });
  
  it('should preserve image dimensions', async () => {
    const testImage = createTestImage(200, 150);
    
    const result = await applyDithering(testImage, {
      algorithm: 'sierra-lite',
      palette: ['#000000', '#FFFFFF'],
    });
    
    const dimensions = getImageDimensions(result);
    expect(dimensions).toEqual({ width: 200, height: 150 });
  });
});
```

### 6. Document the Algorithm

Add documentation explaining:
- How the algorithm works
- Best use cases
- Visual examples

## Common Dithering Patterns

### Error Diffusion Patterns

**Floyd-Steinberg**:
```
      X   7/16
3/16  5/16  1/16
```

**Jarvis-Judice-Ninke**:
```
          X   7/48  5/48
3/48  5/48  7/48  5/48  3/48
1/48  3/48  5/48  3/48  1/48
```

**Stucki**:
```
          X   8/42  4/42
2/42  4/42  8/42  4/42  2/42
1/42  2/42  4/42  2/42  1/42
```

**Atkinson** (less error spread):
```
      X   1/8  1/8
1/8  1/8  1/8
     1/8
```

### Ordered Dithering (Bayer Matrix)

2x2 Matrix:
```
| 0  2 |
| 3  1 |
```

4x4 Matrix:
```
|  0  8  2 10 |
| 12  4 14  6 |
|  3 11  1  9 |
| 15  7 13  5 |
```

## Helper Functions

### Find Nearest Color

```typescript
interface RGB {
  r: number;
  g: number;
  b: number;
}

function findNearestColor(color: RGB, palette: RGB[]): RGB {
  let minDistance = Infinity;
  let nearest = palette[0];
  
  for (const paletteColor of palette) {
    const distance = colorDistance(color, paletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = paletteColor;
    }
  }
  
  return nearest;
}

function colorDistance(c1: RGB, c2: RGB): number {
  // Euclidean distance in RGB space
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
```

### Distribute Error

```typescript
function distributeError(
  pixels: Uint8ClampedArray,
  idx: number,
  errR: number,
  errG: number,
  errB: number,
  factor: number
): void {
  pixels[idx] = clamp(pixels[idx] + errR * factor);
  pixels[idx + 1] = clamp(pixels[idx + 1] + errG * factor);
  pixels[idx + 2] = clamp(pixels[idx + 2] + errB * factor);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
```

## Performance Considerations

- Use typed arrays (`Uint8ClampedArray`) for pixel data
- Process pixels in row order for cache efficiency
- Consider Web Workers for large images
- Profile with realistic image sizes (800x480)

## Submitting Your Algorithm

1. Implement the algorithm
2. Add comprehensive tests
3. Document usage and best cases
4. Create a pull request with:
   - Algorithm description
   - Test results
   - Before/after image examples





