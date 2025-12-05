/**
 * Image processing utilities for InkyStream
 * Handles image upload, processing, and storage
 * 
 * SECURITY: Images are stored in a private directory (not public/)
 * and served through an authenticated API endpoint.
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import type { ImageMetadata, ImageVariant } from '@/lib/types/image';
import { processWithDithering, DEFAULT_ENHANCEMENT_OPTIONS, type DitheringAlgorithm, type RGB, type EnhancementOptions } from '@/lib/processors/dither';
import { getDisplayProfile, hexToRgb } from '@/lib/displays/profiles';
import { getDevice } from '@/lib/utils/devices';
import { extractApiKey } from '@/lib/utils/auth';

// PRIVATE images directory - not in public/, served through API
const IMAGES_DIR = path.join(process.cwd(), 'images');
const THUMBNAIL_SIZE = 200;

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Get the file system path to an image
 */
export function getImagePath(
  categoryId: string,
  imageId: string,
  filename: string
): string {
  return path.join(IMAGES_DIR, categoryId, imageId, filename);
}

/**
 * Process an image for a specific display type
 */
export async function processImage(
  inputBuffer: Buffer,
  outputPath: string,
  options: {
    width: number;
    height: number;
    dithering?: DitheringAlgorithm;
    palette?: string[];
    enhancement?: EnhancementOptions;
  }
): Promise<void> {
  const { 
    width, 
    height, 
    dithering = 'floyd-steinberg', 
    palette,
    enhancement = DEFAULT_ENHANCEMENT_OPTIONS,
  } = options;

  let outputBuffer: Buffer;

  if (palette && palette.length > 0) {
    // Apply dithering with palette and enhancement
    const rgbPalette: RGB[] = palette.map((hex) => hexToRgb(hex));
    outputBuffer = await processWithDithering(
      inputBuffer,
      width,
      height,
      rgbPalette,
      dithering,
      enhancement
    );
  } else {
    // Simple resize without dithering
    outputBuffer = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toBuffer();
  }

  // Ensure output directory exists
  await ensureDir(path.dirname(outputPath));

  // Write output file
  await fs.writeFile(outputPath, outputBuffer);
}

/**
 * Generate a thumbnail for an image
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  outputPath: string,
  size: number = THUMBNAIL_SIZE
): Promise<void> {
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .png()
    .toBuffer();

  await ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, thumbnailBuffer);
}

/**
 * Process an uploaded image for all specified devices
 */
