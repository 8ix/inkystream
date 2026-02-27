/**
 * Type definitions for processed images
 */

export interface ProcessedImage {
  /** Unique identifier for the image */
  id: string;
  /** Original filename */
  originalFilename: string;
  /** Category ID this image belongs to */
  categoryId: string;
  /** Timestamp when the image was processed */
  processedAt: string;
  /** Map of display ID to processed image filename */
  variants: Record<string, string>;
  /** Thumbnail filename */
  thumbnail: string;
}

export interface ImageVariant {
  /** Device ID this variant was created for */
  deviceId: string;
  /** Display type used for this device */
  displayId: string;
  /** Filename of the processed image */
  filename: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

export interface ImageMetadata {
  /** Image ID */
  id: string;
  /** Original filename */
  originalFilename: string;
  /** Category ID */
  categoryId: string;
  /** When the image was processed */
  processedAt: string;
  /** Available device variants */
  variants: ImageVariant[];
}
