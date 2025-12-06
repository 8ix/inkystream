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

// ============================================================================
// Image Type Presets - Simplified user selection
// Users pick what they're uploading, we auto-select the best settings
// ============================================================================

export const IMAGE_TYPES = [
  'photograph',
  'artwork', 
  'graphics',
  'screenshot',
] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

export interface ImageTypePreset {
  id: ImageType;
  label: string;
  icon: string;
  description: string;
  examples: string;
  algorithm: DitheringAlgorithm;
  saturation: number;
  autoContrast: boolean;
  denoise: boolean;
  sharpen: boolean;
}

export const IMAGE_TYPE_PRESETS: Record<ImageType, ImageTypePreset> = {
  photograph: {
    id: 'photograph',
    label: 'Photograph',
    icon: '📷',
    description: 'Best for photos - smooth gradients, natural colors',
    examples: 'Family photos, landscapes, portraits, nature',
    algorithm: 'stucki',
    saturation: 1.3,
    autoContrast: true,
    denoise: true,
    sharpen: true,
  },
  artwork: {
    id: 'artwork',
    label: 'Artwork',
    icon: '🎨',
    description: 'Preserves artistic details and textures',
    examples: 'Paintings, illustrations, drawings, digital art',
    algorithm: 'floyd-steinberg',
    saturation: 1.2,
    autoContrast: true,
    denoise: false,
    sharpen: true,
  },
  graphics: {
    id: 'graphics',
    label: 'Graphics',
    icon: '✏️',
    description: 'Sharp edges for clean, crisp output',
    examples: 'Logos, icons, text, posters, infographics',
    algorithm: 'ordered',
    saturation: 1.0,
    autoContrast: false,
    denoise: false,
    sharpen: false,
  },
  screenshot: {
    id: 'screenshot',
    label: 'Screenshot',
    icon: '🖥️',
    description: 'High contrast for readable UI elements',
    examples: 'UI mockups, diagrams, charts, documents',
    algorithm: 'atkinson',
    saturation: 1.0,
    autoContrast: true,
    denoise: false,
    sharpen: true,
  },
};

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
 * These are now auto-configured based on ImageType selection
 */
export interface EnhancementOptions {
  /** Auto-adjust contrast and levels */
  autoContrast: boolean;
  /** Saturation multiplier (1.0 = normal) */
  saturation: number;
  /** Apply noise reduction to reduce speckling */
  denoise: boolean;
  /** Apply sharpening after resize */
  sharpen: boolean;
  /** How to fit the image into the frame */
  fitMode: FitMode;
  /** Background color for letterboxing (hex color) */
  backgroundColor: string;
}

/**
 * Create enhancement options from an image type preset
 */
export function createEnhancementFromPreset(
  preset: ImageTypePreset,
  fitMode: FitMode = 'smart',
  backgroundColor: string = '#FFFFFF'
): EnhancementOptions {
  return {
    autoContrast: preset.autoContrast,
    saturation: preset.saturation,
    denoise: preset.denoise,
    sharpen: preset.sharpen,
    fitMode,
    backgroundColor,
  };
}

export const DEFAULT_ENHANCEMENT_OPTIONS: EnhancementOptions = {
  autoContrast: true,
  saturation: 1.3,
  denoise: true,
  sharpen: true,
  fitMode: 'smart',
  backgroundColor: '#FFFFFF',
};

