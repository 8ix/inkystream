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
  type OKLab,
  type EnhancementOptions,
  type FitMode,
} from './dither-types';

import type { DitheringAlgorithm, RGB, LAB, OKLab, EnhancementOptions, FitMode } from './dither-types';
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
 * Calculate perceptual color distance using CIE76 formula (legacy)
 * Kept for backwards compatibility - use oklabDistance for better results
 */
export function perceptualColorDistance(c1: RGB, c2: RGB): number {
  const lab1 = rgbToLab(c1);
  const lab2 = rgbToLab(c2);
  
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ============================================================================
// OKLab Color Space - Superior perceptual uniformity for e-ink displays
// Reference: Björn Ottosson (2020) - https://bottosson.github.io/posts/oklab/
// ============================================================================

/**
 * Convert sRGB component (0-255) to linear RGB (0-1)
 * Applies gamma decoding (removes sRGB gamma curve)
 */
export function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB component (0-1) to sRGB (0-255)
 * Applies gamma encoding (adds sRGB gamma curve)
 */
export function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

/**
 * Convert linear sRGB to OKLab color space
 * OKLab provides truly perceptually uniform distances - superior to CIELAB
 * @param r Linear red (0-1)
 * @param g Linear green (0-1)
 * @param b Linear blue (0-1)
 */
export function linearSrgbToOklab(r: number, g: number, b: number): OKLab {
  // Convert to LMS cone space
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // Cube root for perceptual uniformity
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // Transform to OKLab
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * Convert RGB (0-255) to OKLab color space
 * Handles sRGB gamma decoding automatically
 */
export function rgbToOklab(rgb: RGB): OKLab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return linearSrgbToOklab(r, g, b);
}

/**
 * Calculate perceptual color distance in OKLab space
 * Uses 1.5× luminance weighting since human vision is ~100× more sensitive
 * to luminance than chrominance - critical for limited e-ink palettes
 * 
 * @param c1 First OKLab color
 * @param c2 Second OKLab color
 * @param luminanceWeight Weight for luminance difference (default 1.5)
 */
export function oklabDistance(c1: OKLab, c2: OKLab, luminanceWeight: number = 1.5): number {
  const dL = (c1.L - c2.L) * luminanceWeight;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Pre-computed OKLab palette for efficient color matching
 * Avoids repeated RGB->OKLab conversions during dithering
 */
export interface OKLabPaletteColor {
  rgb: RGB;
  oklab: OKLab;
  index: number;
}

/**
 * Pre-compute OKLab values for a palette
 * Call once before dithering to avoid repeated conversions
 */
export function precomputePaletteOklab(palette: RGB[]): OKLabPaletteColor[] {
  return palette.map((rgb, index) => ({
    rgb,
    oklab: rgbToOklab(rgb),
    index,
  }));
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
 * Find the nearest color in the palette using OKLab perceptual color matching
 * OKLab provides superior perceptual uniformity compared to CIELAB
 */
export function findNearestColor(color: RGB, palette: RGB[]): RGB {
  const colorOklab = rgbToOklab(color);
  let minDistance = Infinity;
  let nearest = palette[0];

  for (const paletteColor of palette) {
    const paletteOklab = rgbToOklab(paletteColor);
    const distance = oklabDistance(colorOklab, paletteOklab);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = paletteColor;
    }
  }

  return nearest;
}

/**
 * Find nearest color using pre-computed OKLab palette (faster for dithering)
 * Use this in tight loops where palette is static
 */
export function findNearestColorFast(
  colorOklab: OKLab,
  paletteOklab: OKLabPaletteColor[]
): OKLabPaletteColor {
  let minDistance = Infinity;
  let nearest = paletteOklab[0];

  for (const paletteColor of paletteOklab) {
    const distance = oklabDistance(colorOklab, paletteColor.oklab);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = paletteColor;
    }
  }

  return nearest;
}

// ============================================================================
// CLAHE - Contrast Limited Adaptive Histogram Equalization
// Provides superior contrast enhancement for photographs with uneven lighting
// Unlike global histogram equalization, CLAHE operates on tiles and clips
// the histogram to prevent noise amplification - critical before dithering
// ============================================================================

/**
 * Apply CLAHE to the luminance channel of an image
 * This enhances local contrast while preventing noise amplification
 * 
 * @param pixels RGBA pixel data
 * @param width Image width
 * @param height Image height
 * @param clipLimit Contrast limit (2.0-4.0, higher = more contrast)
 * @param tileSize Size of tiles for local histogram (8-16 typical)
 */
export function applyClahe(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  clipLimit: number = 2.5,
  tileSize: number = 8
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  
  // Calculate number of tiles
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);
  
  // Extract luminance channel (using OKLab L for perceptual accuracy)
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    // Simplified luminance calculation (approximate OKLab L)
    luminance[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  // Compute histogram for each tile and build lookup tables
  const numBins = 256;
  const tileLookups: Uint8Array[][] = [];
  
  for (let ty = 0; ty < tilesY; ty++) {
    tileLookups[ty] = [];
    for (let tx = 0; tx < tilesX; tx++) {
      // Calculate tile boundaries
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(x0 + tileSize, width);
      const y1 = Math.min(y0 + tileSize, height);
      const tilePixels = (x1 - x0) * (y1 - y0);
      
      // Build histogram for this tile
      const histogram = new Uint32Array(numBins);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const bin = Math.floor(luminance[y * width + x] * 255);
          histogram[Math.min(bin, 255)]++;
        }
      }
      
      // Clip histogram (redistribute excess)
      const clipThreshold = Math.floor((clipLimit * tilePixels) / numBins);
      let excess = 0;
      for (let i = 0; i < numBins; i++) {
        if (histogram[i] > clipThreshold) {
          excess += histogram[i] - clipThreshold;
          histogram[i] = clipThreshold;
        }
      }
      
      // Redistribute excess uniformly
      const redistribution = Math.floor(excess / numBins);
      const residual = excess - redistribution * numBins;
      for (let i = 0; i < numBins; i++) {
        histogram[i] += redistribution;
        if (i < residual) histogram[i]++;
      }
      
      // Build cumulative distribution function (CDF)
      const cdf = new Uint32Array(numBins);
      cdf[0] = histogram[0];
      for (let i = 1; i < numBins; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }
      
      // Normalize to create lookup table
      const lookup = new Uint8Array(numBins);
      const scale = 255 / (tilePixels || 1);
      for (let i = 0; i < numBins; i++) {
        lookup[i] = Math.round(cdf[i] * scale);
      }
      
      tileLookups[ty][tx] = lookup;
    }
  }
  
  // Apply CLAHE with bilinear interpolation between tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;
      
      // Get luminance bin
      const lum = luminance[idx];
      const bin = Math.min(Math.floor(lum * 255), 255);
      
      // Find tile coordinates
      const tx = x / tileSize;
      const ty = y / tileSize;
      
      // Get integer tile indices
      const tx0 = Math.min(Math.floor(tx - 0.5), tilesX - 1);
      const ty0 = Math.min(Math.floor(ty - 0.5), tilesY - 1);
      const tx1 = Math.min(tx0 + 1, tilesX - 1);
      const ty1 = Math.min(ty0 + 1, tilesY - 1);
      
      // Calculate interpolation weights
      const wx = Math.max(0, Math.min(1, (tx - 0.5) - tx0));
      const wy = Math.max(0, Math.min(1, (ty - 0.5) - ty0));
      
      // Bilinear interpolation of lookup values
      const tx0_safe = Math.max(0, tx0);
      const ty0_safe = Math.max(0, ty0);
      
      const v00 = tileLookups[ty0_safe][tx0_safe][bin];
      const v01 = tileLookups[ty1][tx0_safe][bin];
      const v10 = tileLookups[ty0_safe][tx1][bin];
      const v11 = tileLookups[ty1][tx1][bin];
      
      const newLum = (
        v00 * (1 - wx) * (1 - wy) +
        v10 * wx * (1 - wy) +
        v01 * (1 - wx) * wy +
        v11 * wx * wy
      ) / 255;
      
      // Apply luminance change to RGB while preserving color
      const oldLum = lum || 0.001;
      const ratio = newLum / oldLum;
      
      output[pixelIdx] = clamp(pixels[pixelIdx] * ratio);
      output[pixelIdx + 1] = clamp(pixels[pixelIdx + 1] * ratio);
      output[pixelIdx + 2] = clamp(pixels[pixelIdx + 2] * ratio);
    }
  }
  
  return output;
}