export async function processUploadedImage(
  inputBuffer: Buffer,
  originalFilename: string,
  categoryId: string,
  deviceIds: string[],
  dithering: DitheringAlgorithm = 'floyd-steinberg',
  enhancement: EnhancementOptions = DEFAULT_ENHANCEMENT_OPTIONS
): Promise<ImageMetadata> {
  const imageId = uuidv4();
  const imageDir = path.join(IMAGES_DIR, categoryId, imageId);

  // Ensure image directory exists
  await ensureDir(imageDir);

  // Generate thumbnail
  const thumbnailPath = path.join(imageDir, 'thumbnail.png');
  await generateThumbnail(inputBuffer, thumbnailPath);

  // Process for each device
  const variants: ImageVariant[] = [];

  for (const deviceId of deviceIds) {
    // Get the device and its display profile
    const device = await getDevice(deviceId);
    if (!device) {
      console.warn(`Device not found: ${deviceId}`);
      continue;
    }

    const display = await getDisplayProfile(device.displayId);
    if (!display) {
      console.warn(`Display profile not found: ${device.displayId}`);
      continue;
    }

    // Store as {deviceId}.png
    const outputFilename = `${deviceId}.png`;
    const outputPath = path.join(imageDir, outputFilename);

    await processImage(inputBuffer, outputPath, {
      width: display.width,
      height: display.height,
      dithering,
      palette: display.palette,
      enhancement,
    });

    variants.push({
      deviceId,
      displayId: device.displayId,
      filename: outputFilename,
      width: display.width,
      height: display.height,
    });
  }

  // Create metadata
  const metadata: ImageMetadata = {
    id: imageId,
    originalFilename,
    categoryId,
    processedAt: new Date().toISOString(),
    variants,
  };

  // Save metadata
  const metadataPath = path.join(imageDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  return metadata;
}

/**
 * Get all processed images in a category
 */
export async function getCategoryImages(
  categoryId: string
): Promise<ImageMetadata[]> {
  const categoryDir = path.join(IMAGES_DIR, categoryId);

  try {
    const entries = await fs.readdir(categoryDir, { withFileTypes: true });
    const images: ImageMetadata[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const metadataPath = path.join(
            categoryDir,
            entry.name,
            'metadata.json'
          );
          const content = await fs.readFile(metadataPath, 'utf-8');
          images.push(JSON.parse(content));
        } catch {
          // Skip if metadata doesn't exist
        }
      }
    }

    // Sort by processed date (newest first)
    return images.sort(
      (a, b) =>
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Get all processed images across all categories
 */
export async function getAllImages(): Promise<ImageMetadata[]> {
  try {
    const entries = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
    const allImages: ImageMetadata[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== '.gitkeep') {
        const categoryImages = await getCategoryImages(entry.name);
        allImages.push(...categoryImages);
      }
    }

    // Sort by processed date (newest first)
    return allImages.sort(
      (a, b) =>
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Get all images that have a variant for a specific device
 */
export async function getImagesForDevice(
  deviceId: string
): Promise<ImageMetadata[]> {
  const allImages = await getAllImages();
  return allImages.filter((image) =>
    image.variants.some((v) => v.deviceId === deviceId)
  );
}

/**
 * Get a specific image by ID
 */
export async function getImage(
  categoryId: string,
  imageId: string
): Promise<ImageMetadata | null> {
  const metadataPath = path.join(
    IMAGES_DIR,
    categoryId,
    imageId,
    'metadata.json'
  );

  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Delete an image and all its variants
 */
export async function deleteImage(
  categoryId: string,
  imageId: string
): Promise<boolean> {
  const imageDir = path.join(IMAGES_DIR, categoryId, imageId);

  try {
    await fs.rm(imageDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the URL path for an image variant by device
 * Returns an API URL that includes the API key for authentication
 * 
 * @param categoryId - The category the image belongs to
 * @param imageId - The unique image ID
 * @param deviceId - The device ID for this variant
 * @param request - Optional request to extract API key from (for passing key through)
 */
export function getImageUrlForDevice(
  categoryId: string,
  imageId: string,
  deviceId: string,
  request?: NextRequest
): string {
  const basePath = `/api/img/${categoryId}/${imageId}/${deviceId}.png`;
  
  // If we have a request, extract the API key and include it in the URL
  if (request) {
    const apiKey = extractApiKey(request);
    if (apiKey) {
      return `${basePath}?key=${encodeURIComponent(apiKey)}`;
    }
  }
  
  return basePath;
}

/**
 * Get the URL path for an image thumbnail
 * Returns an API URL for the authenticated image serving endpoint
 */
export function getThumbnailUrl(
  categoryId: string, 
  imageId: string,
  request?: NextRequest
): string {
  const basePath = `/api/img/${categoryId}/${imageId}/thumbnail.png`;
  
  if (request) {
    const apiKey = extractApiKey(request);
    if (apiKey) {
      return `${basePath}?key=${encodeURIComponent(apiKey)}`;
    }
  }
  
  return basePath;
}

/**
 * Read an image file from the private storage
 */
export async function readImageFile(
  categoryId: string,
  imageId: string,
  filename: string
): Promise<Buffer | null> {
  const filePath = getImagePath(categoryId, imageId, filename);
  
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

/**
 * Check if an image file exists
 */
export async function imageFileExists(
  categoryId: string,
  imageId: string,
  filename: string
): Promise<boolean> {
  const filePath = getImagePath(categoryId, imageId, filename);
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
