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