// ============================================================================
// Bilateral Filter - Edge-Preserving Noise Reduction
// Unlike median filter, bilateral filter smooths uniform regions (reducing
// dithering noise in skies) while preserving edges (maintaining sharpness)
// ============================================================================

/**
 * Apply bilateral filter to image for edge-preserving smoothing
 * Combines spatial proximity and intensity similarity for selective blurring
 * 
 * @param pixels RGBA pixel data
 * @param width Image width
 * @param height Image height
 * @param sigmaSpace Spatial sigma (larger = bigger blur area, default 6)
 * @param sigmaRange Range sigma (smaller = preserve more edges, default 0.12)
 * @param radius Filter radius (default: ceil(2 * sigmaSpace))
 */
export function applyBilateralFilter(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  sigmaSpace: number = 6,
  sigmaRange: number = 0.12
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  const radius = Math.ceil(sigmaSpace * 2);
  
  // Pre-compute spatial weights (Gaussian based on distance)
  const spatialWeights: number[][] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    spatialWeights[dy + radius] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      const spatialDist = dx * dx + dy * dy;
      spatialWeights[dy + radius][dx + radius] = 
        Math.exp(-spatialDist / (2 * sigmaSpace * sigmaSpace));
    }
  }
  
  // Convert sigmaRange to 0-255 scale for intensity comparison
  const sigmaRangeScaled = sigmaRange * 255;
  const rangeCoeff = -1 / (2 * sigmaRangeScaled * sigmaRangeScaled);
  
  // Process each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIdx = (y * width + x) * 4;
      
      // Get center pixel luminance for range weighting
      const centerL = (
        pixels[centerIdx] * 0.2126 +
        pixels[centerIdx + 1] * 0.7152 +
        pixels[centerIdx + 2] * 0.0722
      );
      
      let weightSum = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      
      // Sample neighborhood
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          
          const neighborIdx = (ny * width + nx) * 4;
          
          // Get neighbor luminance
          const neighborL = (
            pixels[neighborIdx] * 0.2126 +
            pixels[neighborIdx + 1] * 0.7152 +
            pixels[neighborIdx + 2] * 0.0722
          );
          
          // Calculate range weight (similarity in intensity)
          const rangeDist = (neighborL - centerL) * (neighborL - centerL);
          const rangeWeight = Math.exp(rangeDist * rangeCoeff);
          
          // Combined weight = spatial * range
          const spatialWeight = spatialWeights[dy + radius][dx + radius];
          const weight = spatialWeight * rangeWeight;
          
          weightSum += weight;
          rSum += pixels[neighborIdx] * weight;
          gSum += pixels[neighborIdx + 1] * weight;
          bSum += pixels[neighborIdx + 2] * weight;
        }
      }
      
      // Normalize and set output
      if (weightSum > 0) {
        output[centerIdx] = clamp(rSum / weightSum);
        output[centerIdx + 1] = clamp(gSum / weightSum);
        output[centerIdx + 2] = clamp(bSum / weightSum);
      }
    }
  }
  
  return output;
}

