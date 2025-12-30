/**
 * Client-side image processing utilities
 * Runs entirely in the browser for live preview without server round-trips
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ImageAdjustments {
  saturation: number;  // 0-200, 100 = normal
  contrast: number;    // 0-200, 100 = normal
  brightness: number;  // 0-200, 100 = normal
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  saturation: 100,
  contrast: 100,
  brightness: 100,
};

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate color distance in RGB space (squared for performance)
 */
function colorDistanceSquared(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Find the closest palette color
 */
function findClosestColor(color: RGB, palette: RGB[]): RGB {
  let minDist = Infinity;
  let closest = palette[0];
  
  for (const paletteColor of palette) {
    const dist = colorDistanceSquared(color, paletteColor);
    if (dist < minDist) {
      minDist = dist;
      closest = paletteColor;
    }
  }
  
  return closest;
}

/**
 * Apply saturation adjustment to a color
 */
function adjustSaturation(r: number, g: number, b: number, factor: number): [number, number, number] {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return [
    Math.max(0, Math.min(255, gray + factor * (r - gray))),
    Math.max(0, Math.min(255, gray + factor * (g - gray))),
    Math.max(0, Math.min(255, gray + factor * (b - gray))),
  ];
}

/**
 * Apply contrast adjustment to a value
 */
function adjustContrast(value: number, factor: number): number {
  return Math.max(0, Math.min(255, ((value - 128) * factor) + 128));
}

/**
 * Apply brightness adjustment to a value
 */
function adjustBrightness(value: number, factor: number): number {
  return Math.max(0, Math.min(255, value * factor));
}

/**
 * Apply all adjustments to image data (mutates in place for performance)
 */
export function applyAdjustments(
  imageData: ImageData,
  adjustments: ImageAdjustments
): ImageData {
  const data = imageData.data;
  const satFactor = adjustments.saturation / 100;
  const contrastFactor = adjustments.contrast / 100;
  const brightFactor = adjustments.brightness / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Apply saturation
    [r, g, b] = adjustSaturation(r, g, b, satFactor);
    
    // Apply contrast
    r = adjustContrast(r, contrastFactor);
    g = adjustContrast(g, contrastFactor);
    b = adjustContrast(b, contrastFactor);
    
    // Apply brightness
    r = adjustBrightness(r, brightFactor);
    g = adjustBrightness(g, brightFactor);
    b = adjustBrightness(b, brightFactor);
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  
  return imageData;
}

/**
 * Floyd-Steinberg dithering algorithm
 * Converts image to palette colors with error diffusion
 */
export function floydSteinbergDither(
  imageData: ImageData,
  palette: RGB[],
  diffusionStrength: number = 0.85
): ImageData {
  const { width, height, data } = imageData;
  
  // Create a working copy as float array for error accumulation
  const pixels: number[][] = [];
  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[y][x * 3] = data[i];
      pixels[y][x * 3 + 1] = data[i + 1];
      pixels[y][x * 3 + 2] = data[i + 2];
    }
  }
  
  // Floyd-Steinberg error diffusion matrix
  // Current pixel: X
  //     X   7/16
  // 3/16 5/16 1/16
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = x * 3;
      
      // Get current pixel color
      const oldR = Math.max(0, Math.min(255, pixels[y][idx]));
      const oldG = Math.max(0, Math.min(255, pixels[y][idx + 1]));
      const oldB = Math.max(0, Math.min(255, pixels[y][idx + 2]));
      
      // Find closest palette color
      const closest = findClosestColor({ r: oldR, g: oldG, b: oldB }, palette);
      
      // Set pixel to palette color
      pixels[y][idx] = closest.r;
      pixels[y][idx + 1] = closest.g;
      pixels[y][idx + 2] = closest.b;
      
      // Calculate error
      const errR = (oldR - closest.r) * diffusionStrength;
      const errG = (oldG - closest.g) * diffusionStrength;
      const errB = (oldB - closest.b) * diffusionStrength;
      
      // Distribute error to neighboring pixels
      if (x + 1 < width) {
        pixels[y][(x + 1) * 3] += errR * 7 / 16;
        pixels[y][(x + 1) * 3 + 1] += errG * 7 / 16;
        pixels[y][(x + 1) * 3 + 2] += errB * 7 / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          pixels[y + 1][(x - 1) * 3] += errR * 3 / 16;
          pixels[y + 1][(x - 1) * 3 + 1] += errG * 3 / 16;
          pixels[y + 1][(x - 1) * 3 + 2] += errB * 3 / 16;
        }
        pixels[y + 1][x * 3] += errR * 5 / 16;
        pixels[y + 1][x * 3 + 1] += errG * 5 / 16;
        pixels[y + 1][x * 3 + 2] += errB * 5 / 16;
        if (x + 1 < width) {
          pixels[y + 1][(x + 1) * 3] += errR * 1 / 16;
          pixels[y + 1][(x + 1) * 3 + 1] += errG * 1 / 16;
          pixels[y + 1][(x + 1) * 3 + 2] += errB * 1 / 16;
        }
      }
    }
  }
  
  // Write back to ImageData
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = Math.max(0, Math.min(255, Math.round(pixels[y][x * 3])));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(pixels[y][x * 3 + 1])));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(pixels[y][x * 3 + 2])));
    }
  }
  
  return imageData;
}

/**
 * Load an image file and return it as an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image to fit within bounds while maintaining aspect ratio
 */
export function resizeToFit(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  return {
    width: Math.round(img.width * ratio),
    height: Math.round(img.height * ratio),
  };
}

/**
 * Create a canvas with the image drawn at specified size
 */
export function imageToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Process image with adjustments and dithering
 * Returns a canvas with the result
 */
export function processImagePreview(
  sourceCanvas: HTMLCanvasElement,
  palette: RGB[],
  adjustments: ImageAdjustments,
  diffusionStrength: number = 0.85
): HTMLCanvasElement {
  const { width, height } = sourceCanvas;
  
  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d')!;
  
  // Copy source to output
  outputCtx.drawImage(sourceCanvas, 0, 0);
  
  // Get image data
  const imageData = outputCtx.getImageData(0, 0, width, height);
  
  // Apply adjustments
  applyAdjustments(imageData, adjustments);
  
  // Apply dithering
  floydSteinbergDither(imageData, palette, diffusionStrength);
  
  // Put result back
  outputCtx.putImageData(imageData, 0, 0);
  
  return outputCanvas;
}
