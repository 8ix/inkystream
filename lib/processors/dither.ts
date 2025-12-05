/**
 * Dithering algorithms for e-ink display optimization
 * Implements various error-diffusion and ordered dithering methods
 * 
 * NOTE: This file uses sharp and should only be imported in server-side code.
 * For client components, import from './dither-types' instead.
 */

import sharp from 'sharp';

// Re-export types for convenience in server-side code
export {
  DITHERING_ALGORITHMS,
  DEFAULT_ENHANCEMENT_OPTIONS,
  FIT_MODES,
  FIT_MODE_OPTIONS,
  type DitheringAlgorithm,
  type RGB,
  type LAB,
  type EnhancementOptions,
  type FitMode,
} from './dither-types';

import type { DitheringAlgorithm, RGB, LAB, EnhancementOptions, FitMode } from './dither-types';
import { DEFAULT_ENHANCEMENT_OPTIONS } from './dither-types';

/**
 * Analyze if rotating the image would provide a better fit
 * Returns true if rotation would reduce cropping or letterboxing
 */
export function shouldRotateForBetterFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): boolean {
  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;
  
  // Source is portrait (tall), target is landscape (wide)
  const srcIsPortrait = srcAspect < 1;
  const targetIsLandscape = targetAspect > 1;
  
  // Source is landscape (wide), target is portrait (tall)
  const srcIsLandscape = srcAspect > 1;
  const targetIsPortrait = targetAspect < 1;
  
  // Calculate how much content we'd lose with and without rotation
  const normalCoverage = calculateCoverage(srcWidth, srcHeight, targetWidth, targetHeight);
  const rotatedCoverage = calculateCoverage(srcHeight, srcWidth, targetWidth, targetHeight);
  
  // Rotate if it significantly improves coverage (more than 10% better)
  // This prevents unnecessary rotations for near-square images
  return rotatedCoverage > normalCoverage * 1.1;
}

/**
 * Calculate what percentage of the source image would be visible
 * when using 'cover' mode (higher is better, 1.0 = all visible)
 */
function calculateCoverage(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): number {
  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;
  
  if (srcAspect > targetAspect) {
    // Source is wider - will be cropped on sides
    return targetAspect / srcAspect;
  } else {
    // Source is taller - will be cropped on top/bottom
    return srcAspect / targetAspect;
  }
}

/**
 * Calculate how much of the frame would be filled
 * when using 'contain' mode (higher is better, 1.0 = full frame)
 */
function calculateFrameFill(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): number {
  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;
  
  if (srcAspect > targetAspect) {
    // Source is wider - will have bars top/bottom
    return targetAspect / srcAspect;
  } else {
    // Source is taller - will have bars left/right
    return srcAspect / targetAspect;
  }
}

/**
 * Determine the best fit strategy for an image
 * Returns whether to rotate and the fit mode to use
 */
export function determineBestFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
  preferredMode: FitMode
): { rotate: boolean; fit: 'cover' | 'contain' } {
  // For non-smart modes, respect the user's choice
  if (preferredMode === 'fill') {
    return { rotate: false, fit: 'cover' };
  }
  if (preferredMode === 'contain') {
    return { rotate: false, fit: 'contain' };
  }
  
  // Smart mode: analyze the image and decide
  const shouldRotate = shouldRotateForBetterFit(srcWidth, srcHeight, targetWidth, targetHeight);
  
  // Use the potentially rotated dimensions
  const effectiveSrcWidth = shouldRotate ? srcHeight : srcWidth;
  const effectiveSrcHeight = shouldRotate ? srcWidth : srcHeight;
  
  // Calculate coverage with 'cover' and frame fill with 'contain'
  const coverCoverage = calculateCoverage(effectiveSrcWidth, effectiveSrcHeight, targetWidth, targetHeight);
  const containFill = calculateFrameFill(effectiveSrcWidth, effectiveSrcHeight, targetWidth, targetHeight);
  
  // If cover would keep 85%+ of the image, use it (minimal cropping)
  // Otherwise use contain to show the whole image
  const useCover = coverCoverage >= 0.85;
  
  return {
    rotate: shouldRotate,
    fit: useCover ? 'cover' : 'contain',
  };
}

