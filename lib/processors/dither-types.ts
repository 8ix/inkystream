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
// Photo Category Presets - Community-tested settings for Inky Frame
// Based on real-world testing with Spectra 6 displays
// ============================================================================

export const PHOTO_CATEGORIES = [
  'family',       // Family & People
  'landscape',    // Landscape & Nature
  'architecture', // Architecture & Urban
  'bw',           // Black & White (auto-detect or convert)
  'auto',         // Auto-detect best settings
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

/**
 * Photo category preset with community-tested settings
 */
export interface PhotoCategoryPreset {
  id: PhotoCategory;
  label: string;
  icon: string;
  description: string;
  examples: string;
  // Processing settings
  contrast: number;        // Multiplier (1.0 = normal, 1.2 = +20%)
  gamma: number;           // E-ink gamma correction (1.8-2.2)
  saturation: number;      // Multiplier (1.0 = normal)
  sharpening: { radius: number; amount: number };
  dithering: { algorithm: DitheringAlgorithm; diffusion: number };
  // Category-specific flags
  useBwPalette: boolean;   // Use black/white only palette
  addGradientNoise: boolean; // Add noise to gradients (for skies)
  jpegQuality: number;     // Output quality (70-75)
}

/**
 * Community-tested presets for each photo category
 * Values based on real-world Inky Frame Spectra 6 testing
 */
export const PHOTO_CATEGORY_PRESETS: Record<PhotoCategory, PhotoCategoryPreset> = {
  family: {
    id: 'family',
    label: 'Family & People',
    icon: '👨‍👩‍👧',
    description: 'Optimized for portraits and group photos',
    examples: 'Portraits, group photos, candids, events',
    contrast: 1.18,        // +15-20%
    gamma: 2.0,
    saturation: 1.25,      // +20-30% (lower than landscape - skin tones)
    sharpening: { radius: 0.5, amount: 0.4 },  // Light touch for faces
    dithering: { algorithm: 'floyd-steinberg', diffusion: 0.78 }, // 75-80%
    useBwPalette: false,
    addGradientNoise: false,
    jpegQuality: 70,
  },
  landscape: {
    id: 'landscape',
    label: 'Landscape & Nature',
    icon: '🏔️',
    description: 'Best for scenery and outdoor photos',
    examples: 'Sunsets, mountains, wildlife, gardens, nature',
    contrast: 1.28,        // +25-30%
    gamma: 2.0,
    saturation: 1.75,      // +50-100% (boost for e-ink)
    sharpening: { radius: 0.85, amount: 0.7 },  // Stronger for detail
    dithering: { algorithm: 'floyd-steinberg', diffusion: 0.83 }, // 80-85%
    useBwPalette: false,
    addGradientNoise: true,  // Helps with sky gradients
    jpegQuality: 70,
  },
  architecture: {
    id: 'architecture',
    label: 'Architecture & Urban',
    icon: '🏛️',
    description: 'Sharp lines and geometric details',
    examples: 'Buildings, streets, interiors, cityscapes',
    contrast: 1.32,        // +30-35%
    gamma: 2.0,
    saturation: 1.4,       // +30-50%
    sharpening: { radius: 1.0, amount: 0.9 },  // Aggressive for details
    dithering: { algorithm: 'floyd-steinberg', diffusion: 0.85 },
    useBwPalette: false,
    addGradientNoise: false,
    jpegQuality: 75,       // Higher for architectural detail
  },
  bw: {
    id: 'bw',
    label: 'Black & White',
    icon: '⬛',
    description: 'Monochrome photos or convert to B&W',
    examples: 'B&W portraits, street photography, artistic mono',
    contrast: 1.08,        // +5-10% (preserve artist intent)
    gamma: 2.0,
    saturation: 1.0,       // Not used for B&W
    sharpening: { radius: 0.6, amount: 0.5 },
    dithering: { algorithm: 'floyd-steinberg', diffusion: 0.88 }, // 85-90%
    useBwPalette: true,    // Black and white only
    addGradientNoise: false,
    jpegQuality: 70,
  },
  auto: {
    id: 'auto',
    label: 'Auto',
    icon: '🔄',
    description: 'General-purpose settings',
    examples: 'Mixed content, unsure which category',
    contrast: 1.2,         // +20%
    gamma: 2.0,
    saturation: 1.4,       // +40%
    sharpening: { radius: 0.7, amount: 0.6 },
    dithering: { algorithm: 'floyd-steinberg', diffusion: 0.80 },
    useBwPalette: false,
    addGradientNoise: false,
    jpegQuality: 70,
  },
};

// ============================================================================
// Legacy Image Types - Kept for backward compatibility
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
 * Enhanced image processing options
 * Configured per photo category with community-tested values
 */
export interface EnhancementOptions {
  /** Contrast multiplier (1.0 = normal, 1.2 = +20%) */
  contrast: number;
  /** Gamma correction for e-ink (1.8-2.2, default 2.0) */
  gamma: number;
  /** Saturation multiplier (1.0 = normal) */
  saturation: number;
  /** Sharpening settings */
  sharpening: { radius: number; amount: number };
  /** Dithering settings */
  dithering: { algorithm: DitheringAlgorithm; diffusion: number };
  /** How to fit the image into the frame */
  fitMode: FitMode;
  /** Background color for letterboxing (hex color) */
  backgroundColor: string;
  /** Use black/white only palette */
  useBwPalette: boolean;
  /** Add noise to gradients (helps with skies) */
  addGradientNoise: boolean;
  /** JPEG output quality (70-75) */
  jpegQuality: number;
}

/**
 * Create enhancement options from a photo category preset
 */
export function createEnhancementFromCategory(
  preset: PhotoCategoryPreset,
  fitMode: FitMode = 'smart',
  backgroundColor: string = '#FFFFFF'
): EnhancementOptions {
  return {
    contrast: preset.contrast,
    gamma: preset.gamma,
    saturation: preset.saturation,
    sharpening: preset.sharpening,
    dithering: preset.dithering,
    fitMode,
    backgroundColor,
    useBwPalette: preset.useBwPalette,
    addGradientNoise: preset.addGradientNoise,
    jpegQuality: preset.jpegQuality,
  };
}

/**
 * Create enhancement options from a legacy image type preset
 * @deprecated Use createEnhancementFromCategory instead
 */
export function createEnhancementFromPreset(
  preset: ImageTypePreset,
  fitMode: FitMode = 'smart',
  backgroundColor: string = '#FFFFFF'
): EnhancementOptions {
  return {
    contrast: preset.autoContrast ? 1.2 : 1.0,
    gamma: 2.0,
    saturation: preset.saturation,
    sharpening: preset.sharpen ? { radius: 0.7, amount: 0.6 } : { radius: 0, amount: 0 },
    dithering: { algorithm: preset.algorithm, diffusion: 0.8 },
    fitMode,
    backgroundColor,
    useBwPalette: false,
    addGradientNoise: false,
    jpegQuality: 70,
  };
}

export const DEFAULT_ENHANCEMENT_OPTIONS: EnhancementOptions = {
  contrast: 1.2,
  gamma: 2.0,
  saturation: 1.4,
  sharpening: { radius: 0.7, amount: 0.6 },
  dithering: { algorithm: 'floyd-steinberg', diffusion: 0.8 },
  fitMode: 'smart',
  backgroundColor: '#FFFFFF',
  useBwPalette: false,
  addGradientNoise: false,
  jpegQuality: 70,
};