// ============================================================================
// Gamma Correction for E-ink Displays
// E-ink displays typically have gamma ~1.85 vs sRGB's 2.2
// This compensation makes images appear as intended on e-ink
// ============================================================================

/**
 * Apply gamma correction to prepare image for e-ink display
 * E-ink displays are typically darker than standard monitors
 * 
 * @param pixels RGBA pixel data
 * @param width Image width
 * @param height Image height
 * @param displayGamma Target display gamma (1.85 typical for e-ink)
 */
export function applyGammaCorrection(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  displayGamma: number = 1.85
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  
  // sRGB gamma is approximately 2.2
  // We need to adjust from sRGB to target display gamma
  // Correction = (value ^ (sRGB_gamma / display_gamma))
  const correction = 2.2 / displayGamma;
  
  // Build lookup table for efficiency
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const normalized = i / 255;
    const corrected = Math.pow(normalized, correction);
    lut[i] = clamp(corrected * 255);
  }
  
  // Apply to all pixels
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    output[idx] = lut[pixels[idx]];
    output[idx + 1] = lut[pixels[idx + 1]];
    output[idx + 2] = lut[pixels[idx + 2]];
  }
  
  return output;
}

/**
 * Clamp a value to the 0-255 range
 */
export function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Apply Floyd-Steinberg dithering to raw pixel data
 * Uses serpentine scanning and OKLab color matching for better results
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
  
  // Pre-compute OKLab palette for faster matching
  const paletteOklab = precomputePaletteOklab(palette);

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
      const oldOklab = rgbToOklab(oldColor);

      // Find nearest palette color using OKLab
      const nearest = findNearestColorFast(oldOklab, paletteOklab);
      const newColor = nearest.rgb;

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
 * Apply Stucki dithering to raw pixel data
 * Uses larger kernel than Floyd-Steinberg for smoother gradients in photos
 * Provides near Jarvis-Judice-Ninke quality with better performance
 * Uses serpentine scanning for artifact-free results
 * 
 * Error diffusion pattern (divisor 42):
 *           X   8   4
 *     2   4   8   4   2
 *     1   2   4   2   1
 */