/**
 * Apply dithering algorithm to an image buffer
 * Currently a simplified implementation - returns processed image
 */
export function applyDithering(
  imageBuffer: Buffer,
  algorithm: DitheringAlgorithm = 'floyd-steinberg'
): Buffer {
  // For the MVP, we return the buffer as-is
  // Sharp will handle color quantization during processing
  // Full dithering implementation would process raw pixel data
  return imageBuffer;
}

/**
 * Convert RGB to LAB color space for perceptual color comparison
 * Uses D65 illuminant (standard daylight)
 */
export function rgbToLab(rgb: RGB): LAB {
  // Convert RGB to linear RGB (remove gamma)
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ (D65 illuminant)
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.0;
  const z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;

  // Convert XYZ to LAB
  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? Math.pow(x, 1/3) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.pow(y, 1/3) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.pow(z, 1/3) : (kappa * z + 16) / 116;

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * Calculate perceptual color distance using CIE76 formula
 * This matches how humans perceive color differences
 */
export function perceptualColorDistance(c1: RGB, c2: RGB): number {
  const lab1 = rgbToLab(c1);
  const lab2 = rgbToLab(c2);
  
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Calculate Euclidean distance between two colors in RGB space
 * Kept for backwards compatibility, but perceptualColorDistance is preferred
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Find the nearest color in the palette using perceptual color matching
 */
export function findNearestColor(color: RGB, palette: RGB[]): RGB {
  let minDistance = Infinity;
  let nearest = palette[0];

  for (const paletteColor of palette) {
    // Use perceptual color distance for better matching
    const distance = perceptualColorDistance(color, paletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = paletteColor;
    }
  }

  return nearest;
}

/**
 * Clamp a value to the 0-255 range
 */
export function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Apply Floyd-Steinberg dithering to raw pixel data
 * Uses serpentine scanning (alternating direction each row) for better results
 * Error diffusion pattern:
 *       X   7/16
 * 3/16  5/16  1/16
 */
export function applyFloydSteinberg(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);

  for (let y = 0; y < height; y++) {
    // Serpentine scanning: alternate direction each row to reduce banding
    const leftToRight = y % 2 === 0;
    
    const startX = leftToRight ? 0 : width - 1;
    const endX = leftToRight ? width : -1;
    const stepX = leftToRight ? 1 : -1;

    for (let x = startX; x !== endX; x += stepX) {
      const idx = (y * width + x) * 4;

      // Get current pixel color
      const oldColor: RGB = {
        r: output[idx],
        g: output[idx + 1],
        b: output[idx + 2],
      };

      // Find nearest palette color
      const newColor = findNearestColor(oldColor, palette);

      // Set new color
      output[idx] = newColor.r;
      output[idx + 1] = newColor.g;
      output[idx + 2] = newColor.b;

      // Calculate error
      const errR = oldColor.r - newColor.r;
      const errG = oldColor.g - newColor.g;
      const errB = oldColor.b - newColor.b;

      // Distribute error to neighboring pixels
      // Direction-aware error distribution for serpentine scanning
      const forward = stepX; // +1 for left-to-right, -1 for right-to-left
      
      // Forward (next pixel in scan direction): 7/16
      const nextX = x + forward;
      if (nextX >= 0 && nextX < width) {
        const i = (y * width + nextX) * 4;
        output[i] = clamp(output[i] + (errR * 7) / 16);
        output[i + 1] = clamp(output[i + 1] + (errG * 7) / 16);
        output[i + 2] = clamp(output[i + 2] + (errB * 7) / 16);
      }

      if (y + 1 < height) {
        // Bottom-backward (opposite of scan direction): 3/16
        const backX = x - forward;
        if (backX >= 0 && backX < width) {
          const i = ((y + 1) * width + backX) * 4;
          output[i] = clamp(output[i] + (errR * 3) / 16);
          output[i + 1] = clamp(output[i + 1] + (errG * 3) / 16);
          output[i + 2] = clamp(output[i + 2] + (errB * 3) / 16);
        }

        // Bottom: 5/16
        const iBottom = ((y + 1) * width + x) * 4;
        output[iBottom] = clamp(output[iBottom] + (errR * 5) / 16);
        output[iBottom + 1] = clamp(output[iBottom + 1] + (errG * 5) / 16);
        output[iBottom + 2] = clamp(output[iBottom + 2] + (errB * 5) / 16);

        // Bottom-forward (same as scan direction): 1/16
        if (nextX >= 0 && nextX < width) {
          const i = ((y + 1) * width + nextX) * 4;
          output[i] = clamp(output[i] + (errR * 1) / 16);
          output[i + 1] = clamp(output[i + 1] + (errG * 1) / 16);
          output[i + 2] = clamp(output[i + 2] + (errB * 1) / 16);
        }
      }
    }
  }

  return output;
}

/**
 * Apply Atkinson dithering to raw pixel data
 * Error diffusion pattern (less error spread):
 *       X   1/8  1/8
 * 1/8  1/8  1/8
 *      1/8
 */
export function applyAtkinson(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const oldColor: RGB = {
        r: output[idx],
        g: output[idx + 1],
        b: output[idx + 2],
      };

      const newColor = findNearestColor(oldColor, palette);

      output[idx] = newColor.r;
      output[idx + 1] = newColor.g;
      output[idx + 2] = newColor.b;

      // Atkinson only distributes 6/8 of the error (3/4)
      const errR = (oldColor.r - newColor.r) / 8;
      const errG = (oldColor.g - newColor.g) / 8;
      const errB = (oldColor.b - newColor.b) / 8;

      const distribute = (i: number) => {
        output[i] = clamp(output[i] + errR);
        output[i + 1] = clamp(output[i + 1] + errG);
        output[i + 2] = clamp(output[i + 2] + errB);
      };

      // Right
      if (x + 1 < width) distribute(idx + 4);
      // Right+1
      if (x + 2 < width) distribute(idx + 8);

      if (y + 1 < height) {
        // Bottom-left
        if (x > 0) distribute(idx + width * 4 - 4);
        // Bottom
        distribute(idx + width * 4);
        // Bottom-right
        if (x + 1 < width) distribute(idx + width * 4 + 4);
      }

      // Two rows down, center
      if (y + 2 < height) distribute(idx + width * 8);
    }
  }

  return output;
}

