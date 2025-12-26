# Image Processing Pipeline

This document details how InkyStream processes images for e-ink displays.

## Overview

The image processing pipeline transforms standard photos into optimized images for e-ink displays. This involves resizing, color palette reduction, and dithering.

## Pipeline Stages

### 1. Image Upload

**Input**: JPEG, PNG, or WebP image
**Location**: Temporary upload directory (not tracked in git)

```typescript
// Files accepted
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
```

### 2. Resize

**Purpose**: Scale image to display dimensions while preserving aspect ratio

**Algorithm**:
1. Calculate target dimensions from display profile
2. Resize using Sharp's `resize` with `cover` fit
3. Center the image and crop excess

```typescript
import sharp from 'sharp';

async function resizeForDisplay(
  inputBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();
}
```

### 3. Color Palette Reduction

**Purpose**: Reduce colors to match e-ink display capabilities

E-ink displays have limited color palettes:
- **Monochrome**: Black, White
- **3-Color**: Black, White, Red/Yellow
- **7-Color (Spectra)**: Black, White, Green, Blue, Red, Yellow, Orange

```typescript
// Example palette for Inky Frame 7 Spectra
const SPECTRA_PALETTE = [
  '#000000', // Black
  '#FFFFFF', // White
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FF0000', // Red
  '#FFFF00', // Yellow
  '#FFA500', // Orange
];
```

### 4. Dithering

**Purpose**: Simulate colors/gradients using limited palette

#### Floyd-Steinberg Dithering (Default)

Error-diffusion algorithm that distributes quantization error to neighboring pixels:

```
        X   7/16
  3/16  5/16  1/16
```

Best for: Most images, photographs, gradients

#### Ordered Dithering (Bayer)

Uses a threshold matrix for deterministic patterns:

```
1/17 *  | 1  9  3 11 |
        | 13 5 15  7 |
        | 4 12  2 10 |
        | 16 8 14  6 |
```

Best for: Illustrations, text, sharp edges

#### Atkinson Dithering

Modified error-diffusion with less error spread:

```
      X   1/8  1/8
  1/8  1/8  1/8
       1/8
```

Best for: High contrast images, black and white art

### 5. Output Generation

**Output Files**:
```
public/images/[category]/[image_id]/
├── inky_frame_7_spectra.png    # Display-specific variant
├── inky_frame_7_colour.png     # Another variant
├── thumbnail.png               # 200x200 preview
└── metadata.json               # Image metadata
```

**Metadata Format**:
```json
{
  "id": "abc123",
  "originalFilename": "beach_sunset.jpg",
  "categoryId": "landscapes",
  "processedAt": "2024-01-15T10:30:00Z",
  "variants": [
    {
      "displayId": "inky_frame_7_spectra",
      "filename": "inky_frame_7_spectra.png",
      "width": 800,
      "height": 480
    }
  ]
}
```

## Code Structure

### Key Files

- `lib/processors/dither.ts` - Dithering algorithms
- `lib/utils/image.ts` - Image processing utilities
- `lib/displays/profiles.ts` - Display profile loader
- `config/displays.json` - Display configurations

### Processing Function

```typescript
import sharp from 'sharp';
import { applyDithering } from '@/lib/processors/dither';
import { getDisplayProfile } from '@/lib/displays/profiles';

export async function processImage(
  inputBuffer: Buffer,
  categoryId: string,
  displayId: string
): Promise<{
  imageBuffer: Buffer;
  metadata: ImageMetadata;
}> {
  const display = await getDisplayProfile(displayId);
  
  // 1. Resize
  let processed = await sharp(inputBuffer)
    .resize(display.width, display.height, { fit: 'cover' })
    .toBuffer();
  
  // 2. Apply dithering
  processed = await applyDithering(
    processed,
    display.palette,
    display.defaultDithering
  );
  
  // 3. Convert to PNG
  const output = await sharp(processed)
    .png()
    .toBuffer();
  
  return {
    imageBuffer: output,
    metadata: { /* ... */ }
  };
}
```

## Performance Considerations

### Processing Time

Target: < 2 seconds per image

Optimizations:
- Use Sharp's native bindings (written in C++)
- Process images in parallel when batch uploading
- Cache display profiles in memory

### Memory Usage

- Large images may require significant memory
- Sharp automatically handles streaming for large files
- Consider limiting concurrent processing operations

## Extending the Pipeline

### Adding New Dithering Algorithms

See [Extending Processors](../development/extending-processors.md)

### Supporting New Display Types

See [Adding Displays](../development/adding-displays.md)

## Troubleshooting

### Common Issues

**Images appear washed out**
- Increase contrast before processing
- Try a different dithering algorithm

**Banding in gradients**
- Use Floyd-Steinberg dithering
- Increase source image quality

**Processing fails silently**
- Check Sharp installation
- Verify image format is supported
- Check available disk space