export function applyStucki(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(pixels);
  
  // Pre-compute OKLab palette for faster matching
  const paletteOklab = precomputePaletteOklab(palette);

  for (let y = 0; y < height; y++) {
    // Serpentine scanning: alternate direction each row to eliminate worm artifacts
    const leftToRight = y % 2 === 0;
    
    const startX = leftToRight ? 0 : width - 1;
    const endX = leftToRight ? width : -1;
    const stepX = leftToRight ? 1 : -1;

    for (let x = startX; x !== endX; x += stepX) {
      const idx = (y * width + x) * 4;

      // Get current pixel color and convert to OKLab
      const oldColor: RGB = {
        r: output[idx],
        g: output[idx + 1],
        b: output[idx + 2],
      };
      const oldOklab = rgbToOklab(oldColor);

      // Find nearest palette color using OKLab distance
      const nearest = findNearestColorFast(oldOklab, paletteOklab);
      const newColor = nearest.rgb;

      // Set new color
      output[idx] = newColor.r;
      output[idx + 1] = newColor.g;
      output[idx + 2] = newColor.b;

      // Calculate error
      const errR = oldColor.r - newColor.r;
      const errG = oldColor.g - newColor.g;
      const errB = oldColor.b - newColor.b;

      // Direction-aware error distribution for serpentine scanning
      const forward = stepX; // +1 for left-to-right, -1 for right-to-left
      
      // Helper to distribute error to a pixel
      const diffuse = (dx: number, dy: number, weight: number) => {
        const nx = x + dx * forward;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny < height) {
          const i = (ny * width + nx) * 4;
          output[i] = clamp(output[i] + errR * weight);
          output[i + 1] = clamp(output[i + 1] + errG * weight);
          output[i + 2] = clamp(output[i + 2] + errB * weight);
        }
      };

      // Stucki kernel (divisor 42):
      // Row 0 (current row):     *  8/42  4/42
      diffuse(1, 0, 8 / 42);
      diffuse(2, 0, 4 / 42);
      
      // Row 1: 2/42  4/42  8/42  4/42  2/42
      diffuse(-2, 1, 2 / 42);
      diffuse(-1, 1, 4 / 42);
      diffuse(0, 1, 8 / 42);
      diffuse(1, 1, 4 / 42);
      diffuse(2, 1, 2 / 42);
      
      // Row 2: 1/42  2/42  4/42  2/42  1/42
      diffuse(-2, 2, 1 / 42);
      diffuse(-1, 2, 2 / 42);
      diffuse(0, 2, 4 / 42);
      diffuse(1, 2, 2 / 42);
      diffuse(2, 2, 1 / 42);
    }
  }

  return output;
}

/**
 * Apply Atkinson dithering to raw pixel data
 * Uses serpentine scanning for artifact-free results
 * Atkinson only distributes 6/8 (75%) of the error for high contrast
 * 
 * Error diffusion pattern:
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
  
  // Pre-compute OKLab palette for faster matching
  const paletteOklab = precomputePaletteOklab(palette);

  for (let y = 0; y < height; y++) {
    // Serpentine scanning: alternate direction each row to eliminate worm artifacts
    const leftToRight = y % 2 === 0;
    
    const startX = leftToRight ? 0 : width - 1;
    const endX = leftToRight ? width : -1;
    const stepX = leftToRight ? 1 : -1;

    for (let x = startX; x !== endX; x += stepX) {
      const idx = (y * width + x) * 4;

      const oldColor: RGB = {
        r: output[idx],
        g: output[idx + 1],
        b: output[idx + 2],
      };
      const oldOklab = rgbToOklab(oldColor);

      // Find nearest palette color using OKLab
      const nearest = findNearestColorFast(oldOklab, paletteOklab);
      const newColor = nearest.rgb;

      output[idx] = newColor.r;
      output[idx + 1] = newColor.g;
      output[idx + 2] = newColor.b;

      // Atkinson only distributes 6/8 of the error (3/4)
      const errR = (oldColor.r - newColor.r) / 8;
      const errG = (oldColor.g - newColor.g) / 8;
      const errB = (oldColor.b - newColor.b) / 8;

      // Direction-aware error distribution for serpentine scanning
      const forward = stepX;
      
      const distribute = (dx: number, dy: number) => {
        const nx = x + dx * forward;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const i = (ny * width + nx) * 4;
          output[i] = clamp(output[i] + errR);
          output[i + 1] = clamp(output[i + 1] + errG);
          output[i + 2] = clamp(output[i + 2] + errB);
        }
      };

      // Forward (right in normal scan)
      distribute(1, 0);
      // Forward+1 (right+1 in normal scan)
      distribute(2, 0);

      // Next row: backward, center, forward
      distribute(-1, 1);
      distribute(0, 1);
      distribute(1, 1);

      // Two rows down, center
      distribute(0, 2);
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
 * Implements the research-backed preprocessing pipeline:
 * 1. Resize with smart fitting
 * 2. CLAHE for adaptive contrast (better than normalize)
 * 3. Saturation boost (1.4× for e-ink)
 * 4. Bilateral filter (edge-preserving smoothing)
 * 5. Sharpening (compensate for smoothing)
 * 6. Gamma correction (1.85 for e-ink)
 * 7. Dithering (Stucki default, OKLab color matching)
 */