/**
 * 4x4 Bayer matrix for ordered dithering
 */
const BAYER_MATRIX_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Apply ordered (Bayer) dithering to raw pixel data
 */
export function applyOrdered(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  const matrixSize = 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Get threshold from Bayer matrix
      const threshold =
        (BAYER_MATRIX_4X4[y % matrixSize][x % matrixSize] / 16 - 0.5) * 64;

      const color: RGB = {
        r: clamp(output[idx] + threshold),
        g: clamp(output[idx + 1] + threshold),
        b: clamp(output[idx + 2] + threshold),
      };

      const newColor = findNearestColor(color, palette);

      output[idx] = newColor.r;
      output[idx + 1] = newColor.g;
      output[idx + 2] = newColor.b;
    }
  }

  return output;
}

/**
 * Parse hex color to RGB values
 */
function hexToRgbValues(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

/**
 * Add subtle noise to solid color regions to enable dithering patterns
 * This helps letterbox bars blend with the e-ink aesthetic
 */
function addNoiseToSolidRegions(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  noiseAmount: number = 8
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // Add slight random noise to each channel
    // Using a deterministic pattern based on position for consistency
    const noise = ((i * 7) % 17) - 8; // Range: -8 to +8
    const noise2 = ((i * 11) % 13) - 6; // Different pattern
    
    output[idx] = clamp(output[idx] + (noise * noiseAmount) / 8);
    output[idx + 1] = clamp(output[idx + 1] + (noise2 * noiseAmount) / 8);
    output[idx + 2] = clamp(output[idx + 2] + ((noise + noise2) * noiseAmount) / 16);
  }
  
  return output;
}

