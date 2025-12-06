/**
 * Dithering types and constants - safe to import in client components
 */

export const DITHERING_ALGORITHMS = [
  'stucki',
  'floyd-steinberg',
  'atkinson',
  'ordered',
] as const;

export type DitheringAlgorithm = (typeof DITHERING_ALGORITHMS)[number];

/**
 * Image fit modes for how the source image fits the target frame
 */
export const FIT_MODES = [
  'smart',
  'fill',
  'contain',
] as const;

export type FitMode = (typeof FIT_MODES)[number];

export const FIT_MODE_OPTIONS: { value: FitMode; label: string; description: string }[] = [
  { 
    value: 'smart', 
    label: 'Smart Fit', 
    description: 'Auto-rotates and intelligently fits image to maximize coverage' 
  },
  { 
    value: 'fill', 
    label: 'Fill (Crop)', 
    description: 'Fills the frame, cropping edges if needed' 
  },
  { 
    value: 'contain', 
    label: 'Contain (Letterbox)', 
    description: 'Shows entire image with bars on edges' 
  },
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LAB {
  L: number;
  a: number;
  b: number;
}

/**
 * OKLab color space - perceptually uniform, better than CIELAB
 * L: Lightness (0-1), a: green-red axis, b: blue-yellow axis
 */
export interface OKLab {
  L: number;
  a: number;
  b: number;
}

/**
 * Image enhancement options for pre-processing before dithering
 */
export interface EnhancementOptions {
  /** Auto-adjust contrast and levels (basic normalize) */
  autoContrast: boolean;
  /** Use CLAHE instead of basic normalize (better for uneven lighting) */
  useClahe: boolean;
  /** CLAHE clip limit (2.0-4.0, higher = more contrast, default 2.5) */
  claheClipLimit: number;
  /** CLAHE tile size (4-16, smaller = more local contrast, default 8) */
  claheTileSize: number;
  /** Saturation multiplier (1.0 = normal, 1.4 = 40% boost for e-ink) */
  saturation: number;
  /** Apply noise reduction to reduce speckling */
  denoise: boolean;
  /** Use bilateral filter instead of median (preserves edges better) */
  useBilateral: boolean;
  /** Bilateral filter sigma for spatial distance (default 6) */
  bilateralSigmaSpace: number;
  /** Bilateral filter sigma for color range (default 0.12) */
  bilateralSigmaRange: number;
  /** Apply sharpening after resize */
  sharpen: boolean;
  /** How to fit the image into the frame */
  fitMode: FitMode;
  /** Background color for letterboxing (hex color) */
  backgroundColor: string;
  /** E-ink display gamma correction (1.85 typical, 2.2 = none) */
  displayGamma: number;
}

export const DEFAULT_ENHANCEMENT_OPTIONS: EnhancementOptions = {
  autoContrast: true,
  useClahe: true,
  claheClipLimit: 2.5,
  claheTileSize: 8,
  saturation: 1.4,  // Increased from 1.2 - e-ink mutes colors significantly
  denoise: true,
  useBilateral: true,
  bilateralSigmaSpace: 6,
  bilateralSigmaRange: 0.12,
  sharpen: true,
  fitMode: 'smart',
  backgroundColor: '#FFFFFF',
  displayGamma: 1.85,  // E-ink displays are typically darker than sRGB (2.2)
};