export async function processWithDithering(
  inputBuffer: Buffer,
  width: number,
  height: number,
  palette: RGB[],
  algorithm: DitheringAlgorithm = 'stucki',
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

  // Apply basic contrast enhancement via Sharp if CLAHE is disabled
  // (CLAHE will be applied later in pixel processing for better control)
  if (enhancement.autoContrast && !enhancement.useClahe) {
    pipeline = pipeline.normalize();
  }

  // Boost saturation - e-ink displays mute colors significantly
  // Research recommends 1.4× boost for limited palette displays
  if (enhancement.saturation !== 1.0) {
    pipeline = pipeline.modulate({
      saturation: enhancement.saturation,
    });
  }

  // Apply median filter for basic denoising if bilateral is disabled
  // (Bilateral will be applied later in pixel processing for edge preservation)
  if (enhancement.denoise && !enhancement.useBilateral) {
    pipeline = pipeline.median(3);
  }

  // Sharpen to restore edges lost from smoothing and resize
  // Applied before pixel processing to benefit from Sharp's quality
  if (enhancement.sharpen) {
    pipeline = pipeline.sharpen({
      sigma: 0.8,
      m1: 1.2,  // Increased for better edge definition
      m2: 0.7,
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

  // ============================================
  // Advanced preprocessing pipeline (pixel-level)
  // Research indicates preprocessing is 60% of quality
  // ============================================

  // 1. Apply CLAHE for superior local contrast enhancement
  // Better than global normalize for photos with uneven lighting
  if (enhancement.useClahe) {
    pixels = applyClahe(
      pixels,
      info.width,
      info.height,
      enhancement.claheClipLimit ?? 2.5,
      enhancement.claheTileSize ?? 8
    );
  }

  // 2. Apply bilateral filter for edge-preserving smoothing
  // Smooths gradients (reducing dithering noise in skies) while keeping edges sharp
  if (enhancement.useBilateral && enhancement.denoise) {
    pixels = applyBilateralFilter(
      pixels,
      info.width,
      info.height,
      enhancement.bilateralSigmaSpace ?? 6,
      enhancement.bilateralSigmaRange ?? 0.12
    );
  }

  // 3. For contain/letterbox mode, add subtle noise to help dithering create patterns
  // on solid color regions (like letterbox bars) so they match the e-ink aesthetic
  if (fit === 'contain') {
    pixels = addNoiseToSolidRegions(pixels, info.width, info.height, 6);
  }

  // 4. Apply gamma correction for e-ink display characteristics
  // E-ink displays are typically darker (gamma ~1.85 vs sRGB 2.2)
  if (enhancement.displayGamma && enhancement.displayGamma !== 2.2) {
    pixels = applyGammaCorrection(
      pixels,
      info.width,
      info.height,
      enhancement.displayGamma
    );
  }

  // ============================================
  // Apply dithering algorithm with OKLab color matching
  // ============================================
  let dithered: Uint8ClampedArray;
  switch (algorithm) {
    case 'stucki':
      // Recommended for photographs - smoothest gradients
      dithered = applyStucki(pixels, info.width, info.height, palette);
      break;
    case 'floyd-steinberg':
      dithered = applyFloydSteinberg(pixels, info.width, info.height, palette);
      break;
    case 'atkinson':
      // High contrast, punchy look - good for graphics
      dithered = applyAtkinson(pixels, info.width, info.height, palette);
      break;
    case 'ordered':
      // Fastest, but shows visible patterns
      dithered = applyOrdered(pixels, info.width, info.height, palette);
      break;
    default:
      dithered = applyStucki(pixels, info.width, info.height, palette);
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