/**
 * Process image with dithering using Sharp
 * Includes smart fitting and pre-processing for better e-ink results
 */
export async function processWithDithering(
  inputBuffer: Buffer,
  width: number,
  height: number,
  palette: RGB[],
  algorithm: DitheringAlgorithm = 'floyd-steinberg',
  enhancement: EnhancementOptions = DEFAULT_ENHANCEMENT_OPTIONS
): Promise<Buffer> {
  // Get source image metadata to determine dimensions
  const metadata = await sharp(inputBuffer).metadata();
  const srcWidth = metadata.width || width;
  const srcHeight = metadata.height || height;
  
  // Determine the best fit strategy
  const fitMode = enhancement.fitMode || 'smart';
  const { rotate, fit } = determineBestFit(srcWidth, srcHeight, width, height, fitMode);
  
  // Start building the pipeline
  let pipeline = sharp(inputBuffer);
  
  // Apply rotation if smart fit determined it would help
  if (rotate) {
    pipeline = pipeline.rotate(90);
  }
  
  // Parse background color for letterboxing
  const bgColor = hexToRgbValues(enhancement.backgroundColor || '#FFFFFF');
  
  // Apply the resize with appropriate fit mode
  pipeline = pipeline.resize(width, height, {
    fit: fit,
    position: 'center',
    background: bgColor,
  });
  
  // For 'contain' mode, we need to extend/flatten to fill the frame with background
  if (fit === 'contain') {
    pipeline = pipeline.flatten({ background: bgColor });
  }

  // Apply enhancement options for better dithering results
  if (enhancement.autoContrast) {
    // Normalize stretches the histogram for better contrast
    pipeline = pipeline.normalize();
  }

  // Boost saturation - colors pop better on limited palette displays
  if (enhancement.saturation !== 1.0) {
    pipeline = pipeline.modulate({
      saturation: enhancement.saturation,
    });
  }

  // Denoise with median filter - reduces speckling in gradients
  if (enhancement.denoise) {
    pipeline = pipeline.median(3);
  }

  // Sharpen to restore edges lost from median filter and resize
  if (enhancement.sharpen) {
    pipeline = pipeline.sharpen({
      sigma: 0.8,
      m1: 1.0,
      m2: 0.5,
    });
  }

  // Get raw pixel data
  const processed = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = processed;

  // Convert to RGBA if needed
  let pixels: Uint8ClampedArray;
  if (info.channels === 3) {
    // Convert RGB to RGBA
    pixels = new Uint8ClampedArray(info.width * info.height * 4);
    for (let i = 0; i < info.width * info.height; i++) {
      pixels[i * 4] = data[i * 3];
      pixels[i * 4 + 1] = data[i * 3 + 1];
      pixels[i * 4 + 2] = data[i * 3 + 2];
      pixels[i * 4 + 3] = 255;
    }
  } else {
    pixels = new Uint8ClampedArray(data);
  }

  // For contain/letterbox mode, add subtle noise to help dithering create patterns
  // on solid color regions (like letterbox bars) so they match the e-ink aesthetic
  if (fit === 'contain') {
    pixels = addNoiseToSolidRegions(pixels, info.width, info.height, 6);
  }

  // Apply dithering algorithm
  let dithered: Uint8ClampedArray;
  switch (algorithm) {
    case 'floyd-steinberg':
      dithered = applyFloydSteinberg(pixels, info.width, info.height, palette);
      break;
    case 'atkinson':
      dithered = applyAtkinson(pixels, info.width, info.height, palette);
      break;
    case 'ordered':
      dithered = applyOrdered(pixels, info.width, info.height, palette);
      break;
    default:
      dithered = applyFloydSteinberg(pixels, info.width, info.height, palette);
  }

  // Convert back to RGB for Sharp
  const rgb = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    rgb[i * 3] = dithered[i * 4];
    rgb[i * 3 + 1] = dithered[i * 4 + 1];
    rgb[i * 3 + 2] = dithered[i * 4 + 2];
  }

  // Create output PNG
  return sharp(rgb, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 3,
    },
  })
    .png()
    .toBuffer();
}

